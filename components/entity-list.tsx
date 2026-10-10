import Link from "next/link";
import type { ReactNode } from "react";
import { Card, EmptyState } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export function EntityListPage<T extends { id: string }>({
  title,
  newHref,
  newLabel = "Nuovo",
  items,
  basePath,
  emptyTitle,
  emptyDescription,
  renderCard,
  filters,
}: {
  title: string;
  newHref: string;
  newLabel?: string;
  items: T[];
  basePath: (item: T) => string;
  emptyTitle: string;
  emptyDescription?: string;
  renderCard: (item: T) => ReactNode;
  filters?: ReactNode;
}) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-semibold text-text">{title}</h1>
        <ButtonLink href={newHref} size="sm">
          {newLabel}
        </ButtonLink>
      </div>
      {filters ? <div className="mb-4">{filters}</div> : null}
      {items.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <Link key={item.id} href={basePath(item)}>
              <Card className="h-full transition-colors hover:border-border-strong">
                {renderCard(item)}
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          action={
            <ButtonLink href={newHref} size="sm">
              {newLabel}
            </ButtonLink>
          }
        />
      )}
    </div>
  );
}
