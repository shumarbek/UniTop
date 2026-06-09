# Telegram Bot Integration

## Required Environment Variables

```text
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_OFFICIAL_CHANNEL_ID=
TELEGRAM_ADMIN_AUDIT_CHANNEL_ID=
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=
NEXT_PUBLIC_MINI_APP_URL=
```

## Start Flow

1. User sends `/start` or opens referral link `/start ref_<code>`.
2. Bot upserts `users.telegram_id`, stores referral intent when present, and sends Uzbek welcome copy.
3. Bot explains the platform is Uzbek-only in the first version.
4. Bot sends an inline keyboard with:
   - `Ilovani ochish`: Mini App web app button.
   - `Rasmiy kanal`: official channel URL.
5. Mini App continues Terms, channel check, and profile creation.

## Uzbek Message Examples

Welcome:

```text
Assalomu alaykum! UniTop do'stlar, suhbatdoshlar va yangi tanishuvlar topish uchun yaratilgan Telegram ilova.

Hozircha platforma faqat o'zbek tilida ishlaydi.
Davom etish uchun shartlar bilan tanishing va rasmiy kanalga obuna bo'ling.
```

Profile approved:

```text
Profilingiz tasdiqlandi. Endi yangi insonlar bilan tanishishni boshlashingiz mumkin.
```

Profile rejected:

```text
Profilingiz tasdiqlanmadi. Sabab: {reason}. Ma'lumotlarni tuzatib, qayta yuboring.
```

New match:

```text
Yangi match! Siz va {name} bir-biringizni yoqtirdingiz.
```

## Webhook Logic

- Verify `X-Telegram-Bot-Api-Secret-Token`.
- Ignore duplicate update IDs.
- Parse `/start` referral payloads.
- Route admin support replies by callback data or ticket metadata.
- Keep all business writes idempotent.

## Admin Audit Channel

Send audit messages for:

- New Profile
- Profile Updated
- Profile Deleted
- User Banned
- Premium Purchased
- Support Ticket Created

Template:

```text
Event: {event}
Profile ID: {profileId}
Telegram User ID: {telegramUserId}
Timestamp: {isoTimestamp}
```
