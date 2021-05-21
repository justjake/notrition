import fetch from "node-fetch"
import { trigger } from "swr"
import { v4 } from "uuid"
import {
	NotionPageData,
	NotritionRecipePage,
	Profile,
	RecipeData,
	safeJson,
} from "./models"
import {
	getIngredientsFromBlocks,
	getPageTitle,
	NotionApiClient,
	UniversalNotionApiClient,
} from "./notion"
import { query } from "./supabase"
import { notritionRecipePageKey, notritionRecipePagesKey } from "./swr"

type NotionAccessOption =
	| { type: "accessTokenId"; accessTokenId: string }
	| { type: "tryEach"; accessTokenIds: string[] }

async function tryEachAccessTokenForPageData(args: {
	accessTokenIds: string[]
	notionPageId: string
}) {
	const { accessTokenIds, notionPageId } = args
	for (const accessTokenId of accessTokenIds) {
		const notion = NotionApiClient.withBrowserToken({ id: accessTokenId })
		try {
			const result = await getNotionPageData({
				notionPageId,
				notion,
			})

			return {
				pageData: result,
				accessTokenId,
			}
		} catch (error) {
			console.error("error with token", error)
		}
	}
	return undefined
}

async function getNotionPageData(args: {
	notionPageId: string
	notion: NotionApiClient
}): Promise<NotionPageData> {
	const { notionPageId: pageId, notion } = args
	const page = await notion.getPage(pageId)
	const children = await notion.getChildren(pageId)
	return { page, children }
}

function extractRecipeData({ page, children }: NotionPageData): RecipeData {
	const recipeTitle = getPageTitle(page)
	const ingredients = getIngredientsFromBlocks({ children })
	return {
		recipeTitle,
		ingredients,
	}
}

export interface RecipeUpdateState {
	phase:
		| "read_cache"
		| "fetch_notion"
		| "create"
		| "update_notion"
		| "fetch_nutrition"
		| "update_nutrition"
		| "done"
	recipePage?: NotritionRecipePage
	created?: boolean
	updatedNotion?: boolean
	updatedNutrition?: boolean
}

export async function* upsertNotritionRecipePage(args: {
	profile: Profile
	notionPageId: string
	updateNutrition: boolean
	access:
		| { accessTokenId: string; possibleAccessTokenIds?: undefined }
		| { possibleAccessTokenIds: string[]; accessTokenId?: undefined }
	cachedPage?: NotritionRecipePage
}): AsyncIterableIterator<RecipeUpdateState> {
	const { profile, notionPageId, access } = args
	const revalidate = (accessTokenId: string) => {
		const keys = [
			notritionRecipePageKey(accessTokenId, notionPageId),
			notritionRecipePagesKey(accessTokenId),
		]

		for (const key of keys) {
			trigger(key)
		}
	}
	let cachedPage = args.cachedPage

	const state: Partial<RecipeUpdateState> = {
		recipePage: cachedPage,
	}

	if (!cachedPage) {
		yield {
			...state,
			phase: "read_cache",
		}
		const existingPages = await query.notionRecipePage
			.select("*")
			.eq("notion_page_id", notionPageId)

		if (existingPages.body && existingPages.body.length > 0) {
			cachedPage = existingPages.body[0]
			state.recipePage = cachedPage
		}
	}

	yield {
		...state,
		phase: "fetch_notion",
	}
	let accessTokenId = cachedPage?.notion_access_token_id ?? access.accessTokenId
	let pageData: NotionPageData
	if (accessTokenId) {
		pageData = await getNotionPageData({
			notionPageId,
			notion: NotionApiClient.withBrowserToken({ id: accessTokenId }),
		})
	} else {
		const result = await tryEachAccessTokenForPageData({
			accessTokenIds: access.possibleAccessTokenIds || [],
			notionPageId,
		})
		if (!result) {
			throw new Error("No access token could find that page")
		}
		pageData = result.pageData
		accessTokenId = result.accessTokenId
	}

	if (!cachedPage) {
		yield {
			...state,
			phase: "create",
		}

		// Page data ok. Create the page.
		cachedPage = {
			user_id: profile.id,
			notion_page_id: notionPageId,
			notion_access_token_id: accessTokenId,
			notion_data: safeJson.stringify(pageData),
			public_id: v4(),
			extra_data: null,
			recipe_data: null,
		}

		const createRes = await query.notionRecipePage.insert([cachedPage])
		if (createRes.error) {
			throw createRes.error
		}
		state.recipePage = cachedPage
		state.created = true
		revalidate(accessTokenId)
	} else {
		// Only update if Notion data changed.
		const pageDataJson = safeJson.stringify(pageData)
		if (pageDataJson !== cachedPage.notion_data) {
			yield {
				...state,
				phase: "update_notion",
			}

			cachedPage = {
				...cachedPage,
				notion_data: pageDataJson,
			}

			await query.notionRecipePage
				.update({
					notion_data: pageDataJson,
				})
				.eq("notion_page_id", notionPageId)
			state.updatedNotion = true
			state.recipePage = cachedPage
			revalidate(accessTokenId)
		}
	}

	if (!(args.updateNutrition && (state.created || state.updatedNotion))) {
		yield {
			...state,
			phase: "done",
		}
		return
	}

	const recipeData = extractRecipeData(pageData)
	const recipeDataJson = safeJson.stringify(recipeData)

	const cachedExtraData =
		cachedPage.extra_data && JSON.parse(cachedPage.extra_data)
	if (
		recipeDataJson === cachedPage.recipe_data &&
		cachedExtraData &&
		cachedExtraData.status !== "error"
	) {
		yield {
			...state,
			phase: "done",
		}
	}

	yield {
		...state,
		phase: "fetch_nutrition",
	}

	const edamamBody = JSON.stringify({
		ingredients: JSON.stringify(recipeData.ingredients),
		recipe_name: recipeData.recipeTitle,
	})
	const extraDataReq = await fetch("/api/nutritionFacts", {
		method: "POST",
		body: edamamBody,
		headers: { "Content-Type": "application/json" },
	})
	const extraData = await extraDataReq.json()
	const extraDataJson = JSON.stringify(extraData)

	yield {
		...state,
		phase: "update_nutrition",
	}

	const updateRes = await query.notionRecipePage
		.update({
			recipe_data: recipeDataJson,
			extra_data: extraDataJson,
		})
		.eq("notion_page_id", notionPageId)
	if (updateRes.error) {
		throw updateRes.error
	}

	cachedPage = {
		...cachedPage,
		recipe_data: recipeDataJson,
		extra_data: extraDataJson,
	}
	state.recipePage = cachedPage
	state.updatedNutrition = true
	revalidate(accessTokenId)

	yield {
		...state,
		phase: "done",
	}
}
