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
import { CHECKLIST_CATEGORIES_ORDER, CATEGORY_LABELS, CHECKLIST_KIND_LABELS } from "../../domain/checklist/defaultChecklist";
import { loadChecklistState, saveChecklistState, clearChecklistState } from "../../storage/checklists";
import type { ChecklistState, ChecklistCategory, ChecklistKind, ChecklistItem } from "../../domain/checklist/types";
import type { WeatherSnapshot } from "../../domain/weather";
import type { SolarTimes } from "../../domain/solar";
import type { FlightAssessment } from "../../domain/assessment/types";
import type { AircraftProfile } from "../../domain/assessment/aircraft";
import { esCL as t } from "../../i18n/es-CL";

const IFIS_BASE = "https://aipchile.dgac.gob.cl";

function ifisUrl(icao?: string): string {
  return icao ? `${IFIS_BASE}/metar/${icao}` : IFIS_BASE;
}

interface ChecklistCardProps {
  weather: WeatherSnapshot | null;
  solar: SolarTimes | null;
  assessment: FlightAssessment | null;
  aircraft: AircraftProfile | null;
  stationIcao?: string;
}

function kindBadgeClass(kind: ChecklistKind): string {
  switch (kind) {
    case "REGULATORY":
      return "bg-sky-950/40 text-sky-400 border border-sky-800/50";
    case "OPERATIONAL":
      return "bg-slate-800 text-slate-400 border border-slate-700";
    case "GOOD_PRACTICE":
      return "bg-emerald-950/40 text-emerald-400 border border-emerald-800/50";
  }
}

