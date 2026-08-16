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
-- 3. Profils joueur (roles d'agent, rang, disponibilite en direct...)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  riot_id text not null,
  game_roles text[] not null default '{}' check (
    game_roles <@ array['DUELIST', 'INITIATOR', 'CONTROLLER', 'SENTINEL']
  ),
  rank_tier text not null check (
    rank_tier in ('FER', 'BRONZE', 'ARGENT', 'OR', 'PLATINE', 'DIAMANT', 'ASCENDANT', 'IMMORTEL', 'RADIANT')
  ),
  rank_division text check (rank_division in ('1', '2', '3') or rank_division is null),
  -- Statut "disponible maintenant" bascule depuis la barre de navigation,
  -- plutot qu'une liste de creneaux horaires declares a l'avance.
  is_available boolean not null default false,
  bio text not null default '',
  discord_tag text not null default '',
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4. Signalements de profil
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

-- ---------------------------------------------------------------------
-- 5. Notifications (alertes de match)
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.account_status enable row level security;
alter table public.app_users enable row level security;
alter table public.admins enable row level security;
alter table public.profiles enable row level security;
alter table public.reports enable row level security;
alter table public.notifications enable row level security;

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

-- ---------------------------------------------------------------------
-- Seed des 2 comptes admin (a executer APRES leur inscription normale
-- via l'application, avec les emails que tu choisis). Adapte les emails
-- ci-dessous puis execute uniquement ce bloc depuis le SQL Editor.
-- ---------------------------------------------------------------------
-- insert into public.admins (user_id)
-- select id from auth.users where email in ('admin@m8finder.gg', 'admin2@m8finder.gg')
-- on conflict (user_id) do nothing;
