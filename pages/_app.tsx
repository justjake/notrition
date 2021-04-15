import "../styles/globals.css"
import { Auth } from "@supabase/ui"
import { supabase } from "../lib/supabase"

function NotritionApp({ Component, pageProps }: any) {
	return (
		<Auth.UserContextProvider supabaseClient={supabase}>
			<Component {...pageProps} />
		</Auth.UserContextProvider>
	)
}

export default NotritionApp
