import { Alert, Auth } from "@supabase/ui"
import { Response } from "node-fetch"
import React, { ReactNode, useMemo, useState } from "react"
import useSWR, { SWRResponse } from "swr"
import { NotionRecipePage, Profile, safeJson } from "../lib/models"
import {
	getNotionPageIngredients,
	NotionApiClient,
	notionApiRequest,
	parseNotionJson,
} from "../lib/notion"
import { supabase } from "../lib/supabase"
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

	async function handleRefresh() {
		if (!notion) {
			throw "no api key"
		}

		const pageData = await getBlockData({
			pageId: recipePage.notion_page_id,
			notion,
		})

		const newPageJson = JSON.stringify(pageData)
		if (newPageJson === recipePage.notion_data) {
			throw "No changes"
		}

		const res = await supabase
			.from<NotionRecipePage>("notion_recipe_page")
			.update({
				notion_data: safeJson.stringify(pageData),
			})
			.eq("notion_page_id", recipePage.notion_page_id)
			.single()

		console.log(res)
		swr.revalidate()
	}

	const withoutDashes = recipePage.notion_page_id.replace(/-/g, "")

	return (
		<Row>
			<Box>
				<Row>
					<a href={`https://www.notion.so/${withoutDashes}`} target="_blank">
						Visit Notion page {recipePage.notion_page_id}
					</a>
				</Row>
				<Row>
					<Button onClick={handleRefresh}>Refresh</Button>
				</Row>
				<Row>
					<Row>Notion data</Row>
					<Box>
						<JSONViewer jsonString={recipePage.notion_data} />
					</Box>
				</Row>
				<Row>
					<Row>Recipe data</Row>
					<Box>
						<JSONViewer jsonString={recipePage.recipe_data} />
					</Box>
				</Row>
				<Row>
					<Row>Extra data</Row>
					<Box>
						<JSONViewer jsonString={recipePage.extra_data} />
					</Box>
				</Row>
			</Box>
		</Row>
	)
}

async function getBlockData(args: { pageId: string; notion: NotionApiClient }) {
	const { pageId, notion } = args
	const page = await notion.getPage(pageId)
	const children = await notion.getChildren(pageId)
	return { page, children }
}

export function CreateNotionRecipePage(props: {}) {
	const profile = useCurrentUserProfile()?.profile
	const notion = useNotionApiClient()
	const [notionPageId, setNotionPageId] = useState("")
	const [saving, setSaving] = useState(false)
	const [result, setResult] = useState<any>()

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

			console.log("page data", pageData)

			// Page data was ok.
			const result = await supabase
				.from<NotionRecipePage>("notion_recipe_page")
				.insert([
					{
						notion_page_id: notionPageId,
						user_id: profile.id,
						notion_data: safeJson.stringify(pageData),
					},
				])

			if (result.error) {
				throw result.error
			}

			setNotionPageId("")
			setResult({ success: result.body })
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
		}
	}

	return (
		<div>
			<Row>
				<input
					disabled={saving}
					type="text"
					placeholder="page id"
					value={notionPageId}
					onChange={e => setNotionPageId((e.target as any).value)}
				/>
			</Row>
			<Row>
				<Button disabled={saving} onClick={handleSave}>
					Create new page!
				</Button>
			</Row>
			<Row>
				<pre>
					<code>{JSON.stringify(result, null, "  ")}</code>
				</pre>
			</Row>
		</div>
	)
}

export function NotionRecipeExtractor(props: {}) {
	const profile = useCurrentUserProfile()?.profile
	const [notionPageId, setNotionPageId] = useState<string>()
	const [result, setResult] = useState<any>()

	async function handleExtract() {
		try {
			if (!notionPageId) {
				throw "Enter a page ID."
			}

			const apiKey = profile?.notion_api_key
			if (!apiKey) {
				throw "You didn't save your Notion API key."
			}

			const ingredients = await getNotionPageIngredients({
				pageId: notionPageId,
				notionApiToken: apiKey,
			})

			setResult({ success: ingredients })
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
		}
	}

	if (!profile) {
		return <Row>No profile found. Log in?</Row>
	}

	return (
		<div>
			<Row>
				<input
					type="text"
					placeholder="page id"
					value={notionPageId}
					onChange={e => setNotionPageId((e.target as any).value)}
				/>
			</Row>
			<Row>
				<Button onClick={handleExtract}>Extract!</Button>
			</Row>
			<Row>
				<pre>
					<code>{JSON.stringify(result, null, "  ")}</code>
				</pre>
			</Row>
		</div>
	)
}
