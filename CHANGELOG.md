# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) · SemVer.

## [1.1.0-beta.7] - 2026-11-16

### Added
- Workspace `map-first`: el mapa abre en la ruta raíz con toolbar compacta,
  panel plegable, pestañas navegables y scroll lateral independiente.
- Mapas base Calles (OpenStreetMap) y Topográfico (OpenTopoMap), con atribución,
  persistencia local, fallback seguro y Satélite visible como no configurado.
- Filtros de pines globales, asociados al mapa y favoritos; acceso directo a
  Condiciones usando el punto operacional seleccionado.
- LinkedIn e Instagram públicos del propietario en Acerca → Contacto.

### Changed
- Navegación reducida a Mapa, Mi operación, Bitácora, Condiciones y Más; las
  rutas históricas de Mapa, Utilidades y Lugares redirigen conservando parámetros.
- Se retira definitivamente la antigua pantalla informativa de Utilidades y su
  preview duplicado; los enlaces históricos abren el workspace operativo.
- El dashboard meteorológico pasa a Condiciones y deja de montar un segundo mapa
  o solicitar otra ubicación.
- El selector efectivo usa la coordenada real del pin o radio activo, evitando
  enviar un centro anterior a preparaciones o bitácora.

### Fixed
- La toolbar ya no desborda horizontalmente en tablet de 768 px y los enlaces
  públicos usan las URLs exactas de LinkedIn e Instagram facilitadas.

### Compatibility
- Dexie permanece en v5 y el respaldo en v4. No se eliminan ni transforman
  mapas, pines, radios, checklist, borradores, preparaciones o vuelos previos.

## [1.1.0-beta.6] - 2026-11-15

### Added
- Selección geográfica compartida y trazable entre mapa, nueva preparación y
  nueva entrada de bitácora, sin solicitar GPS automáticamente.
- Autoguardado serializado con estados visibles, reintento y `flush` antes de
  cambiar de mapa o navegar; preferencias validadas y borradores recuperables
  de preparaciones y vuelos usan el mismo contrato de persistencia.
- Pines canónicos basados en `SavedPlace`, con búsqueda, favoritos, notas,
  movimiento explícito y migración transaccional de pines beta.5.
- Contacto público con GitHub y correo; redes sociales solo se muestran cuando
  una URL HTTPS personal válida se configura explícitamente.
- Búsqueda tolerante a acentos y submenú por categoría en la lista pre-vuelo;
  el progreso queda aislado por ubicación de operación.

### Changed
- `Lugares` se consolida en el panel de pines del mapa; la ruta histórica
  redirige sin eliminar registros locales.
- Dexie avanza aditivamente a v5 con tabla `drafts`; backup v4 incluye
  borradores y mantiene importación v1-v3.
- Los controles de movimiento de radios y pines requieren activación explícita,
  evitando desplazamientos accidentales y remontajes de Leaflet.

### Fixed
- El estado `Guardado` solo aparece tras completar la escritura duradera y los
  formularios siguen utilizables si IndexedDB está bloqueado o no disponible.
- Cambiar de mapa espera el guardado pendiente en vez de recargar o descartar
  cambios mediante confirmaciones repetitivas.
- La PWA comprueba nuevas publicaciones al abrirse, al recuperar conexión, al
  volver a primer plano y cada hora; cuando el worker nuevo toma el control, la
  pestaña se recarga una sola vez para no quedar mostrando una beta anterior.

## [1.1.0-beta.5] - 2026-11-15

### Added
- Radios personalizados desde el panel principal, sin tener que crear un preset y
  editarlo después.
- Pines persistentes con nombre, color, selección, arrastre y eliminación; los
  respaldos anteriores siguen siendo válidos porque `pins` es aditivo y opcional.
- Catálogo curado de 60+ perfiles de DJI, Autel, Skydio, Parrot, SenseFly,
  Wingtra, Quantum Systems y Freefly, con búsqueda tolerante a mayúsculas y
  acentos, agrupación por fabricante/tipo y enlaces oficiales.

### Changed
- El centro del radio seleccionado se puede arrastrar directamente y la cámara
  solo se recentra ante acciones explícitas, reduciendo saltos y parpadeos.
- El selector pre-vuelo usa submenús plegables y resultados de búsqueda en vez
  de dos listas desplegables largas.
- Inicio elimina la etiqueta `Herramienta destacada` y describe las capacidades
  actuales del mapa.

