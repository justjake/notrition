import "../styles/globals.css"
import { Auth } from "@supabase/ui"
import { supabase } from "../lib/supabase"
import { UserProfileProvider } from "../components/Helpers"
import { AccessTokensProvider } from "../components/NotionAccessTokenContext"

function NotritionApp({ Component, pageProps }: any) {
	return (
		<Auth.UserContextProvider supabaseClient={supabase}>
			<UserProfileProvider>
				<AccessTokensProvider>
					<Component {...pageProps} />
				</AccessTokensProvider>
			</UserProfileProvider>
		</Auth.UserContextProvider>
	)
}

export default NotritionApp
