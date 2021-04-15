import { Auth } from "@supabase/ui"
import React, {
	FormEvent,
	SyntheticEvent,
	useCallback,
	useEffect,
	useState,
} from "react"
import useSWR from "swr"
import { Profile } from "../lib/models"
import { supabase } from "../lib/supabase"
import { Button, Row } from "./Helpers"

// See https://github.com/supabase/ui
export function UserLogin(props: {}) {
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

	const [uiProfile, setUiProfile] = useState<Profile>()

	const handleFormChange = useCallback(
		(e: SyntheticEvent<HTMLInputElement>) => {
			setUiProfile(profile => {
				if (!profile) {
					return
				}

				const newProfile = {
					...profile,
					[(e.target as any).name]: (e.target as any).value,
				}

				console.log("update profile event", e, newProfile)

				return newProfile
			})
		},
		[]
	)

	const handleFormSubmit = useCallback(
		(e: FormEvent) => {
			e.preventDefault()
			if (!uiProfile) {
				return
			}
			return dbProfile.mutate(async () => {
				const { id, ...updates } = uiProfile
				const res = await supabase
					.from<Profile>("profiles")
					.update(updates)
					.eq("id", id)
					.single()

				const { error, data } = res

				console.log("UPDATE ERROR", error, "PARAMS", uiProfile)

				return res
			})
		},
		[dbProfile, uiProfile]
	)

	useEffect(() => {
		console.log("useEffect", dbProfile, dbProfile.data, dbProfile.error)
		if (dbProfile.data) {
			const nextProfile = dbProfile.data?.body
			console.log("Set ui profile", nextProfile)
			setUiProfile(nextProfile || undefined)
		}
	}, [dbProfile.data])

	if (user) {
		return (
			<>
				<Row>Signed in: {user.email}</Row>
				<Row>
					<Button onClick={() => supabase.auth.signOut()}>Sign out</Button>
				</Row>
				<form onSubmit={handleFormSubmit}>
					<Row>
						<label>
							Your name
							<input
								type="text"
								name="human_name"
								onChange={handleFormChange}
								defaultValue={uiProfile?.human_name || ""}
								placeholder="Dr. Omlette"
							/>
						</label>
					</Row>
					<Row>
						<label>
							Notion API key
							<input
								type="text"
								name="notion_api_key"
								onChange={handleFormChange}
								defaultValue={uiProfile?.notion_api_key || ""}
								placeholder="secret_foobar..."
							/>
						</label>
					</Row>
					<Row>
						<Button onClick={handleFormSubmit}>Save</Button>
					</Row>
				</form>
				<style jsx>{`
					label {
						font-size: 14px;
					}

					input[type="text"] {
						margin: 0px 1rem;
					}

					form {
						box-shadow: inset 0px 0px 0px 1px rgba(0, 0, 0, 0.1);
						border-radius: 3px;
						padding: 0.5rem 1rem;
					}
				`}</style>
			</>
		)
	}

	return <Auth supabaseClient={supabase} />
}
