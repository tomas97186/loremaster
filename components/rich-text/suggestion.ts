import { ReactRenderer } from "@tiptap/react";
import type { SuggestionOptions } from "@tiptap/suggestion";
import { MentionList, type MentionListRef } from "./mention-list";
import { ENTITY_TYPE_PATH, type MentionableEntity } from "@/lib/richtext";

/**
 * Configurazione del popup "@" per citare altre entità della campagna.
 * L'elenco delle entità citabili è passato dal server (nessuna chiamata API
 * aggiuntiva): vedi lib/db/mentionable.ts.
 */
export function buildMentionSuggestion({
  mentionable,
  campaignId,
}: {
  mentionable: MentionableEntity[];
  campaignId: string;
}): Omit<SuggestionOptions<MentionableEntity, MentionableEntity>, "editor"> {
  return {
    items: ({ query }) => {
      const q = query.trim().toLowerCase();
      const filtered = q
        ? mentionable.filter((entity) => entity.name.toLowerCase().includes(q))
        : mentionable;
      return filtered.slice(0, 8);
    },
    command: ({ editor, range, props }) => {
      const href = `/campaigns/${campaignId}/${ENTITY_TYPE_PATH[props.type]}/${props.id}`;
      editor
        .chain()
        .focus()
        .insertContentAt(range, [
          {
            type: "mention",
            attrs: { id: props.id, label: props.name, type: props.type, href },
          },
          { type: "text", text: " " },
        ])
        .run();
    },
    render: () => {
      let component: ReactRenderer<MentionListRef, { items: MentionableEntity[]; command: (item: MentionableEntity) => void }>;
      let unmount: (() => void) | undefined;

      return {
        onStart: (props) => {
          component = new ReactRenderer(MentionList, {
            props: { items: props.items, command: props.command },
            editor: props.editor,
          });
          unmount = props.mount(component.element);
        },
        onUpdate: (props) => {
          component.updateProps({ items: props.items, command: props.command });
        },
        onKeyDown: (props) => {
          if (props.event.key === "Escape") {
            unmount?.();
            return true;
          }
          return component.ref?.onKeyDown(props) ?? false;
        },
        onExit: () => {
          unmount?.();
          component.destroy();
        },
      };
    },
  };
}
