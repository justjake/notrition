import { AuthSession, AuthChangeEvent } from "@supabase/supabase-js"
import { resolveHref } from "next/dist/next-server/lib/router/router"
import fetch, { Headers } from "node-fetch"
import { supabase } from "./supabase"

export class NotritionClient {
	async auth(event: AuthChangeEvent, session: AuthSession | null) {
		const res = await fetch("/api/auth", {
			method: "POST",
			headers: new Headers({
				"Content-Type": "application/json",
			}),
			body: JSON.stringify({ event, session }),
		})

		return res.json()
	}

	// https://github.com/supabase/supabase/blob/c9ec7c151088519abe0ac6ff66313d69f3f0fa36/examples/nextjs-with-supabase-auth/pages/index.js#L10
	headers() {
		const token = supabase.auth.session()?.access_token
		if (!token) {
			throw new Error("No session")
		}

		return new Headers({
			"Content-Type": "application/json",
			token: token,
		})
	}

	async fetch(method: "GET" | "POST" | "DELETE", path: string, body?: object) {
		if (!path.startsWith("/api/")) {
			throw new Error(`Invalid api path: ${path}`)
		}

		const res = await fetch(path, {
			method,
			headers: this.headers(),
			body: JSON.stringify(body),
		})

		return res.json()
	}
}

export const notrition = new NotritionClient()
