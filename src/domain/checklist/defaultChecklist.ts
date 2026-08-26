import type { ChecklistItem, ChecklistCategory } from "./types";
import type { AircraftType } from "../assessment/aircraft";

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  {
    id: "doc-revisados",
    category: "DOCUMENTACION",
    title: "Revisar requisitos aplicables",
    description: "Verificar documentación y permisos necesarios para la operación",
    required: true,
  },
  {
    id: "doc-plan-vuelo",
    category: "DOCUMENTACION",
    title: "Plan de vuelo definido",
    description: "Ruta, altitud, zona y objetivos establecidos",
    required: true,
  },
  {
    id: "equ-control",
    category: "EQUIPO",
    title: "Control remoto disponible",
    required: true,
  },
  {
    id: "equ-dispositivo",
    category: "EQUIPO",
    title: "Teléfono o dispositivo disponible",
    required: true,
  },
  {
    id: "equ-sd",
    category: "EQUIPO",
    title: "Tarjeta SD disponible",
    required: false,
  },
  {
    id: "aero-helices",
    category: "AERONAVE",
    title: "Hélices revisadas",
    required: true,
    applicability: { aircraftTypes: ["MULTIROTOR", "HELICOPTER"] },
  },
  {
    id: "aero-motores",
    category: "AERONAVE",
    title: "Motores revisados",
    required: true,
    applicability: { aircraftTypes: ["MULTIROTOR"] },
  },
  {
    id: "aero-estructura",
    category: "AERONAVE",
    title: "Estructura revisada",
    required: true,
  },
  {
    id: "aero-gnss",
    category: "AERONAVE",
    title: "GNSS/GPS disponible",
    required: true,
  },
  {
    id: "aero-rth",
    category: "AERONAVE",
    title: "RTH configurado",
    required: true,
    applicability: { aircraftTypes: ["MULTIROTOR"] },
  },
  {
    id: "aero-superficies",
    category: "AERONAVE",
    title: "Superficies de control revisadas",
    required: true,
    applicability: { aircraftTypes: ["FIXED_WING", "VTOL"] },
  },
  {
    id: "aero-propulsion",
    category: "AERONAVE",
    title: "Propulsión revisada",
    required: true,
    applicability: { aircraftTypes: ["FIXED_WING"] },
  },
  {
    id: "aero-lanzamiento",
    category: "AERONAVE",
    title: "Sistema de lanzamiento preparado",
    required: true,
    applicability: { aircraftTypes: ["FIXED_WING"] },
  },
  {
    id: "aero-recuperacion",
    category: "AERONAVE",
    title: "Sistema de recuperación preparado",
    required: true,
    applicability: { aircraftTypes: ["FIXED_WING"] },
  },
  {
    id: "aero-vertical",
    category: "AERONAVE",
    title: "Sistema de vuelo vertical revisado",
    required: true,
    applicability: { aircraftTypes: ["VTOL"] },
  },
  {
    id: "aero-transicion",
    category: "AERONAVE",
    title: "Transición vertical/crucero verificada",
    required: true,
    applicability: { aircraftTypes: ["VTOL"] },
  },
  {
    id: "aero-rotor",
    category: "AERONAVE",
    title: "Rotor principal revisado",
    required: true,
    applicability: { aircraftTypes: ["HELICOPTER"] },
  },
  {
    id: "aero-colaptil",
    category: "AERONAVE",
    title: "Colaptil revisado",
    required: true,
    applicability: { aircraftTypes: ["HELICOPTER"] },
  },
  {
    id: "bat-cargada",
    category: "BATERIA",
    title: "Batería cargada",
    required: true,
  },
  {
    id: "bat-instalada",
    category: "BATERIA",
    title: "Batería instalada correctamente",
    required: true,
  },
  {
    id: "ent-zona",
    category: "ENTORNO",
    title: "Zona de vuelo revisada",
    required: true,
  },
  {
    id: "ent-obstaculos",
    category: "ENTORNO",
    title: "Obstáculos identificados",
    required: true,
  },
  {
    id: "ent-personas",
    category: "ENTORNO",
    title: "Personas y terceros considerados",
    required: true,
  },
  {
    id: "cli-pronostico",
    category: "CLIMA",
    title: "Pronóstico revisado",
    required: true,
  },
  {
    id: "cli-viento",
    category: "CLIMA",
    title: "Condiciones de viento revisadas",
    required: true,
  },
  {
    id: "cli-visibilidad",
    category: "CLIMA",
    title: "Visibilidad revisada",
    required: true,
  },
  {
    id: "op-ubicacion",
    category: "OPERACION",
    title: "Ubicación confirmada",
    required: true,
  },
  {
    id: "op-limites",
    category: "OPERACION",
    title: "Límites personales revisados",
    required: true,
  },
  {
    id: "post-inspeccion",
    category: "POST_VUELO",
    title: "Aeronave inspeccionada post-vuelo",
    required: false,
  },
  {
    id: "post-baterias",
    category: "POST_VUELO",
    title: "Baterías registradas",
    required: false,
  },
  {
    id: "post-observaciones",
    category: "POST_VUELO",
    title: "Observaciones registradas",
    required: false,
  },
];

export const CHECKLIST_CATEGORIES_ORDER: ChecklistCategory[] = [
  "DOCUMENTACION",
  "EQUIPO",
  "AERONAVE",
  "BATERIA",
  "ENTORNO",
  "CLIMA",
  "OPERACION",
  "POST_VUELO",
];

export const CATEGORY_LABELS: Record<ChecklistCategory, string> = {
  DOCUMENTACION: "Documentación",
  EQUIPO: "Equipo",
  AERONAVE: "Aeronave",
  BATERIA: "Batería",
  ENTORNO: "Entorno",
  CLIMA: "Clima",
  OPERACION: "Operación",
  POST_VUELO: "Post-vuelo",
};

export const CONTEXTUAL_ITEMS: ChecklistItem[] = [
  {
    id: "cli-precipitacion",
    category: "CLIMA",
    title: "Revisar condiciones de precipitación",
    required: true,
    context: { rain: true },
  },
  {
    id: "cli-rafagas",
    category: "CLIMA",
    title: "Revisar ráfagas",
    required: true,
    context: { strongWind: true },
  },
  {
    id: "cli-noche",
    category: "OPERACION",
    title: "Revisar requisitos para operación nocturna",
    required: true,
    context: { night: true },
  },
  {
    id: "cli-visibilidad-baja",
    category: "CLIMA",
    title: "Revisar condiciones de visibilidad reducida",
    required: true,
    context: { lowVisibility: true },
  },
];

export function isApplicable(
  item: ChecklistItem,
  aircraftType?: AircraftType
): boolean {
  if (!item.applicability) return true;
  if (!item.applicability.aircraftTypes) return true;
  if (!aircraftType) return true;
  return item.applicability.aircraftTypes.includes(aircraftType);
}
