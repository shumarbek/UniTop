# API Routes

All user-facing routes must verify Telegram identity. Admin routes must require `users.is_admin = true`. Payment webhooks must verify provider signatures before mutating subscriptions, boosts, or payments.

## Telegram and Auth

- `POST /api/auth/telegram`: verify Telegram Mini App `initData`, create or update `users`, return an app session.
- `POST /api/bot/webhook`: receive Telegram bot updates, handle `/start`, referral parameters, support replies, and callback buttons.
- `POST /api/channel/check`: call `getChatMember` for the official channel and store `channel_checked_at`.

## Onboarding and Profiles

- `GET /api/me`: current user, terms status, channel status, profile status, premium status.
- `POST /api/terms/accept`: store terms version and timestamp.
- `POST /api/profiles`: create profile draft, run text validation, set status `pending`.
- `PATCH /api/profiles/me`: update own profile, re-run validation, return to `pending` if sensitive fields changed.
- `POST /api/profiles/photo`: create signed upload URL, validate uploaded photo, create `photos` row.
- `DELETE /api/profiles/me`: delete profile and send audit event.

## Discovery and Matching

- `GET /api/discovery/next`: enforce daily view limit, return ranked profile candidate.
- `POST /api/likes`: body `{ targetProfileId, action }`; create like/skip, create match if reciprocal like exists.
- `GET /api/matches`: list active matches.
- `POST /api/matches/:id/unmatch`: set `unmatched_at` and notify the other participant only if product policy requires it.
- `GET /api/likes/received`: premium-only list of received likes.

## Reports and Support

- `POST /api/reports`: report user/profile.
- `GET /api/support/tickets`: list current user's tickets.
- `POST /api/support/tickets`: create ticket and audit event.
- `POST /api/support/tickets/:id/messages`: append message.
- `GET /api/faq`: published Uzbek FAQs.

## Payments and Premium

- `POST /api/payments/create`: create payment intent for premium or boost.
- `POST /api/payments/webhook`: verify provider callback, mark payment paid, grant subscription or boost.
- `GET /api/premium/status`: current plan, expiry, limits.
- `POST /api/boosts`: create boost payment intent for 1, 6, or 24 hours.

## Admin

- `GET /api/admin/stats`: total users, active users, premium users, matches, registrations, revenue.
- `GET /api/admin/profiles?status=pending`: moderation queue.
- `POST /api/admin/profiles/:id/approve`: approve profile and notify user.
- `POST /api/admin/profiles/:id/reject`: reject profile with reason and notify user.
- `POST /api/admin/users/:id/ban`: ban user and audit.
- `GET /api/admin/reports`: report management.
- `GET /api/admin/tickets`: ticket queue.
- `POST /api/admin/tickets/:id/reply`: admin response plus Telegram notification.
- `GET /api/admin/payments`: payment records.
- `GET /api/admin/referrals`: referral activity.
