import { Plane, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import type { OperationSession } from "../../../domain/operations/types";
import { activeFlightRun, visibleSessionSeconds } from "../../../domain/operations/logic";
import { Button } from "../../../components/ui/button";

function duration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return `${hours ? `${hours}:` : ""}${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export function ActiveSessionBanner({ session, onOpen }: { session: OperationSession; onOpen: () => void }) {
  const [now, setNow] = useState(() => new Date().toISOString());
  useEffect(() => { const id = window.setInterval(() => setNow(new Date().toISOString()), 1000); return () => window.clearInterval(id); }, []);
  const flight = activeFlightRun(session);
  return <div className="absolute left-3 right-3 top-3 z-[600] flex flex-wrap items-center gap-2 rounded-xl border border-sky-500/50 bg-slate-950/95 p-2 shadow-xl backdrop-blur sm:left-auto sm:max-w-lg">
    <span className={`flex h-9 w-9 items-center justify-center rounded-full ${flight ? "bg-emerald-500/20 text-emerald-300" : "bg-sky-500/20 text-sky-300"}`}>{flight ? <Plane className="h-5 w-5" /> : <Timer className="h-5 w-5" />}</span>
    <div className="min-w-0 flex-1"><p aria-live="polite" className="text-sm font-semibold text-slate-100">{flight ? "Vuelo en curso" : "Operación en curso"}</p><p className="text-xs tabular-nums text-slate-400">{duration(visibleSessionSeconds(session, now))} · {session.locationSnapshot.label ?? "Punto del mapa"}</p></div>
    <Button size="sm" onClick={onOpen}>{flight ? "Finalizar vuelo" : "Abrir operación"}</Button>
  </div>;
}
