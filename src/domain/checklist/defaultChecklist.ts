import type { ChecklistItem, ChecklistCategory, ChecklistKind, RegulatoryReference } from "./types";
import type { AircraftType } from "../assessment/aircraft";

const DAN_91_REF: RegulatoryReference = {
  document: "DAN 91",
  section: "Reglas del Aire",
  edition: "Ed. 4 / ENM 5 — JUL 2023",
  sourceUrl: "https://www.dgac.gob.cl/wp-content/uploads/2024/07/DAN-91_ED4__ENM5_20JUL2023-2.pdf",
  status: "verified",
};

const DAN_151_REF: RegulatoryReference = {
  document: "DAN 151",
  section: "Operaciones RPAS sobre áreas pobladas",
  edition: "Ed. 3 — MAY 2024",
  sourceUrl: "https://www.dgac.gob.cl/wp-content/uploads/2024/05/DAN-151-ED3-27MAY2024.pdf",
  status: "verified",
};

export const DEFAULT_CHECKLIST: ChecklistItem[] = [
  // ── NORMATIVA ──
  {
    id: "norm-credencial",
    category: "NORMATIVA",
    kind: "REGULATORY",
    title: "Credencial de operador vigente",
    description: "Credencial de piloto RPAS emitida por DGAC",
    comment: "Verifica que tu credencial esté vigente y correspondiente al tipo de operación.",
    required: true,
    regulatoryReference: DAN_91_REF,
  },
  {
    id: "norm-seguro",
    category: "NORMATIVA",
    kind: "REGULATORY",
    title: "Seguro de responsabilidad civil",
    description: "Seguro vigente que cubra la operación",
    comment: "El seguro debe cubrir la operación específica que vas a realizar.",
    required: true,
    regulatoryReference: DAN_91_REF,
  },
  {
    id: "norm-autorizacion",
    category: "NORMATIVA",
    kind: "REGULATORY",
    title: "Autorización de vuelo verificada",
    description: "Confirmar autorización del plan de vuelo si aplica para la zona",
    required: true,
    regulatoryReference: DAN_91_REF,
  },
  {
    id: "norm-metar",
    category: "NORMATIVA",
    kind: "OPERATIONAL",
    title: "Revisar información meteorológica disponible",
    description: "Pronóstico y observaciones METAR/SPECI si están disponibles",
    comment: "Consulta la información meteorológica y aeronáutica oficial disponible para tu operación.",
    required: true,
    regulatoryReference: {
      ...DAN_91_REF,
      section: "Requisitos meteorológicos",
    },
    ifisUrl: "https://aipchile.dgac.gob.cl",
  },
  {
    id: "norm-airspace",
    category: "NORMATIVA",
    kind: "REGULATORY",
    title: "Espacio aéreo verificado",
    description: "Verificar que la zona no requiere autorización especial del espacio aéreo",
    comment: "Consulta el espacio aéreo en la zona de operación.",
    required: true,
    regulatoryReference: DAN_91_REF,
  },
  {
    id: "norm-populated",
    category: "NORMATIVA",
    kind: "REGULATORY",
    title: "Verificar requisitos para operación en zona poblada",
    description: "Si opera sobre área poblada: verificar requisitos aplicables según normativa DGAC",
    comment: "Si la operación es sobre área poblada, verifica los requisitos de la DAN 151.",
    required: true,
    context: { populatedArea: true },
    regulatoryReference: DAN_151_REF,
  },

  // ── DOCUMENTACION ──
  {
    id: "doc-plan-vuelo",
    category: "DOCUMENTACION",
    kind: "OPERATIONAL",
    title: "Plan de vuelo definido",
    description: "Ruta, altitud y zona de operación establecidos",
    required: true,
  },
  {
    id: "doc-limites",
    category: "DOCUMENTACION",
    kind: "GOOD_PRACTICE",
    title: "Límites de vuelo configurados",
    description: "Altitud máxima, distancia y tiempo de vuelo establecidos",
    required: true,
  },

  // ── AERONAVE ──
  {
    id: "aero-estructura",
    category: "AERONAVE",
    kind: "OPERATIONAL",
    title: "Estructura revisada",
    required: true,
  },
  {
    id: "aero-gnss",
    category: "AERONAVE",
    kind: "OPERATIONAL",
    title: "GNSS/GPS disponible",
    required: true,
  },
  {
    id: "aero-helices",
    category: "AERONAVE",
    kind: "OPERATIONAL",
    title: "Hélices revisadas",
    required: true,
    applicability: { aircraftTypes: ["MULTIROTOR", "HELICOPTER"] },
  },
  {
    id: "aero-motores",
    category: "AERONAVE",
    kind: "OPERATIONAL",
    title: "Motores revisados",
    required: true,
    applicability: { aircraftTypes: ["MULTIROTOR"] },
  },
  {
    id: "aero-rth",
    category: "AERONAVE",
    kind: "OPERATIONAL",
    title: "RTH configurado",
    required: true,
    applicability: { aircraftTypes: ["MULTIROTOR"] },
  },
  {
    id: "aero-superficies",
    category: "AERONAVE",
    kind: "OPERATIONAL",
    title: "Superficies de control revisadas",
    required: true,
    applicability: { aircraftTypes: ["FIXED_WING", "VTOL"] },
  },
  {
    id: "aero-propulsion",
    category: "AERONAVE",
    kind: "OPERATIONAL",
    title: "Propulsión revisada",
    required: true,
    applicability: { aircraftTypes: ["FIXED_WING"] },
  },
  {
    id: "aero-lanzamiento",
    category: "AERONAVE",
    kind: "OPERATIONAL",
    title: "Sistema de lanzamiento preparado",
    required: true,
    applicability: { aircraftTypes: ["FIXED_WING"] },
  },
  {
    id: "aero-recuperacion",
    category: "AERONAVE",
    kind: "OPERATIONAL",
    title: "Sistema de recuperación preparado",
    required: true,
    applicability: { aircraftTypes: ["FIXED_WING"] },
  },
  {
    id: "aero-vertical",
    category: "AERONAVE",
    kind: "OPERATIONAL",
    title: "Sistema de vuelo vertical revisado",
    required: true,
    applicability: { aircraftTypes: ["VTOL"] },
  },
  {
    id: "aero-transicion",
    category: "AERONAVE",
    kind: "OPERATIONAL",
    title: "Transición vertical/crucero verificada",
    required: true,
    applicability: { aircraftTypes: ["VTOL"] },
  },
  {
    id: "aero-rotor",
    category: "AERONAVE",
    kind: "OPERATIONAL",
    title: "Rotor principal revisado",
    required: true,
    applicability: { aircraftTypes: ["HELICOPTER"] },
  },
  {
    id: "aero-colaptil",
    category: "AERONAVE",
    kind: "OPERATIONAL",
    title: "Colaptil revisado",
    required: true,
    applicability: { aircraftTypes: ["HELICOPTER"] },
  },

  // ── BATERIA ──
  {
    id: "bat-cargada",
    category: "BATERIA",
    kind: "OPERATIONAL",
    title: "Batería cargada",
    required: true,
  },
  {
    id: "bat-instalada",
    category: "BATERIA",
    kind: "OPERATIONAL",
    title: "Batería instalada correctamente",
    required: true,
  },

  // ── ENTORNO ──
  {
    id: "ent-zona",
    category: "ENTORNO",
    kind: "OPERATIONAL",
    title: "Zona de vuelo revisada",
    required: true,
  },
  {
    id: "ent-obstaculos",
    category: "ENTORNO",
    kind: "GOOD_PRACTICE",
    title: "Obstáculos identificados",
    required: true,
  },
  {
    id: "ent-personas",
    category: "ENTORNO",
    kind: "REGULATORY",
    title: "Terceros considerados en la zona de operación",
    required: true,
    regulatoryReference: DAN_91_REF,
  },
  {
    id: "ent-populated",
    category: "ENTORNO",
    kind: "REGULATORY",
    title: "Zona poblada: verificar requisitos aplicables",
    description: "Revisar requisitos para operaciones en áreas pobladas según normativa DGAC",
    required: true,
    context: { populatedArea: true },
    regulatoryReference: DAN_151_REF,
  },

  // ── CLIMA ──
  {
    id: "cli-pronostico",
    category: "CLIMA",
    kind: "OPERATIONAL",
    title: "Pronóstico revisado",
    required: true,
  },
  {
    id: "cli-viento",
    category: "CLIMA",
    kind: "OPERATIONAL",
    title: "Condiciones de viento revisadas",
    required: true,
  },
  {
    id: "cli-visibilidad",
    category: "CLIMA",
    kind: "OPERATIONAL",
    title: "Visibilidad revisada",
    required: true,
  },

  // ── OPERACION ──
  {
    id: "op-ubicacion",
    category: "OPERACION",
    kind: "OPERATIONAL",
    title: "Ubicación confirmada",
    required: true,
  },
  {
    id: "op-limites",
    category: "OPERACION",
    kind: "GOOD_PRACTICE",
    title: "Límites personales revisados",
    required: true,
  },
  {
    id: "op-noche",
    category: "OPERACION",
    kind: "REGULATORY",
    title: "Requisitos nocturnos verificados",
    description: "Si aplica, verificar requisitos para operación nocturna",
    required: true,
    context: { night: true },
    regulatoryReference: DAN_91_REF,
  },

  // ── SEGURIDAD ──
  {
    id: "seg-emergencia",
    category: "SEGURIDAD",
    kind: "GOOD_PRACTICE",
    title: "Plan de emergencia definido",
    description: "Procedimientos de emergencia y zonas de aterrizaje alternativas",
    required: true,
  },
  {
    id: "seg-coordinacion",
    category: "SEGURIDAD",
    kind: "OPERATIONAL",
    title: "Coordinación con servicios de tránsito aéreo",
    description: "Si aplica para la zona de operación",
    required: false,
    regulatoryReference: DAN_91_REF,
  },
  {
    id: "seg-mirador",
    category: "SEGURIDAD",
    kind: "REGULATORY",
    title: "Punto de observación (VLOS) confirmado",
    description: "Mantener contacto visual con la aeronave durante la operación",
    required: true,
    regulatoryReference: DAN_91_REF,
  },

  // ── POST_VUELO ──
  {
    id: "post-inspeccion",
    category: "POST_VUELO",
    kind: "GOOD_PRACTICE",
    title: "Aeronave inspeccionada post-vuelo",
    required: false,
  },
  {
    id: "post-baterias",
    category: "POST_VUELO",
    kind: "GOOD_PRACTICE",
    title: "Baterías registradas",
    required: false,
  },
  {
    id: "post-observaciones",
    category: "POST_VUELO",
    kind: "GOOD_PRACTICE",
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

export const CHECKLIST_KIND_LABELS: Record<ChecklistKind, string> = {
  REGULATORY: "Normativa",
  OPERATIONAL: "Operacional",
  GOOD_PRACTICE: "Buena práctica",
};

export const CONTEXTUAL_ITEMS: ChecklistItem[] = [
  {
    id: "cli-precipitacion",
    category: "CLIMA",
    kind: "OPERATIONAL",
    title: "Revisar condiciones de precipitación",
    required: true,
    context: { rain: true },
  },
  {
    id: "cli-rafagas",
    category: "CLIMA",
    kind: "OPERATIONAL",
    title: "Revisar ráfagas",
    required: true,
    context: { strongWind: true },
  },
  {
    id: "cli-noche",
    category: "OPERACION",
    kind: "REGULATORY",
    title: "Revisar requisitos para operación nocturna",
    required: true,
    context: { night: true },
    regulatoryReference: DAN_91_REF,
  },
  {
    id: "cli-visibilidad-baja",
    category: "CLIMA",
    kind: "OPERATIONAL",
    title: "Revisar condiciones de visibilidad reducida",
    required: true,
    context: { lowVisibility: true },
  },
  {
    id: "seg-populated",
    category: "SEGURIDAD",
    kind: "REGULATORY",
    title: "Precauciones en zona poblada",
    description: "Revisar requisitos aplicables a operaciones en áreas pobladas",
    required: true,
    context: { populatedArea: true },
    regulatoryReference: DAN_151_REF,
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
