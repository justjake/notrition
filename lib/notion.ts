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

/*
      {
        "object": "block",
        "id": "5e9063aa-e259-4334-a6c2-e1c52cc1cc3a",
        "created_time": "2020-09-12T23:28:00.000Z",
        "last_edited_time": "2020-10-12T01:50:00.000Z",
        "has_children": false,
        "type": "to_do",
        "to_do": {
          "text": [
            {
              "type": "text",
              "text": {
                "content": "1/2 cup brown sugar",
                "link": null
              },
              "annotations": {
                "bold": false,
                "italic": false,
                "strikethrough": false,
                "underline": false,
                "code": false,
                "color": "default"
              },
              "plain_text": "1/2 cup brown sugar",
              "href": null
            }
          ],
          "checked": false
        }
      },
      {
        "object": "block",
        "id": "c615da69-81d0-4491-abea-22caa130a5fb",
        "created_time": "2020-09-12T23:28:00.000Z",
        "last_edited_time": "2020-10-12T01:50:00.000Z",
        "has_children": false,
        "type": "to_do",
        "to_do": {
          "text": [
            {
              "type": "text",
              "text": {
                "content": "1/2 cup melted butter or margarine",
                "link": null
              },
              "annotations": {
                "bold": false,
                "italic": false,
                "strikethrough": false,
                "underline": false,
                "code": false,
                "color": "default"
              },
              "plain_text": "1/2 cup melted butter or margarine",
              "href": null
            }
          ],
          "checked": false
        }
      },
      {
        "object": "block",
        "id": "aebac686-9cf7-482b-80d6-e7ed82bdd64c",
        "created_time": "2020-09-12T23:28:00.000Z",
        "last_edited_time": "2020-10-12T01:50:00.000Z",
        "has_children": false,
        "type": "to_do",
        "to_do": {
          "text": [
            {
              "type": "text",
              "text": {
                "content": "2 teaspoons grated lemon rind",
                "link": null
              },
              "annotations": {
                "bold": false,
                "italic": false,
                "strikethrough": false,
                "underline": false,
                "code": false,
                "color": "default"
              },
              "plain_text": "2 teaspoons grated lemon rind",
              "href": null
            }
          ],
          "checked": false
        }
      },

*/

export interface NotionPage extends NotionObject<"page"> {
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

	async getPage(pageId: string): Promise<NotionPage> {
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

export const getIngredientsFromBlocks = async (args: {
	children: NotionList<NotionBlock>
}): Promise<Array<string>> => {
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

export const getPageTitle = (page: NotionPage): string => {
	const pageProperties: any = page.properties
	return pageProperties["Name"].title[0].plain_text
}
