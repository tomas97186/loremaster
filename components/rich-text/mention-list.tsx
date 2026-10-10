"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { cn } from "@/lib/utils";
import { ENTITY_TYPE_LABELS, type MentionableEntity } from "@/lib/richtext";

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface MentionListProps {
  items: MentionableEntity[];
  command: (item: MentionableEntity) => void;
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>(
  function MentionList({ items, command }, ref) {
    const [selected, setSelected] = useState(0);

    useEffect(() => {
      setSelected(0);
    }, [items]);

    const selectItem = (index: number) => {
      const item = items[index];
      if (item) command(item);
    };

    useImperativeHandle(
      ref,
      () => ({
        onKeyDown: ({ event }) => {
          if (event.key === "ArrowDown") {
            setSelected((current) => (current + 1) % items.length);
            return true;
          }
          if (event.key === "ArrowUp") {
            setSelected((current) => (current - 1 + items.length) % items.length);
            return true;
          }
          if (event.key === "Enter" || event.key === "Tab") {
            selectItem(selected);
            return true;
          }
          return false;
        },
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [items, selected],
    );

    if (items.length === 0) {
      return (
        <div className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-muted shadow-lg">
          Nessun elemento trovato
        </div>
      );
    }

    return (
      <div className="max-h-64 w-64 overflow-y-auto rounded-lg border border-border bg-surface p-1 shadow-lg">
        {items.map((item, index) => (
          <button
            key={`${item.type}-${item.id}`}
            type="button"
            onClick={() => selectItem(index)}
            onMouseEnter={() => setSelected(index)}
            className={cn(
              "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm",
              index === selected
                ? "bg-accent-soft text-accent-strong"
                : "text-text hover:bg-surface-2",
            )}
          >
            <span className="truncate">{item.name}</span>
            <span className="shrink-0 text-xs uppercase text-text-muted">
              {ENTITY_TYPE_LABELS[item.type]}
            </span>
          </button>
        ))}
      </div>
    );
  },
);
