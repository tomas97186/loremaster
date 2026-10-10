"use client";

import { useState, type ReactNode } from "react";

/** Mostra un piccolo riquadro con `text` al passaggio del mouse su `children`. */
export function HoverPreview({ text, children }: { text: string | null | undefined; children: ReactNode }) {
  const [show, setShow] = useState(false);

  if (!text) return <>{children}</>;

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show ? (
        <span
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-0 z-20 mb-1.5 w-56 rounded-lg border border-border bg-surface p-2 text-xs font-normal normal-case text-text shadow-lg"
        >
          {text}
        </span>
      ) : null}
    </span>
  );
}
