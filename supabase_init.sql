-- drop existing objects so the script can be run from scratch
-- (use carefully; this will delete all data)

DROP TABLE IF EXISTS monthly_settings;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS users;

-- Custom users table (manual auth)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password text not null
);

-- Transactions table
create table transactions (
  id bigint primary key generated always as identity,
  user_id uuid not null references users(id) on delete cascade,
  amount numeric not null,
  category text not null check (category in ('Food', 'Transport', 'Shopping', 'Housing', 'Entertainment', 'Medical', 'Salary', 'Other')),
  type text not null check (type in ('expense', 'income')),
  description text,
  original_text text,      -- raw voice transcript or typed input
  date timestamptz default now()
);

-- Monthly settings table
create table monthly_settings (
  id bigint primary key generated always as identity,
  user_id uuid not null references users(id) on delete cascade,
  month text not null, -- format 'YYYY-MM' (cycle key)
  income numeric default 0,
  savings_goal numeric default 0,
  initial_spent numeric default 0,
  cycle_start_day int default 11
);

-- Basic indexes
create index idx_transactions_user_date on transactions(user_id, date);
create index idx_transactions_date on transactions(date);
create index idx_monthly_settings_user_month on monthly_settings(user_id, month);

-- Ensure one settings row per user per cycle
create unique index monthly_settings_user_month_unique on monthly_settings(user_id, month);

-- RLS (Row Level Security)
-- We aren't using Supabase Auth for access control anymore. You can keep RLS
-- enabled if you implement your own check (for example, passing user_id via
-- row-level policies), but the default auth.uid() will always be null. For
-- simplicity this project turns off RLS or allows all access:

-- comment out RLS policies or replace `using`/`with check` expressions with
-- `true` if needed.
-- alter table transactions enable row level security;
-- alter table monthly_settings enable row level security;

-- Policies have been removed; manage access in application code when using
-- custom users table.

-- Migration: add original_text if upgrading from older schema
-- alter table transactions add column if not exists original_text text;
-- Migration for multi-user / migrating from auth.users to custom users:
-- alter table transactions alter column user_id drop default;
-- (you may need to drop and recreate foreign key or convert)
-- backfill user_id then enable RLS + add policies.
