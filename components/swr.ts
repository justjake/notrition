import useSWR from "swr"
import { query } from "../lib/supabase"
import { useNotionApiClient } from "./Helpers"
import {
	PostgrestResponse,
	PostgrestSingleResponse,
} from "@supabase/postgrest-js/dist/main/lib/types"
import { NotionApiClient } from "../lib/notion"
import { NotionRecipePageList } from "./NotionRecipeExtractor"

export type { PostgrestResponse, PostgrestSingleResponse }

export interface PostgrestResponseSuccess<T> {
	error: null
	data: T[]
	body: T[]
	count: number | null
	status: number
	statusText: string
}

export interface PostgrestSingleResponseSuccess<T> {
	error: null
	data: T
	body: T
	count: number | null
	status: number
	statusText: string
}

export function assertQueryOk<T>(
	query: PostgrestSingleResponse<T>
): asserts query is PostgrestSingleResponseSuccess<T>
export function assertQueryOk<T>(
	query: PostgrestResponse<T>
): asserts query is PostgrestResponseSuccess<T>
export function assertQueryOk<T>(
	query: PostgrestResponse<T> | PostgrestSingleResponse<T>
): asserts query is PostgrestResponseSuccess<T> {
	if (query.error) {
		const error = new Error(query.error.message)
		Object.assign(error, query.error)
		error.name = "PostgrestQueryErrorResponse"
		throw error
	}
}

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
