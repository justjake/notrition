import { Auth } from "@supabase/ui"
import Head from "next/head"
import { useRouter } from "next/router"
import React, { useEffect, useMemo } from "react"
import { Box, Row, useCurrentUserProfile } from "../components/Helpers"
import { LayoutHeader, LogoEmojis } from "../components/Layout"
import { notrition } from "../lib/notrition"
import { routes } from "../lib/routes"
import {
	getAuthViewType,
	supabase,
	SupabaseAuthViewType,
} from "../lib/supabase"

function getAuthViewTitle(view: SupabaseAuthViewType | undefined): string {
	switch (view) {
		case "forgotten_password":
			return "Reset Password"
		case "sign_up":
			return "Sign Up"
		default:
			return "Sign In"
	}
}

// https://github.com/supabase/supabase/blob/c9ec7c151088519abe0ac6ff66313d69f3f0fa36/examples/nextjs-with-supabase-auth/pages/index.js#L10
export default function LoginPage(props: {}) {
	const user = useCurrentUserProfile()
	const router = useRouter()
	const authView = getAuthViewType(router.query["action"])
	const setAuthView = (authView: SupabaseAuthViewType) => {
		router.push(routes.login({ authView }))
	}

	useEffect(() => {
		if (!user || authView) {
			return
		}

		// Once the user is populated, do a redirect.
		const timeout = setTimeout(() => {
			router.push(routes.default())
		}, 1000)

		return () => clearTimeout(timeout)
	}, [user, router, authView])

	let action = (
		<div className="center-child">
			<p>Logged in.</p>
		</div>
	)

	if (!user) {
		action = <Auth view={authView} supabaseClient={supabase} />
	}

	if (authView === "forgotten_password") {
		action = (
			<Auth.ForgottenPassword
				setAuthView={setAuthView}
				supabaseClient={supabase}
			/>
		)
	}

	const title = getAuthViewTitle(authView)
	return (
		<>
			<Head>
				<title>Notrition - {title}</title>
			</Head>
			<div className="login-container center-child">
				<div className="login-box">
					<Box
						style={{
							minHeight: "42vh",
							display: "flex",
							flexDirection: "column",
						}}
					>
						<Row>
							<h1 className="login-header">
								<LogoEmojis fontSize="1em" />
								<span className="login-sep"> • </span>
								{title}
							</h1>
						</Row>
						<Row
							style={{ display: "flex", flexGrow: 1, flexDirection: "column" }}
						>
							{action}
						</Row>
					</Box>
				</div>
			</div>
			<style jsx>{`
				.center-child {
					display: flex;
					justify-content: center;
					align-items: center;
					height: 100%;
					flex-grow: 1;
				}

				.login-container {
					width: 100vw;
					height: 100vh;
				}

				.login-box {
					max-width: 100%;
					width: 560px;
				}

				.login-header {
					margin: 0;
					font-size: inherit;
				}

				.login-sep {
					margin: 0 0.5em;
				}
			`}</style>
		</>
	)
}
