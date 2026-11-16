export type LocationPickIntent = "none" | "plan-new" | "flight-new" | "dashboard";
const INTENTS = new Set<LocationPickIntent>(["none", "plan-new", "flight-new", "dashboard"]);
export function parseMapPickIntent(raw: string | null): LocationPickIntent { return raw && INTENTS.has(raw as LocationPickIntent) ? raw as LocationPickIntent : "none"; }
export function destinationForPick(intent: LocationPickIntent): string | null { return intent === "plan-new" ? "/operacion/nueva" : intent === "flight-new" ? "/bitacora/nuevo" : intent === "dashboard" ? "/" : null; }
export function mapPickerPath(intent: LocationPickIntent): string { return intent === "none" ? "/utilidades/mapa" : `/utilidades/mapa?pickFor=${intent}`; }
