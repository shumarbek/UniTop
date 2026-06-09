import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceSupabase } from "@/lib/supabase/server";
import { sendAuditEvent } from "@/lib/telegram/bot";

const ticketSchema = z.object({
  telegramId: z.coerce.number().int().positive(),
  category: z.enum([
    "general_question",
    "bug_report",
    "payment_problem",
    "report_user",
    "business_partnership",
    "advertising_inquiry",
    "contact_developer"
  ]),
  subject: z.string().min(3).max(120),
  body: z.string().min(5).max(1000)
});

export async function GET(request: Request) {
  const telegramId = Number(new URL(request.url).searchParams.get("telegramId"));
  if (!telegramId) return NextResponse.json({ error: "telegramId kerak" }, { status: 400 });
  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "supabase_not_configured" }, { status: 500 });
  const { data: user } = await supabase.from("users").select("id").eq("telegram_id", telegramId).single();
  if (!user) return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  const { data, error } = await supabase.from("support_tickets").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, tickets: data ?? [] });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = ticketSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "validation_failed", issues: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "supabase_not_configured" }, { status: 500 });
  const { data: user } = await supabase.from("users").select("id").eq("telegram_id", parsed.data.telegramId).single();
  if (!user) return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({ user_id: user.id, category: parsed.data.category, subject: parsed.data.subject })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await supabase.from("support_messages").insert({ ticket_id: ticket.id, sender_user_id: user.id, body: parsed.data.body });
  await sendAuditEvent("support_ticket_created", { telegram_user_id: parsed.data.telegramId, ticket_id: ticket.id, timestamp: new Date().toISOString() }).catch(() => null);
  return NextResponse.json({ ok: true, ticket });
}
