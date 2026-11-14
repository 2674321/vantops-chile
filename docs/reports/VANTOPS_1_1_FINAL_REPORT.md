# Informe de publicación VantOPS 1.1 beta

Fecha: 2026-11-14

## Integración

- Repositorio original: `vantops-chile`.
- Worktree aislado: `vantops-publicacion`.
- Base de `main`: `905e8e9`.
- Feature integrada: `4790a94` (`feat/vantops-v1-1-operation`).
- Merge de integración: `4e40727`.
- Candidata funcional publicada: `961090a` (`1.1.0-beta.1`).
- El checkout original, sus cambios no confirmados y el branding de `main` se
  mantuvieron intactos. No se usó force-push, reset destructivo ni limpieza.

## Cambios de cierre

- Fallback METAR acotado a tres estaciones también ante timeout, red y HTTP
  429/5xx, sin ocultar la primera falla.
- Identificación explícita de VATSIM como feed comunitario no oficial.
- Versión beta sincronizada en aplicación y paquetes.
- Shortcut PWA a Mi operación.
- Guía reproducible de desarrollo, publicación, caché y recuperación.

No se cambió el nombre de IndexedDB, el origen público, el `scope`/`id` de la
PWA ni los formatos de respaldo. Las pruebas conservan importación de backup v1,
round-trip v2 y migraciones Dexie v1/v2 a v3.

## Validación

- Lint: PASS, 147 archivos.
- TypeScript: PASS.
- Tests: PASS, 610 aprobados y 1 integración externa opt-in omitida.
- Build: PASS, PWA con 40 entradas precacheadas (776,06 KiB).
- Navegador local: PASS a 320, 390, 768, 1024 y 1440 px para el flujo principal.
- Plan sintético: creación, recarga y enlace plan → vuelo comprobados.
- No ejecutado: integración opt-in contra APIs reales, instalación/upgrade
  offline en dispositivo físico y toda la matriz visual ampliada con fixtures.

## Publicación comprobada

- URL: <https://2674321.github.io/vantops-chile/>
- CI de la candidata funcional: [run 43643112225](https://github.com/2674321/vantops-chile/actions/runs/43643112225), success.
- Deploy de la candidata funcional: [run 43643112246](https://github.com/2674321/vantops-chile/actions/runs/43643112246), success.
- SHA funcional comprobado: `961090a8ca00ea1f12f1acdd15e84e0cac93506c`.
- Versión visible comprobada: `1.1.0-beta.1`.
- Inicio, Mi operación, Bitácora, Nuevo vuelo, Ajustes y Acerca cargaron sin
  pantalla en blanco ni errores de consola. Manifest, iconos 192/512, registro
  de service worker y service worker respondieron HTTP 200.

## Pendientes para 1.1 estable

1. Ejecutar QA física de instalación, actualización desde 1.0.1 y offline sin
   borrar IndexedDB.
2. Completar la matriz visual determinista de estados de clima, mapa, METAR,
   checklist, edición y respaldo.
3. Auditar el catálogo limitado de estaciones contra AIP vigente antes de
   ampliarlo.
4. Revisar de forma controlada las alertas de dependencias; no aplicar
   actualizaciones mayores automáticas que puedan introducir regresiones.
