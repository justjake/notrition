import {
	Block,
	Page,
	PaginatedList,
} from "@notionhq/client/build/src/api-types"
import { supabase } from "./supabase"

const EncodedType = Symbol("encoded type")

type JsonOf<T> = JSONB & { [EncodedType]: T }
export type UUID = string
export type JSONB = string // does it SERDE this for us? unsure.
export type Timestamp = string

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
	notion_access_token_id: UUID
}

export interface NotionPageData {
	page: Page
	children: PaginatedList<Block>
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

/*
	id uuid primary key,
  user_id uuid references auth.users,
  inserted_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  access_token text,
  workspace_name text,
  workspace_icon text,
  bot_id text
	*/
export interface NotionAccessToken {
	id: UUID
	user_id: UUID
	inserted_at: Timestamp
	updated_at: Timestamp
	access_token: string
	workspace_name: string
	workspace_icon: string
	bot_id: string
}

export type UserNotionAccessToken = Omit<NotionAccessToken, "access_token">
export const UserNotionAccessTokenColumns: {
	[K in keyof UserNotionAccessToken]: true
} = {
	id: true,
	user_id: true,
	inserted_at: true,
	updated_at: true,
	workspace_name: true,
	workspace_icon: true,
	bot_id: true,
}

export function sliceUserNotionAccessToken(
	token: NotionAccessToken
): UserNotionAccessToken {
	const {
		id,
		user_id,
		inserted_at,
		updated_at,
		workspace_icon,
		workspace_name,
		bot_id,
	} = token

	return {
		id,
		user_id,
		inserted_at,
		updated_at,
		workspace_icon,
		workspace_name,
		bot_id,
	}
}
