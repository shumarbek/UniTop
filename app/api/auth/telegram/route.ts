import { NextResponse } from "next/server";
import { verifyTelegramInitData } from "@/lib/telegram/init-data";
import { getServiceSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const result = verifyTelegramInitData(String(body.initData ?? ""));

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({
      ok: true,
      mode: "demo",
      user: result.user,
      message: "Supabase env sozlanmagan, demo sessiya qaytdi."
    });
  }

  const telegramUser = result.user as { id?: number; first_name?: string; last_name?: string; username?: string } | null;
  if (!telegramUser?.id) {
    return NextResponse.json({ error: "telegram_user_missing" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("users")
    .upsert(
      {
        telegram_id: telegramUser.id,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        username: telegramUser.username,
        language_code: "uz"
      },
      { onConflict: "telegram_id" }
    )
    .select("id, telegram_id, first_name, terms_accepted_at, channel_checked_at, is_admin, is_banned")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, user: data });
}
