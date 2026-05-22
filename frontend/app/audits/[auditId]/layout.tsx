"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Button } from "../../../components/ui/button";
import { Separator } from "../../../components/ui/separator";

function isActive(pathname: string, href: string) {
  if (href === pathname) return true;
  return pathname.startsWith(href + "/");
}

export default function AuditLayout({ children, params }: { children: ReactNode; params: { auditId: string } }) {
  const pathname = usePathname();
  const base = `/audits/${params.auditId}`;

  const links = [
    { href: base, label: "Overview" },
    { href: `${base}/samples`, label: "Samples" },
    { href: `${base}/leakage`, label: "Leakage" },
    { href: `${base}/image-quality`, label: "Image quality" },
    { href: `${base}/mask-quality`, label: "Mask quality" },
    { href: `${base}/drift`, label: "Drift" },
    { href: `${base}/report`, label: "Report" }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {links.map((l) => (
          <Button key={l.href} asChild variant={isActive(pathname, l.href) ? "secondary" : "ghost"} size="sm">
            <Link href={l.href}>{l.label}</Link>
          </Button>
        ))}
      </div>
      <Separator />
      {children}
    </div>
  );
}

