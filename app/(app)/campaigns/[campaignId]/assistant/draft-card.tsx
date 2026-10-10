"use client";

import { useId, useState } from "react";
import { Field, Input, Select } from "@/components/ui/field";
import { RichTextField } from "@/components/rich-text/rich-text-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { Card, Badge } from "@/components/ui/card";
import { QUEST_STATUS_LABELS } from "@/lib/constants";
import type { MentionableEntity } from "@/lib/richtext";
import type { DraftProposal } from "./actions";
import { createNpc } from "../npcs/actions";
import { createLocation } from "../locations/actions";
import { createFaction } from "../factions/actions";
import { createQuest } from "../quests/actions";
import { createItem } from "../items/actions";
import { createCharacter } from "../characters/actions";

const ACTION_BY_TYPE = {
  npc: createNpc,
  location: createLocation,
  faction: createFaction,
  quest: createQuest,
  item: createItem,
  character: createCharacter,
} as const;

const ENTITY_LABEL: Record<DraftProposal["entityType"], string> = {
  npc: "Nuovo NPC",
  location: "Nuovo luogo",
  faction: "Nuova fazione",
  quest: "Nuova quest",
  item: "Nuovo oggetto",
  character: "Nuovo personaggio",
};

function RefSelect({
  id,
  name,
  label,
  defaultValue,
  options,
}: {
  id: string;
  name: string;
  label: string;
  defaultValue: string;
  options: MentionableEntity[];
}) {
  return (
    <Field label={label} htmlFor={id}>
      <Select id={id} name={name} defaultValue={defaultValue}>
        <option value="">— Nessuno —</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </Select>
    </Field>
  );
}

export function DraftCard({
  draft,
  campaignId,
  mentionable,
}: {
  draft: DraftProposal;
  campaignId: string;
  mentionable: MentionableEntity[];
}) {
  const uid = useId();
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const locations = mentionable.filter((e) => e.type === "location");
  const factions = mentionable.filter((e) => e.type === "faction");
  const npcs = mentionable.filter((e) => e.type === "npc");
  const action = ACTION_BY_TYPE[draft.entityType].bind(null, campaignId);
  const f = draft.fields;
  const id = (suffix: string) => `${uid}-${suffix}`;

  return (
    <Card className="w-full max-w-md">
      <div className="mb-3 flex items-center justify-between gap-2">
        <Badge tone="accent">{ENTITY_LABEL[draft.entityType]}</Badge>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-xs text-text-muted hover:text-text"
        >
          Ignora
        </button>
      </div>

      {draft.hints.length > 0 ? (
        <ul className="mb-3 space-y-1 text-xs text-gold">
          {draft.hints.map((hint, i) => (
            <li key={i}>{hint}</li>
          ))}
        </ul>
      ) : null}

      <form action={action}>
        {draft.entityType === "quest" ? (
          <Field label="Titolo" htmlFor={id("title")}>
            <Input id={id("title")} name="title" required defaultValue={f.title} />
          </Field>
        ) : (
          <Field label="Nome" htmlFor={id("name")}>
            <Input id={id("name")} name="name" required defaultValue={f.name} />
          </Field>
        )}

        {draft.entityType === "npc" ? (
          <Field label="Ruolo" htmlFor={id("role")}>
            <Input id={id("role")} name="role" defaultValue={f.role} />
          </Field>
        ) : null}

        {draft.entityType === "location" ? (
          <Field label="Tipo" htmlFor={id("type")}>
            <Input id={id("type")} name="type" defaultValue={f.type} />
          </Field>
        ) : null}

        {draft.entityType === "item" ? (
          <div className="grid gap-x-3 sm:grid-cols-2">
            <Field label="Tipo" htmlFor={id("item_type")}>
              <Input id={id("item_type")} name="item_type" defaultValue={f.item_type} />
            </Field>
            <Field label="Rarità" htmlFor={id("rarity")}>
              <Input id={id("rarity")} name="rarity" defaultValue={f.rarity} />
            </Field>
          </div>
        ) : null}

        {draft.entityType === "character" ? (
          <>
            <Field label="Giocatore" htmlFor={id("player_name")}>
              <Input id={id("player_name")} name="player_name" defaultValue={f.player_name} />
            </Field>
            <div className="grid gap-x-3 sm:grid-cols-3">
              <Field label="Razza" htmlFor={id("race")}>
                <Input id={id("race")} name="race" defaultValue={f.race} />
              </Field>
              <Field label="Classe" htmlFor={id("class")}>
                <Input id={id("class")} name="class" defaultValue={f.class} />
              </Field>
              <Field label="Livello" htmlFor={id("level")}>
                <Input id={id("level")} name="level" type="number" min={1} defaultValue={f.level} />
              </Field>
            </div>
          </>
        ) : null}

        {draft.entityType === "quest" ? (
          <Field label="Stato" htmlFor={id("status")}>
            <Select id={id("status")} name="status" defaultValue={f.status || "idea"}>
              {Object.entries(QUEST_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}

        <RichTextField
          label="Descrizione"
          id={id("description")}
          name="description"
          defaultValue={f.description}
          mentionable={mentionable}
          campaignId={campaignId}
        />

        {draft.entityType === "faction" ? (
          <RichTextField
            label="Obiettivi"
            id={id("goals")}
            name="goals"
            defaultValue={f.goals}
            mentionable={mentionable}
            campaignId={campaignId}
          />
        ) : null}

        {draft.entityType === "npc" || draft.entityType === "quest" || draft.entityType === "item" ? (
          <RefSelect
            id={id("location_id")}
            name="location_id"
            label="Luogo"
            defaultValue={f.location_id}
            options={locations}
          />
        ) : null}
        {draft.entityType === "location" ? (
          <RefSelect
            id={id("parent_id")}
            name="parent_id"
            label="Luogo padre"
            defaultValue={f.parent_id}
            options={locations}
          />
        ) : null}
        {draft.entityType === "npc" || draft.entityType === "quest" ? (
          <RefSelect
            id={id("faction_id")}
            name="faction_id"
            label="Fazione"
            defaultValue={f.faction_id}
            options={factions}
          />
        ) : null}
        {draft.entityType === "item" ? (
          <RefSelect
            id={id("owner_npc_id")}
            name="owner_npc_id"
            label="Proprietario (NPC)"
            defaultValue={f.owner_npc_id}
            options={npcs}
          />
        ) : null}

        <div className="mt-4 flex justify-end">
          <SubmitButton size="sm">
            Salva come {ENTITY_LABEL[draft.entityType].toLowerCase()}
          </SubmitButton>
        </div>
      </form>
    </Card>
  );
}
