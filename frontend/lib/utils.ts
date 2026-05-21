import { getAudit, listAudits } from "./api";
import type { Audit } from "./types";

export async function getLatestAudit(): Promise<Audit | null> {
  const audits = await listAudits();
  if (!audits.length) return null;
  return getAudit(audits[0].audit_id);
}

