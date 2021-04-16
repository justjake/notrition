import React, { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { useCurrentUserProfile } from "../components/Helpers"
import { NutritionDisplay } from "../components/NutritionDisplay"
import { supabase } from "../lib/supabase"
import { NotionRecipePage, Profile } from "../lib/models"

type Nutrient = {
	label: string
	quantity: number
	unit: string
}

export default function Nutrition() {
	const profile = useCurrentUserProfile()?.profile

	const [recipeName, setRecipeName] = useState<string>("")
	const [nutrients, setNutrients] = useState<Array<Nutrient>>([])

	const router = useRouter()

	useEffect(() => {
		if (!router.isReady) return

		async function getUserId() {
			const pageId = router.query.pageId as string
			if (!profile) {
				return
			}
			const result = await supabase
				.from<NotionRecipePage>("notion_recipe_page")
				.select("extra_data")
				.eq("notion_page_id", pageId)
				.eq("user_id", profile.id)
				.single()
			if (result.error) {
				console.log(result.error)
				return
			}

			if (result.body.extra_data) {
				parseEdamamData(result.body.extra_data)
			}
		}
		getUserId()
	}, [router.isReady, profile])

	if (!router.query.pageId) {
		return <div>No page ID found.</div>
	}

	const parseEdamamData = (edamamData: string) => {
		const edamamJson = JSON.parse(edamamData)
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
		setNutrients(parsedNutrients)
	}

	return <NutritionDisplay recipeName={recipeName} nutrients={nutrients} />
}
