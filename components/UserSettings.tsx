import { Auth } from "@supabase/ui"
import React, {
	FormEvent,
	SyntheticEvent,
	useCallback,
	useEffect,
	useState,
} from "react"
import { Profile } from "../lib/models"
import { supabase } from "../lib/supabase"
import { Button, Row, useCurrentUserProfile } from "./Helpers"

// See https://github.com/supabase/ui
export function UserLogin(props: {}) {
	const user = useCurrentUserProfile()
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

			if (!user) {
				return
			}

			return user.swr.mutate(async () => {
				const { id, ...updates } = uiProfile

				const result = await supabase
					.from<Profile>("profiles")
					.update(updates)
					.eq("id", id)
					.single()

				return result.body || undefined
			})
		},
		[user, uiProfile]
	)

	useEffect(() => {
		if (user?.profile) {
			setUiProfile(user?.profile)
		}
	}, [user])

	if (user) {
		return (
			<>
				<Row>Signed in: {user.user.email || user.user.id}</Row>
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
