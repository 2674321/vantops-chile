# Beta 7 — línea base mapa primero

Fecha: 2026-11-16 (America/Santiago)

## Repositorio observado

- Base: `origin/main` en `ecfbd33898054335321ec1e876828fea06f87a44`.
- Versión inicial: `1.1.0-beta.6`.
- El checkout original tenía cambios ajenos; se preservó y se creó el worktree
  limpio `vantops-beta7` sobre la rama
  `feat/vantops-map-first-terrain-workspace`.
- Dexie v5 y respaldo v4 al inicio; no se requiere migración para esta interfaz.

## Gates iniciales

- `npm run lint`: PASS, 175 archivos.
- `npm run typecheck`: PASS.
- `npm test`: PASS, 58 archivos; 646 pruebas aprobadas y 1 omitida.
- `npm run build`: PASS; 61 entradas PWA, 865,46 KiB precache.

## Hallazgos reproducidos

- `/` montaba Dashboard y un segundo mapa; el editor estaba en
  `/utilidades/mapa` y `/utilidades` era una pantalla intermedia.
- El panel del editor compartía scroll con el documento y acumulaba todas las
  tarjetas en una sola columna.
- El canvas solo ofrecía OSM estándar.
- `useSelection()` podía asociar metadatos del pin a la coordenada `center`
  anterior.
- LinkedIn e Instagram quedaban nulos sin variables de entorno.

## Política cartográfica revisada

- OSM estándar: URL oficial, atribución visible, navegación interactiva normal,
  sin prefetch ni descarga masiva.
- OpenTopoMap: tiles mundiales hasta zoom 17, atribución OSM + OpenTopoMap y
  estilo CC-BY-SA; servicio comunitario sin SLA.
- Satélite: no se habilita sin proveedor, plan y credencial autorizados.

Referencias revisadas el 2026-11-16:

- https://operations.osmfoundation.org/policies/tiles/
- https://wiki.openstreetmap.org/wiki/OpenTopoMap
- https://opentopomap.org/
