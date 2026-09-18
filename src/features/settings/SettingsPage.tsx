import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { ArrowLeft, Save, Wind, CloudRain, Eye, Thermometer, Gauge, Database } from "lucide-react";
import type { FlightLimits } from "../../domain/assessment/limits";
import { loadFlightLimits, saveFlightLimits } from "../../storage/settings";
import { useToast } from "../../components/toast/useToast";
import { esCL as t } from "../../i18n/es-CL";

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

export function SettingsPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [limits, setLimits] = useState<Partial<Record<LimitKey, string>>>({});
  const [loaded, setLoaded] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

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
    setFormError(null);
  }, []);

  const handleSave = useCallback(async () => {
    if (saving) return;
    const parsed: FlightLimits = {};
    for (const field of LIMIT_FIELDS) {
      const raw = limits[field.key] ?? "";
      const value = parseLimit(raw);
      if (value === undefined && raw.trim() !== "") {
        setFormError(
          t.settings.invalidValue(t.settings.fields[field.key].label)
        );
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
      setFormError(t.settings.temperatureOrder);
      return;
    }

    setSaving(true);
    try {
      await saveFlightLimits(parsed);
      toast.success(t.feedback.limitsSaved);
    } catch {
      setFormError(t.feedback.limitsSaveError);
    } finally {
      setSaving(false);
    }
  }, [limits, saving, toast]);

  const handleClear = useCallback(async () => {
    setSaving(true);
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
      setFormError(null);
      setConfirmClear(false);
      toast.success(t.feedback.limitsCleared);
    } catch {
      setFormError(t.feedback.limitsSaveError);
    } finally {
      setSaving(false);
    }
  }, [toast]);

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
          <p className="rounded-lg border border-slate-700 bg-slate-800/40 p-3 text-xs text-slate-300">
            {t.settings.intro}
          </p>

          <div className="space-y-3">
            {LIMIT_FIELDS.map((field) => {
              const Icon = field.icon;
              const copy = t.settings.fields[field.key];
              return (
                <div key={field.key}>
                  <label htmlFor={`limit-${field.key}`} className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-300">
                    <Icon className="h-3.5 w-3.5 text-slate-500" aria-hidden />
                    {copy.label}
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
                    {field.unit && (
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                        {field.unit}
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