-- Migration : passage du role d'agent (un seul) a plusieurs roles.
-- A executer UNE SEULE FOIS dans le SQL Editor Supabase, sur un projet qui
-- a deja la colonne "game_role" (cree avec une version anterieure de
-- schema.sql). Si tu crees un projet Supabase neuf, ignore ce fichier :
-- schema.sql contient deja la bonne colonne "game_roles".

alter table public.profiles add column if not exists game_roles text[];

update public.profiles
set game_roles = array[game_role]
where game_roles is null and game_role is not null;

update public.profiles
set game_roles = '{}'
where game_roles is null;

alter table public.profiles alter column game_roles set default '{}';
alter table public.profiles alter column game_roles set not null;

alter table public.profiles
  add constraint profiles_game_roles_check
  check (game_roles <@ array['DUELIST', 'INITIATOR', 'CONTROLLER', 'SENTINEL']);

alter table public.profiles drop column if exists game_role;
