import React from "react"
import {
	Layout,
	LayoutFooter,
	LayoutHeader,
	LayoutRow,
} from "../../components/Layout"
import {
	CreateNotionRecipePage,
	NotionRecipePageList,
} from "../../components/NotionRecipeExtractor"

export default function RecipesPage(props: {}) {
	return (
		<Layout
			htmlTitle="Notrition - Recipes"
			header={<LayoutHeader />}
			footer={<LayoutFooter />}
		>
			<LayoutRow>
				<h1>Recipes</h1>
				<CreateNotionRecipePage />
				<NotionRecipePageList />
			</LayoutRow>
		</Layout>
	)
}
