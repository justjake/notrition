# Notrition

This is a one-day internal Notion hackathon project built by Vicky Zhang and
Jake Teton-Landis. The code is GPLv3 liscenced.

Notrition uses the upcoming Notion public API (which is in private beta and
under heavy development) to pull recipe data from your recipes stored in Notion
and produce nutrition labels thanks to the Edamam API. Unfornately, Notion's OAuth
features aren't ready yet, so you'll need to bring your own Notion API bot token.

## Requirements

You will need:

1. A Supabase instance. Notrition uses Supabase for authentication and persistence.
1. A Edamam API key. Notrition uses Edamam's nutrition analysis endpoints.

Then, put together a .env.local file like this:

```bash
# Copy this, then `pbpaste > .env.local` in the repo.
NEXT_PUBLIC_SUPABASE_URL=https://XXXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YYYYYY
SECRET_SUPABASE_SERVICE_KEY=ZZZZZ
EDAMAM_APP_ID=AAAAAA
EDAMAM_API_TOKEN=BBBBBB
```

## Development

```
yarn dev
```

## Deployment

Use Vercel. Be sure to create env vars matching your .env.local.
