import React from "react"
import { LayoutHeader, LayoutRow } from "../../components/Layout"
import {
	CreateNotionRecipePage,
	NotionRecipePageList,
} from "../../components/NotionRecipeExtractor"

export default function RecipesPage(props: {}) {
	return (
		<>
			<LayoutHeader />
			<LayoutRow>
				<CreateNotionRecipePage />
				<NotionRecipePageList />
			</LayoutRow>
		</>
	)
}
