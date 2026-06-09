"use client";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Camera,
  Check,
  ChevronRight,
  Crown,
  Heart,
  HelpCircle,
  Loader2,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
  Zap
} from "lucide-react";
import { interests, purposes } from "@/lib/options";

const regions = ["Toshkent", "Samarqand", "Buxoro", "Farg'ona", "Andijon", "Namangan", "Qashqadaryo"];

type Step = "boot" | "terms" | "channel" | "profile" | "discover";
type Tab = "discover" | "matches" | "premium" | "support";
type Candidate = {
  id: string;
  display_name: string;
  age: number;
  region: string;
  district: string;
  bio: string;
  purpose: string;
  photoUrl?: string | null;
};

export default function MiniAppHome() {
  const [step, setStep] = useState<Step>("boot");
  const [tab, setTab] = useState<Tab>("discover");
  const [telegramId, setTelegramId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [profileStatus, setProfileStatus] = useState("draft");

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    tg?.ready?.();
    tg?.expand?.();
    tg?.setHeaderColor?.("#f4f7fb");
    tg?.setBackgroundColor?.("#f4f7fb");

    const initData = tg?.initData ?? "";
    void authTelegram(initData);
    // Telegram WebApp bootstrapping must run once on Mini App open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function authTelegram(initData: string) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/telegram", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ initData })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Telegram auth xatosi");
      const id = Number(payload.user?.telegram_id ?? payload.user?.id);
      if (!id) throw new Error("Ilovani Telegram ichida oching.");
      setTelegramId(id);
      const meResponse = await fetch(`/api/me?telegramId=${id}`);
      const me = await meResponse.json();
      setProfileStatus(me.profile?.status ?? me.user?.profiles?.[0]?.status ?? "draft");
      if (!me.user?.terms_accepted_at) setStep("terms");
      else if (!me.user?.channel_checked_at) setStep("channel");
      else if ((me.profile?.status ?? me.user?.profiles?.[0]?.status) !== "approved") setStep("profile");
      else {
        setStep("discover");
        await loadDiscovery(id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noma'lum xatolik");
      setStep("terms");
    } finally {
      setBusy(false);
    }
  }

  async function acceptTerms() {
    if (!telegramId) return setError("Telegram ID topilmadi.");
    setBusy(true);
    const response = await fetch("/api/terms/accept", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ telegramId })
    });
    setBusy(false);
    if (response.ok) setStep("channel");
    else setError("Shartlarni saqlashda xatolik.");
  }

  async function checkChannel() {
    if (!telegramId) return setError("Telegram ID topilmadi.");
    setBusy(true);
    const response = await fetch("/api/channel/check", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ telegramId })
    });
    const payload = await response.json();
    setBusy(false);
    if (payload.member) setStep("profile");
    else setError("Avval rasmiy kanalga obuna bo'ling.");
  }

  async function loadDiscovery(id = telegramId) {
    if (!id) return;
    const response = await fetch(`/api/discovery/next?telegramId=${id}`);
    const payload = await response.json();
    setCandidate(payload.candidate ?? null);
  }

  async function reactToCandidate(action: "like" | "skip") {
    if (!telegramId || !candidate) return;
    await fetch("/api/likes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ telegramId, targetProfileId: candidate.id, action })
    });
    await loadDiscovery(telegramId);
  }

  async function loadMatches() {
    if (!telegramId) return;
    const response = await fetch(`/api/matches?telegramId=${telegramId}`);
    const payload = await response.json();
    setMatches(payload.matches ?? []);
  }

  const progress = useMemo(() => ({ boot: 10, terms: 25, channel: 50, profile: 75, discover: 100 }[step]), [step]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-md overflow-hidden bg-[#eef3f7] text-ink">
      <section className="relative min-h-screen pb-24">
        <div className="absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_20%_20%,rgba(19,159,143,0.24),transparent_32%),radial-gradient(circle_at_82%_10%,rgba(239,91,98,0.22),transparent_30%),linear-gradient(135deg,#f9fbfd,#e8f1f5)]" />
        <header className="relative z-10 px-5 pb-4 pt-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-white shadow-soft"><Sparkles size={22} /></div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">Telegram Mini App</p>
                <h1 className="text-3xl font-black">UniTop</h1>
              </div>
            </div>
            <button className="grid h-12 w-12 place-items-center rounded-2xl border border-white/70 bg-white/80 text-ink shadow-sm" aria-label="Bildirishnomalar"><Bell size={20} /></button>
          </div>
          <div className="mt-5 rounded-2xl border border-white/70 bg-white/80 p-3 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wide text-slate-500">
              {["Start", "Kanal", "Profil", "Live"].map((item, index) => <span key={item} className={index * 25 < progress ? "text-ink" : ""}>{item}</span>)}
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-gradient-to-r from-brand via-amber to-coral transition-all" style={{ width: `${progress}%` }} /></div>
          </div>
          {error && <div className="mt-4 rounded-2xl border border-coral/30 bg-coral/10 p-3 text-sm font-bold text-coral">{error}</div>}
        </header>

        <div className="relative z-10 px-5">
          {step === "boot" && <LoadingPanel text="Telegram sessiya tekshirilmoqda..." />}
          {step === "terms" && <TermsPanel busy={busy} onAccept={acceptTerms} />}
          {step === "channel" && <ChannelPanel busy={busy} onCheck={checkChannel} />}
          {step === "profile" && telegramId && <ProfilePanel telegramId={telegramId} onDone={() => { setProfileStatus("pending"); setStep("discover"); }} />}
          {step === "discover" && (
            <Workspace
              tab={tab}
              setTab={(next) => {
                setTab(next);
                if (next === "matches") void loadMatches();
              }}
              candidate={candidate}
              matches={matches}
              profileStatus={profileStatus}
              onReact={reactToCandidate}
              reload={() => loadDiscovery()}
            />
          )}
        </div>
      </section>
    </main>
  );
}

