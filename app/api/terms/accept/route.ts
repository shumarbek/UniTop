import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";

const TERMS_VERSION = "2026-06-08";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const telegramId = Number(body.telegramId);

  if (!telegramId) {
    return NextResponse.json({ error: "telegramId kerak" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ ok: true, mode: "demo", termsVersion: TERMS_VERSION, acceptedAt: new Date().toISOString() });
  }

  const { error } = await supabase
    .from("users")
    .update({ terms_version: TERMS_VERSION, terms_accepted_at: new Date().toISOString() })
    .eq("telegram_id", telegramId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, termsVersion: TERMS_VERSION });
}
