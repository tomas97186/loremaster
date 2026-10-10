"use client";

import { useActionState, useState } from "react";
import { signIn, signUp, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

const initialState: AuthState = { error: null };

export function LoginForm() {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const action = mode === "signIn" ? signIn : signUp;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <div className="mb-5 flex rounded-lg border border-border p-1 text-sm">
        <button
          type="button"
          onClick={() => setMode("signIn")}
          className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
            mode === "signIn" ? "bg-accent text-white" : "text-text-muted"
          }`}
        >
          Accedi
        </button>
        <button
          type="button"
          onClick={() => setMode("signUp")}
          className={`flex-1 rounded-md py-1.5 font-medium transition-colors ${
            mode === "signUp" ? "bg-accent text-white" : "text-text-muted"
          }`}
        >
          Crea account
        </button>
      </div>

      <form action={formAction}>
        <Field label="Email" htmlFor="email">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        </Field>
        <Field
          label="Password"
          htmlFor="password"
          hint={mode === "signUp" ? "Almeno 8 caratteri." : undefined}
        >
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "signIn" ? "current-password" : "new-password"}
            required
            minLength={mode === "signUp" ? 8 : undefined}
          />
        </Field>

        {state.error ? (
          <p className="mb-4 text-sm text-danger">{state.error}</p>
        ) : null}

        <Button type="submit" disabled={pending} className="w-full">
          {pending
            ? "Un attimo…"
            : mode === "signIn"
              ? "Accedi"
              : "Crea account"}
        </Button>
      </form>
    </div>
  );
}
