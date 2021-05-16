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
		<Layout header={<LayoutHeader />} footer={<LayoutFooter />}>
			<LayoutRow>
				<CreateNotionRecipePage />
				<NotionRecipePageList />
			</LayoutRow>
		</Layout>
	)
}
