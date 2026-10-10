import { notFound } from "next/navigation";
import { createClient } from "@/lib/db/client";
import { getMentionableEntities } from "@/lib/db/mentionable";
import type {
  Session,
  SessionNote,
  SessionKeyPoint,
  SessionLink,
  SessionLinkEntityType,
  Encounter,
  AiProvider,
} from "@/lib/db/types";
import { Badge } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { SESSION_STATUS_LABELS } from "@/lib/constants";
import { SessionDetailsForm } from "./session-details-form";
import { SessionLinksForm, type LocationFolder, type PickableItem } from "./session-links-form";
import { LiveModePanel } from "./live-mode-panel";
import { NotesPanel } from "./notes-panel";
import { KeyPointsPanel } from "./key-points-panel";
import { SessionPrepForm } from "./session-prep-form";
import { EncounterEditor } from "../../encounter-editor";
import { ResocontoForm } from "./resoconto-form";
import { ConcludedSessionView } from "./concluded-session-view";
import { AiAssistantPanel } from "./ai-assistant-panel";
import { QUEST_STATUS_LABELS } from "@/lib/constants";
import { stripHtml, isEmptyHtml } from "@/lib/richtext";

const STATUS_TONE = {
  planned: "accent",
  completed: "success",
  skipped: "neutral",
} as const;

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ campaignId: string; sessionId: string }>;
}) {
  const { campaignId, sessionId } = await params;
  const supabase = await createClient();

  const [
    { data: session },
    { data: notes },
    { data: keyPoints },
    { data: links },
    { data: encounters },
    { data: npcs },
    { data: locations },
    { data: quests },
    { data: characters },
    { data: factions },
    { data: items },
    { data: settings },
    mentionable,
  ] = await Promise.all([
    supabase.from("sessions").select("*").eq("id", sessionId).single<Session>(),
    supabase
      .from("session_notes")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .returns<SessionNote[]>(),
    supabase
      .from("session_key_points")
      .select("*")
      .eq("session_id", sessionId)
      .order("position")
      .returns<SessionKeyPoint[]>(),
    supabase
      .from("session_links")
      .select("*")
      .eq("session_id", sessionId)
      .returns<SessionLink[]>(),
    supabase
      .from("encounters")
      .select("*")
      .eq("session_id", sessionId)
      .order("position")
      .returns<Encounter[]>(),
    supabase
      .from("npcs")
      .select("id, name, role, location_id, description, public_notes, dm_notes, image_url")
      .eq("campaign_id", campaignId)
      .order("name"),
    supabase
      .from("locations")
      .select("id, name, type, description, parent_id, public_notes, dm_notes, image_url")
      .eq("campaign_id", campaignId)
      .order("name"),
    supabase
      .from("quests")
      .select("id, title, status, location_id, description, public_notes, dm_notes")
      .eq("campaign_id", campaignId)
      .order("title"),
    supabase
      .from("characters")
      .select("id, name, description")
      .eq("campaign_id", campaignId)
      .order("name"),
    supabase
      .from("factions")
      .select("id, name, description")
      .eq("campaign_id", campaignId)
      .order("name"),
    supabase
      .from("items")
      .select("id, name, location_id, description")
      .eq("campaign_id", campaignId)
      .order("name"),
    supabase.from("user_settings").select("ai_provider").maybeSingle(),
    getMentionableEntities(supabase, campaignId),
  ]);

  if (!session) notFound();

  const preview = (html: string | null) => {
    const text = stripHtml(html);
    if (!text) return null;
    return text.length > 220 ? `${text.slice(0, 220)}…` : text;
  };

  const linkedByType = new Map<string, string[]>();
  for (const link of links ?? []) {
    const ids = linkedByType.get(link.entity_type) ?? [];
    ids.push(link.entity_id);
    linkedByType.set(link.entity_type, ids);
  }
  const linkedIds = (type: string) => linkedByType.get(type) ?? [];

  const npcItems: (PickableItem & { location_id: string | null })[] = (npcs ?? []).map((n) => ({
    id: n.id,
    name: n.name,
    sub: n.role,
    description: preview(n.description),
    location_id: n.location_id,
  }));
  const questItems: (PickableItem & { location_id: string | null })[] = (quests ?? []).map((q) => ({
    id: q.id,
    name: q.title,
    sub: QUEST_STATUS_LABELS[q.status] ?? q.status,
    description: preview(q.description),
    location_id: q.location_id,
  }));
  const itemItems: (PickableItem & { location_id: string | null })[] = (items ?? []).map((i) => ({
    id: i.id,
    name: i.name,
    description: preview(i.description),
    location_id: i.location_id,
  }));

  const childLocationsByParent = new Map<string | null, typeof locations>();
  for (const l of locations ?? []) {
    const key = l.parent_id;
    if (!childLocationsByParent.has(key)) childLocationsByParent.set(key, []);
    childLocationsByParent.get(key)!.push(l);
  }

  const buildLocationFolder = (l: NonNullable<typeof locations>[number]): LocationFolder => ({
    location: { id: l.id, name: l.name, sub: l.type, description: preview(l.description) },
    selected: linkedIds("location").includes(l.id),
    npcs: npcItems.filter((n) => n.location_id === l.id),
    quests: questItems.filter((q) => q.location_id === l.id),
    items: itemItems.filter((i) => i.location_id === l.id),
    children: (childLocationsByParent.get(l.id) ?? []).map(buildLocationFolder),
  });

  const locationFolders: LocationFolder[] = (childLocationsByParent.get(null) ?? []).map(
    buildLocationFolder,
  );

  const unassigned = {
    npcs: npcItems.filter((n) => !n.location_id),
    quests: questItems.filter((q) => !q.location_id),
    items: itemItems.filter((i) => !i.location_id),
  };

  const selectedIds = {
    npc: linkedIds("npc"),
    quest: linkedIds("quest"),
    item: linkedIds("item"),
  };

  const flatGroups = [
    {
      key: "character" as const,
      label: "Personaggi",
      items: (characters ?? []).map((c) => ({ id: c.id, name: c.name, description: preview(c.description) })),
      selected: linkedIds("character"),
    },
    {
      key: "faction" as const,
      label: "Fazioni",
      items: (factions ?? []).map((f) => ({ id: f.id, name: f.name, description: preview(f.description) })),
      selected: linkedIds("faction"),
    },
  ];

  const liveNpcs = (npcs ?? []).filter((n) => linkedIds("npc").includes(n.id));
  const liveLocations = (locations ?? []).filter((l) => linkedIds("location").includes(l.id));
  const liveQuests = (quests ?? []).filter((q) => linkedIds("quest").includes(q.id));

  const autoXp = (encounters ?? [])
    .filter((e) => e.completed)
    .reduce((sum, e) => sum + (e.xp ?? 0), 0);

  const hasSummary = !isEmptyHtml(session.summary);

  const linkedByTypeForDisplay: Record<SessionLinkEntityType, { id: string; name: string }[]> = {
    npc: liveNpcs.map((n) => ({ id: n.id, name: n.name })),
    location: liveLocations.map((l) => ({ id: l.id, name: l.name })),
    quest: liveQuests.map((q) => ({ id: q.id, name: q.title })),
    character: (characters ?? [])
      .filter((c) => linkedIds("character").includes(c.id))
      .map((c) => ({ id: c.id, name: c.name })),
    faction: (factions ?? [])
      .filter((f) => linkedIds("faction").includes(f.id))
      .map((f) => ({ id: f.id, name: f.name })),
    item: (items ?? [])
      .filter((i) => linkedIds("item").includes(i.id))
      .map((i) => ({ id: i.id, name: i.name })),
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-gold">
            {session.session_number ? `Sessione #${session.session_number}` : "Sessione"}
          </p>
          <div className="flex items-center gap-2">
            <h1 className="font-display text-3xl font-semibold text-text">{session.title}</h1>
            <Badge tone={STATUS_TONE[session.status]}>
              {SESSION_STATUS_LABELS[session.status]}
            </Badge>
          </div>
        </div>
      </div>

      <details className="mb-6 rounded-xl border border-border bg-surface">
        <summary className="cursor-pointer select-none px-5 py-3 text-sm font-medium text-text">
          Dettagli sessione
        </summary>
        <div className="border-t border-border p-5">
          <SessionDetailsForm campaignId={campaignId} session={session} />
        </div>
      </details>

      {hasSummary ? (
        <ConcludedSessionView
          campaignId={campaignId}
          sessionId={sessionId}
          prepNotes={session.prep_notes}
          encounters={encounters ?? []}
          keyPoints={keyPoints ?? []}
          linkedByType={linkedByTypeForDisplay}
          notes={notes ?? []}
          summary={session.summary}
          xpAwarded={session.xp_awarded}
          mentionable={mentionable}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
          <div className="min-w-0">
            <Tabs
              tabs={[
                {
                  id: "prep",
                  label: "Preparazione",
                  content: (
                    <div className="space-y-6">
                      <SessionPrepForm
                        campaignId={campaignId}
                        sessionId={sessionId}
                        prepNotes={session.prep_notes}
                        mentionable={mentionable}
                      />
                      <EncounterEditor
                        campaignId={campaignId}
                        scope={{ sessionId }}
                        encounters={encounters ?? []}
                        mentionable={mentionable}
                      />
                      <div className="rounded-xl border border-border bg-surface p-5">
                        <h3 className="mb-3 font-mono text-[11px] uppercase tracking-wide text-text-muted">
                          Punti chiave
                        </h3>
                        <KeyPointsPanel
                          campaignId={campaignId}
                          sessionId={sessionId}
                          keyPoints={keyPoints ?? []}
                        />
                      </div>
                      <SessionLinksForm
                        campaignId={campaignId}
                        sessionId={sessionId}
                        locationFolders={locationFolders}
                        unassigned={unassigned}
                        selectedIds={selectedIds}
                        flatGroups={flatGroups}
                      />
                    </div>
                  ),
                },
                {
                  id: "live",
                  label: "Live Mode",
                  content: (
                    <LiveModePanel
                      campaignId={campaignId}
                      sessionId={sessionId}
                      npcs={liveNpcs}
                      locations={liveLocations}
                      quests={liveQuests}
                      prepNotes={session.prep_notes}
                      encounters={encounters ?? []}
                      keyPoints={keyPoints ?? []}
                    />
                  ),
                },
                {
                  id: "resoconto",
                  label: "Resoconto",
                  content: (
                    <ResocontoForm
                      campaignId={campaignId}
                      sessionId={sessionId}
                      summary={session.summary}
                      xpAwarded={session.xp_awarded}
                      autoXp={autoXp}
                      mentionable={mentionable}
                    />
                  ),
                },
              ]}
            />
          </div>

          <div className="space-y-6 lg:sticky lg:top-6">
            <AiAssistantPanel
              campaignId={campaignId}
              sessionId={sessionId}
              aiProvider={(settings?.ai_provider as AiProvider) ?? "gemini"}
            />
            <div className="rounded-xl border border-border bg-surface p-5">
              <h3 className="mb-3 font-mono text-[11px] uppercase tracking-wide text-text-muted">
                Note rapide
              </h3>
              <NotesPanel campaignId={campaignId} sessionId={sessionId} notes={notes ?? []} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
