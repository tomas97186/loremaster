"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "./button";
import type { ComponentProps } from "react";

/**
 * Bottone di submit con stato di caricamento automatico (via useFormStatus):
 * va messo come discendente diretto del <form> che invoca la Server Action.
 */
export function SubmitButton({
  children,
  pendingText,
  ...props
}: ComponentProps<typeof Button> & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? <Loader2 size={14} className="animate-spin" /> : null}
      {pending ? (pendingText ?? "Salvataggio…") : children}
    </Button>
  );
}
