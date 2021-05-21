import useSWR from "swr"
import { query } from "../lib/supabase"
import { NotionApiClient } from "../lib/notion"
import { useCurrentUserProfile } from "../components/Helpers"

export function notritionRecipePageKey(
	userId: string | undefined,
	notionPageId: string
) {
	if (!userId) {
		return null
	}
	return ["notion_recipe_page", notionPageId]
}

export function notritionRecipePagesKey(userId: string | undefined) {
	if (!userId) {
		return null
	}
	return ["notion_recipe_pages"]
}

export function useNotritionRecipePage(notionPageId: string) {
	const profile = useCurrentUserProfile()
	return useSWR(
		notritionRecipePageKey(profile?.user?.id, notionPageId),
		async () => {
			const result = await query.notionRecipePage
				.select("*")
				.eq("notion_page_id", notionPageId)
				.limit(1)
			return result.body?.[0] || undefined
		}
	)
}

export function useNotritionRecipePages() {
	const profile = useCurrentUserProfile()
	return useSWR(notritionRecipePagesKey(profile?.user.id), async () => {
		const result = await query.notionRecipePage.select("*")
		return result.body || undefined
	})
}

export function userProfileKey(userId: string | undefined) {
	if (!userId) {
		return null
	}

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
