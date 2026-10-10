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
    owner_npc_id: optionalString(formData, "owner_npc_id"),
    location_id: optionalString(formData, "location_id"),
    name: String(formData.get("name") ?? "").trim(),
    item_type: optionalString(formData, "item_type"),
    rarity: optionalString(formData, "rarity"),
    description: optionalRichText(formData, "description"),
    image_url: optionalString(formData, "image_url"),
    dm_notes: optionalRichText(formData, "dm_notes"),
  };
}

export async function createItem(campaignId: string, formData: FormData) {
  const fields = fieldsFrom(formData, campaignId);
  if (!fields.name) throw new Error("Il nome dell'oggetto è obbligatorio.");

  const supabase = await createClient();
  const { error } = await supabase.from("items").insert(fields);
  if (error) throw new Error(error.message);

  revalidatePath(`/campaigns/${campaignId}/items`);
  redirect(withFlash(`/campaigns/${campaignId}/items`, "Oggetto creato."));
}

export async function updateItem(campaignId: string, itemId: string, formData: FormData) {
  const fields = fieldsFrom(formData, campaignId);
  if (!fields.name) throw new Error("Il nome dell'oggetto è obbligatorio.");

  const supabase = await createClient();
  const { error } = await supabase.from("items").update(fields).eq("id", itemId);
  if (error) throw new Error(error.message);

  revalidatePath(`/campaigns/${campaignId}/items`);
  redirect(withFlash(`/campaigns/${campaignId}/items`, "Oggetto salvato."));
}

export async function deleteItem(campaignId: string, itemId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("items").delete().eq("id", itemId);
  if (error) throw new Error(error.message);

  revalidatePath(`/campaigns/${campaignId}/items`);
  redirect(withFlash(`/campaigns/${campaignId}/items`, "Oggetto eliminato."));
}
