import type { ChecklistItem, ChecklistCategory } from "./types";
import type { AircraftType } from "../assessment/aircraft";

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  // ── NORMATIVA ──
  {
    id: "norm-credencial",
    category: "NORMATIVA",
    title: "Credencial de operador vigente",
    description: "Credencial de piloto RPAS emitida por DGAC (DAN 91)",
    required: true,
  },
  {
    id: "norm-seguro",
    category: "NORMATIVA",
    title: "Seguro de responsabilidad civil",
    description: "Seguro vigente que cubra la operación (DAN 91)",
    required: true,
  },
  {
    id: "norm-autorizacion",
    category: "NORMATIVA",
    title: "Autorización de vuelo obtainida",
    description: "Plan de vuelo aprobado por autoridad competente (DAN 91)",
    required: true,
  },
  {
    id: "norm-metar",
    category: "NORMATIVA",
    title: "METAR e IFIS revisados",
    description: "Consultar fuentes meteorológicas oficiales (METAR/IFIS) antes del vuelo",
    required: true,
  },
  {
    id: "norm-airspace",
    category: "NORMATIVA",
    title: "Espacio aéreo verificado",
    description: "Confirmar que la zona no requiere autorización especial del espacio aéreo",
    required: true,
  },
  {
    id: "norm-populated",
    category: "NORMATIVA",
    title: "Verificar requisitos para zona poblada",
    description: "Si opera sobre área poblada: aplica DAN 91. Requiere autorización DGAC + credencial",
    required: true,
    context: { populatedArea: true },
  },

  // ── DOCUMENTACION ──
  {
    id: "doc-plan-vuelo",
    category: "DOCUMENTACION",
    title: "Plan de vuelo definido",
    description: "Ruta, altitud (max 400 ft AGL), zona y objetivos establecidos",
    required: true,
  },
  {
    id: "doc-limites",
    category: "DOCUMENTACION",
    title: "Límites de vuelo configurados",
    description: "Altitud máxima, distancia y tiempo de vuelo establecidos",
    required: true,
  },

  // ── AERONAVE ──
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

  // ── BATERIA ──
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

  // ── ENTORNO ──
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
    id: "ent-populated",
    category: "ENTORNO",
    title: "Zona poblada: verificar autorización",
    description: "DAN 151: operaciones sobre áreas pobladas requieren autorización específica de DGAC",
    required: true,
    context: { populatedArea: true },
  },

  // ── CLIMA ──
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

  // ── OPERACION ──
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
    id: "op-noche",
    category: "OPERACION",
    title: "Requisitos nocturnos verificados",
    description: "DAN 91: operaciones nocturnas requieren autorización y equipamiento específico",
    required: true,
    context: { night: true },
  },

  // ── SEGURIDAD ──
  {
    id: "seg-emergencia",
    category: "SEGURIDAD",
    title: "Plan de emergencia definido",
    description: "Procedimientos de emergencia y zonas de aterrizaje alternativas",
    required: true,
  },
  {
    id: "seg-coordinacion",
    category: "SEGURIDAD",
    title: "Coordinación con servicios de tránsito aéreo",
    description: "DAN 91: coordinar con ATS si aplica para la zona de operación",
    required: false,
  },
  {
    id: "seg-mirador",
    category: "SEGURIDAD",
    title: "Punto de observación (VLOS) confirmado",
    description: "DAN 91: mantener contacto visual con la aeronave en todo momento",
    required: true,
  },

  // ── POST_VUELO ──
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
  "NORMATIVA",
  "DOCUMENTACION",
  "AERONAVE",
  "BATERIA",
  "ENTORNO",
  "CLIMA",
  "OPERACION",
  "SEGURIDAD",
  "POST_VUELO",
];

export const CATEGORY_LABELS: Record<ChecklistCategory, string> = {
  NORMATIVA: "Normativa",
  DOCUMENTACION: "Documentación",
  AERONAVE: "Aeronave",
  BATERIA: "Batería",
  ENTORNO: "Entorno",
  CLIMA: "Clima",
  OPERACION: "Operación",
  SEGURIDAD: "Seguridad",
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
  {
    id: "seg-populated",
    category: "SEGURIDAD",
    title: "Precauciones en zona poblada",
    description: "DAN 151: verificar barrera física, zona de seguridad, prohibición de vuelo sobre personas ajenas",
    required: true,
    context: { populatedArea: true },
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
