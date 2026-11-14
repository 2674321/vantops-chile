# VantOPS 1.1 — contrato UX

Estado: implementación incremental en `feat/vantops-v1-1-operation`. Este
documento describe decisiones ya incorporadas y separa explícitamente el QA
visual pendiente.

## Principios

- La evaluación visible siempre procede del mismo motor de dominio. El modo
  experto agrega evidencia; nunca cambia límites, severidad ni permisividad.
- El estado se comunica con texto e icono además del color. Un dato requerido
  ausente o vencido se muestra como incompleto, no favorable.
- Las fuentes, su fecha y la advertencia de no autorización permanecen junto a
  la decisión, sin imitar una interfaz certificada u oficial.
- La preparación es local, puede retomarse sin conexión y no requiere cuenta.

## Jerarquía del dashboard

1. Lugar y cambio rápido de coordenadas.
2. Perfil activo y límites personales.
3. Evaluación textual, completitud, motivos y frescura.
4. Clima actual/pronosticado y observación comunitaria separada.
5. Acción para guardar o reanudar la preparación.
6. Timeline, ventana y mapa como detalle de apoyo.
7. Fuentes y atribuciones visibles.

La navegación principal expone Inicio, Mi operación, Bitácora y Ajustes. El
flujo directo de registro de vuelo continúa disponible sin exigir un plan.

## Unidades

El almacenamiento y el motor usan km/h, °C y metros. Ajustes transforma valores
solo al entrar o salir de la UI:

| Preferencia | Opciones | Unidad canónica |
|---|---|---|
| Velocidad | km/h, m/s, kt | km/h |
| Temperatura | °C, °F | °C |
| Distancia/elevación | métrico, imperial | m |

La precisión mostrada evita afirmar exactitud inexistente y el valor convertido
no se usa como nueva fuente en conversiones sucesivas. Ráfagas y viento no se
rebautizan a una altura distinta de la entregada por el provider.

## Modo básico y experto

El modo básico prioriza evaluación, condiciones esenciales, motivos y próxima
acción. El modo experto añade motivos informativos, completitud, hora UTC y
METAR raw con atribución explícita a VATSIM como fuente comunitaria no oficial.
La preferencia es local, reversible y forma parte del respaldo permitido.

## Estados de datos

La UI distingue carga, error, sin datos, parcial/incompleto, vigente y vencido.
Un plan sin conectividad puede guardarse como borrador, pero no recibe un
snapshot meteorológico ni un estado favorable inventado. Las observaciones
METAR no sustituyen silenciosamente el pronóstico.

## Accesibilidad y evidencia pendiente

Los controles nuevos mantienen etiquetas asociadas y estados textuales. Antes
del release candidate se debe verificar teclado, foco, lector, targets táctiles
y ausencia de scroll horizontal en 320, 360, 375, 390, 430, 1024 y 1440 px.
También quedan pendientes capturas deterministas del código real para estados
completo, incompleto, desfavorable, experto, plan vinculado, offline y stale.
Ninguno de esos gates se declara aprobado en la matriz de QA hasta ejecutarlo.
