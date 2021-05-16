import { GetServerSideProps } from "next"
import { UserNotionAccessToken } from "../lib/models"
import { routes } from "../lib/routes"
import { authCookie } from "../lib/supabase"

type AuthorizeQueryParams = {
	state: string | undefined
	code: string | undefined
	error: string | undefined
}

type AuthorizePageProps = {
	type: "error"
	error: string
	code: string | undefined
}

export const getServerSideProps: GetServerSideProps<
	AuthorizePageProps,
	AuthorizeQueryParams
> = async context => {
	const user = authCookie(context.req)
	if (!user) {
		return {
			redirect: routes.login,
		}
	}

	// Notion OAuth error
	if (context.params?.error) {
		return {
			props: {
				type: "error",
				error: context.params?.error,
			},
		}
	}

	// Notion OAuth code
	if (context.params?.code) {
		const auth = await notion
	}
}
