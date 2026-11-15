import type { FlightLimits } from "./limits";

export type AircraftType =
  | "MULTIROTOR"
  | "FIXED_WING"
  | "VTOL"
  | "HELICOPTER"
  | "OTHER";

export interface AircraftProfile {
  id: string;
  name: string;
  type?: AircraftType;
  manufacturer?: string;
  model?: string;
  windMaxKmh?: number;
  gustMaxKmh?: number;
}

export interface AircraftCatalogModel {
  id: string;
  name: string;
  type: AircraftType;
  series?: string;
}

export interface AircraftCatalogManufacturer {
  id: string;
  name: string;
  models: AircraftCatalogModel[];
  sourceUrl?: string;
}

export const AIRCRAFT_TYPE_LABELS: Record<AircraftType, string> = {
  MULTIROTOR: "Multirrotor",
  FIXED_WING: "Ala fija",
  VTOL: "VTOL",
  HELICOPTER: "Helicóptero",
  OTHER: "Otro",
};

export const AIRCRAFT_CATALOG: AircraftCatalogManufacturer[] = [
  {
    id: "dji",
    name: "DJI",
    sourceUrl: "https://www.dji.com/products/camera-drones",
    models: [
      { id: "dji-flip", name: "Flip", type: "MULTIROTOR", series: "Cámara" },
      { id: "dji-neo", name: "Neo", type: "MULTIROTOR", series: "Cámara" },
      { id: "dji-avata-2", name: "Avata 2", type: "MULTIROTOR", series: "FPV" },
      { id: "dji-fpv", name: "FPV", type: "MULTIROTOR", series: "FPV" },
      { id: "dji-mini-4k", name: "Mini 4K", type: "MULTIROTOR", series: "Mini" },
      { id: "dji-mini-2-se", name: "Mini 2 SE", type: "MULTIROTOR", series: "Mini" },
      {
        id: "dji-mini-4-pro",
        name: "Mini 4 Pro",
        type: "MULTIROTOR",
        series: "Mini",
      },
      { id: "dji-air-3s", name: "Air 3S", type: "MULTIROTOR", series: "Air" },
      {
        id: "dji-air-3",
        name: "Air 3",
        type: "MULTIROTOR",
        series: "Air",
      },
      {
        id: "dji-mavic-3-pro",
        name: "Mavic 3 Pro",
        type: "MULTIROTOR",
        series: "Mavic",
      },
      { id: "dji-mavic-3-classic", name: "Mavic 3 Classic", type: "MULTIROTOR", series: "Mavic" },
      { id: "dji-mavic-3-cine", name: "Mavic 3 Cine", type: "MULTIROTOR", series: "Mavic" },
      { id: "dji-inspire-3", name: "Inspire 3", type: "MULTIROTOR", series: "Inspire" },
      {
        id: "dji-matrice-350",
        name: "Matrice 350 RTK",
        type: "MULTIROTOR",
        series: "Enterprise",
      },
      { id: "dji-matrice-300", name: "Matrice 300 RTK", type: "MULTIROTOR", series: "Enterprise" },
      { id: "dji-matrice-3d", name: "Matrice 3D", type: "MULTIROTOR", series: "Enterprise" },
      { id: "dji-matrice-3td", name: "Matrice 3TD", type: "MULTIROTOR", series: "Enterprise" },
      {
        id: "dji-matrice-30t",
        name: "Matrice 30T",
        type: "MULTIROTOR",
        series: "Enterprise",
      },
      {
        id: "dji-mavic-3-enterprise",
        name: "Mavic 3 Enterprise",
        type: "MULTIROTOR",
        series: "Enterprise",
      },
      { id: "dji-mavic-3-thermal", name: "Mavic 3 Thermal", type: "MULTIROTOR", series: "Enterprise" },
      { id: "dji-mavic-3-multispectral", name: "Mavic 3 Multispectral", type: "MULTIROTOR", series: "Agricultura" },
      { id: "dji-p4-multispectral", name: "P4 Multispectral", type: "MULTIROTOR", series: "Agricultura" },
      {
        id: "dji-mini-3-pro",
        name: "Mini 3 Pro",
        type: "MULTIROTOR",
      },
      {
        id: "dji-mini-3",
        name: "Mini 3",
        type: "MULTIROTOR",
      },
      {
        id: "dji-air-2s",
        name: "Air 2S",
        type: "MULTIROTOR",
      },
      {
        id: "dji-mavic-2-pro",
        name: "Mavic 2 Pro",
        type: "MULTIROTOR",
      },
      {
        id: "dji-fantom-4-pro",
        name: "Phantom 4 Pro",
        type: "MULTIROTOR",
      },
      {
        id: "dji-fantom-4-rtk",
        name: "Phantom 4 RTK",
        type: "MULTIROTOR",
      },
      {
        id: "dji-inspire-2",
        name: "Inspire 2",
        type: "MULTIROTOR",
      },
    ],
  },
  {
    id: "autel",
    name: "Autel",
    sourceUrl: "https://shop.autelrobotics.com/collections/products",
    models: [
      { id: "autel-evo-nano-plus", name: "EVO Nano+", type: "MULTIROTOR", series: "EVO Nano" },
      { id: "autel-evo-lite-plus", name: "EVO Lite+", type: "MULTIROTOR", series: "EVO Lite" },
      {
        id: "autel-evo-ii-pro",
        name: "EVO II Pro",
        type: "MULTIROTOR",
      },
      {
        id: "autel-evo-ii-dual",
        name: "EVO II Dual",
        type: "MULTIROTOR",
      },
      {
        id: "autel-evo-max-4t",
        name: "EVO Max 4T",
        type: "MULTIROTOR",
      },
      { id: "autel-evo-max-4n", name: "EVO Max 4N", type: "MULTIROTOR", series: "EVO Max" },
      { id: "autel-alpha", name: "Alpha", type: "MULTIROTOR", series: "Enterprise" },
      { id: "autel-dragonfish-lite", name: "Dragonfish Lite", type: "VTOL", series: "Dragonfish" },
      { id: "autel-dragonfish-standard", name: "Dragonfish Standard", type: "VTOL", series: "Dragonfish" },
      { id: "autel-dragonfish-pro", name: "Dragonfish Pro", type: "VTOL", series: "Dragonfish" },
    ],
  },
  {
    id: "skydio",
    name: "Skydio",
    sourceUrl: "https://www.skydio.com/x10",
    models: [
      {
        id: "skydio-2-plus",
        name: "Skydio 2+",
        type: "MULTIROTOR",
      },
      {
        id: "skydio-x10",
        name: "Skydio X10",
        type: "MULTIROTOR",
      },
      { id: "skydio-x10d", name: "Skydio X10D", type: "MULTIROTOR", series: "Enterprise" },
      { id: "skydio-x2d", name: "Skydio X2D", type: "MULTIROTOR", series: "Enterprise" },
      { id: "skydio-x2e", name: "Skydio X2E", type: "MULTIROTOR", series: "Enterprise" },
    ],
  },
  {
    id: "parrot",
    name: "Parrot",
    sourceUrl: "https://www.parrot.com/en/drones",
    models: [
      {
        id: "parrot-anafi-usa",
        name: "Anafi USA",
        type: "MULTIROTOR",
      },
      {
        id: "parrot-anafi-ai",
        name: "Anafi AI",
        type: "MULTIROTOR",
      },
      { id: "parrot-anafi", name: "Anafi", type: "MULTIROTOR", series: "ANAFI" },
      { id: "parrot-anafi-fpv", name: "Anafi FPV", type: "MULTIROTOR", series: "ANAFI" },
      { id: "parrot-anafi-work", name: "Anafi Work", type: "MULTIROTOR", series: "ANAFI" },
      { id: "parrot-anafi-ukr", name: "ANAFI UKR", type: "MULTIROTOR", series: "ANAFI" },
    ],
  },
  {
    id: "sensefly",
    name: "SenseFly",
    sourceUrl: "https://ageagle.com/drones/",
    models: [
      {
        id: "sensefly-ebee-x",
        name: "eBee X",
        type: "FIXED_WING",
      },
      { id: "sensefly-ebee-vision", name: "eBee VISION", type: "FIXED_WING", series: "eBee" },
      { id: "sensefly-ebee-tac", name: "eBee TAC", type: "FIXED_WING", series: "eBee" },
      { id: "sensefly-ebee-geo", name: "eBee Geo", type: "FIXED_WING", series: "eBee" },
    ],
  },
  {
    id: "wingtra",
    name: "Wingtra",
    sourceUrl: "https://wingtra.com/wingtraone-gen-ii-drone/",
    models: [
      {
        id: "wingtra-wingtraone",
        name: "WingtraOne GEN II",
        type: "VTOL",
      },
      { id: "wingtra-ray", name: "WingtraRAY", type: "VTOL", series: "Cartografía" },
    ],
  },
  {
    id: "quantum-systems",
    name: "Quantum Systems",
    sourceUrl: "https://quantum-systems.com/",
    models: [
      {
        id: "quantum-trinity-f90",
        name: "Trinity F90+",
        type: "VTOL",
      },
      { id: "quantum-trinity-pro", name: "Trinity Pro", type: "VTOL", series: "Trinity" },
      { id: "quantum-vector", name: "Vector", type: "VTOL", series: "ISR" },
      { id: "quantum-twister", name: "Twister", type: "VTOL", series: "ISR" },
    ],
  },
  {
    id: "freefly",
    name: "Freefly Systems",
    sourceUrl: "https://freeflysystems.com/drones",
    models: [
      { id: "freefly-astro", name: "Astro", type: "MULTIROTOR", series: "Industrial" },
      { id: "freefly-alta-x", name: "Alta X", type: "MULTIROTOR", series: "Cinema / carga" },
      { id: "freefly-alta-8", name: "Alta 8", type: "MULTIROTOR", series: "Cinema / carga" },
    ],
  },
  {
    id: "generic",
    name: "Genérico",
    models: [
      {
        id: "generic-multicopter",
        name: "Multirrotor genérico",
        type: "MULTIROTOR",
      },
      {
        id: "generic-fixed-wing",
        name: "Ala fija genérica",
        type: "FIXED_WING",
      },
      {
        id: "generic-vtol",
        name: "VTOL genérico",
        type: "VTOL",
      },
      {
        id: "generic-helicopter",
        name: "Helicóptero genérico",
        type: "HELICOPTER",
      },
      {
        id: "generic-custom",
        name: "Mi aeronave (otro tipo)",
        type: "OTHER",
      },
    ],
  },
];

