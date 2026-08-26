import type { AircraftType } from "../assessment/aircraft";

export type ChecklistCategory =
  | "DOCUMENTACION"
  | "EQUIPO"
  | "AERONAVE"
  | "BATERIA"
  | "ENTORNO"
  | "CLIMA"
  | "OPERACION"
  | "POST_VUELO";

export interface ChecklistApplicability {
  aircraftTypes?: AircraftType[];
}

export interface ChecklistContext {
  rain?: boolean;
  lowVisibility?: boolean;
  strongWind?: boolean;
  night?: boolean;
}

export interface ChecklistItem {
  id: string;
  category: ChecklistCategory;
  title: string;
  description?: string;
  required: boolean;
  applicability?: ChecklistApplicability;
  context?: ChecklistContext;
}

export interface ChecklistState {
  itemId: string;
  checked: boolean;
  checkedAt?: string;
}

export interface ChecklistProgress {
  total: number;
  checked: number;
  remaining: number;
  requiredRemaining: number;
  percentage: number;
  complete: boolean;
}

export interface ChecklistSnapshot {
  id: string;
  states: ChecklistState[];
  updatedAt: string;
}
