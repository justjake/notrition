import React, { Children, HTMLAttributes, ReactNode } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import { routes } from "../lib/routes"
import { IconLogOut } from "@supabase/ui"
import { Button, colors, useCurrentUserProfile } from "./Helpers"
import { supabase } from "../lib/supabase"

export function Layout(props: {
	header?: React.ReactNode
	footer?: React.ReactNode
	children: React.ReactNode
}) {
	return (
		<div className="page-container">
			{props.header}
			<main className="main">{props.children}</main>
			{props.footer}
			<style jsx>{`
				.page-container {
					min-height: 100vh;
					display: flex;
					flex-direction: column;
				}

				.main {
					flex: 1;
					flex-direction: column;
					align-items: center;
				}
			`}</style>
		</div>
	)
}

export function LogoEmojis(props: { fontSize: string }) {
	return (
		<>
			<span>🥬 🍜 🍲 🍠</span>
			<style jsx>{`
				span {
					font-size: ${props.fontSize};
					letter-spacing: -0.3em;
				}
			`}</style>
		</>
	)
}

export function LayoutRow(
	props: { children: ReactNode } & HTMLAttributes<HTMLDivElement>
) {
	const { className, children, ...divProps } = props
	return (
		<>
			<div className={`layout-row ${className}`} {...divProps}>
				{children}
			</div>
			<style jsx>{`
				.layout-row {
					max-width: 960px;
					width: 100%;
					margin: 0 auto;
				}
			`}</style>
		</>
	)
}

export function LayoutHeader(props: { hideNav?: boolean; hideAuth?: boolean }) {
	const user = useCurrentUserProfile()
	const homeLink = props.hideNav ? (
		<div></div>
	) : (
		<Link href="/">
			<a>
				<LogoEmojis fontSize="2em" />
			</a>
		</Link>
	)

	const navLinks = (
		<>
			<Link href={routes.recipes()}>
				<a className="nav-link">Recipes</a>
			</Link>
			<Link href={routes.connections()}>
				<a className="nav-link">Connections</a>
			</Link>
			<Link href={routes.settings()}>
				<a className="nav-link">Settings</a>
			</Link>
		</>
	)

	const authLinks = user ? (
		<Button onClick={() => supabase.auth.signOut()}>Log out</Button>
	) : (
		<>
			<Link href={routes.login()}>
				<a>
					<Button>Log in</Button>
				</a>
			</Link>
		</>
	)

	return (
		<>
			<LayoutRow>
				<nav className="header">
					{homeLink}
					{user && !props.hideNav && navLinks}
					{authLinks}
				</nav>
			</LayoutRow>
			<style jsx>{`
				.header {
					display: flex;
					flex-direction: row;
					align-items: center;
					justify-content: space-between;
					min-height: 2em;
					padding: 0 0.5em;
					margin: 1em 0;
					margin-bottom: 2rem;
				}

				.nav-link {
					margin: 0 1em;
				}
			`}</style>
		</>
	)
}

export function LayoutFooter(props: {}) {
	return (
		<footer className="footer">
			<p>Pre-alpha work-in-progress</p>
			<p>
				<span style={{ margin: "0 0.3em" }}>Made by </span>
				<a
					className="footer-link"
					href="https://github.com/vicky11z"
					target="_blank"
				>
					Vicky Zhang
				</a>
				<span style={{ margin: "0 0.3em" }}> and </span>
				<a
					className="footer-link"
					href="https://twitter.com/@jitl"
					target="_blank"
				>
					Jake Teton-Landis
				</a>
			</p>
			<style jsx>{`
				p {
					margin: 0.5em;
				}
				.footer {
					width: 100%;
					height: 100px;
					border-top: 1px solid ${colors.border};
					display: flex;
					justify-content: center;
					align-items: center;
					flex-direction: column;
					margin-top: 5rem;
				}

				.footer-link {
					margin-top: 2px;
					padding-bottom: 2px;
					border-bottom: 1px solid ${colors.primaryBlue};
				}
			`}</style>
		</footer>
	)
}