export type DataStatus = "updated" | "stale" | "error" | "no-data";

export interface DataSourceMeta {
  source: string;
  requestedAt: string;
  receivedAt: string;
  status: DataStatus;
  error?: string;
}

export function computeFreshness(
  receivedAtISO: string,
  staleAfterMinutes: number
): DataStatus {
  const received = new Date(receivedAtISO).getTime();
  if (Number.isNaN(received)) return "error";
  const ageMs = Date.now() - received;
  if (ageMs < 0) return "error";
  return ageMs <= staleAfterMinutes * 60_000 ? "updated" : "stale";
}

export function minutesSince(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.round(ms / 60_000));
}
