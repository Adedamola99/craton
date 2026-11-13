-- Craton · docs/supabase-schema.sql
-- Run this in your Supabase SQL Editor if you want to enable automatic cloud sync across devices.
-- Craton works 100% offline without this; when configured, `app/js/25-sync.js` syncs to this table.

create table if not exists public.craton_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  progress jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.craton_profiles enable row level security;

create policy "Users can read their own Craton profile"
  on public.craton_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert their own Craton profile"
  on public.craton_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own Craton profile"
  on public.craton_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Classes & Lecturer Dashboard tables (used by app/js/26-classroom.js)
create table if not exists public.craton_classes (
  code text primary key,
  title text not null,
  lecturer text,
  unit text not null default 'All',
  question_count int not null default 6,
  seed bigint not null default 101,
  created_at timestamptz not null default now()
);

create table if not exists public.craton_class_submissions (
  submission_id text primary key,
  class_code text not null,
  student_name text not null,
  answers jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now()
);

alter table public.craton_classes enable row level security;
alter table public.craton_class_submissions enable row level security;

create policy "Anyone can view classes" on public.craton_classes for select using (true);
create policy "Anyone can create classes" on public.craton_classes for insert with check (true);
create policy "Anyone can view class submissions" on public.craton_class_submissions for select using (true);
create policy "Anyone can submit class challenge answers" on public.craton_class_submissions for insert with check (true);
