import { Auth } from "@supabase/ui"
import { ButtonHTMLAttributes, HTMLProps } from "react"
import useSWR from "swr"
import { Profile } from "../lib/models"
import { supabase } from "../lib/supabase"

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

export function useCurrentUserProfile() {
	const { user } = Auth.useUser()
	const dbProfile = useSWR(user?.id, async id => {
		if (!id) {
			return
		}

		const stuff = await supabase
			.from<Profile>("profiles")
			.select("id, human_name, notion_api_key")
			.eq("id", id)
			.single()

		return stuff
	})

	return {
		swr: dbProfile,
		user,
		profile: dbProfile?.data?.body,
	}
}
