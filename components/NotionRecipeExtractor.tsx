import { Auth } from "@supabase/ui"
import { Response } from "node-fetch"
import React, { ReactNode, useState } from "react"
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
} from "./Helpers"

function JSONViewer(props: { json: any }) {
	const asString = JSON.stringify(props.json, undefined, "  ") || "undefined"
	return (
		<code>
			<pre>{asString}</pre>
		</code>
	)
}

function Box(props: { children: ReactNode }) {
	return (
		<>
			<div className="box">{props.children}</div>
			<style jsx>{`
				.box {
					border-radius: 3px;
					padding: 0.5rem 1rem;
					box-shadow: ${boxShadow.border};
				}
			`}</style>
		</>
	)
}

export function NotionRecipePageList(props: {}) {
	const { profile } = useCurrentUserProfile()

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
		// TODO: stuff.
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
				<Box>
					<JSONViewer json={recipePage.notion_data} />
				</Box>
			</Row>
			<Row>
				<Box>
					<JSONViewer json={recipePage.recipe_data} />
				</Box>
			</Row>
			<Row>
				<Box>
					<JSONViewer json={recipePage.extra_data} />
				</Box>
			</Row>
		</Box>
	)
}

export function CreateNotionRecipePage(props: {}) {
	const { profile } = useCurrentUserProfile()
	const [notionPageId, setNotionPageId] = useState<string>()
	const [saving, setSaving] = useState(false)
	const [result, setResult] = useState<any>()

	if (!profile) {
		return <Row>No profile found. Log in?</Row>
	}

	const handleSave = async () => {
		if (saving) {
			return
		}

		setSaving(true)
		try {
			if (!profile.notion_api_key) {
				throw "Please save a Notion API key first."
			}

			const notionRes = await notionApiRequest({
				method: "GET",
				path: `/blocks/${notionPageId}`,
				notionApiToken: profile.notion_api_key,
			})

			if (!notionRes.ok) {
				throw notionRes
			}

			const pageData = parseNotionJson(await notionRes.json())

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
	const { profile } = useCurrentUserProfile()
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
