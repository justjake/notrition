import { useEffect } from "react"

export type PopupTarget = "notion-oauth"
export type PopupMessage = { type: "authorized" }

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
		opener.postMessage("authorized", window.location.origin)
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

			listener(message.data)
		}
		window.addEventListener("message", handleMessage)
		return () => window.removeEventListener("message", handleMessage)
	}, [listener])
}
