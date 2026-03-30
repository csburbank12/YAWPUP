-- ============================================
-- YAWP — Full Supabase Schema
-- Run this entire file in the Supabase SQL Editor
-- ============================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  is_plus boolean default false,
  contribution_score integer default 0,
  created_at timestamptz default now()
);

create table posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  content text not null check (char_length(content) <= 280),
  tags text[] default '{}',
  heart_count integer default 0,
  echo_count integer default 0,
  reply_count integer default 0,
  created_at timestamptz default now()
);

create table hearts (
  user_id uuid references profiles(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);

create table echoes (
  user_id uuid references profiles(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, post_id)
);

create table follows (
  follower_id uuid references profiles(id) on delete cascade,
  following_id uuid references profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (follower_id, following_id)
);

create table circles (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  color text default '#E8FF47',
  created_by uuid references profiles(id) on delete cascade,
  is_paid boolean default false,
  price_cents integer default 0,
  member_count integer default 0,
  created_at timestamptz default now()
);

create table circle_members (
  circle_id uuid references circles(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  role text default 'member',
  joined_at timestamptz default now(),
  primary key (circle_id, user_id)
);

create table circle_messages (
  id uuid default uuid_generate_v4() primary key,
  circle_id uuid references circles(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  content text not null check (char_length(content) <= 500),
  created_at timestamptz default now()
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, username, display_name)
  values (
    new.id,
    split_part(new.email, '@', 1),
    split_part(new.email, '@', 1)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Auto-update heart count
create or replace function update_heart_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update posts set heart_count = heart_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update posts set heart_count = greatest(0, heart_count - 1) where id = OLD.post_id;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger on_heart_change
  after insert or delete on hearts
  for each row execute procedure update_heart_count();

-- Auto-update echo count
create or replace function update_echo_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update posts set echo_count = echo_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update posts set echo_count = greatest(0, echo_count - 1) where id = OLD.post_id;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger on_echo_change
  after insert or delete on echoes
  for each row execute procedure update_echo_count();

-- Auto-update circle member count
create or replace function update_member_count()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update circles set member_count = member_count + 1 where id = NEW.circle_id;
  elsif TG_OP = 'DELETE' then
    update circles set member_count = greatest(0, member_count - 1) where id = OLD.circle_id;
  end if;
  return null;
end;
$$ language plpgsql;

create trigger on_member_change
  after insert or delete on circle_members
  for each row execute procedure update_member_count();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table profiles enable row level security;
alter table posts enable row level security;
alter table hearts enable row level security;
alter table echoes enable row level security;
alter table follows enable row level security;
alter table circles enable row level security;
alter table circle_members enable row level security;
alter table circle_messages enable row level security;

-- Profiles
create policy "Profiles viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Posts
create policy "Posts viewable by everyone" on posts for select using (true);
create policy "Authenticated users can post" on posts for insert with check (auth.uid() = user_id);
create policy "Users can delete own posts" on posts for delete using (auth.uid() = user_id);

-- Hearts
create policy "Hearts viewable by everyone" on hearts for select using (true);
create policy "Users can heart" on hearts for insert with check (auth.uid() = user_id);
create policy "Users can unheart" on hearts for delete using (auth.uid() = user_id);

-- Echoes
create policy "Echoes viewable by everyone" on echoes for select using (true);
create policy "Users can echo" on echoes for insert with check (auth.uid() = user_id);
create policy "Users can unecho" on echoes for delete using (auth.uid() = user_id);

-- Follows
create policy "Follows viewable by everyone" on follows for select using (true);
create policy "Users can follow" on follows for insert with check (auth.uid() = follower_id);
create policy "Users can unfollow" on follows for delete using (auth.uid() = follower_id);

-- Circles
create policy "Circles viewable by everyone" on circles for select using (true);
create policy "Authenticated users can create circles" on circles for insert with check (auth.uid() = created_by);

-- Circle members
create policy "Circle members viewable by everyone" on circle_members for select using (true);
create policy "Users can join circles" on circle_members for insert with check (auth.uid() = user_id);
create policy "Users can leave circles" on circle_members for delete using (auth.uid() = user_id);

-- Circle messages (members only)
create policy "Circle members can read messages" on circle_messages for select
  using (exists (
    select 1 from circle_members
    where circle_id = circle_messages.circle_id and user_id = auth.uid()
  ));

create policy "Circle members can send messages" on circle_messages for insert
  with check (
    auth.uid() = user_id and
    exists (
      select 1 from circle_members
      where circle_id = circle_messages.circle_id and user_id = auth.uid()
    )
  );

-- ============================================
-- REALTIME
-- ============================================

alter publication supabase_realtime add table circle_messages;
alter publication supabase_realtime add table posts;
