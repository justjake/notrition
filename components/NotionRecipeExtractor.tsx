import React, { ReactNode, useCallback, useMemo, useState } from "react"
import { SWRResponse, trigger } from "swr"
import {
	NotionPageData as NotritionPageData,
	NotionRecipePage as NotritionRecipePage,
	Profile,
	RecipeData,
	safeJson,
} from "../lib/models"
import {
	getIngredientsFromBlocks,
	getPageTitle,
	NotionApiClient,
} from "../lib/notion"
import { query } from "../lib/supabase"
import {
	Box,
	Button,
	JSONViewer,
	Row,
	useCurrentUserProfile,
	useNotionApiClient,
} from "./Helpers"
import fetch from "node-fetch"
import Link from "next/link"
import {
	Nutrient,
	NutritionDisplay,
	NutritionDisplayProps,
} from "./NutritionDisplay"
import { v4 } from "uuid"
import {
	notritionRecipePageKey,
	notritionRecipePagesKey,
	useNotritionRecipePages,
} from "../lib/swr"
import { routes } from "../lib/routes"

export function NotionRecipePageList(props: {}) {
	const profile = useCurrentUserProfile()?.profile
	const pageList = useNotritionRecipePages()

	if (!pageList.data || !profile) {
		return null
	}

	if (pageList.data.length === 0) {
		return <Row>No pages.</Row>
	}

	return (
		<>
			{pageList.data.map(recipePage => {
				return (
					<NotionRecipePageView
						key={recipePage.notion_page_id}
						profile={profile}
						recipePage={recipePage}
						swr={pageList}
					/>
				)
			})}
		</>
	)
}

export function NotionRecipePageView(props: {
	profile: Profile
	swr: SWRResponse<any, any>
	recipePage: NotritionRecipePage
}) {
	const notion = useNotionApiClient()
	const { recipePage, swr } = props
	const [refreshStatus, setRefreshStatus] = useState<ReactNode>()

	async function handleRefresh() {
		// try {
		// 	if (!notion) {
		// 		throw new Error("No API key configured.")
		// 	}
		// 	for await (const status of updatePersistedRecipePage({
		// 		notion,
		// 		notionPageId: recipePage.notion_page_id,
		// 		profile: props.profile,
		// 		cachedPage: recipePage,
		// 	})) {
		// 		setRefreshStatus(status)
		// 	}
		// 	setRefreshStatus(null)
		// } catch (error) {
		// 	const { message, name, ...rest } = error
		// 	const json = {
		// 		...rest,
		// 		message,
		// 		name,
		// 	}
		// 	setRefreshStatus(
		// 		<>
		// 			<Row>An error occured refreshing recipe data:</Row>
		// 			<Row>
		// 				<JSONViewer json={json} />
		// 			</Row>
		// 		</>
		// 	)
		// }
	}

	const handleDelete = async () => {
		await query.notionRecipePage
			.delete()
			.eq("notion_page_id", recipePage.notion_page_id)
		swr.revalidate()
	}

	const nutritionDisplayProps = useMemo<
		NutritionDisplayProps | undefined
	>(() => {
		if (!recipePage.extra_data || !recipePage.recipe_data) {
			return
		}

		const recipeData = safeJson.parse(recipePage.recipe_data)
		const edamamJson = JSON.parse(recipePage.extra_data)

		const rows = edamamJson.totalNutrients
		const parsedNutrients: Array<Nutrient> = []
		for (var nutrientName in rows) {
			if (rows.hasOwnProperty(nutrientName)) {
				const nutrientData = rows[nutrientName]
				const nutrient = {
					label: nutrientData.label,
					quantity: Math.round(nutrientData.quantity as number),
					unit: nutrientData.unit,
				}
				parsedNutrients.push(nutrient)
			}
		}

		return {
			recipeName: recipeData.recipeTitle,
			nutrients: parsedNutrients,
		}
	}, [recipePage.extra_data, recipePage.recipe_data])

	return (
		<Row>
			<Box>
				<Row>
					<Button style={{ marginRight: "1em" }} onClick={handleRefresh}>
						Refresh
					</Button>
					<Button style={{ marginRight: "1em" }} onClick={handleDelete}>
						Delete
					</Button>
					<Button style={{ marginRight: "1em" }}>
						<Link href={routes.recipeLabel(recipePage)}>
							<a target="_blank">Open standalone label</a>
						</Link>
					</Button>
					<Button style={{ marginRight: "1em" }}>
						<a
							href={routes.notionPage(recipePage.notion_page_id)}
							target="_blank"
						>
							Open in Notion
						</a>
					</Button>
				</Row>
				{refreshStatus && <Row>{refreshStatus}</Row>}
				{nutritionDisplayProps && (
					<Row>
						<NutritionDisplay {...nutritionDisplayProps} />
					</Row>
				)}
				<div
					style={{ display: "flex", flexDirection: "row", maxWidth: "100%" }}
				>
					<Row style={{ width: "50%", padding: "0 1em" }}>
						<Row>Notion data</Row>
						<Box>
							<JSONViewer jsonString={recipePage.notion_data} />
						</Box>
					</Row>
					<Row style={{ width: "50%" }}>
						<Row>Extracted recipe</Row>
						<Box>
							<JSONViewer jsonString={recipePage.recipe_data} />
						</Box>
					</Row>
				</div>
				<Row style={{ padding: "0 1em" }}>
					<Row>Nutrition data</Row>
					<Box>
						<JSONViewer jsonString={recipePage.extra_data} />
					</Box>
				</Row>
			</Box>
		</Row>
	)
}

