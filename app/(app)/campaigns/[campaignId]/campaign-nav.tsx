"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = (campaignId: string) => [
  { href: `/campaigns/${campaignId}`, label: "Panoramica", exact: true },
  { href: `/campaigns/${campaignId}/sessions`, label: "Sessioni" },
  { href: `/campaigns/${campaignId}/locations`, label: "Luoghi" },
  { href: `/campaigns/${campaignId}/npcs`, label: "NPC" },
  { href: `/campaigns/${campaignId}/characters`, label: "Personaggi" },
  { href: `/campaigns/${campaignId}/factions`, label: "Fazioni" },
  { href: `/campaigns/${campaignId}/quests`, label: "Quest" },
  { href: `/campaigns/${campaignId}/items`, label: "Oggetti" },
  { href: `/campaigns/${campaignId}/lore`, label: "Lore / Note" },
  { href: `/campaigns/${campaignId}/assistant`, label: "Assistente" },
  { href: `/campaigns/${campaignId}/images`, label: "Immagini", soon: true },
];

export function CampaignNav({ campaignId }: { campaignId: string }) {
  const pathname = usePathname();

  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 text-sm sm:mx-0 sm:flex-col sm:overflow-visible sm:px-0 sm:pb-0">
      {links(campaignId).map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.soon ? `${link.href}` : link.href}
            className={cn(
              "shrink-0 rounded-lg px-3 py-2 font-medium transition-colors sm:shrink",
              active
                ? "bg-accent-soft text-accent-strong"
                : "text-text-muted hover:bg-surface-2 hover:text-text",
              link.soon && "opacity-70",
            )}
          >
            {link.label}
            {link.soon ? (
              <span className="ml-1.5 font-mono text-[10px] uppercase text-gold">
                presto
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
