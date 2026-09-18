import { createContext } from "react";

export interface ToastOptions {
  durationMs?: number;
}

export interface ToastApi {
  success(message: string, options?: ToastOptions): void;
  error(message: string, options?: ToastOptions): void;
  info(message: string, options?: ToastOptions): void;
  warning(message: string, options?: ToastOptions): void;
  dismiss(id: string): void;
}

export const ToastContext = createContext<ToastApi | null>(null);
