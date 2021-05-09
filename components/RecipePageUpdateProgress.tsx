import { STATUS_CODES } from "node:http"
import { RecipeUpdateState } from "../lib/upsertRecipePage"
import { AsyncGeneratorState } from "../lib/useAsyncGeneratorState"
import { JSONViewer, Spinner } from "./Helpers"

export function RecipePageUpdateProgress(props: {
	state: AsyncGeneratorState<RecipeUpdateState>
	showDone?: boolean
}) {
	const { state, showDone } = props

	if (state.error && !state.isRunning) {
		return (
			<>
				<span style={{ color: "red" }}>{state.error.toString()}</span>
				<JSONViewer error={state.error} />
			</>
		)
	}

	if (state.isRunning) {
		return (
			<>
				<Spinner /> {state?.progress?.phase}
			</>
		)
	}

	if (state.progress && props.showDone) {
		return <>{state.progress.phase}</>
	}

	return null
}
