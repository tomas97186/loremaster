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
    name: String(formData.get("name") ?? "").trim(),
    description: optionalRichText(formData, "description"),
    goals: optionalRichText(formData, "goals"),
    image_url: optionalString(formData, "image_url"),
    public_notes: optionalRichText(formData, "public_notes"),
    dm_notes: optionalRichText(formData, "dm_notes"),
  };
}

export async function createFaction(campaignId: string, formData: FormData) {
  const fields = fieldsFrom(formData, campaignId);
  if (!fields.name) throw new Error("Il nome della fazione è obbligatorio.");

  const supabase = await createClient();
  const { error } = await supabase.from("factions").insert(fields);
  if (error) throw new Error(error.message);

  revalidatePath(`/campaigns/${campaignId}/factions`);
  redirect(withFlash(`/campaigns/${campaignId}/factions`, "Fazione creata."));
}

export async function updateFaction(
  campaignId: string,
  factionId: string,
  formData: FormData,
) {
  const fields = fieldsFrom(formData, campaignId);
  if (!fields.name) throw new Error("Il nome della fazione è obbligatorio.");

  const supabase = await createClient();
  const { error } = await supabase.from("factions").update(fields).eq("id", factionId);
  if (error) throw new Error(error.message);

  revalidatePath(`/campaigns/${campaignId}/factions`);
  redirect(withFlash(`/campaigns/${campaignId}/factions`, "Fazione salvata."));
}

export async function deleteFaction(campaignId: string, factionId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("factions").delete().eq("id", factionId);
  if (error) throw new Error(error.message);

  revalidatePath(`/campaigns/${campaignId}/factions`);
  redirect(withFlash(`/campaigns/${campaignId}/factions`, "Fazione eliminata."));
}
