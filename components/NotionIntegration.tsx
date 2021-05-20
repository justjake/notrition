import { FC } from "react"
import { boxShadow } from "./Helpers"

export const WorkspaceIcon: FC<{ url: string; size: 48 | 128 }> = ({
	url,
	size,
}) => {
	return (
		<>
			<img src={url} className="workspace-icon" />
			<style jsx>{`
				.workspace-icon {
					width: ${size}px;
					height: ${size}px;
					box-shadow: ${boxShadow.border};
					border-radius: 2px;
				}
			`}</style>
		</>
	)
}
