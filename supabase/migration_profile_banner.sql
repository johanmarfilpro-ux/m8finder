-- Migration : banniere de profil (couleur/degrade preset ou image
-- importee), affichee sur les cartes de recherche et la page de profil.
--
-- A executer UNE SEULE FOIS dans le SQL Editor Supabase.

alter table public.profiles add column if not exists banner_type text not null default 'COLOR' check (banner_type in ('COLOR', 'IMAGE'));
alter table public.profiles add column if not exists banner_color text;
alter table public.profiles add column if not exists banner_image_url text;

insert into storage.buckets (id, name, public)
values ('banners', 'banners', true)
on conflict (id) do nothing;

drop policy if exists "banner_images_select_public" on storage.objects;
create policy "banner_images_select_public" on storage.objects
  for select using (bucket_id = 'banners');

drop policy if exists "banner_images_insert_own" on storage.objects;
create policy "banner_images_insert_own" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'banners' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "banner_images_update_own" on storage.objects;
create policy "banner_images_update_own" on storage.objects
  for update to authenticated
  using (bucket_id = 'banners' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "banner_images_delete_own" on storage.objects;
create policy "banner_images_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'banners' and (storage.foldername(name))[1] = auth.uid()::text);
