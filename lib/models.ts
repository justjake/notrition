import { NotionBlock, NotionList, NotionPage } from "./notion"
import { supabase } from "./supabase"

const EncodedType = Symbol("encoded type")

type JsonOf<T> = JSONB & { [EncodedType]: T }
export type UUID = string
export type JSONB = string // does it SERDE this for us? unsure.

/**
 * Every user has a "profile" that stores related data about the user
 */
export interface Profile {
	id: UUID
	human_name: string | null
	notion_api_key: string | null
}

/**
 * Stores data about a Notion page.
 * Caches recipe info.
 */
export interface NotritionRecipePage {
	user_id: UUID
	notion_page_id: UUID
	notion_data: JsonOf<NotionPageData> | null
	recipe_data: JsonOf<RecipeData> | null
	extra_data: JSONB | null
	public_id: UUID
}

export interface NotionPageData {
	page: NotionPage
	children: NotionList<NotionBlock>
}
export interface RecipeData {
	recipeTitle: string
	ingredients: string[]
}

export const safeJson = {
	parse<T>(encodedString: JsonOf<T>): T {
		return JSON.parse(encodedString)
	},

	stringify<T>(value: T, indent?: string): JsonOf<T> {
		return JSON.stringify(value, undefined, indent) as JsonOf<T>
	},
}
