"use server";

import { createClient } from "@/lib/db/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function updateAiProvider(formData: FormData) {
  const provider = String(formData.get("ai_provider") ?? "gemini");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.from("user_settings").upsert({
    user_id: user.id,
    ai_provider: provider === "claude" ? "claude" : "gemini",
  });
  if (error) throw new Error(error.message);

  revalidatePath("/settings");
}

export async function updateAiKeys(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const patch: Record<string, string | null> = {};
  for (const [field, column] of [
    ["gemini_api_key", "gemini_api_key"],
    ["anthropic_api_key", "anthropic_api_key"],
  ] as const) {
    const value = String(formData.get(field) ?? "").trim();
    if (formData.get(`clear_${field}`) === "on") patch[column] = null;
    else if (value) patch[column] = value;
  }
  if (Object.keys(patch).length === 0) return;

  const { error } = await supabase.from("user_settings").upsert({ user_id: user.id, ...patch });
  if (error) throw new Error(error.message);

  revalidatePath("/settings");
}
