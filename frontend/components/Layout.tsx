import Link from "next/link";
import type { ReactNode } from "react";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-950/40 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded bg-slate-800" />
            <div>
              <div className="text-sm font-semibold">MedDataGuard</div>
              <div className="text-xs text-slate-400">Dataset QA • Leakage • Drift</div>
            </div>
          </div>
          <nav className="flex gap-4 text-sm text-slate-300">
            <Link className="hover:text-white" href="/">
              Home
            </Link>
            <Link className="hover:text-white" href="/audits">
              Audits
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 pb-10 text-xs text-slate-500">
        MedDataGuard is a research/portfolio prototype; not for medical decision-making.
      </footer>
    </div>
  );
}

