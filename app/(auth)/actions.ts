"use server";

import { signInWithPassword, signUpWithPassword, signOutCurrentUser } from "@/lib/db/auth";
import { redirect } from "next/navigation";

export type AuthState = { error: string | null };

export async function signIn(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Inserisci email e password." };
  }

  const { error } = await signInWithPassword(email, password);
  if (error) return { error };

  redirect("/dashboard");
}

export async function signUp(
  _prevState: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Inserisci email e password." };
  }
  if (password.length < 8) {
    return { error: "La password deve avere almeno 8 caratteri." };
  }

  const { error } = await signUpWithPassword(email, password);
  if (error) return { error };

  redirect("/dashboard");
}

export async function signOut() {
  await signOutCurrentUser();
  redirect("/login");
}
