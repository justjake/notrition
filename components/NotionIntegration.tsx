import { FC } from "react"
import { boxShadow } from "./Helpers"

export const WorkspaceIcon: FC<{ url: string }> = ({ url }) => {
	return (
		<>
			<img src={url} className="workspace-icon" />
			<style jsx>{`
				.workspace-icon {
					width: 128px;
					height: 128px;
					box-shadow: ${boxShadow.border};
					border-radius: 2px;
				}
			`}</style>
		</>
	)
}
