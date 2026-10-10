"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { cn } from "@/lib/utils";
import { buildExtensions, richTextContentClass } from "./extensions";
import { isEmptyHtml } from "@/lib/richtext";

/** Rende in sola lettura un campo salvato da RichTextField (stesso schema HTML). */
export function RichTextView({
  html,
  campaignId,
  className,
}: {
  html: string | null | undefined;
  campaignId: string;
  className?: string;
}) {
  const editor = useEditor({
    immediatelyRender: false,
    editable: false,
    extensions: buildExtensions({ mentionable: [], campaignId, editable: false }),
    content: html ?? "",
    editorProps: {
      attributes: { class: cn(richTextContentClass, className) },
    },
  });

  if (isEmptyHtml(html)) return null;

  return <EditorContent editor={editor} />;
}
