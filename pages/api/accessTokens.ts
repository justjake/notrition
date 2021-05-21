import { User } from "@supabase/gotrue-js"
import { NextApiHandler, NextApiResponse } from "next"
import {
	NotionAccessToken,
	UserNotionAccessToken,
	UserNotionAccessTokenColumns,
} from "../../lib/models"
import {
	assertQueryOk,
	authCookie,
	authTokenHeader,
	query,
} from "../../lib/supabase"

export interface ListAccessTokensResponse {
	tokens: UserNotionAccessToken[]
}

export interface ErrorResponse {
	error: true
	message: string
}

const listAccessTokens = async (
	user: User,
	res: NextApiResponse<ListAccessTokensResponse>
) => {
	const tokens = await query.notionAccessToken
		.select(Object.keys(UserNotionAccessTokenColumns).join(","))
		.eq("user_id", user.id)
		.order("inserted_at")
	assertQueryOk(tokens)
	res.send({ tokens: tokens.body })
}

const accessTokens: NextApiHandler<
	ListAccessTokensResponse | ErrorResponse
> = async (req, res) => {
	const user = await authTokenHeader(req)
	if (!user) {
		res.status(401).send({ error: true, message: `Please log in` })
		return
	}

	if (req.method === "GET") {
		return listAccessTokens(user, res)
	}

	res
		.status(405)
		.send({ error: true, message: `Method not allowed: ${req.method}` })
}

export default accessTokens
