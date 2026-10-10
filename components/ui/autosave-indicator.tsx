import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AutosaveStatus } from "@/lib/hooks/use-autosave";

export function AutosaveIndicator({ status, className }: { status: AutosaveStatus; className?: string }) {
  if (status === "idle") return null;

  const label =
    status === "pending" ? "Salvataggio…" : status === "saved" ? "Salvato" : "Errore nel salvataggio";
  const tone =
    status === "error" ? "text-danger" : status === "saved" ? "text-success" : "text-text-muted";

  return (
    <p className={cn("flex items-center gap-1.5 text-xs", tone, className)}>
      {status === "pending" ? <Loader2 size={12} className="animate-spin" /> : null}
      {label}
    </p>
  );
}
