# QA — Beta 4 Identidad B1 y PWA

Fecha: 2026-11-15. Estados: PASS, FAIL, NO EJECUTADO, NO APLICA.

## Alcance

- Base: `734cd01dd8c4aac72e8727fba984ba97dd5f341a` (`v1.1.0-beta.3`).
- Objetivo: issue #2, selección P1 del kit y cierre verificable de #3/#4.
- Fuera de alcance: APK, Google Play, cambio de esquema Dexie o backup.

## Marca y assets

| Caso | Estado | Evidencia |
|---|---|---|
| Header usa símbolo B1 canónico | PASS | SVG `b1_simbolo_transparente`, nombre accesible y dimensiones 24×24 |
| Favicon SVG + 16/32 | PASS | rutas `%BASE_URL%` en `index.html` |
| Apple Touch 180 | PASS | activo dedicado y ruta base-aware |
| Iconos PWA 192/512 | PASS | hashes del kit verificados |
| Maskable 192/512 | PASS | activos dedicados; contenido principal con 21,4–28,1 % de margen |
| Monochrome 512 | PASS | entrada `purpose: monochrome` independiente |
| No se copió kit completo | PASS | 13 activos seleccionados; Android excluido |

## Compatibilidad

- `base`, `id` y `scope`: `/vantops-chile/`; `start_url`: `.`; HashRouter: PASS.
- Dexie v4 y backup v3 sin cambios: PASS por diff y suite regresiva.
- Motor meteorológico y evaluación sin cambios: PASS por diff y suite regresiva.
- Los radios continúan descritos como planificación, no autorizaciones: PASS.

## Selección P1

- `sin_radios.svg`: solo aparece en el estado vacío expandido del mapa de Inicio.
- `centro_operacion.svg`: importado por el chunk lazy de Leaflet y visible solo
  para la zona seleccionada.
- No se importaron recursos promocionales, Android ni estados sin uso real.

## QA acumulado de issues #3 y #4

- Mapa desplegable, navegación móvil, lazy tiles y cero estado duplicado: PASS
  en `BETA3_MAP_UX_QA.md`.
- GPS sintético/denegado/timeout, mosaicos OSM bloqueados, IndexedDB fallido,
  teclado y responsive: PASS en `BETA3_MAP_UX_QA.md`.
- Lector de pantalla manual físico: NO EJECUTADO; no se simula evidencia.

## Gates y publicación

- Lint: PASS, 158 archivos.
- Typecheck: PASS.
- Tests: PASS, 53 archivos; 632 aprobados y 1 integración externa opt-in omitida.
- Build: PASS; 1.777 módulos transformados.
- PWA: PASS; 59 entradas, 828,89 KiB.
- Bundle vs beta.3: shell +0,58 kB (+0,26 kB gzip), Dashboard +0,46 kB
  (+0,16 kB gzip), chunk lazy del mapa +2,31 kB (+0,77 kB gzip), estado
  vacío SVG 6,28 kB (1,39 kB gzip).
- Browser local 390×844 y escritorio: PASS, sin overflow ni errores de consola.
- Persistencia: mapa y radio guardados permanecen tras recarga; marcador B1 vuelve
  a mostrarse y el editor informa `Guardado en este dispositivo`.
- Capturas: el workflow real incorpora `01-escritorio.png`, `02-movil.png` y
  `03-inicio-mapa-b1.png` desde la aplicación ejecutada, sin datos personales.

## Publicación

- PR: PASS · [#6](https://github.com/2674321/vantops-chile/pull/6).
- Merge de implementación: `e520ffc4448a2f9343cd00fc4f0dcebfb3dabdd3`.
- CI: PASS · [run 43749355462](https://github.com/2674321/vantops-chile/actions/runs/43749355462).
- Deploy Pages: PASS · [run 43749355562](https://github.com/2674321/vantops-chile/actions/runs/43749355562).
- Capturas reales: PASS · [run 43749355547](https://github.com/2674321/vantops-chile/actions/runs/43749355547), commit `1863a8155331da9927620c52e3023c65ed6a516f`.
- Smoke público: PASS; `v1.1.0-beta.4`, marca B1, manifest/iconos y rutas.
- Actualización PWA: PASS tras activación y recarga; el mapa local previo siguió
  presente (`1 mapa guardado en este dispositivo`).
- Producción móvil 390×844: PASS sin overflow; consola sin errores.
