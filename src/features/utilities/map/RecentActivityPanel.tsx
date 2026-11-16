import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { totalFlightSeconds } from "../../../domain/operations/logic";
import type { OperationSession } from "../../../domain/operations/types";

function minutes(seconds: number): string { return `${Math.round(seconds / 60)} min`; }

export function RecentActivityPanel({ sessions }: { sessions: OperationSession[] }) {
  const navigate = useNavigate();
  const totalFlights = sessions.reduce((sum, session) => sum + session.flights.filter((flight) => flight.status === "LANDED").length, 0);
  const totalSeconds = sessions.reduce((sum, session) => sum + totalFlightSeconds(session), 0);
  return <div className="space-y-3">
    <Card><CardHeader><CardTitle>Registro operacional</CardTitle></CardHeader><CardContent className="space-y-3"><div className="grid grid-cols-2 gap-2"><div className="rounded-lg bg-slate-900 p-3"><p className="text-2xl font-semibold text-slate-100">{sessions.length}</p><p className="text-xs text-slate-400">sesiones recientes</p></div><div className="rounded-lg bg-slate-900 p-3"><p className="text-2xl font-semibold text-slate-100">{totalFlights}</p><p className="text-xs text-slate-400">vuelos · {minutes(totalSeconds)}</p></div></div><Button className="w-full" onClick={() => navigate("/bitacora")}>Abrir Bitácora completa</Button><Button variant="outline" className="w-full" onClick={() => navigate("/bitacora/nuevo")}>Registrar vuelo manual</Button></CardContent></Card>
    {sessions.length === 0 && <p className="rounded-lg border border-dashed border-slate-700 p-4 text-sm text-slate-400">Las operaciones cerradas aparecerán aquí. No se crea un vuelo ficticio si una sesión termina sin despegar.</p>}
    {sessions.slice(0, 12).map((session) => <Card key={session.id}><CardContent className="space-y-1 pt-4"><div className="flex items-center justify-between gap-2"><p className="truncate text-sm font-medium text-slate-200">{session.locationSnapshot.label ?? "Operación sin etiqueta"}</p><span className="rounded-full bg-slate-800 px-2 py-1 text-[11px] text-slate-300">{session.status === "ACTIVE" ? "En curso" : session.status === "COMPLETED" ? "Finalizada" : "Cancelada"}</span></div><p className="text-xs text-slate-500">{new Date(session.startedAt).toLocaleString("es-CL")} · {session.flights.filter((flight) => flight.status === "LANDED").length} vuelos · {minutes(totalFlightSeconds(session))}</p></CardContent></Card>)}
  </div>;
}
