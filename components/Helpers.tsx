import { Auth } from "@supabase/ui"
import {
	ButtonHTMLAttributes,
	createContext,
	HTMLProps,
	ReactNode,
	useContext,
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

export function Row(props: { children: React.ReactNode }) {
	return (
		<div className="row">
			{props.children}
			<style jsx>{`
				.row {
					margin: 0.5rem 0;
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
	if (apiKey) {
		return NotionApiClient.create(apiKey)
	}
}
