"use client";

import { useRef } from "react";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/card";
import { HoverPreview } from "@/components/ui/hover-preview";
import { AutosaveIndicator } from "@/components/ui/autosave-indicator";
import { useAutosave } from "@/lib/hooks/use-autosave";

export interface PickableItem {
  id: string;
  name: string;
  sub?: string | null;
  description?: string | null;
}

/** Un tipo di entità (NPC, Quest, Oggetti, ...) raggruppato dentro un luogo. */
export interface LocationGroupDef {
  key: string;
  label: string;
  items: PickableItem[];
}

export interface LocationFolder {
  location: PickableItem;
  /** Se true il luogo stesso è selezionabile (checkbox `link_location`); altrimenti è solo un contenitore per raggruppare. */
  selectable: boolean;
  selected: boolean;
  groups: LocationGroupDef[];
  children: LocationFolder[];
}

export interface FlatGroup {
  key: string;
  label: string;
  items: PickableItem[];
  selected: string[];
}

function EntityRow({
  fieldKey,
  item,
  checked,
}: {
  fieldKey: string;
  item: PickableItem;
  checked: boolean;
}) {
  return (
    <HoverPreview text={item.description}>
      <label className="flex w-full items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm has-checked:border-accent has-checked:bg-accent-soft has-checked:text-accent-strong">
        <input
          type="checkbox"
          name={`link_${fieldKey}`}
          value={item.id}
          defaultChecked={checked}
          className="accent-[var(--color-accent)]"
        />
        <span className="min-w-0 flex-1 truncate">{item.name}</span>
        {item.sub ? <span className="shrink-0 text-xs text-text-muted">{item.sub}</span> : null}
      </label>
    </HoverPreview>
  );
}

/** Sotto-gruppo espandibile per un singolo tipo di entità dentro un luogo. */
function TypeGroup({
  groupKey,
  label,
  items,
  selectedIds,
}: {
  groupKey: string;
  label: string;
  items: PickableItem[];
  selectedIds: string[];
}) {
  if (items.length === 0) return null;
  const selectedCount = items.filter((i) => selectedIds.includes(i.id)).length;

  return (
    <details open={selectedCount > 0} className="group rounded-md border border-border">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-2 py-1.5 text-sm hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
        <ChevronRight
          size={12}
          className="shrink-0 text-text-muted transition-transform group-open:rotate-90"
        />
        <span className="font-medium text-text">{label}</span>
        <span className="text-xs text-text-muted">({items.length})</span>
        {selectedCount > 0 ? (
          <Badge tone="accent" className="ml-auto normal-case">
            {selectedCount} selezionat{selectedCount === 1 ? "o" : "i"}
          </Badge>
        ) : null}
      </summary>
      <ul className="space-y-1.5 border-t border-border p-2">
        {items.map((item) => (
          <li key={item.id}>
            <EntityRow fieldKey={groupKey} item={item} checked={selectedIds.includes(item.id)} />
          </li>
        ))}
      </ul>
    </details>
  );
}

function folderHasSelectionDeep(folder: LocationFolder, selectedIds: Record<string, string[]>): boolean {
  return (
    folder.selected ||
    folder.groups.some((g) => g.items.some((i) => (selectedIds[g.key] ?? []).includes(i.id))) ||
    folder.children.some((c) => folderHasSelectionDeep(c, selectedIds))
  );
}

function LocationNode({
  folder,
  selectedIds,
}: {
  folder: LocationFolder;
  selectedIds: Record<string, string[]>;
}) {
  const hasContent =
    folder.groups.some((g) => g.items.length > 0) || folder.children.length > 0;

  return (
    <details
      open={folderHasSelectionDeep(folder, selectedIds)}
      className="group rounded-lg border border-border"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 px-2 py-1.5 hover:bg-surface-2 [&::-webkit-details-marker]:hidden">
        <ChevronRight
          size={14}
          className="shrink-0 text-text-muted transition-transform group-open:rotate-90"
        />
        <HoverPreview text={folder.location.description}>
          {folder.selectable ? (
            <label
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm has-checked:border-accent has-checked:bg-accent-soft has-checked:text-accent-strong"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                name="link_location"
                value={folder.location.id}
                defaultChecked={folder.selected}
                className="accent-[var(--color-accent)]"
              />
              {folder.location.name}
            </label>
          ) : (
            <span className="text-sm font-medium text-text">{folder.location.name}</span>
          )}
        </HoverPreview>
        {folder.location.sub ? (
          <Badge tone="neutral" className="normal-case">
            {folder.location.sub}
          </Badge>
        ) : null}
      </summary>
      {hasContent ? (
        <div className="ml-4 space-y-1.5 border-l border-border py-2 pl-3">
          {folder.children.map((child) => (
            <LocationNode key={child.location.id} folder={child} selectedIds={selectedIds} />
          ))}
          {folder.groups.map((g) => (
            <TypeGroup
              key={g.key}
              groupKey={g.key}
              label={g.label}
              items={g.items}
              selectedIds={selectedIds[g.key] ?? []}
            />
          ))}
        </div>
      ) : null}
    </details>
  );
}

