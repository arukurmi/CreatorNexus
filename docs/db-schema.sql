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

alter table brands enable row level security;

drop policy if exists brands_select_own on brands;
create policy brands_select_own on brands for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists brands_insert_own on brands;
create policy brands_insert_own on brands for insert to authenticated with check (owner_id = (select auth.uid()));
drop policy if exists brands_update_own on brands;
create policy brands_update_own on brands for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists brands_delete_own on brands;
create policy brands_delete_own on brands for delete to authenticated using (owner_id = (select auth.uid()));

alter table campaigns enable row level security;

drop policy if exists campaigns_select_own on campaigns;
create policy campaigns_select_own on campaigns for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists campaigns_insert_own on campaigns;
create policy campaigns_insert_own on campaigns for insert to authenticated with check (owner_id = (select auth.uid()));
drop policy if exists campaigns_update_own on campaigns;
create policy campaigns_update_own on campaigns for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists campaigns_delete_own on campaigns;
create policy campaigns_delete_own on campaigns for delete to authenticated using (owner_id = (select auth.uid()));
