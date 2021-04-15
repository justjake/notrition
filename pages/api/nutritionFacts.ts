import { NextApiHandler } from "next"
import { Profile } from "../../lib/models"
import { supabase } from "../../lib/supabase"
import fetch, { Response } from "node-fetch"

const NOTION_API_BASE_URL = "https://api.notion.com/v1"
const EDAMAM_BASE_URL = "https://api.edamam.com/api/nutrition-details"

const extractTextContent = (blockContent: any): string | undefined => {
	if (!blockContent.text) {
		return
	}
	const text: string = blockContent.text[0].text.content
	return text
}

// Assumes page title is the recipe name
const getRecipeNameFromPage = async (
	notionApiKey: string,
	pageId: string
): Promise<string | undefined> => {
	let response: Response
	try {
		response = await fetch(`${NOTION_API_BASE_URL}/pages/${pageId}`, {
			method: "GET",
			headers: { Authorization: "Bearer " + notionApiKey },
		})
	} catch (err) {
		// todo: error handling
		return
	}
	const bodyJson = await response.json()
	const name = bodyJson.properties.Name
	if (!name) {
		return
	}
	return name.title[0].plain_text
}

// Assumes ingredients are bullet points in page children under the title of "ingredients"
const getIngredientsFromPage = async (
	notionApiKey: string,
	pageId: string
): Promise<Array<string> | undefined> => {
	let response: Response
	try {
		response = await fetch(`${NOTION_API_BASE_URL}/blocks/${pageId}/children`, {
			method: "GET",
			headers: { Authorization: "Bearer " + notionApiKey },
		})
	} catch (err) {
		// todo: error handling
		return
	}
	const bodyJson = await response.json()
	if (bodyJson["object"] !== "list") {
		return
	}
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

const getNutritionInfo = async (
	recipeTitle: string,
	ingredients: Array<string>
) => {
	const nutritionRequest = {
		title: recipeTitle,
		ingr: ingredients,
	}

	const edamamResponse = await fetch(
		`${EDAMAM_BASE_URL}?app_id=${process.env.EDAMAM_APP_ID}&app_key=${process.env.EDAMAM_API_TOKEN}`,
		{
			method: "POST",
			body: JSON.stringify(nutritionRequest),
			headers: { "Content-Type": "application/json" },
		}
	)
	return edamamResponse.json()
}

const nutritionFacts: NextApiHandler = async (req, res) => {
	if (req.method !== "POST") {
		res.status(405).json({ error: "method_not_allowed" })
		return
	}
	if (!req.body.user_id || !req.body.notion_page_id) {
		res.status(400).json({ error: "bad_request" })
		return
	}

	const supabaseUserId = req.body.user_id
	const notionPageId = req.body.notion_page_id

	const supabaseResp = await supabase
		.from<Profile>("profiles")
		.select("id, human_name, notion_api_key")
		.eq("id", supabaseUserId)
		.single()
	if (!supabaseResp) {
		res.status(500)
		return
	}
	if (supabaseResp.error || supabaseResp.status !== 200) {
		res.status(500).json({ error: supabaseResp.error })
	}

	const notionApiKey = supabaseResp.body?.notion_api_key
	if (!notionApiKey) {
		res.status(500).json({ error: "missing_notion_api_key" })
		return
	}

	const recipeName = await getRecipeNameFromPage(notionApiKey, notionPageId)
	if (!recipeName) {
		// todo
		res.status(500)
		return
	}

	const ingredients = await getIngredientsFromPage(notionApiKey, notionPageId)
	if (!ingredients) {
		// todo
		res.status(500)
		return
	}
	const nutritionFacts = await getNutritionInfo(recipeName, ingredients)

	res.status(200).json(nutritionFacts)
}

export default nutritionFacts
