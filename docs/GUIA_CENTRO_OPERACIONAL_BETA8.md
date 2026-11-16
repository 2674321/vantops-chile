# Centro operacional Beta 8

El mapa sigue siendo la pantalla principal. El panel lateral agrupa tres modos
sin recargar la ruta ni desmontar Leaflet:

- **Mapa:** ubicación, radios, pines y acceso a condiciones.
- **Operación:** jornada activa y sus vuelos reales.
- **Registro:** resumen de sesiones y acceso a la Bitácora.

## Jornada normal

1. Selecciona un punto, pin o radio en el mapa.
2. Abre **Operación**. Puedes vincular una preparación; es opcional.
3. Pulsa **Iniciar operación**. La hora del dispositivo se guarda en UTC junto
   con un snapshot del punto seleccionado.
4. Con una aeronave configurada, pulsa **Iniciar vuelo**. La batería y su carga
   inicial son opcionales y nunca se infieren.
5. Al aterrizar, pulsa **Finalizar vuelo** y confirma. En ese momento se crea una
   entrada de Bitácora transaccional.
6. Repite los pasos 4–5 para cada vuelo y termina con **Finalizar operación**.

Operación y vuelo usan relojes distintos. Esperar, preparar o cambiar batería
cuenta como tiempo de operación, no como tiempo de vuelo.

## Recuperación

Una recarga o cierre de pestaña conserva la sesión. Si había un vuelo activo,
VantOPS no asigna un aterrizaje: vuelve a mostrar **Vuelo en curso**. El bloque
de recuperación permite indicar la hora real como corrección manual o marcar el
evento interrumpido con una razón. Un evento interrumpido no crea `FlightRecord`.

## Sesiones sin vuelo

Es válido finalizar una jornada sin despegar. Queda una sesión con cero vuelos y
cero horas de vuelo; no se crea una fila ficticia en la Bitácora.

## Persistencia y respaldo

Dexie v6 agrega `operationSessions` y un índice opcional
`FlightRecord.operationSessionId`. El respaldo v5 incluye estas sesiones y sigue
importando v1–v4. Si el dispositivo ya tiene una operación activa, la importación
de otra operación activa se rechaza completamente para evitar estados ambiguos.

Todo permanece en el dispositivo. No existe backend, cuenta ni sincronización de
datos personales; `BroadcastChannel` solo coordina pestañas del mismo navegador.
