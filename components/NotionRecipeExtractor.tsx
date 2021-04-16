import { Alert, Auth } from "@supabase/ui"
import { Response } from "node-fetch"
import React, { ReactNode, useEffect, useMemo, useState } from "react"
import useSWR, { SWRResponse, trigger } from "swr"
import {
	NotionPageData,
	NotionRecipePage,
	Profile,
	RecipeData,
	safeJson,
} from "../lib/models"
import {
	getIngredientsFromBlocks,
	getPageTitle,
	NotionApiClient,
	notionApiRequest,
	parseNotionJson,
} from "../lib/notion"
import { query, supabase } from "../lib/supabase"
import nutritionFacts from "../pages/api/nutritionFacts"
import {
	Box,
	boxShadow,
	Button,
	CurrentUserProfile,
	JSONViewer,
	Row,
	useCurrentUserProfile,
	useNotionApiClient,
} from "./Helpers"
import fetch from "node-fetch"
import Link from "next/link"
import { SupabaseClient } from "@supabase/supabase-js"
import {
	Nutrient,
	NutritionDisplay,
	NutritionDisplayProps,
} from "./NutritionDisplay"

export function NotionRecipePageList(props: {}) {
	const profile = useCurrentUserProfile()?.profile

	const pageList = useSWR(`user/${profile?.id}/pages`, async () => {
		if (!profile) {
			return
		}

		return await supabase
			.from<NotionRecipePage>("notion_recipe_page")
			.select("*")
			.eq("user_id", profile.id)
	})

	if (!pageList.data || !profile) {
		return null
	}

	if (pageList.data.body === null) {
		return <Row>No pages.</Row>
	}

	return (
		<>
			{pageList.data.body.map(recipePage => {
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
	recipePage: NotionRecipePage
}) {
	const notion = useNotionApiClient()
	const { recipePage, swr } = props
	const [refreshStatus, setRefreshStatus] = useState<ReactNode>()

	async function handleRefresh() {
		try {
			if (!notion) {
				throw new Error("No API key configured.")
			}

			for await (const status of updatePersistedRecipePage({
				notion,
				pageId: recipePage.notion_page_id,
				profile: props.profile,
				cachedPage: recipePage,
			})) {
				setRefreshStatus(status)
			}
			setRefreshStatus(null)
		} catch (error) {
			const { message, name, ...rest } = error
			const json = {
				...rest,
				message,
				name,
			}
			setRefreshStatus(
				<>
					<Row>An error occured refreshing recipe data:</Row>
					<Row>
						<JSONViewer json={json} />
					</Row>
				</>
			)
		}
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

	const withoutDashes = recipePage.notion_page_id.replace(/-/g, "")

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
						<Link
							href={{
								pathname: "/nutrition",
								query: { pageId: recipePage.notion_page_id },
							}}
						>
							<a target="_blank">Open standaline label</a>
						</Link>
					</Button>
					<Button style={{ marginRight: "1em" }}>
						<a href={`https://www.notion.so/${withoutDashes}`} target="_blank">
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

async function getBlockData(args: {
	pageId: string
	notion: NotionApiClient
}): Promise<NotionPageData> {
	const { pageId, notion } = args
	const page = await notion.getPage(pageId)
	const children = await notion.getChildren(pageId)
	return { page, children }
}

async function* updatePersistedRecipePage(args: {
	notion: NotionApiClient
	profile: Profile
	pageId: string
	cachedPage?: NotionRecipePage
}) {
	const { profile, pageId, notion } = args
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
		pageId,
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

function extractRecipeData({ page, children }: NotionPageData): RecipeData {
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
				pageId: notionPageId,
			})

			// Page data ok. Create the page.
			const newlyCachedPage: NotionRecipePage = {
				user_id: profile.id,
				notion_page_id: notionPageId,
				notion_data: safeJson.stringify(pageData),
				recipe_data: null,
				extra_data: null,
			}

			const createRes = await query.notionRecipePage.insert([newlyCachedPage])
			if (createRes.error) {
				throw createRes.error
			}

			// Start page refresh
			for await (const status of updatePersistedRecipePage({
				notion,
				profile,
				pageId: notionPageId,
				cachedPage: newlyCachedPage,
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
					<input
						disabled={saving}
						type="text"
						placeholder="Page URL or ID"
						value={notionPageId}
						onChange={e => setNotionPageId((e.target as any).value)}
					/>
				</Row>
				<Row>
					<Button disabled={saving} onClick={handleSave}>
						Analyze Notion page
					</Button>
				</Row>
				<Row>
					{status}
					<JSONViewer json={result} />
				</Row>
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
