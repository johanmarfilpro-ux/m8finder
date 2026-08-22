-- Contournement d'un bug RLS reproductible sur "reports" : la policy
-- "reports_insert_own" est correcte (verifiee manuellement en SQL) mais
-- echoue systematiquement sur la requete INSERT...SELECT...LATERAL que
-- PostgREST genere pour toute insertion via l'API REST, meme reduite au
-- strict minimum (auth.uid() = reporter_id). Plutot que de continuer a
-- chasser cette anomalie, on passe par une fonction serveur dediee qui fait
-- ses propres verifications et insere directement (elle appartient a
-- "postgres", donc contourne RLS comme n'importe quelle fonction SECURITY
-- DEFINER sur une table qui n'a pas FORCE ROW LEVEL SECURITY).
--
-- A executer UNE SEULE FOIS dans le SQL Editor Supabase.

create or replace function public.create_report(
  p_reported_user_id uuid,
  p_reason text,
  p_details text default '',
  p_message_id uuid default null
)
returns public.reports
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report public.reports;
begin
  if auth.uid() is null then
    raise exception 'Non authentifie.';
  end if;

  if exists (select 1 from public.admins where user_id = p_reported_user_id) then
    raise exception 'Les comptes administrateurs ne peuvent pas etre signales.';
  end if;

  insert into public.reports (reporter_id, reported_user_id, reason, details, message_id)
  values (auth.uid(), p_reported_user_id, p_reason, coalesce(p_details, ''), p_message_id)
  returning * into v_report;

  return v_report;
end;
$$;

grant execute on function public.create_report(uuid, text, text, uuid) to authenticated;