### Compatibility
- Sin migración de Dexie ni cambio del formato de backup; mapas beta.2–beta.4
  cargan con una colección de pines vacía.

## [1.1.0-beta.4] - 2026-11-15

### Added
- Identidad B1 Vector V Andino dentro del producto: marca accesible en el header,
  favicon SVG/PNG, Apple Touch y familias PWA standard, maskable y monochrome.
- Estado vacío ilustrado y marcador de centro de operación seleccionados del kit,
  cargados solo en los flujos de mapa que los necesitan.
- Regresión de integridad SHA-256 para los activos B1 P0 y rutas base-aware.

### Changed
- El manifest usa iconos maskable dedicados de 192/512 px con margen seguro,
  en vez de declarar como adaptable el mismo PNG estándar.
- Las referencias de `index.html` funcionan bajo `/vantops-chile/` y conservan
  el modo local de Vite.

### Compatibility
- Sin cambios en el motor meteorológico, Dexie v4, backup v3, `id`, `scope`,
  `start_url` ni rutas hash de la PWA.

## [1.1.0-beta.3] - 2026-11-15

### Added
- Accesos directos visibles a `Mapa` y `Utilidades` en navegación móvil y escritorio,
  sin depender de desplazamiento horizontal oculto.
- Panel protagonista y desplegable en Inicio con conteo real de mapas locales,
  vista previa lazy de solo lectura y salto contextual al editor completo.
- Recuperación manual del borrador como JSON ante fallos persistentes de escritura.
- QA con ubicación sintética, denegación/timeout, fallos de IndexedDB, teclado,
  pérdida de mosaicos y cinco viewports responsive.

### Changed
- Utilidades presenta el mapa como primera herramienta, diferencia la vista de
  Inicio del editor completo y ofrece acceso directo al modo de medición.
- El editor distingue coordenada seleccionada, centro de zona y puntos de
  medición; medir ya no recentra la cámara.
- El ajuste de bounds solo ocurre por acción explícita y tolera cambios de tamaño
  del contenedor sin reencuadres posteriores.
- Las operaciones que reemplazan un borrador confirman de forma homogénea; una
  zona modificada se guarda antes de copiarla a una preparación.

### Fixed
- El panel Inicio ya no puede provocar un error de Leaflet al cambiar de viewport
  con radios visibles.
- El estado `Guardado` solo aparece después de completar la escritura real.
- La indicación sobre el mapa no se superpone a los controles de zoom y el aviso
  aeronáutico ocupa menos alto móvil sin perder su mensaje explícito.

## [1.1.0-beta.2] - 2026-11-15

### Added
- Menú `Utilidades` y mapa de operaciones independiente con rutas hash públicas.
- Radios múltiples concéntricos o independientes, edición de centro, nombre,
  color, visibilidad, duplicación y medidas geométricas locales.
- Medición geodésica entre dos puntos con distancia Haversine y rumbo inicial.
- Mapas locales persistidos en Dexie v4; selección desde lugares y preparaciones.
- Backup v3 con mapas y radios, compatible con importaciones v1 y v2.
- Copia explícita de una zona guardada a una nueva preparación, sin sincronización
  posterior ni interpretación aeronáutica.

### Changed
- El mapa usa la URL oficial de mosaicos OSM, atribución visible y carga lazy.
- El buscador conserva acción explícita, caché y separación mínima de solicitudes;
  no implementa autocompletado ni descarga de cartografía offline.

## [1.1.0-beta.1] - 2026-11-14

Beta pública compatible con los datos locales de 1.0.1. No se declara release
estable mientras continúen pendientes la auditoría completa de estaciones y el
QA ampliado del release candidate.

### Added
- Contrato aditivo de completitud para la evaluación: faltantes decisionales e
  informativos, `isComplete` y trazabilidad de vigencia de la fuente.
- Selector persistente de viento de referencia a 10/100 m en Ajustes.
- Documentación de baseline, contrato de evaluación, proveedores/licencias y
  matriz de QA de 1.1.
- Preparaciones locales (`FlightPlan`) con creación, reanudación, duplicado,
  archivado, snapshots preoperacionales y vínculo opcional con la bitácora.
- Esquema Dexie v3 y backup v2, manteniendo importación de respaldos v1.
- Preferencias restaurables de velocidad (km/h, m/s, kt), temperatura (°C/°F),
  distancia/elevación (métrico/imperial) y modo experto.
