export type ToastVariant = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  variant: ToastVariant;
  message: string;
  durationMs: number;
  createdAt: number;
}

export const TOAST_DURATIONS_MS: Record<ToastVariant, number> = {
  success: 3500,
  info: 3500,
  warning: 5500,
  error: 5500,
};

export const MAX_VISIBLE_TOASTS = 3;

export const TOAST_DEDUPE_WINDOW_MS = 4000;

export function resolveDurationMs(variant: ToastVariant, durationMs?: number): number {
  if (durationMs != null && Number.isFinite(durationMs) && durationMs > 0) return durationMs;
  return TOAST_DURATIONS_MS[variant];
}

export function enqueueToast(list: Toast[], incoming: Toast): Toast[] {
  const duplicate = [...list]
    .reverse()
    .find(
      (toast) =>
        toast.variant === incoming.variant &&
        toast.message === incoming.message &&
        incoming.createdAt - toast.createdAt < TOAST_DEDUPE_WINDOW_MS,
    );

  const withoutDuplicate = duplicate ? list.filter((toast) => toast.id !== duplicate.id) : list;
  const next = [...withoutDuplicate, incoming];

  return next.length > MAX_VISIBLE_TOASTS
    ? next.slice(next.length - MAX_VISIBLE_TOASTS)
    : next;
}

export function dismissToast(list: Toast[], id: string): Toast[] {
  return list.filter((toast) => toast.id !== id);
}

export function isToastExpired(toast: Toast, now: number): boolean {
  return now - toast.createdAt >= toast.durationMs;
}

export function removeExpiredToasts(list: Toast[], now: number): Toast[] {
  return list.filter((toast) => !isToastExpired(toast, now));
}
