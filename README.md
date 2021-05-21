# Notrition

Notrition uses the newly-released [Notion public
API](https://developers.notion.com) to pull recipe data from your recipes stored
in Notion and produce nutrition labels thanks to the Edamam API. It connects to
Notion using [OAuth](https://developers.notion.com/docs/authorization#authorizing-public-integrations).

This project started as a one-day internal Notion hackathon project built by
Vicky Zhang and Jake Teton-Landis. The code is GPLv3.

## Demo

The live version of this app is running at [notrition.info](https://www.notrition.info).

## Requirements

You will need:

1. A Supabase instance. Notrition uses Supabase for authentication and persistence.
1. A Edamam API key. Notrition uses Edamam's nutrition analysis endpoints.
1. A Notion OAuth Integration, created at https://www.notion.so/my-integrations

Then, put together a .env.local file like this:

```bash
# Copy this, then `pbpaste > .env.local` in the repo.
NEXT_PUBLIC_SUPABASE_URL=https://XXXXX.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YYYYYY
SECRET_SUPABASE_SERVICE_KEY=ZZZZZ
EDAMAM_APP_ID=AAAAAA
EDAMAM_API_TOKEN=BBBBBB
NEXT_PUBLIC_NOTION_OAUTH_CLIENT_ID=QQQQQQQQQQ
NOTION_OAUTH_CLIENT_SECRET=secret_JJJJJJ
```

## Development

```
yarn dev
```

## Deployment

Use Vercel. Be sure to create env vars matching your .env.local.
