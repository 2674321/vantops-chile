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
}

export interface AircraftCatalogManufacturer {
  id: string;
  name: string;
  models: AircraftCatalogModel[];
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
    models: [
      {
        id: "dji-mini-4-pro",
        name: "Mini 4 Pro",
        type: "MULTIROTOR",
      },
      {
        id: "dji-air-3",
        name: "Air 3",
        type: "MULTIROTOR",
      },
      {
        id: "dji-mavic-3-pro",
        name: "Mavic 3 Pro",
        type: "MULTIROTOR",
      },
      {
        id: "dji-matrice-350",
        name: "Matrice 350 RTK",
        type: "MULTIROTOR",
      },
      {
        id: "dji-matrice-30t",
        name: "Matrice 30T",
        type: "MULTIROTOR",
      },
      {
        id: "dji-mavic-3-enterprise",
        name: "Mavic 3 Enterprise",
        type: "MULTIROTOR",
      },
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
    models: [
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
    ],
  },
  {
    id: "skydio",
    name: "Skydio",
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
    ],
  },
  {
    id: "parrot",
    name: "Parrot",
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
    ],
  },
  {
    id: "sensefly",
    name: "SenseFly",
    models: [
      {
        id: "sensefly-ebee-x",
        name: "eBee X",
        type: "FIXED_WING",
      },
    ],
  },
  {
    id: "wingtra",
    name: "Wingtra",
    models: [
      {
        id: "wingtra-wingtraone",
        name: "WingtraOne",
        type: "VTOL",
      },
    ],
  },
  {
    id: "quantum-systems",
    name: "Quantum Systems",
    models: [
      {
        id: "quantum-trinity-f90",
        name: "Trinity F90+",
        type: "VTOL",
      },
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
