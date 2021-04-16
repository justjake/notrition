import { createClient } from "@supabase/supabase-js"
import { NotionRecipePage, Profile } from "./models"

function die(message: string): never {
	throw new Error(message)
}

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
