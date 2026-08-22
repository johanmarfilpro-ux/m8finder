-- Migration : ajoute la notion de plateforme (PC / Console) par jeu et par
-- profil de jeu. Un jeu peut definir une liste de plateformes (colonne
-- "platforms" sur "games", vide si non applicable) ; chaque profil de jeu
-- precise la sienne (colonne "platform" sur "game_profiles").
--
-- A executer UNE SEULE FOIS dans le SQL Editor Supabase, sur un projet qui
-- a deja les tables "games" et "game_profiles" (migration_multi_game.sql
-- deja executee). Si tu crees un projet Supabase neuf, ignore ce fichier :
-- schema.sql contient deja les bonnes colonnes.

alter table public.games add column if not exists platforms jsonb not null default '[]'::jsonb;

update public.games
set platforms = '[
  {"value": "PC", "label": "PC"},
  {"value": "CONSOLE", "label": "Console"}
]'::jsonb
where id = 'VALORANT';

alter table public.game_profiles add column if not exists platform text;
