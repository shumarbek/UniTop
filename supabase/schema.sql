-- UniTop Telegram Mini App platform schema for Supabase/PostgreSQL.
-- Run in Supabase SQL editor after enabling pgcrypto.

create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', false)
on conflict (id) do nothing;

create type public.gender as enum ('male', 'female');
create type public.profile_status as enum ('pending', 'approved', 'rejected', 'banned');
create type public.purpose as enum (
  'friendship',
  'communication',
  'relationship',
  'gaming_partner',
  'study_partner',
  'networking'
);
create type public.like_action as enum ('like', 'skip');
create type public.ticket_status as enum ('open', 'in_progress', 'closed');
create type public.ticket_category as enum (
  'general_question',
  'bug_report',
  'payment_problem',
  'report_user',
  'business_partnership',
  'advertising_inquiry',
  'contact_developer'
);
create type public.payment_status as enum ('pending', 'paid', 'failed', 'refunded');
create type public.audit_event as enum (
  'new_profile',
  'profile_updated',
  'profile_deleted',
  'user_banned',
  'premium_purchased',
  'support_ticket_created',
  'profile_approved',
  'profile_rejected'
);

create table public.users (
  id uuid primary key default gen_random_uuid(),
  telegram_id bigint not null unique,
  username text,
  first_name text,
  last_name text,
  language_code text not null default 'uz',
  is_admin boolean not null default false,
  is_banned boolean not null default false,
  ban_reason text,
  terms_version text,
  terms_accepted_at timestamptz,
  channel_checked_at timestamptz,
  referred_by uuid references public.users(id) on delete set null,
  referral_code text not null unique default encode(gen_random_bytes(8), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  age int not null check (age between 18 and 80),
  gender public.gender not null,
  region text not null,
  district text not null,
  city text,
  bio text not null check (char_length(bio) between 10 and 300),
  looking_for_gender public.gender not null,
  purpose public.purpose not null,
  university text,
  occupation text,
  height_cm int check (height_cm between 120 and 230),
  status public.profile_status not null default 'pending',
  rejection_reason text,
  moderation_notes text,
  approved_at timestamptz,
  moderated_by uuid references public.users(id) on delete set null,
  last_active_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  storage_path text not null,
  is_primary boolean not null default false,
  face_detected boolean,
  single_person boolean,
  is_appropriate boolean,
  moderation_status public.profile_status not null default 'pending',
  ownership_confirmed boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.interests (
  id uuid primary key default gen_random_uuid(),
  name_uz text not null unique,
  slug text not null unique
);

create table public.profile_interests (
  profile_id uuid not null references public.profiles(id) on delete cascade,
  interest_id uuid not null references public.interests(id) on delete cascade,
  primary key (profile_id, interest_id)
);

create table public.likes (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid not null references public.profiles(id) on delete cascade,
  target_profile_id uuid not null references public.profiles(id) on delete cascade,
  action public.like_action not null,
  created_at timestamptz not null default now(),
  unique (actor_profile_id, target_profile_id),
  check (actor_profile_id <> target_profile_id)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  profile_a_id uuid not null references public.profiles(id) on delete cascade,
  profile_b_id uuid not null references public.profiles(id) on delete cascade,
  matched_at timestamptz not null default now(),
  unmatched_at timestamptz,
  unmatched_by uuid references public.profiles(id) on delete set null,
  check (profile_a_id < profile_b_id),
  unique (profile_a_id, profile_b_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references public.users(id) on delete cascade,
  reported_user_id uuid not null references public.users(id) on delete cascade,
  reason text not null,
  details text,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  plan_days int not null check (plan_days in (7, 30, 90)),
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  source_payment_id uuid,
  created_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  provider text not null,
  provider_payment_id text not null unique,
  amount numeric(12,2) not null check (amount >= 0),
  currency text not null default 'UZS',
  status public.payment_status not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

alter table public.subscriptions
  add constraint subscriptions_source_payment_id_fkey
  foreign key (source_payment_id) references public.payments(id) on delete set null;

create table public.boosts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  payment_id uuid references public.payments(id) on delete set null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_user_id uuid not null references public.users(id) on delete cascade,
  referred_user_id uuid not null unique references public.users(id) on delete cascade,
  reward_type text,
  reward_applied_at timestamptz,
  created_at timestamptz not null default now(),
  check (referrer_user_id <> referred_user_id)
);

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  category public.ticket_category not null,
  subject text not null,
  status public.ticket_status not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create table public.support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  sender_user_id uuid references public.users(id) on delete set null,
  is_admin_reply boolean not null default false,
  body text not null,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null,
  title_uz text not null,
  body_uz text not null,
  telegram_sent_at timestamptz,
  read_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  event public.audit_event not null,
  actor_user_id uuid references public.users(id) on delete set null,
  subject_user_id uuid references public.users(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  telegram_user_id bigint,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.daily_usage (
  user_id uuid not null references public.users(id) on delete cascade,
  usage_date date not null default current_date,
  profile_views int not null default 0,
  referral_extra_views int not null default 0,
  primary key (user_id, usage_date)
);

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question_uz text not null,
  answer_uz text not null,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create index users_telegram_id_idx on public.users(telegram_id);
create index users_referral_code_idx on public.users(referral_code);
create index profiles_status_region_district_idx on public.profiles(status, region, district);
create index profiles_gender_lookup_idx on public.profiles(gender, looking_for_gender, age);
create index photos_profile_primary_idx on public.photos(profile_id, is_primary);
create index likes_actor_created_idx on public.likes(actor_profile_id, created_at desc);
create index likes_target_action_idx on public.likes(target_profile_id, action);
create index matches_profile_a_idx on public.matches(profile_a_id);
create index matches_profile_b_idx on public.matches(profile_b_id);
create index reports_status_idx on public.reports(status, created_at desc);
create index subscriptions_user_ends_idx on public.subscriptions(user_id, ends_at desc);
create index boosts_active_idx on public.boosts(profile_id, ends_at desc);
create index support_tickets_status_idx on public.support_tickets(status, created_at desc);
create index notifications_user_read_idx on public.notifications(user_id, read_at, created_at desc);
create index audit_logs_event_created_idx on public.audit_logs(event, created_at desc);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_touch_updated_at before update on public.users
for each row execute function public.touch_updated_at();

create trigger profiles_touch_updated_at before update on public.profiles
for each row execute function public.touch_updated_at();

create trigger support_tickets_touch_updated_at before update on public.support_tickets
for each row execute function public.touch_updated_at();

create or replace function public.current_user_id()
returns uuid
language sql
stable
as $$
  select id from public.users where telegram_id = nullif(auth.jwt() ->> 'telegram_id', '')::bigint
$$;

alter table public.users enable row level security;
alter table public.profiles enable row level security;
alter table public.photos enable row level security;
alter table public.interests enable row level security;
alter table public.profile_interests enable row level security;
alter table public.likes enable row level security;
alter table public.matches enable row level security;
alter table public.reports enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.boosts enable row level security;
alter table public.referrals enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.daily_usage enable row level security;
alter table public.faqs enable row level security;

create policy "users can read own user" on public.users
  for select using (id = public.current_user_id());

create policy "users can update safe own fields" on public.users
  for update using (id = public.current_user_id())
  with check (id = public.current_user_id() and is_admin = false);

create policy "approved profiles are discoverable" on public.profiles
  for select using (status = 'approved' or user_id = public.current_user_id());

create policy "users manage own profile draft" on public.profiles
  for all using (user_id = public.current_user_id())
  with check (user_id = public.current_user_id());

create policy "approved photos are visible" on public.photos
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = photos.profile_id
        and (p.status = 'approved' or p.user_id = public.current_user_id())
    )
  );

create policy "users manage own photos" on public.photos
  for all using (
    exists (select 1 from public.profiles p where p.id = photos.profile_id and p.user_id = public.current_user_id())
  )
  with check (
    exists (select 1 from public.profiles p where p.id = photos.profile_id and p.user_id = public.current_user_id())
  );

create policy "public interests read" on public.interests for select using (true);
create policy "profile interests visible" on public.profile_interests for select using (true);

create policy "users manage own likes" on public.likes
  for all using (
    exists (select 1 from public.profiles p where p.id = likes.actor_profile_id and p.user_id = public.current_user_id())
  )
  with check (
    exists (select 1 from public.profiles p where p.id = likes.actor_profile_id and p.user_id = public.current_user_id())
  );

create policy "users read own matches" on public.matches
  for select using (
    exists (
      select 1 from public.profiles p
      where p.user_id = public.current_user_id()
        and p.id in (matches.profile_a_id, matches.profile_b_id)
    )
  );

create policy "users create reports" on public.reports
  for insert with check (reporter_user_id = public.current_user_id());

create policy "users read own reports" on public.reports
  for select using (reporter_user_id = public.current_user_id());

create policy "users read own subscriptions" on public.subscriptions
  for select using (user_id = public.current_user_id());

create policy "users read own payments" on public.payments
  for select using (user_id = public.current_user_id());

create policy "active boosts visible" on public.boosts
  for select using (ends_at > now());

create policy "users read own referrals" on public.referrals
  for select using (referrer_user_id = public.current_user_id() or referred_user_id = public.current_user_id());

create policy "users manage own tickets" on public.support_tickets
  for all using (user_id = public.current_user_id())
  with check (user_id = public.current_user_id());

create policy "users read own support messages" on public.support_messages
  for select using (
    exists (select 1 from public.support_tickets t where t.id = support_messages.ticket_id and t.user_id = public.current_user_id())
  );

create policy "users add own support messages" on public.support_messages
  for insert with check (
    exists (select 1 from public.support_tickets t where t.id = support_messages.ticket_id and t.user_id = public.current_user_id())
  );

create policy "users read own notifications" on public.notifications
  for select using (user_id = public.current_user_id());

create policy "users update own notifications" on public.notifications
  for update using (user_id = public.current_user_id())
  with check (user_id = public.current_user_id());

create policy "users read own daily usage" on public.daily_usage
  for select using (user_id = public.current_user_id());

create policy "published faqs read" on public.faqs
  for select using (is_published = true);

-- Admin and bot service operations should use the Supabase service-role key only
-- from trusted server routes/Edge Functions, never from the Telegram Mini App.
