-- Migration : rend la liste des administrateurs lisible par tout
-- utilisateur connecte (necessaire pour afficher le badge [ADMIN] dans la
-- recherche), et empeche la creation d'un signalement contre un compte
-- admin directement au niveau de la base (en plus du controle deja fait
-- cote interface).
--
-- A executer UNE SEULE FOIS dans le SQL Editor Supabase, sur un projet qui
-- a deja les tables "admins" et "reports" (creees avec une version
-- anterieure de schema.sql). Si tu crees un projet Supabase neuf, ignore
-- ce fichier : schema.sql contient deja les bonnes policies.

drop policy if exists "admins_select_self" on public.admins;
drop policy if exists "admins_select_self_or_admin" on public.admins;
drop policy if exists "admins_select_authenticated" on public.admins;
create policy "admins_select_authenticated" on public.admins
  for select using (auth.role() = 'authenticated');

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports
  for insert with check (
    auth.uid() = reporter_id
    and not exists (select 1 from public.admins a where a.user_id = reported_user_id)
  );
