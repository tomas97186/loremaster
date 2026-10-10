export const LOCATION_TYPE_SUGGESTIONS = [
  "Continente",
  "Regione",
  "Città",
  "Villaggio",
  "Dungeon",
  "Edificio",
  "Taverna",
  "Castello",
  "Foresta",
  "Pianura",
  "Luogo misterioso",
];

export const QUEST_STATUS_LABELS: Record<string, string> = {
  idea: "Idea",
  active: "Attiva",
  completed: "Completata",
  failed: "Fallita",
};

export const QUEST_STATUS_TONES: Record<
  string,
  "neutral" | "accent" | "success" | "danger"
> = {
  idea: "neutral",
  active: "accent",
  completed: "success",
  failed: "danger",
};

export const SESSION_STATUS_LABELS: Record<string, string> = {
  planned: "Pianificata",
  completed: "Completata",
  skipped: "Saltata",
};
