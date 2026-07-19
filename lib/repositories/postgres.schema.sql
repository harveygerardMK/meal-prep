-- Target schema for the hosted Postgres adapter (Phase 0 follow-up).
-- Not applied automatically yet; JSON repositories remain the default driver.

create table if not exists settings (
  id text primary key default 'default',
  dinners_per_week integer not null,
  max_cook_minutes integer not null,
  no_repeat_weeks integer not null,
  servings integer not null,
  updated_at timestamptz not null default now()
);

create table if not exists recipes (
  id text primary key,
  kind text not null check (kind in ('dinner', 'girl_lunch', 'boy_lunch')),
  name text not null,
  protein text,
  cook_minutes integer,
  tags jsonb not null default '[]'::jsonb,
  ingredients jsonb not null default '[]'::jsonb,
  status text not null default 'active',
  favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists week_plans (
  week_of date primary key,
  dinners jsonb not null,
  girl_lunch text not null,
  boy_lunch text not null,
  locks jsonb not null,
  preferences jsonb,
  misc_grocery jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
