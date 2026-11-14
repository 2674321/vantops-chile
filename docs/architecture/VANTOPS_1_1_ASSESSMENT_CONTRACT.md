# Contrato de evaluación VantOPS 1.1

## Decisión de compatibilidad

Se conservan los cuatro estados serializados existentes:
`FAVORABLE`, `CAUTION`, `UNFAVORABLE` y `NO_DATA`. Añadir valores nuevos habría
afectado snapshots históricos, filtros y backups. La completitud se expresa con
campos aditivos:

- `blockingMissingData`: dato ausente o inválido necesario para un límite activo;
- `informationalMissingData`: dato ausente sin criterio activo asociado;
- `isComplete`: todos los criterios activos pudieron comprobarse;
- `hasConfiguredLimits`: existe al menos un criterio configurado.

Los campos son opcionales en el tipo para leer snapshots 1.0.1, pero toda nueva
evaluación los genera.

## Precedencia

1. Sin límites: `NO_DATA`; nunca verde.
2. Algún criterio excedido: `UNFAVORABLE`, incluso si además hay faltantes.
3. Advertencia, faltante bloqueante, límite inválido o fuente no vigente:
   `CAUTION` e `isComplete: false` cuando corresponda.
4. `FAVORABLE` únicamente con límites, fuente vigente, valores finitos para
   todos los criterios activos y ninguna advertencia o infracción.

`null`, `undefined`, `NaN` e infinitos no son valores válidos. Cero sí lo es.
Un límite igual a cero está configurado; un campo sin límite no participa.

## Fuente y altura de viento

El dashboard propaga `WeatherSnapshot.meta.status`. Un dataset `stale`,
`error` o `no-data` no produce diagnóstico favorable actual. La altura elegida
en `FlightLimits.windReferenceHeight` controla la entrada comparada: 10 m por
defecto o 100 m. Si se seleccionan 100 m y el campo falta, no se sustituye por
10 m. Las ráfagas permanecen como la variable que entrega el proveedor y no se
rebautizan como ráfagas a 100 m.

## Ventana horaria

Cada hora usa el mismo evaluador. Las horas inválidas o pasadas se omiten, las
duplicadas se deduplican y las rachas solo continúan con intervalos de una hora.
Un empate conserva la primera racha encontrada. Una ventana `CAUTION` se
muestra en ámbar y se describe como franja que requiere revisión.

La salida siempre es orientativa: según los parámetros configurados y los datos
disponibles; no constituye autorización de vuelo.

