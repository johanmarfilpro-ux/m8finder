-- M8Finder - schema Supabase (Postgres)
-- A executer une seule fois dans Supabase > SQL Editor sur un projet neuf.
-- Idempotent : peut etre relance sans erreur si les objets existent deja.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. Statut de compte (ACTIF / SUSPENDU / BANNI)
--    Une ligne par utilisateur, creee automatiquement a l'inscription.
-- ---------------------------------------------------------------------
create table if not exists public.account_status (
  user_id uuid primary key references auth.users (id) on delete cascade,
  status text not null default 'ACTIF' check (status in ('ACTIF', 'SUSPENDU', 'BANNI')),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 1bis. Copie minimale et publique (aux admins) de auth.users.
--       auth.users n'est pas interrogeable via l'API cote client ; cette
--       table est alimentee automatiquement a l'inscription pour que le
--       panneau admin puisse afficher pseudo/email des comptes joueurs.
-- ---------------------------------------------------------------------
create table if not exists public.app_users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  username text not null,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.account_status (user_id) values (new.id)
  on conflict (user_id) do nothing;

  insert into public.app_users (id, email, username)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;

  -- Profil de compte minimal cree automatiquement (nom affiche = pseudo) :
  -- sans lui, des fonctionnalites comme le toggle de disponibilite dans la
  -- navbar n'ont rien a afficher tant que l'utilisateur n'a jamais soumis
  -- le formulaire de profil sur /profil.
  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 2. Liste blanche des administrateurs.
--    Ne JAMAIS exposer d'action d'ecriture cote client sur cette table :
--    elle ne se modifie qu'a la main depuis le SQL Editor / dashboard.
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create or replace function public.is_admin()
returns boolean as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$ language sql security definer stable set search_path = public;

-- ---------------------------------------------------------------------
-- 3. Jeux geres par l'application.
--    Chaque jeu definit sa propre liste de roles et de rangs sous forme
--    de donnees (jsonb), pas de code en dur : ajouter un jeu = ajouter
--    une ligne ici, sans toucher au frontend. Ne se modifie qu'a la main
--    depuis le SQL Editor / dashboard (comme "admins").
--
--    roles  : [{ "value": "DUELIST", "label": "Duelliste" }, ...]
--    ranks  : [{ "value": "FER", "label": "Fer", "hasDivision": true }, ...]
--    divisions : ["1", "2", "3"] (liste des divisions possibles pour ce jeu,
--                utilisee seulement pour les rangs ou hasDivision = true)
--    platforms : [{ "value": "PC", "label": "PC" }, ...] (liste vide si le
--                jeu ne distingue pas de plateforme, ex: jeu mobile only)
-- ---------------------------------------------------------------------
create table if not exists public.games (
  id text primary key,
  label text not null,
  roles jsonb not null default '[]'::jsonb,
  ranks jsonb not null default '[]'::jsonb,
  divisions jsonb not null default '[]'::jsonb,
  platforms jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.games (id, label, roles, ranks, divisions, platforms, sort_order)
values (
  'VALORANT',
  'Valorant',
  '[
    {"value": "DUELIST", "label": "Duelliste"},
    {"value": "INITIATOR", "label": "Initiateur"},
    {"value": "CONTROLLER", "label": "Controleur"},
    {"value": "SENTINEL", "label": "Sentinelle"}
  ]'::jsonb,
  '[
    {"value": "FER", "label": "Fer", "hasDivision": true},
    {"value": "BRONZE", "label": "Bronze", "hasDivision": true},
    {"value": "ARGENT", "label": "Argent", "hasDivision": true},
    {"value": "OR", "label": "Or", "hasDivision": true},
    {"value": "PLATINE", "label": "Platine", "hasDivision": true},
    {"value": "DIAMANT", "label": "Diamant", "hasDivision": true},
    {"value": "ASCENDANT", "label": "Ascendant", "hasDivision": true},
    {"value": "IMMORTEL", "label": "Immortel", "hasDivision": true},
    {"value": "RADIANT", "label": "Radiant", "hasDivision": false}
  ]'::jsonb,
  '["1", "2", "3"]'::jsonb,
  '[
    {"value": "PC", "label": "PC"},
    {"value": "CONSOLE", "label": "Console"}
  ]'::jsonb,
  0
)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- 4. Profils de compte (infos communes a tous les jeux).
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  bio text not null default '',
  discord_tag text not null default '',
  -- Statut "disponible maintenant" bascule depuis la barre de navigation,
  -- plutot qu'une liste de creneaux horaires declares a l'avance. Commun
  -- a tous les jeux du joueur.
  is_available boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 5. Profils de jeu : un joueur peut avoir un profil par jeu (role(s),
--    rang, identifiant in-game). Pour un jeu qui definit des plateformes
--    (voir games.platforms), un joueur peut avoir un profil par
--    plateforme (ex: un profil PC et un profil Console pour Valorant),
--    mais pas deux profils sur la meme plateforme. Pour un jeu sans
--    plateforme, "platform" vaut 'NONE' et un seul profil est autorise.
-- ---------------------------------------------------------------------
create table if not exists public.game_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  game_id text not null references public.games (id) on delete cascade,
  in_game_id text not null,
  roles text[] not null default '{}',
  rank_tier text not null,
  rank_division text,
  platform text not null default 'NONE',
  updated_at timestamptz not null default now(),
  unique (user_id, game_id, platform)
);

