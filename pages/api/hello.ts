import { NextApiHandler } from "next"

const hello: NextApiHandler = (req, res) => {
	res.status(200).json({ name: "John Doe" })
}

export default hello
