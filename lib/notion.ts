import fetch, { Response } from "node-fetch"

const NOTION_API_BASE_URL = "https://api.notion.com/v1"

export interface NotionApiRequest {
	notionApiToken: string
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

export async function notionApiRequest(args: NotionApiRequest) {
	return typeof (global as any)["window"] !== "undefined"
		? fetch("/api/notionApiProxy", {
				// On the browser, we have to use the proxy :'(
				method: "post",
				body: JSON.stringify(args),
		  })
		: fetch(`${NOTION_API_BASE_URL}${args.path}`, {
				method: args.method,
				body: args.body ? JSON.stringify(args.body) : undefined,
				headers: {
					Authorization: `Bearer ${args.notionApiToken}`,
					...args.headers,
				},
		  })
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

export interface NotionBlock extends NotionObject<"block"> {
	id: string
	created_time: string
	last_edited_time: string
	has_children: boolean
	type: string
	paragraph?: {
		text?: any[]
	}
}

export interface NotionPage extends NotionObject<"page"> {}

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

	async asObject<OT extends string>(object: OT): Promise<NotionObject<OT>> {
		const json: NotionObject<string> = await this.httpResponse.json()

		if (isNotionError(json)) {
			const error = new Error(json.message)
			Object.assign(error, json)
			error.name = `NotionApiError[${json.code}]`
			throw error
		}

		assertIsObjectType(object, json)

		return json as NotionObject<OT>
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

export class NotionApiClient {
	constructor(public apiKey: string) {}

	static create(apiKey: string) {
		return new this(apiKey)
	}

	async req(args: Omit<NotionApiRequest, "notionApiToken">) {
		const httpResponse = await notionApiRequest({
			...args,
			notionApiToken: this.apiKey,
		})

		return new NotionApiResponse(httpResponse)
	}

	async getPage(pageId: string) {
		const res = await this.req({
			method: "GET",
			path: `/pages/${pageId}`,
		})

		return res.asObject("page")
	}

	async getChildren(blockId: string) {
		const res = await this.req({
			method: "GET",
			path: `/blocks/${blockId}/children`,
		})

		return res.asList<NotionBlock>()
	}
}

const extractTextContent = (blockContent: any): string | undefined => {
	if (!blockContent.text) {
		return
	}
	console.log(blockContent)
	const text: string = blockContent.text[0].text.content
	return text
}

export const getNotionPageIngredients = async (args: {
	pageId: string
	notionApiToken: string
}) => {
	const { notionApiToken, pageId } = args
	const response = await notionApiRequest({
		notionApiToken,
		method: "GET",
		path: `/blocks/${pageId}/children`,
	})

	const bodyJson = parseNotionJson(await response.json())

	const blocks = bodyJson["results"] as Array<any>
	let scanningIngredients = false
	const ingredients: Array<string> = []
	blocks.every(block => {
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
			if (blockType === "bulleted_list_item") {
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
