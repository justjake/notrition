import React, { CSSProperties, ReactNode } from "react"
import useSWR from "swr"
import {
	Box,
	JSONViewer,
	Row,
	Button,
	Spinner,
	useCurrentUserProfile,
	PleaseConnectAWorkspace,
} from "../components/Helpers"
import { useNotritionRecipePage } from "../lib/swr"
import { getPageTitle, getPlainText } from "../lib/notion"
import { routes } from "../lib/routes"
import { useAsyncGeneratorState } from "../lib/useAsyncGeneratorState"
import { upsertNotritionRecipePage } from "../lib/upsertRecipePage"
import {
	CurrentAccessTokenProvider,
	useAccessTokens,
	useCurrentAccessTokenId,
	useNotionApiClient,
} from "../components/NotionAccessTokenContext"
import {
	Layout,
	LayoutFooter,
	LayoutHeader,
	LayoutRow,
} from "../components/Layout"
import { WorkspaceIcon } from "../components/NotionIntegration"
import { Database, Page } from "@notionhq/client/build/src/api-types"

const ErrorView: React.FC<{
	caption: ReactNode
	error: any
	style?: CSSProperties
}> = props => {
	let toString: string = ""
	try {
		toString = String(props.error)
	} catch (error) {}
	return (
		<Box style={props.style}>
			<Row style={{ color: "red" }}>
				Error: {props.caption} {toString}
				{props.error && <JSONViewer error={props.error} />}
			</Row>
		</Box>
	)
}

function TableRow(props: { height?: string; children: ReactNode }) {
	const height = props.height || "3rem"
	return (
		<>
			<div className="row">{props.children}</div>
			<style jsx>
				{`
					.row {
						display: flex;
						height: ${height};
						line-height: ${height};
						justify-content: space-between;
						max-width: 960px;
						padding: 0 1em;
						margin: 0 auto;
						overflow: scroll;
					}
				`}
			</style>
		</>
	)
}

function DatabaseEntry(props: { database: Database; page: Page }) {
	const { database, page } = props
	const recipePage = useNotritionRecipePage(page.id)
	const [updateState, trackUpdate] = useAsyncGeneratorState(
		upsertNotritionRecipePage
	)
	const accessTokenId = useCurrentAccessTokenId()
	const profile = useCurrentUserProfile()?.profile

	const handleAnalyze = async () => {
		if (!profile || updateState.isRunning) {
			return
		}

		trackUpdate(
			upsertNotritionRecipePage({
				access: {
					accessTokenId,
				},
				notionPageId: page.id,
				profile,
				updateNutrition: true,
			})
		)
	}

	return (
		<>
			<TableRow>
				<div>{getPageTitle(page)}</div>

				<div>
					{updateState?.progress?.phase} {updateState.isRunning && <Spinner />}
				</div>

				<div>
					{recipePage.data && (
						<Button style={{ marginRight: "1em" }}>
							<a href={routes.recipeLabel(recipePage.data)} target="_blank">
								Open label
							</a>
						</Button>
					)}
					<Button style={{ marginRight: "1em" }}>
						<a href={routes.notionPage(page.id)} target="_blank">
							Open in Notion
						</a>
					</Button>
					<Button
						disabled={updateState.isRunning}
						onClick={handleAnalyze}
						style={{ marginRight: "1em" }}
					>
						Analyze
					</Button>
				</div>
			</TableRow>
		</>
	)
}

function DatabaseRow(props: { database: Database }) {
	const { database } = props
	const notion = useNotionApiClient(undefined)

	const pages = useSWR([notion, "databasePages"], async () => {
		if (notion) {
			return notion.databases.query({ database_id: database.id })
		}
	})

	return (
		<>
			<TableRow>
				<div className="title">
					{getPlainText(database.title)} {pages.isValidating && <Spinner />}
				</div>

				<div className="actions">
					<Button style={{ marginRight: "1em" }}>
						<a href={routes.notionPage(database.id)} target="_blank">
							Open in Notion
						</a>
					</Button>
					<Button
						onClick={() => pages.revalidate()}
						style={{ marginRight: "1em" }}
					>
						Reload pages
					</Button>
				</div>
			</TableRow>
			{pages &&
				pages.data &&
				pages.data.results.map(page => {
					return <DatabaseEntry key={page.id} database={database} page={page} />
				})}

			<style jsx>{`
				.title {
					font-weight: bold;
				}
			`}</style>
		</>
	)
}

function DatabasesList(props: {}) {
	const notion = useNotionApiClient(undefined)
	const databases = useSWR([notion], async () => {
		if (notion) {
			return await notion.databases.list()
		}
	})

	if (databases.error) {
		return (
			<ErrorView
				caption="Can't fetch your Notion databases"
				error={databases.error}
			/>
		)
	}

	const { data, isValidating } = databases

	if (isValidating && !data) {
		return (
			<Row>
				Loading databases <Spinner />
			</Row>
		)
	}

	if (!data || data.results.length === 0) {
		return <Row>No databases</Row>
	}

	return (
		<Box>
			{data.results.map(database => {
				return <DatabaseRow key={database.id} database={database} />
			})}
		</Box>
	)
}

export default function DatabasesPage(args: {}) {
	const { tokens } = useAccessTokens()

	const tokenViews = tokens.map(token => {
		return (
			<CurrentAccessTokenProvider
				key={token.id}
				tokenId={token.id}
				token={token}
			>
				<h3>
					<WorkspaceIcon size="inline" url={token.workspace_icon} />{" "}
					{token.workspace_name}
				</h3>
				<DatabasesList />
			</CurrentAccessTokenProvider>
		)
	})

	return (
		<Layout
			htmlTitle="Notrition - Databases"
			header={<LayoutHeader />}
			footer={<LayoutFooter />}
		>
			<LayoutRow>
				<h1>Databases</h1>
				{tokenViews.length ? tokenViews : <PleaseConnectAWorkspace />}
			</LayoutRow>
		</Layout>
	)
}
