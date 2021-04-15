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
export interface NotionRecipePage {
	user_id: UUID
	notion_page_id: UUID
	notion_data: JSONB | null
	recipe_data: JSONB | null
	extra_data: JSONB | null
}
