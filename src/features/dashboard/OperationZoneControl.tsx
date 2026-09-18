import { useEffect, useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Circle } from "lucide-react";
import {
  RADIUS_PRESETS_METERS,
  formatRadius,
  validateRadiusMeters,
} from "../../domain/operationZone";
import { esCL as t } from "../../i18n/es-CL";

interface OperationZoneControlProps {
  radiusMeters: number | null;
  onChange: (radiusMeters: number) => void;
}

export function OperationZoneControl({ radiusMeters, onChange }: OperationZoneControlProps) {
  const [customValue, setCustomValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (radiusMeters === null) {
      setCustomValue("");
      return;
    }
    const isPreset = (RADIUS_PRESETS_METERS as readonly number[]).includes(radiusMeters);
    setCustomValue(isPreset ? "" : String(radiusMeters));
  }, [radiusMeters]);

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = Number.parseFloat(customValue);
    const validation = validateRadiusMeters(parsed);
    if (!validation.ok) {
      setError(validation.error);
      return;
    }
    onChange(parsed);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Circle className="h-4 w-4 text-sky-400" aria-hidden />
          {t.operationZone.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-400">{t.operationZone.description}</p>

        <fieldset className="space-y-2">
          <legend className="text-xs font-medium text-slate-400">
            {t.operationZone.radiusLabel}
          </legend>
          <div className="flex flex-wrap gap-2">
            {RADIUS_PRESETS_METERS.map((preset) => {
              const selected = radiusMeters === preset;
              return (
                <Button
                  key={preset}
                  type="button"
                  variant={selected ? "default" : "outline"}
                  size="sm"
                  aria-pressed={selected}
                  onClick={() => onChange(preset)}
                >
                  {formatRadius(preset)}
                </Button>
              );
            })}
          </div>
        </fieldset>

        {radiusMeters !== null && (
          <p className="text-sm text-sky-300">
            {t.operationZone.radiusLabel}: {formatRadius(radiusMeters)}
          </p>
        )}

        <form className="space-y-2" onSubmit={handleCustomSubmit}>
          <label
            htmlFor="operation-radius-custom"
            className="block text-xs font-medium text-slate-400"
          >
            {t.operationZone.customLabel}
          </label>
          <div className="flex gap-2">
            <input
              id="operation-radius-custom"
              className="h-11 min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 text-base outline-none focus:border-sky-500"
              inputMode="numeric"
              placeholder="1500"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "operation-radius-error" : undefined}
              value={customValue}
              onChange={(e) => {
                setCustomValue(e.target.value);
                setError(null);
              }}
            />
            <Button type="submit" variant="outline" className="shrink-0">
              {t.operationZone.apply}
            </Button>
          </div>
          {error && (
            <p id="operation-radius-error" role="alert" className="text-sm text-amber-300">
              {error}
            </p>
          )}
          <p className="text-[11px] text-slate-500">
            {t.operationZone.minHint} · {t.operationZone.maxHint}
          </p>
        </form>

        <p className="text-[11px] text-slate-500">{t.operationZone.disclaimer}</p>
      </CardContent>
    </Card>
  );
}
