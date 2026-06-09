import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const hours = Number(body.hours);

  if (![1, 6, 24].includes(hours)) {
    return NextResponse.json({ error: "Boost 1, 6 yoki 24 soat bo'lishi kerak" }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    boost: {
      id: crypto.randomUUID(),
      hours,
      status: "payment_pending",
      startsAt: null
    }
  });
}
