# Proveedores, procedencia y licencias — VantOPS 1.1

Verificado el 2026-11-14. Las condiciones externas pueden cambiar y deben
revisarse antes de una release o cambio de modelo de uso.

| Proveedor | Naturaleza | Tiempo/frescura | Uso y fallback | Condición verificada |
|---|---|---|---|---|
| Open-Meteo | Pronóstico numérico y elevación | `dataTime` del dataset; clima actual stale después del contrato local de 90 min | Caché etiquetada; sin vigencia no hay verde actual | Free/open-access no comercial, 600/min, 5.000/h, 10.000/día y 300.000/mes; datos CC BY 4.0 y atribución obligatoria |
| VATSIM METAR | Feed comunitario de observaciones METAR | Hora Zulu del reporte; updated hasta 120 min, stale hasta 360 min | Complementario; no oficial DGAC/DMC; ausencia o NIL se muestra como no disponible | No atribuir carácter oficial ni usar como autorización |
| Nominatim público | Geocodificación OSM iniciada por usuario | Resultado de búsqueda, no dato operacional | Submit explícito, caché 30 min, cola máxima 1 req/s; sin autocompletado | Máximo absoluto 1 req/s; atribución; no autocomplete cliente; datos ODbL |
| OpenStreetMap | Datos y tiles cartográficos | No representa vigencia aeronáutica | Conciencia espacial; mapa sin tiles no bloquea datos locales | ODbL, crédito a OpenStreetMap y contribuyentes; política de tiles separada |
| SunCalc | Cálculo local de luz solar | Fecha y coordenada local | No realiza solicitudes externas | Dependencia local; revisar licencia del paquete antes de redistribuir nuevos artefactos |
| DGAC/AIP/IFIS | Referencia normativa y aeronáutica oficial | Según publicación, resolución, AIP y NOTAM | Enlace a fuente original; no copiar reglas cambiantes como autorización automática | El catálogo DAN distingue documentos vigentes e históricos; áreas P/R/D remiten a AIP/IFIS |

## Fuentes consultadas

- Open-Meteo: https://open-meteo.com/en/pricing y
  https://open-meteo.com/en/license
- Nominatim: https://operations.osmfoundation.org/policies/nominatim/
- OpenStreetMap: https://www.openstreetmap.org/copyright
- DGAC RPAS: https://www.dgac.gob.cl/drones/normativa
- DGAC áreas: https://www.dgac.gob.cl/drones/areas-prohibidas-restricciones
- Catálogo DAN: https://www.dgac.gob.cl/normativa/normas-dan/

No se infiere que una respuesta sin áreas, METAR o restricciones signifique
espacio libre ni operación autorizada.

