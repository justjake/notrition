import { Auth } from "@supabase/ui"
import Head from "next/head"
import Link from "next/link"
import { useRouter } from "next/router"
import React, { useEffect, useMemo } from "react"
import {
	Box,
	Center,
	Row,
	Spinner,
	useCurrentUserProfile,
} from "../components/Helpers"
import { AuthLayout, LayoutHeader, LogoEmojis } from "../components/Layout"
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
			return "Log In"
	}
}

// https://github.com/supabase/supabase/blob/c9ec7c151088519abe0ac6ff66313d69f3f0fa36/examples/nextjs-with-supabase-auth/pages/index.js#L10
export default function LoginPage(props: {}) {
	const user = useCurrentUserProfile()
	const router = useRouter()
	const authView = getAuthViewType(router.query["action"])
	const setAuthView = (authView: SupabaseAuthViewType | undefined) => {
		router.replace(routes.login({ authView }))
	}

	useEffect(() => {
		const { data: authListener } = supabase.auth.onAuthStateChange(event => {
			if (event === "USER_UPDATED") {
				setAuthView(undefined)
			}
		})

		return () => authListener?.unsubscribe()
	}, [authView, router])

	useEffect(() => {
		if (!user || authView === "forgotten_password") {
			return
		}

		// Once the user is populated, do a redirect.
		const timeout = setTimeout(() => {
			router.push(routes.default())
		}, 1000)

		return () => clearTimeout(timeout)
	}, [user, router, authView])

	let action = (
		<Center>
			<Spinner />
			<p style={{ marginLeft: "1em" }}>Authenticating...</p>
		</Center>
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
		<AuthLayout title={title}>
			<Head>
				<title>Notrition - {title}</title>
			</Head>
			{action}
		</AuthLayout>
	)
}
