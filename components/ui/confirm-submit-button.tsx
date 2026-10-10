"use client";

import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "./button";
import type { ComponentProps } from "react";

export function ConfirmSubmitButton({
  confirmMessage,
  variant = "danger",
  pendingText = "Eliminazione…",
  children,
  ...props
}: ComponentProps<typeof Button> & { confirmMessage: string; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant={variant}
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
      {...props}
    >
      {pending ? <Loader2 size={14} className="animate-spin" /> : null}
      {pending ? pendingText : children}
    </Button>
  );
}
