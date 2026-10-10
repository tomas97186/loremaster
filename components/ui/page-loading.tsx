import { Loader2 } from "lucide-react";

/** Fallback mostrato da Next.js (via loading.tsx) durante la navigazione tra pagine. */
export function PageLoading() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center">
      <Loader2 className="animate-spin text-text-muted" size={28} />
    </div>
  );
}
