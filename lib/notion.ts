import fetch from "node-fetch"

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
