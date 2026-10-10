"use client";

import { syncQuestLinks } from "./actions";
import {
  EntityLinksForm,
  type PickableItem,
  type LocationFolder,
  type LocationGroupDef,
  type FlatGroup,
} from "../entity-links-form";

export type { PickableItem, LocationFolder, LocationGroupDef, FlatGroup };

export function QuestLinksForm({
  campaignId,
  questId,
  locationFolders,
  unassignedGroups,
  flatGroups,
  selectedIds,
}: {
  campaignId: string;
  questId: string;
  locationFolders: LocationFolder[];
  unassignedGroups: LocationGroupDef[];
  flatGroups: FlatGroup[];
  selectedIds: Record<string, string[]>;
}) {
  return (
    <div className="mt-6">
      <EntityLinksForm
        action={async (formData) => {
          await syncQuestLinks(campaignId, questId, formData);
        }}
        description={
          "NPC, personaggi, fazioni e oggetti coinvolti in questa quest, raggruppati per luogo. " +
          "Quando la colleghi a una sessione, questi elementi vengono aggiunti automaticamente agli " +
          "«Elementi collegati» della sessione."
        }
        locationFolders={locationFolders}
        unassignedGroups={unassignedGroups}
        flatGroups={flatGroups}
        selectedIds={selectedIds}
      />
    </div>
  );
}