function ReferencePanel({ item, onClose, stationIcao }: { item: ChecklistItem; onClose: () => void; stationIcao?: string }) {
  const ref = item.regulatoryReference;
  const hasIfis = item.id === "norm-metar";
  return (
    <div className="mx-1 mb-2 rounded-lg border border-slate-700/50 bg-slate-800/70 p-3 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sky-400">{t.checklist.regulatoryReference}</span>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-500 hover:text-slate-300"
          aria-label="Cerrar"
        >
          ×
        </button>
      </div>
      {item.comment && (
        <div className="mt-2">
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">{t.checklist.comment}</p>
          <p className="text-slate-300">{item.comment}</p>
        </div>
      )}
      {ref && (
        <div className="mt-2">
          <p className="text-slate-400">
            {ref.document}
            {ref.section && ` · ${ref.section}`}
            {ref.edition && ` (${ref.edition})`}
          </p>
        </div>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        {ref && (
          <a
            href={ref.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-sky-500 hover:text-sky-400"
          >
            {t.checklist.openSource}
          </a>
        )}
        {hasIfis && (
          <a
            href={ifisUrl(stationIcao)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-emerald-500 hover:text-emerald-400"
          >
            {t.checklist.openIfis}
          </a>
        )}
      </div>
    </div>
  );
}

export function ChecklistCard({ weather, solar, assessment, aircraft, stationIcao }: ChecklistCardProps) {
  const [states, setStates] = useState<ChecklistState[]>(() => loadChecklistState());
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [expandedRef, setExpandedRef] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<ChecklistCategory>>(new Set());
  const [showOnlyPending, setShowOnlyPending] = useState(false);
  const [warningsExpanded, setWarningsExpanded] = useState(false);

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

  const stateMap = useMemo(() => new Map(states.map((s) => [s.itemId, s])), [states]);

  const toggleCategory = (cat: ChecklistCategory) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const handleToggle = (itemId: string) => {
    setStates((prev) => toggleItem(prev, itemId));
  };

  const handleReset = () => {
    setStates(resetChecklist());
    clearChecklistState();
    setShowConfirmReset(false);
  };

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
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <p className={`text-sm font-medium ${progressColor}`}>
            {progress.complete
              ? progress.requiredRemaining === 0
                ? t.checklist.completeRequired
                : t.checklist.complete
              : `${progress.checked} / ${progress.total}`}
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
          <div className="rounded-lg border border-amber-800/50 bg-amber-950/30">
            <button
              type="button"
              onClick={() => setWarningsExpanded(!warningsExpanded)}
              className="flex w-full items-center justify-between px-3 py-2 text-left"
              aria-expanded={warningsExpanded}
            >
              <span className="text-xs font-semibold uppercase tracking-wide text-amber-400">
                ⚠ {t.checklist.warningsCount(warnings.length)}
              </span>
              <span className="text-xs text-amber-500">{warningsExpanded ? "▾" : "▸"}</span>
            </button>
            {warningsExpanded && (
              <div className="space-y-1 px-3 pb-3">
                {warnings.map((item) => {
                  const checked = stateMap.get(item.id)?.checked === true;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        const cat = item.category as ChecklistCategory;
                        setExpandedCategories((prev) => new Set([...prev, cat]));
                        handleToggle(item.id);
                      }}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        checked
                          ? "bg-amber-950/20 text-amber-400/60 line-through"
                          : "bg-amber-950/40 text-amber-300 hover:bg-amber-900/40"
                      }`}
                      aria-checked={checked}
                      // biome-ignore lint/a11y/useSemanticElements: button with aria-checked for custom styled checkbox
                      role="checkbox"
                    >
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-amber-600">
                        {checked && (
                          <svg className="h-3 w-3 text-amber-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </span>
                      {item.title}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          {CHECKLIST_CATEGORIES_ORDER.map((cat) => {
            const items = grouped.get(cat);
            if (!items || items.length === 0) return null;

            const visibleItems = items.filter((item) => {
              const isWarning = warnings.some((w) => w.id === item.id);
              return !isWarning;
            });

            if (visibleItems.length === 0) return null;

            const checkedCount = visibleItems.filter((i) => stateMap.get(i.id)?.checked === true).length;
            const hasVisibleWarnings = visibleItems.some((i) => i.regulatoryReference);
            const isExpanded = expandedCategories.has(cat as ChecklistCategory);

            const filteredItems = showOnlyPending
              ? visibleItems.filter((i) => stateMap.get(i.id)?.checked !== true)
              : visibleItems;

            return (
              <div key={cat} className="rounded-lg border border-slate-800/50">
                <button
                  type="button"
                  onClick={() => toggleCategory(cat as ChecklistCategory)}
                  className="flex w-full items-center justify-between px-3 py-2.5 text-left"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">{isExpanded ? "▾" : "▸"}</span>
                    <span className="text-sm font-medium text-slate-200">
                      {CATEGORY_LABELS[cat as ChecklistCategory]}
                    </span>
                    {hasVisibleWarnings && (
                      <span className="text-[10px] text-amber-500">⚠</span>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    {checkedCount} / {visibleItems.length}
                  </span>
                </button>

                {isExpanded && (
                  <div className="border-t border-slate-800/50 px-2 py-1">
                    {filteredItems.length === 0 ? (
                      <p className="px-2 py-2 text-xs text-slate-500">
                        {showOnlyPending ? "Todos completados" : "Sin items"}
                      </p>
                    ) : (
                      filteredItems.map((item) => {
                        const s = stateMap.get(item.id);
                        const checked = s?.checked === true;
                        const refOpen = expandedRef === item.id;
                        return (
                          <div key={item.id}>
                            <div className="flex items-center gap-2 rounded-md px-2 py-1.5">
                              <button
                                type="button"
                                onClick={() => handleToggle(item.id)}
                                className="flex items-center gap-2 text-left"
                                aria-checked={checked}
                                // biome-ignore lint/a11y/useSemanticElements: button with aria-checked for custom styled checkbox
                                role="checkbox"
                              >
                                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-slate-600">
                                  {checked && (
                                    <svg className="h-3 w-3 text-emerald-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </span>
                                <span className={`text-sm ${checked ? "line-through text-slate-500" : "text-slate-200"}`}>
                                  {item.title}
                                </span>
                              </button>
                              {item.required && !checked && (
                                <span className="text-[10px] text-amber-500">*</span>
                              )}
                              {item.kind && (
                                <span className={`ml-auto shrink-0 rounded px-1 py-0.5 text-[10px] font-medium ${kindBadgeClass(item.kind)}`}>
                                  {CHECKLIST_KIND_LABELS[item.kind]}
                                </span>
                              )}
                              {item.regulatoryReference && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedRef(refOpen ? null : item.id)}
                                  className="shrink-0 text-sky-500 hover:text-sky-400"
                                  aria-label={t.checklist.regulatoryReference}
                                  aria-expanded={refOpen}
                                >
                                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              )}
                            </div>
                            {refOpen && item.regulatoryReference && (
                              <ReferencePanel
                                item={item}
                                onClose={() => setExpandedRef(null)}
                                stationIcao={stationIcao}
                              />
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-slate-800 pt-3">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={showOnlyPending ? "default" : "ghost"}
              onClick={() => setShowOnlyPending(!showOnlyPending)}
              className="text-xs"
            >
              {showOnlyPending ? t.checklist.allItems : t.checklist.onlyPending}
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-600">{t.checklist.autoSaved}</span>
            {showConfirmReset ? (
              <div className="flex gap-1">
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
        </div>
      </CardContent>
    </Card>
  );
}
