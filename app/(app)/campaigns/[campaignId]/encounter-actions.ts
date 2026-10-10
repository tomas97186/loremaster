"use server";

import { createClient } from "@/lib/db/client";
import { revalidatePath } from "next/cache";
import { isEmptyHtml } from "@/lib/richtext";

/** Un combattimento appartiene a una sessione, a una quest, o a entrambi. */
export interface EncounterScope {
  sessionId?: string;
  questId?: string;
}

function optionalRichText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "");
  return isEmptyHtml(value) ? null : value;
}

function encounterFieldsFrom(formData: FormData) {
  const xpRaw = String(formData.get("xp") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  return {
    name: name.length ? name : null,
    enemies: optionalRichText(formData, "enemies"),
    rewards: optionalRichText(formData, "rewards"),
    xp: xpRaw ? Number(xpRaw) : null,
  };
}

function revalidateScope(campaignId: string, scope: EncounterScope) {
  if (scope.sessionId) revalidatePath(`/campaigns/${campaignId}/sessions/${scope.sessionId}`);
  if (scope.questId) revalidatePath(`/campaigns/${campaignId}/quests/${scope.questId}`);
}

export async function createEncounter(
  campaignId: string,
  scope: EncounterScope,
  formData: FormData,
) {
  const supabase = await createClient();
  const countQuery = supabase.from("encounters").select("id", { count: "exact", head: true });
  const { count } = scope.sessionId
    ? await countQuery.eq("session_id", scope.sessionId)
    : await countQuery.eq("quest_id", scope.questId!);

  const { error } = await supabase.from("encounters").insert({
    session_id: scope.sessionId ?? null,
    quest_id: scope.questId ?? null,
    campaign_id: campaignId,
    position: count ?? 0,
    ...encounterFieldsFrom(formData),
  });
  if (error) throw new Error(error.message);

  revalidateScope(campaignId, scope);
}

export async function updateEncounter(
  campaignId: string,
  encounterId: string,
  scope: EncounterScope,
  formData: FormData,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("encounters")
    .update(encounterFieldsFrom(formData))
    .eq("id", encounterId);
  if (error) throw new Error(error.message);

  revalidateScope(campaignId, scope);
}

export async function toggleEncounterCompleted(
  campaignId: string,
  encounterId: string,
  scope: EncounterScope,
  completed: boolean,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("encounters")
    .update({ completed })
    .eq("id", encounterId);
  if (error) throw new Error(error.message);

  revalidateScope(campaignId, scope);
}

export async function deleteEncounter(
  campaignId: string,
  encounterId: string,
  scope: EncounterScope,
) {
  const supabase = await createClient();
  const { error } = await supabase.from("encounters").delete().eq("id", encounterId);
  if (error) throw new Error(error.message);

  revalidateScope(campaignId, scope);
}
