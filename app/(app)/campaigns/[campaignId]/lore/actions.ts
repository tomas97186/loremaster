"use server";

import { createClient } from "@/lib/db/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isEmptyHtml } from "@/lib/richtext";
import { withFlash } from "@/lib/utils";

function fieldsFrom(formData: FormData, campaignId: string) {
  const content = String(formData.get("content") ?? "");
  return {
    campaign_id: campaignId,
    title: String(formData.get("title") ?? "").trim(),
    content: isEmptyHtml(content) ? null : content,
    is_public: formData.get("is_public") === "on",
  };
}

export async function createLoreNote(campaignId: string, formData: FormData) {
  const fields = fieldsFrom(formData, campaignId);
  if (!fields.title) throw new Error("Il titolo è obbligatorio.");

  const supabase = await createClient();
  const { error } = await supabase.from("lore_notes").insert(fields);
  if (error) throw new Error(error.message);

  revalidatePath(`/campaigns/${campaignId}/lore`);
  redirect(withFlash(`/campaigns/${campaignId}/lore`, "Nota creata."));
}

export async function updateLoreNote(campaignId: string, noteId: string, formData: FormData) {
  const fields = fieldsFrom(formData, campaignId);
  if (!fields.title) throw new Error("Il titolo è obbligatorio.");

  const supabase = await createClient();
  const { error } = await supabase.from("lore_notes").update(fields).eq("id", noteId);
  if (error) throw new Error(error.message);

  revalidatePath(`/campaigns/${campaignId}/lore`);
  redirect(withFlash(`/campaigns/${campaignId}/lore`, "Nota salvata."));
}

export async function deleteLoreNote(campaignId: string, noteId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("lore_notes").delete().eq("id", noteId);
  if (error) throw new Error(error.message);

  revalidatePath(`/campaigns/${campaignId}/lore`);
  redirect(withFlash(`/campaigns/${campaignId}/lore`, "Nota eliminata."));
}
