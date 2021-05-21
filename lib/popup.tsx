import { useEffect } from "react"

export type PopupTarget = "notion-oauth"
export type PopupMessage = { type: "authorized" }

interface PopupMessageEnvelope {
	source: "notrition"
	message: PopupMessage
}

function isPopupMessageEnvelope(data: unknown): data is PopupMessageEnvelope {
	if (typeof data !== "object" || !data) {
		return false
	}

	if (!("source" in data)) {
		return false
	}

	return (data as any).source === "notrition"
}

export function openPopUp(args: { target: PopupTarget; url: string }) {
	const { target: popupId, url } = args
	const width = 500
	const height = Math.min(window.screen.availHeight - 100, 700)
	const features = {
		width,
		height,
		left: window.screen.availWidth / 2 - width / 2,
		top: window.screen.availHeight / 2 - height / 2,
		location: "no",
	}
	const newWindow = window.open(
		url,
		popupId,
		Object.entries(features)
			.map(([k, v]) => `${k}=${v}`)
			.join(",")
	)
	newWindow?.focus()
}

export function sendToOpener(message: PopupMessage) {
	const opener = window.opener as Window | undefined
	if (opener) {
		const envelope: PopupMessageEnvelope = {
			message,
			source: "notrition",
		}
		opener.postMessage(envelope, window.location.origin)
		return true
	}
	return false
}

export function usePopupMessageListener(
	listener: (message: PopupMessage) => void
) {
	useEffect(() => {
		function handleMessage(message: MessageEvent) {
			if (message.origin !== window.location.origin) {
				return
			}

			const data = message.data
			if (!isPopupMessageEnvelope(data)) {
				return
			}

			console.log("message", data)

			listener(data.message)
		}
		window.addEventListener("message", handleMessage)
		return () => window.removeEventListener("message", handleMessage)
	}, [listener])
}
