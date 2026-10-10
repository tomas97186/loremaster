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

export async function createCampaign(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Il nome della campagna è obbligatorio.");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      owner_id: user.id,
      name,
      description: optionalString(formData, "description"),
      setting: optionalString(formData, "setting"),
      system: optionalString(formData, "system"),
      level_or_period: optionalString(formData, "level_or_period"),
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Errore nella creazione della campagna.");
  }

  redirect(withFlash(`/campaigns/${data.id}`, "Campagna creata."));
}

export async function updateCampaign(campaignId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Il nome della campagna è obbligatorio.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("campaigns")
    .update({
      name,
      description: optionalRichText(formData, "description"),
      setting: optionalString(formData, "setting"),
      system: optionalString(formData, "system"),
      level_or_period: optionalString(formData, "level_or_period"),
      dm_notes: optionalRichText(formData, "dm_notes"),
    })
    .eq("id", campaignId);

  if (error) throw new Error(error.message);

  revalidatePath(`/campaigns/${campaignId}`);
}

export async function deleteCampaign(campaignId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("campaigns").delete().eq("id", campaignId);
  if (error) throw new Error(error.message);
  redirect(withFlash("/dashboard", "Campagna eliminata."));
}
