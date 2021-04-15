import fetch from "node-fetch"

const pageId = "b804d11b-e89d-4b80-93ed-f6da2abc1541"
const apiBaseUrl = "https://api.notion.com/v1/"
const edamamBaseUrl = "https://api.edamam.com/api/nutrition-details"

const extractTextContent = (blockContent: any): string | undefined => {
	if (!blockContent.text) {
		return
	}
	const text: string = blockContent.text[0].text.content
	return text
}

const getNutritionInfo = async () => {
	const response = await fetch(`${apiBaseUrl}blocks/${pageId}/children`, {
		method: "GET",
		headers: { Authorization: "Bearer " + NOTION_API_TOKEN },
	})
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

	const nutritionRequest = {
		title: "todo",
		ingr: ingredients,
	}

	const edamamResponse = await fetch(
		`${edamamBaseUrl}?app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_API_TOKEN}`,
		{
			method: "POST",
			body: JSON.stringify(nutritionRequest),
			headers: { "Content-Type": "application/json" },
		}
	)
	console.log(await edamamResponse.json())
}

getNutritionInfo()

export {}
