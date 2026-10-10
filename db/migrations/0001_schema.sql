-- Loremaster — schema completo (Postgres self-hosted).
-- Sostituisce le vecchie migrazioni Supabase: niente schema auth/storage e
-- niente RLS; l'isolamento per utente è applicato dal livello dati dell'app
-- (lib/db/query.ts).

create extension if not exists "pgcrypto";

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- utenti e sessioni di login
-- ---------------------------------------------------------------------------

create table users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table auth_sessions (
  token_hash text primary key,
  user_id uuid not null references users (id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index auth_sessions_user_id_idx on auth_sessions (user_id);

create table user_settings (
  user_id uuid primary key references users (id) on delete cascade,
  ai_provider text not null default 'gemini'
    check (ai_provider in ('gemini', 'claude')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger user_settings_set_updated_at
  before update on user_settings
  for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- campagne e archivio
-- ---------------------------------------------------------------------------

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users (id) on delete cascade,
  name text not null,
  description text,
  setting text,
  system text,
  cover_image_url text,
  theme_color text,
  art_style text,
  level_or_period text,
  dm_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger campaigns_set_updated_at
  before update on campaigns
  for each row execute function set_updated_at();

create index campaigns_owner_id_idx on campaigns (owner_id);

create table locations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns (id) on delete cascade,
  parent_id uuid references locations (id) on delete set null,
  name text not null,
  type text,
  description text,
  image_url text,
  map_url text,
  public_notes text,
  dm_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger locations_set_updated_at
  before update on locations
  for each row execute function set_updated_at();

create index locations_campaign_id_idx on locations (campaign_id);
create index locations_parent_id_idx on locations (parent_id);

create table factions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns (id) on delete cascade,
  name text not null,
  description text,
  goals text,
  image_url text,
  public_notes text,
  dm_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger factions_set_updated_at
  before update on factions
  for each row execute function set_updated_at();

create index factions_campaign_id_idx on factions (campaign_id);

create table npcs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns (id) on delete cascade,
  location_id uuid references locations (id) on delete set null,
  faction_id uuid references factions (id) on delete set null,
  name text not null,
  role text,
  description text,
  image_url text,
  public_notes text,
  dm_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger npcs_set_updated_at
  before update on npcs
  for each row execute function set_updated_at();

create index npcs_campaign_id_idx on npcs (campaign_id);
create index npcs_location_id_idx on npcs (location_id);
create index npcs_faction_id_idx on npcs (faction_id);

create table npc_notes (
  id uuid primary key default gen_random_uuid(),
  npc_id uuid not null references npcs (id) on delete cascade,
  campaign_id uuid not null references campaigns (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index npc_notes_npc_id_idx on npc_notes (npc_id);
create index npc_notes_campaign_id_idx on npc_notes (campaign_id);

create table characters (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns (id) on delete cascade,
  name text not null,
  player_name text,
  race text,
  class text,
  level integer,
  description text,
  image_url text,
  dm_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger characters_set_updated_at
  before update on characters
  for each row execute function set_updated_at();

create index characters_campaign_id_idx on characters (campaign_id);

create table quests (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns (id) on delete cascade,
  location_id uuid references locations (id) on delete set null,
  faction_id uuid references factions (id) on delete set null,
  title text not null,
  description text,
  status text not null default 'idea'
    check (status in ('idea', 'active', 'completed', 'failed')),
  public_notes text,
  dm_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger quests_set_updated_at
  before update on quests
  for each row execute function set_updated_at();

create index quests_campaign_id_idx on quests (campaign_id);
create index quests_status_idx on quests (campaign_id, status);

create table quest_links (
  id uuid primary key default gen_random_uuid(),
  quest_id uuid not null references quests (id) on delete cascade,
  campaign_id uuid not null references campaigns (id) on delete cascade,
  entity_type text not null
    check (entity_type in ('npc', 'character', 'faction', 'item')),
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  unique (quest_id, entity_type, entity_id)
);

create index quest_links_quest_id_idx on quest_links (quest_id);
create index quest_links_campaign_id_idx on quest_links (campaign_id);

create table items (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns (id) on delete cascade,
  owner_npc_id uuid references npcs (id) on delete set null,
  location_id uuid references locations (id) on delete set null,
  name text not null,
  item_type text,
  rarity text,
  description text,
  image_url text,
  dm_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger items_set_updated_at
  before update on items
  for each row execute function set_updated_at();

create index items_campaign_id_idx on items (campaign_id);

create table lore_notes (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns (id) on delete cascade,
  title text not null,
  content text,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger lore_notes_set_updated_at
  before update on lore_notes
  for each row execute function set_updated_at();

create index lore_notes_campaign_id_idx on lore_notes (campaign_id);

-- ---------------------------------------------------------------------------
-- sessioni
-- ---------------------------------------------------------------------------

create table sessions (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references campaigns (id) on delete cascade,
  title text not null,
  session_number integer,
  scheduled_at timestamptz,
  status text not null default 'planned'
    check (status in ('planned', 'completed', 'skipped')),
  prep_notes text,
  summary text,
  xp_awarded integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger sessions_set_updated_at
  before update on sessions
  for each row execute function set_updated_at();

create index sessions_campaign_id_idx on sessions (campaign_id);

create table session_notes (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create index session_notes_session_id_idx on session_notes (session_id);

create table session_key_points (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  content text not null,
  done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index session_key_points_session_id_idx on session_key_points (session_id);

create table session_links (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references sessions (id) on delete cascade,
  campaign_id uuid not null references campaigns (id) on delete cascade,
  entity_type text not null
    check (entity_type in ('npc', 'location', 'quest', 'character', 'faction', 'item')),
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  unique (session_id, entity_type, entity_id)
);

create index session_links_session_id_idx on session_links (session_id);
create index session_links_campaign_id_idx on session_links (campaign_id);

create table encounters (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions (id) on delete cascade,
  quest_id uuid references quests (id) on delete cascade,
  campaign_id uuid not null references campaigns (id) on delete cascade,
  name text,
  enemies text,
  rewards text,
  xp integer,
  completed boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint encounters_session_or_quest_chk
    check (session_id is not null or quest_id is not null)
);

create trigger encounters_set_updated_at
  before update on encounters
  for each row execute function set_updated_at();

create index encounters_session_id_idx on encounters (session_id);
create index encounters_quest_id_idx on encounters (quest_id);
create index encounters_campaign_id_idx on encounters (campaign_id);
