export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="font-mono text-xs uppercase tracking-wide text-gold">
            Loremaster
          </span>
          <h1 className="mt-2 font-display text-3xl font-semibold text-text">
            Il tuo tavolo, ovunque tu sia
          </h1>
        </div>
        {children}
      </div>
    </div>
  );
}
