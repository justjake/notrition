/**
 * List connections
 */

import Link from "@supabase/ui/dist/cjs/components/Typography/Link"
import { GetServerSideProps } from "next"
import { useRouter } from "next/router"
import { CLIENT_RENEG_WINDOW } from "node:tls"
import { useEffect } from "react"
import { Box, Button, Row } from "../../components/Helpers"
import {
	Layout,
	LayoutFooter,
	LayoutHeader,
	LayoutRow,
} from "../../components/Layout"
import {
	UserNotionAccessToken,
	UserNotionAccessTokenColumns,
} from "../../lib/models"
import { NotionApiClient } from "../../lib/notion"
import { routes } from "../../lib/routes"
import { assertQueryOk, authCookie, query } from "../../lib/supabase"

interface ConnectionsIndexProps {
	accessTokens: UserNotionAccessToken[]
}

export const getServerSideProps: GetServerSideProps<ConnectionsIndexProps> = async context => {
	const user = await authCookie(context.req)
	if (!user) {
		return {
			redirect: {
				statusCode: 302,
				destination: routes.login(),
			},
		}
	}

	const accessTokens = await query.notionAccessToken
		.select(Object.keys(UserNotionAccessTokenColumns).join(","))
		.eq("user_id", user.id)
		.order("inserted_at")
	assertQueryOk(accessTokens)

	return {
		props: { accessTokens: accessTokens.body },
	}
}

const AccessTokensList: React.FC<{
	accessTokens: UserNotionAccessToken[]
}> = props => {
	return (
		<>
			{props.accessTokens.map(token => (
				<AccessTokenView key={token.id} accessToken={token} />
			))}
		</>
	)
}

const AccessTokenView: React.FC<{
	accessToken: UserNotionAccessToken
}> = props => {
	const { accessToken } = props
	return (
		<Box>
			<Row>
				{accessToken.workspace_icon && <img src={accessToken.workspace_icon} />}{" "}
				{accessToken.workspace_name}
			</Row>
		</Box>
	)
}

const TARGET = "notion_oauth_window"
const OAUTH_AUTHORIZED_MESSAGE = "notion_oauth_complete"

const ConnectionsIndexPage: React.FC<ConnectionsIndexProps> = props => {
	const { accessTokens } = props
	const router = useRouter()
	function handleConnect() {
		const width = 500
		const height = Math.min(window.screen.availHeight - 100, 700)
		const features = {
			width,
			height,
			left: window.screen.availWidth / 2 - width / 2,
			top: window.screen.availHeight / 2 - height / 2,
			location: "no",
		}
		const newWindow = window.open(
			NotionApiClient.getOathUrl(),
			TARGET,
			Object.entries(features)
				.map(([k, v]) => `${k}=${v}`)
				.join(",")
		)
		newWindow?.focus()
	}

	useEffect(() => {
		function handleMessage(message: MessageEvent) {
			if (message.origin !== window.location.origin) {
				return
			}

			if (message.data === "authorized") {
				router.reload()
			}
		}
		window.addEventListener("message", handleMessage)
		return () => window.removeEventListener("message", handleMessage)
	})

	return (
		<Layout header={<LayoutHeader />} footer={<LayoutFooter />}>
			<LayoutRow>
				<h1>Connections</h1>
				<p>
					Connect to your Notion workspaces so Notrition can find your recipes.
				</p>
				<p>
					<Button onClick={handleConnect}>Connection Notion workspace</Button>
				</p>
			</LayoutRow>
			<LayoutRow>
				<AccessTokensList accessTokens={accessTokens} />
			</LayoutRow>
		</Layout>
	)
}

export default ConnectionsIndexPage
