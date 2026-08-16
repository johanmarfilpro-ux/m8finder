-- Migration : remplace les creneaux de disponibilite declares a l'avance
-- (colonne "availability") par un statut "disponible maintenant" bascule
-- depuis la barre de navigation (colonne booleenne "is_available").
--
-- A executer UNE SEULE FOIS dans le SQL Editor Supabase, sur un projet qui
-- a deja la colonne "availability" (creee avec une version anterieure de
-- schema.sql). Si tu crees un projet Supabase neuf, ignore ce fichier :
-- schema.sql contient deja la bonne colonne "is_available".

alter table public.profiles add column if not exists is_available boolean not null default false;

alter table public.profiles drop column if exists availability;
