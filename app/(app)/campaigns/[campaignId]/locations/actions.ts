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
    parent_id: optionalString(formData, "parent_id"),
    name: String(formData.get("name") ?? "").trim(),
    type: optionalString(formData, "type"),
    description: optionalRichText(formData, "description"),
    image_url: optionalString(formData, "image_url"),
    map_url: optionalString(formData, "map_url"),
    public_notes: optionalRichText(formData, "public_notes"),
    dm_notes: optionalRichText(formData, "dm_notes"),
  };
}

export async function createLocation(campaignId: string, formData: FormData) {
  const fields = fieldsFrom(formData, campaignId);
  if (!fields.name) throw new Error("Il nome del luogo è obbligatorio.");

  const supabase = await createClient();
  const { error } = await supabase.from("locations").insert(fields);
  if (error) throw new Error(error.message);

  revalidatePath(`/campaigns/${campaignId}/locations`);
  redirect(withFlash(`/campaigns/${campaignId}/locations`, "Luogo creato."));
}

export async function updateLocation(
  campaignId: string,
  locationId: string,
  formData: FormData,
) {
  const fields = fieldsFrom(formData, campaignId);
  if (!fields.name) throw new Error("Il nome del luogo è obbligatorio.");
  if (fields.parent_id === locationId) {
    throw new Error("Un luogo non può essere padre di se stesso.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("locations")
    .update(fields)
    .eq("id", locationId);
  if (error) throw new Error(error.message);

  revalidatePath(`/campaigns/${campaignId}/locations`);
  redirect(withFlash(`/campaigns/${campaignId}/locations`, "Luogo salvato."));
}

export async function deleteLocation(campaignId: string, locationId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("locations").delete().eq("id", locationId);
  if (error) throw new Error(error.message);

  revalidatePath(`/campaigns/${campaignId}/locations`);
  redirect(withFlash(`/campaigns/${campaignId}/locations`, "Luogo eliminato."));
}
