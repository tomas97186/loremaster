import type { AiTool } from "./types";

/**
 * Strumenti che l'assistente può invocare per proporre una nuova entità.
 * Non scrivono nel database: il chiamante trasforma l'invocazione in una
 * bozza che il DM rivede e salva esplicitamente (vedi assistant/actions.ts).
 * I riferimenti ad altre entità (luogo, fazione, proprietario) sono per
 * nome: l'assistente ragiona sui nomi visti nel contesto, non su UUID.
 */
export const PROPOSE_NPC: AiTool = {
  name: "propose_npc",
  description: "Proponi un nuovo NPC (personaggio non giocante) da aggiungere alla campagna.",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string", description: "Nome dell'NPC." },
      role: { type: "string", description: "Ruolo, es. 'fabbro', 'capitano della guardia'." },
      description: { type: "string", description: "Descrizione narrativa dell'NPC." },
      location_name: { type: "string", description: "Nome del luogo dove si trova, se noto." },
      faction_name: { type: "string", description: "Nome della fazione di appartenenza, se nota." },
    },
    required: ["name"],
  },
};

export const PROPOSE_LOCATION: AiTool = {
  name: "propose_location",
  description: "Proponi un nuovo luogo da aggiungere alla campagna.",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string", description: "Nome del luogo." },
      type: { type: "string", description: "Es. città, dungeon, taverna, regione." },
      description: { type: "string", description: "Descrizione narrativa del luogo." },
      parent_name: {
        type: "string",
        description: "Nome del luogo genitore nella gerarchia, se noto (es. la regione che lo contiene).",
      },
    },
    required: ["name"],
  },
};

export const PROPOSE_FACTION: AiTool = {
  name: "propose_faction",
  description: "Proponi una nuova fazione (gilda, culto, casata, ordine...) da aggiungere alla campagna.",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string", description: "Nome della fazione." },
      description: { type: "string", description: "Descrizione narrativa della fazione." },
      goals: { type: "string", description: "Cosa vuole ottenere questa fazione." },
    },
    required: ["name"],
  },
};

export const PROPOSE_QUEST: AiTool = {
  name: "propose_quest",
  description: "Proponi una nuova quest da aggiungere alla campagna.",
  parameters: {
    type: "object",
    properties: {
      title: { type: "string", description: "Titolo della quest." },
      description: { type: "string", description: "Descrizione narrativa della quest." },
      status: {
        type: "string",
        description: "Stato iniziale della quest.",
        enum: ["idea", "active", "completed", "failed"],
      },
      location_name: { type: "string", description: "Nome del luogo legato alla quest, se noto." },
      faction_name: { type: "string", description: "Nome della fazione legata alla quest, se nota." },
    },
    required: ["title"],
  },
};

export const PROPOSE_ITEM: AiTool = {
  name: "propose_item",
  description: "Proponi un nuovo oggetto (arma, artefatto, pozione...) da aggiungere alla campagna.",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string", description: "Nome dell'oggetto." },
      item_type: { type: "string", description: "Es. arma, pozione, artefatto." },
      rarity: { type: "string", description: "Rarità dell'oggetto." },
      description: { type: "string", description: "Descrizione narrativa dell'oggetto." },
      location_name: { type: "string", description: "Nome del luogo dove si trova, se noto." },
      owner_npc_name: { type: "string", description: "Nome dell'NPC proprietario, se noto." },
    },
    required: ["name"],
  },
};

export const PROPOSE_CHARACTER: AiTool = {
  name: "propose_character",
  description: "Proponi un nuovo personaggio giocante da aggiungere alla campagna.",
  parameters: {
    type: "object",
    properties: {
      name: { type: "string", description: "Nome del personaggio." },
      player_name: { type: "string", description: "Nome del giocatore." },
      race: { type: "string", description: "Razza del personaggio." },
      class: { type: "string", description: "Classe del personaggio." },
      level: { type: "number", description: "Livello del personaggio." },
      description: { type: "string", description: "Descrizione narrativa del personaggio." },
    },
    required: ["name"],
  },
};

export const CAMPAIGN_ASSISTANT_TOOLS: AiTool[] = [
  PROPOSE_NPC,
  PROPOSE_LOCATION,
  PROPOSE_FACTION,
  PROPOSE_QUEST,
  PROPOSE_ITEM,
  PROPOSE_CHARACTER,
];
