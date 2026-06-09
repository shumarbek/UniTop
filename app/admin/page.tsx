import { CheckCircle, CircleDollarSign, ShieldAlert, Users, Heart, BadgeCheck, MessageCircle, XCircle } from "lucide-react";
import { getServiceSupabase } from "@/lib/supabase/server";
import type { ReactNode } from "react";

export default async function AdminPage() {
  const supabase = getServiceSupabase();
  const stats = await loadStats();
  const { data: queue } = supabase
    ? await supabase
        .from("profiles")
        .select("id, display_name, status, region, district, created_at, photos(id)")
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(25)
    : { data: [] };

  return (
    <main className="min-h-screen bg-mist px-5 py-6">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-brand">UniTop Admin</p>
            <h1 className="text-3xl font-black text-ink">Moderatsiya paneli</h1>
          </div>
          <button className="flex h-11 items-center justify-center gap-2 rounded-lg bg-ink px-4 font-bold text-white">
            <ShieldAlert size={18} /> Audit kanal
          </button>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Foydalanuvchilar" value={String(stats.totalUsers)} icon={<Users />} />
          <StatCard label="Premium" value={String(stats.premiumUsers)} icon={<BadgeCheck />} />
          <StatCard label="Matchlar" value={String(stats.matchesCreated)} icon={<Heart />} />
          <StatCard label="Bugungi ro'yxat" value={String(stats.dailyRegistrations)} icon={<MessageCircle />} />
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="rounded-lg bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-ink">Profil navbati</h2>
              <span className="rounded-full bg-amber/10 px-3 py-1 text-sm font-bold text-amber">{queue?.length ?? 0} pending</span>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="text-xs uppercase text-slate-500">
                  <tr><th className="py-3">ID</th><th>Ism</th><th>Hudud</th><th>Rasm</th><th className="text-right">Action</th></tr>
                </thead>
                <tbody>
                  {(queue ?? []).length === 0 && <tr><td className="py-5 text-slate-500" colSpan={5}>Moderatsiya navbatida profil yo&apos;q.</td></tr>}
                  {(queue ?? []).map((item: any) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="py-4 font-bold text-ink">{item.id.slice(0, 8)}</td>
                      <td>{item.display_name}</td>
                      <td>{item.region}, {item.district}</td>
                      <td><span className="rounded-full bg-brand/10 px-2 py-1 text-xs font-bold text-brand">{item.photos?.length ?? 0} ta</span></td>
                      <td>
                        <div className="flex justify-end gap-2">
                          <form action={`/api/admin/profiles/${item.id}/approve`} method="post"><button className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-white" aria-label="Tasdiqlash"><CheckCircle size={17} /></button></form>
                          <form action={`/api/admin/profiles/${item.id}/reject`} method="post"><button className="grid h-9 w-9 place-items-center rounded-lg bg-coral text-white" aria-label="Rad etish"><XCircle size={17} /></button></form>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-lg bg-white p-5 shadow-sm">
            <CircleDollarSign className="text-brand" size={24} />
            <h2 className="mt-4 text-xl font-black text-ink">Daromad</h2>
            <p className="mt-2 text-3xl font-black">{Number(stats.revenue).toLocaleString("uz-UZ")} UZS</p>
          </div>
        </section>
      </div>
    </main>
  );
}

async function loadStats() {
  const supabase = getServiceSupabase();
  if (!supabase) return { totalUsers: 0, premiumUsers: 0, matchesCreated: 0, dailyRegistrations: 0, revenue: 0 };
  const today = new Date().toISOString().slice(0, 10);
  const [users, premium, matches, registrations, revenue] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("subscriptions").select("id", { count: "exact", head: true }).gt("ends_at", new Date().toISOString()),
    supabase.from("matches").select("id", { count: "exact", head: true }),
    supabase.from("users").select("id", { count: "exact", head: true }).gte("created_at", `${today}T00:00:00.000Z`),
    supabase.from("payments").select("amount").eq("status", "paid")
  ]);
  return {
    totalUsers: users.count ?? 0,
    premiumUsers: premium.count ?? 0,
    matchesCreated: matches.count ?? 0,
    dailyRegistrations: registrations.count ?? 0,
    revenue: (revenue.data ?? []).reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
  };
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: ReactNode }) {
  return (
    <div className="rounded-lg bg-white p-5 shadow-sm">
      <span className="text-brand">{icon}</span>
      <p className="mt-4 text-sm font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-black text-ink">{value}</p>
    </div>
  );
}
