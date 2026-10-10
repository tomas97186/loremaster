"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AutosaveStatus = "idle" | "pending" | "saved" | "error";

/**
 * Salvataggio automatico generico: `save(value)` accoda la chiamata con un
 * debounce (per non salvare a ogni singolo carattere), `saveNow(value)` la
 * esegue subito. Lo stato risultante va mostrato con <AutosaveIndicator>.
 */
export function useAutosave<T>(action: (value: T) => Promise<void>, defaultDelayMs = 900) {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearStatusRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionRef = useRef(action);
  useEffect(() => {
    actionRef.current = action;
  }, [action]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (clearStatusRef.current) clearTimeout(clearStatusRef.current);
    },
    [],
  );

  const runSave = useCallback((value: T) => {
    setStatus("pending");
    actionRef
      .current(value)
      .then(() => {
        setStatus("saved");
        if (clearStatusRef.current) clearTimeout(clearStatusRef.current);
        clearStatusRef.current = setTimeout(() => setStatus("idle"), 2000);
      })
      .catch(() => setStatus("error"));
  }, []);

  const save = useCallback(
    (value: T, delayMs = defaultDelayMs) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => runSave(value), delayMs);
    },
    [runSave, defaultDelayMs],
  );

  const saveNow = useCallback(
    (value: T) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      runSave(value);
    },
    [runSave],
  );

  return { status, save, saveNow };
}
