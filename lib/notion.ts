import fetch, { Response } from "node-fetch"
import { AccessRequest, AccessResponse } from "../pages/api/notion"
import { UserNotionAccessToken } from "./models"
import { routes } from "./routes"
import { die } from "./utils"

const NOTION_API_BASE_URL = "https://api.notion.com/v1"
const NOTION_OAUTH_CLIENT_ID =
	process.env.NEXT_PUBLIC_NOTION_OAUTH_CLIENT_ID ||
	die("No Notion oauth client ID configured")
const NOTION_OAUTH_CLIENT_SECRET = process.env.NOTION_OAUTH_CLIENT_SECRET
// export const OAUTH_REDIRECT_URI = "https://www.notrition.info/authorize"
export const OAUTH_REDIRECT_URI = "http://localhost:3000/authorize"

export interface NotionApiRequest {
	method: string
	path: string
	headers?: { [key: string]: string }
	body?: object
}

export function parseNotionJson(json: any): any {
	if (json.object === "error") {
		const error = new Error(json.message)
		Object.assign(error, json)
		throw error
	}

	return json
}

export interface NotionObject<ObjectType extends string> {
	object: ObjectType
	[key: string]: unknown
}

export interface NotionList<T = any> extends NotionObject<"list"> {
	results: T[]
	next_cursor: string | null
	has_more: boolean
}

export interface NotionError extends NotionObject<"error"> {
	code: string
	message: string
}

export type NotionText = NotionTextToken[]

export interface NotionTextToken {
	type: string
	text: {
		content: string
		link: string | null
	}
	annotations: {
		[kind: string]: boolean
	}
	plain_text: string
	href: string | null
}

export function getPlainText(text: NotionText): string {
	return text.map(it => it.plain_text).join("")
}

export interface NotionProperty {
	id: string
	type: string
	text?: NotionText
	select?: {
		id: string
		name: string
		color: string
	}
	title?: NotionText
}

export interface NotionBlockBase extends NotionObject<"block"> {
	id: string
	created_time: string
	last_edited_time: string
	has_children: boolean
}

interface TodoBlock extends NotionBlockBase {
	type: "to_do"
	to_do: {
		text: NotionText
		checked: boolean
	}
}

interface Paragraph extends NotionBlockBase {
	type: "paragraph"
	paragraph: {
		text: NotionText
	}
}

interface BulletedList extends NotionBlockBase {
	type: "bulleted_list_item"
	bulleted_list_item: {
		text: NotionText
	}
}

export type NotionBlock = TodoBlock | Paragraph | BulletedList

export interface NotionDatabase extends NotionObject<"database"> {
	id: string
	title: NotionText
	properties: {
		[key: string]: NotionProperty
	}
}

export interface NotionPage extends NotionObject<"page"> {
	id: string
	archived: boolean
	created_time: string
	last_edited_time: string
	parent: {
		type: string
		database_id?: string
	}
	properties?: {
		[key: string]: NotionProperty
	}
}

function isNotionError(
	obj: NotionObject<string> | NotionError
): obj is NotionError {
	return obj.object === "error"
}

function assertIsObjectType<OT extends string>(
	type: OT,
	object: NotionObject<string>
): asserts object is NotionObject<OT> {
	if (object.object !== type) {
		const error = new TypeError(
			`Expected object:${type}, but got ${object.object} in ${JSON.stringify(
				object
			).slice(0, 30)}...`
		)
		Object.assign(error, object)
		throw error
	}
}

export class NotionApiResponse {
	constructor(public httpResponse: Response) {}

	async asObject<OT extends string, T extends NotionObject<OT>>(
		object: OT
	): Promise<T> {
		const json: NotionObject<string> = await this.httpResponse.json()

		if (isNotionError(json)) {
			const error = new Error(json.message)
			Object.assign(error, json)
			error.name = `NotionApiError[${json.code}]`
			throw error
		}

		assertIsObjectType(object, json)

		return json as T
	}

	async asList<T>(): Promise<NotionList<T>> {
		return this.asObject("list") as any
	}

	async asListOf<OT extends string, T extends NotionObject<OT>>(
		object: string
	): Promise<NotionList<T>> {
		const list = await this.asList<T>()
		if (list.results.length === 0) {
			return list
		}

		const firstResult = list.results[0]
		assertIsObjectType(object, firstResult)
		return list
	}
}

type SortDirection = "ascending" | "descending"
type Sort =
	| { property: string; direction: SortDirection }
	| { timestamp: "created_time" | "last_edited_time"; direction: SortDirection }

export interface NotionOauthToken {
	access_token: string
	workspace_name: string
	workspace_icon: string
	bot_id: string
}

async function performProxiedRequest(args: AccessRequest) {
	const res = await fetch("/api/notion", {
		method: "post",
		body: JSON.stringify(args),
	})
	return new NotionApiResponse(res)
}

