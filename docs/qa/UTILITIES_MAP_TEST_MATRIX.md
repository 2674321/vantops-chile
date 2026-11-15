# Matriz QA — Utilidades / Mapa de operaciones

Estados: PASS, FAIL, NO EJECUTADO, NO APLICA.

| Caso | Estado | Evidencia |
|---|---|---|
| M01–M08 radios y validación estricta | PASS | `operationalMap.test.ts`, `operationZone.test.ts` |
| M09–M10 coordenadas fuera de rango y 0,0 explícito | PASS | `coordinate.test.ts` y formulario manual compartido |
| M11–M16 zonas múltiples, edición aislada, duplicar, ocultar y eliminar | PASS | dominio/repositorio y smoke UI real |
| M17 fit bounds incluye radios visibles | PASS | `FitVisibleZones` usa bounds métricos de cada círculo |
| M18–M20 Haversine, antimeridiano y métricas | PASS | `operationalMap.test.ts` |
| M21–M23 geolocalización y errores | NO EJECUTADO | manejo explícito implementado; no se concedió ni denegó permiso real durante QA para evitar usar ubicación personal |
| M24–M25 selección intencional vs pan/zoom | PASS | mapa solo procesa clic en modos centro/medición |
| M26 búsqueda sin resultados | PASS | regresión `LocationSearch`/Nominatim |
| M27 offline sin mosaicos | NO EJECUTADO | pendiente simulación navegador; la geometría y storage no dependen del tile |
| M28 recarga PWA | PASS | mapa con radios guardado y reabierto después de recarga local y en GitHub Pages |
| M29 rutas hash directas | PASS | `/utilidades` y `/utilidades/mapa` cargaron directamente en servidor local y sitio publicado |
| M30 teclado/lector | NO EJECUTADO | nombres accesibles y foco visible comprobados por árbol AX; recorrido completo de teclado no ejecutado |
| M31–M32 mapas con zonas y aislamiento | PASS | `operationalMapRepository.test.ts` |
| M33 Dexie v1/v2/v3 → v4 | PASS | `freeze.test.ts` |
| M34–M39 backup v3 y compatibilidad v1/v2 | PASS | `export.test.ts`, `export.integration.test.ts` |
| M40 error IndexedDB visible | NO EJECUTADO | UI informa excepciones del repositorio; la inyección controlada de un fallo real de IndexedDB queda pendiente |
| M41–M48 mapa → plan y semántica de copia | PASS | zona de 500 m copiada a nueva preparación, guardada, listada y reabierta con coordenadas/radio intactos; sin vínculo reactivo al mapa |

## Gate local — 2026-11-15

- Lint: PASS, 156 archivos.
- TypeScript: PASS.
- Suite: PASS, 52 archivos; 621 tests aprobados y 1 integración externa opt-in omitida.
- Build: PASS; PWA con 52 entradas precacheadas (809,85 KiB).
- Responsive: PASS a 320×700, 390×844, 768×1024, 1366×768 y 1440×900; sin overflow documental después de corregir el ancho mínimo del canvas.
- Consola: sin errores durante creación, medición, guardado, recarga y mapa → plan.
- Capturas reales: `utilidades-inicio-mobile.png`, `utilidades-mapa-mobile.png`, `utilidades-radio-multiple-mobile.png`, `utilidades-mapa-desktop.png`, `utilidades-medir-distancia.png`, `utilidades-mapa-guardado.png`.
- Integración externa contra APIs reales: NO EJECUTADO (opt-in).
- Producción GitHub Pages: PASS en `ebb42d7230643143986492c75db4f482f5712d15`.
- CI: PASS, [run 43720387544](https://github.com/2674321/vantops-chile/actions/runs/43720387544).
- Deploy: PASS, [run 43720387454](https://github.com/2674321/vantops-chile/actions/runs/43720387454).
- Smoke público: PASS en `/utilidades` y `/utilidades/mapa`; 3 radios guardados y persistentes, copia mapa → preparación, versión `v1.1.0-beta.2`, sin errores de consola.
- Responsive público: PASS a 390×844 y 1440×900, sin overflow horizontal.

Quedan explícitamente no ejecutados el permiso real de geolocalización, la simulación de pérdida de mosaicos, el recorrido completo con teclado/lector y la inyección de un fallo real de IndexedDB.
