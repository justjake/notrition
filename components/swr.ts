import useSWR from "swr"
import { query } from "../lib/supabase"
import { useNotionApiClient } from "./Helpers"
import {
	PostgrestResponse,
	PostgrestSingleResponse,
} from "@supabase/postgrest-js/dist/main/lib/types"
import { NotionApiClient } from "../lib/notion"
import { NotionRecipePageList } from "./NotionRecipeExtractor"

interface PostgrestResponseSuccess<T> {
	error: null
	data: T[]
	body: T[]
	count: number | null
	status: number
	statusText: string
}

interface PostgrestSingleResponseSuccess<T> {
	error: null
	data: T
	body: T
	count: number | null
	status: number
	statusText: string
}

function assertQueryOk<T>(
	query: PostgrestSingleResponse<T>
): asserts query is PostgrestSingleResponseSuccess<T>
function assertQueryOk<T>(
	query: PostgrestResponse<T>
): asserts query is PostgrestResponseSuccess<T>
function assertQueryOk<T>(
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
		// assertQueryOk(result)
		return result.body
	})
}

export function useNotritionRecipePages() {
	const notion = useNotionApiClient()
	return useSWR(notritionRecipePagesKey(notion), async () => {
		const result = await query.notionRecipePage.select("*")
		// assertQueryOk(result)
		return result.body
	})
}
