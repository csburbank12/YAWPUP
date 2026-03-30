-- ============================================
-- YAWP — Replies Schema Patch
-- Run this in Supabase SQL Editor (after schema.sql)
-- ============================================

create table replies (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references posts(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  content text not null check (char_length(content) <= 280),
  heart_count integer default 0,
  created_at timestamptz default now()
);

create table reply_hearts (
  user_id uuid references profiles(id) on delete cascade,
  reply_id uuid references replies(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, reply_id)
);

-- Auto-update reply count on posts
create or replace function update_reply_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update posts set reply_count = reply_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update posts set reply_count = greatest(0, reply_count - 1) where id = OLD.post_id;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger on_reply_change
  after insert or delete on replies
  for each row execute procedure update_reply_count();

-- Auto-update reply heart count
create or replace function update_reply_heart_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update replies set heart_count = heart_count + 1 where id = NEW.reply_id;
  elsif TG_OP = 'DELETE' then
    update replies set heart_count = greatest(0, heart_count - 1) where id = OLD.reply_id;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger on_reply_heart_change
  after insert or delete on reply_hearts
  for each row execute procedure update_reply_heart_count();

-- RLS
alter table replies enable row level security;
alter table reply_hearts enable row level security;

create policy "Replies viewable by everyone" on replies for select using (true);
create policy "Authenticated users can reply" on replies for insert with check (auth.uid() = user_id);
create policy "Users can delete own replies" on replies for delete using (auth.uid() = user_id);

create policy "Reply hearts viewable by everyone" on reply_hearts for select using (true);
create policy "Users can heart replies" on reply_hearts for insert with check (auth.uid() = user_id);
create policy "Users can unheart replies" on reply_hearts for delete using (auth.uid() = user_id);

-- Realtime for replies
alter publication supabase_realtime add table replies;
