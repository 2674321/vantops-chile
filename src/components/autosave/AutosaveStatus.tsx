import { AlertTriangle, CheckCircle2, CloudUpload, LoaderCircle } from "lucide-react";
import type { AutosaveView } from "../../lib/autosave/AutosaveController";
export function AutosaveStatus({ state, onRetry }: { state: AutosaveView; onRetry?: () => void }) {
  const label = { idle: "Listo", pending: "Cambios pendientes…", saving: "Guardando…", saved: "Guardado en este dispositivo", invalid: "Corrige los datos para guardar", error: "Error al guardar" }[state.phase];
  const problem = state.phase === "error" || state.phase === "invalid";
  return <output aria-live="polite" aria-atomic="true" className={`flex min-h-9 flex-wrap items-center gap-2 text-xs ${problem ? "text-amber-300" : "text-slate-300"}`}>{state.phase === "saved" ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : state.phase === "saving" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : problem ? <AlertTriangle className="h-4 w-4" /> : <CloudUpload className="h-4 w-4" />}<span>{label}</span>{state.message && <span className="max-w-sm">{state.message}</span>}{state.phase === "error" && onRetry && <button type="button" className="rounded border border-amber-500 px-2 py-1" onClick={onRetry}>Reintentar</button>}</output>;
}
