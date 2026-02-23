-- Transactions memory table
create table transactions (
  id bigint primary key generated always as identity,
  amount numeric not null,
  category text not null check (category in ('Food', 'Transport', 'Shopping', 'Housing', 'Entertainment', 'Medical', 'Salary', 'Other')),
  type text not null check (type in ('expense', 'income')),
  description text,
  date timestamptz default now()
);

-- Monthly settings table
create table monthly_settings (
  id bigint primary key generated always as identity,
  month text not null unique, -- format 'YYYY-MM'
  income numeric default 0,
  savings_goal numeric default 0
);

-- Basic indexes for performance
create index idx_transactions_date on transactions(date);
create index idx_monthly_settings_month on monthly_settings(month);
