import { ArrowRight, Home, Map as MapIcon, MapPin, Ruler } from "lucide-react";
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
      <Card className="border-sky-700/70 bg-gradient-to-br from-sky-950/40 to-slate-950 shadow-lg shadow-sky-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base normal-case tracking-normal text-slate-100">
              <MapIcon className="h-5 w-5 text-sky-400" /> Mapa de operaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-300">Crea radios múltiples, mide distancias y guarda mapas localmente.</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="button" className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 font-medium text-slate-950 hover:bg-sky-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400" onClick={() => navigate("/utilidades/mapa")}>Abrir mapa completo <ArrowRight className="h-4 w-4" /></button>
              <button type="button" className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-slate-700 px-4 font-medium text-slate-200 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400" onClick={() => navigate("/")}><Home className="h-4 w-4" />Ver mapa en Inicio</button>
            </div>
          </CardContent>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" className="text-left" onClick={() => navigate("/utilidades/mapa?mode=measure")}><Card className="h-full transition hover:border-emerald-700"><CardContent className="flex gap-3 py-4"><Ruler className="h-5 w-5 text-emerald-400" /><div><p className="font-medium text-slate-200">Medir distancias</p><p className="text-xs text-slate-500">Abre el mapa listo para definir los puntos A y B.</p></div></CardContent></Card></button>
        <Card><CardContent className="flex gap-3 py-4"><MapPin className="h-5 w-5 text-amber-400" /><div><p className="font-medium text-slate-200">Coordenadas</p><p className="text-xs text-slate-500">Consulta, pega y copia WGS84 desde el mapa.</p></div></CardContent></Card>
      </div>
      <p className="rounded-lg border border-amber-800/40 bg-amber-950/20 p-3 text-xs text-amber-200">{t.utilities.disclaimer}</p>
    </div>
  );
}
