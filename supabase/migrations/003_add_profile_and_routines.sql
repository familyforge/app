-- Add profile, routines, and goals tables for parent control center

create table if not exists public.parent_profiles (
  parent_id uuid primary key references public.parents(id) on delete cascade,
  name text,
  avatar_url text,
  timezone text,
  language text,
  role text,
  tone text,
  goal text,
  preferences jsonb,
  notifications jsonb,
  privacy jsonb,
  updated_at timestamptz default now()
);

create table if not exists public.parent_routines (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.parents(id) on delete cascade,
  type text not null,
  title text not null,
  steps text[] default '{}',
  reminder_time text,
  reminder_enabled boolean default true,
  streak integer default 0,
  last_completed_date date,
  updated_at timestamptz default now()
);

create table if not exists public.parent_goals (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.parents(id) on delete cascade,
  title text not null,
  description text,
  target_days integer default 14,
  current_streak integer default 0,
  updated_at timestamptz default now()
);

-- Extend children table with profile details
alter table public.children
  add column if not exists nickname text,
  add column if not exists birthday date,
  add column if not exists school_schedule text,
  add column if not exists interests text[],
  add column if not exists learning_style text,
  add column if not exists special_needs text,
  add column if not exists archived boolean default false;

create index if not exists parent_profiles_parent_id_idx on public.parent_profiles(parent_id);
create index if not exists parent_routines_parent_id_idx on public.parent_routines(parent_id);
create index if not exists parent_goals_parent_id_idx on public.parent_goals(parent_id);
create index if not exists children_archived_idx on public.children(archived);
