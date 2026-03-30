-- ============================================
-- YAWP — Direct Messages Schema Patch
-- Run this in Supabase SQL Editor
-- ============================================

-- Conversations (between exactly 2 users)
create table conversations (
  id uuid default uuid_generate_v4() primary key,
  participant_one uuid references profiles(id) on delete cascade not null,
  participant_two uuid references profiles(id) on delete cascade not null,
  last_message_at timestamptz default now(),
  created_at timestamptz default now(),
  -- ensure uniqueness regardless of order
  constraint unique_conversation unique (
    least(participant_one::text, participant_two::text),
    greatest(participant_one::text, participant_two::text)
  )
);

-- Direct messages
create table direct_messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references conversations(id) on delete cascade not null,
  sender_id uuid references profiles(id) on delete cascade not null,
  content text not null check (char_length(content) <= 1000),
  read_at timestamptz,
  created_at timestamptz default now()
);

-- Auto-update last_message_at on conversation
create or replace function update_conversation_timestamp()
returns trigger as $$
begin
  update conversations
  set last_message_at = now()
  where id = NEW.conversation_id;
  return NEW;
end;
$$ language plpgsql;

create trigger on_direct_message_sent
  after insert on direct_messages
  for each row execute procedure update_conversation_timestamp();

-- RLS
alter table conversations enable row level security;
alter table direct_messages enable row level security;

-- Users can only see conversations they're part of
create policy "Users see own conversations"
  on conversations for select
  using (auth.uid() = participant_one or auth.uid() = participant_two);

create policy "Users can create conversations"
  on conversations for insert
  with check (auth.uid() = participant_one or auth.uid() = participant_two);

-- Users can only see messages in their conversations
create policy "Users see messages in their conversations"
  on direct_messages for select
  using (
    exists (
      select 1 from conversations
      where id = direct_messages.conversation_id
      and (participant_one = auth.uid() or participant_two = auth.uid())
    )
  );

create policy "Users can send messages"
  on direct_messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from conversations
      where id = direct_messages.conversation_id
      and (participant_one = auth.uid() or participant_two = auth.uid())
    )
  );

-- Realtime
alter publication supabase_realtime add table direct_messages;
alter publication supabase_realtime add table conversations;
