"use server";

import { createClient } from "@/lib/db/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isEmptyHtml } from "@/lib/richtext";
import { withFlash } from "@/lib/utils";

function optionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length ? value : null;
}

function optionalRichText(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "");
  return isEmptyHtml(value) ? null : value;
}

function fieldsFrom(formData: FormData, campaignId: string) {
  return {
    campaign_id: campaignId,
    location_id: optionalString(formData, "location_id"),
    faction_id: optionalString(formData, "faction_id"),
    name: String(formData.get("name") ?? "").trim(),
    role: optionalString(formData, "role"),
    description: optionalRichText(formData, "description"),
    image_url: optionalString(formData, "image_url"),
    public_notes: optionalRichText(formData, "public_notes"),
    dm_notes: optionalRichText(formData, "dm_notes"),
  };
}

export async function createNpc(campaignId: string, formData: FormData) {
  const fields = fieldsFrom(formData, campaignId);
  if (!fields.name) throw new Error("Il nome dell'NPC è obbligatorio.");

  const supabase = await createClient();
  const { error } = await supabase.from("npcs").insert(fields);
  if (error) throw new Error(error.message);

  revalidatePath(`/campaigns/${campaignId}/npcs`);
  redirect(withFlash(`/campaigns/${campaignId}/npcs`, "NPC creato."));
}

export async function updateNpc(campaignId: string, npcId: string, formData: FormData) {
  const fields = fieldsFrom(formData, campaignId);
  if (!fields.name) throw new Error("Il nome dell'NPC è obbligatorio.");

  const supabase = await createClient();
  const { error } = await supabase.from("npcs").update(fields).eq("id", npcId);
  if (error) throw new Error(error.message);

  revalidatePath(`/campaigns/${campaignId}/npcs`);
  redirect(withFlash(`/campaigns/${campaignId}/npcs`, "NPC salvato."));
}

export async function deleteNpc(campaignId: string, npcId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("npcs").delete().eq("id", npcId);
  if (error) throw new Error(error.message);

  revalidatePath(`/campaigns/${campaignId}/npcs`);
  redirect(withFlash(`/campaigns/${campaignId}/npcs`, "NPC eliminato."));
}

// ---------------------------------------------------------------------------
// Note rapide
// ---------------------------------------------------------------------------

export async function addNpcNote(campaignId: string, npcId: string, formData: FormData) {
  const content = String(formData.get("content") ?? "").trim();
  if (!content) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("npc_notes")
    .insert({ npc_id: npcId, campaign_id: campaignId, content });
  if (error) throw new Error(error.message);

  revalidatePath(`/campaigns/${campaignId}/npcs/${npcId}`);
}

export async function deleteNpcNote(campaignId: string, npcId: string, noteId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("npc_notes").delete().eq("id", noteId);
  if (error) throw new Error(error.message);

  revalidatePath(`/campaigns/${campaignId}/npcs/${npcId}`);
}
