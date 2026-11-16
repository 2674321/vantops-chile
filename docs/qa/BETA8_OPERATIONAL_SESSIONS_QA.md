# QA Beta 8 — centro operacional desde el mapa

Fecha: 2026-11-16 · Versión candidata: `1.1.0-beta.8`

## Evidencia

- Suite local (cierre final tras rescate): lint PASS, TypeScript PASS,
  63 archivos / 664 tests PASS y 1 omitido preexistente; build PWA PASS con
  57 entradas precache (889,10 KiB).
- Correcciones del rescate (2026-11-16): dos tests del repositorio de sesiones
  eran dependientes del reloj (mezclaban hora real de `startOperation` con
  `nowIso` fijo de vuelo) y fallaban después de las 10:00 UTC; se fijó
  `nowIso` determinista. Se extrajo el clamp del cronómetro a
  `visibleSessionSeconds` en `src/domain/operations/logic.ts` (misma fórmula,
  sin cambio de comportamiento) y se añadió test de regresión de la carrera
  del primer render en `logic.test.ts`.
- Chromium real (repetido tras la corrección): vuelo único con recarga en
  pleno vuelo, segundo vuelo en la misma sesión, cierre de operación, Registro
  y Bitácora con exactamente 2 registros reales, y jornada con 0 vuelos.
  Consola sin errores. Capturas desktop/mobile regeneradas tras la corrección.
- Responsive: 1440×900, 390×844 y 320×700. A 320 px se midió
  `scrollWidth === clientWidth === 320`.
- Capturas verificadas: `beta8-centro-operacional-desktop.png` y
  `beta8-centro-operacional-mobile.png`.
- `PARCIAL` indica cobertura de contrato/código sin reproducir el escenario
  ambiental exacto. `NO EJECUTADO` no se presenta como aprobado.

## Matriz O001–O100