export function EntityLinksForm({
  title = "Elementi collegati",
  description,
  action,
  locationFolders,
  unassignedGroups,
  flatGroups,
  selectedIds,
  onFieldChange,
}: {
  title?: string;
  description: string;
  action: (formData: FormData) => Promise<void>;
  locationFolders: LocationFolder[];
  unassignedGroups: LocationGroupDef[];
  flatGroups: FlatGroup[];
  selectedIds: Record<string, string[]>;
  onFieldChange?: (form: HTMLFormElement, input: HTMLInputElement, save: () => void) => void;
}) {
  const unassignedHasContent = unassignedGroups.some((g) => g.items.length > 0);
  const unassignedHasSelection = unassignedGroups.some((g) =>
    g.items.some((i) => (selectedIds[g.key] ?? []).includes(i.id)),
  );

  const visibleFlatGroups = flatGroups.filter((g) => g.items.length > 0);

  const hasAnything =
    locationFolders.length > 0 || unassignedHasContent || visibleFlatGroups.length > 0;

  const formRef = useRef<HTMLFormElement>(null);
  const { status, saveNow } = useAutosave(action);

  function handleChange(e: React.ChangeEvent<HTMLFormElement>) {
    const form = formRef.current;
    if (!form) return;
    saveNow(new FormData(form));

    const target = e.target;
    if (onFieldChange && target instanceof HTMLInputElement) {
      onFieldChange(form, target, () => saveNow(new FormData(form)));
    }
  }

  return (
    <form
      ref={formRef}
      onChange={handleChange}
      onSubmit={(e) => e.preventDefault()}
      className="rounded-xl border border-border bg-surface p-5"
    >
      <div className="mb-1 flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-text">{title}</h3>
        <AutosaveIndicator status={status} />
      </div>
      <p className="mb-4 text-sm text-text-muted">{description}</p>

      {hasAnything ? (
        <div className="space-y-4">
          {locationFolders.length > 0 ? (
            <div>
              <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-text-muted">
                Luoghi
              </p>
              <div className="space-y-1">
                {locationFolders.map((folder) => (
                  <LocationNode key={folder.location.id} folder={folder} selectedIds={selectedIds} />
                ))}
              </div>
            </div>
          ) : null}

          {unassignedHasContent ? (
            <details open={unassignedHasSelection} className="group">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-text-muted hover:text-text [&::-webkit-details-marker]:hidden">
                <ChevronRight size={12} className="transition-transform group-open:rotate-90" />
                Senza luogo
              </summary>
              <div className="mt-2 ml-4 space-y-1.5 border-l border-border py-1 pl-3">
                {unassignedGroups.map((g) => (
                  <TypeGroup
                    key={g.key}
                    groupKey={g.key}
                    label={g.label}
                    items={g.items}
                    selectedIds={selectedIds[g.key] ?? []}
                  />
                ))}
              </div>
            </details>
          ) : null}

          {visibleFlatGroups.map((group) => (
            <div key={group.key}>
              <p className="mb-2 font-mono text-[11px] uppercase tracking-wide text-text-muted">
                {group.label}
              </p>
              <ul className="space-y-1.5">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <EntityRow fieldKey={group.key} item={item} checked={group.selected.includes(item.id)} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-text-muted">
          Aggiungi prima qualche elemento alla campagna per poterlo collegare qui.
        </p>
      )}
    </form>
  );
}
