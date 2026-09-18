import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  dismissToast,
  enqueueToast,
  removeExpiredToasts,
  resolveDurationMs,
} from "../../domain/toast";
import type { Toast, ToastVariant } from "../../domain/toast";
import { ToastContext } from "./toastContext";
import type { ToastApi, ToastOptions } from "./toastContext";
import { ToastViewport } from "./ToastViewport";

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const push = useCallback((variant: ToastVariant, message: string, options?: ToastOptions) => {
    const id = `toast-${Date.now()}-${counterRef.current++}`;
    const toast: Toast = {
      id,
      variant,
      message,
      durationMs: resolveDurationMs(variant, options?.durationMs),
      createdAt: Date.now(),
    };
    setToasts((prev) => enqueueToast(prev, toast));
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => dismissToast(prev, id));
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const now = Date.now();
    const nextExpiry = Math.min(...toasts.map((toast) => toast.createdAt + toast.durationMs));
    const delay = Math.max(nextExpiry - now, 0) + 50;
    const timer = setTimeout(() => {
      setToasts((prev) => removeExpiredToasts(prev, Date.now()));
    }, delay);
    return () => clearTimeout(timer);
  }, [toasts]);

  const api = useMemo<ToastApi>(
    () => ({
      success: (message, options) => push("success", message, options),
      error: (message, options) => push("error", message, options),
      info: (message, options) => push("info", message, options),
      warning: (message, options) => push("warning", message, options),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}
