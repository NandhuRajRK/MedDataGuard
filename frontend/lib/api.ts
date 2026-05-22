import type { Audit, AuditListItem, BackendConfig, Issue, ScanRequest } from "./types";

const DEFAULT_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN;

function apiBase(): string {
  if (typeof window === "undefined") return DEFAULT_API_BASE;
  const override = window.localStorage.getItem("mdg_api_base")?.trim();
  return override ? override : DEFAULT_API_BASE;
}

export function setApiBaseOverride(value: string) {
  if (typeof window === "undefined") return;
  const v = value.trim();
  if (!v) window.localStorage.removeItem("mdg_api_base");
  else window.localStorage.setItem("mdg_api_base", v);
}

export function getApiBase(): string {
  return apiBase();
}

function authHeaders(): Record<string, string> {
  if (!API_TOKEN) return {};
  return { "X-API-Token": API_TOKEN };
}

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, { cache: "no-store", headers: { ...authHeaders() } });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return (await res.json()) as T;
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
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

export function getConfig(): Promise<BackendConfig> {
  return apiGet("/config");
}
