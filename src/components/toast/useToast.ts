import { useContext } from "react";
import { ToastContext } from "./toastContext";
import type { ToastApi } from "./toastContext";

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast debe usarse dentro de <ToastProvider>.");
  }
  return context;
}

export type { ToastApi, ToastOptions } from "./toastContext";
