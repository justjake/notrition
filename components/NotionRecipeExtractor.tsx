import React, { ReactNode, useCallback, useMemo, useState } from "react"
import { SWRResponse, trigger } from "swr"
import {
	NotionPageData as NotritionPageData,
	NotritionRecipePage as NotritionRecipePage,
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
import { Box, Button, JSONViewer, Row, useCurrentUserProfile } from "./Helpers"
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
import { useAsyncGeneratorState } from "../lib/useAsyncGeneratorState"
import { upsertNotritionRecipePage } from "../lib/upsertRecipePage"
import { RecipePageUpdateProgress } from "./RecipePageUpdateProgress"
import { useAccessTokens, useNotionApiClient } from "./NotionAccessTokenContext"

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
	const { recipePage, profile, swr } = props
	const notion = useNotionApiClient(recipePage.notion_access_token_id)
	const [updateState, trackUpdate] = useAsyncGeneratorState(
		upsertNotritionRecipePage
	)

	async function handleRefresh() {
		if (updateState.isRunning || !notion) {
			return
		}

		trackUpdate(
			upsertNotritionRecipePage({
				notionPageId: recipePage.notion_page_id,
				access: {
					accessTokenId: recipePage.notion_access_token_id,
				},
				profile,
				cachedPage: recipePage,
				updateNutrition: true,
			})
		)
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
				{(updateState.isRunning || updateState.error) && (
					<Row>
						<RecipePageUpdateProgress state={updateState} />
					</Row>
				)}
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

export function CreateNotionRecipePage(props: {}) {
	const profile = useCurrentUserProfile()?.profile
	const { tokens } = useAccessTokens()
	const [rawPageId, setNotionPageId] = useState("")
	const notionPageId = parsePageId(rawPageId)
	const [saveState, trackSaveState] = useAsyncGeneratorState(
		upsertNotritionRecipePage
	)

	if (!profile) {
		return (
			<Row>
				No user found.{" "}
				<Link href={routes.login()}>
					<a>Log in</a>
				</Link>
			</Row>
		)
	}

	if (!tokens.length) {
		return (
			<Row>
				Please{" "}
				<Link href={routes.connections()}>
					<a>connect a workspace</a>
				</Link>
				.
			</Row>
		)
	}

	const handleSave = async () => {
		if (saveState.isRunning) {
			return
		}
		trackSaveState(
			upsertNotritionRecipePage({
				notionPageId: notionPageId,
				access: {
					possibleAccessTokenIds: tokens.map(({ id }) => id),
				},
				profile,
				updateNutrition: false,
			})
		)
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
							disabled={saveState.isRunning}
							type="text"
							placeholder="https://www.notion.so/my-cool-recipe-241deadbeef"
							value={notionPageId}
							onChange={e => setNotionPageId((e.target as any).value)}
						/>
					</label>
				</Row>
				<Row>
					<Button disabled={saveState.isRunning} onClick={handleSave}>
						Analyze Notion page
					</Button>
				</Row>
				<Row>
					<RecipePageUpdateProgress state={saveState} showDone />
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
