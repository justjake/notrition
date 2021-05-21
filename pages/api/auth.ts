import { NextApiHandler } from "next"
import { supabase } from "../../lib/supabase"

// Set auth cookie based on session.
// https://github.com/supabase/supabase/blob/c9ec7c151088519abe0ac6ff66313d69f3f0fa36/examples/nextjs-with-supabase-auth/pages/api/auth.js
const auth: NextApiHandler = async (req, res) => {
	supabase.auth.api.setAuthCookie(req, res)
}

export default auth
