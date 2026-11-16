import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Save, Wind, CloudRain, Eye, Thermometer, Gauge, Database } from "lucide-react";
import type { FlightLimits } from "../../domain/assessment/limits";
import {
  loadDisplayPreferences,
  loadFlightLimits,
  saveDisplayPreferences,
  saveFlightLimits,
} from "../../storage/settings";
import { useToast } from "../../components/toast/useToast";
import { esCL as t } from "../../i18n/es-CL";
import {
  DEFAULT_DISPLAY_PREFERENCES,
  distanceFromMeters,
  distanceToMeters,
  distanceUnitLabel,
  speedFromKmh,
  speedToKmh,
  speedUnitLabel,
  temperatureFromC,
  temperatureToC,
  temperatureUnitLabel,
  type DisplayPreferences,
} from "../../domain/displayPreferences";
import { AutosaveController, type AutosaveView } from "../../lib/autosave/AutosaveController";
import { AutosaveStatus } from "../../components/autosave/AutosaveStatus";

type LimitKey =
  | "windMaxKmh"
  | "gustMaxKmh"
  | "precipitationMaxMm"
  | "visibilityMinMeters"
  | "temperatureMinC"
  | "temperatureMaxC";

interface LimitFieldDef<TKey extends LimitKey> {
  key: TKey;
  unit?: string;
  icon: typeof Wind;
}

const LIMIT_FIELDS: LimitFieldDef<LimitKey>[] = [
  { key: "windMaxKmh", unit: "km/h", icon: Wind },
  { key: "gustMaxKmh", unit: "km/h", icon: Gauge },
  { key: "precipitationMaxMm", unit: "mm", icon: CloudRain },
  { key: "visibilityMinMeters", unit: "m", icon: Eye },
  { key: "temperatureMinC", unit: "°C", icon: Thermometer },
  { key: "temperatureMaxC", unit: "°C", icon: Thermometer },
];

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

interface SettingsDraft { limits: Partial<Record<LimitKey, string>>; preferences: DisplayPreferences; windReferenceHeight: 10 | 100; }

function parseSettingsDraft(draft: SettingsDraft): { ok: true; limits: FlightLimits } | { ok: false; error: string } {
  const parsed: FlightLimits = { windReferenceHeight: draft.windReferenceHeight };
  for (const field of LIMIT_FIELDS) {
    const raw = draft.limits[field.key] ?? "";
    const value = parseLimit(raw);
    if (value === undefined && raw.trim() !== "") return { ok: false, error: t.settings.invalidValue(t.settings.fields[field.key].label) };
    if (value !== undefined) parsed[field.key] = field.key === "windMaxKmh" || field.key === "gustMaxKmh" ? speedToKmh(value, draft.preferences.speedUnit) : field.key === "temperatureMinC" || field.key === "temperatureMaxC" ? temperatureToC(value, draft.preferences.temperatureUnit) : field.key === "visibilityMinMeters" ? distanceToMeters(value, draft.preferences.distanceUnit) : value;
  }
  if (parsed.temperatureMinC != null && parsed.temperatureMaxC != null && parsed.temperatureMinC >= parsed.temperatureMaxC) return { ok: false, error: t.settings.temperatureOrder };
  return { ok: true, limits: parsed };
}

