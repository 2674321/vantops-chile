import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import type { DataStatus } from "../features/weather/weather.types";
import { Button } from "./ui/button";

interface DataSourceBadgeProps {
  status: DataStatus;
  fetchedAtIso?: string | null;
  onRetry?: () => void;
}

function minutesSince(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60_000));
}

const STATUS_STYLES: Record<DataStatus, string> = {
  OK: "bg-ok",
  PARTIAL: "bg-warn",
  ERROR: "bg-bad",
};

export function DataSourceBadge({ status, fetchedAtIso, onRetry }: DataSourceBadgeProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (status !== "OK" || !fetchedAtIso) return;
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, [status, fetchedAtIso]);

  let label: string;
  if (status === "ERROR") {
    label = "Sin conexión con la fuente";
  } else if (!fetchedAtIso) {
    label = "Sin datos";
  } else {
    const minutes = minutesSince(fetchedAtIso);
    label = minutes < 1 ? "Actualizado ahora" : `Actualizado hace ${minutes} min`;
  }
  if (status === "PARTIAL") label = `Datos parciales · ${label}`;

  return (
    <span className="inline-flex items-center gap-2 text-xs text-slate-400">
      <span aria-hidden className={`inline-block h-2 w-2 rounded-full ${STATUS_STYLES[status]}`} />
      <span>{label}</span>
      {status === "ERROR" && onRetry && (
        <Button variant="ghost" size="sm" onClick={onRetry}>
          <RefreshCw aria-hidden className="h-3 w-3" />
          Reintentar
        </Button>
      )}
    </span>
  );
}
