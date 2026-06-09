import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const requiredTables = [
  "users",
  "profiles",
  "photos",
  "interests",
  "profile_interests",
  "likes",
  "matches",
  "reports",
  "subscriptions",
  "payments",
  "boosts",
  "referrals",
  "support_tickets",
  "support_messages",
  "notifications",
  "audit_logs",
  "daily_usage",
  "faqs"
];

export async function GET() {
  const supabase = getServiceSupabase();
  if (!supabase) return NextResponse.json({ ok: false, error: "supabase_not_configured" }, { status: 500 });

  const tableChecks = await Promise.all(
    requiredTables.map(async (table) => {
      const { error } = await supabase.from(table).select("*").limit(1);
      return { table, ok: !error, error: error?.message ?? null };
    })
  );

  const bucket = process.env.SUPABASE_PROFILE_PHOTOS_BUCKET ?? "profile-photos";
  const { data: bucketData, error: bucketError } = await supabase.storage.getBucket(bucket);
  const bucketExists = Boolean(bucketData && !bucketError);

  return NextResponse.json({
    ok: tableChecks.every((item) => item.ok) && bucketExists,
    tables: tableChecks,
    storage: {
      bucket,
      ok: bucketExists,
      bucketName: bucketData?.name ?? null,
      error: bucketError?.message ?? null
    }
  });
}
