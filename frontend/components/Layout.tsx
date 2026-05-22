import Link from "next/link";
import type { ReactNode } from "react";
import { ShieldCheck } from "lucide-react";

import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-screen-2xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <Link className="flex items-center gap-3" href="/">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-card">
              <ShieldCheck className="h-5 w-5 text-foreground" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">MedDataGuard</div>
              <div className="text-xs text-muted-foreground">Dataset QA • Leakage • Drift</div>
            </div>
          </Link>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/">New scan</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/audits">Audits</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-screen-2xl flex-1 px-4 py-6 md:px-8">{children}</main>
      <footer className="mx-auto w-full max-w-screen-2xl px-4 pb-10 text-xs text-muted-foreground md:px-8">
        <Separator className="my-6" />
        MedDataGuard is a research/portfolio prototype; not for medical decision-making.
      </footer>
    </div>
  );
}
