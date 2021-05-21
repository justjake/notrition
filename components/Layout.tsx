import React, { Children, HTMLAttributes, ReactNode } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import { routes } from "../lib/routes"
import { IconLogOut } from "@supabase/ui"
import { Box, Button, colors, Row, useCurrentUserProfile } from "./Helpers"
import { supabase } from "../lib/supabase"
import Head from "next/head"

const SMALL = "500px"

export function AuthLayout(props: {
	htmlTitle: string
	children: React.ReactNode
	title: React.ReactNode
}) {
	return (
		<>
			<Head>
				<title>{props.htmlTitle}</title>
			</Head>
			<div className="login-container">
				<div className="login-box">
					<Box
						style={{
							display: "flex",
							flexDirection: "column",
							flexGrow: 1,
						}}
					>
						<Row>
							<h1 className="login-header">
								<Link href="/">
									<a>
										<LogoEmojis fontSize="1em" />
									</a>
								</Link>
								<span className="login-sep"> • </span>
								{props.title}
							</h1>
						</Row>
						<Row
							style={{ display: "flex", flexGrow: 1, flexDirection: "column" }}
						>
							{props.children}
						</Row>
					</Box>
				</div>
			</div>
			<style jsx>{`
				.login-container {
					width: 100vw;
					height: 100vh;

					display: flex;
					justify-content: center;
					align-items: center;
					flex-grow: 1;
				}

				@media screen and (max-width: 500px) {
					.login-container {
						justify-content: stretch;
						align-items: stretch;
					}
				}

				.login-box {
					display: flex;
					align-items: stretch;
					justify-content: stretch;

					max-width: 100%;
					width: 500px;
					min-height: 42vh;
				}

				.login-header {
					margin: 0;
					font-size: inherit;
				}

				.login-sep {
					margin: 0 0.5em;
				}
			`}</style>
		</>
	)
}

export function Layout(props: {
	htmlTitle: string
	header?: React.ReactNode
	footer?: React.ReactNode
	children: React.ReactNode
}) {
	return (
		<div className="page-container">
			<Head>
				<title>{props.htmlTitle}</title>
			</Head>
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
			<Link href={routes.databases()}>
				<a className="nav-link">Databases</a>
			</Link>
			<Link href={routes.connections()}>
				<a className="nav-link">Connections</a>
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
			<p>
				Pre-alpha work-in-progress •
				<Link href="/legal">
					<a className="footer-link" style={{ marginLeft: "0.5em" }}>
						Privacy & Terms
					</a>
				</Link>
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
