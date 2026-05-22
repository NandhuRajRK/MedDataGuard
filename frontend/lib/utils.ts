import { getAudit, listAudits } from "./api";
import type { Audit } from "./types";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function getLatestAudit(): Promise<Audit | null> {
  const audits = await listAudits();
  if (!audits.length) return null;
  return getAudit(audits[0].audit_id);
}