function TermsPanel({ busy, onAccept }: { busy: boolean; onAccept: () => void }) {
  return (
    <GlassPanel>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-wide text-coral">Start</p>
          <h2 className="mt-2 text-3xl font-black leading-tight">Real profil, real xavfsizlik</h2>
        </div>
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand/10 text-brand"><ShieldCheck size={26} /></div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">Davom etish uchun maxfiylik siyosati va foydalanish shartlarini qabul qiling. Telegram ID, qabul qilingan versiya va vaqt saqlanadi.</p>
      <div className="mt-5 grid gap-3">
        <Metric title="3 ta rasm" value="Yuz aniq ko'ringan bo'lishi shart" icon={<Camera size={18} />} />
        <Metric title="Moderatsiya" value="Admin tasdiqlamaguncha discovery yo'q" icon={<Check size={18} />} />
        <Metric title="Bot bog'langan" value="Match va moderation xabarlari Telegramda" icon={<Zap size={18} />} />
      </div>
      <PrimaryButton busy={busy} onClick={onAccept}>Qabul qilaman</PrimaryButton>
    </GlassPanel>
  );
}

function ChannelPanel({ busy, onCheck }: { busy: boolean; onCheck: () => void }) {
  return (
    <GlassPanel>
      <div className="grid h-16 w-16 place-items-center rounded-3xl bg-ink text-white shadow-soft"><ShieldCheck size={28} /></div>
      <h2 className="mt-5 text-3xl font-black">Kanal obunasi</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">Rasmiy kanalga obuna Bot API orqali real tekshiriladi. Obuna bo&apos;lmagan foydalanuvchi profil yaratolmaydi.</p>
      <div className="mt-5 rounded-2xl border border-dashed border-brand/40 bg-brand/10 p-4">
        <p className="text-sm font-black text-slate-500">Rasmiy kanal</p>
        <p className="mt-1 text-xl font-black">Envdagi TELEGRAM_REQUIRED_CHANNEL</p>
      </div>
      <PrimaryButton busy={busy} onClick={onCheck}>Obunani tekshirish</PrimaryButton>
    </GlassPanel>
  );
}

