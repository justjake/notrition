import { GetServerSideProps } from "next"
import {
	NotionAccessToken,
	sliceUserNotionAccessToken,
	UserNotionAccessToken,
} from "../lib/models"
import { routes } from "../lib/routes"
import { assertQueryOk, authCookie, query, supabase } from "../lib/supabase"
import { NotionApiClient, OAUTH_REDIRECT_URI } from "../lib/notion"
import { User } from "@supabase/supabase-js"
import React, { FC, useCallback, useEffect } from "react"
import { AuthLayout } from "../components/Layout"
import Head from "next/head"
import { boxShadow, Button, Center, Row, Spinner } from "../components/Helpers"
import Link from "@supabase/ui/dist/cjs/components/Typography/Link"
import { useRouter } from "next/router"
import { CLIENT_RENEG_WINDOW } from "node:tls"
import { v4 } from "uuid"
import { WorkspaceIcon } from "../components/NotionIntegration"
import { sendToOpener } from "../lib/popup"
import { assert } from "node:console"

type AuthorizeQueryParams = {
	state: string | undefined
	code: string | undefined
	error: string | undefined
}

type AuthorizePageProps =
	| {
			type: "oauth-error"
			error: string
	  }
	| {
			type: "logic-error"
			error: string
	  }
	| {
			type: "success"
			token: UserNotionAccessToken
	  }

async function upsertToken(args: {
	redirect_uri: string
	code: string
	user: User
}) {
	const { redirect_uri, code, user } = args
	const {
		access_token,
		bot_id,
		workspace_icon,
		workspace_name,
	} = await NotionApiClient.createToken({ redirect_uri, code })

	const existing = await query.notionAccessToken
		.select("*")
		.eq("bot_id", bot_id)
		.eq("user_id", user.id)
	assertQueryOk(existing)

	const existingId = existing.body[0]?.id

	const result = await query.notionAccessToken.upsert({
		id: existingId || v4(),
		user_id: user.id,
		access_token,
		bot_id,
		workspace_icon,
		workspace_name,
	})
	assertQueryOk(result)
	return result.body[0]
}

export const getServerSideProps: GetServerSideProps<AuthorizePageProps> = async context => {
	const user = await authCookie(context.req)
	if (!user) {
		return {
			redirect: {
				destination: routes.login({ authView: "sign_in" }),
				permanent: false,
			},
		}
	}

	const redirect_uri = OAUTH_REDIRECT_URI

	// Notion OAuth error
	const error = context.query.error
	if (error) {
		return {
			props: {
				type: "oauth-error",
				error: String(error),
			},
		}
	}

	// Notion OAuth code
	const code = context.query.code
	if (typeof code === "string") {
		try {
			const token = await upsertToken({
				code,
				redirect_uri,
				user,
			})

			return {
				props: {
					type: "success",
					token: sliceUserNotionAccessToken(token),
				},
			}
		} catch (error) {
			console.error("OAuth Error", error)
			return {
				props: {
					type: "logic-error",
					error: error.message,
				},
			}
		}
	}

	return {
		props: {
			type: "logic-error",
			error: "Access code missing. Try again.",
		},
	}
}

const AuthorizePage: React.FC<AuthorizePageProps> = props => {
	const router = useRouter()
	const close = useCallback(() => {
		if (sendToOpener({ type: "authorized" })) {
			window.close()
		} else {
			router.push(routes.connections())
		}
	}, [router])
	useEffect(() => {
		if (props.type === "success") {
			const timeout = setTimeout(() => close(), 1500)
			return () => clearTimeout(timeout)
		}
	}, [props.type, close])

	const title = props.type === "success" ? "Authorized" : "OAuth Error"
	const back = (
		<Row>
			<Button onClick={close}>Close</Button>
		</Row>
	)

	return (
		<AuthLayout htmlTitle={`Notrition - ${title}`} title={title}>
			<Center>
				{props.type === "success" ? (
					<>
						<Row>
							<WorkspaceIcon size={128} url={props.token.workspace_icon} />
						</Row>
						<Row>
							✅ Linking {props.token.workspace_name} <Spinner />
						</Row>
					</>
				) : (
					<>
						<Row>❌ {props.error}</Row>
						{back}
					</>
				)}
			</Center>
		</AuthLayout>
	)
}

export default AuthorizePage
