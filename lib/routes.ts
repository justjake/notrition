import { NotritionRecipePage } from "./models"
import { SupabaseAuthViewType } from "./supabase"

export const routes = {
	default() {
		// TODO: /recipes ?
		return "/"
	},

	login(
		args: {
			authView?: SupabaseAuthViewType
		} = {}
	) {
		if (args.authView) {
			// TODO: better
			return `/login?action=${args.authView}`
		}
		return `/login`
	},

	logout() {
		return "/logout"
	},

	recipeLabel(recipePage: NotritionRecipePage) {
		return `/recipes/${recipePage.public_id}`
	},

	notionPage(notionId: string) {
		const withoutDashes = notionId.replace(/-/g, "")
		return `https://www.notion.so/${withoutDashes}`
	},

	connections() {
		return `/connections`
	},

	databases() {
		return "/databases"
	},

	recipes() {
		return `/recipes`
	},

	settings() {
		return `/settings`
	},
}
