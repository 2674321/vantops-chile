import { ArrowRight, Map as MapIcon, MapPin, Ruler } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { esCL as t } from "../../i18n/es-CL";

export function UtilitiesPage() {
  const navigate = useNavigate();
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-400">{t.utilities.eyebrow}</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-100">{t.utilities.title}</h1>
        <p className="mt-2 text-sm text-slate-400">{t.utilities.description}</p>
      </div>
      <button type="button" className="w-full text-left" onClick={() => navigate("/utilidades/mapa")}>
        <Card className="border-sky-800/70 transition hover:border-sky-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base normal-case tracking-normal text-slate-100">
              <MapIcon className="h-5 w-5 text-sky-400" /> Mapa de operaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-sm text-slate-400">Crea radios múltiples, mide distancias y guarda mapas localmente.</p>
            <ArrowRight className="h-5 w-5 shrink-0 text-sky-400" />
          </CardContent>
        </Card>
      </button>
      <div className="grid gap-3 sm:grid-cols-2">
        <Card><CardContent className="flex gap-3 py-4"><Ruler className="h-5 w-5 text-emerald-400" /><div><p className="font-medium text-slate-200">Medición de distancias</p><p className="text-xs text-slate-500">Disponible dentro del mapa de operaciones.</p></div></CardContent></Card>
        <Card><CardContent className="flex gap-3 py-4"><MapPin className="h-5 w-5 text-amber-400" /><div><p className="font-medium text-slate-200">Coordenadas</p><p className="text-xs text-slate-500">Consulta, pega y copia WGS84 desde el mapa.</p></div></CardContent></Card>
      </div>
      <p className="rounded-lg border border-amber-800/40 bg-amber-950/20 p-3 text-xs text-amber-200">{t.utilities.disclaimer}</p>
    </div>
  );
}