function ProfilePanel({ telegramId, onDone }: { telegramId: number; onDone: () => void }) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>(["IT", "Kitob", "Musiqa"]);
  const [files, setFiles] = useState<File[]>([]);
  const [ownershipConfirmed, setOwnershipConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function onFiles(event: ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(event.target.files ?? []).slice(0, 9));
  }

  async function submit() {
    setError("");
    if (files.length < 3) return setError("Kamida 3 ta rasm yuklang.");
    if (!ownershipConfirmed) return setError("Rasmlar o'zingizga tegishli ekanini tasdiqlang.");
    setBusy(true);
    try {
      const photoPaths: string[] = [];
      for (const file of files) {
        const signResponse = await fetch("/api/profiles/photo", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ telegramId, fileName: file.name, contentType: file.type, size: file.size })
        });
        const signed = await signResponse.json();
        if (!signResponse.ok) throw new Error(signed.error ?? "Rasm upload URL olinmadi.");
        const upload = await fetch(signed.signedUrl, { method: "PUT", headers: { "content-type": file.type }, body: file });
        if (!upload.ok) throw new Error("Rasm Storage'ga yuklanmadi.");
        photoPaths.push(signed.path);
      }

      const response = await fetch("/api/profiles", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          telegramId,
          firstName: (document.getElementById("firstName") as HTMLInputElement)?.value,
          age: Number((document.getElementById("age") as HTMLInputElement)?.value),
          gender: (document.getElementById("gender") as HTMLSelectElement)?.value,
          region: (document.getElementById("region") as HTMLSelectElement)?.value,
          district: (document.getElementById("district") as HTMLInputElement)?.value,
          bio: (document.getElementById("bio") as HTMLTextAreaElement)?.value,
          lookingForGender: (document.getElementById("lookingForGender") as HTMLSelectElement)?.value,
          purpose: (document.getElementById("purpose") as HTMLSelectElement)?.value,
          interests: selectedInterests,
          photoPaths,
          ownershipConfirmed
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Profil saqlanmadi.");
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Noma'lum xatolik");
    } finally {
      setBusy(false);
    }
  }

  return (
    <GlassPanel>
      <p className="text-sm font-black uppercase tracking-wide text-brand">Profil</p>
      <h2 className="mt-1 text-3xl font-black">3 ta real rasm bilan anketa</h2>
      <div className="mt-5 space-y-3">
        <TextField id="firstName" label="Ism" value="" />
        <div className="grid grid-cols-2 gap-3"><TextField id="age" label="Yosh" value="" /><SelectField id="gender" label="Jins" options={[["female", "Ayol"], ["male", "Erkak"]]} /></div>
        <div className="grid grid-cols-2 gap-3"><SelectField id="region" label="Viloyat" options={regions.map((item) => [item, item])} /><TextField id="district" label="Tuman" value="" /></div>
        <div className="grid grid-cols-2 gap-3"><SelectField id="lookingForGender" label="Kimni qidiryapsiz" options={[["female", "Ayol"], ["male", "Erkak"]]} /><SelectField id="purpose" label="Maqsad" options={purposes.map((item) => [item.value, item.label])} /></div>
        <label className="block"><span className="text-xs font-black uppercase tracking-wide text-slate-500">Bio</span><textarea id="bio" className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-brand/30 focus:ring-4" /></label>
        <div>
          <p className="text-xs font-black uppercase tracking-wide text-slate-500">Qiziqishlar</p>
          <div className="mt-2 flex flex-wrap gap-2">{interests.map((item) => <button key={item} onClick={() => setSelectedInterests((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item])} className={`rounded-full border px-3 py-2 text-sm font-black ${selectedInterests.includes(item) ? "border-ink bg-ink text-white" : "border-slate-200 bg-white text-slate-700"}`}>{item}</button>)}</div>
        </div>
        <label className="block rounded-3xl border border-dashed border-brand/40 bg-brand/10 p-4">
          <span className="flex items-center gap-2 font-black"><Upload size={18} /> Kamida 3 ta rasm</span>
          <span className="mt-1 block text-sm text-slate-600">Har bir rasmda yuzingiz aniq ko&apos;ringan va rasm o&apos;zingizga tegishli bo&apos;lishi kerak.</span>
          <input className="mt-3 w-full text-sm" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={onFiles} />
          <span className="mt-2 block text-sm font-black text-brand">{files.length} ta rasm tanlandi</span>
        </label>
        <label className="flex gap-3 rounded-2xl bg-slate-50 p-3 text-sm font-bold text-slate-700">
          <input type="checkbox" checked={ownershipConfirmed} onChange={(event) => setOwnershipConfirmed(event.target.checked)} />
          Rasmlar meniki, yuzim aniq ko&apos;ringan va platforma qoidalariga mos.
        </label>
      </div>
      {error && <p className="mt-4 rounded-2xl bg-coral/10 p-3 text-sm font-bold text-coral">{error}</p>}
      <PrimaryButton busy={busy} onClick={submit}>Moderatsiyaga yuborish</PrimaryButton>
    </GlassPanel>
  );
}

