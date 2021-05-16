import { NextApiHandler } from "next"
import {
	NotionAccessToken,
	UserNotionAccessToken,
	UserNotionAccessTokenColumns,
} from "../../lib/models"
import { assertQueryOk, mustAuthToken, query } from "../../lib/supabase"

interface ListAccessTokensResponse {
	tokens: UserNotionAccessToken[]
}

interface ErrorResponse {
	error: true
	message: string
}

const listAccessTokens: NextApiHandler<ListAccessTokensResponse> = async (
	req,
	res
) => {
	const user = await mustAuthToken(req)
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
	if (req.method === "get") {
		return listAccessTokens(req, res)
	}

	res
		.status(405)
		.send({ error: true, message: `Method not allowed: ${req.method}` })
}

export default accessTokens
