"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { forwardRef, useCallback, useImperativeHandle, useState } from "react";
import { Label } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import { buildExtensions, richTextContentClass } from "./extensions";
import { RichTextToolbar } from "./toolbar";
import type { MentionableEntity } from "@/lib/richtext";

export interface RichTextFieldHandle {
  /** Sostituisce il contenuto dell'editor (es. dopo un arricchimento AI). */
  setContent: (html: string) => void;
}

export const RichTextField = forwardRef<
  RichTextFieldHandle,
  {
    label: string;
    id: string;
    name: string;
    defaultValue?: string | null;
    mentionable: MentionableEntity[];
    campaignId: string;
    hint?: string;
    /** Chiamata a ogni modifica del contenuto (anche programmatica via setContent), utile per il salvataggio automatico. */
    onChangeHtml?: (html: string) => void;
  }
>(function RichTextField(
  { label, id, name, defaultValue, mentionable, campaignId, hint, onChangeHtml },
  ref,
) {
  const [html, setHtml] = useState(defaultValue ?? "");

  const updateHtml = useCallback(
    (nextHtml: string) => {
      setHtml(nextHtml);
      onChangeHtml?.(nextHtml);
    },
    [onChangeHtml],
  );

  const editor = useEditor({
    immediatelyRender: false,
    extensions: buildExtensions({ mentionable, campaignId, editable: true }),
    content: defaultValue ?? "",
    editorProps: {
      attributes: {
        id,
        class: cn(richTextContentClass, "min-h-24 px-3 py-2 focus:outline-none"),
      },
    },
    onUpdate: ({ editor }) => updateHtml(editor.getHTML()),
  });

  useImperativeHandle(
    ref,
    () => ({
      setContent: (nextHtml: string) => {
        editor?.commands.setContent(nextHtml);
        updateHtml(nextHtml);
      },
    }),
    [editor, updateHtml],
  );

  return (
    <div className="mb-4">
      <Label htmlFor={id}>{label}</Label>
      <div className="overflow-hidden rounded-lg border border-border bg-surface focus-within:outline-2 focus-within:outline-accent focus-within:outline-offset-1">
        {editor ? <RichTextToolbar editor={editor} /> : null}
        <EditorContent editor={editor} />
      </div>
      <input type="hidden" name={name} value={html} />
      {hint ? <p className="mt-1 text-xs text-text-muted">{hint}</p> : null}
    </div>
  );
});
