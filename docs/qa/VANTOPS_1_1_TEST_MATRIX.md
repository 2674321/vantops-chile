# Matriz de pruebas VantOPS 1.1

Estados permitidos: PASS, FAIL, NO EJECUTADO, NO APLICA.

## Gate de integración y publicación beta — 2026-11-14

Versión candidata: `1.1.0-beta.1`. La publicación en GitHub Pages se registra
como PASS solo después de comprobar el sitio vivo; este bloque no la da por
hecha de forma anticipada.

| Caso | Estado | Evidencia reproducible |
|---|---|---|
| Integración de `main` y `feat/vantops-v1-1-operation` sin perder historia | PASS | merge normal en worktree separado desde `origin/main`; branding, capturas, citación y workflows de `main` conservados |
| Cambios locales del checkout original preservados | PASS | integración realizada en `vantops-publicacion`; no se cambió de rama ni se limpió el checkout original |
| Lint, typecheck, suite completa y build final | PASS | 147 archivos de lint; typecheck limpio; 48 archivos de test, 610 PASS y 1 skipped; build PWA 40 entradas/776,06 KiB |
| Fallback METAR ante timeout, red, HTTP 429/5xx | PASS | pruebas dirigidas: 503 continúa a SCSE; tres 429 conservan el primer error y limitan a tres solicitudes |
| Rutas y recursos de producción bajo `/vantops-chile/` | PASS | `dist/index.html` y `manifest.webmanifest`: base, scope e id correctos; shortcuts a operación y bitácora |
| Responsive sin overflow documental | PASS | navegador real a 320, 390, 768, 1024 y 1440 px en panel, operación, bitácora, ajustes y acerca |
| Preferencias y conversión de unidades desde UI | PASS | 30 km/h → 16,2 kt, modo experto activado, guardado confirmado |
| Crear y reabrir plan sintético | PASS | plan local de QA creado, persistente después de recarga y visible en Mi operación |
| Plan → nuevo vuelo | PASS | navegación con `planId`; formulario precarga coordenadas, tipo y nota del plan sintético |
| Errores JavaScript durante smoke visual | PASS | consola sin errores; solo advertencias de transición futura de React Router |
| Dashboard con todos los estados, mapa, checklist, detalle/edición y respaldo en cada ancho | NO EJECUTADO | el smoke real cubrió rutas y flujo principal, pero no toda la matriz visual ampliada con fixtures deterministas |
| Integración externa contra APIs reales | NO EJECUTADO | prueba opt-in omitida deliberadamente; los tests normales no requieren red |
| Instalación/upgrade/offline en dispositivo físico | NO EJECUTADO | build y service worker verificados; pendiente prueba física sin borrar IndexedDB |
| Sitio vivo y workflows de `main` | PASS | código `961090a`; [CI 43643112225](https://github.com/2674321/vantops-chile/actions/runs/43643112225) y [Deploy 43643112246](https://github.com/2674321/vantops-chile/actions/runs/43643112246) exitosos; versión `1.1.0-beta.1` y rutas principales comprobadas en la URL pública |

## Hito F0/F1/F2 parcial — 2026-11-14

| Caso | Estado | Evidencia reproducible |
|---|---|---|
| Sin límites no produce `FAVORABLE` | PASS | `assessment.test.ts` |
| Ráfaga requerida ausente no produce verde | PASS | `GUST_MISSING`, prueba dirigida |
| Temperatura mínima/máxima requerida ausente no produce verde | PASS | tabla `temperatureMinC/temperatureMaxC` |
| Precipitación y límite cero son válidos | PASS | prueba `accepts zero` |
| `NaN`/`Infinity` en dato requerido bloquean completitud | PASS | tabla de números no finitos |
| Límite no finito no pasa implícitamente | PASS | `WIND_LIMIT_INVALID` |
| Crítico más faltante conserva `UNFAVORABLE` e incompletitud | PASS | prueba mixta visibilidad/ráfaga |
| Faltante informativo no penaliza un criterio ajeno | PASS | prueba de ráfaga sin límite activo |
| Fuente stale no se presenta favorable | PASS | evaluador y ventana horaria |
| 100 m seleccionado sin dato no sustituye 10 m | PASS | `operationWindow.test.ts` |
| 10/100 m controla dashboard y pronóstico horario | PASS | typecheck + pruebas de dominio |
| Horas pasadas, duplicadas y huecos de continuidad | PASS | `operationWindow.test.ts` |
| Disclaimer de no autorización en evaluación | PASS | `AssessmentCard.tsx` |
| Persistencia de `windReferenceHeight` sin transformación | PASS | `freeze.test.ts` |
| Suite dirigida del hito | PASS | 85 pruebas en 5 archivos relevantes |
| Suite completa, lint, typecheck y build después del parche | PASS | 44 archivos; 582 PASS, 1 skipped (integración opt-in); build PWA 34 entradas/750,15 KiB |
| Plan local, migración v3 y vínculo con vuelo | PASS | Hito F3/F4 parcial documentado abajo |
| Unidades configurables y modo experto | PASS | conversiones de dominio, persistencia, UI de Ajustes y presentación compartida; gate completo del hito registrado abajo |
| Restauración backup 1.0.1 → 1.1 con planes | NO EJECUTADO | F7 |
| QA móvil/desktop del flujo principal | PASS | smoke real 320/390/768/1024/1440; la cobertura visual ampliada permanece declarada arriba como NO EJECUTADO |
| Integración externa opt-in | NO EJECUTADO | Requiere ejecución deliberada y acotada |

Los casos no listados de la matriz maestra permanecen `NO EJECUTADO`; este
documento no convierte trabajo pendiente en PASS.

## Hito F3/F4 parcial — preparación local

| Caso | Estado | Evidencia reproducible |
|---|---|---|
| Crear, guardar y reabrir plan local | PASS | `flightPlanRepository.test.ts` |
| Crear plan offline sin evaluación favorable inventada | PASS | UI guarda `DRAFT` sin `assessmentSnapshot` cuando no hay clima |
| Duplicar sin repetir ID ni vínculo | PASS | prueba de repositorio |
| Archivar/ocultar y proteger eliminación vinculada | PASS | repositorio + confirmación UI |
| Vincular vuelo a plan y referencia en ambos sentidos | PASS | `FlightForm.test.tsx`, repositorio y rutas |
| Registrar vuelo directamente sin plan | PASS | regresiones existentes de `FlightForm` |
| Snapshot no cambia al mutar el objeto meteorológico fuente | PASS | `snapshots.test.ts` |
| Editar notas no reemplaza snapshot histórico | PASS | prueba de repositorio |
| Dexie v1 → v3 y v2 → v3 conserva datos | PASS | `freeze.test.ts` |
| Backup v1 se importa sin planes | PASS | `export.integration.test.ts` |
| Backup v2 incluye y restaura planes | PASS | round-trip v2 |

## Hito F2/F6 parcial — unidades y presentación experta

| Caso | Estado | Evidencia reproducible |
|---|---|---|
| 30 km/h → kt/m/s → km/h conserva magnitud | PASS | `displayPreferences.test.ts` |
| °C/°F y m/ft conservan magnitud dentro de tolerancia | PASS | `displayPreferences.test.ts` |
| Cambiar unidad en Ajustes no cambia el límite canónico | PASS | `SettingsPage.test.tsx` verifica 30 km/h → 16,2 kt → ~30 km/h persistidos |
| Preferencias tienen defaults seguros y persisten | PASS | `settings.test.ts` |
| Preferencias nuevas son restaurables por backup | PASS | lista blanca y suites `export.test.ts` / `export.integration.test.ts` |
| Dashboard aplica las preferencias a clima, timeline, METAR y elevación | PASS | props tipadas y suite completa |
| Modo experto reutiliza la misma evaluación de dominio | PASS | `AssessmentCard` recibe el mismo objeto y solo añade detalle de presentación |
| METAR raw solo aparece como detalle experto y conserva atribución | PASS | `NearbyMetarCard.tsx` |
| Suite completa, lint, typecheck y build después del hito | PASS | 48 archivos; 605 PASS, 1 skipped (integración externa opt-in); build PWA 40 entradas/775,22 KiB |
| QA visual del flujo principal 320–1440 px | PASS | panel, operación, bitácora, ajustes y acerca sin overflow documental; capturas deterministas ampliadas siguen pendientes |

## Hito F5 parcial — METAR y fallback honesto

| Caso | Estado | Evidencia reproducible |
|---|---|---|
| Estación nominal sin reporte usa alternativa disponible | PASS | `vatsimObservation.test.ts` valida SCEL NIL → SCSE y distancia real |
| Ninguna de las tres candidatas tiene reporte | PASS | NIL/vacío conserva `no-data` y declara ausencia de alternativa |
| Respuesta de ICAO distinto no se atribuye a la estación solicitada | PASS | prueba de respuesta cruzada SCEL/SCSE |
| METAR antiguo no figura actualizado | PASS | estado `error` y copy obsoleto en prueba dirigida |
| NIL, SPECI y minutos Zulu | PASS | fixtures y `metarDecoder.test.ts` |
| Observación se declara en aeródromo, no en punto de operación | PASS | copy visible en `NearbyMetarCard.tsx` |
| Suite dirigida F5 | PASS | 78 pruebas en 4 archivos |
| Regresión completa después de F5 | PASS | 48 archivos; 608 PASS, 1 skipped (integración externa opt-in); lint/typecheck limpios; build PWA 40 entradas/776,13 KiB |
| Auditoría/expansión del catálogo contra AIP vigente | NO EJECUTADO | se conservan 11 estaciones; no se añadieron datos sin verificar |
| Backup v2 corrupto o sin `plans` se rechaza antes de importar | PASS | `export.test.ts` |
| Borrar vuelo conserva plan y limpia vínculo | PASS | prueba transaccional de repositorio |
| Editar vuelo no incrementa batería de nuevo | PASS | guardado de batería limitado a creación en `FlightForm` |
| Gate completo después de F3 | PASS | 46 archivos; 596 PASS, 1 integración opt-in omitida; build PWA 40 entradas/769,72 KiB |
