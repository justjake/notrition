import { NextApiHandler } from "next"
import fetch from "node-fetch"

const EDAMAM_BASE_URL = "https://api.edamam.com/api/nutrition-details"

const getNutritionInfo = async (
	recipeName: string,
	ingredients: Array<string>
) => {
	const nutritionRequest = {
		title: recipeName,
		ingr: ingredients,
	}

	const url = `${EDAMAM_BASE_URL}?app_id=${process.env.EDAMAM_APP_ID}&app_key=${process.env.EDAMAM_API_TOKEN}`

	const edamamResponse = await fetch(url, {
		method: "POST",
		body: JSON.stringify(nutritionRequest),
		headers: { "Content-Type": "application/json" },
	})
	const resp = await edamamResponse.json()
	return resp
}

const nutritionFacts: NextApiHandler = async (req, res) => {
	if (req.method !== "POST") {
		res.status(405).json({ error: "method_not_allowed" })
		return
	}
	if (!req.body.ingredients || !req.body.recipe_name) {
		res.status(400).json({ error: "bad_request" })
		return
	}

	const ingredients = JSON.parse(req.body.ingredients)
	const recipeName = req.body.recipe_name

	const nutritionFacts = await getNutritionInfo(recipeName, ingredients)
	res.status(200).json(nutritionFacts)
}

export default nutritionFacts
