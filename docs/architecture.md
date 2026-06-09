# UniTop Architecture

UniTop is a Telegram Mini App for Uzbek-only friendship, communication, networking, and relationship discovery. The first production slice should keep all sensitive decisions server-side: Telegram identity verification, channel membership checks, moderation, matching, payments, boosts, referrals, and notifications.

## System Components

- Telegram Bot: handles `/start`, welcome copy, language notice, channel subscription prompts, Mini App launch button, notifications, admin audit messages, and support replies.
- Telegram Mini App: Next.js mobile-first frontend using TypeScript, Tailwind CSS, Telegram WebApp SDK, and Supabase client with short-lived authenticated sessions.
- API Layer: Next.js route handlers for Telegram init-data verification, profile workflows, discovery, likes, support, payment callbacks, and admin actions.
- Supabase: PostgreSQL, Storage for photos, Row Level Security, Edge Functions for scheduled jobs and payment verification callbacks when useful.
- Admin Panel: protected Next.js admin routes for moderation, users, reports, tickets, payments, subscriptions, referrals, plans, and dashboard metrics.
- Private Admin Audit Channel: receives immutable event summaries for profile and business-critical actions.

## User Flow

1. User opens Telegram bot and taps Start.
2. Bot sends welcome, platform purpose, Uzbek-only notice, and Mini App button.
3. Mini App verifies Telegram init data through `/api/auth/telegram`.
4. User accepts Privacy Policy and Terms of Service. Store Telegram ID, accepted version, and timestamp.
5. Server checks required channel membership through Telegram Bot API.
6. User creates profile with name, age, gender, photo, location, bio, interests, looking-for gender, and purpose.
7. Automatic validation runs for name/gender consistency, prohibited contact info, spam, and photo quality.
8. Profile enters moderation as `pending`.
9. Admin approves, rejects, or bans. User receives Telegram notification.
10. Approved users enter discovery with daily limits, likes, matches, support, referral rewards, premium, and boosts.

## Discovery Ranking

Hard filters:

- Viewer is not banned.
- Viewer profile is approved.
- Candidate profile is approved.
- Candidate has not already been liked or skipped by viewer.
- Candidate matches viewer `looking_for_gender` and candidate preference when using mutual preference mode.

Ranking:

1. Active boost and premium priority.
2. Same district.
3. Same city.
4. Same region.
5. Neighboring regions.
6. Countrywide.
7. Similar age.
8. Shared interests.
9. Same university.
10. Recent activity.

Daily limits:

- Free users: 100 views per day plus referral bonuses.
- Premium users: 400 views per day plus referral bonuses.

## Moderation

Automatic checks should run before admin review:

- Name: Uzbek/Cyrillic/Latin-friendly length and profanity checks, then rough gender/name consistency using a curated local name map.
- Photo: face exists, one visible person, not explicit, no document/screenshot/meme-only image.
- Bio: reject Telegram usernames, phone numbers, external links, payment handles, spam repetition, and offensive text.

Admin actions:

- Approve: `profiles.status = approved`, write `audit_logs`, notify user.
- Reject: store `rejection_reason`, write `audit_logs`, notify user with Uzbek text.
- Ban: set `users.is_banned`, `profiles.status = banned`, write `audit_logs`, notify admin channel.

## Folder Structure

```text
app/
  (mini)/
    onboarding/
    profile/
    discover/
    matches/
    likes/
    premium/
    support/
    faq/
  admin/
    dashboard/
    users/
    profiles/
    reports/
    tickets/
    payments/
    premium-plans/
    referrals/
  api/
    auth/telegram/
    bot/webhook/
    channel/check/
    profiles/
    discovery/next/
    likes/
    matches/
    reports/
    support/
    payments/webhook/
    admin/
components/
  mini/
  admin/
  ui/
lib/
  supabase/
  telegram/
  validation/
  discovery/
  moderation/
  payments/
  rate-limit/
  notifications/
supabase/
  schema.sql
  functions/
docs/
```

## Production Notes

- Never expose the service-role key to the Mini App.
- Verify Telegram `initData` on every session creation.
- Store all photo files in private Supabase Storage buckets and serve signed URLs.
- Keep admin routes behind both Supabase auth and an `is_admin` database check.
- Use a queue-like table for notification retries so Telegram API failures do not break user actions.
