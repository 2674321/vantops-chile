import { useEffect, useMemo, useState } from "react";
import { ChevronRight, Search } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import {
  AIRCRAFT_CATALOG,
  AIRCRAFT_TYPE_LABELS,
  createAircraftProfile,
  findManufacturer,
  findModel,
  searchAircraftCatalog,
  type AircraftCatalogModel,
  type AircraftProfile,
  type AircraftType,
} from "../../domain/assessment/aircraft";
import { useToast } from "../../components/toast/useToast";
import { esCL as t } from "../../i18n/es-CL";
import {
  clearAircraftSelection,
  loadActiveAircraft,
  loadSelectedManufacturer,
  loadSelectedModel,
  saveActiveAircraft,
  saveSelectedManufacturer,
  saveSelectedModel,
} from "../../storage/settings";

interface AircraftSelectorProps {
  onAircraftChange: (aircraft: AircraftProfile | null) => void;
}

const TYPE_ORDER: AircraftType[] = ["MULTIROTOR", "VTOL", "FIXED_WING", "HELICOPTER", "OTHER"];

export function AircraftSelector({ onAircraftChange }: AircraftSelectorProps) {
  const toast = useToast();
  const [currentAircraft, setCurrentAircraft] = useState<AircraftProfile | null>(null);
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | null>(() => loadSelectedManufacturer());
  const [selectedModel, setSelectedModel] = useState<string | null>(() => loadSelectedModel());
  const [customName, setCustomName] = useState("");
  const [query, setQuery] = useState("");
  const [confirmAction, setConfirmAction] = useState<"apply" | "clear" | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadActiveAircraft().then((aircraft) => {
      setCurrentAircraft(aircraft);
      if (aircraft) onAircraftChange(aircraft);
    });
  }, [onAircraftChange]);

  const manufacturer = useMemo(() => selectedManufacturer ? findManufacturer(selectedManufacturer) : undefined, [selectedManufacturer]);
  const model = useMemo(() => selectedModel ? findModel(selectedModel) : undefined, [selectedModel]);
  const results = useMemo(() => searchAircraftCatalog(query), [query]);
  const totalModels = useMemo(() => AIRCRAFT_CATALOG.reduce((total, item) => total + item.models.length, 0), []);

  function selectModel(manufacturerId: string, nextModel: AircraftCatalogModel) {
    setSelectedManufacturer(manufacturerId);
    setSelectedModel(nextModel.id);
    setCustomName("");
    setConfirmAction(null);
    saveSelectedManufacturer(manufacturerId);
    saveSelectedModel(nextModel.id);
  }

  async function applyAircraft() {
    if (!selectedManufacturer || !selectedModel) return;
    const profile = createAircraftProfile(selectedManufacturer, selectedModel, customName || undefined);
    setBusy(true);
    try {
      await saveActiveAircraft(profile);
      setCurrentAircraft(profile);
      onAircraftChange(profile);
      toast.success(t.feedback.aircraftApplied);
    } catch {
      toast.error(t.feedback.aircraftError);
    } finally {
      setBusy(false);
    }
  }

  async function clearAircraft() {
    setBusy(true);
    try {
      await clearAircraftSelection();
      setSelectedManufacturer(null);
      setSelectedModel(null);
      setCustomName("");
      setCurrentAircraft(null);
      onAircraftChange(null);
      toast.success(t.feedback.aircraftCleared);
    } catch {
      toast.error(t.feedback.aircraftError);
    } finally {
      setBusy(false);
    }
  }

  function confirmPending() {
    const action = confirmAction;
    setConfirmAction(null);
    if (action === "apply") void applyAircraft();
    else if (action === "clear") void clearAircraft();
  }

  function modelButton(manufacturerId: string, item: AircraftCatalogModel) {
    const selected = selectedModel === item.id;
    return (
      <button
        key={item.id}
        type="button"
        aria-pressed={selected}
        onClick={() => selectModel(manufacturerId, item)}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${selected ? "border-sky-500 bg-sky-950/50 text-sky-100" : "border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-600"}`}
      >
        <span>{item.name}</span>
        <span className="text-[11px] text-slate-500">{item.series ?? AIRCRAFT_TYPE_LABELS[item.type]}</span>
      </button>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span aria-hidden>🛩</span>
          <span>Mi aeronave</span>
          {currentAircraft && <span className="ml-auto text-xs font-normal text-slate-500">{currentAircraft.manufacturer} {currentAircraft.model}</span>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentAircraft && (
          <div className="rounded-lg bg-slate-800/50 p-3 text-sm text-slate-300">
            <span className="font-medium">{currentAircraft.name}</span>
            {currentAircraft.type && <span className="ml-2 text-xs text-slate-500">· {AIRCRAFT_TYPE_LABELS[currentAircraft.type]}</span>}
          </div>
        )}

        <div>
          <label htmlFor="aircraft-search" className="mb-1 block text-xs font-medium text-slate-400">Buscar fabricante o modelo</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" aria-hidden />
            <input id="aircraft-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ej. Mavic 3, VTOL, Wingtra…" className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-slate-200 outline-none focus:border-sky-500" />
          </div>
          <p className="mt-1 text-[11px] text-slate-500">{query.trim() ? `${results.length} coincidencias` : `${totalModels} modelos · ${AIRCRAFT_CATALOG.length - 1} fabricantes + perfiles genéricos`}</p>
        </div>

        {query.trim() ? (
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1" aria-label="Resultados de aeronaves">
            {results.map(({ manufacturer: resultManufacturer, model: resultModel }) => (
              <div key={resultModel.id}>
                <p className="mb-1 text-[11px] font-medium text-slate-500">{resultManufacturer.name}</p>
                {modelButton(resultManufacturer.id, resultModel)}
              </div>
            ))}
            {results.length === 0 && <p className="rounded-lg border border-slate-800 p-3 text-sm text-slate-400">No hay coincidencias. Usa un perfil genérico o prueba menos palabras.</p>}
          </div>
        ) : (
          <div className="space-y-2" aria-label="Catálogo de aeronaves por fabricante">
            {AIRCRAFT_CATALOG.map((item) => (
              <details key={item.id} className="group rounded-lg border border-slate-800 bg-slate-950/40" open={item.id === selectedManufacturer || undefined}>
                <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500">
                  <ChevronRight className="h-4 w-4 text-slate-500 transition-transform group-open:rotate-90" aria-hidden />
                  <span className="flex-1">{item.name}</span>
                  <span className="text-xs font-normal text-slate-500">{item.models.length}</span>
                </summary>
                <div className="space-y-3 border-t border-slate-800 px-3 py-3">
                  {TYPE_ORDER.map((type) => {
                    const models = item.models.filter((candidate) => candidate.type === type);
                    if (models.length === 0) return null;
                    return <section key={type}><h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">{AIRCRAFT_TYPE_LABELS[type]}</h4><div className="space-y-1.5">{models.map((candidate) => modelButton(item.id, candidate))}</div></section>;
                  })}
                  {item.sourceUrl && <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="inline-block text-xs text-sky-400 hover:text-sky-300">Ver catálogo oficial</a>}
                </div>
              </details>
            ))}
          </div>
        )}

        {model && (
          <div className="space-y-3 rounded-lg border border-sky-900/50 bg-sky-950/20 p-3">
            <p className="text-sm text-slate-200"><strong>{manufacturer?.name}</strong> {model.name} <span className="text-xs text-slate-500">· {AIRCRAFT_TYPE_LABELS[model.type]}</span></p>
            <label htmlFor="aircraft-custom-name" className="block text-xs font-medium text-slate-400">Nombre personalizado (opcional)</label>
            <input id="aircraft-custom-name" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-sky-500" placeholder={model.name} value={customName} onChange={(event) => setCustomName(event.target.value)} />
          </div>
        )}

        <div className="flex gap-2">
          {selectedManufacturer && selectedModel && <Button size="sm" onClick={() => currentAircraft ? setConfirmAction("apply") : void applyAircraft()} className="flex-1" disabled={busy}>{busy ? t.feedback.saving : t.aircraft.apply}</Button>}
          {currentAircraft && <Button size="sm" variant="ghost" onClick={() => setConfirmAction("clear")} disabled={busy}>{t.aircraft.clear}</Button>}
        </div>

        {confirmAction && (
          <div className="rounded-lg border border-amber-800/50 bg-amber-950/20 p-3">
            <p className="mb-2 text-sm text-amber-200">{confirmAction === "apply" ? t.aircraft.replaceConfirm : t.aircraft.clearConfirm}</p>
            <div className="flex gap-2"><Button size="sm" onClick={confirmPending} disabled={busy}>{busy ? t.feedback.saving : t.aircraft.confirm}</Button><Button size="sm" variant="outline" onClick={() => setConfirmAction(null)} disabled={busy}>{t.aircraft.cancel}</Button></div>
          </div>
        )}

        <p className="text-xs text-slate-500">La checklist se adapta al tipo de aeronave. El catálogo ayuda a identificar el equipo, pero no sustituye su manual.</p>
      </CardContent>
    </Card>
  );
}
