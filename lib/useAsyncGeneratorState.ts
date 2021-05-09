import { useCallback, useState } from "react"

export interface AsyncGeneratorState<T> {
	isRunning: boolean
	error?: Error
	progress?: T
}

export function useAsyncGeneratorState<T>(
	typeHint: (...args: any[]) => AsyncIterableIterator<T>
): [AsyncGeneratorState<T>, (iterator: AsyncIterableIterator<T>) => void] {
	const [state, setState] = useState<AsyncGeneratorState<T>>({
		isRunning: false,
	})

	const trackState = useCallback(async (iterator: AsyncIterableIterator<T>) => {
		setState({
			isRunning: true,
		})

		try {
			for await (const nextProgress of iterator) {
				setState(s => ({
					...s,
					progress: nextProgress,
				}))
			}
		} catch (error) {
			setState(s => ({ ...s, error }))
		} finally {
			setState(s => ({ ...s, isRunning: false }))
		}
	}, [])

	return [state, trackState]
}
