/**
 * List connections
 */

import Link from "@supabase/ui/dist/cjs/components/Typography/Link"
import { GetServerSideProps } from "next"
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

const ConnectionsIndexPage: React.FC<ConnectionsIndexProps> = props => {
	const { accessTokens } = props
	return (
		<Layout header={<LayoutHeader />} footer={<LayoutFooter />}>
			<LayoutRow>
				<h1>Connections</h1>
				<p>
					Connect to your Notion workspaces so Notrition can find your recipes.
				</p>
				<p>
					<Link target="_blank" href={"TODO:oauth"}>
						<a>
							<Button>Connection Notion workspace</Button>
						</a>
					</Link>
				</p>
			</LayoutRow>
			<LayoutRow>
				<AccessTokensList accessTokens={accessTokens} />
			</LayoutRow>
		</Layout>
	)
}

export default ConnectionsIndexPage
