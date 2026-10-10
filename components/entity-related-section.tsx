import Link from "next/link";
import { Badge } from "@/components/ui/card";

export type NamedLink = { id: string; name: string; sub?: string | null };

/** Elenco di entità collegate (NPC, quest, oggetti, sessioni...) mostrato nelle pagine di visualizzazione. */
export function RelatedSection({
  title,
  items,
  basePath,
  emptyLabel,
}: {
  title: string;
  items: NamedLink[];
  basePath: string;
  emptyLabel: string;
}) {
  return (
    <div>
      <h2 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-text-muted">
        {title}
      </h2>
      {items.length > 0 ? (
        <ul className="space-y-1">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`${basePath}/${item.id}`}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-surface-2"
              >
                <span className="font-medium text-text">{item.name}</span>
                {item.sub ? (
                  <Badge tone="neutral" className="normal-case">
                    {item.sub}
                  </Badge>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="px-2 text-sm text-text-muted">{emptyLabel}</p>
      )}
    </div>
  );
}
