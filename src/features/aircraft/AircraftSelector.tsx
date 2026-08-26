import { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import {
  AIRCRAFT_CATALOG,
  AIRCRAFT_TYPE_LABELS,
  createAircraftProfile,
  findManufacturer,
  findModel,
} from "../../domain/assessment/aircraft";
import type { AircraftProfile } from "../../domain/assessment/aircraft";
import {
  loadActiveAircraft,
  saveActiveAircraft,
  loadSelectedManufacturer,
  saveSelectedManufacturer,
  loadSelectedModel,
  saveSelectedModel,
  clearAircraftSelection,
} from "../../storage/settings";

interface AircraftSelectorProps {
  onAircraftChange: (aircraft: AircraftProfile | null) => void;
}

export function AircraftSelector({ onAircraftChange }: AircraftSelectorProps) {
  const [currentAircraft, setCurrentAircraft] = useState<AircraftProfile | null>(() => loadActiveAircraft());
  const [selectedManufacturer, setSelectedManufacturer] = useState<string | null>(() => loadSelectedManufacturer());
  const [selectedModel, setSelectedModel] = useState<string | null>(() => loadSelectedModel());
  const [customName, setCustomName] = useState("");

  const manufacturer = useMemo(
    () => (selectedManufacturer ? findManufacturer(selectedManufacturer) : undefined),
    [selectedManufacturer]
  );

  const model = useMemo(
    () => (selectedModel ? findModel(selectedModel) : undefined),
    [selectedModel]
  );

  const handleManufacturerChange = (mfrId: string) => {
    setSelectedManufacturer(mfrId);
    setSelectedModel(null);
    setCustomName("");
    saveSelectedManufacturer(mfrId);
    localStorage.removeItem("vantops:selectedModel");
  };

  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    setCustomName("");
    saveSelectedModel(modelId);
  };

  const handleApply = () => {
    if (!selectedManufacturer || !selectedModel) return;
    const profile = createAircraftProfile(selectedManufacturer, selectedModel, customName || undefined);
    saveActiveAircraft(profile);
    setCurrentAircraft(profile);
    onAircraftChange(profile);
  };

  const handleClear = () => {
    clearAircraftSelection();
    setSelectedManufacturer(null);
    setSelectedModel(null);
    setCustomName("");
    setCurrentAircraft(null);
    onAircraftChange(null);
  };

  const handleUseGeneric = (modelId: string) => {
    const genericMfr = AIRCRAFT_CATALOG.find((m) => m.id === "generic");
    if (!genericMfr) return;
    const profile = createAircraftProfile("generic", modelId);
    saveActiveAircraft(profile);
    setSelectedManufacturer("generic");
    setSelectedModel(modelId);
    saveSelectedManufacturer("generic");
    saveSelectedModel(modelId);
    setCurrentAircraft(profile);
    onAircraftChange(profile);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span aria-hidden>🛩</span>
          <span>Mi aeronave</span>
          {currentAircraft && (
            <span className="ml-auto text-xs font-normal text-slate-500">
              {currentAircraft.manufacturer} {currentAircraft.model}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentAircraft && (
          <div className="rounded-lg bg-slate-800/50 p-3">
            <p className="text-sm text-slate-300">
              <span className="font-medium">{currentAircraft.name}</span>
              {currentAircraft.type && (
                <span className="ml-2 text-xs text-slate-500">
                  · {AIRCRAFT_TYPE_LABELS[currentAircraft.type]}
                </span>
              )}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label htmlFor="aircraft-manufacturer" className="mb-1 block text-xs font-medium text-slate-400">
              Fabricante
            </label>
            <select
              id="aircraft-manufacturer"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-sky-500"
              value={selectedManufacturer ?? ""}
              onChange={(e) => handleManufacturerChange(e.target.value)}
            >
              <option value="">Seleccionar fabricante…</option>
              {AIRCRAFT_CATALOG.map((mfr) => (
                <option key={mfr.id} value={mfr.id}>
                  {mfr.name}
                </option>
              ))}
            </select>
          </div>

          {manufacturer && (
            <div>
              <label htmlFor="aircraft-model" className="mb-1 block text-xs font-medium text-slate-400">
                Modelo
              </label>
              <select
                id="aircraft-model"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-sky-500"
                value={selectedModel ?? ""}
                onChange={(e) => handleModelChange(e.target.value)}
              >
                <option value="">Seleccionar modelo…</option>
                {manufacturer.models.map((mod) => (
                  <option key={mod.id} value={mod.id}>
                    {mod.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {model && (
            <div className="rounded-lg bg-slate-800/30 p-3">
              <p className="text-xs text-slate-400">
                Tipo: <span className="text-slate-300">{AIRCRAFT_TYPE_LABELS[model.type]}</span>
              </p>
            </div>
          )}

          {selectedManufacturer && selectedManufacturer !== "generic" && !model && manufacturer && (
            <div className="rounded-lg bg-slate-800/30 p-3">
              <p className="text-xs text-slate-400">
                Modelo no disponible todavía. Puedes continuar usando un perfil genérico.
              </p>
              <div className="mt-2 flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUseGeneric(`generic-${manufacturer.models[0]?.type.toLowerCase() ?? "custom"}`)}
                >
                  Usar perfil genérico
                </Button>
              </div>
            </div>
          )}

          {model && (
            <div>
              <label htmlFor="aircraft-custom-name" className="mb-1 block text-xs font-medium text-slate-400">
                Nombre personalizado (opcional)
              </label>
              <input
                id="aircraft-custom-name"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-sky-500"
                placeholder={model.name}
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {selectedManufacturer && selectedModel && (
            <Button size="sm" onClick={handleApply} className="flex-1">
              Aplicar
            </Button>
          )}
          {currentAircraft && (
            <Button size="sm" variant="ghost" onClick={handleClear}>
              Limpiar
            </Button>
          )}
        </div>

        <p className="text-xs text-slate-500">
          La checklist se adapta según el tipo de aeronave seleccionada.
        </p>
      </CardContent>
    </Card>
  );
}
