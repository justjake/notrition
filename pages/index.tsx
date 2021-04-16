import { Auth } from "@supabase/ui"
import Head from "next/head"
import { supabase } from "../lib/supabase"
import styles from "../styles/Home.module.css"
import useSWR from "swr"
import React, {
	FormEvent,
	SyntheticEvent,
	useCallback,
	useEffect,
	useState,
} from "react"
import { Profile } from "../lib/models"
import { UserLogin } from "../components/UserSettings"
import {
	CreateNotionRecipePage,
	NotionRecipePageList,
} from "../components/NotionRecipeExtractor"

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

				<CreateNotionRecipePage />
				<NotionRecipePageList />
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
