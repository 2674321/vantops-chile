import { useQuery } from "@tanstack/react-query";
import { fetchElevation } from "../../providers/elevation/openMeteoElevation";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { DataSourceBadge } from "../weather/WeatherPanel";
import { Mountain } from "lucide-react";

export function ElevationCard({
  latitude,
  longitude,
}: {
  latitude: number;
  longitude: number;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["elevation", latitude, longitude],
    queryFn: () => fetchElevation(latitude, longitude),
    staleTime: 7 * 24 * 60 * 60_000,
    gcTime: 30 * 24 * 60 * 60_000,
    retry: 2,
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mountain className="h-4 w-4 text-emerald-400" />
          Elevación del terreno
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <p className="text-sm text-slate-400">Consultando elevación…</p>
        )}
        {error && (
          <p className="text-sm text-red-400">
            Sin datos de elevación
          </p>
        )}
        {data && (
          <>
            <p className="text-2xl font-bold text-slate-100">
              {data.meters !== null ? `${Math.round(data.meters)} m s.n.m.` : "—"}
            </p>
            <DataSourceBadge meta={data.meta} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
