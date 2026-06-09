# Monetization

## Premium Plans

- 7 days: entry plan for trying premium features.
- 30 days: default recommended plan.
- 90 days: best value plan.

Premium benefits:

- 400 daily profile views instead of 100.
- Priority visibility in discovery ranking.
- View received likes.
- Eligibility for discounted boosts.

## Boosts

Durations:

- 1 hour
- 6 hours
- 24 hours

Boost implementation:

1. User chooses duration.
2. Server creates payment record with product metadata.
3. Payment webhook verifies payment.
4. Server inserts `boosts` with `starts_at` and `ends_at`.
5. Discovery ranking prioritizes active boosts.

## Referral Rewards

- 1 successful referral: +100 extra views.
- 5 successful referrals: 7 days premium.

Successful referral criteria:

- Referred user accepts Terms.
- Referred user subscribes to official channel.
- Referred user submits a profile.
- Optional stricter rule: reward only after profile approval.

Track every referral in `referrals` and store applied reward timestamps to prevent duplicate rewards.
