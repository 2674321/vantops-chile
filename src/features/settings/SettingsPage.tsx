import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Save, Wind, CloudRain, Eye, Thermometer, Gauge, Database } from "lucide-react";
import type { FlightLimits } from "../../domain/assessment/limits";
import { loadFlightLimits, saveFlightLimits } from "../../storage/settings";

type LimitKey =
  | "windMaxKmh"
  | "gustMaxKmh"
  | "precipitationMaxMm"
  | "visibilityMinMeters"
  | "temperatureMinC"
  | "temperatureMaxC";

interface LimitFieldDef<TKey extends LimitKey> {
  key: TKey;
  label: string;
  hint: string;
  placeholder: string;
  unit?: string;
  icon: typeof Wind;
}

const LIMIT_FIELDS: LimitFieldDef<LimitKey>[] = [
  { key: "windMaxKmh", label: "Viento máximo (10 m)", hint: "Límite de viento a 10 m sobre el terreno.", placeholder: "p. ej. 30", unit: "km/h", icon: Wind },
  { key: "gustMaxKmh", label: "Ráfaga máxima", hint: "Límite de ráfagas.", placeholder: "p. ej. 40", unit: "km/h", icon: Gauge },
  { key: "precipitationMaxMm", label: "Precipitación máxima", hint: "Máximo de precipitación por hora.", placeholder: "p. ej. 0.5", unit: "mm", icon: CloudRain },
  { key: "visibilityMinMeters", label: "Visibilidad mínima", hint: "Mínimo de visibilidad requerido.", placeholder: "p. ej. 5000", unit: "m", icon: Eye },
  { key: "temperatureMinC", label: "Temperatura mínima", hint: "Límite inferior de temperatura.", placeholder: "p. ej. 0", unit: "°C", icon: Thermometer },
  { key: "temperatureMaxC", label: "Temperatura máxima", hint: "Límite superior de temperatura.", placeholder: "p. ej. 35", unit: "°C", icon: Thermometer },
];

const PILOT_DISCLAIMER =
  "Estos valores corresponden a preferencias o límites operacionales definidos por el piloto. No constituyen límites legales ni una autorización de vuelo.";

function parseLimit(value: string): number | undefined {
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  const num = Number.parseFloat(trimmed.replace(",", "."));
  if (Number.isNaN(num)) return undefined;
  return num;
}

function stringifyLimit(value: number | undefined): string {
  return value == null ? "" : String(value);
}

export function SettingsPage() {
  const navigate = useNavigate();
  const [limits, setLimits] = useState<Partial<Record<LimitKey, string>>>({});
  const [loaded, setLoaded] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadFlightLimits().then((stored) => {
      setLimits({
        windMaxKmh: stringifyLimit(stored.windMaxKmh),
        gustMaxKmh: stringifyLimit(stored.gustMaxKmh),
        precipitationMaxMm: stringifyLimit(stored.precipitationMaxMm),
        visibilityMinMeters: stringifyLimit(stored.visibilityMinMeters),
        temperatureMinC: stringifyLimit(stored.temperatureMinC),
        temperatureMaxC: stringifyLimit(stored.temperatureMaxC),
      });
      setLoaded(true);
    });
  }, []);

  const handleChange = useCallback((key: LimitKey, value: string) => {
    setLimits((prev) => ({ ...prev, [key]: value }));
    setSavedAt(null);
    setFormError(null);
  }, []);

  const handleSave = useCallback(async () => {
    const parsed: FlightLimits = {};
    for (const field of LIMIT_FIELDS) {
      const raw = limits[field.key] ?? "";
      const value = parseLimit(raw);
      if (value === undefined && raw.trim() !== "") {
        setFormError(`Valor inválido en «${field.label}». Usa un número o deja el campo vacío.`);
        return;
      }
      if (value !== undefined) {
        parsed[field.key] = value;
      }
    }

    if (
      parsed.temperatureMinC != null &&
      parsed.temperatureMaxC != null &&
      parsed.temperatureMinC >= parsed.temperatureMaxC
    ) {
      setFormError("La temperatura mínima debe ser menor que la máxima.");
      return;
    }

    try {
      await saveFlightLimits(parsed);
      setSavedAt(new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }));
    } catch {
      setFormError("No se pudieron guardar los límites en este dispositivo.");
    }
  }, [limits]);

  const handleClear = useCallback(async () => {
    try {
      await saveFlightLimits({});
      setLimits({
        windMaxKmh: "",
        gustMaxKmh: "",
        precipitationMaxMm: "",
        visibilityMinMeters: "",
        temperatureMinC: "",
        temperatureMaxC: "",
      });
      setSavedAt(new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }));
      setFormError(null);
    } catch {
      setFormError("No se pudieron borrar los límites en este dispositivo.");
    }
  }, []);

  const configured = LIMIT_FIELDS.some((field) => (limits[field.key] ?? "").trim() !== "");

  if (!loaded) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-slate-400">Cargando…</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => navigate("/")} aria-label="Volver al panel">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold text-slate-100">Ajustes</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wind className="h-4 w-4 text-sky-400" />
            Preferencias del piloto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="rounded-lg border border-slate-700 bg-slate-800/40 p-3 text-xs text-slate-300">
            Define tus propios límites operacionales. Un campo vacío significa que ese criterio no está
            configurado y no participa de la evaluación.
          </p>

          <div className="space-y-3">
            {LIMIT_FIELDS.map((field) => {
              const Icon = field.icon;
              return (
                <div key={field.key}>
                  <label htmlFor={`limit-${field.key}`} className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-300">
                    <Icon className="h-3.5 w-3.5 text-slate-500" aria-hidden />
                    {field.label}
                  </label>
                  <div className="relative">
                    <input
                      id={`limit-${field.key}`}
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder={field.placeholder}
                      className="h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 pr-16 text-base text-slate-200 outline-none focus:border-sky-500"
                      value={limits[field.key] ?? ""}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                    />
                    {field.unit && (
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                        {field.unit}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">{field.hint}</p>
                </div>
              );
            })}
          </div>

          {formError && (
            <p className="rounded-lg border border-red-800/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
              {formError}
            </p>
          )}

          {savedAt && (
            <p className="rounded-lg border border-emerald-800/50 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-300">
              Límites guardados localmente · {savedAt}
            </p>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1">
              <Save className="mr-2 h-4 w-4" />
              Guardar límites
            </Button>
            {configured && (
              <Button size="sm" variant="ghost" onClick={handleClear}>
                Borrar todo
              </Button>
            )}
          </div>

          <p className="rounded-lg border border-amber-800/40 bg-amber-950/20 p-3 text-xs text-amber-200/90">
            {PILOT_DISCLAIMER}
          </p>
          <p className="text-[11px] text-slate-500">
            VantOPS no inventa límites de fabricante. Tú defines cuáles son tus condiciones.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4 text-sky-400" />
            Datos locales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-400">
            Tus datos se guardan solo en este dispositivo. Exporta periódicamente un respaldo.
          </p>
          <Button variant="outline" onClick={() => navigate("/bitacora/exportar")}>
            Exportar / Importar respaldo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}