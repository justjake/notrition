/**
 * Perform a request usimg a user's stored OAuth access.
 */

import { RequestParameters } from "@notionhq/client/build/src/Client"
import { ClientErrorCode, isNotionClientError } from "@notionhq/client"
import { NextApiHandler } from "next"
import { NotionApiClient, NotionApiRequest } from "../../lib/notion"
import { assertQueryOk, authCookie, query } from "../../lib/supabase"

export interface AccessRequest {
	notionAccessTokenId: string
	notionApiRequest: RequestParameters
}

export type ProxyErrorCode =
	| "proxy_unauthorized"
	| "proxy_token_not_found"
	| "proxy_timeout"
	| "proxy_unknown_error"

export type AccessResponse =
	| { object: "proxy_error"; code: ProxyErrorCode; message: string }
	| { object: "error"; code: string; message: string }
	| { object: string; [key: string]: any }

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
	try {
		const response = await client.request(proxyReq.notionApiRequest)
		res.status(200).send(response as any)
	} catch (error) {
		if (isNotionClientError(error)) {
			if (error.code === ClientErrorCode.RequestTimeout) {
				res.status(502).send({
					object: "proxy_error",
					code: error.code,
					message: error.message,
				})
				return
			}

			res.status(error.status).send({
				object: "error",
				code: error.code,
				message: error.body,
			})
			return
		}

		res.status(500).send({
			object: "proxy_error",
			code: "proxy_unknown_error",
			message: error.message,
		})
	}
}

export default notionApiProxy
