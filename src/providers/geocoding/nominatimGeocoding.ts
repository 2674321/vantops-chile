import { isValidCoordinate } from "../../domain/coordinate";
import type { Coordinate } from "../../domain/coordinate";
import { ProviderError } from "../../domain/providerError";
import type { ProviderErrorKind } from "../../domain/providerError";

export class GeocodingError extends ProviderError {
  constructor(kind: ProviderErrorKind, message: string, status?: number) {
    super("Nominatim (OSM)", kind, message, status);
    this.name = "GeocodingError";
  }
}

export interface GeocodingResult extends Coordinate {
  placeId: number;
  displayName: string;
  category?: string;
  type?: string;
}

export interface GeocodingSearchOptions {
  limit?: number;
  countryCodes?: string[];
  acceptLanguage?: string;
}

export const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";

export const NOMINATIM_ATTRIBUTION =
  "Datos: © OpenStreetMap · Nominatim (OSM)";

export const NOMINATIM_POLICY_NOTE =
  "Búsqueda: 1 solicitud/segundo como máximo, solo cuando el usuario la inicia.";

const MIN_REQUEST_INTERVAL_MS = 1000;
const REQUEST_TIMEOUT_MS = 8000;

type CachedEntry = {
  promise: Promise<GeocodingResult[]>;
  createdAt: number;
};

const cache = new Map<string, CachedEntry>();
const CACHE_TTL_MS = 30 * 60_000;

let lastRequestAt = 0;
let slotChain: Promise<void> = Promise.resolve();

function acquireSlot(): Promise<void> {
  const next = slotChain.then(async () => {
    const now = Date.now();
    const wait = Math.max(
      0,
      lastRequestAt + MIN_REQUEST_INTERVAL_MS - now
    );
    if (wait > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, wait));
    }
    lastRequestAt = Date.now();
  });
  slotChain = next;
  return next;
}

export function normalizeGeocodingResponse(
  payload: unknown
): GeocodingResult[] {
  if (!Array.isArray(payload)) return [];
  const results: GeocodingResult[] = [];
  for (const raw of payload) {
    const obj = raw as Record<string, unknown>;
    const placeId = obj.place_id;
    const displayName = obj.display_name;
    const lat = Number.parseFloat(String(obj.lat));
    const lon = Number.parseFloat(String(obj.lon));
    if (
      typeof placeId !== "number" ||
      typeof displayName !== "string" ||
      !isValidCoordinate({ latitude: lat, longitude: lon })
    ) {
      continue;
    }
    results.push({
      placeId,
      displayName,
      latitude: lat,
      longitude: lon,
      category: typeof obj.category === "string" ? obj.category : undefined,
      type: typeof obj.type === "string" ? obj.type : undefined,
    });
  }
  return results;
}

export function buildGeocodingUrl(
  query: string,
  options: GeocodingSearchOptions = {}
): string {
  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    limit: String(options.limit ?? 6),
    "accept-language": options.acceptLanguage ?? "es-CL,es",
  });
  if (options.countryCodes?.length) {
    params.set("countrycodes", options.countryCodes.join(","));
  }
  return `${NOMINATIM_ENDPOINT}?${params.toString()}`;
}

function cacheKey(query: string, options: GeocodingSearchOptions): string {
  return JSON.stringify({
    query: query.trim().toLowerCase(),
    limit: options.limit ?? 6,
    countryCodes: options.countryCodes ?? ["cl"],
  });
}

export async function searchLocation(
  query: string,
  options: GeocodingSearchOptions = {}
): Promise<GeocodingResult[]> {
  const trimmed = query.trim();
  if (trimmed === "") return [];

  const key = cacheKey(trimmed, options);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) {
    return cached.promise;
  }

  const promise = (async () => {
    await acquireSlot();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const url = buildGeocodingUrl(trimmed, options);
      let res: Response;
      try {
        res = await fetch(url, { signal: controller.signal });
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          throw new GeocodingError("timeout", "Timeout al consultar Nominatim");
        }
        throw new GeocodingError("offline", "No se pudo contactar el servicio de búsqueda");
      }
      if (!res.ok) {
        throw new GeocodingError("http", `HTTP ${res.status}`, res.status);
      }
      let payload: unknown;
      try {
        payload = await res.json();
      } catch {
        throw new GeocodingError("invalid-response", "Respuesta inválida de Nominatim");
      }
      return normalizeGeocodingResponse(payload);
    } finally {
      clearTimeout(timeout);
    }
  })();

  cache.set(key, { promise, createdAt: Date.now() });
  return promise;
}

export function clearGeocodingCache(): void {
  cache.clear();
  lastRequestAt = 0;
  slotChain = Promise.resolve();
}