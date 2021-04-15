import { NextApiHandler } from "next"
import fetch from "node-fetch"
import { notionApiRequest, NotionApiRequest } from "../../lib/notion"

const notionApiProxy: NextApiHandler = async (req, res) => {
	const proxyReq: NotionApiRequest = JSON.parse(req.body)
	console.log("proxyReq", typeof req.body, proxyReq)
	const response = await notionApiRequest(proxyReq)
	console.log(response)
	const responseBody = await response.json()
	console.log("body", responseBody)
	res.status(response.status).json(responseBody)
}

export default notionApiProxy
