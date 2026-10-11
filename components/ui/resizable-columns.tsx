"use client";

import { Children, useEffect, useRef, useState, type ReactNode } from "react";

const STORAGE_KEY = "loremaster:side-column-width";
const DEFAULT_WIDTH = 360;
const MIN_SIDE = 280;
const MIN_MAIN = 360;

/**
 * Due colonne (principale + laterale) con maniglia trascinabile tra le due su schermi lg.
 * Riceve esattamente due figli; la larghezza della laterale viene ricordata nel browser.
 */
export function ResizableColumns({ children }: { children: ReactNode }) {
  const [main, side] = Children.toArray(children);
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    try {
      const saved = Number(window.localStorage.getItem(STORAGE_KEY));
      if (saved >= MIN_SIDE) setWidth(saved);
    } catch {
      // localStorage non disponibile: resta la larghezza di default.
    }
  }, []);

  function clamp(value: number) {
    const total = containerRef.current?.getBoundingClientRect().width ?? Infinity;
    return Math.max(MIN_SIDE, Math.min(value, total - MIN_MAIN));
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragging || !containerRef.current) return;
    const right = containerRef.current.getBoundingClientRect().right;
    setWidth(clamp(right - e.clientX));
  }

  function handlePointerUp() {
    setDragging(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(Math.round(width)));
    } catch {
      // Niente persistenza: la larghezza vale solo per questa visita.
    }
  }

  return (
    <div
      ref={containerRef}
      style={{ "--side-width": `${width}px` } as React.CSSProperties}
      className="grid gap-6 lg:items-start lg:gap-0 lg:grid-cols-[minmax(0,1fr)_1.5rem_var(--side-width)]"
    >
      {main}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Ridimensiona colonna laterale"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={() => setWidth(DEFAULT_WIDTH)}
        className="group hidden cursor-col-resize touch-none select-none justify-center self-stretch lg:flex"
      >
        <div
          className={`w-0.5 rounded-full transition-colors ${
            dragging ? "bg-accent" : "bg-border group-hover:bg-accent"
          }`}
        />
      </div>
      {side}
    </div>
  );
}
