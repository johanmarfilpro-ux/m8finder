-- Migration : autorise un profil par plateforme pour un meme jeu (ex: un
-- profil PC et un profil Console pour Valorant), au lieu d'un seul profil
-- par jeu tout court. La colonne "platform" devient obligatoire (sentinelle
-- 'NONE' pour les jeux sans notion de plateforme), et la contrainte
-- d'unicite passe de (user_id, game_id) a (user_id, game_id, platform).
--
-- A executer UNE SEULE FOIS dans le SQL Editor Supabase, sur un projet qui
-- a deja la colonne "platform" nullable (migration_valorant_platform.sql
-- deja executee). Si tu crees un projet Supabase neuf, ignore ce fichier :
-- schema.sql contient deja le bon schema.

update public.game_profiles set platform = 'NONE' where platform is null;

alter table public.game_profiles alter column platform set default 'NONE';
alter table public.game_profiles alter column platform set not null;

alter table public.game_profiles drop constraint if exists game_profiles_user_id_game_id_key;
alter table public.game_profiles
  add constraint game_profiles_user_id_game_id_platform_key unique (user_id, game_id, platform);
