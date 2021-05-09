import { GetServerSideProps, GetStaticProps } from "next"
import { readdirSync } from "node:fs"
import { useMemo } from "react"
import {
	Nutrient,
	NutritionDisplay,
	NutritionDisplayProps,
} from "../../components/NutritionDisplay"
import { NotritionRecipePage, safeJson } from "../../lib/models"
import { query } from "../../lib/supabase"

interface RecipePageProps {
	page: NotritionRecipePage
}

export const getServerSideProps: GetServerSideProps<
	RecipePageProps,
	{ uuid: string }
> = async context => {
	const public_id = context.params?.uuid
	if (!public_id) {
		throw new Error(`Must have a page ID.`)
	}

	const res = await query.notionRecipePage
		.select("*")
		.eq("public_id", public_id)
		.single()

	if (res.error) {
		throw res.error
	}

	if (!res.body) {
		return {
			notFound: true,
		}
	}

	return {
		props: {
			page: res.body,
		},
	}
}

const RecipePage: React.FC<RecipePageProps> = props => {
	const recipePage = props.page

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

	if (!nutritionDisplayProps) {
		return null
	}

	return <NutritionDisplay {...nutritionDisplayProps} />
}

export default RecipePage
