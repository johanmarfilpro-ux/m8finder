-- Migration : vrai systeme d'alertes de match. Un joueur sauvegarde des
-- criteres de recherche (jeu, roles, rangs, plateformes ; vide = "peu
-- importe") ; des qu'un AUTRE joueur passe disponible et que l'un de ses
-- profils de jeu correspond, une notification est creee automatiquement
-- pour le proprietaire de l'alerte.
--
-- A executer UNE SEULE FOIS dans le SQL Editor Supabase, sur un projet qui
-- a deja les tables games/profiles/game_profiles/notifications. Si tu crees
-- un projet Supabase neuf, ignore ce fichier : schema.sql contient deja
-- tout ce qu'il faut.

create table if not exists public.match_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  game_id text not null references public.games (id) on delete cascade,
  roles text[] not null default '{}',
  rank_tiers text[] not null default '{}',
  platforms text[] not null default '{}',
  created_at timestamptz not null default now()
);

create or replace function public.notify_match_alerts()
returns trigger as $$
declare
  gp record;
  alert record;
  role_labels text;
  rank_label text;
  game_label text;
  reporter_name text;
begin
  select display_name into reporter_name from public.profiles where user_id = new.user_id;

  for gp in select * from public.game_profiles where user_id = new.user_id loop
    select label into game_label from public.games where id = gp.game_id;

    select string_agg(elem ->> 'label', ', ')
      into role_labels
      from jsonb_array_elements((select roles from public.games where id = gp.game_id)) elem
      where elem ->> 'value' = any (gp.roles);

    select elem ->> 'label'
      into rank_label
      from jsonb_array_elements((select ranks from public.games where id = gp.game_id)) elem
      where elem ->> 'value' = gp.rank_tier;

    for alert in
      select * from public.match_alerts a
      where a.game_id = gp.game_id
        and a.user_id <> new.user_id
        and (array_length(a.roles, 1) is null or a.roles && gp.roles)
        and (array_length(a.rank_tiers, 1) is null or gp.rank_tier = any (a.rank_tiers))
        and (array_length(a.platforms, 1) is null or gp.platform = any (a.platforms))
    loop
      insert into public.notifications (user_id, message)
      values (
        alert.user_id,
        coalesce(reporter_name, 'Un joueur') || ' est disponible pour ' || coalesce(game_label, gp.game_id) ||
          ' (' || coalesce(role_labels, 'role inconnu') || ', ' || coalesce(rank_label, 'rang inconnu') || ')'
      );
    end loop;
  end loop;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_profile_available_changed on public.profiles;
create trigger on_profile_available_changed
  after update of is_available on public.profiles
  for each row
  when (new.is_available = true and old.is_available = false)
  execute function public.notify_match_alerts();

alter table public.match_alerts enable row level security;

drop policy if exists "match_alerts_select_own" on public.match_alerts;
create policy "match_alerts_select_own" on public.match_alerts
  for select using (auth.uid() = user_id);

drop policy if exists "match_alerts_insert_own" on public.match_alerts;
create policy "match_alerts_insert_own" on public.match_alerts
  for insert with check (auth.uid() = user_id);

drop policy if exists "match_alerts_delete_own" on public.match_alerts;
create policy "match_alerts_delete_own" on public.match_alerts
  for delete using (auth.uid() = user_id);
