create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  active_plan text not null default 'trial',
  generations_used integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_active_plan_check check (active_plan in ('trial', 'starter', 'plus', 'unlimited'))
);

create table if not exists public.recipes (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  category text not null default 'diner',
  tags text[] not null default '{}',
  total_time_minutes integer,
  recipe_json jsonb not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint recipes_category_check check (category in ('ontbijt', 'lunch', 'diner', 'snack'))
);

create index if not exists recipes_user_id_idx on public.recipes(user_id);
create index if not exists recipes_category_idx on public.recipes(category);
create index if not exists recipes_updated_at_idx on public.recipes(updated_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

drop trigger if exists set_recipes_updated_at on public.recipes;
create trigger set_recipes_updated_at
before update on public.recipes
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.recipes enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Users can view own recipes" on public.recipes;
create policy "Users can view own recipes"
on public.recipes
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own recipes" on public.recipes;
create policy "Users can insert own recipes"
on public.recipes
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own recipes" on public.recipes;
create policy "Users can update own recipes"
on public.recipes
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own recipes" on public.recipes;
create policy "Users can delete own recipes"
on public.recipes
for delete
to authenticated
using (auth.uid() = user_id);