function Workspace({ tab, setTab, candidate, matches, profileStatus, onReact, reload }: { tab: Tab; setTab: (tab: Tab) => void; candidate: Candidate | null; matches: any[]; profileStatus: string; onReact: (action: "like" | "skip") => void; reload: () => void }) {
  return (
    <div className="space-y-4">
      {profileStatus !== "approved" && <div className="rounded-3xl border border-amber/30 bg-white p-4 shadow-sm"><p className="font-black">Profil moderatsiyada</p><p className="mt-1 text-sm text-slate-600">Tasdiqlangandan keyin real discovery ochiladi.</p></div>}
      {tab === "discover" && <Discovery candidate={candidate} onReact={onReact} reload={reload} />}
      {tab === "matches" && <Matches matches={matches} />}
      {tab === "premium" && <Premium />}
      {tab === "support" && <Support />}
      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-md border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="grid grid-cols-4 gap-2">
          <NavButton active={tab === "discover"} onClick={() => setTab("discover")} icon={<Search size={20} />} label="Topish" />
          <NavButton active={tab === "matches"} onClick={() => setTab("matches")} icon={<Heart size={20} />} label="Match" />
          <NavButton active={tab === "premium"} onClick={() => setTab("premium")} icon={<Crown size={20} />} label="Premium" />
          <NavButton active={tab === "support"} onClick={() => setTab("support")} icon={<HelpCircle size={20} />} label="Yordam" />
        </div>
      </nav>
    </div>
  );
}

