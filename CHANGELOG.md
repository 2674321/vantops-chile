# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) · SemVer.

## [No publicado]

## [0.9.0] - 2026-09-17

### Added
- **Sistema de notificaciones (toasts) propio**: dominio puro (`toast.ts`) con variantes, duración por tipo (2.5–4 s éxito/info, 5–6 s aviso/error), deduplicación de mensajes repetidos y límite de 3 visibles; `ToastProvider`, `ToastViewport` y `useToast` propios, montados por encima de `<Routes>` para sobrevivir la navegación, con `role="status"`/`aria-live="polite"` y `role="alert"`/`aria-live="assertive"` según gravedad.
- **Validación de coordenadas reutilizable** (`parseCoordinateInput`, `parseCoordinateFields`) que distingue vacío, no numérico y fuera de rango por eje, acepta `0,0` como coordenada válida y evita por completo el fallback a `0,0` ante entradas inválidas.
- Validación de fechas de vuelo (`validateFlightTimes`) con error explícito si el fin es anterior al inicio, y de porcentaje de batería (`parseBatteryPercent`, entero 0–100; vacío permitido).
- Detección pura de reconexión real offline→online (`detectReconnection`) que no dispara en la carga inicial ni en cada render.
- Mensajes de retroalimentación centralizados (`feedback`) y helper `coordinateInputMessage` para errores de latitud/longitud.

### Changed
- **Feedback de acciones**: registrar/editar/eliminar vuelo, crear/editar/eliminar batería y ciclo, crear/editar/eliminar/favorito de lugar, guardar/borrar límites, exportar respaldo/CSV e importar respaldo ahora confirman con toast y muestran errores en lugar de fallar en silencio.
- Estados de operación en curso: botones deshabilitados con etiqueta ("Guardando…", "Importando…", "Exportando…"), sin doble envío ni doble clic en registrar ciclo.
- Formularios de vuelo y lugares usan labels visibles, `aria-invalid` y `aria-describedby`; botones de solo icono incorporan `aria-label`.
- Confirmaciones destructivas inline para vuelo, batería, lugar, límites y aeronave activa, sin `window.confirm`.
- El borrado de la aeronave activa ahora limpia también IndexedDB (antes solo `localStorage`, lo que provocaba que reapareciera al recargar).
- El radio de la zona se guarda con manejo de error y reversión visual si IndexedDB falla, con toast de aviso.

### Fixed
- **P0:** los formularios de vuelo y lugares convertían entradas inválidas en `0,0` (`Number.parseFloat(x) || 0`), guardando coordenadas incorrectas.
- **P0:** "Conexión restaurada" aparecía en cada montaje estando en línea; ahora solo tras una transición real offline→online.
- **P0:** las fallas al guardar vuelo/lugar/batería/límites se ignoraban o dejaban la UI en estado inconsistente.
- **P1:** el fallo del uso de batería posterior al guardado del vuelo se ocultaba con `.catch(() => {})`; ahora se informa como advertencia sin invalidar el vuelo guardado.
- **P1:** la carga de bitácora, lugares y baterías usaba `try/finally` sin `catch`, ocultando errores de IndexedDB.

## [0.8.0] - 2026-09-17

### Added
- **Zona de planificación**: dominio `OperationZone` (centro + radio) con presets de 500 m / 1 km / 2 km y radio personalizado, validación de rango técnico (50 m–50 km), formateo y aviso de que no constituye autorización.
- Círculo de radio sobre el mapa Leaflet (`react-leaflet` `Circle`), reactivo al radio configurado.
- Control de zona en el panel (`OperationZoneControl`) con selección por botones y valor personalizado.
- **Pronóstico horario ampliado**: `HourlyWeather` ahora incluye temperatura, humedad, precipitación, código meteorológico, viento 10 m/100 m, ráfagas, dirección, visibilidad y nubosidad, con `number | null` por campo.
- **Línea de tiempo horaria** (`WeatherTimeline`) mobile-first con desplazamiento horizontal, hora local, dirección de viento textual y estado por hora que no depende solo del color.
- **Ventana de operación** (`findOperationWindow`): calcula la mejor franja futura reutilizando `evaluateFlight`, con resultados tipados (`ok`, `no-favorable`, `needs-limits`, `insufficient-data`) y lenguaje orientativo no autoritativo.
- Evaluación horaria (`assessment/hourly.ts`) que reutiliza el motor de evaluación existente, respetando `windReferenceHeight`.
- **Instalación PWA**: lógica de dominio pura (`pwaInstall.ts`) y hook `useInstallPrompt` con detección de standalone, evento `beforeinstallprompt`, pista para iOS y descarte con enfriamiento de 14 días.
- **Exportación CSV de bitácora** (`csvExport.ts`): RFC 4180, BOM UTF-8, escapado de comas/comillas/saltos, etiquetas legibles de tipo de operación e incidentes.
- Utilidad `downloadTextFile` para descargas de archivos generados en cliente.

### Changed
- El radio de la zona se persiste como única clave `operationZoneRadius` (el centro sigue siendo `lastCoordinate`), evitando duplicar la ubicación.
- El respaldo v1 incluye `operationZoneRadius` en la lista blanca y valida que sea numérico y finito.
- El test de elevación dejó de depender de Internet: los casos unitarios usan `fetch` simulado y la verificación real queda tras `RUN_INTEGRATION=1` (`npm run test:integration`).
- Los providers de elevación y clima usan `AbortController` con timeout de 8 s y mensajes de error diferenciados.

### Fixed
- **P0:** el test de elevación llamaba a la API real en cada corrida (flaky / dependiente de red).
- **P0:** los datos horarios solo exponían viento a 100 m, impidiendo una línea de tiempo y una ventana de operación reales.
- **P1:** mensajes de error de red en Open-Meteo ahora distinguen timeout y fallo de conexión.

### Security
- Solo se importan las claves de configuración en lista blanca, ahora incluida `operationZoneRadius` con validación numérica.

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
