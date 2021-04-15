import { Auth } from "@supabase/ui"
import Head from "next/head"
import { supabase } from "../lib/supabase"
import styles from "../styles/Home.module.css"
import useSWR from "swr"
import {
	FormEvent,
	SyntheticEvent,
	useCallback,
	useEffect,
	useState,
} from "react"

const fonts = {
	default: `-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif`,
}

const colors = {
	// Notion ripoff colors:
	primaryBlue: "#57A8D7",
}

function Row(props: { children: React.ReactNode }) {
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

interface Profile {
	id: string
	human_name?: string
	notion_api_key?: string
}

// See https://github.com/supabase/ui
function UserLogin(props: {}) {
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
					<button onClick={() => supabase.auth.signOut()}>Sign out</button>
				</Row>
				<form onChange={handleFormChange} onSubmit={handleFormSubmit}>
					<Row>
						<label>
							Your name
							<input
								type="text"
								name="human_name"
								value={uiProfile?.human_name || ""}
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
								value={uiProfile?.notion_api_key || ""}
								placeholder="secret_foobar..."
							/>
						</label>
					</Row>
					<Row>
						<input type="submit" />
					</Row>
				</form>
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

function Emojis(props: {}) {
	return (
		<>
			<span>🥬 🍜 🍲 🍠</span>
			<style jsx>{`
				span {
					font-size: 3em;
					letter-spacing: -0.3em;
				}
			`}</style>
		</>
	)
}

export default function Home() {
	return (
		<div className={styles.container}>
			<Head>
				<title>Notrition - Nutrition & Recipes for Notion</title>
				<link rel="icon" href="/favicon.ico" />
			</Head>

			<main className={styles.main}>
				<h1 className={styles.title}>
					<Emojis />
				</h1>
				<h1 className={styles.title}>Notrition</h1>

				<p className={styles.description}>
					Add nutrition & recipe info to Notion
				</p>

				<UserLogin />
			</main>

			<footer className={styles.footer}>
				<span style={{ margin: "0 0.3em" }}>Made by </span>
				<a href="https://github.com/vicky11z" target="_blank">
					Vicky Zhang
				</a>
				<span style={{ margin: "0 0.3em" }}> and </span>
				<a href="https://twitter.com/@jitl" target="_blank">
					Jake Teton-Landis
				</a>
			</footer>
		</div>
	)
}
