/**
 * List connections
 */

import Link from "@supabase/ui/dist/cjs/components/Typography/Link"
import { GetServerSideProps } from "next"
import { useRouter } from "next/router"
import { CLIENT_RENEG_WINDOW } from "node:tls"
import { useCallback, useEffect } from "react"
import { Box, Button, Row } from "../../components/Helpers"
import {
	Layout,
	LayoutFooter,
	LayoutHeader,
	LayoutRow,
} from "../../components/Layout"
import { useAccessTokens } from "../../components/NotionAccessTokenContext"
import { WorkspaceIcon } from "../../components/NotionIntegration"
import {
	UserNotionAccessToken,
	UserNotionAccessTokenColumns,
} from "../../lib/models"
import { NotionApiClient } from "../../lib/notion"
import { openPopUp, usePopupMessageListener } from "../../lib/popup"
import { routes } from "../../lib/routes"
import { assertQueryOk, authCookie, query } from "../../lib/supabase"

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
				<WorkspaceIcon size={48} url={accessToken.workspace_icon} />
				{accessToken.workspace_name}
			</Row>
		</Box>
	)
}

const ConnectionsIndexPage: React.FC<{}> = props => {
	const { tokens, swr } = useAccessTokens()

	const handleConnect = useCallback(() => {
		openPopUp({
			target: "notion-oauth",
			url: NotionApiClient.getOathUrl(),
		})
	}, [])

	const handleAuthorized = useCallback(() => swr?.revalidate(), [swr])
	usePopupMessageListener(handleAuthorized)

	return (
		<Layout
			htmlTitle="Notrition - Connections"
			header={<LayoutHeader />}
			footer={<LayoutFooter />}
		>
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
				<AccessTokensList accessTokens={tokens} />
			</LayoutRow>
		</Layout>
	)
}

export default ConnectionsIndexPage
