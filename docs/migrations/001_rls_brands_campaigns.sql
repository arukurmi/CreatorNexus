/* M1: owner-only row-level security. The backend's service-role key bypasses RLS; the public anon key does not. */
alter table brands enable row level security;

drop policy if exists brands_select_own on brands;
create policy brands_select_own on brands for select to authenticated using (owner_id = (select auth.uid()));
drop policy if exists brands_insert_own on brands;
create policy brands_insert_own on brands for insert to authenticated with check (owner_id = (select auth.uid()));
drop policy if exists brands_update_own on brands;
create policy brands_update_own on brands for update to authenticated using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists brands_delete_own on brands;
create policy brands_delete_own on brands for delete to authenticated using (owner_id = (select auth.uid()));
