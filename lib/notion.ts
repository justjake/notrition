import { AccessRequest, AccessResponse } from "../pages/api/notion"
import { die } from "./utils"
import { Client as NotionHQClient, LogLevel } from "@notionhq/client"
import {
	Block,
	HeadingOneBlock,
	HeadingThreeBlock,
	HeadingTwoBlock,
	Page,
	RichText,
} from "@notionhq/client/build/src/api-types"

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
	headers?: { [key: string]: string | string[] } | string[][]
	body?: object
}

type NotionText = RichText[]

export function getPlainText(text: NotionText): string {
	return text.map(it => it.plain_text).join("")
}

export interface NotionOauthToken {
	access_token: string
	workspace_name: string
	workspace_icon: string
	bot_id: string
}

export class NotionApiClient extends NotionHQClient {
	static withServerApiToken(notionApiToken: string) {
		return new this({
			auth: notionApiToken,
			logLevel: LogLevel.DEBUG,
		})
	}

	static withBrowserToken(token: { id: string }) {
		return new this({
			logLevel: LogLevel.DEBUG,
			fetch: async (path, init) => {
				// We need to take the request and map it back to a v1 path, etc.
				// We just ignore the fetch options that don't make sense here.
				const withoutPrefix = path
					.toString()
					.substring(NOTION_API_BASE_URL.length + 1)
				const accessRequest: AccessRequest = {
					notionAccessTokenId: token.id,
					notionApiRequest: {
						method: init?.method ?? ("get" as any),
						path: withoutPrefix,
						body: JSON.parse(init?.body?.toString() || "null"),
					},
				}

				return fetch("/api/notion", {
					method: "post",
					body: JSON.stringify(accessRequest),
				})
			},
		})
	}

	static getOauthUrl(): string {
		const url = new URL(`${NOTION_API_BASE_URL}/oauth/authorize`)
		url.searchParams.append("client_id", NOTION_OAUTH_CLIENT_ID)
		// TODO
		// url.searchParams.append("redirect_uri", OAUTH_REDIRECT_URI)
		url.searchParams.append("response_type", "code")
		return url.toString()
	}

	static async createOauthToken(args: {
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
}

const extractTextContent = (blockContent: any): string | undefined => {
	if (!blockContent.text) {
		return
	}
	console.log(blockContent)
	return getPlainText(blockContent.text)
}

function getBlockText(block: Block): string | undefined {
	switch (block.type) {
		case "bulleted_list_item":
			return getPlainText(block.bulleted_list_item.text)
		case "child_page":
			return block.child_page.title
		case "heading_1":
			return getPlainText(block.heading_1.text)
		case "heading_2":
			return getPlainText(block.heading_2.text)
		case "heading_3":
			return getPlainText(block.heading_3.text)
		case "numbered_list_item":
			return getPlainText(block.numbered_list_item.text)
		case "paragraph":
			return getPlainText(block.paragraph.text)
		case "to_do":
			return getPlainText(block.to_do.text)
		case "toggle":
			return getPlainText(block.toggle.text)
		case "unsupported":
			return undefined
		default:
			return undefined
	}
}

function isHeadingBlock(
	block: Block
): block is HeadingOneBlock | HeadingTwoBlock | HeadingThreeBlock {
	return (
		block.type === "heading_1" ||
		block.type === "heading_2" ||
		block.type === "heading_3"
	)
}

export function getIngredientsFromBlocks(blocks: Block[]): string[] {
	let insideIngredientsSection = false
	const ingredients: string[] = []
	for (const block of blocks) {
		const text = getBlockText(block)

		if (text === undefined) {
			// Skip unknown blocks
			continue
		}

		if (insideIngredientsSection) {
			if (isHeadingBlock(block)) {
				// Exited ingredients section
				break
			}

			ingredients.push(text)
			continue
		} else {
			// Looking for ingredients section
			if (isHeadingBlock(block) && text.toLowerCase() === "ingredients") {
				insideIngredientsSection = true
			}
		}
	}
	return ingredients
}

export const getPageTitle = (page: Page): string => {
	if (!page.properties) {
		return "Untitled"
	}

	const properties = Object.values(page.properties)
	for (const prop of properties) {
		if (prop.type === "title") {
			return getPlainText(prop.title)
		}
	}

	return "Untitled"
}
