import { NextApiHandler } from "next"
import fetch from "node-fetch"
import { notionApiRequest, NotionApiRequest } from "../../lib/notion"

const notionApiProxy: NextApiHandler = async (req, res) => {
	const proxyReq: NotionApiRequest = JSON.parse(req.body)
	const response = await notionApiRequest(proxyReq)
	const responseBody = await response.json()
	res.status(response.status).json(responseBody)
}

export default notionApiProxy
