create extension if not exists "pgcrypto";

create table if not exists brands (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null,
  name text not null,
  niche text not null,
  created_at timestamptz not null default now()
);

create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete set null,
  owner_id uuid not null,
  niche text not null,
  budget numeric not null,
  strategy text not null,
  count int,
  result jsonb not null,
  projected_spend numeric not null,
  created_at timestamptz not null default now()
);

create index if not exists brands_owner_idx on brands(owner_id);
create index if not exists campaigns_owner_idx on campaigns(owner_id);
