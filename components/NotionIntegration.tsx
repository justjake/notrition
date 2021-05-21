import { FC } from "react"
import { boxShadow } from "./Helpers"
import classnames from "classnames"

export const WorkspaceIcon: FC<{ url: string; size: 48 | 128 | "inline" }> = ({
	url,
	size,
}) => {
	const sizeCss = size === "inline" ? "1.2em" : `${size}px`
	return (
		<>
			<img
				src={url}
				className={classnames(
					"workspace-icon",
					size === "inline" && "workspace-icon-inline"
				)}
			/>
			<style jsx>{`
				.workspace-icon-inline {
					vertical-align: bottom;
				}
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
