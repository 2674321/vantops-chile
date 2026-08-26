import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  getDefaultChecklist,
  getVisibleChecklistItems,
  getContextFromData,
  getChecklistProgress,
  getItemsByCategory,
  getWarningItems,
  toggleItem,
  resetChecklist,
} from "../../domain/checklist/engine";
import { CHECKLIST_CATEGORIES_ORDER, CATEGORY_LABELS } from "../../domain/checklist/defaultChecklist";
import { loadChecklistState, saveChecklistState, clearChecklistState } from "../../storage/checklists";
import type { ChecklistState, ChecklistCategory } from "../../domain/checklist/types";
import type { WeatherSnapshot } from "../../domain/weather";
import type { SolarTimes } from "../../domain/solar";
import type { FlightAssessment } from "../../domain/assessment/types";
import type { AircraftProfile } from "../../domain/assessment/aircraft";
import { esCL as t } from "../../i18n/es-CL";

interface ChecklistCardProps {
  weather: WeatherSnapshot | null;
  solar: SolarTimes | null;
  assessment: FlightAssessment | null;
  aircraft: AircraftProfile | null;
}

export function ChecklistCard({ weather, solar, assessment, aircraft }: ChecklistCardProps) {
  const [states, setStates] = useState<ChecklistState[]>(() => loadChecklistState());
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  useEffect(() => {
    saveChecklistState(states);
  }, [states]);

  const context = useMemo(
    () => getContextFromData(weather, solar, assessment),
    [weather, solar, assessment]
  );

  const allItems = useMemo(() => {
    const base = getDefaultChecklist();
    return getVisibleChecklistItems(base, context, aircraft);
  }, [context, aircraft]);

  const progress = useMemo(
    () => getChecklistProgress(allItems, states),
    [allItems, states]
  );

  const grouped = useMemo(() => getItemsByCategory(allItems), [allItems]);
  const warnings = useMemo(() => getWarningItems(allItems, context), [allItems, context]);

  const handleToggle = (itemId: string) => {
    setStates((prev) => toggleItem(prev, itemId));
  };

  const handleReset = () => {
    setStates(resetChecklist());
    clearChecklistState();
    setShowConfirmReset(false);
  };

  const stateMap = new Map(states.map((s) => [s.itemId, s]));

  const progressColor = progress.complete
    ? "text-emerald-400"
    : progress.percentage > 50
      ? "text-amber-400"
      : "text-slate-400";

  const barColor = progress.complete ? "bg-emerald-500" : "bg-sky-500";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span aria-hidden>{progress.complete ? "✅" : "📋"}</span>
          <span>{t.checklist.title}</span>
          {aircraft && (
            <span className="ml-auto text-xs font-normal text-slate-500">
              {aircraft.name}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <p className={`text-sm font-medium ${progressColor}`}>
            {progress.complete
              ? t.checklist.complete
              : `${progress.checked} / ${progress.total} completados`}
          </p>
          <span className="text-sm text-slate-400">{progress.percentage}%</span>
        </div>

        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${progress.percentage}%` }}
          />
        </div>

        {!progress.complete && progress.requiredRemaining > 0 && (
          <p className="text-xs text-amber-400">
            {t.checklist.requiredRemaining(progress.requiredRemaining)}
          </p>
        )}

        {warnings.length > 0 && (
          <div className="rounded-lg border border-amber-800/50 bg-amber-950/30 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-amber-400">
              Revisiones importantes
            </p>
            <div className="space-y-1">
              {warnings.map((item) => {
                const checked = stateMap.get(item.id)?.checked === true;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleToggle(item.id)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      checked
                        ? "bg-amber-950/20 text-amber-400/60"
                        : "bg-amber-950/40 text-amber-300 hover:bg-amber-900/40"
                    }`}
                    aria-checked={checked}
                    role="checkbox"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-amber-600">
                      {checked && (
                        <svg className="h-3.5 w-3.5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </span>
                    <span className={checked ? "line-through" : ""}>
                      ⚠ {item.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {CHECKLIST_CATEGORIES_ORDER.map((cat) => {
            const items = grouped.get(cat);
            if (!items || items.length === 0) return null;

            const visibleItems = items.filter((item) => {
              const isWarning = warnings.some((w) => w.id === item.id);
              return !isWarning;
            });

            if (visibleItems.length === 0) return null;

            return (
              <div key={cat}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {CATEGORY_LABELS[cat as ChecklistCategory]}
                </p>
                <div className="space-y-1">
                  {visibleItems.map((item) => {
                    const s = stateMap.get(item.id);
                    const checked = s?.checked === true;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleToggle(item.id)}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                          checked
                            ? "bg-slate-800/50 text-slate-400"
                            : "bg-slate-800 text-slate-200 hover:bg-slate-700"
                        }`}
                        aria-checked={checked}
                        role="checkbox"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded border border-slate-600">
                          {checked && (
                            <svg className="h-3.5 w-3.5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </span>
                        <span className={checked ? "line-through" : ""}>
                          {item.title}
                        </span>
                        {item.required && !checked && (
                          <span className="ml-auto text-xs text-amber-500">*</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-slate-800 pt-3">
          <p className="text-xs text-slate-500">
            {progress.complete
              ? "Checklist completada. Puedes reiniciar para un nuevo vuelo."
              : "Guardado automáticamente. Sobrevive recarga de página."}
          </p>
          {showConfirmReset ? (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowConfirmReset(false)}>
                {t.checklist.resetCancel}
              </Button>
              <Button size="sm" onClick={handleReset}>
                {t.checklist.reset}
              </Button>
            </div>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setShowConfirmReset(true)}>
              {t.checklist.reset}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