-- ---------------------------------------------------------------------
-- 6. Signalements de profil
-- ---------------------------------------------------------------------
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reported_user_id uuid not null references auth.users (id) on delete cascade,
  reason text not null,
  details text not null default '',
  status text not null default 'EN_ATTENTE' check (status in ('EN_ATTENTE', 'TRAITE', 'REJETE')),
  created_at timestamptz not null default now()
);

-- Insertion via une fonction dediee plutot qu'un insert direct + RLS : la
-- policy d'insertion sur "reports" est correcte mais Postgres la rejette de
-- facon reproductible sur la forme INSERT...SELECT...LATERAL que PostgREST
-- genere pour tout appel REST (anomalie constatee, non expliquee). La
-- fonction fait ses propres verifications et contourne RLS (SECURITY
-- DEFINER sur une table sans FORCE ROW LEVEL SECURITY).
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

-- ---------------------------------------------------------------------
-- 7. Notifications (alertes de match)
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 8. Alertes de match : criteres de recherche sauvegardes (jeu, roles,
--    rangs, plateformes ; tableau vide = "peu importe"). Des qu'un joueur
--    passe disponible et que son profil de jeu correspond aux criteres
--    d'une alerte, une notification est creee automatiquement (voir le
--    trigger plus bas) pour le proprietaire de cette alerte.
-- ---------------------------------------------------------------------
create table if not exists public.match_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  game_id text not null references public.games (id) on delete cascade,
  roles text[] not null default '{}',
  rank_tiers text[] not null default '{}',
  platforms text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Se declenche quand un profil passe de "indisponible" a "disponible" :
-- pour chaque profil de jeu de ce joueur, notifie tout proprietaire
-- d'alerte dont les criteres correspondent (tableau vide = joker).
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

-- ---------------------------------------------------------------------
-- 9. Messagerie privee entre deux joueurs.
--    Une conversation par paire d'utilisateurs (peu importe qui l'a
--    initiee), avec ses messages. Un message peut etre signale (voir
--    reports.message_id plus bas).
-- ---------------------------------------------------------------------
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references auth.users (id) on delete cascade,
  user_b_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  check (user_a_id <> user_b_id)
);

-- Une seule conversation par paire, peu importe l'ordre des deux ids.
create unique index if not exists conversations_pair_idx
  on public.conversations (least(user_a_id, user_b_id), greatest(user_a_id, user_b_id));

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  content text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Un signalement peut cibler un message precis (moderation d'une
-- conversation) en plus de cibler un profil dans son ensemble.
alter table public.reports add column if not exists message_id uuid references public.messages (id) on delete set null;