- Presentación experta aditiva con metadatos UTC/completitud y METAR raw, sin
  cambiar el resultado del motor de evaluación.
- Fallback METAR acotado a las tres estaciones más cercanas: si la nominal no
  tiene reporte utilizable, muestra la alternativa real y su distancia.
- Integración de la funcionalidad 1.1 con el branding, capturas, citación y
  workflows vigentes de `main` para publicación reproducible en GitHub Pages.

### Changed
- La evaluación actual y horaria usa la altura de viento seleccionada y el
  estado de frescura real del dataset.
- La ventana ordena y deduplica horas, no une intervalos discontinuos y muestra
  las franjas de precaución en ámbar con copy de revisión.
- Límites y datos meteorológicos se convierten solo en entrada/presentación; el
  modelo persistido conserva unidades canónicas para evitar drift acumulado.
- METAR identifica el aeródromo observado, advierte que no representa el punto
  exacto de operación y valida que la estación devuelta sea la solicitada.
- El fallback METAR continúa de forma acotada ante timeout, HTTP 429/5xx o red,
  conserva el primer error si ningún intento funciona y no oculta la degradación.

### Fixed
- Un límite de ráfagas o temperatura con dato ausente ya no puede producir
  `FAVORABLE`.
- `NaN`, infinitos, límites inválidos, fuente vencida y viento 100 m ausente se
  tratan como evaluación incompleta en lugar de un pase implícito.

### Security
- `npm audit` actual reporta 15 vulnerabilidades (3 bajas, 6 moderadas, 4 altas
  y 2 críticas), principalmente en tooling. No se aplicó `--force`; los saltos
  mayores de Vitest/React Router quedan para actualización controlada.

## [1.0.1] - 2026-09-18

Mantenimiento y endurecimiento de contratos de providers. Sin cambios de datos, UI ni funciones nuevas; compatibilidad absoluta con 1.0.0 (esquema IndexedDB v2 y formato de respaldo v1 intactos).

### Added
- **Fixtures de contrato de proveedores** (`providers/*/__fixtures__/`, `providerContract.test.ts`): respuestas Open-Meteo completas/incompletas/inválidas, METAR reales sanitizados, y verificación de los `kind` de error comunes por adapter.
- **`parseOpenMeteoResponse`**: validación estructural de la respuesta de Open-Meteo con rechazo `invalid-response` ante esquemas incompatibles (payloads anulables nulos se aceptan, `weather_code` inexistente/no numérico se rechaza).
- **`numOrNull`**: normalización de campos numéricos (null, NaN, Infinity, no numérico y strings → `null`) sin inventar valores; aplicado a actual + horario de Open-Meteo.
- **Diagnóstico local de providers** (`domain/providerDiagnostic.ts`): registro FIFO de hasta 50 eventos en localStorage (`vantops:provider-diagnostics`), solo observabilidad (sin telemetría, sin PII), con `recordProviderError` integrado en los throw-sites de clima, elevación, geocodificación y observaciones.
- **Congelamiento de datos** (`storage/freeze.test.ts`): apertura en esquema Dexie v2 con las 4 tablas exactas, migración v1→v2 preservando registros, formato de backup v1 sin drift, y regresión de fallos de storage (settings corruptos → `null`, lista con fallback a valor crudo, lectura de base vacía sin errores).
- Tests de regresión a11y (`flightForm.a11y.test.tsx`): `aria-invalid` + `aria-describedby` apuntando al mensaje `role="alert"` correcto.
- Sección **Preguntas rápidas** en el README (qué es/no hace, cuenta, localización de datos, offline, fuentes, VATSIM vs DMC/IFIS, respaldo, SemVer).
- CI: paso `npm audit` como informe no bloqueante.

### Changed
- **NIL de METAR**: depresión de reporting detectada con `\bNIL\b` en cualquier posición del METAR (antes requería que `NIL` siguiera inmediatamente al grupo de hora), devolviendo `no-data`.
- Dependencias exactas en runtime, sin regresión de bundle: `dexie@4.4.6`, `@tanstack/react-query@5.103.1` (React se mantiene en `19.2.8`: `19.3.0` reverted por regresión de tamaño).
- `docs/ROADMAP.md`: sección 253 marcada como snapshot histórico y 254 actualizada (P0 de mantenimiento cumplido en 1.0.1).

