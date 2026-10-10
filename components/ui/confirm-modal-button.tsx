"use client";

import { useRef, useState, type ComponentProps, type ReactNode } from "react";
import { Modal } from "./modal";
import { Button } from "./button";

/**
 * Come ConfirmSubmitButton, ma con il Modal dell'app invece del confirm()
 * nativo del browser. Va posizionato dentro il <form> che deve inviare:
 * al conferma richiama form.requestSubmit() sul form più vicino.
 */
export function ConfirmModalButton({
  confirmTitle = "Conferma eliminazione",
  confirmMessage,
  className,
  children,
  ...props
}: ComponentProps<"button"> & { confirmTitle?: string; confirmMessage: ReactNode }) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  return (
    <>
      <button
        type="button"
        ref={(el) => {
          formRef.current = el?.form ?? null;
        }}
        onClick={() => setOpen(true)}
        className={className}
        {...props}
      >
        {children}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={<h2 className="font-display text-lg font-semibold text-text">{confirmTitle}</h2>}
      >
        <p className="text-sm text-text-muted">{confirmMessage}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
            Annulla
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => {
              setOpen(false);
              formRef.current?.requestSubmit();
            }}
          >
            Elimina
          </Button>
        </div>
      </Modal>
    </>
  );
}
