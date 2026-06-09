import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json().catch(() => ({}));
  if (!body.body || String(body.body).length < 2) {
    return NextResponse.json({ error: "Xabar matni kerak" }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    message: { id: crypto.randomUUID(), ticketId: params.id, body: String(body.body), createdAt: new Date().toISOString() }
  });
}
