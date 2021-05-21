import { createClient, SupabaseClient } from "@supabase/supabase-js"
import { NotionAccessToken, NotritionRecipePage, Profile } from "./models"
import {
	PostgrestResponse,
	PostgrestSingleResponse,
} from "@supabase/postgrest-js/dist/main/lib/types"
import { die } from "./utils"
import { NextApiRequest, NextApiResponse } from "next"

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
		return supabase.from<NotritionRecipePage>("notion_recipe_page")
	},

	get profile() {
		return supabase.from<Profile>("profiles")
	},

	get notionAccessToken() {
		return supabase.from<NotionAccessToken>("notion_access_token")
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

// API-side auth by token
// https://github.com/supabase/supabase/blob/c9ec7c151088519abe0ac6ff66313d69f3f0fa36/examples/nextjs-with-supabase-auth/pages/api/getUser.js
export async function authTokenHeader(req: NextApiRequest) {
	const token = req.headers.token
	if (!token || Array.isArray(token)) {
		return undefined
	}

	const { user, error } = await supabase.auth.api.getUser(token)
	if (error) {
		throw error
	}
	if (user === null) {
		return undefined
	}
	return user
}

// SSR-side auth by cookie.
// Requires user posted /api/auth to connect the session.
// https://github.com/supabase/supabase/blob/c9ec7c151088519abe0ac6ff66313d69f3f0fa36/examples/nextjs-with-supabase-auth/pages/profile.js#L32
export async function authCookie(req: any) {
	const { user } = await supabase.auth.api.getUserByCookie(req)
	return user
}

export type SupabaseAuthViewType =
	| "sign_in"
	| "sign_up"
	| "forgotten_password"
	| "magic_link"

export function getAuthViewType(
	string: string | string[] | undefined
): SupabaseAuthViewType | undefined {
	if (Array.isArray(string)) {
		string = string[0]
	}

	if (
		string === "sign_in" ||
		string === "sign_up" ||
		string === "forgotten_password" ||
		string === "magic_link"
	) {
		return string
	}
	return undefined
}
