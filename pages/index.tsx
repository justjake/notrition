import { Auth } from "@supabase/ui"
import Head from "next/head"
import { supabase } from "../lib/supabase"
import styles from "../styles/Home.module.css"

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

// See https://github.com/supabase/ui
function UserLogin(props: {}) {
	const { user } = Auth.useUser()

	if (user) {
		return (
			<>
				<Row>Signed in: {user.email}</Row>
				<Row>
					<button onClick={() => supabase.auth.signOut()}>Sign out</button>
				</Row>
				<style jsx>{`
					button {
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