-- A chaque nouveau message : met a jour la date du dernier message sur la
-- conversation (pour trier la liste), et notifie le destinataire (reutilise
-- la meme cloche de notifications que les alertes de match).
create or replace function public.handle_new_message()
returns trigger as $$
declare
  conv record;
  recipient_id uuid;
  sender_name text;
begin
  select * into conv from public.conversations where id = new.conversation_id;

  update public.conversations set last_message_at = new.created_at where id = new.conversation_id;

  recipient_id := case when conv.user_a_id = new.sender_id then conv.user_b_id else conv.user_a_id end;
  select display_name into sender_name from public.profiles where user_id = new.sender_id;

  insert into public.notifications (user_id, message)
  values (recipient_id, coalesce(sender_name, 'Un joueur') || ' t''a envoye un message.');

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_message_inserted on public.messages;
create trigger on_message_inserted
  after insert on public.messages
  for each row execute function public.handle_new_message();

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.account_status enable row level security;
alter table public.app_users enable row level security;
alter table public.admins enable row level security;
alter table public.games enable row level security;
alter table public.profiles enable row level security;
alter table public.game_profiles enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;
alter table public.match_alerts enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- account_status : tout utilisateur connecte peut lire (necessaire pour
-- afficher uniquement les profils actifs dans la recherche) ; seul un
-- admin peut modifier le statut d'un compte (suspendre/bannir/reactiver).
drop policy if exists "account_status_select_authenticated" on public.account_status;
create policy "account_status_select_authenticated" on public.account_status
  for select using (auth.role() = 'authenticated');

drop policy if exists "account_status_update_admin_only" on public.account_status;
create policy "account_status_update_admin_only" on public.account_status
  for update using (public.is_admin());

-- admins : lisible par tout utilisateur connecte (necessaire pour afficher
-- le badge [ADMIN] dans la recherche et empecher le signalement d'un
-- admin cote interface). Aucune ecriture n'est autorisee depuis l'app :
-- cette table ne se modifie qu'a la main depuis le SQL Editor / dashboard.
drop policy if exists "admins_select_self" on public.admins;
drop policy if exists "admins_select_self_or_admin" on public.admins;
drop policy if exists "admins_select_authenticated" on public.admins;
create policy "admins_select_authenticated" on public.admins
  for select using (auth.role() = 'authenticated');

-- games : lisible par tout utilisateur connecte (peuple les selecteurs de
-- jeu, roles et rangs dans le profil et la recherche). Aucune ecriture
-- n'est autorisee depuis l'app.
drop policy if exists "games_select_authenticated" on public.games;
create policy "games_select_authenticated" on public.games
  for select using (auth.role() = 'authenticated');

-- app_users : reserve aux admins (moderation) et a l'utilisateur pour
-- son propre enregistrement. N'est jamais lu par les pages joueur
-- classiques (recherche/profil), qui n'utilisent que "profiles".
drop policy if exists "app_users_select_admin_or_self" on public.app_users;
create policy "app_users_select_admin_or_self" on public.app_users
  for select using (auth.uid() = id or public.is_admin());

-- profiles : lecture ouverte aux utilisateurs connectes (recherche de
-- coequipiers) ; ecriture limitee a son propre profil.
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated" on public.profiles
  for select using (auth.role() = 'authenticated');

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id);

-- game_profiles : lecture ouverte aux utilisateurs connectes (recherche
-- de coequipiers par jeu) ; ecriture limitee a ses propres profils de jeu.
drop policy if exists "game_profiles_select_authenticated" on public.game_profiles;
create policy "game_profiles_select_authenticated" on public.game_profiles
  for select using (auth.role() = 'authenticated');

drop policy if exists "game_profiles_insert_own" on public.game_profiles;
create policy "game_profiles_insert_own" on public.game_profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "game_profiles_update_own" on public.game_profiles;
create policy "game_profiles_update_own" on public.game_profiles
  for update using (auth.uid() = user_id);

