# Matriz de pruebas VantOPS 1.1

Estados permitidos: PASS, FAIL, NO EJECUTADO, NO APLICA.

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
| Unidades configurables y modo experto | NO EJECUTADO | F2/F6 |
| Restauración backup 1.0.1 → 1.1 con planes | NO EJECUTADO | F7 |
| QA móvil/desktop y screenshots deterministas | NO EJECUTADO | F6/F7 |
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
| Backup v2 corrupto o sin `plans` se rechaza antes de importar | PASS | `export.test.ts` |
| Borrar vuelo conserva plan y limpia vínculo | PASS | prueba transaccional de repositorio |
| Editar vuelo no incrementa batería de nuevo | PASS | guardado de batería limitado a creación en `FlightForm` |
| Gate completo después de F3 | PASS | 46 archivos; 596 PASS, 1 integración opt-in omitida; build PWA 40 entradas/769,72 KiB |
