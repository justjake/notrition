import { HTMLAttributes, ReactNode } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import { routes } from "../lib/routes"
import { IconLogOut } from "@supabase/ui"
import { Button } from "./Helpers"
import { supabase } from "../lib/supabase"

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

export function LayoutHeader(props: {}) {
	return (
		<>
			<LayoutRow>
				<div className="header">
					<Link href="/">
						<a>
							<LogoEmojis fontSize="2em" />
						</a>
					</Link>
					<Link href={routes.recipes()}>
						<a className="nav-link">Recipes</a>
					</Link>
					<Link href={routes.connections()}>
						<a className="nav-link">Connections</a>
					</Link>
					<Link href={routes.settings()}>
						<a className="nav-link">Settings</a>
					</Link>
					<Button onClick={() => supabase.auth.signOut()}>Log out</Button>
				</div>
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
				}

				.nav-link {
					margin: 0 1em;
				}
			`}</style>
		</>
	)
}