drop policy if exists "game_profiles_delete_own" on public.game_profiles;
create policy "game_profiles_delete_own" on public.game_profiles
  for delete using (auth.uid() = user_id);

-- reports : un joueur peut creer un signalement en son nom, sauf contre un
-- compte admin (verrou cote base, en plus du controle cote interface) ;
-- seuls les admins peuvent les consulter et les traiter.
drop policy if exists "reports_insert_own" on public.reports;
create policy "reports_insert_own" on public.reports
  for insert with check (
    auth.uid() = reporter_id
    and not exists (select 1 from public.admins a where a.user_id = reported_user_id)
  );

drop policy if exists "reports_select_admin_only" on public.reports;
create policy "reports_select_admin_only" on public.reports
  for select using (public.is_admin());

drop policy if exists "reports_update_admin_only" on public.reports;
create policy "reports_update_admin_only" on public.reports
  for update using (public.is_admin());

-- notifications : chaque joueur ne voit et ne gere que les siennes.
drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id);

drop policy if exists "notifications_insert_own" on public.notifications;
create policy "notifications_insert_own" on public.notifications
  for insert with check (auth.uid() = user_id);

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id);

-- match_alerts : chaque joueur ne voit, cree et supprime que les siennes.
-- Le trigger qui insere des notifications tourne en security definer et
-- n'est donc pas soumis a ces regles (il doit pouvoir lire toutes les
-- alertes pour trouver celles qui correspondent).
drop policy if exists "match_alerts_select_own" on public.match_alerts;
create policy "match_alerts_select_own" on public.match_alerts
  for select using (auth.uid() = user_id);

drop policy if exists "match_alerts_insert_own" on public.match_alerts;
create policy "match_alerts_insert_own" on public.match_alerts
  for insert with check (auth.uid() = user_id);

drop policy if exists "match_alerts_delete_own" on public.match_alerts;
create policy "match_alerts_delete_own" on public.match_alerts
  for delete using (auth.uid() = user_id);

-- conversations : chaque participant voit et cree ses propres
-- conversations (l'unicite par paire est deja garantie par l'index).
drop policy if exists "conversations_select_participant" on public.conversations;
create policy "conversations_select_participant" on public.conversations
  for select using (auth.uid() = user_a_id or auth.uid() = user_b_id);

drop policy if exists "conversations_insert_participant" on public.conversations;
create policy "conversations_insert_participant" on public.conversations
  for insert with check (auth.uid() = user_a_id or auth.uid() = user_b_id);

-- messages : lisibles/inscriptibles uniquement par les deux participants
-- de la conversation ; seul le destinataire (pas l'auteur) peut marquer un
-- message comme lu.
drop policy if exists "messages_select_participant" on public.messages;
create policy "messages_select_participant" on public.messages
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (c.user_a_id = auth.uid() or c.user_b_id = auth.uid())
    )
  );

drop policy if exists "messages_insert_participant" on public.messages;
create policy "messages_insert_participant" on public.messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (c.user_a_id = auth.uid() or c.user_b_id = auth.uid())
    )
  );

drop policy if exists "messages_update_mark_read" on public.messages;
create policy "messages_update_mark_read" on public.messages
  for update using (
    auth.uid() <> sender_id
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id and (c.user_a_id = auth.uid() or c.user_b_id = auth.uid())
    )
  );

-- les admins peuvent lire n'importe quel message signale, meme s'ils ne
-- sont pas participants de la conversation, pour instruire le signalement.
drop policy if exists "messages_select_admin" on public.messages;
create policy "messages_select_admin" on public.messages
  for select using (public.is_admin());

-- ---------------------------------------------------------------------
-- Seed des 2 comptes admin (a executer APRES leur inscription normale
-- via l'application, avec les emails que tu choisis). Adapte les emails
-- ci-dessous puis execute uniquement ce bloc depuis le SQL Editor.
-- ---------------------------------------------------------------------
-- insert into public.admins (user_id)
-- select id from auth.users where email in ('admin@m8finder.gg', 'admin2@m8finder.gg')
-- on conflict (user_id) do nothing;