export function SettingsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [limits, setLimits] = useState<Partial<Record<LimitKey, string>>>({});
  const [loaded, setLoaded] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [windReferenceHeight, setWindReferenceHeight] = useState<10 | 100>(10);
  const [preferences, setPreferences] = useState<DisplayPreferences>(DEFAULT_DISPLAY_PREFERENCES);
  const lastStaged = useRef("");
  const autosave = useMemo(() => new AutosaveController<SettingsDraft>(async (draft) => { const parsed = parseSettingsDraft(draft); if (!parsed.ok) throw new Error(parsed.error); try { await Promise.all([saveFlightLimits(parsed.limits), saveDisplayPreferences(draft.preferences)]); } catch { throw new Error(t.feedback.limitsSaveError); } }, (draft) => { const parsed = parseSettingsDraft(draft); return parsed.ok ? null : parsed.error; }, 700), []);
  const [saveState, setSaveState] = useState<AutosaveView>(autosave.snapshot);

  useEffect(() => autosave.subscribe(setSaveState), [autosave]);

  useEffect(() => {
    Promise.all([loadFlightLimits(), loadDisplayPreferences()]).then(([stored, display]) => {
      setPreferences(display);
      setLimits({
        windMaxKmh: stringifyLimit(stored.windMaxKmh == null ? undefined : speedFromKmh(stored.windMaxKmh, display.speedUnit)),
        gustMaxKmh: stringifyLimit(stored.gustMaxKmh == null ? undefined : speedFromKmh(stored.gustMaxKmh, display.speedUnit)),
        precipitationMaxMm: stringifyLimit(stored.precipitationMaxMm),
        visibilityMinMeters: stringifyLimit(stored.visibilityMinMeters == null ? undefined : distanceFromMeters(stored.visibilityMinMeters, display.distanceUnit)),
        temperatureMinC: stringifyLimit(stored.temperatureMinC == null ? undefined : temperatureFromC(stored.temperatureMinC, display.temperatureUnit)),
        temperatureMaxC: stringifyLimit(stored.temperatureMaxC == null ? undefined : temperatureFromC(stored.temperatureMaxC, display.temperatureUnit)),
      });
      setWindReferenceHeight(stored.windReferenceHeight === 100 ? 100 : 10);
      const initialDraft = { limits: {
        windMaxKmh: stringifyLimit(stored.windMaxKmh == null ? undefined : speedFromKmh(stored.windMaxKmh, display.speedUnit)),
        gustMaxKmh: stringifyLimit(stored.gustMaxKmh == null ? undefined : speedFromKmh(stored.gustMaxKmh, display.speedUnit)),
        precipitationMaxMm: stringifyLimit(stored.precipitationMaxMm), visibilityMinMeters: stringifyLimit(stored.visibilityMinMeters == null ? undefined : distanceFromMeters(stored.visibilityMinMeters, display.distanceUnit)),
        temperatureMinC: stringifyLimit(stored.temperatureMinC == null ? undefined : temperatureFromC(stored.temperatureMinC, display.temperatureUnit)), temperatureMaxC: stringifyLimit(stored.temperatureMaxC == null ? undefined : temperatureFromC(stored.temperatureMaxC, display.temperatureUnit)),
      }, preferences: display, windReferenceHeight: stored.windReferenceHeight === 100 ? 100 as const : 10 as const };
      lastStaged.current = JSON.stringify(initialDraft);
      autosave.resetFromStorage(initialDraft);
      setLoaded(true);
    });
  }, [autosave]);

  useEffect(() => {
    if (!loaded) return;
    const draft = { limits, preferences, windReferenceHeight };
    const serialized = JSON.stringify(draft);
    if (serialized === lastStaged.current) return;
    lastStaged.current = serialized;
    autosave.stage(draft);
  }, [autosave, limits, loaded, preferences, windReferenceHeight]);

  const changePreferences = useCallback((next: DisplayPreferences) => {
    setLimits((current) => {
      const converted = { ...current };
      for (const key of ["windMaxKmh", "gustMaxKmh"] as const) {
        const value = parseLimit(current[key] ?? "");
        if (value !== undefined) converted[key] = stringifyLimit(speedFromKmh(speedToKmh(value, preferences.speedUnit), next.speedUnit));
      }
      for (const key of ["temperatureMinC", "temperatureMaxC"] as const) {
        const value = parseLimit(current[key] ?? "");
        if (value !== undefined) converted[key] = stringifyLimit(temperatureFromC(temperatureToC(value, preferences.temperatureUnit), next.temperatureUnit));
      }
      const visibility = parseLimit(current.visibilityMinMeters ?? "");
      if (visibility !== undefined) converted.visibilityMinMeters = stringifyLimit(distanceFromMeters(distanceToMeters(visibility, preferences.distanceUnit), next.distanceUnit));
      return converted;
    });
    setPreferences(next);
  }, [preferences]);

  const handleChange = useCallback((key: LimitKey, value: string) => {
    setLimits((prev) => ({ ...prev, [key]: value }));
    setFormError(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    try {
      autosave.stage({ limits, preferences, windReferenceHeight });
      if (!await autosave.flush()) return;
      setFormError(null);
      toast.success(t.feedback.limitsSaved);
    } finally {
      setSaving(false);
    }
  }, [autosave, limits, saving, toast, windReferenceHeight, preferences]);

  const handleClear = useCallback(async () => {
    setSaving(true);
    try {
      await saveFlightLimits({});
      setWindReferenceHeight(10);
      setLimits({
        windMaxKmh: "",
        gustMaxKmh: "",
        precipitationMaxMm: "",
        visibilityMinMeters: "",
        temperatureMinC: "",
        temperatureMaxC: "",
      });
      setFormError(null);
      const cleared = { limits: { windMaxKmh: "", gustMaxKmh: "", precipitationMaxMm: "", visibilityMinMeters: "", temperatureMinC: "", temperatureMaxC: "" }, preferences, windReferenceHeight: 10 as const };
      lastStaged.current = JSON.stringify(cleared);
      autosave.resetFromStorage(cleared);
      setConfirmClear(false);
      toast.success(t.feedback.limitsCleared);
    } catch {
      setFormError(t.feedback.limitsSaveError);
    } finally {
      setSaving(false);
    }
  }, [autosave, preferences, toast]);

  const configured = LIMIT_FIELDS.some((field) => (limits[field.key] ?? "").trim() !== "");

  if (!loaded) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-slate-400">
          {t.common.loading}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => navigate("/")} aria-label={t.settings.backToPanel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold text-slate-100">{t.settings.title}</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wind className="h-4 w-4 text-sky-400" />
            {t.settings.pilotTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AutosaveStatus state={saveState} onRetry={() => void autosave.retry()} />
          <p className="rounded-lg border border-slate-700 bg-slate-800/40 p-3 text-xs text-slate-300">
            {t.settings.intro}
          </p>

          <div className="space-y-3">
            <div className="grid gap-3 rounded-lg border border-slate-700 p-3 sm:grid-cols-2">
              <div><label htmlFor="speed-unit" className="mb-1 block text-xs text-slate-300">Velocidad</label><select id="speed-unit" value={preferences.speedUnit} onChange={(e) => changePreferences({ ...preferences, speedUnit: e.target.value as DisplayPreferences["speedUnit"] })} className="h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200"><option value="kmh">km/h</option><option value="ms">m/s</option><option value="kt">nudos (kt)</option></select></div>
              <div><label htmlFor="temperature-unit" className="mb-1 block text-xs text-slate-300">Temperatura</label><select id="temperature-unit" value={preferences.temperatureUnit} onChange={(e) => changePreferences({ ...preferences, temperatureUnit: e.target.value as DisplayPreferences["temperatureUnit"] })} className="h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200"><option value="c">°C</option><option value="f">°F</option></select></div>
              <div><label htmlFor="distance-unit" className="mb-1 block text-xs text-slate-300">Distancia y elevación</label><select id="distance-unit" value={preferences.distanceUnit} onChange={(e) => changePreferences({ ...preferences, distanceUnit: e.target.value as DisplayPreferences["distanceUnit"] })} className="h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-200"><option value="metric">m / km</option><option value="imperial">ft</option></select></div>
              <label className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-700 px-3 text-sm text-slate-200"><input type="checkbox" checked={preferences.expertMode} onChange={(e) => changePreferences({ ...preferences, expertMode: e.target.checked })} /> Modo experto</label>
              <p className="text-[11px] text-slate-500 sm:col-span-2">Las magnitudes se guardan internamente en km/h, metros y °C. Cambiar la presentación no altera tus límites.</p>
            </div>
            <fieldset className="rounded-lg border border-slate-700 p-3">
              <legend className="px-1 text-xs font-medium text-slate-300">
                Altura de referencia del viento
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {([10, 100] as const).map((height) => (
                  <label key={height} className="flex min-h-11 items-center gap-2 rounded-lg border border-slate-700 px-3 text-sm text-slate-200">
                    <input
                      type="radio"
                      name="wind-reference-height"
                      value={height}
                      checked={windReferenceHeight === height}
                      onChange={() => setWindReferenceHeight(height)}
                    />
                    {height} m
                  </label>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                10 m es el valor predeterminado. El dato a 100 m es una referencia del modelo, no una medición a la altura exacta de vuelo. Las ráfagas conservan su capa original.
              </p>
            </fieldset>
            {LIMIT_FIELDS.map((field) => {
              const Icon = field.icon;
              const copy = t.settings.fields[field.key];
              const label =
                field.key === "windMaxKmh"
                  ? `${copy.label} (${windReferenceHeight} m)`
                  : copy.label;
              const unit =
                field.key === "windMaxKmh" || field.key === "gustMaxKmh"
                  ? speedUnitLabel(preferences.speedUnit)
                  : field.key === "temperatureMinC" || field.key === "temperatureMaxC"
                    ? temperatureUnitLabel(preferences.temperatureUnit)
                    : field.key === "visibilityMinMeters"
                      ? distanceUnitLabel(preferences.distanceUnit)
                      : field.unit;
              return (
                <div key={field.key}>
                  <label htmlFor={`limit-${field.key}`} className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-300">
                    <Icon className="h-3.5 w-3.5 text-slate-500" aria-hidden />
                    {label}
                  </label>
                  <div className="relative">
                    <input
                      id={`limit-${field.key}`}
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder={copy.placeholder}
                      className="h-11 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 pr-16 text-base text-slate-200 outline-none focus:border-sky-500"
                      value={limits[field.key] ?? ""}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                    />
                    {unit && (
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                        {unit}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">{copy.hint}</p>
                </div>
              );
            })}
          </div>

          {formError && (
            <p role="alert" className="rounded-lg border border-red-800/50 bg-red-950/30 px-3 py-2 text-sm text-red-300">
              {formError}
            </p>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSave} className="flex-1" disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? t.feedback.saving : t.settings.saveLimits}
            </Button>
            {configured && !confirmClear && (
              <Button size="sm" variant="ghost" onClick={() => setConfirmClear(true)} disabled={saving}>
                {t.settings.clearAll}
              </Button>
            )}
          </div>

          {confirmClear && (
            <div className="rounded-lg border border-red-800/50 bg-red-950/30 p-3">
              <p className="mb-2 text-sm text-red-300">
                {t.settings.clearConfirm}
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleClear} disabled={saving}>
                  {saving ? t.feedback.saving : t.settings.clearAll}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setConfirmClear(false)} disabled={saving}>
                  {t.common.cancel}
                </Button>
              </div>
            </div>
          )}

          <p className="rounded-lg border border-amber-800/40 bg-amber-950/20 p-3 text-xs text-amber-200/90">
            {t.settings.disclaimer}
          </p>
          <p className="text-[11px] text-slate-500">
            {t.settings.noInvent}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Database className="h-4 w-4 text-sky-400" />
            {t.settings.localDataTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-400">
            {t.settings.localDataMessage}
          </p>
          <Button variant="outline" onClick={() => navigate("/bitacora/exportar")}>
            {t.settings.exportImport}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
