# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) · SemVer.

## [No publicado]

## [0.7.0] - 2026-09-17

### Added
- Página **Ajustes** con "Preferencias del piloto": límites de viento, ráfaga, precipitación, visibilidad y temperatura mín./máx.; campo vacío significa "no configurado".
- Búsqueda de ubicación por nombre mediante Nominatim (OpenStreetMap), solo por acción explícita del usuario, con caché, límite de 1 solicitud/segundo, timeout y atribución visible.
- Provider desacoplado de geocodificación (`nominatimGeocoding.ts`) con conversión a un único modelo `Coordinate`.
- Respaldo (backup) v1 con metadatos de formato/versión e **incluye configuración** (`flightLimits`, `activeAircraft`, `lastCoordinate`).
- `inspectBackup` con validación profunda y motivo de error claro; `ImportSummary` informa vuelos, baterías, lugares y settings importados.
- Tests de integridad de respaldo con IndexedDB (`fake-indexeddb`), tests de geocodificación y del provider VATSIM METAR con `fetch` simulado.

### Changed
- El panel ahora aplica **los límites reales del piloto** combinados con el perfil de aeronave (`applyAircraftLimits`), en lugar de evaluar sin límites.
- La búsqueda de ubicación reemplaza el flujo implícito; se mantienen fallbacks por GPS, coordenadas manuales y clic en mapa.
- Code-splitting con `React.lazy`: rutas secundarias y Leaflet (`LocationMap`) se cargan bajo demanda; el bundle principal baja de ~653 kB a ~285 kB.
- Navegación reorganizada (marca + pestañas desplazables) para evitar desbordes en pantallas de 320–390 px, con enlace a Ajustes.
- El provider de observaciones pasa a llamarse `vatsimObservation` (antes `noaaObservation`), reflejando la fuente real `metar.vatsim.net`.

### Fixed
- **P0:** los límites configurados por el piloto eran ignorados por el evaluador de vuelo.
- **P0:** la importación de respaldo no restauraba la configuración y aceptaba archivos inválidos sin validación profunda.
- **P0:** deuda de nombre en el provider de METAR (decía NOAA y usaba VATSIM).
- Errores de geolocalización ahora se distinguen (permiso denegado, no disponible, timeout) en lugar de fallar en silencio.
- Mensajes de error claros ante backups corruptos o de versión incompatible, sin importación parcial.

### Security
- La importación corre en una transacción IndexedDB y resuelve conflictos por `updatedAt`; un respaldo inválido no modifica la base.
- Solo se restauran las claves de configuración en lista blanca (`flightLimits`, `activeAircraft`, `lastCoordinate`).

## [0.6.0]

### Added
- Scaffold React 19 + Vite + TypeScript + Tailwind v4 con estructura feature-based.
- Panel con condiciones reales de Open-Meteo (viento 10 m / 100 m, ráfagas, precipitación, humedad, amanecer/atardecer).
- Ubicación por GPS o ingreso manual de coordenadas; última ubicación persistida localmente.
- Badge de estado de fuente (Actualizado / Parcial / Sin conexión) con reintento.
- Página Acerca con fuentes, atribuciones, aviso legal y política de privacidad.
- Suite inicial de tests del servicio/mapper meteorológico (Vitest).
- CI (lint, typecheck, tests, build) y deploy automático a GitHub Pages.
