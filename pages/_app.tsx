import "../styles/globals.css"
import { Auth } from "@supabase/ui"
import { supabase } from "../lib/supabase"
import { UserProfileProvider } from "../components/Helpers"

function NotritionApp({ Component, pageProps }: any) {
	return (
		<Auth.UserContextProvider supabaseClient={supabase}>
			<UserProfileProvider>
				<Component {...pageProps} />
			</UserProfileProvider>
		</Auth.UserContextProvider>
	)
}

export default NotritionApp