export function findManufacturer(manufacturerId: string): AircraftCatalogManufacturer | undefined {
  return AIRCRAFT_CATALOG.find((m) => m.id === manufacturerId);
}

export function findModel(modelId: string): AircraftCatalogModel | undefined {
  for (const mfr of AIRCRAFT_CATALOG) {
    const model = mfr.models.find((mod) => mod.id === modelId);
    if (model) return model;
  }
  return undefined;
}

export interface AircraftSearchResult {
  manufacturer: AircraftCatalogManufacturer;
  model: AircraftCatalogModel;
}

function normalizeSearch(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("es-CL").trim();
}

export function searchAircraftCatalog(query: string): AircraftSearchResult[] {
  const normalized = normalizeSearch(query);
  const terms = normalized.split(/\s+/).filter(Boolean);
  return AIRCRAFT_CATALOG.flatMap((manufacturer) => manufacturer.models
    .filter((model) => {
      if (terms.length === 0) return true;
      const haystack = normalizeSearch(`${manufacturer.name} ${model.name} ${model.series ?? ""} ${AIRCRAFT_TYPE_LABELS[model.type]}`);
      return terms.every((term) => haystack.includes(term));
    })
    .map((model) => ({ manufacturer, model })));
}

export function createAircraftProfile(
  manufacturerId: string,
  modelId: string,
  customName?: string
): AircraftProfile {
  const mfr = findManufacturer(manufacturerId);
  const model = findModel(modelId);
  return {
    id: modelId,
    name: customName ?? model?.name ?? modelId,
    type: model?.type,
    manufacturer: mfr?.name,
    model: model?.name,
  };
}

export function applyAircraftLimits(
  base: FlightLimits,
  aircraft?: AircraftProfile
): FlightLimits {
  if (!aircraft) return base;
  return {
    ...base,
    windMaxKmh: base.windMaxKmh ?? aircraft.windMaxKmh,
    gustMaxKmh: base.gustMaxKmh ?? aircraft.gustMaxKmh,
  };
}
