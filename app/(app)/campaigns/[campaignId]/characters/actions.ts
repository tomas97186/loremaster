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
  const levelRaw = String(formData.get("level") ?? "").trim();
  return {
    campaign_id: campaignId,
    name: String(formData.get("name") ?? "").trim(),
    player_name: optionalString(formData, "player_name"),
    race: optionalString(formData, "race"),
    class: optionalString(formData, "class"),
    level: levelRaw ? Number(levelRaw) : null,
    description: optionalRichText(formData, "description"),
    image_url: optionalString(formData, "image_url"),
    dm_notes: optionalRichText(formData, "dm_notes"),
  };
}

export async function createCharacter(campaignId: string, formData: FormData) {
  const fields = fieldsFrom(formData, campaignId);
  if (!fields.name) throw new Error("Il nome del personaggio è obbligatorio.");

  const supabase = await createClient();
  const { error } = await supabase.from("characters").insert(fields);
  if (error) throw new Error(error.message);

  revalidatePath(`/campaigns/${campaignId}/characters`);
  redirect(withFlash(`/campaigns/${campaignId}/characters`, "Personaggio creato."));
}

export async function updateCharacter(
  campaignId: string,
  characterId: string,
  formData: FormData,
) {
  const fields = fieldsFrom(formData, campaignId);
  if (!fields.name) throw new Error("Il nome del personaggio è obbligatorio.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("characters")
    .update(fields)
    .eq("id", characterId);
  if (error) throw new Error(error.message);

  revalidatePath(`/campaigns/${campaignId}/characters`);
  redirect(withFlash(`/campaigns/${campaignId}/characters`, "Personaggio salvato."));
}

export async function deleteCharacter(campaignId: string, characterId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("characters").delete().eq("id", characterId);
  if (error) throw new Error(error.message);

  revalidatePath(`/campaigns/${campaignId}/characters`);
  redirect(withFlash(`/campaigns/${campaignId}/characters`, "Personaggio eliminato."));
}
