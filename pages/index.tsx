import Head from "next/head"
import React from "react"
import { UserLogin } from "../components/UserSettings"
import {
	CreateNotionRecipePage,
	NotionRecipePageList,
} from "../components/NotionRecipeExtractor"
import {
	Button,
	Center,
	colors,
	useCurrentUserProfile,
} from "../components/Helpers"
import Link from "next/link"
import { routes } from "../lib/routes"
import { Layout, LayoutFooter, LayoutHeader } from "../components/Layout"

function Emojis(props: {}) {
	return (
		<>
			<span>🥬 🍜 🍲 🍠</span>
			<style jsx>{`
				span {
					font-size: 3em;
					letter-spacing: -0.3em;
				}
			`}</style>
		</>
	)
}

export default function Home() {
	const user = useCurrentUserProfile()
	return (
		<Layout footer={<LayoutFooter />} header={<LayoutHeader hideNav={!user} />}>
			<Head>
				<title>Notrition - Nutrition & Recipes for Notion</title>
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<Center>
				<div style={{ padding: "5rem 0" }}>
					<Center column>
						<h1 className="title">
							<Emojis />
						</h1>
						<h1 className="title">Notrition</h1>

						<p className="description">Add nutrition & recipe info to Notion</p>

						{user ? (
							<>
								<CreateNotionRecipePage />
								<NotionRecipePageList />
							</>
						) : (
							<Link href={routes.login({ authView: "sign_up" })}>
								<Button>Sign Up</Button>
							</Link>
						)}
					</Center>
				</div>
			</Center>
			<style jsx>{`
				.title {
					margin: 0;
					line-height: 1.15;
					font-size: 4rem;
				}

				.description {
					text-align: center;
					line-height: 1.5;
					font-size: 1.5rem;
				}
			`}</style>
		</Layout>
	)
}