| ID | Estado | Evidencia |
|---|---|---|
| O001 | PASS | `/#/` abre mapa real, sin landing ni “herramienta destacada”. |
| O002 | PASS | Captura Chromium 1440×900: mapa amplio y panel con scroll propio. |
| O003 | PASS | CTA operacional visible en escritorio; captura candidata. |
| O004 | PASS | Layout tablet cubierto por regresión beta 7 y CSS sin cambio de grid base. |
| O005 | PASS | Captura 390×844: bandeja y atribución visibles. |
| O006 | PASS | Chromium 320×700: ancho de documento 320 px, sin overflow. |
| O007 | PASS | Los tabs cambian contenido del `aside`; canvas Leaflet permanece montado. |
| O008 | PASS | Navegador cambió Operación→Registro conservando sesión y cronómetro. |
| O009 | PASS | `ActiveSessionBanner` permanece sobre el mapa con panel cerrado. |
| O010 | PASS | Preferencia del panel y query `workspace` conservan estado durable. |
| O011 | PASS | Capa usa estado independiente; sesión se almacena en Dexie. |
| O012 | PASS | Tests `effectiveMapSelection` y snapshot al iniciar. |
| O013 | PASS | Bitácora ofrece “Volver al mapa” y carga sentinel activo. |
| O014 | PASS | Mi operación solo lee sesiones; no ejecuta comandos de cierre. |
| O015 | PASS | `routeCompatibility.test.tsx` conserva parámetros históricos. |
| O016 | PASS | Parser/test de `panel=pines`. |
| O017 | PARCIAL | Tabs y botones semánticos; no se repitió matriz completa Escape. |
| O018 | NO APLICA | Cierres usan confirmación inline, no modal ni focus trap. |
| O019 | PASS | Estado estable usa `aria-live`; contador no está en live region. |
| O020 | PARCIAL | Mobile portrait PASS; teclado virtual/safe-area físico no ejecutado. |
| O021 | PASS | Repositorio guarda snapshot y UTC en transacción. |
| O022 | PASS | Validador rechaza ubicación inválida; no existe fallback 0,0. |
| O023 | PASS | Test de dominio acepta 0,0 explícito. |
| O024 | PASS | GPS no se invoca; mapa manual/pines/búsqueda permanecen disponibles. |
| O025 | PASS | Test de selección efectiva da prioridad al pin. |
| O026 | PASS | Test de selección efectiva da prioridad a zona. |
| O027 | PASS | E2E navegador inició sesión ad-hoc. |
| O028 | PASS | `planId` se copia; plan solo recibe primer `linkedFlightId`. |
| O029 | PASS | UI permite operación sin aeronave y bloquea despegue. |
| O030 | PASS | Botón se deshabilita y `startCommandId` es idempotente. |
| O031 | PARCIAL | Restricción transaccional y test de sesión competidora; no dos ventanas reales simultáneas. |
| O032 | PARCIAL | UI solo anuncia éxito después del commit; no se inyectó fallo al inicio. |
| O033 | PARCIAL | Comandos no usan red; modo offline exacto no ejecutado en navegador. |
| O034 | PASS | E2E recargó y recuperó mismo vuelo/sesión sin cambiar inicio. |
| O035 | PASS | Navegación a Condiciones/Mapa conservó IndexedDB. |
| O036 | PASS | E2E mostró sesión finalizada con 0 vuelos. |
| O037 | PASS | `canCompleteSession` y test bloquean cierre con vuelo activo. |
| O038 | PASS | Busy UI + comando de cierre idempotente. |
| O039 | PARCIAL | Transacción une sesión/sentinel; no se forzó fallo de disco al cierre. |
| O040 | PASS | Test completa/cancela sin vuelo y verifica cero `FlightRecord`. |
| O041 | PASS | Test crea `IN_FLIGHT` sin fila final. |
| O042 | PASS | Repositorio exige sesión ACTIVE. |
| O043 | PASS | `canStartFlight` impide segundo vuelo activo. |
| O044 | PASS | Cierre transaccional crea una fila y enlaza la sesión. |
| O045 | PASS | Test de `finishCommandId` repetido conserva una sola fila. |
| O046 | PASS | Test repositorio y E2E navegador registran dos vuelos en una sesión. |
| O047 | PASS | Test conserva el primer `linkedFlightId`. |
| O048 | PASS | E2E ad-hoc produjo vuelos sin `planId` inventado. |
| O049 | PASS | Dominio y UI separan duración operacional de suma de vuelos. |
| O050 | PASS | Campos omitidos quedan `undefined`. |
| O051 | PASS | Validador 0–100 rechaza inválidos antes de escribir. |
| O052 | PASS | Snapshot del plan/activa se copia al vuelo. |
| O053 | PARCIAL | Snapshot vive en cada run; cambio entre vuelos no repetido manualmente. |
| O054 | PASS | La sesión usa `structuredClone` del punto inicial. |
| O055 | PARCIAL | Flujo local no depende de red; desconexión en pleno vuelo no ejecutada. |
| O056 | PASS | E2E recargó en vuelo y siguió `IN_FLIGHT`. |
| O057 | PASS | Test guarda `MANUAL_CORRECTION`; UI usa conversión local→UTC. |
| O058 | PASS | Test rechaza fin anterior y conserva vuelo activo. |
| O059 | PARCIAL | Dexie agrupa sesión/vuelo/plan; no se inyectó fallo entre writes. |
| O060 | PASS | `totalFlightSeconds` suma solo estado `LANDED`. |
| O061 | PASS | Conversor local/UTC probado bajo zona de ejecución America/Santiago. |
| O062 | PARCIAL | Usa API `Date` estándar; no se aisló proceso con fecha invernal y TZ forzada. |
| O063 | PARCIAL | Conversión es agnóstica; no se ejecutó suite separada con `TZ=UTC`. |
| O064 | PARCIAL | UTC persiste estable; transición DST exacta no simulada. |
| O065 | PASS | Repositorio conserva ISO con segundos/milisegundos. |
| O066 | PASS | Duración deriva de timestamps, no de ticks acumulados. |
| O067 | PASS | Dominio rechaza intervalo negativo; clamp visual cubierto por test de regresión `visibleSessionSeconds` (carrera del primer render). |
| O068 | NO EJECUTADO | No hay aviso específico para salto grande del reloj; deuda documentada. |
| O069 | PASS | Contrato existente METAR mantiene ausencia/estado comunitario. |
| O070 | PASS | Snapshots existentes conservan capturedAt/fuente/frescura. |
| O071 | PASS | Suite de evaluación no convierte viento ausente en favorable. |
| O072 | PASS | Checklist snapshot solo copia estados reales. |
| O073 | PASS | Vuelos conservan snapshot propio. |
| O074 | PASS | Inicio operacional no invoca geolocalización. |
| O075 | PASS | Test backup round-trip conserva sesión de 0 vuelos. |
| O076 | PASS | Campos opcionales no reciben defaults ficticios. |
| O077 | PARCIAL | Hook sincroniza foco/evento/BroadcastChannel; no dos ventanas reales. |
| O078 | PASS | Tablas `drafts` y `operationSessions` están separadas. |
| O079 | PASS | Registro muestra sesión, estado, fecha, vuelos y duración. |
| O080 | PASS | Snapshot conserva coordenadas WGS84 sin UTM/altura inferida. |
| O081 | PASS | Freeze test v1→v6 conserva vuelo/batería. |
| O082 | PASS | Freeze test v2→v6 conserva lugar/ajustes. |
| O083 | PASS | Freeze test v3→v6 conserva plan. |
| O084 | PARCIAL | Migración aditiva v4 declarada; fixture v4 exacto no separado. |
| O085 | PARCIAL | Migración aditiva v5 declarada; fixture con draft exacto no separado. |
| O086 | PASS | Importación v1 no inventa `operationSessions`. |
| O087 | PASS | Compatibilidad v2 validada por contrato de backup. |
| O088 | PASS | Compatibilidad v3 de mapas permanece en suite. |
| O089 | PASS | Compatibilidad v4 de drafts permanece en suite. |
| O090 | PASS | Backup v5 round-trip de sesión + tests separados de múltiples vuelos. |
| O091 | PASS | Suite rechaza registros corruptos sin import parcial. |
| O092 | PASS | Upsert por ID/updatedAt y máximo una ACTIVE. |
| O093 | PASS | Importar otra ACTIVE lanza error antes de la transacción. |
| O094 | NO EJECUTADO | No se hizo actualización entre service workers instalados. |
| O095 | PASS | Build `generateSW`; operaciones no llaman backend. |
| O096 | PASS | `npm run lint` y `npm run typecheck`. |
| O097 | PASS | 664 tests PASS, 1 skip preexistente; build PASS. |
| O098 | PASS | Chromium desktop/mobile, capturas verificadas y cero errores de consola. |
| O099 | PENDIENTE | Se completa con PR/CI/merge y SHA final. |
| O100 | PENDIENTE | Se completa tras deploy y smoke público. |

## E2E 1–6

| Flujo | Estado | Evidencia |
|---|---|---|
| E2E-1 dos vuelos | PASS | Chromium: 2 vuelos, acumulado, cierre y Registro. |
| E2E-2 sin vuelos | PASS | Chromium: segunda sesión con `0 vuelos`; total global siguió en 2. |
| E2E-3 cierre inesperado | PASS | Recarga durante vuelo mantuvo inicio y exigió finalizar explícitamente. |
| E2E-4 dos pestañas | PARCIAL | Contrato transaccional/test competidor; no simultaneidad real de dos ventanas. |
| E2E-5 offline/fallo | PARCIAL | Comandos son locales y autosave cubre fallo; no se forzó QuotaExceeded en sesiones. |
| E2E-6 compatibilidad | PASS | Freeze v1-v3, backups v1-v5 y round-trip v5 automatizados. |

## Deuda explícita

- Probar instalación/actualización PWA en hardware y dos pestañas realmente
  simultáneas antes de promover a estable.
- Añadir aviso de salto de reloj atípicamente grande y fixtures separados de
  migración Dexie v4/v5.
