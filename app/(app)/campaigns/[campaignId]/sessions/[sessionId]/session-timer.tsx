"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

function format(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function SessionTimer() {
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4">
      <span className="font-mono text-3xl font-semibold tabular-nums text-text">
        {format(seconds)}
      </span>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={running ? "secondary" : "primary"}
          onClick={() => setRunning((r) => !r)}
        >
          {running ? "Pausa" : "Avvia"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => {
            setRunning(false);
            setSeconds(0);
          }}
        >
          Azzera
        </Button>
      </div>
    </div>
  );
}
