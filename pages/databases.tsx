import React, { CSSProperties, ReactNode } from "react"
import useSWR from "swr"
import {
	Box,
	JSONViewer,
	Row,
	useNotionApiClient,
	Button,
	Spinner,
	useCurrentUserProfile,
} from "../components/Helpers"
import {
	useAsyncGeneratorState,
	createOrUpdatePersistedRecipePage,
	NotionRecipePageView,
} from "../components/NotionRecipeExtractor"
import { useNotritionRecipePage } from "../lib/swr"
import {
	getNotionUrl,
	getPageTitle,
	getPlainText,
	NotionDatabase,
	NotionPage,
} from "../lib/notion"
import { routes } from "../lib/routes"

const ErrorView: React.FC<{
	caption: ReactNode
	error: any
	style?: CSSProperties
}> = props => {
	return (
		<Box style={props.style}>
			<Row style={{ color: "red" }}>
				Error: {props.caption}
				{props.error && <JSONViewer json={props.error} />}
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

function DatabaseEntry(props: { database: NotionDatabase; page: NotionPage }) {
	const { database, page } = props
	const recipePage = useNotritionRecipePage(page.id)
	const [updateState, trackUpdate] = useAsyncGeneratorState(
		createOrUpdatePersistedRecipePage
	)
	const notion = useNotionApiClient()
	const profile = useCurrentUserProfile()?.profile

	const handleAnalyze = async () => {
		if (!notion || !profile || updateState.isRunning) {
			return
		}

		trackUpdate(
			createOrUpdatePersistedRecipePage({
				notion,
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
						<a href={getNotionUrl(page.id)} target="_blank">
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
			{profile && recipePage.data && (
				<TableRow height="30vh">
					<div style={{ lineHeight: "1.5em" }}>
						<NotionRecipePageView
							profile={profile}
							recipePage={recipePage.data}
							swr={recipePage}
						/>
					</div>
				</TableRow>
			)}
		</>
	)
}

function DatabaseRow(props: { database: NotionDatabase }) {
	const { database } = props
	const notion = useNotionApiClient()

	const pages = useSWR([notion, "databasePages"], async () => {
		if (notion) {
			return notion.queryDatabase(database.id)
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
						<a href={getNotionUrl(database.id)} target="_blank">
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

export default function DatabasePage(props: {}) {
	const notion = useNotionApiClient()
	const databases = useSWR([notion], async () => {
		if (notion) {
			return await notion.getDatabases()
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
