# Arquitectura de preparación de vuelo VantOPS 1.1

## Alcance

`FlightPlan` es una preparación local, no una autorización. Se guarda en la
tabla Dexie `plans` del esquema v3 y puede existir sin conexión o sin datos
meteorológicos. `REVIEWED` solo significa revisado por el usuario.

## Identidad y relaciones

- Los IDs nuevos usan `crypto.randomUUID()` con fallback local para navegadores
  sin esa API; los IDs históricos no se reescriben.
- `FlightRecord.planId` apunta al plan de origen.
- `FlightPlan.linkedFlightId` permite navegar en sentido inverso.
- Un plan vinculado no se elimina: debe archivarse. Al eliminar un vuelo, el
  plan se conserva y se limpia su vínculo.
- Duplicar genera otro ID, vuelve a `DRAFT` y nunca copia `linkedFlightId`.

## Snapshots

Al guardar desde Inicio se copian ubicación, radio, aeronave, límites,
pronóstico actual disponible, METAR disponible y evaluación. Cada snapshot
incluye `capturedAt`; clima y observación conservan fuente, tiempo del dato y
estado de frescura. El plan offline es válido como borrador, pero no obtiene una
evaluación inventada.

Al registrar el vuelo desde el plan, los snapshots se copian al registro y no
se vuelven a consultar. Editar notas posteriores no modifica esas copias.

## Persistencia y respaldo

- Dexie v1/v2 migra aditivamente a v3; no se vacían tablas anteriores.
- `vantops-backup` v2 incluye `plans` y relaciones.
- El importador continúa aceptando backup v1 sin planes.
- Un backup v2 sin la sección `plans`, o con planes inválidos, se rechaza antes
  de abrir la transacción; no existe importación parcial deliberada.
- Los conflictos se resuelven por `updatedAt`, igual que vuelos y baterías.

## UI

`Mi operación` permite crear, reanudar, duplicar, archivar y eliminar planes no
vinculados. El registro directo de vuelo permanece disponible. El formulario de
vuelo iniciado con `?planId=` precarga horario, coordenadas, tipo de operación y
notas, y enlaza el nuevo vuelo al plan.

