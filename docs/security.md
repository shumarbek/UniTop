# Security Recommendations

## Telegram Identity

- Verify Telegram Mini App `initData` server-side using the bot token hash algorithm.
- Reject sessions older than a short TTL, for example 24 hours.
- Bind app sessions to `telegram_id`.
- Do not trust Telegram username, first name, or photo URL as verified profile data.

## Rate Limiting and Anti-Spam

- Rate-limit `/api/likes`, `/api/discovery/next`, profile updates, reports, and support messages by Telegram ID and IP.
- Store daily view counters in `daily_usage`.
- Add cooldowns for profile re-submission after repeated rejection.
- Detect repeated bio text, link attempts, phone numbers, and Telegram usernames.
- Lock or queue users who receive repeated reports.

## Content Safety

- Use image moderation for profile photos.
- Store validation results on `photos` and moderation notes on `profiles`.
- Require human approval before discovery.
- Do not expose raw storage paths publicly; use signed URLs.

## Payments

- Create payment intents server-side.
- Verify provider webhook signatures.
- Confirm amount, currency, product type, user ID, and idempotency before granting premium or boost.
- Never grant premium based only on frontend success redirects.

## Supabase

- Enable RLS on all tables.
- Use service-role key only in server route handlers, Edge Functions, or controlled jobs.
- Keep admin mutations out of the browser client.
- Log all critical mutations in `audit_logs`.

## Privacy

- Provide Uzbek Privacy Policy and Terms of Service.
- Store accepted version and timestamp.
- Offer account deletion.
- Avoid exposing Telegram IDs to other users.
- Keep match visibility limited to participants.
