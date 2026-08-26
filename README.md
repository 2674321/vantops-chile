# VantOPS Chile

PWA gratuita de planificación y apoyo a operaciones RPAS en Chile. Datos reales, privacidad por defecto, sin login obligatorio.

**Live:** [2674321.github.io/vantops-chile](https://2674321.github.io/vantops-chile/)

## Stack

- React 19 + TypeScript
- Vite 6
- Tailwind CSS v4
- shadcn/ui (componentes button, card)
- TanStack Query
- Leaflet + react-leaflet (OpenStreetMap)
- Open-Meteo (clima + elevación)
- SunCalc (posición solar local)
- VATSIM METAR (observaciones)
- vite-plugin-pwa (service worker + manifest)
- Biome (lint)
- Vitest (tests)
- GitHub Actions + GitHub Pages

## Ejecutar localmente

```bash
npm install
npm run dev
```

## Tests

```bash
npm test
```

## Build de producción

```bash
npm run build
```

> En Node 18, el build usa `--experimental-global-webcrypto` automáticamente.

## Estructura

```
src/
  app/          App.tsx, ErrorBoundary
  domain/       Modelos: weather, elevation, solar, observation, sourceMeta, coordinate
  domain/assessment/  FlightAssessment, FlightLimits, rules, evaluator
  domain/checklist/   ChecklistItem, ChecklistState, engine, defaultChecklist
  providers/
    weather/        Open-Meteo forecast
    elevation/      Open-Meteo Elevation API
    solar/          SunCalc (cálculo local)
    observations/   VATSIM METAR, decoder, estaciones
  features/
    dashboard/      Pantalla principal
    assessment/     AssessmentCard (semáforo de vuelo)
    checklist/      CheckListCard (checklist prevuelo)
    map/            Leaflet + OSM
    weather/        WeatherPanel
    elevation/      ElevationCard
    solar/          SolarCard
    observations/   NearbyMetarCard
  hooks/          useLastCoordinate (localStorage)
  storage/        settings.ts (flightLimits, aircraft), checklists.ts
  i18n/           es-CL
  components/     ui/ (button, card)
```

## Flujo de datos

```
UI (features/)
  → Provider adapter (providers/)
    → External API (Open-Meteo, NOAA, SunCalc)
  → Domain model (domain/)
  → DataSourceMeta (status, timestamps, fuente)
```

La UI nunca depende del JSON crudo de APIs externas.

## Fase 0 (completada)

- React 19 + Vite + TS + Tailwind
- Dashboard con GPS o coordenadas manuales
- Clima real vía Open-Meteo (viento 10m/100m, ráfagas, dirección, temperatura, precipitación, humedad, visibilidad, nubosidad)
- ErrorBoundary global
- HashRouter (sin 404 al recargar)
- CI + Deploy automático

## Fase 1 (completada)

- **Mapa Leaflet/OSM** con marcador, clic para seleccionar punto, OpenStreetMap attribution
- **Elevación** vía Open-Meteo Elevation API
- **Sol** calculado localmente con SunCalc (amanecer, atardecer, hora dorada, duración del día)
- **METAR cercano** vía VATSIM (parser decode: viento, visibilidad, QNH, nubosidad, fenómenos, temperatura/punto de rocío)
- **11 aeródromos chilenos** con cálculo de estación más cercana (haversine)
- **Metadata de fuentes**: timestamp requestedAt/receivedAt, status (actualizado/antiguo/error/sin datos), nombre de fuente
- **PWA**: manifest, service worker, íconos 192/512, instalable
- **Provider architecture**: domain → provider → API con normalización

## Fase 2 (completada)

- **Motor de evaluación de vuelo**: reglas basadas en límites configurables (viento, ráfagas, precipitación, visibilidad, temperatura)
- **AssessmentCard**: semáforo FAVORABLE / CAUTION / UNFAVORABLE / NO_DATA con razones detalladas
- **FlightLimits**: modelo de configuración de límites persistidos en localStorage
- **AircraftProfile**: modelo de perfil de aeronave (preparado para futuras reglas por tipo)
- **Storage abstraction**: `storage/settings.ts` con separación de concerns para futura migración a IndexedDB/Dexie
- **Consolidación de Coordinate**: validación, serialización, formato con tests de regresión de signo negativo
- **80 tests** pasando (coordinate, assessment, weather, elevation, solar, METAR, stations, sourceMeta)

## Fase 3 — R0.4 Checklist (completada)

- **Checklist prevuelo interactiva**: 22 items en 8 categorías (Documentación, Equipo, Aeronave, Batería, Entorno, Clima, Operación, Post-vuelo)
- **Checklist engine**: funciones puras para progreso, visibilidad, contexto, toggle, reset
- **Items contextuales**: se muestran automáticamente según condiciones (lluvia, viento fuerte, baja visibilidad, operación nocturna)
- **Integración con Assessment**: el estado del assessment alimenta el contexto del checklist
- **Persistencia**: estado del checklist guardado en localStorage, sobrevive recarga de página
- **Reset con confirmación**: permite reiniciar sin afectar aeronave, límites ni ubicación
- **Progreso visual**: barra de progreso + porcentaje + indicadores de obligatorios restantes
- **Funcionamiento offline**: checklist opera sin conexión, sin depender de APIs externas
- **116 tests** pasando (+36 nuevos: engine 28, persistence 8)

## Fuentes de datos

| Fuente | Uso | Licencia |
|--------|-----|----------|
| [Open-Meteo](https://open-meteo.com/) | Clima forecast + elevación | CC BY 4.0 |
| [OpenStreetMap](https://www.openstreetmap.org/) | Mapa base | ODbL |
| [VATSIM METAR](https://metar.vatsim.net/) | METAR observaciones | Público |
| [SunCalc](https://suncalc.org/) | Posición solar | BSD-2 |

## Limitaciones

- El METAR más cercano se calcula entre 11 aeródromos principales; no cubre todos los campos de Chile
- La fuente oficial chilena (DMC/meteochile) no se integra aún por estabilidad de su API
- La elevación es un punto único; no genera curvas de perfil de vuelo
- No sustituye permisos, AIS, DGAC ni normativa vigente
- Los límites de evaluación son por defecto vacíos; el piloto debe configurar sus propios parámetros
- El checklist es una guía de verificación personal, no constituye certificación ni cumplimiento normativo

## Privacidad

- Sin analytics ni telemetría
- Sin cuentas obligatorias
- Datos guardados solo en el dispositivo (localStorage)
- Sin tracking de terceros

## Disclaimer

VantOPS Chile es una herramienta de apoyo a la planificación de operaciones RPAS. No sustituye la normativa vigente, publicaciones aeronáuticas, permisos, autorizaciones ni instrucciones de las autoridades competentes (DGAC). El piloto es responsable de operar conforme a la normativa vigente.

## Licencia

MIT
