# Baseline VantOPS 1.1

Fecha de auditoría: 2026-11-14.

## Repositorio y versión

- Rama de origen: `main`.
- HEAD observado: `7a08ebf` (`v1.0.1`).
- Versión en `package.json` y `src/version.ts`: `1.0.1`.
- Rama de trabajo: `feat/vantops-v1-1-operation`.
- El árbol ya contenía cambios de branding sin commitear. No forman parte del
  hito de evaluación y se excluyen de sus commits.
- Persistencia actual: Dexie v2 y backup `vantops-backup` v1.

El SHA observado difiere del `905e8e9` citado por la especificación. Se usa el
repositorio real como fuente de verdad.

## Verificación basal

Tras reemplazar una instalación local incompleta de `node_modules` mediante
`npm ci`, pasaron `npm run lint`, `npm run typecheck`, `npm test` y
`npm run build`. El gate posterior al parche registró 44 archivos de prueba,
582 pruebas PASS y 1 integración opt-in omitida; el build PWA generó 34 entradas
de precaché (750,15 KiB).

La reproducción por inspección y prueba confirmó:

- `GUST_MISSING` tenía severidad `info`, por lo que podía terminar verde.
- una temperatura ausente no generaba motivo aunque existiera límite.
- la completitud no distinguía variables requeridas de datos informativos.
- el dashboard siempre comparaba viento de 10 m aunque el dominio ya admitía
  `windReferenceHeight: 100`.
- la ventana trataba horas duplicadas o separadas por huecos como una racha.

## Dependencias y seguridad

`npm audit` reportó 15 vulnerabilidades: 3 bajas, 6 moderadas, 4 altas y 2
críticas. Las críticas pertenecen a `tinypool` en la cadena de Vitest; también
hay avisos en Vite, React Router y dependencias de build. La corrección total
propuesta por npm exige saltos mayores de Vitest y React Router. No se ejecuta
`npm audit fix --force`: primero se requiere una actualización controlada con
regresión completa. Esto no equivale a considerar los avisos resueltos.

## Inventario operativo

- Pronóstico y elevación: Open-Meteo.
- Observación complementaria: VATSIM METAR comunitario.
- Geocodificación manual por envío: Nominatim público.
- Cartografía: OpenStreetMap/Leaflet.
- Cálculo solar local: SunCalc.
- Datos personales: IndexedDB/localStorage, sin backend propio.

## Riesgos abiertos tras F0

- El plan de operación aún no existe como entidad persistente.
- Falta una migración v3 y backup versionado antes de guardar planes.
- No hay unidades configurables ni modo experto completos.
- Las estaciones METAR requieren auditoría aeronáutica y fallback por
  disponibilidad, no solo por distancia nominal.
- Los avisos actuales de supply chain requieren un hito separado y probado.
