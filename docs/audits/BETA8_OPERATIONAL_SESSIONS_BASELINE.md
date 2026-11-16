# Baseline Beta 8 — sesiones operacionales

Fecha: 2026-11-16  
Base: `origin/main` `3386d59fadd5384f80a70b4c749d7c915e15dac6`  
Worktree: `/home/a2cl/Documentos/07_Proyectos/12_VantOps/vantops-beta8`

## Protección del trabajo local

El checkout original `vantops-chile` contiene cambios no publicados en branding, `index.html`, iconos y assets. No se modificó ni descartó ninguno; Beta 8 se desarrolla en un worktree limpio separado.

## Estado confirmado

- Ruta raíz: mapa operacional Beta 7.
- Persistencia: Dexie v5, sin tabla de sesiones.
- Respaldo: `vantops-backup` v4.
- Plan y vuelo son entidades separadas; no existe jornada operacional con cero o varios vuelos.
- `FlightForm` y `FlightPlanForm` presentaban timestamps UTC recortados directamente en campos `datetime-local`.
- Baseline: lint y TypeScript PASS; build PWA PASS (56 entradas, 856,91 KiB).
- Tests baseline: 649 PASS, 1 FAIL por timeout fijo de 5 s en `OperationalMapPage > creates multiple zones and persists the map`, 1 omitido. El caso completó en ~5,4 s al repetirse aisladamente; se documenta como deuda de estabilidad previa y no como regresión Beta 8.
