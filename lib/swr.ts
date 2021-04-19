import useSWR from "swr"
import { query } from "../lib/supabase"
import { useNotionApiClient } from "../components/Helpers"
import { NotionApiClient } from "../lib/notion"

export function notritionRecipePageKey(
	notion: NotionApiClient | undefined,
	notionPageId: string
) {
	return [notion?.apiKey, "notion_recipe_page", notionPageId]
}

export function notritionRecipePagesKey(notion: NotionApiClient | undefined) {
	return [notion?.apiKey, "notion_recipe_page"]
}

export function useNotritionRecipePage(notionPageId: string) {
	const notion = useNotionApiClient()
	return useSWR(notritionRecipePageKey(notion, notionPageId), async () => {
		const result = await query.notionRecipePage
			.select("*")
			.eq("notion_page_id", notionPageId)
			.single()
		return result.body || undefined
	})
}

export function useNotritionRecipePages() {
	const notion = useNotionApiClient()
	return useSWR(notritionRecipePagesKey(notion), async () => {
		const result = await query.notionRecipePage.select("*")
		return result.body || undefined
	})
}

export function userProfileKey(userId: string | undefined) {
	return ["profile", userId]
}

/**
 * See also useCurrentUserProfile
 */
export function useProfile(userId: string | undefined) {
	return useSWR(userProfileKey(userId), async () => {
		if (!userId) {
			return
		}

		const res = await query.profile.select("*").eq("id", userId).single()

		return res.body || undefined
	})
}
