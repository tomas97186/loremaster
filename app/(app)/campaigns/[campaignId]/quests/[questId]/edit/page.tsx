import { notFound } from "next/navigation";
import { createClient } from "@/lib/db/client";
import { getMentionableEntities } from "@/lib/db/mentionable";
import type { Quest, QuestLink } from "@/lib/db/types";
import { updateQuest, deleteQuest } from "../../actions";
import { QuestForm } from "../../quest-form";
import {
  QuestLinksForm,
  type LocationFolder,
  type LocationGroupDef,
  type FlatGroup,
} from "../../quest-links-form";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { previewText } from "@/lib/richtext";

export default async function EditQuestPage({
  params,
}: {
  params: Promise<{ campaignId: string; questId: string }>;
}) {
  const { campaignId, questId } = await params;
  const supabase = await createClient();

  const [
    { data: quest },
    { data: locations },
    { data: factions },
    { data: npcs },
    { data: characters },
    { data: items },
    { data: links },
    mentionable,
  ] = await Promise.all([
      supabase.from("quests").select("*").eq("id", questId).single<Quest>(),
      supabase
        .from("locations")
        .select("id, name, type, description, parent_id")
        .eq("campaign_id", campaignId)
        .order("name"),
      supabase
        .from("factions")
        .select("id, name, description")
        .eq("campaign_id", campaignId)
        .order("name"),
      supabase
        .from("npcs")
        .select("id, name, role, location_id, description")
        .eq("campaign_id", campaignId)
        .order("name"),
      supabase
        .from("characters")
        .select("id, name, description")
        .eq("campaign_id", campaignId)
        .order("name"),
      supabase
        .from("items")
        .select("id, name, location_id, description")
        .eq("campaign_id", campaignId)
        .order("name"),
      supabase.from("quest_links").select("*").eq("quest_id", questId).returns<QuestLink[]>(),
      getMentionableEntities(supabase, campaignId),
    ]);

  if (!quest) notFound();

  const linkedIds = (type: string) =>
    (links ?? []).filter((l) => l.entity_type === type).map((l) => l.entity_id);

  const npcItems = (npcs ?? []).map((n) => ({
    id: n.id,
    name: n.name,
    sub: n.role as string | null,
    description: previewText(n.description),
    location_id: n.location_id as string | null,
  }));
  const itemItems = (items ?? []).map((i) => ({
    id: i.id,
    name: i.name,
    description: previewText(i.description),
    location_id: i.location_id as string | null,
  }));

  const childLocationsByParent = new Map<string | null, typeof locations>();
  for (const l of locations ?? []) {
    const key = l.parent_id;
    if (!childLocationsByParent.has(key)) childLocationsByParent.set(key, []);
    childLocationsByParent.get(key)!.push(l);
  }

  const buildLocationFolder = (l: NonNullable<typeof locations>[number]): LocationFolder => ({
    location: { id: l.id, name: l.name, sub: l.type, description: previewText(l.description) },
    selectable: false,
    selected: false,
    groups: [
      { key: "npc", label: "NPC", items: npcItems.filter((n) => n.location_id === l.id) },
      { key: "item", label: "Oggetti", items: itemItems.filter((i) => i.location_id === l.id) },
    ],
    children: (childLocationsByParent.get(l.id) ?? []).map(buildLocationFolder),
  });

  const locationFolders: LocationFolder[] = (childLocationsByParent.get(null) ?? []).map(
    buildLocationFolder,
  );

  const unassignedGroups: LocationGroupDef[] = [
    { key: "npc", label: "NPC", items: npcItems.filter((n) => !n.location_id) },
    { key: "item", label: "Oggetti", items: itemItems.filter((i) => !i.location_id) },
  ];

  const flatGroups: FlatGroup[] = [
    {
      key: "character",
      label: "Personaggi",
      items: (characters ?? []).map((c) => ({ id: c.id, name: c.name, description: previewText(c.description) })),
      selected: linkedIds("character"),
    },
    {
      key: "faction",
      label: "Fazioni",
      items: (factions ?? []).map((f) => ({ id: f.id, name: f.name, description: previewText(f.description) })),
      selected: linkedIds("faction"),
    },
  ];

  const selectedIds: Record<string, string[]> = {
    npc: linkedIds("npc"),
    item: linkedIds("item"),
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-2xl font-semibold text-text">{quest.title}</h1>
      <QuestForm
        campaignId={campaignId}
        action={updateQuest.bind(null, campaignId, questId)}
        quest={quest}
        locations={locations ?? []}
        factions={factions ?? []}
        linkedNpcIds={linkedIds("npc")}
        mentionable={mentionable}
      />
      <QuestLinksForm
        campaignId={campaignId}
        questId={questId}
        locationFolders={locationFolders}
        unassignedGroups={unassignedGroups}
        flatGroups={flatGroups}
        selectedIds={selectedIds}
      />
      <form action={deleteQuest.bind(null, campaignId, questId)} className="mt-4 flex justify-end">
        <ConfirmSubmitButton
          size="sm"
          confirmMessage={`Eliminare "${quest.title}"? L'azione non è reversibile.`}
        >
          Elimina quest
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
