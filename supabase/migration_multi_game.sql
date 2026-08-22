-- Migration : passage d'un modele "un seul jeu code en dur (Valorant)" a
-- un modele multi-jeux ou chaque joueur peut avoir un profil (roles, rang,
-- identifiant in-game) par jeu. Les jeux, leurs roles et leurs rangs
-- deviennent des donnees en base (table "games") au lieu d'etre codes en
-- dur dans le frontend.
--
-- A executer UNE SEULE FOIS dans le SQL Editor Supabase, sur un projet qui
-- a deja l'ancienne table "profiles" (avec riot_id/game_roles/rank_tier/
-- rank_division). Si tu crees un projet Supabase neuf, ignore ce fichier :
-- schema.sql contient deja le bon schema.

-- 1. Table des jeux, avec Valorant seede (memes donnees que schema.sql).
create table if not exists public.games (
  id text primary key,
  label text not null,
  roles jsonb not null default '[]'::jsonb,
  ranks jsonb not null default '[]'::jsonb,
  divisions jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.games (id, label, roles, ranks, divisions, sort_order)
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
  0
)
on conflict (id) do nothing;

alter table public.games enable row level security;
drop policy if exists "games_select_authenticated" on public.games;
create policy "games_select_authenticated" on public.games
  for select using (auth.role() = 'authenticated');

-- 2. Table des profils de jeu.
create table if not exists public.game_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  game_id text not null references public.games (id) on delete cascade,
  in_game_id text not null,
  roles text[] not null default '{}',
  rank_tier text not null,
  rank_division text,
  updated_at timestamptz not null default now(),
  unique (user_id, game_id)
);

alter table public.game_profiles enable row level security;

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

-- 3. Recupere les profils Valorant existants dans "game_profiles" avant de
--    retirer les colonnes specifiques a un jeu de "profiles".
insert into public.game_profiles (user_id, game_id, in_game_id, roles, rank_tier, rank_division, updated_at)
select user_id, 'VALORANT', riot_id, game_roles, rank_tier, rank_division, updated_at
from public.profiles
where riot_id is not null
on conflict (user_id, game_id) do nothing;

-- 4. "profiles" ne garde plus que les infos communes a tous les jeux.
alter table public.profiles drop column if exists riot_id;
alter table public.profiles drop column if exists game_roles;
alter table public.profiles drop column if exists rank_tier;
alter table public.profiles drop column if exists rank_division;
