import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceSupabase } from "@/lib/supabase/server";

const paymentSchema = z.object({
  telegramId: z.coerce.number().int().positive(),
  type: z.enum(["premium", "boost"]),
  planDays: z.coerce.number().int().optional(),
  boostHours: z.coerce.number().int().optional()
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = paymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation_failed", issues: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ error: "supabase_not_configured" }, { status: 500 });
  const { data: user } = await supabase.from("users").select("id").eq("telegram_id", parsed.data.telegramId).single();
  if (!user) return NextResponse.json({ error: "user_not_found" }, { status: 404 });

  const amount = parsed.data.type === "premium"
    ? ({ 7: 19000, 30: 59000, 90: 149000 } as Record<number, number>)[parsed.data.planDays ?? 0]
    : ({ 1: 9000, 6: 29000, 24: 79000 } as Record<number, number>)[parsed.data.boostHours ?? 0];
  if (!amount) return NextResponse.json({ error: "Noto'g'ri plan tanlandi" }, { status: 400 });

  const paymentId = crypto.randomUUID();
  const { error } = await supabase.from("payments").insert({
    id: paymentId,
    user_id: user.id,
    provider: "manual_or_provider",
    provider_payment_id: paymentId,
    amount,
    currency: "UZS",
    status: "pending",
    metadata: parsed.data
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    ok: true,
    payment: {
      id: paymentId,
      provider: "manual_demo",
      status: "pending",
      checkoutUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/payments/webhook?paymentId=${paymentId}`
    }
  });
}
