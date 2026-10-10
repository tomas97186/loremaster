import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Mention, { type MentionOptions } from "@tiptap/extension-mention";
import { mergeAttributes, type AnyExtension } from "@tiptap/core";
import { buildMentionSuggestion } from "./suggestion";
import type { MentionableEntity } from "@/lib/richtext";
import { cn } from "@/lib/utils";

/** Classi condivise tra editor e vista di sola lettura, per una resa identica. */
export const richTextContentClass = cn(
  "text-sm text-text",
  "[&_p]:mb-2 last:[&_p]:mb-0",
  "[&_strong]:font-semibold [&_em]:italic [&_s]:line-through",
  "[&_ul]:mb-2 [&_ul]:list-disc [&_ul]:pl-5",
  "[&_ol]:mb-2 [&_ol]:list-decimal [&_ol]:pl-5",
  "[&_blockquote]:border-l-2 [&_blockquote]:border-border-strong [&_blockquote]:pl-3 [&_blockquote]:text-text-muted",
  "[&_h2]:mt-2 [&_h2]:mb-1 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-text",
  "[&_h3]:mt-2 [&_h3]:mb-1 [&_h3]:font-display [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-text",
  "[&_a:not(.mention)]:text-accent [&_a:not(.mention)]:underline",
  "[&_a.mention]:font-medium [&_a.mention]:text-accent-strong [&_a.mention]:bg-accent-soft [&_a.mention]:rounded [&_a.mention]:px-1 [&_a.mention]:py-0.5 [&_a.mention]:no-underline",
);

/**
 * Nodo mention che si renderizza come link cliccabile (non lo <span> di
 * default dell'estensione) verso la pagina dell'entità citata, e porta con
 * sé il suo `type` per poter ricostruire l'href al parse.
 */
const CitationMention = Mention.extend({
  name: "mention",
  addAttributes() {
    return {
      ...this.parent?.(),
      type: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("data-mention-type"),
        renderHTML: (attributes: Record<string, unknown>) =>
          attributes.type ? { "data-mention-type": attributes.type } : {},
      },
      href: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("href"),
        renderHTML: (attributes: Record<string, unknown>) =>
          attributes.href ? { href: attributes.href } : {},
      },
    };
  },
  parseHTML() {
    return [{ tag: `a[data-type="${this.name}"]` }];
  },
}).configure({
  HTMLAttributes: { class: "mention" },
  renderHTML({ options, node }) {
    return [
      "a",
      mergeAttributes(options.HTMLAttributes, {
        href: (node.attrs.href as string) || "#",
      }),
      `@${(node.attrs.label as string) ?? ""}`,
    ];
  },
  renderText({ node }) {
    return `@${(node.attrs.label as string) ?? ""}`;
  },
});

export function buildExtensions({
  mentionable,
  campaignId,
  editable,
}: {
  mentionable: MentionableEntity[];
  campaignId: string;
  editable: boolean;
}): AnyExtension[] {
  return [
    StarterKit.configure({
      code: false,
      codeBlock: false,
    }),
    Link.configure({
      openOnClick: !editable,
      autolink: true,
      HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
    }),
    editable
      ? CitationMention.configure({
          // La nostra suggestion lavora con MentionableEntity (id/name/type),
          // più ricco del MentionNodeAttrs (id/label) generico dell'estensione:
          // stessa forma a runtime (command riceve sempre l'oggetto completo),
          // solo i tipi dell'estensione base sono più stretti.
          suggestion: buildMentionSuggestion({
            mentionable,
            campaignId,
          }) as MentionOptions["suggestion"],
        })
      : CitationMention.configure({}),
  ];
}
