import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/db/client";
import { signOut } from "../(auth)/actions";
import { Button } from "@/components/ui/button";
import { FlashToast } from "@/components/ui/flash-toast";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/dashboard" className="flex items-baseline gap-2">
            <span className="font-display text-xl font-semibold text-text">
              Loremaster
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/dashboard"
              className="rounded-md px-3 py-1.5 text-text-muted hover:bg-surface-2 hover:text-text"
            >
              Dashboard
            </Link>
            <Link
              href="/settings"
              className="rounded-md px-3 py-1.5 text-text-muted hover:bg-surface-2 hover:text-text"
            >
              Impostazioni
            </Link>
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                Esci
              </Button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>
    </div>
  );
}
