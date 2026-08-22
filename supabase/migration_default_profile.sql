-- Migration : garantit qu'un profil de compte (table "profiles") existe
-- toujours pour chaque utilisateur inscrit, meme s'il n'a jamais soumis le
-- formulaire "Nom affiche / Discord / Bio" sur /profil. Sans cette ligne,
-- des fonctionnalites comme le toggle de disponibilite dans la navbar
-- n'ont rien a afficher et disparaissent silencieusement.
--
-- A executer UNE SEULE FOIS dans le SQL Editor Supabase.

-- 1. Met a jour le trigger d'inscription pour creer un profil minimal
--    (nom affiche = pseudo) en plus des lignes account_status/app_users
--    deja creees automatiquement.
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

  insert into public.profiles (user_id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- 2. Rattrape les comptes deja inscrits qui n'ont jamais eu de profil cree
--    (le trigger ne s'applique qu'aux NOUVELLES inscriptions).
insert into public.profiles (user_id, display_name)
select au.id, coalesce(au.raw_user_meta_data ->> 'username', split_part(au.email, '@', 1))
from auth.users au
left join public.profiles p on p.user_id = au.id
where p.user_id is null;
