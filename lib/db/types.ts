// Tipi di dominio scritti a mano, allineati a supabase/migrations/0001_init.sql.
// Quando il progetto è collegato a un'istanza Supabase reale, si possono
// sostituire/integrare con `supabase gen types typescript --linked`.

export type QuestStatus = "idea" | "active" | "completed" | "failed";
export type SessionStatus = "planned" | "completed" | "skipped";
export type AiProvider = "gemini" | "claude";
export type SessionLinkEntityType =
  | "npc"
  | "location"
  | "quest"
  | "character"
  | "faction"
  | "item";
export type QuestLinkEntityType = "npc" | "character" | "faction" | "item";

interface Timestamped {
  created_at: string;
  updated_at: string;
}

export interface Campaign extends Timestamped {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  setting: string | null;
  system: string | null;
  cover_image_url: string | null;
  theme_color: string | null;
  art_style: string | null;
  level_or_period: string | null;
  dm_notes: string | null;
}

export interface Location extends Timestamped {
  id: string;
  campaign_id: string;
  parent_id: string | null;
  name: string;
  type: string | null;
  description: string | null;
  image_url: string | null;
  map_url: string | null;
  public_notes: string | null;
  dm_notes: string | null;
}

export interface Faction extends Timestamped {
  id: string;
  campaign_id: string;
  name: string;
  description: string | null;
  goals: string | null;
  image_url: string | null;
  public_notes: string | null;
  dm_notes: string | null;
}

export interface Npc extends Timestamped {
  id: string;
  campaign_id: string;
  location_id: string | null;
  faction_id: string | null;
  name: string;
  role: string | null;
  description: string | null;
  image_url: string | null;
  public_notes: string | null;
  dm_notes: string | null;
}

export interface Character extends Timestamped {
  id: string;
  campaign_id: string;
  name: string;
  player_name: string | null;
  race: string | null;
  class: string | null;
  level: number | null;
  description: string | null;
  image_url: string | null;
  dm_notes: string | null;
}

export interface Quest extends Timestamped {
  id: string;
  campaign_id: string;
  location_id: string | null;
  faction_id: string | null;
  title: string;
  description: string | null;
  status: QuestStatus;
  public_notes: string | null;
  dm_notes: string | null;
}

export interface Item extends Timestamped {
  id: string;
  campaign_id: string;
  owner_npc_id: string | null;
  location_id: string | null;
  name: string;
  item_type: string | null;
  rarity: string | null;
  description: string | null;
  image_url: string | null;
  dm_notes: string | null;
}

export interface LoreNote extends Timestamped {
  id: string;
  campaign_id: string;
  title: string;
  content: string | null;
  is_public: boolean;
}

export interface Session extends Timestamped {
  id: string;
  campaign_id: string;
  title: string;
  session_number: number | null;
  scheduled_at: string | null;
  status: SessionStatus;
  prep_notes: string | null;
  summary: string | null;
  xp_awarded: number | null;
}

export interface Encounter extends Timestamped {
  id: string;
  session_id: string | null;
  quest_id: string | null;
  campaign_id: string;
  name: string | null;
  enemies: string | null;
  rewards: string | null;
  xp: number | null;
  completed: boolean;
  position: number;
}

export interface SessionNote {
  id: string;
  session_id: string;
  content: string;
  created_at: string;
}

export interface SessionKeyPoint {
  id: string;
  session_id: string;
  content: string;
  done: boolean;
  position: number;
  created_at: string;
}

export interface NpcNote {
  id: string;
  npc_id: string;
  campaign_id: string;
  content: string;
  created_at: string;
}

export interface SessionLink {
  id: string;
  session_id: string;
  campaign_id: string;
  entity_type: SessionLinkEntityType;
  entity_id: string;
  created_at: string;
}

export interface QuestLink {
  id: string;
  quest_id: string;
  campaign_id: string;
  entity_type: QuestLinkEntityType;
  entity_id: string;
  created_at: string;
}

export interface UserSettings extends Timestamped {
  user_id: string;
  ai_provider: AiProvider;
}
