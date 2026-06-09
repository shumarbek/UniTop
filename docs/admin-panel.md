# Admin Panel

The admin panel should be dense, mobile-capable, and operational. Avoid marketing layouts. Admin users need queues, filters, fast actions, and audit visibility.

## Pages

- `/admin/dashboard`: total users, active users, premium users, matches, daily registrations, revenue, pending moderation, open tickets.
- `/admin/users`: search by Telegram ID, username, referral code, ban status, premium status.
- `/admin/profiles`: moderation queue with photo, bio, location, interests, validation flags, approve/reject/ban actions.
- `/admin/reports`: reporter, reported user, reason, evidence, status, resolution actions.
- `/admin/tickets`: support inbox by category/status, threaded messages, reply composer.
- `/admin/payments`: payment status, provider ID, amount, plan/boost linkage, webhook metadata.
- `/admin/premium-plans`: plan pricing, duration, active status.
- `/admin/referrals`: referral tree, rewards granted, suspicious activity.

## Dashboard Metrics

- Total users: count from `users`.
- Active users: `profiles.last_active_at > now() - interval '7 days'`.
- Premium users: active `subscriptions.ends_at > now()`.
- Matches created: count from `matches`.
- Daily registrations: group `users.created_at` by date.
- Revenue: sum paid `payments.amount` by date and plan.

## Moderation UX

- Primary queue filter: `pending`.
- Show validation failures at the top of each profile row.
- Require rejection reason before reject.
- Require ban reason before ban.
- Every action writes `audit_logs` and sends the private Telegram audit message.
