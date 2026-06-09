import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getServiceSupabase } from "@/lib/supabase/server";
import { validatePhotoUpload } from "@/lib/validation/photo";

const bucket = process.env.SUPABASE_PROFILE_PHOTOS_BUCKET ?? "profile-photos";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = validatePhotoUpload(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "validation_failed", issues: parsed.error.flatten().fieldErrors }, { status: 422 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 500 });
  }

  const extension = parsed.data.contentType.split("/")[1].replace("jpeg", "jpg");
  const storagePath = `pending/${parsed.data.telegramId}/${randomUUID()}.${extension}`;
  const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(storagePath);

  if (error) {
    return NextResponse.json({ error: error.message, bucket }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    bucket,
    path: storagePath,
    signedUrl: data.signedUrl,
    token: data.token
  });
}