function Discovery({ candidate, onReact, reload }: { candidate: Candidate | null; onReact: (action: "like" | "skip") => void; reload: () => void }) {
  if (!candidate) return <GlassPanel><h2 className="text-2xl font-black">Hozircha profil yo&apos;q</h2><p className="mt-2 text-sm text-slate-600">Profilingiz tasdiqlanganidan yoki yangi mos profillar paydo bo&apos;lganidan keyin bu yerda ko&apos;rinadi.</p><PrimaryButton busy={false} onClick={reload}>Qayta tekshirish</PrimaryButton></GlassPanel>;
  return (
    <article className="overflow-hidden rounded-[28px] bg-white shadow-soft">
      <div className="relative aspect-[0.82] bg-slate-200">{candidate.photoUrl ? <img src={candidate.photoUrl} alt={candidate.display_name} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-slate-400"><Camera size={48} /></div>}<div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent p-5 text-white"><h2 className="text-4xl font-black">{candidate.display_name}, {candidate.age}</h2><p className="mt-2 flex items-center gap-1 text-sm font-semibold"><MapPin size={15} /> {candidate.region}, {candidate.district}</p></div></div>
      <div className="p-5"><p className="font-black text-brand">{candidate.purpose}</p><p className="mt-2 text-sm leading-6 text-slate-600">{candidate.bio}</p><div className="mt-5 grid grid-cols-[1fr_1.25fr] gap-3"><button onClick={() => onReact("skip")} className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white font-black text-ink"><X size={20} /> O&apos;tkazish</button><button onClick={() => onReact("like")} className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-coral font-black text-white shadow-soft"><Heart size={20} /> Like</button></div></div>
    </article>
  );
}

function Matches({ matches }: { matches: any[] }) {
  return <GlassPanel><h2 className="text-2xl font-black">Matchlar</h2><div className="mt-4 space-y-3">{matches.length === 0 ? <p className="text-sm text-slate-600">Hozircha match yo&apos;q.</p> : matches.map((item) => <div key={item.id} className="rounded-2xl bg-slate-50 p-4"><p className="font-black">{item.profile?.display_name ?? "Profil"}</p><p className="text-sm text-slate-500">{new Date(item.matched_at).toLocaleString("uz-UZ")}</p></div>)}</div></GlassPanel>;
}

function Premium() {
  return <GlassPanel><h2 className="text-2xl font-black">Premium</h2><div className="mt-5 grid gap-3">{[["7 kun", "19 000 UZS"], ["30 kun", "59 000 UZS"], ["90 kun", "149 000 UZS"]].map(([days, price]) => <button key={days} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left"><span className="font-black">{days}</span><span className="font-black text-brand">{price}</span></button>)}</div></GlassPanel>;
}

function Support() {
  return <GlassPanel><h2 className="text-2xl font-black">Yordam markazi</h2><div className="mt-4 space-y-3">{["Profil nega rad etildi?", "Premium qanday ishlaydi?", "Match qanday yaratiladi?", "Akkauntni qanday o'chiraman?"].map((item) => <button key={item} className="flex w-full items-center justify-between rounded-2xl bg-slate-50 p-4 text-left font-black">{item} <ChevronRight size={18} /></button>)}</div></GlassPanel>;
}

function LoadingPanel({ text }: { text: string }) {
  return <GlassPanel><div className="flex items-center gap-3"><Loader2 className="animate-spin text-brand" /><p className="font-black">{text}</p></div></GlassPanel>;
}

function GlassPanel({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[28px] border border-white/75 bg-white/90 p-5 shadow-soft backdrop-blur">{children}</div>;
}

function Metric({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return <div className="flex gap-3 rounded-2xl bg-slate-50 p-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-brand">{icon}</span><span><span className="block text-sm font-black">{title}</span><span className="block text-sm text-slate-500">{value}</span></span></div>;
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return <button onClick={onClick} className={`flex h-14 flex-col items-center justify-center gap-1 rounded-2xl text-xs font-black ${active ? "bg-ink text-white" : "bg-slate-50 text-slate-500"}`}>{icon}{label}</button>;
}

function PrimaryButton({ children, busy, onClick }: { children: React.ReactNode; busy: boolean; onClick: () => void }) {
  return <button disabled={busy} onClick={onClick} className="mt-6 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-ink font-black text-white shadow-soft disabled:opacity-60">{busy ? <Loader2 className="animate-spin" size={18} /> : children} {!busy && <ChevronRight size={18} />}</button>;
}

function TextField({ id, label, value }: { id: string; label: string; value: string }) {
  return <label className="block"><span className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</span><input id={id} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none ring-brand/30 focus:ring-4" defaultValue={value} /></label>;
}

function SelectField({ id, label, options }: { id: string; label: string; options: string[][] }) {
  return <label className="block"><span className="text-xs font-black uppercase tracking-wide text-slate-500">{label}</span><select id={id} className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none ring-brand/30 focus:ring-4">{options.map(([value, labelText]) => <option key={value} value={value}>{labelText}</option>)}</select></label>;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        ready?: () => void;
        expand?: () => void;
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
      };
    };
  }
}
