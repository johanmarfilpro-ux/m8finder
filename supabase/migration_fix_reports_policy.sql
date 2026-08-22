-- Correctif : la policy RLS d'insertion sur "reports" en production bloque
-- actuellement TOUS les signalements (erreur 42501, meme entre deux comptes
-- tout neufs, non-admins). La policy vivante ne correspond visiblement plus
-- a celle de schema.sql -- on la reapplique explicitement pour resynchroniser.
--
-- A executer UNE SEULE FOIS dans le SQL Editor Supabase.

drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports
  for insert with check (
    auth.uid() = reporter_id
    and not exists (select 1 from public.admins a where a.user_id = reported_user_id)
  );
