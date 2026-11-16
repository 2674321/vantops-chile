export type BasemapId = "osm-standard" | "open-topo" | "satellite";
export type BasemapKind = "street" | "terrain" | "imagery";

export interface BasemapDescriptor {
  id: BasemapId;
  name: string;
  kind: BasemapKind;
  provider: string;
  url: string | null;
  attribution: string;
  maxZoom: number;
  enabled: boolean;
  disabledReason?: string;
  reviewedAt: string;
}

export const DEFAULT_BASEMAP_ID: BasemapId = "osm-standard";

export const BASEMAP_CATALOG: readonly BasemapDescriptor[] = [
  {
    id: "osm-standard",
    name: "Calles",
    kind: "street",
    provider: "OpenStreetMap",
    url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    enabled: true,
    reviewedAt: "2026-11-16",
  },
  {
    id: "open-topo",
    name: "Topográfico",
    kind: "terrain",
    provider: "OpenTopoMap",
    url: "https://tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution:
      'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, style &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
    maxZoom: 17,
    enabled: true,
    reviewedAt: "2026-11-16",
  },
  {
    id: "satellite",
    name: "Satélite",
    kind: "imagery",
    provider: "No configurado",
    url: null,
    attribution: "",
    maxZoom: 0,
    enabled: false,
    disabledReason: "Requiere un proveedor y una credencial autorizados para esta PWA pública.",
    reviewedAt: "2026-11-16",
  },
] as const;

export function isBasemapId(value: unknown): value is BasemapId {
  return BASEMAP_CATALOG.some((item) => item.id === value);
}

export function resolveBasemap(
  preferred: BasemapId,
  catalog: readonly BasemapDescriptor[] = BASEMAP_CATALOG,
): BasemapDescriptor {
  const selected = catalog.find((item) => item.id === preferred && item.enabled && item.url);
  const fallback = catalog.find(
    (item) => item.id === DEFAULT_BASEMAP_ID && item.enabled && item.url,
  );
  if (!selected && !fallback) throw new Error("No hay mapas base disponibles");
  return (selected ?? fallback) as BasemapDescriptor;
}
