-- TV-serie Händelselogg — initial schema
-- Run once against your Supabase project to initialise the database.

create extension if not exists "pgcrypto";

-- ── Tables ────────────────────────────────────────────────────────────────────

create table rooms (
  id            uuid primary key default gen_random_uuid(),
  room_slug     text not null unique,
  password_hash text not null,           -- SHA-256 hex digest, never plain-text
  created_at    timestamptz not null default now()
);

create table series (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid not null references rooms(id) on delete cascade,
  title      text not null,
  created_at timestamptz not null default now()
);

create table event_types (
  id        uuid primary key default gen_random_uuid(),
  series_id uuid not null references series(id) on delete cascade,
  label     text not null,
  emoji     text
);

create table episodes (
  id        uuid primary key default gen_random_uuid(),
  series_id uuid not null references series(id) on delete cascade,
  season    integer not null check (season >= 1),
  episode   integer not null check (episode >= 1),
  title     text,
  unique (series_id, season, episode)
);

-- One row per button-press; soft-delete enables undo.
create table events (
  id            uuid primary key default gen_random_uuid(),
  episode_id    uuid not null references episodes(id) on delete cascade,
  event_type_id uuid not null references event_types(id) on delete cascade,
  room_id       uuid not null references rooms(id) on delete cascade,
  logged_by     text,
  deleted       boolean not null default false,
  created_at    timestamptz not null default now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

create index on series      (room_id);
create index on event_types (series_id);
create index on episodes    (series_id);
create index on events      (episode_id, event_type_id) where not deleted;
create index on events      (room_id);

-- ── Row Level Security ────────────────────────────────────────────────────────
-- The anon key is public (static site). RLS keeps rooms isolated.
-- Password verification is client-side (SHA-256); RLS is a second line of defence.

alter table rooms       enable row level security;
alter table series      enable row level security;
alter table event_types enable row level security;
alter table episodes    enable row level security;
alter table events      enable row level security;

create policy "rooms_read"   on rooms for select using (true);
create policy "rooms_insert" on rooms for insert with check (true);

create policy "series_read"   on series for select using (true);
create policy "series_write"  on series for insert with check (true);
create policy "series_delete" on series for delete using (true);

create policy "event_types_read"   on event_types for select using (true);
create policy "event_types_write"  on event_types for insert with check (true);
create policy "event_types_delete" on event_types for delete using (true);

create policy "episodes_read"   on episodes for select using (true);
create policy "episodes_write"  on episodes for insert with check (true);
create policy "episodes_delete" on episodes for delete using (true);

create policy "events_read"   on events for select using (true);
create policy "events_insert" on events for insert with check (true);
create policy "events_update" on events for update using (true) with check (true);