async function performServerSideRequest(args: {
	notionApiToken: string
	request: NotionApiRequest
}) {
	const { notionApiToken, request } = args
	const res = await fetch(`${NOTION_API_BASE_URL}${request.path}`, {
		method: request.method,
		body: request.body ? JSON.stringify(request.body) : undefined,
		headers: {
			Authorization: `Bearer ${notionApiToken}`,
			...request.headers,
		},
	})
	return new NotionApiResponse(res)
}

interface PerformNotionRequestFn {
	(request: NotionApiRequest): Promise<NotionApiResponse>
}

export class NotionApiClient {
	constructor(public performRequest: PerformNotionRequestFn) {}

	static withServerApiToken(notionApiToken: string) {
		return new this(request => {
			return performServerSideRequest({
				notionApiToken,
				request,
			})
		})
	}

	static withBrowserToken(token: UserNotionAccessToken) {
		return new this(request => {
			return performProxiedRequest({
				notionAccessTokenId: token.id,
				notionApiRequest: request,
			})
		})
	}

	static getOathUrl(): string {
		const url = new URL(`${NOTION_API_BASE_URL}/oauth/authorize`)
		url.searchParams.append("client_id", NOTION_OAUTH_CLIENT_ID)
		// TODO
		url.searchParams.append("redirect_uri", OAUTH_REDIRECT_URI)
		url.searchParams.append("response_type", "code")
		return url.toString()
	}

	static async createToken(args: {
		code: string
		redirect_uri: string
	}): Promise<NotionOauthToken> {
		if (!NOTION_OAUTH_CLIENT_SECRET) {
			throw new Error("No oauth client secret available. Call on the server.")
		}

		const basicAuthCreds = `${NOTION_OAUTH_CLIENT_ID}:${NOTION_OAUTH_CLIENT_SECRET}`
		const base64 = Buffer.from(basicAuthCreds).toString("base64")

		const req = {
			method: "post",
			body: JSON.stringify({
				grant_type: "authorization_code",
				...args,
			}),
			headers: {
				Authorization: `Basic ${base64}`,
				"Content-Type": "application/json",
			},
		}
		const res = await fetch(`${NOTION_API_BASE_URL}/oauth/token`, req)

		let json: NotionOauthToken | { error: string } | undefined = undefined
		try {
			json = await res.json()
		} catch (error) {
			// pass
		}

		if (json && !("error" in json)) {
			return json
		}

		throw Object.assign(new Error(json?.error ?? "Unknown"), {
			name: "NotionOAuthError",
			req,
			res,
			json,
		})
	}

	async getPage(pageId: string): Promise<NotionPage> {
		const res = await this.performRequest({
			method: "GET",
			path: `/pages/${pageId}`,
		})

		return res.asObject("page")
	}

	async getChildren(blockId: string) {
		const res = await this.performRequest({
			method: "GET",
			path: `/blocks/${blockId}/children`,
		})

		return res.asList<NotionBlock>()
	}

	async getDatabases(): Promise<NotionList<NotionDatabase>> {
		const res = await this.performRequest({
			method: "get",
			path: "/databases",
		})

		return res.asListOf("database")
	}

	async queryDatabase(
		databaseId: string,
		options: {
			// TODO: filter
			sorts?: Sort[]
			start_cursor?: string
		} = {}
	): Promise<NotionList<NotionPage>> {
		const { sorts } = options

		const res = await this.performRequest({
			method: "POST",
			path: `/databases/${databaseId}/query`,
			body: options,
		})

		return res.asListOf("page")
	}
}

const extractTextContent = (blockContent: any): string | undefined => {
	if (!blockContent.text) {
		return
	}
	console.log(blockContent)
	return getPlainText(blockContent.text)
}

export const getIngredientsFromBlocks = (args: {
	children: NotionList<NotionBlock>
}): Array<string> => {
	const { children } = args
	const notionBlocks = children.results

	let scanningIngredients = false
	const ingredients: Array<string> = []
	notionBlocks.every(block => {
		if (block.object !== "block") {
			return true
		}
		const blockType = block.type
		const blockContent = block[blockType]
		if (!blockContent) {
			return true
		}

		const textContent = extractTextContent(blockContent)
		if (!textContent) {
			return true
		}

		if (scanningIngredients) {
			if (blockType === "bulleted_list_item" || blockType === "to_do") {
				// expect a bulleted list with ingredients after ingredients header
				ingredients.push(textContent)
			} else {
				return false
			}
		} else if (textContent && textContent.toLowerCase() === "ingredients") {
			scanningIngredients = true
		}
		return true
	})

	return ingredients
}

export const getPageTitle = (page: NotionPage): string => {
	if (!page.properties) {
		return "Untitled"
	}

	const properties = Object.values(page.properties)
	const titleProp = properties.find(prop => prop.title)
	const title = titleProp?.title

	if (title) {
		return getPlainText(title)
	}
	return "Untitled"
}
