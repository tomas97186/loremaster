"use client";

import { syncSessionLinks } from "../actions";
import { getQuestLinkedEntities } from "../../quests/actions";
import {
  EntityLinksForm,
  type PickableItem,
  type LocationFolder as GenericLocationFolder,
  type LocationGroupDef,
  type FlatGroup as GenericFlatGroup,
} from "../../entity-links-form";
import type { SessionLinkEntityType } from "@/lib/db/types";

export type { PickableItem };

export interface LocationFolder {
  location: PickableItem;
  selected: boolean;
  npcs: PickableItem[];
  quests: PickableItem[];
  items: PickableItem[];
  children: LocationFolder[];
}

export interface FlatGroup {
  key: Extract<SessionLinkEntityType, "character" | "faction">;
  label: string;
  items: PickableItem[];
  selected: string[];
}

type SelectedIds = { npc: string[]; quest: string[]; item: string[] };

function toGenericFolder(folder: LocationFolder): GenericLocationFolder {
  const groups: LocationGroupDef[] = [
    { key: "npc", label: "NPC", items: folder.npcs },
    { key: "quest", label: "Quest", items: folder.quests },
    { key: "item", label: "Oggetti", items: folder.items },
  ];
  return {
    location: folder.location,
    selectable: true,
    selected: folder.selected,
    groups,
    children: folder.children.map(toGenericFolder),
  };
}

function openAncestorDetails(el: HTMLElement) {
  let details = el.closest("details");
  while (details) {
    details.open = true;
    details = details.parentElement?.closest("details") ?? null;
  }
}

function checkEntity(
  form: HTMLFormElement,
  entityType: "npc" | "location" | "character" | "faction" | "item",
  id: string,
) {
  const input = form.querySelector<HTMLInputElement>(
    `input[name="link_${entityType}"][value="${CSS.escape(id)}"]`,
  );
  if (!input || input.checked) return false;
  input.checked = true;
  openAncestorDetails(input);
  return true;
}

async function applyQuestDefaults(form: HTMLFormElement, questId: string, save: () => void) {
  const defaults = await getQuestLinkedEntities(questId);
  let changed = false;
  for (const id of defaults.npc) changed = checkEntity(form, "npc", id) || changed;
  for (const id of defaults.character) changed = checkEntity(form, "character", id) || changed;
  for (const id of defaults.faction) changed = checkEntity(form, "faction", id) || changed;
  for (const id of defaults.item) changed = checkEntity(form, "item", id) || changed;
  if (defaults.location) changed = checkEntity(form, "location", defaults.location) || changed;
  if (changed) save();
}

export function SessionLinksForm({
  campaignId,
  sessionId,
  locationFolders,
  unassigned,
  selectedIds,
  flatGroups,
}: {
  campaignId: string;
  sessionId: string;
  locationFolders: LocationFolder[];
  unassigned: { npcs: PickableItem[]; quests: PickableItem[]; items: PickableItem[] };
  selectedIds: SelectedIds;
  flatGroups: FlatGroup[];
}) {
  const genericFolders: GenericLocationFolder[] = locationFolders.map(toGenericFolder);
  const unassignedGroups: LocationGroupDef[] = [
    { key: "npc", label: "NPC", items: unassigned.npcs },
    { key: "quest", label: "Quest", items: unassigned.quests },
    { key: "item", label: "Oggetti", items: unassigned.items },
  ];
  const genericSelectedIds: Record<string, string[]> = {
    npc: selectedIds.npc,
    quest: selectedIds.quest,
    item: selectedIds.item,
  };
  const genericFlatGroups: GenericFlatGroup[] = flatGroups;

  return (
    <EntityLinksForm
      action={async (formData) => {
        await syncSessionLinks(campaignId, sessionId, formData);
      }}
      description={
        "Seleziona cosa entra in gioco in questa sessione: comparirà nella Live Mode come " +
        "riferimento rapido. NPC, quest e oggetti sono raggruppati per luogo, con i luoghi figli " +
        "annidati sotto il genitore — apri un luogo e poi il tipo che ti interessa (NPC, Quest, " +
        "Oggetti) per trovare tutto ciò che ci si trova. Passa il mouse su un nome per vederne la " +
        "descrizione. Selezionando una quest, i suoi elementi collegati (NPC, personaggi, fazioni, " +
        "oggetti e luogo) vengono aggiunti automaticamente."
      }
      locationFolders={genericFolders}
      unassignedGroups={unassignedGroups}
      flatGroups={genericFlatGroups}
      selectedIds={genericSelectedIds}
      onFieldChange={(form, input, save) => {
        if (input.name === "link_quest" && input.checked) {
          void applyQuestDefaults(form, input.value, save);
        }
      }}
    />
  );
}
