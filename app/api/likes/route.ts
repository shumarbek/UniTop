import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";
import { sendTelegramMessage } from "@/lib/telegram/bot";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const telegramId = Number(body.telegramId);
  if (!telegramId || !body.targetProfileId || !["like", "skip"].includes(body.action)) {
    return NextResponse.json({ error: "telegramId, targetProfileId va action kerak" }, { status: 400 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "supabase_not_configured" }, { status: 500 });

  const { data: user } = await supabase.from("users").select("id").eq("telegram_id", telegramId).single();
  if (!user) return NextResponse.json({ error: "user_not_found" }, { status: 404 });

  const { data: actor } = await supabase.from("profiles").select("id, status").eq("user_id", user.id).single();
  if (!actor || actor.status !== "approved") return NextResponse.json({ error: "profile_not_approved" }, { status: 403 });

  const { error } = await supabase.from("likes").upsert(
    {
      actor_profile_id: actor.id,
      target_profile_id: String(body.targetProfileId),
      action: body.action
    },
    { onConflict: "actor_profile_id,target_profile_id" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let match = null;
  if (body.action === "like") {
    const { data: reciprocal } = await supabase
      .from("likes")
      .select("id")
      .eq("actor_profile_id", String(body.targetProfileId))
      .eq("target_profile_id", actor.id)
      .eq("action", "like")
      .maybeSingle();

    if (reciprocal) {
      const [profileA, profileB] = [actor.id, String(body.targetProfileId)].sort();
      const { data: matchData } = await supabase
        .from("matches")
        .upsert({ profile_a_id: profileA, profile_b_id: profileB }, { onConflict: "profile_a_id,profile_b_id" })
        .select("id, matched_at")
        .single();
      match = matchData;

      const { data: targetUser } = await supabase
        .from("profiles")
        .select("users(telegram_id)")
        .eq("id", String(body.targetProfileId))
        .single();
      const targetTelegramId = Array.isArray(targetUser?.users) ? targetUser?.users[0]?.telegram_id : (targetUser?.users as any)?.telegram_id;
      if (targetTelegramId) {
        await sendTelegramMessage({ chat_id: targetTelegramId, text: "Yangi match! UniTop Mini App ichida ko'ring." }).catch(() => null);
      }
      await sendTelegramMessage({ chat_id: telegramId, text: "Yangi match! UniTop Mini App ichida ko'ring." }).catch(() => null);
    }
  }

  return NextResponse.json({ ok: true, action: body.action, matched: Boolean(match), match });
}
