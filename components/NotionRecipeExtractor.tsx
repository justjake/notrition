import { Alert, Auth } from "@supabase/ui"
import { Response } from "node-fetch"
import React, { ReactNode, useMemo, useState } from "react"
import useSWR, { SWRResponse } from "swr"
import { NotionRecipePage, Profile } from "../lib/models"
import {
	getNotionPageIngredients,
	notionApiRequest,
	parseNotionJson,
} from "../lib/notion"
import { supabase } from "../lib/supabase"
import {
	boxShadow,
	Button,
	CurrentUserProfile,
	Row,
	useCurrentUserProfile,
	useNotionApiClient,
} from "./Helpers"

function JSONViewer(props: { json?: any; jsonString?: string | null }) {
	const { json, jsonString } = props
	const formatted = useMemo(() => {
		let value = json

		if (jsonString) {
			value = JSON.parse(jsonString)
		}

		return JSON.stringify(value, undefined, "  ")
	}, [json, jsonString])
	return (
		<code>
			<pre style={{ maxWidth: "90vw", maxHeight: "50vh", overflow: "scroll" }}>
				{formatted}
			</pre>
		</code>
	)
}

function Box(props: { children: ReactNode }) {
	return (
		<>
			<div className="box">{props.children}</div>
			<style jsx>{`
				.box {
					font-size: 0.875rem
					border-radius: 3px;
					padding: 0.5rem 1rem;
					box-shadow: ${boxShadow.border};
				}
			`}</style>
		</>
	)
}

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
	const { recipePage, profile, swr } = props

	async function handleRefresh() {
		if (!profile.notion_api_key) {
			throw "no api key"
		}

		const pageData = await getBlockData({
			pageId: recipePage.notion_page_id,
			notionApiToken: profile.notion_api_key,
		})

		const newPageJson = JSON.stringify(pageData)
		if (newPageJson === recipePage.notion_data) {
			throw "No changes"
		}

		const res = await supabase
			.from<NotionRecipePage>("notion_recipe_page")
			.update({
				notion_data: JSON.stringify(pageData),
			})
			.eq("notion_page_id", recipePage.notion_page_id)
			.single()

		console.log(res)
		swr.revalidate()
	}

	const withoutDashes = recipePage.notion_page_id.replace(/-/g, "")

	return (
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
	)
}

async function getBlockData(args: { pageId: string; notionApiToken: string }) {
	const { pageId, notionApiToken } = args
	const notionRes = await notionApiRequest({
		method: "GET",
		path: `/blocks/${pageId}/children`,
		notionApiToken,
	})
	const children = parseNotionJson(await notionRes.json())

	const pageRes = await notionApiRequest({
		method: "GET",
		path: `/pages/${pageId}`,
		notionApiToken,
	})
	const page = parseNotionJson(await pageRes.json())

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
				pageId: notionPageId,
				notionApiToken: notion.apiKey,
			})

			console.log("page data", pageData)

			// Page data was ok.
			const result = await supabase
				.from<NotionRecipePage>("notion_recipe_page")
				.insert([
					{
						notion_page_id: notionPageId,
						user_id: profile.id,
						notion_data: JSON.stringify(pageData),
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
