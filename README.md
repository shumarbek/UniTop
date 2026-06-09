# UniTop

Telegram Mini App dating, friendship, communication, and networking platform for Uzbek users.

## Generated Deliverables

- Full database schema: [supabase/schema.sql](supabase/schema.sql)
- Complete system architecture: [docs/architecture.md](docs/architecture.md)
- Folder structure: [docs/architecture.md](docs/architecture.md#folder-structure)
- API routes: [docs/api-routes.md](docs/api-routes.md)
- Supabase tables: [supabase/schema.sql](supabase/schema.sql)
- Admin panel pages: [docs/admin-panel.md](docs/admin-panel.md)
- Telegram Bot integration logic: [docs/telegram-bot.md](docs/telegram-bot.md)
- Security recommendations: [docs/security.md](docs/security.md)
- Monetization implementation: [docs/monetization.md](docs/monetization.md)
- MVP roadmap: [docs/roadmap.md](docs/roadmap.md#mvp-roadmap)
- Production roadmap: [docs/roadmap.md](docs/roadmap.md#production-roadmap)

## Core Stack

- Frontend: Next.js, TypeScript, Tailwind CSS, Telegram Mini App SDK
- Backend: Supabase, PostgreSQL, Supabase Storage, Edge Functions
- Admin: Next.js dashboard
- Deployment: Vercel and Supabase

## First Implementation Milestone

Build the Telegram auth/onboarding slice first:

1. `/api/auth/telegram` verifies Telegram Mini App init data.
2. `/api/terms/accept` stores the accepted legal version and timestamp.
3. `/api/channel/check` verifies official channel membership.
4. Profile creation stores a pending profile and photo.
5. Admin moderation approves or rejects the profile.

This gives the platform a secure spine before discovery, matching, payments, and premium features are added.

## Production Setup Check

1. Run `supabase/schema.sql` in the Supabase SQL editor.
2. Confirm `.env` has Telegram and Supabase keys.
3. Deploy the app to a public HTTPS URL. Telegram does not work with `localhost` or plain `http`.
4. Set `NEXT_PUBLIC_APP_URL` to that HTTPS URL.
5. Run `npm run telegram:setup` to register the webhook, bot commands, and Mini App menu button.
6. Open `/api/setup/status`; every table and the `profile-photos` bucket must return `ok: true`.
7. Open `/api/telegram/status`; bot `ok` must be true and webhook `url` must be your `/api/bot/webhook` URL.
