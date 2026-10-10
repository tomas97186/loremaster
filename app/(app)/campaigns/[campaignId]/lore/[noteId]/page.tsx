import { notFound } from "next/navigation";
import { createClient } from "@/lib/db/client";
import { getMentionableEntities } from "@/lib/db/mentionable";
import type { LoreNote } from "@/lib/db/types";
import { updateLoreNote, deleteLoreNote } from "../actions";
import { LoreForm } from "../lore-form";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";

export default async function EditLoreNotePage({
  params,
}: {
  params: Promise<{ campaignId: string; noteId: string }>;
}) {
  const { campaignId, noteId } = await params;
  const supabase = await createClient();
  const [{ data: note }, mentionable] = await Promise.all([
    supabase.from("lore_notes").select("*").eq("id", noteId).single<LoreNote>(),
    getMentionableEntities(supabase, campaignId),
  ]);

  if (!note) notFound();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-display text-2xl font-semibold text-text">{note.title}</h1>
      <LoreForm
        campaignId={campaignId}
        action={updateLoreNote.bind(null, campaignId, noteId)}
        note={note}
        mentionable={mentionable}
      />
      <form action={deleteLoreNote.bind(null, campaignId, noteId)} className="mt-4 flex justify-end">
        <ConfirmSubmitButton
          size="sm"
          confirmMessage={`Eliminare "${note.title}"? L'azione non è reversibile.`}
        >
          Elimina nota
        </ConfirmSubmitButton>
      </form>
    </div>
  );
}
