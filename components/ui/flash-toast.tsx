"use client";

import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

/**
 * Mostra un breve messaggio di conferma quando l'URL contiene ?flash=...
 * (impostato dalle Server Action che fanno redirect dopo un salvataggio).
 * Il messaggio resta finché il parametro è nell'URL; dopo qualche secondo
 * lo rimuoviamo con un replace, il che nasconde il toast. Va montata una
 * volta in un layout condiviso.
 */
export function FlashToast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const flash = searchParams.get("flash");

  useEffect(() => {
    if (!flash) return;
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      params.delete("flash");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    }, 3500);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flash]);

  if (!flash) return null;

  return (
    <div
      role="status"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-3 text-sm text-text shadow-lg"
    >
      <CheckCircle2 size={16} className="text-success" />
      {flash}
    </div>
  );
}
