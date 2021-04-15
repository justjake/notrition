import { Auth } from "@supabase/ui"
import { useState } from "react"
import useSWR from "swr"
import { Profile } from "../lib/models"
import { getNotionPageIngredients } from "../lib/notion"
import { supabase } from "../lib/supabase"
import { Button, Row, useCurrentUserProfile } from "./Helpers"

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
