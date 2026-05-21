import type { Audit, AuditListItem, Issue, ScanRequest } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

export function listAudits(): Promise<AuditListItem[]> {
  return apiGet("/audits");
}

export function getAudit(auditId: string): Promise<Audit> {
  return apiGet(`/audits/${encodeURIComponent(auditId)}`);
}

export function getIssues(auditId: string): Promise<Issue[]> {
  return apiGet(`/audits/${encodeURIComponent(auditId)}/issues`);
}

export function getReport(auditId: string): Promise<{ audit_id: string; markdown: string }> {
  return apiGet(`/audits/${encodeURIComponent(auditId)}/report`);
}

export function getLeakage(auditId: string): Promise<Record<string, unknown>> {
  return apiGet(`/audits/${encodeURIComponent(auditId)}/leakage`);
}

export function getDrift(auditId: string): Promise<Record<string, unknown>> {
  return apiGet(`/audits/${encodeURIComponent(auditId)}/drift`);
}

export function runScan(req: ScanRequest): Promise<{ audit_id: string; status: string; summary: unknown }> {
  return apiPost("/scan", req);
}
