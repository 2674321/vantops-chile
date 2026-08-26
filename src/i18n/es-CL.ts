export const esCL = {
  appName: "VantOPS Chile",
  tagline: "Planifica tu vuelo RPAS con datos reales",
  nav: {
    home: "Inicio",
    about: "Acerca",
  },
  dashboard: {
    useMyLocation: "Usar mi ubicación",
    locating: "Obteniendo ubicación…",
    manualTitle: "O ingresa coordenadas manualmente",
    latitude: "Latitud (-90 a 90)",
    longitude: "Longitud (-180 a 180)",
    showWeather: "Consultar condiciones",
    invalidCoords: "Coordenadas inválidas. Revisa los valores ingresados.",
    geoDenied:
      "Permiso de ubicación rechazado. Puedes ingresar coordenadas manualmente.",
    geoUnavailable: "Ubicación no disponible en este dispositivo.",
    geoTimeout: "Tiempo agotado al obtener la ubicación. Intenta nuevamente.",
    lastUsed: "Ubicación guardada en este dispositivo:",
  },
  weather: {
    title: "Condiciones actuales",
    feelsLike: "Sensación térmica",
    humidity: "Humedad",
    precipitation: "Precipitación",
    wind10m: "Viento 10 m",
    gusts: "Ráfagas",
    wind100m: "Viento 100 m (crucero)",
    sunrise: "Amanecer",
    sunset: "Atardecer",
    justNow: "Actualizado ahora",
    updatedMin: (min: number) => `Actualizado hace ${min} min`,
    partialWarning:
      "Algunos datos no están disponibles en este momento. Evalúa con cautela.",
    errorTitle: "Clima no disponible",
    errorMessage:
      "No se pudo contactar la fuente meteorológica. Verifica tu conexión e intenta nuevamente.",
    retry: "Reintentar",
    attribution: "Datos: Open-Meteo · Licencia CC BY 4.0",
    noData: "—",
  },
  about: {
    title: "Acerca de VantOPS Chile",
    whatIs:
      "Herramienta gratuita de apoyo para pilotos de RPAS/drones: consulta condiciones reales antes de volar y lleva tu bitácora local. Sin cuentas, sin rastreo.",
    normativeTitle: "Normativa y fuentes oficiales",
    normativeDescription:
      "VantOPS utiliza referencias oficiales para apoyar la planificación. La normativa vigente debe consultarse directamente en la fuente oficial DGAC.",
    disclaimerTitle: "Aviso importante",
    disclaimer:
      "VantOPS es una herramienta de apoyo a la planificación. No sustituye la normativa vigente, las publicaciones aeronáuticas, permisos, autorizaciones ni las instrucciones de las autoridades competentes (DGAC). El piloto es responsable de operar conforme a la normativa vigente.",
    sourcesTitle: "Fuentes y atribuciones",
    privacyTitle: "Privacidad",
    privacy:
      "Tus datos se guardan solo en este dispositivo. No usamos analytics ni telemetría. No necesitas crear una cuenta.",
  },
  checklist: {
    title: "Checklist prevuelo",
    progress: (checked: number, total: number) => `${checked} / ${total} completados`,
    complete: "✓ Checklist completo",
    pending: "⚠ Checklist pendiente",
    remaining: (n: number) => `${n} elementos restantes`,
    requiredRemaining: (n: number) => `${n} obligatorios restantes`,
    reset: "Reiniciar checklist",
    resetConfirm: "¿Reiniciar la checklist actual? Se conservarán aeronave, límites y ubicación.",
    resetCancel: "Cancelar",
    populatedArea: "Zona poblada",
    normative: "Normativa",
    security: "Seguridad",
  },
  footer: {
    attributions: "Open-Meteo · OpenStreetMap · VATSIM METAR · SunCalc",
  },
} as const;
