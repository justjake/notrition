import React from "react"
import {
	Layout,
	LayoutFooter,
	LayoutHeader,
	LayoutRow,
} from "../components/Layout"

export default function LegalPage(props: {}) {
	return (
		<Layout
			htmlTitle="Privacy & Terms"
			header={<LayoutHeader />}
			footer={<LayoutFooter />}
		>
			<LayoutRow>
				<h1>Terms of Use</h1>
				<p>
					This is alpha-quality software. We may do anything with your content
					and Notion access. Handle with care!
				</p>
				<h1>Privacy Policy</h1>
				<p>
					This is alpha-quality software. We may do anything with your content
					and Notion access. Handle with care!
				</p>
			</LayoutRow>
		</Layout>
	)
}
