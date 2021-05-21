import { FC } from "react"
import { boxShadow } from "./Helpers"

export const WorkspaceIcon: FC<{ url: string; size: 48 | 128 | "inline" }> = ({
	url,
	size,
}) => {
	const sizeCss = size === "inline" ? "1.1em" : `${size}px`
	return (
		<>
			<img src={url} className="workspace-icon" />
			<style jsx>{`
				.workspace-icon {
					width: ${sizeCss};
					height: ${sizeCss};
					box-shadow: ${boxShadow.border};
					border-radius: 2px;
				}
			`}</style>
		</>
	)
}
