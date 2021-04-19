import { createClient } from "@supabase/supabase-js"
import { NotionRecipePage, Profile } from "./models"
import {
	PostgrestResponse,
	PostgrestSingleResponse,
} from "@supabase/postgrest-js/dist/main/lib/types"
import { die } from "./utils"

export const SUPABASE_URL: string =
	process.env.NEXT_PUBLIC_SUPABASE_URL ||
	die("no SUPABASE_URL configured. Check .env.local")

export const SUPABASE_ANON_KEY: string =
	process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
	die("no SUPABASE_ANON_KEY configured. Check .env.local")

export const SECRET_SUPABASE_SERVICE_KEY: string | undefined =
	process.env.SECRET_SUPABASE_SERVICE_KEY

export const supabase = createClient(
	SUPABASE_URL,
	SECRET_SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY
)

export const query = {
	get notionRecipePage() {
		return supabase.from<NotionRecipePage>("notion_recipe_page")
	},

	get profile() {
		return supabase.from<Profile>("profiles")
	},
}

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
