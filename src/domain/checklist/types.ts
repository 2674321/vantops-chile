import type { AircraftType } from "../assessment/aircraft";

export type ChecklistCategory =
  | "NORMATIVA"
  | "DOCUMENTACION"
  | "AERONAVE"
  | "BATERIA"
  | "ENTORNO"
  | "CLIMA"
  | "OPERACION"
  | "SEGURIDAD"
  | "POST_VUELO";

export type ChecklistKind =
  | "REGULATORY"
  | "OPERATIONAL"
  | "GOOD_PRACTICE";

export interface RegulatoryReference {
  document: string;
  section?: string;
  edition?: string;
  sourceUrl: string;
  status: "verified" | "needs-review" | "historical";
}

export interface ChecklistApplicability {
  aircraftTypes?: AircraftType[];
}

export interface ChecklistContext {
  rain?: boolean;
  lowVisibility?: boolean;
  strongWind?: boolean;
  night?: boolean;
  populatedArea?: boolean;
}

export interface ChecklistItem {
  id: string;
  category: ChecklistCategory;
  kind: ChecklistKind;
  title: string;
  description?: string;
  comment?: string;
  required: boolean;
  applicability?: ChecklistApplicability;
  context?: ChecklistContext;
  regulatoryReference?: RegulatoryReference;
  ifisUrl?: string;
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