export interface AsyncGeneratorState<T> {
	isRunning: boolean
	error?: Error
	progress?: T
}

export function useAsyncGeneratorState<T>(
	typeHint: (...args: any[]) => AsyncIterableIterator<T>
): [AsyncGeneratorState<T>, (iterator: AsyncIterableIterator<T>) => void] {
	const [state, setState] = useState<AsyncGeneratorState<T>>({
		isRunning: false,
	})

	const trackState = useCallback(async (iterator: AsyncIterableIterator<T>) => {
		setState(s => ({
			...s,
			isRunning: true,
		}))

		try {
			for await (const nextProgress of iterator) {
				setState(s => ({
					...s,
					progress: nextProgress,
				}))
			}
		} catch (error) {
			setState(s => ({ ...s, error }))
		} finally {
			setState(s => ({ ...s, isRunning: false }))
		}
	}, [])

	return [state, trackState]
}

async function getBlockData(args: {
	notionPageId: string
	notion: NotionApiClient
}): Promise<NotritionPageData> {
	const { notionPageId: pageId, notion } = args
	const page = await notion.getPage(pageId)
	const children = await notion.getChildren(pageId)
	return { page, children }
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

export async function* createOrUpdatePersistedRecipePage(args: {
	notion: NotionApiClient
	profile: Profile
	notionPageId: string
	cachedPage?: NotritionRecipePage
	updateNutrition?: boolean
}): AsyncIterableIterator<RecipeUpdateState> {
	const { notion, profile, notionPageId } = args
	const revalidate = () => {
		const keys = [
			notritionRecipePageKey(notion, notionPageId),
			notritionRecipePagesKey(notion),
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

	const pageData = await getBlockData({
		notion,
		notionPageId,
	})

	if (!cachedPage) {
		yield {
			...state,
			phase: "create",
		}

		// Page data ok. Create the page.
		cachedPage = {
			user_id: profile.id,
			notion_page_id: notionPageId,
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
		revalidate()
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
			revalidate()
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
	revalidate()

	yield {
		...state,
		phase: "done",
	}
}

async function* updatePersistedRecipePage(args: {
	notion: NotionApiClient
	profile: Profile
	notionPageId: string
	updateNotionData: boolean
	cachedPage?: NotritionRecipePage
}) {
	const { profile, notionPageId: pageId, notion } = args
	let cachedPage = args.cachedPage
	const revalidate = () => {
		trigger(`user/${profile.id}/pages`)
	}

	if (!cachedPage) {
		yield <>Fetching latest cached version</>
		const cachedPageRes = await query.notionRecipePage
			.select("*")
			.eq("notion_page_id", pageId)
			.single()

		if (!cachedPageRes.body) {
			throw new Error(`No cached page found for pageId ${pageId}`)
		}

		cachedPage = cachedPageRes.body
	}

	yield <>Fetching new data from Notion</>
	const pageData = await getBlockData({
		notion,
		notionPageId: pageId,
	})

	const pageDataJson = safeJson.stringify(pageData)
	if (pageDataJson === cachedPage.notion_data) {
		yield <>No page data changes</>
	} else {
		yield <>Saving new page data</>
		await query.notionRecipePage
			.update({
				notion_data: pageDataJson,
			})
			.eq("notion_page_id", pageId)
		revalidate()
	}

	yield <>Extracting recipe data</>
	const recipeData = extractRecipeData(pageData)
	const recipeDataJson = safeJson.stringify(recipeData)

	const cachedExtraData =
		cachedPage.extra_data && JSON.parse(cachedPage.extra_data)
	if (
		recipeDataJson === cachedPage.recipe_data &&
		cachedExtraData &&
		cachedExtraData.status !== "error"
	) {
		yield <>No recipe data changes. Not updating nutrition data.</>
		return cachedExtraData
	}

	yield <>Analyzing recipe nutrition data</>
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

	yield <>Saving new recipe and nutrition data</>
	await query.notionRecipePage
		.update({
			recipe_data: recipeDataJson,
			extra_data: JSON.stringify(extraData),
		})
		.eq("notion_page_id", pageId)
	revalidate()

	return extraData
}

function extractRecipeData({ page, children }: NotritionPageData): RecipeData {
	const recipeTitle = getPageTitle(page)
	const ingredients = getIngredientsFromBlocks({ children })
	return {
		recipeTitle,
		ingredients,
	}
}

export function CreateNotionRecipePage(props: {}) {
	const profile = useCurrentUserProfile()?.profile
	const notion = useNotionApiClient()
	const [rawPageId, setNotionPageId] = useState("")
	const notionPageId = parsePageId(rawPageId)
	const [saving, setSaving] = useState(false)
	const [result, setResult] = useState<any>()
	const [status, setStatus] = useState<ReactNode>(null)

	if (!profile) {
		return <Row>No user found. Log in?</Row>
	}

	if (!notion) {
		return <Row>Please save a Notion API key.</Row>
	}

	const handleSave = async () => {
		if (saving) {
			return
		}

		setSaving(true)
		try {
			const pageData = await getBlockData({
				notion,
				notionPageId: notionPageId,
			})

			// Page data ok. Create the page.
			const newlyCachedPage: NotritionRecipePage = {
				user_id: profile.id,
				notion_page_id: notionPageId,
				notion_data: safeJson.stringify(pageData),
				public_id: v4(),
				extra_data: null,
				recipe_data: null,
			}

			const createRes = await query.notionRecipePage.insert([newlyCachedPage])
			if (createRes.error) {
				throw createRes.error
			}

			// Start page refresh
			for await (const status of updatePersistedRecipePage({
				notion,
				profile,
				notionPageId: notionPageId,
				cachedPage: newlyCachedPage,
				updateNotionData: true,
			})) {
				setStatus(status)
			}

			setNotionPageId("")
			setResult(undefined)
		} catch (error) {
			console.log("Error from req", error)
			const { message, errno, name, stack } = error
			setResult({
				error: {
					...error,
					message,
					errno,
					name,
				},
			})
		} finally {
			setSaving(false)
			setStatus(null)
		}
	}

	// https://www.notion.so/jitl/Dawn-s-Yam-Casserole-6664ddc0a79b44a9aada13edabbd8cae

	return (
		<Row>
			<Box>
				<Row>
					<p>
						Parse a Notion page for ingredients and prepare a nutrition facts
						label. This will not modify your Notion data in any way.
					</p>
					<div>Requirements:</div>
					<ul>
						<li>Your recipe has a "Ingredients" heading</li>
						<li>
							Your ingredients are a bulleted list or checkbox list following
							the "Ingredients" heading.
						</li>
					</ul>
				</Row>
				<Row>
					<label>
						Page URL or ID
						<input
							disabled={saving}
							type="text"
							placeholder="https://www.notion.so/my-cool-recipe-241deadbeef"
							value={notionPageId}
							onChange={e => setNotionPageId((e.target as any).value)}
						/>
					</label>
				</Row>
				<Row>
					<Button disabled={saving} onClick={handleSave}>
						Analyze Notion page
					</Button>
				</Row>
				<Row>
					{status}
					{result && <JSONViewer json={result} />}
				</Row>
				<style jsx>
					{`
						label {
							font-size: 14px;
						}

						input[type="text"] {
							margin: 0px 1rem;
						}

						form {
							box-shadow: inset 0px 0px 0px 1px rgba(0, 0, 0, 0.1);
							border-radius: 3px;
							padding: 0.5rem 1rem;
						}
					`}
				</style>
			</Box>
		</Row>
	)
}

const example = "6664ddc0a79b44a9aada13edabbd8cae"

function parsePageId(idOrUrl: string): string {
	if (idOrUrl.startsWith("https://")) {
		return idOrUrl.slice(-1 * example.length)
	}

	return idOrUrl
}