### Fixed
- **Oculto (prevención)**: un cambio de esquema de Open-Meteo (p. ej. `weather_code` numérico→string) ahora falla como `invalid-response` en vez de propagar valores corruptos a la UI.
- Cobertura de límites en elevación (0 m y negativos válidos; NaN/Infinity → `no-data`) y geocodificación (`place_id` no numérico omitido, respuesta `[]` → sin resultados).

### Security
- Sin cambios; `npm audit` registra 4 advisories moderados (react-router 6.x, dev-only vitest, etc.) sin fix dentro de la versión soportada; documentados, sin `--force`.
- El diagnóstico local no registra coordenadas, consultas ni datos personales.

### Tests
- Suite: **567 tests** (566 + 1 integración opt-in) en **44 archivos** (R1.0.0: 472/38; +95 tests). Lint (136 archivos) y typecheck limpios; bundle principal 298.49 kB (gzip 95.00 kB), precache PWA 34 entradas (746.52 KiB), sin regresión vs 1.0.0.

## [1.0.0] - 2026-09-17

Primer MVP estable. Endurecimiento de release: exactitud temporal, providers, PWA/offline, cobertura de UI y accesibilidad. Sin nuevas funciones de producto.

### Added
- **Cobertura de UI con jsdom + Testing Library**: `ToastProvider` (visibilidad, autodescarte, dedupe, límite), `FlightForm` (validación, guardado, error), `SettingsPage` (carga, guardado, borrado, error), `PlacesPage` y `BatteryPage` (estados vacíos, CRUD, errores), `ErrorBoundary` (fallback, ocultamiento de detalles técnicos fuera de DEV).
- Cobertura de hooks: `useLastCoordinate` (carga, guardado optimista, degradación sin localStorage) y `useInstallPrompt` (evento de instalación, descarte con enfriamiento, standalone); `useInstallPrompt` ahora expone `canInstall`.
- **Frescura meteorológica derivada del dato** (`weatherFreshness.ts`, `dataTime` en `DataSourceMeta`): estados `updated`/`stale`/`error`/`no-data` calculados desde el tiempo real del pronóstico, no desde la recepción.
- Timezone del lugar desde Open-Meteo (`timezone`, `timezoneAbbreviation`, `utcOffsetSeconds`) y utilidades `weatherTime.ts` (`naiveLocalToEpochMs`, `formatWeatherHourLabel`) para mostrar horas en el huso de la ubicación.
- `formatClockTime` (`lib/format.ts`) para formatear instantes en el huso de una ubicación (usado por la hora solar).
- **Errores de provider tipados** (`domain/providerError.ts`): `timeout` / `offline` / `http` / `invalid-response` / `no-data` / `invalid-input` en clima, elevación, geocodificación y observaciones.
- Sección `errors` y ampliación de `common`/`settings` en el catálogo `es-CL`.
- Tests: `parseMetarObservedAt` (minuto real y rollover), `deriveWeatherFreshness`, `weatherTime`, `formatClockTime`, compatibilidad de respaldos 0.7/0.8/0.9.

### Changed
- **METAR**: el timestamp de observación usa el minuto real (`172153Z` → 21:53Z) y resuelve rollover de día/mes/año; se eliminó la zona horaria fija `America/Santiago` del decodificador.
- La frescura del clima ya no se basa en `receivedAt`; una respuesta servida desde la caché de Workbox se muestra como potencialmente antigua.
- La línea de tiempo horaria y la fecha/hora de la ventana de operación se muestran en el huso del lugar.
- La hora solar (`SolarCard`) usa el offset UTC del lugar cuando está disponible.
- `SettingsPage` consume textos desde i18n (se eliminó la constante `PILOT_DISCLAIMER`).
- `ErrorBoundary`: `role="alert"` + `aria-live="assertive"`, copy de producción desde i18n y mensaje técnico solo en desarrollo.

### Fixed
- **P0:** el timestamp METAR ignoraba el minuto; todas las observaciones se mostraban con `:00`.
- **P0:** el METAR asumía siempre `America/Santiago`, incorrecto para Magallanes y Rapa Nui.
- **P0:** el clima cacheado por el service worker se mostraba como "Actualizado ahora" pese a ser antiguo.
- **P1:** ausencia de cobertura de UI en formularios y páginas críticas.

### Security
- Solo se importan de los respaldos las claves de configuración en lista blanca; las claves desconocidas se ignoran de forma segura (verificado con respaldos 0.7/0.8/0.9).

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
