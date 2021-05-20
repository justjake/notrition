/**
 * Perform a request usimg a user's stored OAuth access.
 */

import { NextApiHandler } from "next"
import {
	NotionApiClient,
	NotionApiRequest,
	NotionApiResponse,
} from "../../lib/notion"
import { assertQueryOk, authCookie, query } from "../../lib/supabase"

export interface AccessRequest {
	notionAccessTokenId: string
	notionApiRequest: Omit<NotionApiRequest, "notionApiToken">
}

export type ProxyErrorCode = "proxy_unauthorized" | "proxy_token_not_found"

export type AccessResponse =
	| { object: "error"; code: ProxyErrorCode; message: string }
	| NotionApiResponse

const notionApiProxy: NextApiHandler<AccessResponse> = async (req, res) => {
	const user = await authCookie(req)
	if (!user) {
		res.status(401).json({
			object: "error",
			code: "proxy_unauthorized",
			message: "Not authenticated, log in again",
		})
		return
	}

	const proxyReq: AccessRequest = JSON.parse(req.body)
	const tokens = await query.notionAccessToken
		.select("*")
		.eq("user_id", user.id)
		.eq("id", proxyReq.notionAccessTokenId)

	assertQueryOk(tokens)
	const token = tokens.body[0]?.access_token

	if (!token) {
		res.status(404).json({
			object: "error",
			code: "proxy_token_not_found",
			message: "Check the token ID and try again",
		})
		return
	}

	const client = NotionApiClient.withServerApiToken(token)
	const response = await client.performRequest(proxyReq.notionApiRequest)
	res
		.status(response.httpResponse.status)
		.send(await response.httpResponse.json())
}

export default notionApiProxy
