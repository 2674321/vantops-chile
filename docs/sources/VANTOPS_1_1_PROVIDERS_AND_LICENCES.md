# Proveedores, procedencia y licencias — VantOPS 1.1

Verificado nuevamente el 2026-11-15. Las condiciones externas pueden cambiar y deben
revisarse antes de una release o cambio de modelo de uso.

| Proveedor | Naturaleza | Tiempo/frescura | Uso y fallback | Condición verificada |
|---|---|---|---|---|
| Open-Meteo | Pronóstico numérico y elevación | `dataTime` del dataset; clima actual stale después del contrato local de 90 min | Caché etiquetada; sin vigencia no hay verde actual | Free/open-access no comercial, 600/min, 5.000/h, 10.000/día y 300.000/mes; datos CC BY 4.0 y atribución obligatoria |
| VATSIM METAR | Feed comunitario de observaciones en aeródromo | Hora Zulu del reporte; updated hasta 120 min, stale hasta 360 min y error después | Complementario; no oficial DGAC/DMC; ausencia/NIL busca hasta 3 estaciones cercanas y declara alternativa/distancia | No atribuir carácter oficial, al punto exacto de operación ni usar como autorización |
| Nominatim público | Geocodificación OSM iniciada por usuario | Resultado de búsqueda, no dato operacional | Submit explícito, caché 30 min, cola máxima 1 req/s; sin autocompletado | Máximo absoluto 1 req/s; atribución; no autocomplete cliente; datos ODbL |
| OpenStreetMap | Datos y tiles cartográficos | No representa vigencia aeronáutica | Conciencia espacial; mapa sin tiles no bloquea datos locales; sin prefetch ni descarga offline | URL oficial HTTPS, atribución visible, Referer normal y caché del navegador conforme a cabeceras; servicio best-effort sin SLA |
| SunCalc | Cálculo local de luz solar | Fecha y coordenada local | No realiza solicitudes externas | Dependencia local; revisar licencia del paquete antes de redistribuir nuevos artefactos |
| DGAC/AIP/IFIS | Referencia normativa y aeronáutica oficial | Según publicación, resolución, AIP y NOTAM | Enlace a fuente original; no copiar reglas cambiantes como autorización automática | El catálogo DAN distingue documentos vigentes e históricos; áreas P/R/D remiten a AIP/IFIS |

## Fuentes consultadas

- Open-Meteo: https://open-meteo.com/en/pricing y
  https://open-meteo.com/en/license
- Nominatim: https://operations.osmfoundation.org/policies/nominatim/
- OpenStreetMap: https://www.openstreetmap.org/copyright
  y https://operations.osmfoundation.org/policies/tiles/
- DGAC RPAS: https://www.dgac.gob.cl/drones/normativa
- DGAC áreas: https://www.dgac.gob.cl/drones/areas-prohibidas-restricciones
- Catálogo DAN: https://www.dgac.gob.cl/normativa/normas-dan/

No se infiere que una respuesta sin áreas, METAR o restricciones signifique
espacio libre ni operación autorizada.

## Contrato del fallback METAR

- Las candidatas se ordenan por distancia geodésica y se consultan en un máximo
  de tres para acotar tráfico y latencia.
- Solo se acepta un reporte si el ICAO contenido coincide con el endpoint
  solicitado. Respuesta vacía, NIL, malformada o sin hora válida no se presenta
  como observación utilizable.
- Una alternativa conserva su ICAO y distancia propios y se acompaña de una
  advertencia. Un reporte antiguo mantiene estado stale/error; no se etiqueta
  como actual por haber sido recibido recién.
- El catálogo sigue limitado a 11 estaciones. Auditar ICAO, nombre y coordenada
  contra publicación aeronáutica vigente y ampliar cobertura continúa pendiente;
  este hito no inventa estaciones ni asume que todo aeródromo emite METAR.
