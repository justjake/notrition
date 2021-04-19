import { NotionRecipePage } from "./models"

export const routes = {
	recipeLabel(recipePage: NotionRecipePage) {
		return `/recipes/${recipePage.public_id}`
	},

	notionPage(notionId: string) {
		const withoutDashes = notionId.replace(/-/g, "")
		return `https://www.notion.so/${notionId}`
	},
}
