import { NotritionRecipePage } from "./models"

export const routes = {
	recipeLabel(recipePage: NotritionRecipePage) {
		return `/recipes/${recipePage.public_id}`
	},

	notionPage(notionId: string) {
		const withoutDashes = notionId.replace(/-/g, "")
		return `https://www.notion.so/${withoutDashes}`
	},
}
