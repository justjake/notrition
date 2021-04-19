import { Auth } from "@supabase/ui"
import {
	ButtonHTMLAttributes,
	createContext,
	CSSProperties,
	HTMLProps,
	ReactNode,
	useContext,
	useMemo,
} from "react"
import useSWR, { SWRResponse } from "swr"
import { Profile } from "../lib/models"
import { NotionApiClient } from "../lib/notion"
import { supabase } from "../lib/supabase"

export const boxShadow = {
	border: `inset 0px 0px 0px 1px rgba(0, 0, 0, 0.1)`,
}

export const fonts = {
	default: `-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif`,
}

export const colors = {
	// Notion ripoff colors:
	primaryBlue: "#57A8D7",
}

export function Row(props: {
	children: React.ReactNode
	style?: CSSProperties
}) {
	return (
		<div className="row" style={props.style}>
			{props.children}
			<style jsx>{`
				.row {
					margin: 0.5rem 0;
					max-width: 90vw;
				}
			`}</style>
		</div>
	)
}

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
	return (
		<>
			<button {...props} />
			<style jsx>{`
				button,
				input[type="submit"] {
					/* reset */
					border: none;
					font-family: ${fonts.default};
					font-size: 14px;

					/* style */
					background: ${colors.primaryBlue};
					box-shadow: inset 0px 0px 0px 1px rgba(0, 0, 0, 0.1);
					border-radius: 3px;
					padding: 0.5em 1em;
					font-weight: bold;
					color: white;
				}
			`}</style>
		</>
	)
}

const UserProfileContext = createContext<CurrentUserProfile | undefined>(
	undefined
)
UserProfileContext.displayName = "UserProfileContext"

export type CurrentUserProfile = ReturnType<typeof useCurrentUserProfileOld>

export function UserProfileProvider(props: { children: ReactNode }) {
	const { user } = Auth.useUser()
	const dbProfile = useSWR(`user:${user?.id}`, async () => {
		if (!user) {
			return
		}

		const stuff = await supabase
			.from<Profile>("profiles")
			.select("id, human_name, notion_api_key")
			.eq("id", user.id)
			.single()

		return stuff
	})

	const value: CurrentUserProfile | undefined = user
		? {
				swr: dbProfile,
				user,
				profile: dbProfile?.data?.body,
		  }
		: undefined

	return (
		<UserProfileContext.Provider value={value}>
			{props.children}
		</UserProfileContext.Provider>
	)
}

// DEPRECATED
function useCurrentUserProfileOld() {
	const { user } = Auth.useUser()
	const dbProfile = useSWR(`user:${user?.id}`, async () => {
		if (!user) {
			return
		}

		const result = await supabase
			.from<Profile>("profiles")
			.select("id, human_name, notion_api_key")
			.eq("id", user.id)
			.single()

		return result
	})

	return {
		swr: dbProfile,
		user,
		profile: dbProfile?.data?.body,
	}
}

export function useCurrentUserProfile() {
	return useContext(UserProfileContext)
}

export function useNotionApiClient() {
	const apiKey = useCurrentUserProfile()?.profile?.notion_api_key
	return useMemo(() => {
		if (apiKey) {
			return NotionApiClient.create(apiKey)
		}
	}, [apiKey])
}

export function JSONViewer(props: { json?: any; jsonString?: string | null }) {
	const { json, jsonString } = props
	const formatted = useMemo(() => {
		let value = json

		if (jsonString) {
			value = JSON.parse(jsonString)
		}

		return JSON.stringify(value, undefined, "  ")
	}, [json, jsonString])
	return (
		<code>
			<pre style={{ maxWidth: "90vw", maxHeight: "50vh", overflow: "scroll" }}>
				{formatted}
			</pre>
		</code>
	)
}

export function Box(props: { children: ReactNode; style?: CSSProperties }) {
	return (
		<>
			<div style={props.style} className="box">
				{props.children}
			</div>
			<style jsx>{`
				.box {
					border-radius: 3px;
					padding: 0.5rem 1rem;
					box-shadow: ${boxShadow.border};
				}
			`}</style>
		</>
	)
}

const SpinnerIcon = "🥬"

export function Spinner(props: {}) {
	const size = "1.1em"
	return (
		<>
			<div className="wrapper">
				<div className="loader">Loading</div>
			</div>
			<style jsx>{`
				.wrapper {
					display: inline-flex;
					vertical-align: text-bottom;
				}
				.loader {
					text-indent: -9999em;
					overflow: hidden;
					width: ${size};
					height: ${size};
					border-radius: 50%;
					background: #ffffff;
					background: conic-gradient(
						rgba(164, 164, 164, 0) 0%,
						rgba(164, 164, 164, 0) 20%,
						rgba(164, 164, 164, 1) 80%
					);
					position: relative;
					animation: spin 0.7s infinite linear;
					transform: translateZ(0);
				}
				.loader:after {
					background: white;
					width: 70%;
					height: 70%;
					border-radius: 50%;
					content: "";
					margin: auto;
					position: absolute;
					top: 0;
					left: 0;
					bottom: 0;
					right: 0;
				}
				@keyframes spin {
					0% {
						transform: rotate(0deg);
					}
					100% {
						-webkit-transform: rotate(360deg);
					}
				}
			`}</style>
		</>
	)
}
