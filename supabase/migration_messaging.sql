-- Migration : messagerie privee entre deux joueurs (conversations +
-- messages), avec possibilite de signaler un message precis (extension de
-- la table "reports" existante).
--
-- A executer UNE SEULE FOIS dans le SQL Editor Supabase, sur un projet qui
-- a deja les tables reports/notifications/profiles. Si tu crees un projet
-- Supabase neuf, ignore ce fichier : schema.sql contient deja tout.

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid not null references auth.users (id) on delete cascade,
  user_b_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz not null default now(),
  check (user_a_id <> user_b_id)
);

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

alter table public.reports add column if not exists message_id uuid references public.messages (id) on delete set null;

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

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "conversations_select_participant" on public.conversations;
create policy "conversations_select_participant" on public.conversations
  for select using (auth.uid() = user_a_id or auth.uid() = user_b_id);

drop policy if exists "conversations_insert_participant" on public.conversations;
create policy "conversations_insert_participant" on public.conversations
  for insert with check (auth.uid() = user_a_id or auth.uid() = user_b_id);

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

drop policy if exists "messages_select_admin" on public.messages;
create policy "messages_select_admin" on public.messages
  for select using (public.is_admin());
