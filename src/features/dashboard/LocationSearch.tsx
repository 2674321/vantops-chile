import { useState } from "react";
import { Button } from "../../components/ui/button";
import { searchLocation } from "../../providers/geocoding/nominatimGeocoding";
import type { GeocodingResult } from "../../providers/geocoding/nominatimGeocoding";
import { NOMINATIM_ATTRIBUTION } from "../../providers/geocoding/nominatimGeocoding";
import type { Coordinate } from "../../domain/coordinate";

interface LocationSearchProps {
  onSelect: (coordinate: Coordinate) => void;
}

export function LocationSearch({ onSelect }: LocationSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [executed, setExecuted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResults([]);
    const trimmed = query.trim();
    if (trimmed === "") {
      setError("Ingresa una dirección, localidad o lugar para buscar.");
      return;
    }
    setSearching(true);
    try {
      const found = await searchLocation(trimmed);
      setResults(found);
      setExecuted(true);
      if (found.length === 0) {
        setError("Sin resultados. Usa coordenadas manuales o el mapa.");
      }
    } catch (err) {
      setError(
        err instanceof Error && err.name === "AbortError"
          ? "La búsqueda tardó demasiado. Revisa tu conexión e intenta nuevamente."
          : "No se pudo buscar la ubicación. Verifica tu conexión."
      );
    } finally {
      setSearching(false);
    }
  };

  return (
    <form
      className="mb-4 space-y-2 rounded-lg border border-slate-700 bg-slate-900/40 p-3"
      onSubmit={handleSubmit}
    >
      <label htmlFor="location-search" className="mb-1 block text-xs font-medium text-slate-400">
        Buscar dirección, localidad o lugar
      </label>
      <div className="flex gap-2">
        <input
          id="location-search"
          type="search"
          autoComplete="off"
          className="h-11 min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 text-base outline-none focus:border-sky-500"
          placeholder="Totoralillo, Coquimbo"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setError(null);
          }}
        />
        <Button type="submit" variant="outline" disabled={searching} className="shrink-0">
          {searching ? "Buscando…" : "Buscar"}
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-amber-300">
          {error}
        </p>
      )}

      {results.length > 0 && (
        <ul className="space-y-1" aria-label="Resultados de búsqueda">
          {results.map((result) => (
            <li key={result.placeId}>
              <button
                type="button"
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-left text-sm text-slate-300 hover:border-sky-600 hover:text-sky-300"
                onClick={() => {
                  onSelect({ latitude: result.latitude, longitude: result.longitude });
                  setQuery("");
                  setResults([]);
                  setExecuted(false);
                }}
              >
                {result.displayName}
              </button>
            </li>
          ))}
        </ul>
      )}

      {executed && results.length === 0 && !error && (
        <p className="text-xs text-slate-500">Sin resultados para mostrar.</p>
      )}

      <p className="text-[11px] text-slate-600">{NOMINATIM_ATTRIBUTION}</p>
    </form>
  );
}
