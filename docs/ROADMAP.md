# 🚁 VantOPS Chile — Roadmap Maestro y Especificación del Proyecto

> **VantOPS Chile** es una aplicación web/PWA orientada a pilotos de RPAS/drones en Chile, diseñada para planificar operaciones, consultar condiciones reales, evaluar riesgos básicos de vuelo y mantener una bitácora local.
>
> **Estado actual:** Planificación  
> **Objetivo inicial:** MVP `1.0.0`  
> **Nombre elegido:** VantOPS (Chile)  
> **Nombre sugerido del repositorio:** `vantops-chile`  
> **Enfoque:** gratuito, público, privacy-first, mobile-first y basado en datos reales.

---

# 1. Corrección de alcance

## VantOPS Chile es un proyecto independiente

No debe mezclarse arquitectónicamente con:

- Sistema de Guardias;
- PADI/PADDS;
- Defensa Civil;
- Carro de Paro;
- Sistema de Cotizaciones.

VantOPS debe tener:

- repositorio propio;
- arquitectura propia;
- documentación propia;
- CI/CD propio;
- datos y configuración propios;
- versión propia;
- identidad visual propia.

---

# 2. Visión del producto

## 2.1 Idea central

La propuesta es una herramienta para que un piloto de RPAS pueda:

> **abrir la aplicación desde el teléfono, seleccionar el lugar de operación, consultar las condiciones reales, revisar factores relevantes y preparar el vuelo en pocos minutos.**

La idea documentada para el MVP es que el usuario pueda saber rápidamente:

> **“¿Puedo volar hoy?”**

pero evitando que la aplicación presente esa respuesta como una autorización legal.

La aplicación debe funcionar como:

- asistente;
- herramienta de planificación;
- fuente de datos;
- checklist;
- bitácora.

No como autoridad aeronáutica.

---

# 3. Principios del proyecto

## 3.1 Datos reales

La aplicación debe utilizar datos provenientes de fuentes externas identificables.

Nunca:

```text
dato inventado
dato simulado presentado como real
dato sin fecha
dato sin fuente
```

Cuando una fuente no esté disponible:

```text
NO DISPONIBLE
```

es preferible a inventar.

---

## 3.2 Privacidad

La visión inicial contempla:

```text
sin registro obligatorio
sin cuenta
sin servidor propio para datos personales
datos personales almacenados localmente
```

Esto constituye una parte central del valor del producto.

---

## 3.3 Gratis

El núcleo de VantOPS debe poder utilizarse gratuitamente.

Objetivo inicial:

```text
PWA
+
GitHub Pages
+
fuentes de datos gratuitas
+
almacenamiento local
```

---

## 3.4 Mobile-first

El principal dispositivo objetivo es:

```text
smartphone
```

porque el uso previsto ocurre:

- antes del vuelo;
- en terreno;
- en vehículos;
- en lugares sin computador.

Desktop debe existir, pero como experiencia secundaria.

---

## 3.5 Comunidad

El proyecto se concibe como una contribución abierta a pilotos de RPAS de Chile y potencialmente Latinoamérica.

Debe evitar convertirse en una aplicación cerrada alrededor de datos privados.

---

# 4. Problema que resuelve

Actualmente un piloto puede necesitar consultar varias herramientas:

```text
clima
+
mapa
+
elevación
+
posición solar
+
normativa
+
checklist
+
bitácora
```

VantOPS busca reunir ese flujo en una sola experiencia.

```text
ANTES

App clima
    +
Google Maps
    +
fuente normativa
    +
calculadora
    +
notas
    +
hoja de vuelos

DESPUÉS

             VantOPS
                │
     ┌──────────┼──────────┐
     ▼          ▼          ▼
   Clima      Mapa       Sol
     │          │          │
     └──────────┼──────────┘
                ▼
          Evaluación
                │
                ▼
           Checklist
                │
                ▼
            Bitácora
```

---

# 5. Público objetivo

## MVP

Principalmente:

- pilotos recreativos;
- pilotos profesionales;
- operadores RPAS;
- personas que necesitan preparar una operación sencilla;
- pilotos que realizan fotografía/audiovisual;
- voluntarios y organizaciones que utilizan drones en apoyo operacional.

## Futuro

Puede ampliarse hacia:

- organizaciones de emergencia;
- búsqueda y rescate;
- bomberos;
- Defensa Civil;
- inspección;
- topografía;
- agricultura;
- documentación de incidentes;
- equipos RPAS institucionales.

Esta expansión no debe entrar al MVP sin una necesidad concreta.

---

# 6. Propuesta de valor

VantOPS debería poder resumirse como:

> **“Planifica tu vuelo. Mira las condiciones reales. Revisa tu operación. Registra el vuelo.”**

Y no como:

> “VantOPS te dice si legalmente puedes volar”.

La diferencia es importante.

---

# 7. Stack técnico propuesto

La conversación definió como base:

| Capa | Tecnología | Función |
|---|---|---|
| Framework | React 19 | UI |
| Build | Vite | Desarrollo/build |
| Lenguaje | TypeScript | Tipado |
| Estilos | Tailwind CSS v4 | Diseño |
| Componentes | shadcn/ui | UI accesible |
| Mapa | Leaflet + react-leaflet | Cartografía |
| Mapa base | OpenStreetMap | Mapas |
| Clima | Open-Meteo | Pronóstico |
| Elevación | Open-Meteo Elevation | Terreno |
| Sol | SunCalc | Amanecer/atardecer |
| Estado/API | TanStack Query | Cache/requests |
| Persistencia local | IndexedDB/Dexie | Bitácora y configuración |
| PWA | vite-plugin-pwa | Instalación/offline |
| CI/CD | GitHub Actions | Verificación |
| Hosting | GitHub Pages | Publicación |
| Packaging futuro | Capacitor | Tienda móvil |

---

# 8. Arquitectura propuesta

```text
                       VantOPS Chile
                            │
                  ┌─────────┴─────────┐
                  │     React SPA     │
                  └─────────┬─────────┘
                            │
          ┌─────────────────┼──────────────────┐
          ▼                 ▼                  ▼
       UI/UX             Domain              Data
          │                 │                  │
          ▼                 ▼                  ▼
      componentes       reglas             adapters
                           │                  │
                ┌──────────┼───────┐    ┌────┼─────────┐
                ▼          ▼       ▼    ▼    ▼         ▼
              vuelo     clima    checklist OSM Open-Meteo SunCalc
                │          │       │
                └──────────┼───────┘
                           ▼
                    IndexedDB/Dexie
                           │
                           ▼
                       PWA/cache
```

## Principio fundamental

Las fuentes externas deben estar detrás de adaptadores.

Ejemplo conceptual:

```text
WeatherProvider
ElevationProvider
MapProvider
AirspaceProvider
FireProvider
SunProvider
```

Esto permitirá cambiar una fuente sin reescribir toda la aplicación.

---

# 9. Fuentes de datos

La conversación identificó las siguientes fuentes como candidatas:

## 9.1 Open-Meteo

Para:

- temperatura;
- viento;
- ráfagas;
- visibilidad;
- precipitación;
- nubosidad;
- pronóstico horario.

Objetivo:

```text
datos climáticos reales
```

**Decisión sobre altura del viento (2026-08-26):** solicitar tanto
`wind_speed_10m` como `wind_speed_100m` (con direcciones respectivas).
El semáforo evalúa por defecto contra el viento a **10 m** (criterio
conservador para despegue/aterrizaje) y muestra el viento a **100 m**
como referencia de nivel de crucero. Elegir la altura de referencia
será configurable en Ajustes (V1.1).

---

## 9.2 Open-Meteo Elevation

Para:

- elevación;
- comparación de terreno;
- referencia de altura.

Futuro:

```text
perfil de elevación
```

---

## 9.3 OpenStreetMap + Leaflet

Para:

- mapa base;
- ubicación;
- zona de operación;
- distancias;
- radios.

Debe cumplirse la atribución correspondiente.

---

## 9.4 SunCalc

Para calcular localmente:

- amanecer;
- atardecer;
- hora dorada;
- posición solar.

Ventaja:

```text
no requiere API
```

y puede funcionar offline.

---

## 9.5 OpenAIP — fase posterior

Posible integración de:

- espacios aéreos;
- aeródromos;
- CTR;
- TMA;
- zonas relevantes.

Debe considerarse una fuente de conciencia situacional y no necesariamente una fuente jurídica definitiva.

---

## 9.6 Geoportal IDE Chile

Potencialmente útil para:

- capas geográficas oficiales;
- información territorial;
- contexto nacional.

---

## 9.7 CONAF

Potencial fuente futura para:

- incendios activos;
- contexto operacional;
- capas relacionadas con emergencias.

No debe incorporarse hasta comprobar:

- disponibilidad actual;
- formato;
- licencia;
- estabilidad;
- actualización;
- cobertura.

---

## 9.8 DGAC / AIS

La aplicación debe mantener enlaces a fuentes oficiales.

Regla:

```text
VantOPS informa
DGAC/AIS determina
```

No presentar una capa propia como sustituto de la información oficial.

---

## 9.9 METAR/SPECI — observación meteorológica oficial

Los aeródromos chilenos publican observaciones METAR/SPECI a través de la
**Dirección Meteorológica de Chile (DMC)** y el sistema IFIS de la DGAC.

Ejemplo real:

```text
SPECI SCVD 260411Z AUTO 33013KT //// R35///// RA SCT019 BKN039 13/10 Q1001
```

Valor para VantOPS:

```text
pronóstico  (Open-Meteo) → planificar con anticipación
observación (METAR)      → verificar qué está pasando AHORA cerca de la zona
```

Datos decodificables: viento (dirección grados / velocidad en nudos),
visibilidad, fenómenos significativos (RA, FG…), nubes SCT/BKN/OVC con
alturas, temperatura/punto de rocío y presión QNH.

Fuentes técnicas:

- **DMC · meteochile.gob.cl** — fuente nacional oficial.
- **NOAA aviationweather.gov** — espejo mundial gratuito (JSON/TXT, sin clave),
  respaldo estable para obtención y decodificación.

Reglas horarias:

```text
los tiempos METAR son SIEMPRE UTC (sufijo Z del grupo de hora)
mostrar: «14:32 local · 17:32Z»
nunca presentar el METAR como pronóstico ni viceversa
```

Contexto horario de Chile:

```text
continental: UTC-4 estándar / UTC-3 horario de verano
Magallanes:  UTC-3 permanente
Rapa Nui:    UTC-6 estándar / UTC-5 verano
```

Estado: **Fase 1** — tarjeta «Observación más cercana» (aeródromo con METAR
más próximo a la zona), implementada como `WeatherObservationProvider` con
respaldo DMC ↔ NOAA según estabilidad verificada en desarrollo.

---

# 10. MVP — alcance inicial

La conversación ya definió seis pantallas principales.

```text
1. Panel
2. Mapa
3. Clima
4. Checklist
5. Bitácora
6. Ajustes
```

---

# 11. Pantalla 1 — Panel

Debe ser el centro del sistema.

## Objetivo

Responder rápidamente:

```text
¿Dónde voy a volar?
¿Cómo están las condiciones?
¿Qué debo revisar?
```

## Diseño conceptual

```text
┌────────────────────────────────────┐
│ VantOPS                            │
│                                    │
│ 📍 Coquimbo                        │
│                                    │
│        ¿PUEDO VOLAR?               │
│             🟢                     │
│       CONDICIONES FAVORABLES       │
│                                    │
│ 🌬 Viento        12 km/h           │
│ 💨 Ráfagas       20 km/h           │
│ 👁 Visibilidad   10 km             │
│ 🌧 Lluvia        0%                │
│ ☀ Atardecer      18:42             │
│                                    │
│ [ Revisar vuelo ]                  │
└────────────────────────────────────┘
```

---

# 12. El semáforo “¿Puedo volar?”

Esta funcionalidad necesita especial cuidado.

## No debe significar

```text
AUTORIZADO
```

Debe significar algo como:

```text
CONDICIONES FAVORABLES
REVISIÓN NECESARIA
CONDICIONES DESFAVORABLES
```

## Ejemplo

```text
🟢 FAVORABLE
🟡 REVISAR
🔴 DESFAVORABLE
⚫ SIN DATOS
```

---

# 13. Motor de evaluación

El semáforo debe ser explicable.

Nunca:

```text
🔴 NO
```

sin explicación.

Debe mostrar:

```text
🔴 Condiciones desfavorables

Motivos:
• ráfagas superiores a tu límite configurado
• lluvia prevista
```

o:

```text
🟡 Revisión necesaria

Motivos:
• viento cercano al límite
• visibilidad no disponible
```

---

# 14. Configuración del dron

Cada usuario debe poder configurar parámetros locales.

Propuesta:

```text
Nombre del dron
Fabricante
Modelo
Peso
Tipo
Velocidad máxima
Viento máximo recomendado
Autonomía estimada
Batería
```

No todos necesitan entrar al MVP.

---

# 15. Perfil de aeronave

La evolución debe permitir:

```text
Mis equipos
│
├── DJI Mini
├── DJI Air
├── FPV
└── Otro
```

El piloto selecciona:

```text
[Aeronave activa]
```

y VantOPS utiliza sus parámetros.

---

# 16. Parámetros de riesgo configurables

No imponer universalmente una única cifra.

Permitir:

```text
Límite de viento
Límite de ráfaga
Límite de precipitación
Visibilidad mínima
Temperatura mínima/máxima
```

y claramente etiquetar:

```text
Preferencias del piloto
```

No:

```text
Límites legales
```

---

# 17. Pantalla 2 — Mapa

## Funciones MVP

- localización actual;
- búsqueda;
- selección de punto;
- marcador;
- radio;
- medición;
- zona de operación.

---

# 18. Zona de operación

Permitir:

```text
punto central
+
radio
```

por ejemplo:

```text
500 m
1 km
2 km
personalizado
```

Pero el radio debe ser una herramienta de planificación.

No debe interpretarse automáticamente como perímetro permitido legalmente.

---

# 19. Geometría futura

La versión posterior puede soportar:

```text
círculo
polígono
ruta
múltiples puntos
```

Ejemplo:

```text
P1 ───── P2
│         │
│   zona  │
│         │
P4 ───── P3
```

---

# 20. Elevación

Para la zona seleccionada:

```text
altura terreno
diferencia de elevación
perfil
```

Futuro:

```text
perfil horizontal
```

y:

```text
punto más alto
punto más bajo
diferencia
```

---

# 21. Pantalla 3 — Clima

Debe existir una experiencia dedicada.

## Datos horarios

```text
00:00
01:00
02:00
...
23:00
```

Con:

- temperatura;
- viento;
- ráfaga;
- visibilidad;
- lluvia;
- nubosidad.

---

# 22. Visualización climática

No depender solo de números.

Ejemplo:

```text
16:00  🌬 12 km/h
       💨 19 km/h

17:00  🌬 14 km/h
       💨 23 km/h

18:00  🌬 18 km/h
       💨 29 km/h
```

Mostrar tendencia.

---

# 23. Dirección del viento

La evolución debe mostrar:

```text
→ 12 km/h
↗ 15 km/h
↑ 18 km/h
```

La dirección puede ser especialmente útil para:

- planificación;
- fotografía;
- operaciones cercanas a obstáculos;
- evaluación práctica.

---

# 24. Ventana de operación

Funcionalidad avanzada recomendada.

El sistema puede identificar una franja donde los criterios configurados sean favorables.

Ejemplo:

```text
08:00 ─────────────────── 20:00

       🟢🟢🟢🟢🟢🟡🔴🔴

Mejor ventana:
10:00–15:00
```

Importante:

> “mejor ventana” no significa “vuelo autorizado”.

---

# 25. Sol y luminosidad

Mostrar:

```text
🌅 Amanecer
🌇 Atardecer
✨ Hora dorada
```

También:

```text
duración de luz diurna
```

---

# 26. Pantalla 4 — Checklist prevuelo

El checklist debe ser interactivo.

## Categorías

```text
DOCUMENTACIÓN
EQUIPO
AERONAVE
BATERÍA
ENTORNO
CLIMA
OPERACIÓN
POST-VUELO
```

---

# 27. Checklist configurable

Ejemplo:

```text
☐ Batería cargada
☐ Hélices revisadas
☐ Firmware
☐ GNSS
☐ RTH configurado
☐ Zona evaluada
☐ Clima revisado
☐ Entorno revisado
☐ Equipo de control
☐ Tarjeta SD
```

---

# 28. Checklist ligado al contexto

No mostrar siempre todo.

Si:

```text
lluvia > 0
```

mostrar:

```text
⚠ Revisa condiciones de precipitación
```

Si:

```text
operación nocturna
```

mostrar:

```text
⚠ Checklist específico
```

La lógica debe ser modular.

---

# 29. Referencias normativas

La app debe mostrar:

```text
Referencia oficial
Última consulta
Enlace
```

Nunca copiar grandes bloques de normativa.

Ejemplo:

```text
Normativa RPAS
[Consultar fuente oficial DGAC]
```

---

# 30. Disclaimer obligatorio

Toda evaluación debe dejar claro:

> VantOPS es una herramienta de apoyo a la planificación. No sustituye la normativa vigente, las publicaciones aeronáuticas, permisos, autorizaciones ni las instrucciones de las autoridades competentes.

El texto definitivo debe revisarse antes del lanzamiento público.

---

# 31. Pantalla 5 — Bitácora

Debe permitir registrar localmente:

```text
fecha
ubicación
aeronave
duración
batería
observaciones
```

---

# 32. Bitácora de vuelos

Ejemplo:

```text
26-08-2026
Coquimbo
DJI Mini
18 min
2 baterías
```

---

# 33. Persistencia local

La conversación propuso:

```text
IndexedDB
+
Dexie
```

sobre:

```text
localStorage
```

para datos estructurados.

## Regla

```text
localStorage
→ preferencias pequeñas

IndexedDB
→ vuelos
→ baterías
→ configuraciones más complejas
```

---

# 34. Registro de baterías

Funcionalidad propuesta:

```text
Batería 01
ciclos: 42
salud estimada: ?
último uso:
observaciones:
```

No inventar métricas de salud que el dron no proporcione.

---

# 35. Pantalla 6 — Ajustes

```text
Mi aeronave
Límites personales
Unidades
Tema
Idioma
Privacidad
Datos locales
```

---

# 36. Importación/exportación

Muy recomendable.

Permitir:

```text
Exportar mis datos
```

a:

```text
JSON
CSV
```

y:

```text
Importar respaldo
```

Esto evita que "sin cuenta" signifique "sin posibilidad de respaldar".

---

# 37. Privacidad reforzada

La aplicación debería incorporar:

```text
Mis datos
 ├── Exportar
 ├── Importar
 ├── Borrar todo
 └── Ver almacenamiento
```

---

# 38. Sin registro

MVP:

```text
NO LOGIN
NO PASSWORD
NO CUENTA
```

Si posteriormente se incorpora sincronización multi-dispositivo, debe ser una funcionalidad opt-in.

---

# 39. Sincronización futura

La conversación plantea como opción de `v2`:

```text
Supabase
```

pero únicamente como futura sincronización.

Arquitectura:

```text
Modo local
   ↓
usuario decide sincronizar
   ↓
cuenta opcional
   ↓
cloud
```

No convertir la nube en requisito del MVP.

---

# 40. PWA

El MVP debe ser instalable.

Objetivos:

```text
Instalable
Offline básico
Icono
Splash
Cache
Service worker
```

---

# 41. Offline-first

## Disponible offline

- ajustes;
- aeronaves;
- bitácora;
- checklist;
- SunCalc;
- datos previamente almacenados.

## No necesariamente disponible offline

- clima nuevo;
- fuentes externas;
- información dinámica de espacio aéreo.

Mostrar siempre:

```text
última actualización
```

---

# 42. Estado de datos

Cada fuente debe mostrar:

```text
🟢 Actualizado
🟡 Antiguo
🔴 Error
⚫ Sin datos
```

Ejemplo:

```text
Clima
Actualizado hace 8 min
```

Esto es crítico cuando se usan datos para decisiones operativas.

---

# 43. Timestamp de fuentes

Cada consulta externa debería conservar:

```text
requestedAt
receivedAt
validFrom
validTo
source
```

para poder explicar qué información estaba usando el usuario.

---

# 44. Cache de fuentes

TanStack Query puede gestionar:

```text
cache
stale
loading
error
refetch
```

No obstante, el diseño debe establecer TTL por fuente.

Ejemplo conceptual:

```text
clima:
5–15 min

elevación:
mucho mayor

SunCalc:
local

mapa:
cache browser
```

Los tiempos definitivos deben configurarse según cada proveedor.

---

# 45. Arquitectura de proveedores

Propuesta:

```text
src/
├── providers/
│   ├── weather/
│   ├── elevation/
│   ├── maps/
│   ├── solar/
│   ├── airspace/
│   └── hazards/
```

Cada provider debe normalizar su salida.

---

# 46. Modelo común de datos

Ejemplo:

```typescript
WeatherSnapshot {
  source: string
  timestamp: string
  location: Coordinate
  current: WeatherCurrent
  hourly: WeatherPoint[]
  status: DataStatus
}
```

La aplicación no debería depender directamente del JSON crudo de Open-Meteo.

---

# 47. Coordenadas

Usar una representación única:

```text
latitude
longitude
```

y centralizar:

- precisión;
- validación;
- serialización;
- formato.

---

# 48. Unidades

Configurar:

```text
km/h
m/s
knots
°C
°F
m
ft
```

El usuario debe poder cambiar unidades.

El almacenamiento interno debe utilizar unidades canónicas.

---

# 49. Internacionalización

MVP:

```text
es-CL
```

Futuro:

```text
es
en
pt
```

No mezclar strings directamente en componentes.

Usar catálogo de traducciones desde el inicio.

---

# 50. Tema visual

Concepto discutido:

> **dark cockpit**

Características:

- fondo oscuro;
- alto contraste;
- verdes/ámbar/rojos de estado;
- mapas protagonistas;
- jerarquía clara;
- botones grandes;
- buena lectura exterior.

No exagerar el estilo "militar".

La aplicación debe verse:

```text
profesional
aeronáutica
moderna
sobria
```

---

# 51. Componentes principales

```text
AppShell
Dashboard
FlightLocation
MapView
WeatherPanel
WeatherTimeline
SunPanel
FlightAssessment
Checklist
AircraftSelector
FlightLog
BatteryLog
Settings
DataSourceBadge
OfflineBanner
Disclaimer
```

---

# 52. UX del flujo principal

```text
Abrir VantOPS
      ↓
Ubicación
      ↓
Condiciones
      ↓
Evaluación
      ↓
Mapa
      ↓
Checklist
      ↓
Volar
      ↓
Registrar
```

Objetivo:

> el usuario no debería necesitar navegar por diez pantallas diferentes para planificar un vuelo simple.

---

# 53. Evaluación explicable

Motor:

```text
INPUT
│
├── viento
├── ráfaga
├── visibilidad
├── lluvia
├── hora solar
├── configuración del dron
└── datos disponibles
       │
       ▼
   EVALUATOR
       │
       ▼
RESULT
```

Resultado:

```json
{
  "status": "CAUTION",
  "reasons": [
    "Ráfagas cercanas al límite configurado"
  ],
  "missingData": [],
  "evaluatedAt": "..."
}
```

---

# 54. Estado cuando faltan datos

Nunca:

```text
sin visibilidad → asumir buena visibilidad
```

Sino:

```text
🟡 Datos incompletos
```

---

# 55. Seguridad contra falsa precisión

VantOPS no debe presentar:

```text
“83% seguro”
```

o:

```text
“92% de autorización”
```

porque daría una falsa impresión de precisión.

Usar:

```text
Favorable
Revisión necesaria
Desfavorable
Sin datos
```

---

# 56. Riesgos contextuales

El motor puede incluir en el futuro:

```text
clima
sol
terreno
espacio aéreo
incendios
áreas sensibles
```

pero cada criterio debe mostrar su fuente.

---

# 57. Espacio aéreo

## MVP

Mostrar enlace/información contextual.

## v2

Integración de OpenAIP u otra fuente apropiada.

## Regla de producto

Nunca mostrar:

```text
“Zona permitida”
```

si el sistema solo posee información cartográfica.

Preferir:

```text
“Posible restricción / revisar fuente oficial”
```

---

# 58. Aeródromos

Futuro:

```text
aeródromo cercano
distancia
tipo
fuente
```

Alerta:

```text
⚠ Existe un aeródromo cercano.
Revisa información aeronáutica oficial antes de operar.
```

---

# 59. Obstáculos

La conversación identifica esto como un área potencial mediante datos abiertos.

No debe prometerse cobertura completa.

Diferenciar:

```text
dato disponible
dato no disponible
cobertura desconocida
```

---

# 60. Incendios / emergencias

En una evolución futura:

```text
🔥 incendio cercano
```

podría ser una alerta contextual.

Especialmente útil para:

- pilotos voluntarios;
- emergencias;
- operaciones de reconocimiento.

Pero no debe convertirse en el MVP hasta definir:

- fuente;
- actualización;
- cobertura;
- licencia;
- responsabilidad.

---

# 61. Geofencing informativo

No bloquear el vuelo automáticamente.

Mapa:

```text
🟢 información
🟡 revisar
🔴 atención
```

No:

```text
“app permite / prohíbe”
```

---

# 62. Arquitectura de evaluación

Separar:

```text
Weather
Terrain
Solar
Airspace
Hazards
Aircraft
```

y después:

```text
FlightAssessment
```

Ejemplo:

```text
WeatherAssessment
TerrainAssessment
AirspaceAssessment
SolarAssessment
AircraftAssessment
        │
        ▼
CompositeAssessment
```

---

# 63. Auditabilidad del semáforo

Para cada resultado guardar localmente:

```text
momento
ubicación
fuentes
parámetros
criterios activos
resultado
```

Esto permite mostrar:

> “La evaluación se generó a las 14:32 con el clima disponible en ese momento”.

---

# 64. Historial de evaluaciones

Futuro:

```text
Evaluaciones recientes
├── 26/08 14:32
├── 24/08 11:20
└── 20/08 17:08
```

No es necesario almacenar indefinidamente.

---

# 65. Bitácora profesional

Evolución:

```text
Vuelo
├── fecha
├── aeronave
├── ubicación
├── duración
├── baterías
├── observaciones
├── evaluación previa
└── incidencias
```

---

# 66. Exportación de bitácora

Formatos:

```text
CSV
JSON
PDF
```

PDF como funcionalidad posterior.

---

# 67. Backup local

Una PWA sin cuenta necesita una estrategia:

```text
Exportar respaldo
```

El usuario debe poder guardar un archivo.

---

# 68. Recuperación

```text
Importar respaldo
 ↓
validar versión
 ↓
migrar si corresponde
 ↓
cargar
```

---

# 69. Versionado de datos locales

IndexedDB debe incluir:

```text
schemaVersion
```

Ejemplo:

```text
schema 1
schema 2
```

con migraciones internas.

---

# 70. Telemetría

La visión inicial es privacy-first.

Por ello:

```text
NO analytics personales obligatorios
```

Si algún día se incorpora analítica:

- anonimizada;
- opt-in;
- documentada.

---

# 71. Seguridad frontend

Evitar:

- secretos en frontend;
- claves permanentes;
- endpoints privados;
- datos personales enviados innecesariamente.

---

# 72. API keys

Si una fuente futura requiere clave:

```text
NO ponerla directamente en React
```

Alternativas:

```text
backend/proxy
worker
edge function
```

pero esto debe introducirse solo cuando sea necesario.

El MVP debe priorizar fuentes sin clave, como se planteó en la conversación.

---

# 73. CORS y fuentes externas

Cada provider debe considerar:

```text
CORS
rate limits
errores
timeout
cambios de API
```

La interfaz debe soportar:

```text
source unavailable
```

sin romper el resto de VantOPS.

---

# 74. Arquitectura de fallos

Si falla clima:

```text
Mapa sigue funcionando
SunCalc sigue funcionando
Checklist sigue funcionando
Bitácora sigue funcionando
```

No debe fallar toda la aplicación.

---

# 75. Prácticas de desarrollo

```text
feature branch
 ↓
lint
 ↓
typecheck
 ↓
tests
 ↓
build
 ↓
preview
 ↓
merge
```

---

# 76. CI/CD

GitHub Actions:

```text
npm install
npm run lint
npm run typecheck
npm test
npm run build
```

Y posteriormente:

```text
deploy GitHub Pages
```

---

# 77. Calidad

No aprobar un release solo porque:

```text
npm run build
```

funciona.

Debe comprobarse:

```text
funcionamiento móvil
PWA
mapa
API
offline
IndexedDB
evaluación
```

---

# 78. Tests unitarios

Probar especialmente:

```text
evaluación del viento
evaluación de ráfagas
evaluación de lluvia
unidades
conversión
fechas
horarios
SunCalc
persistencia
migraciones
```

---

# 79. Tests de provider

Por cada fuente:

```text
success
empty
timeout
malformed
rate limit
network error
```

---

# 80. Tests de evaluación

Casos:

```text
datos favorables
datos desfavorables
datos incompletos
límite exacto
superación del límite
sin configuración
```

---

# 81. Tests PWA

Verificar:

```text
installability
manifest
service worker
offline
cache
restore
```

---

# 82. Tests móviles

Probar al menos:

```text
Android Chrome
iOS Safari
desktop Chrome
desktop Firefox
```

La compatibilidad exacta se amplía según demanda.

---

# 83. Rendimiento

Metas iniciales orientativas:

```text
LCP razonable
interacción rápida
bundle controlado
mapa fluido
cache eficiente
```

No cargar todas las fuentes al iniciar.

---

# 84. Carga progresiva

Orden:

```text
UI
 ↓
ubicación
 ↓
clima
 ↓
mapa
 ↓
evaluación
 ↓
capas secundarias
```

---

# 85. Lazy loading

Candidatos:

```text
mapa pesado
PDF
gráficos
capas especiales
```

---

# 86. Bundle

Evitar dependencia innecesaria.

Antes de agregar una librería:

```text
¿realmente necesaria?
¿se puede resolver con Web API?
¿aumenta mucho el bundle?
```

---

# 87. Accesibilidad

Obligatorio:

- contraste;
- navegación por teclado;
- labels;
- foco;
- botones táctiles;
- mensajes de error;
- no depender solo de color.

---

# 88. Mapas y accesibilidad

Los mapas son visuales.

Debe existir alternativa textual:

```text
Ubicación:
Coordenadas:
Elevación:
Radio:
```

---

# 89. Privacidad visible

La app debe explicar claramente:

```text
Tus vuelos se guardan en este dispositivo.
No necesitas crear una cuenta.
```

---

# 90. Gestión de permisos del dispositivo

Solicitar solo cuando sea necesario.

Especialmente:

```text
geolocalización
```

No pedir:

```text
cámara
micrófono
contactos
```

si no forman parte del MVP.

---

# 91. Geolocalización

Flujo:

```text
¿Permitir ubicación?
   │
   ├── sí
   │    ↓
   │  posición actual
   │
   └── no
        ↓
     búsqueda manual
```

La aplicación no debe quedar inutilizable si el usuario rechaza ubicación.

---

# 92. Búsqueda de ubicación

Permitir:

```text
buscar dirección
buscar localidad
usar coordenadas
usar ubicación actual
```

**Decisión (2026-08-26):** usar **Nominatim** (OpenStreetMap) para búsqueda de
direcciones/localidades, respetando su política de uso justo (~1 req/s con
caché y debounce), más ingreso manual de coordenadas siempre disponible.

Criterios aplicados:

- límites;
- licencia;
- disponibilidad;
- privacidad.

---

# 93. Consumo de API

No llamar constantemente.

Usar:

```text
cache
debounce
refetch inteligente
```

Por ejemplo:

```text
mover mapa
→ esperar
→ consultar
```

en vez de:

```text
cada pixel
```

---

# 94. Gestión de ubicación

Evitar enviar coordenadas continuamente.

La ubicación del usuario puede permanecer local.

Solo enviar la coordenada necesaria a la fuente de datos que el usuario esté utilizando.

---

# 95. Transparencia de fuentes

Cada dato importante debería poder responder:

```text
¿Qué fuente utilizaste?
¿Cuándo fue actualizado?
```

Ejemplo:

```text
Viento
Open-Meteo
actualizado 14:21
```

---

# 96. Licencias y atribución

Mantener una sección:

```text
Fuentes y atribuciones
```

para:

- OpenStreetMap;
- Open-Meteo;
- librerías;
- datasets;
- fuentes oficiales.

No asumir que "gratis" significa "sin atribución".

---

# 97. Licencia del proyecto

La conversación planteó:

```text
MIT
```

como opción para el código.

**Decisión pendiente.**

Antes de fijarla debe revisarse:

- datos externos;
- assets;
- mapas;
- fuentes;
- contenido normativo;
- atribuciones.

---

# 98. Diseño de navegación

```text
VantOPS
│
├── Inicio
├── Mapa
├── Clima
├── Checklist
├── Bitácora
└── Ajustes
```

No crear una navegación de diez niveles.

---

# 99. Quick Actions

Desde Inicio:

```text
[Usar mi ubicación]
[Planificar vuelo]
[Ver clima]
[Checklist]
[Registrar vuelo]
```

---

# 100. Modo “vuelo”

Evolución futura.

Una interfaz simplificada:

```text
        14:32

     🟢 CONDICIONES
       FAVORABLES

Viento 12 km/h
Ráfaga 18 km/h

Batería:
████████░░ 82%

[Registrar evento]
```

No necesariamente incluye telemetría del dron.

---

# 101. Bitácora rápida

Después de aterrizar:

```text
¿Registrar vuelo?

[Guardar]
[Omitir]
```

con datos mínimos.

---

# 102. Incidencias de vuelo

La bitácora futura puede registrar:

```text
Incidencia
Batería
Clima
Pérdida de señal
RTH
Aterrizaje inesperado
Observaciones
```

No asumir causas automáticamente.

---

# 103. Seguridad de almacenamiento local

IndexedDB no es una caja fuerte.

Por ello:

- no almacenar secretos;
- no almacenar credenciales;
- explicar que borrar datos del navegador puede eliminar información;
- ofrecer exportación.

---

# 104. Exportación periódica

Mensaje opcional:

```text
Hace 30 días que no exportas tu bitácora.
¿Crear respaldo?
```

Debe ser configurable.

---

# 105. Roadmap de funcionalidades

## Fase 0 — Base técnica

```text
[ ] crear repo
[ ] React
[ ] Vite
[ ] TypeScript
[ ] Tailwind
[ ] shadcn
[ ] estructura
[ ] lint
[ ] tests
[ ] CI
[ ] GitHub Pages
```

**Resultado:**

PWA mínima pública.

---

# 106. Fase 1 — Datos reales

```text
[ ] Open-Meteo
[ ] mapa OSM
[ ] Leaflet
[ ] ubicación
[ ] clima
[ ] SunCalc
[ ] elevación
[ ] timestamps
[ ] estados de fuente
```

**Resultado:**

El usuario puede consultar condiciones reales.

---

# 107. Fase 2 — Planificación

```text
[ ] zona de vuelo
[ ] radio
[ ] evaluación
[ ] semáforo
[ ] motivos
[ ] configuración del dron
```

**Resultado:**

Herramienta de apoyo a decisión.

---

# 108. Fase 3 — Checklist

```text
[ ] checklist
[ ] categorías
[ ] persistencia
[ ] checklist contextual
[ ] completitud
```

---

# 109. Fase 4 — Bitácora

```text
[ ] vuelos
[ ] aeronaves
[ ] baterías
[ ] exportación JSON
[ ] importación
```

---

# 110. Fase 5 — PWA completa

```text
[ ] offline
[ ] service worker
[ ] install prompt
[ ] iconos
[ ] splash
[ ] cache
[ ] recuperación
```

---

# 111. Fase 6 — Lanzamiento comunitario

```text
[ ] README
[ ] documentación
[ ] disclaimer
[ ] fuentes
[ ] demo
[ ] screenshots
[ ] GitHub Pages
[ ] difusión
```

---

# 112. Fase 7 — V2

Ideas discutidas:

```text
[ ] OpenAIP
[ ] capas de espacio aéreo
[ ] fuentes de emergencia
[ ] Capacitor
[ ] Play Store
[ ] sincronización opcional
[ ] Supabase
[ ] PDF
[ ] bitácora profesional
```

Nada de esto debe retrasar el MVP.

---

# 113. Priorización

## P0 — obligatorio

```text
clima
mapa
ubicación
elevación
SunCalc
evaluación básica
checklist
bitácora local
PWA
privacidad
disclaimer
```

## P1 — muy recomendable

```text
export/import
perfil de aeronave
unidades
caché
estado de fuentes
CI/CD
```

## P2 — evolución

```text
OpenAIP
aeródromos
capas de riesgos
incendios
PDF
sincronización
```

## P3 — producto móvil

```text
Capacitor
Play Store
App Store
```

---

# 114. Lo que NO debe entrar en MVP

No agregar todavía:

```text
login obligatorio
red social
chat
telemetría completa
servidor propio
base SQL
microservicios
IA para "autorizar vuelos"
sistema de reservas
marketplace
```

---

# 115. IA — posible futuro

La IA puede utilizarse para:

```text
resumir condiciones
explicar alertas
ayudar a interpretar datos
```

Pero no para:

```text
decidir legalidad
sustituir normativa
inventar información
```

Ejemplo futuro:

> “Las condiciones muestran ráfagas cercanas al límite que configuraste. Revisa especialmente el comportamiento del viento antes de operar.”

La fuente sigue siendo el dato real, no la IA.

---

# 116. Arquitectura de dominio futura

```text
domain/
├── aircraft
├── weather
├── location
├── solar
├── flight
├── checklist
├── assessment
├── battery
└── sources
```

---

# 117. Estructura de proyecto propuesta

```text
vantops-chile/
│
├── public/
│   ├── icons/
│   ├── manifest/
│   └── screenshots/
│
├── src/
│   ├── app/
│   ├── components/
│   ├── features/
│   │   ├── dashboard/
│   │   ├── map/
│   │   ├── weather/
│   │   ├── checklist/
│   │   ├── flight-log/
│   │   ├── batteries/
│   │   └── settings/
│   │
│   ├── domain/
│   │   ├── aircraft/
│   │   ├── assessment/
│   │   ├── flight/
│   │   └── ...
│   │
│   ├── providers/
│   ├── services/
│   ├── storage/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   └── i18n/
│
├── tests/
├── docs/
├── .github/
│   └── workflows/
│
├── README.md
├── LICENSE
├── SECURITY.md
└── package.json
```

---

# 118. Organización por features

Cada feature debería encapsular:

```text
UI
hooks
types
services
tests
```

Ejemplo:

```text
features/weather/
├── WeatherPanel.tsx
├── weather.service.ts
├── weather.types.ts
├── weather.mapper.ts
└── weather.test.ts
```

Esto permite crecer sin convertir `App.tsx` en un archivo gigante.

---

# 119. TypeScript

Usar tipado estricto.

Objetivo:

```text
strict: true
```

Evitar:

```text
any
```

salvo casos justificados.

---

# 120. Validación de datos

Toda API externa debería pasar por:

```text
fetch
 ↓
schema validation
 ↓
mapper
 ↓
domain model
```

Una librería como Zod puede considerarse.

**Decisión futura.**

---

# 121. Errores por proveedor

Ejemplo:

```text
WEATHER_TIMEOUT
WEATHER_INVALID_RESPONSE
ELEVATION_ERROR
MAP_ERROR
GEOLOCATION_DENIED
STORAGE_ERROR
```

---

# 122. Fuentes independientes

Si falla Open-Meteo:

```text
no asumir datos
```

Mostrar:

```text
⚫ clima no disponible
```

y permitir:

```text
seguir trabajando con mapa/checklist/bitácora
```

---

# 123. Diseño del dashboard

## Jerarquía

1. ubicación;
2. estado;
3. factores críticos;
4. acción;
5. detalles;
6. fuente.

---

# 124. Dashboard detallado

```text
┌────────────────────────────────────────┐
│ 📍 Coquimbo                            │
│                                        │
│       🟡 REVISIÓN NECESARIA           │
│                                        │
│ 🌬 Viento      14 km/h                 │
│ 💨 Ráfagas     25 km/h                 │
│ 👁 Visibilidad 10 km                    │
│ 🌧 Precip.     0%                       │
│ 🌇 Luz         5h 20m                  │
│                                        │
│ Motivo principal:                      │
│ ráfagas cercanas a tu límite.         │
│                                        │
│ [Ver detalles] [Checklist]             │
└────────────────────────────────────────┘
```

---

# 125. Vista de datos

La UI debe tener una pantalla de detalles para usuarios que quieran profundizar.

```text
Clima
├── actual
├── próxima hora
├── próximas horas
└── próximos días

Fuente:
Open-Meteo
Actualización:
14:21
```

---

# 126. Estado de fuente

Cada tarjeta puede incluir:

```text
● Datos actualizados
```

y al pulsar:

```text
Fuente
Hora
Licencia / atribución
```

---

# 127. Ubicación y mapa

La aplicación debe recordar opcionalmente:

```text
última ubicación
```

pero no transmitirla automáticamente.

---

# 128. Favoritos

Futuro:

```text
Mis lugares
├── Casa
├── Campo
├── Playa
└── Trabajo
```

Todo local.

---

# 129. Plantillas de vuelo

Futuro:

```text
Vuelo recreativo
Fotografía
Inspección
Emergencia
Práctica
```

Cada plantilla podría cambiar el checklist.

---

# 130. Perfil de operación

Evolución:

```text
Tipo de operación
Duración
Objetivo
Aeronave
Zona
Checklist
```

---

# 131. Plan de vuelo local

Futuro:

```text
FlightPlan
├── ubicación
├── geometría
├── tiempo estimado
├── aeronave
├── condiciones
├── checklist
└── observaciones
```

---

# 132. Guardado de plan

Permitir:

```text
Guardar plan
Editar
Duplicar
Archivar
Eliminar
```

---

# 133. Comparación histórica

Futuro:

```text
Hoy
vs
último vuelo
```

por ejemplo:

```text
viento
ráfagas
duración
batería
```

Solo si resulta útil para el piloto.

---

# 134. Baterías

Evolución:

```text
Battery
├── id local
├── nombre
├── ciclos
├── vuelos
└── observaciones
```

No fingir capacidades que no existen en el hardware.

---

# 135. Reporte post-vuelo

Futuro:

```text
Vuelo completado
Duración
Batería
Observaciones
Incidentes
```

con opción:

```text
Exportar
```

---

# 136. PDF

No prioridad para MVP.

Debe llegar después de que:

```text
modelo de datos
+
bitácora
```

estén estables.

---

# 137. Tiendas de aplicaciones

La conversación acordó una estrategia razonable:

## v1

```text
PWA
```

## v2

```text
Capacitor
↓
Google Play
```

## Posterior

```text
App Store
```

Esto evita bloquear el proyecto por costes o infraestructura móvil.

---

# 138. GitHub Pages

Objetivo:

```text
push
 ↓
CI
 ↓
build
 ↓
deploy
 ↓
URL pública
```

---

# 139. Dominio futuro

Opcional:

```text
vantops.cl
```

o subdominio.

No es necesario para MVP.

---

# 140. Documentación del repositorio

```text
README.md
docs/
├── ARCHITECTURE.md
├── DATA-SOURCES.md
├── PRIVACY.md
├── SAFETY.md
├── CONTRIBUTING.md
├── CHANGELOG.md
└── ROADMAP.md
```

---

# 141. Página de fuentes

Debe incluir:

```text
fuente
uso
fecha de consulta
atribución
enlace
```

Esto será especialmente importante si VantOPS se vuelve público.

---

# 142. Transparencia de cobertura

La aplicación debe declarar:

```text
Cobertura
```

por fuente.

No afirmar:

> “VantOPS cubre toda la información aérea de Chile”

si eso no puede demostrarse.

---

# 143. Modelo de responsabilidad

VantOPS es:

```text
herramienta de apoyo
```

No:

```text
autoridad
```

Esto debe reflejarse:

- en UI;
- documentación;
- README;
- disclaimer;
- textos de evaluación.

---

# 144. Condiciones de lanzamiento

No lanzar públicamente el MVP hasta verificar:

```text
[ ] clima real
[ ] ubicación
[ ] mapa
[ ] cálculo solar
[ ] elevación
[ ] evaluación explicable
[ ] checklist
[ ] bitácora
[ ] exportación
[ ] PWA
[ ] offline
[ ] disclaimer
[ ] atribución
[ ] privacidad
```

---

# 145. Criterios de éxito MVP

El MVP puede considerarse exitoso si:

```text
1. Se instala en teléfono.
2. Funciona correctamente en móvil.
3. Permite seleccionar ubicación.
4. Muestra clima real.
5. Muestra mapa real.
6. Muestra elevación.
7. Calcula información solar.
8. Explica su semáforo.
9. Permite checklist.
10. Registra vuelo localmente.
11. Permite exportar los datos.
12. Puede funcionar parcialmente offline.
13. No exige cuenta.
14. Identifica las fuentes utilizadas.
15. No se presenta como autoridad aeronáutica.
```

---

# 146. Roadmap detallado

> **Supuesto de estimación (2026-08-26):** desarrollo individual a tiempo
> parcial (~8–10 h/semana). Duración total estimada del MVP: **10–12 semanas**
> (≈ 3 meses calendario). Incluye tests y CI por fase; no incluye difusión.

## RELEASE 0.1 — Foundation · *≈ 1 semana*

```text
[ ] Repo
[ ] React/Vite/TS
[ ] Tailwind
[ ] UI base
[ ] routing
[ ] theme
[ ] typecheck
[ ] lint
[ ] tests
[ ] GitHub Actions
[ ] GitHub Pages
```

---

## RELEASE 0.2 — Data Core · *≈ 2 semanas*

```text
[ ] Open-Meteo
[ ] mapa
[ ] geolocalización
[ ] SunCalc
[ ] elevation
[ ] METAR más cercano — tarjeta «Observación» (DMC/NOAA)
[ ] cache
[ ] data freshness
```

---

## RELEASE 0.3 — Flight Assessment · *≈ 1–2 semanas*

```text
[ ] aircraft profile
[ ] limits
[ ] evaluator
[ ] explanation
[ ] semáforo
```

---

## RELEASE 0.4 — Checklist · *≈ 1 semana*

```text
[ ] checklist engine
[ ] default checklist
[ ] persistent state
[ ] contextual items
```

---

## RELEASE 0.5 — Logbook · *≈ 2 semanas*

```text
[ ] flights
[ ] batteries
[ ] IndexedDB
[ ] export
[ ] import
```

---

## RELEASE 0.6 — PWA · *≈ 1 semana*

```text
[ ] manifest
[ ] service worker
[ ] offline
[ ] install
[ ] icons
[ ] offline states
```

---

## RELEASE 0.7 — Polish · *≈ 1–2 semanas*

```text
[ ] responsive
[ ] accessibility
[ ] visual polish
[ ] performance
[ ] error handling
```

---

## RELEASE 0.8 — Public beta · *≈ 1 semana* (+ retro externa en paralelo)

```text
[ ] README
[ ] documentation
[ ] source attribution
[ ] disclaimer
[ ] security review
[ ] beta testing
```

---

## RELEASE 1.0.0 — MVP público · corte final

```text
[ ] release tag
[ ] public PWA
[ ] stable APIs
[ ] backup/import
[ ] documentation
[ ] known limitations
```

---

# 147. V2

## Espacio aéreo

```text
[ ] OpenAIP
[ ] aeródromos
[ ] zonas
[ ] overlays
[ ] advertencias contextuales
```

## Emergencias

```text
[ ] incendios
[ ] capas oficiales
[ ] alertas
```

## Sincronización

```text
[ ] cuenta opcional
[ ] Supabase
[ ] múltiples dispositivos
```

## Móvil

```text
[ ] Capacitor
[ ] Google Play
```

## Reportería

```text
[ ] PDF
[ ] informes
```

---

# 148. V3 — Plataforma

Solo si existe adopción suficiente:

```text
[ ] equipos
[ ] organizaciones
[ ] operaciones
[ ] sincronización
[ ] colaboración
[ ] permisos
[ ] historial compartido
```

No asumir que V3 será necesaria.

---

# 149. Qué debe permanecer local

Por defecto:

```text
vuelos
baterías
ajustes
aeronaves
favoritos
checklists
```

---

# 150. Qué puede ser externo

```text
mapas
clima
elevación
fuentes aéreas
capas públicas
```

---

# 151. Modo de privacidad máximo

En el modo predeterminado:

```text
local-only
```

El usuario debería poder utilizar el sistema sin crear identidad digital.

---

# 152. Exportación de diagnóstico

Permitir generar un:

```text
diagnostic.json
```

con:

```text
versión
browser
PWA
fuentes
estado
errores
```

sin coordenadas personales salvo que el usuario lo elija.

---

# 153. Soporte técnico

Crear una pantalla:

```text
Ayuda / Diagnóstico
```

con:

```text
versión
estado PWA
estado de fuentes
última actualización
espacio local
```

---

# 154. Política de dependencias

Toda dependencia debe responder:

```text
¿Se mantiene?
¿Tiene licencia clara?
¿Tiene vulnerabilidades conocidas?
¿Aumenta bundle?
¿Realmente la necesitamos?
```

---

# 155. Dependencias críticas

Reducir al mínimo:

```text
map
UI
state/query
storage
PWA
```

Evitar instalar librerías pequeñas para tareas que pueden resolverse con TypeScript o Web APIs.

---

# 156. Seguridad supply-chain

CI futuro:

```text
npm audit
dependency review
lockfile
```

No actualizar dependencias automáticamente a producción sin revisión.

---

# 157. Estructura de datos local

```text
aircraft
settings
checklists
flights
batteries
places
flightPlans
assessmentHistory
```

---

# 158. Versionado de almacenamiento

Cada entidad puede incluir:

```text
createdAt
updatedAt
schemaVersion
```

---

# 159. Eliminación de datos

Debe existir:

```text
Eliminar vuelo
Eliminar batería
Eliminar lugar
Eliminar todo
```

con confirmación proporcional.

---

# 160. Recuperación de datos

Nunca borrar una bitácora completa con:

```text
un click accidental
```

Usar:

```text
confirmación
```

y, para “borrar todo”:

```text
confirmación fuerte
```

---

# 161. Diseño de fuentes

Cada fuente debe ser un objeto:

```text
sourceId
name
url
license
attribution
lastUpdated
status
```

Esto permite administrar futuras fuentes sin reescribir la interfaz.

---

# 162. Feature flags

Opcional para fases avanzadas:

```text
airspaceEnabled
fireLayersEnabled
pdfEnabled
syncEnabled
```

No necesita servidor para MVP si se hace como configuración de build.

---

# 163. Compatibilidad de fuentes

Si una fuente cambia su API:

```text
Provider v1
↓
Provider v2
```

La aplicación no debería romperse completa.

---

# 164. Monitorización de fuentes

En CI o proceso de mantenimiento:

```text
verificar endpoint
verificar schema
verificar respuesta
```

para detectar cambios externos.

---

# 165. Política de degradación

Ejemplo:

```text
clima cae
↓
mostrar cache
↓
indicar antigüedad
↓
no recalcular como si fuera actual
```

---

# 166. Política para datos antiguos

Nunca presentar:

```text
clima de hace 8 horas
```

como:

```text
clima actual
```

Debe mostrarse:

```text
Último dato disponible:
hace 8 h
```

---

# 167. Localización

Guardar:

```text
lat/lon
precision
source
timestamp
```

cuando provenga del GPS.

---

# 168. Privacidad geográfica

No registrar automáticamente:

```text
historial de ubicación
```

La bitácora solo debería guardar la ubicación cuando forme parte de un vuelo/plan que el usuario decidió guardar.

---

# 169. Evaluación contextual

El motor puede evolucionar a:

```text
Assessment
├── weather
├── light
├── terrain
├── airspace
├── hazards
└── configuration
```

---

# 170. Resultado de evaluación

Ejemplo:

```json
{
  "status": "CAUTION",
  "summary": "Revisión necesaria",
  "reasons": [
    {
      "type": "WIND_GUST",
      "severity": "WARNING",
      "message": "Ráfagas cercanas al límite configurado"
    }
  ],
  "sources": [
    "open-meteo"
  ],
  "evaluatedAt": "..."
}
```

---

# 171. Explicabilidad

Cada alerta debe poder responder:

```text
¿Qué la produjo?
¿Qué dato se usó?
¿Qué límite se aplicó?
¿De qué fuente vino?
```

---

# 172. No sobreautomatizar

El piloto debe poder ver los datos originales.

No esconder:

```text
viento
ráfaga
lluvia
visibilidad
```

detrás de un único semáforo.

---

# 173. Vista “experta”

Opcional:

```text
Modo simple
Modo experto
```

Modo experto:

```text
más variables
gráficos
timestamps
fuentes
detalles
```

---

# 174. Vista “rápida”

Modo rápido:

```text
ubicación
estado
viento
ráfaga
lluvia
hora solar
```

y botón:

```text
Revisar
```

---

# 175. Onboarding

Sin registro.

Primera apertura:

```text
¿Qué haces con VantOPS?
```

Opciones:

```text
Planificar un vuelo
Consultar clima
Registrar vuelo
```

Luego:

```text
¿Quieres permitir ubicación?
```

---

# 176. Primer vuelo

El usuario debería poder llegar al resultado sin configuración compleja.

Default (decisión 2026-08-26):

```text
perfil genérico precargado y conservador:
viento máx 25 km/h · ráfagas 35 km/h · visibilidad mín 5 km · sin lluvia
etiquetado visible: «perfil genérico — ajústalo a tu dron»
```

Con el perfil genérico activo, el resultado se muestra con aviso persistente
para evitar falsa confianza. Si el usuario borra sus límites:

```text
🟡 Falta configuración
```

y nunca un 🟢 sin criterios definidos.

---

# 177. Configuración progresiva

Preguntar solo cuando sea necesario.

Ejemplo:

```text
Quieres usar evaluación personalizada.
→ Configura límites.
```

---

# 178. Mobile interaction

Botones:

```text
mínimo cómodo
```

No colocar acciones críticas pegadas.

---

# 179. Mapa en terreno

Evitar:

```text
paneles gigantes
```

que tapen la zona de vuelo.

Usar:

```text
bottom sheets
```

---

# 180. Seguridad de diseño

Alertas críticas:

```text
no solo rojo
```

También:

```text
icono
texto
motivo
```

---

# 181. Dark cockpit

Paleta conceptual:

```text
background oscuro
surface oscuro
verde
ámbar
rojo
azul
blanco
```

La implementación visual concreta debe definirse en la fase UI.

---

# 182. Identidad

Nombre:

> **VantOPS Chile**

Posible subtítulo:

> **Flight Planning & RPAS Operations**

o una variante en español.

**Pendiente de decisión de branding final.**

---

# 183. Logo

No es necesario para Fase 0.

Puede comenzar con:

```text
icono VANT
```

y evolucionar posteriormente.

---

# 184. SEO / portada pública

GitHub Pages debería disponer de:

```text
title
description
OpenGraph
favicon
manifest
```

para presentación pública.

---

# 185. Landing

La portada pública puede contener:

```text
VantOPS Chile
Planifica tu vuelo
Datos reales
Privacidad
Gratis
[ Abrir aplicación ]
```

---

# 186. Comunidad

Crear posteriormente:

```text
CONTRIBUTING.md
CODE_OF_CONDUCT.md
ISSUES
DISCUSSIONS
```

si el proyecto recibe contribuciones.

---

# 187. Feedback

No crear cuentas solo para feedback.

Opciones:

```text
GitHub Issues
```

o formulario externo anonimizado si fuera necesario.

**Métrica de adopción (decisión 2026-08-26):** sin analytics personales.
Señales válidas: Issues y feedback, estrellas del repo, menciones en
comunidades RPAS y uso personal continuado. Cualquier analítica futura será
anonimizada, opt-in y documentada.

---

# 188. Versionado público

Usar:

```text
v0.x
```

mientras sea beta.

Luego:

```text
v1.0.0
```

cuando cumpla los criterios de MVP.

---

# 189. Changelog

Usar:

```text
Added
Changed
Fixed
Security
Deprecated
```

---

# 190. Seguridad

`SECURITY.md` debe explicar:

```text
cómo reportar vulnerabilidades
```

y nunca pedir secretos en Issues.

---

# 191. Estado del proyecto

README:

```text
📝 Planning
🚧 Development
🧪 Beta
✅ Stable
```

---

# 192. Roadmap visual

```text
VantOPS
│
├── 0.1 Foundation          ✅ objetivo
├── 0.2 Data Core           ⏳
├── 0.3 Assessment          ⏳
├── 0.4 Checklist           ⏳
├── 0.5 Logbook             ⏳
├── 0.6 PWA                 ⏳
├── 0.7 Polish              ⏳
├── 0.8 Public Beta         ⏳
├── 1.0 MVP                 ⏳
│
└── 2.0
    ├── Airspace
    ├── Hazards
    ├── Sync
    └── Mobile stores
```

---

# 193. Criterios para iniciar Fase 0

```text
[ ] nombre confirmado
[ ] stack confirmado
[ ] licencia decidida
[ ] hosting decidido
[ ] fuentes MVP decididas
[ ] disclaimer inicial redactado
[ ] arquitectura aprobada
```

---

# 194. Criterios de "MVP realmente listo"

```text
[ ] PWA instalable
[ ] funciona en teléfono
[ ] ubicación
[ ] mapa
[ ] clima
[ ] elevación
[ ] sol
[ ] evaluación
[ ] checklist
[ ] bitácora
[ ] export/import
[ ] offline parcial
[ ] fuentes visibles
[ ] disclaimer
[ ] privacidad
[ ] CI
[ ] documentación
```

---

# 195. Riesgos principales

## Riesgo 1 — Datos aeronáuticos incompletos

Mitigación:

```text
fuentes oficiales
+
disclaimer
+
transparencia
```

## Riesgo 2 — API externa cae

Mitigación:

```text
cache
estado de fuente
degradación
```

## Riesgo 3 — Usuario interpreta semáforo como autorización

Mitigación:

```text
UX
+
texto
+
disclaimer
```

## Riesgo 4 — Pérdida de datos locales

Mitigación:

```text
export/import
```

## Riesgo 5 — Complejidad excesiva

Mitigación:

```text
MVP pequeño
v2 después
```

---

# 196. Recomendación sobre arquitectura

No recomiendo comenzar con:

```text
backend
SQL
microservices
accounts
```

El producto fue concebido precisamente para demostrar que un MVP útil puede funcionar con:

```text
PWA
+
browser
+
APIs públicas
+
storage local
```

---

# 197. Evolución hacia nube

Solo cuando aparezca una necesidad real:

```text
local
 ↓
sync opt-in
 ↓
Supabase
```

Necesidades posibles:

```text
múltiples dispositivos
equipos
backup cloud
colaboración
```

---

# 198. Evolución hacia móvil nativo

Solo después de validar:

```text
uso real
usuarios
retención
necesidad
```

Entonces:

```text
PWA
 ↓
Capacitor
 ↓
Play Store
```

---

# 199. Comunidad y Chile

Una ventaja importante del proyecto es que está pensado específicamente desde el contexto chileno.

Debe conservar:

```text
es-CL
CLP solo donde tenga sentido
fuentes chilenas
DGAC
AIS
capas territoriales chilenas
```

---

# 200. Latinoamérica

La arquitectura no debe codificar:

```text
Chile-only
```

dentro del dominio.

Mejor:

```text
CountryProvider
RegulationProvider
AirspaceProvider
```

Esto permite futuro:

```text
Chile
Argentina
Perú
Brasil
etc.
```

sin reescribir la aplicación.

---

# 201. Configuración regional

```text
country = CL
language = es-CL
units = metric
timezone = America/Santiago
```

---

# 202. Fuentes regulatorias regionales

En v2:

```text
country
 ↓
fuente regulatoria correspondiente
```

---

# 203. Arquitectura multi-país

```text
core
│
├── weather
├── map
├── solar
├── terrain
├── flight
└── checklist

country/
├── CL
├── AR
├── PE
└── ...
```

---

# 204. Datos de checklist

No hardcodear todo en componentes.

Usar:

```text
checklists/*.json
```

con:

```text
id
title
category
items
references
country
version
```

---

# 205. Versionado de checklist

Ejemplo:

```text
CL-RPAS-BASIC-1
```

Si cambia una recomendación:

```text
version 2
```

El historial del usuario puede conservar con qué versión trabajó.

---

# 206. Versionado de fuentes

Guardar:

```text
sourceVersion
```

cuando sea posible.

---

# 207. Estado de referencia normativa

Mostrar:

```text
Última revisión del contenido
```

Esto evita presentar una referencia antigua como vigente.

---

# 208. Sistema de alertas

Tipos:

```text
INFO
WARNING
CRITICAL
DATA_MISSING
```

---

# 209. Fuente de cada alerta

Ejemplo:

```text
WARNING
Ráfagas de 29 km/h.

Fuente:
Open-Meteo
14:20
```

---

# 210. Evaluación temporal

No utilizar condiciones de mañana para afirmar:

```text
“ahora”
```

El motor debe distinguir:

```text
CURRENT
NEXT_HOUR
PLANNED_WINDOW
```

---

# 211. Planificación futura

El usuario debería poder decir:

```text
Quiero volar hoy a las 18:00
```

y VantOPS evaluar:

```text
condiciones previstas
```

---

# 212. Ventana futura

```text
fecha
hora inicio
hora fin
```

y:

```text
evaluación por intervalo
```

---

# 213. Comparación de ventanas

Futuro:

```text
10:00 → 🟢
13:00 → 🟡
17:00 → 🟡
19:00 → 🔴
```

---

# 214. Planificación de misión

Futuro:

```text
Nombre misión
Objetivo
Ubicación
Hora
Aeronave
Checklist
```

---

# 215. Biblioteca de misiones

El usuario puede duplicar:

```text
Misión fotografía playa
Misión inspección
Misión emergencia
```

---

# 216. Historial

```text
Mis vuelos
Mis planes
Mis aeronaves
Mis baterías
Mis lugares
```

Todo inicialmente local.

---

# 217. Datos abiertos

La app debe tener una sección:

```text
Datos y fuentes
```

explicando:

- origen;
- frecuencia;
- limitaciones;
- atribución.

---

# 218. Honestidad sobre cobertura

Cada integración debe indicar:

```text
Cobertura
Actualización
Limitaciones
```

---

# 219. No asumir calidad uniforme

Una API puede ser gratuita pero:

```text
tener rate limit
tener cobertura parcial
tener retraso
```

Por ello:

> fuente gratuita ≠ fuente perfecta.

---

# 220. Observabilidad en cliente

Registrar localmente:

```text
error provider
timestamp
status
```

hasta cierto límite.

No almacenar datos personales innecesarios.

---

# 221. Modo desarrollo

Panel oculto:

```text
Provider status
Cache
Storage
Network
PWA
```

Solo en dev.

---

# 222. Debug reproducible

Permitir descargar:

```text
diagnostic bundle
```

sin información privada por defecto.

---

# 223. Arquitectura de almacenamiento

```text
StorageService
├── settings
├── aircraft
├── flights
├── batteries
├── checklists
├── places
└── plans
```

---

# 224. Migraciones locales

```text
schema 1
 ↓
migration
 ↓
schema 2
```

---

# 225. Protección contra corrupción local

Si IndexedDB falla:

```text
no crash
```

Mostrar:

```text
No se pudo abrir tu bitácora.
Puedes intentar restaurar un respaldo.
```

---

# 226. Integridad de backup

Agregar hash opcional al export:

```text
backup.json
backup.sha256
```

o incluir checksum dentro del archivo.

---

# 227. Importación segura

Validar:

```text
schema
version
tipos
tamaños
datos
```

No confiar en JSON importado.

---

# 228. Tamaño de datos

La bitácora debe mantenerse razonable.

No guardar:

```text
mapas completos
tiles
videos
```

dentro del backup JSON.

---

# 229. Fotos

Funcionalidad futura:

```text
adjuntar foto a vuelo
```

pero debe evaluarse cuidadosamente por:

- almacenamiento;
- privacidad;
- tamaño;
- exportación.

---

# 230. Estado actual

```text
Proyecto: VantOPS Chile
Estado: planificación
MVP: definido conceptualmente
Stack: definido conceptualmente
Repo: pendiente
Fase 0: pendiente
```

---

# 231. Decisiones ya tomadas

> ⚠️ **Tabla consolidada (2026-08-26):** esta sección tenía IDs duplicados con
> la sección 251. El registro canónico y único de decisiones está ahora en la
> sección **251. Registro de decisiones**.
>
> Resumen histórico: nombre VantOPS Chile confirmado; roadmap antes de código;
> seis pantallas MVP; siete fases de evolución.

---

# 232. Preguntas abiertas críticas

Estas decisiones no deberían inventarse.

## VANT-Q01 — ¿Qué drones soportaremos?

¿Será:

```text
cualquier RPAS
```

o inicialmente:

```text
perfil genérico
```

con configuración manual?

---

## VANT-Q02 — ¿Quieres que el semáforo considere normativa o solo condiciones?

Mi recomendación:

```text
condiciones + configuración personal
```

y normativa como:

```text
referencia / checklist
```

no como autorización automática.

---

## VANT-Q03 — ¿Qué variables deben afectar el semáforo?

Candidatas:

```text
viento
ráfaga
lluvia
visibilidad
hora solar
temperatura
```

---

## VANT-Q04 — ¿Qué límite de viento debe utilizarse?

¿Lo define:

```text
el piloto
```

o el sistema puede tener:

```text
valor recomendado por modelo
```

Mi recomendación:

```text
piloto define
```

y luego VantOPS compara.

---

## VANT-Q05 — ¿Quieres espacio aéreo en MVP?

Mi recomendación:

```text
NO
```

Primero lanzar con datos meteorológicos, mapa, sol, elevación, checklist y bitácora.

---

## VANT-Q06 — ¿Quieres incendios activos?

La conversación lo consideró como fase futura.

Mi recomendación:

```text
V2
```

porque añade responsabilidad y dependencia de fuentes externas.

---

## VANT-Q07 — ¿Quieres que VantOPS funcione completamente sin internet?

Mi recomendación:

```text
offline para datos propios
+
offline para SunCalc
+
cache de última consulta
```

pero los datos meteorológicos nuevos requieren conexión.

---

## VANT-Q08 — ¿Quieres bitácora desde MVP?

La conversación la incluye.

Mi recomendación:

```text
SÍ
```

porque diferencia VantOPS de un simple visor de clima.

---

## VANT-Q09 — ¿Quieres perfiles de aeronaves desde MVP?

Mi recomendación:

```text
SÍ, pero simples.
```

Ejemplo:

```text
nombre
peso
límite viento
límite ráfaga
```

---

## VANT-Q10 — ¿Quieres registro de baterías?

Está propuesto para el MVP.

Mi recomendación:

```text
SÍ
```

pero básico.

---

## VANT-Q11 — ¿Quieres que el usuario pueda guardar lugares?

Mi recomendación:

```text
SÍ
```

localmente.

---

## VANT-Q12 — ¿Quieres modo experto?

Mi recomendación:

```text
V1.1
```

No sobrecargar MVP.

---

## VANT-Q13 — ¿Quieres publicar el código como MIT?

Pendiente.

---

## VANT-Q14 — ¿Quieres que VantOPS sea exclusivamente Chile?

La arquitectura debería prepararse para:

```text
Chile primero
Latinoamérica después
```

sin desarrollar otros países inicialmente.

## Respuestas cerradas a las preguntas abiertas (2026-08-26)

Las 14 preguntas quedaron decididas (delegadas a revisión técnica y
confirmadas en esta fecha). Detalle completo en el registro de decisiones,
sección 251:

| Pregunta | Decisión |
|---|---|
| Q01 drones soportados | Perfil genérico configurado a mano |
| Q02 semáforo | Condiciones + configuración personal; normativa solo referencia |
| Q03 variables | Viento, ráfaga, lluvia, visibilidad, hora solar |
| Q04 límite de viento | Lo define el piloto; precarga conservadora genérica |
| Q05 espacio aéreo MVP | No — v2 |
| Q06 incendios | No — v2 |
| Q07 offline | Datos propios + SunCalc + último clima cacheado |
| Q08 bitácora MVP | Sí |
| Q09 aeronaves MVP | Sí, simples |
| Q10 baterías | Sí, básico |
| Q11 lugares | Sí, locales |
| Q12 modo experto | V1.1 |
| Q13 licencia | MIT |
| Q14 alcance regional | Multi-país en arquitectura; Chile primero |

---

# 233. Recomendación de producto

La versión inicial debería evitar intentar convertirse en:

> “la aplicación definitiva de aviación RPAS de Chile”.

Debe convertirse primero en:

> **“la herramienta que abro antes de volar”.**

Ese posicionamiento es mucho más alcanzable.

---

# 234. MVP ideal

```text
ABRIR
  ↓
UBICACIÓN
  ↓
CLIMA
  ↓
MAPA
  ↓
¿CONDICIONES?
  ↓
CHECKLIST
  ↓
VUELO
  ↓
REGISTRAR
```

Ese flujo debe sentirse extremadamente rápido.

---

# 235. Objetivo de tiempo

La visión original plantea que el piloto pueda preparar una consulta de vuelo en aproximadamente pocos minutos.

Meta UX:

```text
< 30 s
→ saber ubicación + clima

< 60 s
→ revisar factores principales

< 2 min
→ completar planificación básica
```

Estos son objetivos de producto, no garantías.

---

# 236. Roadmap resumido

```text
                 VantOPS Chile
                       │
                       ▼
                 FASE 0 BASE
                       │
                       ▼
             DATOS REALES
                       │
                       ▼
                MAPA + CLIMA
                       │
                       ▼
             EVALUACIÓN DE VUELO
                       │
                       ▼
                  CHECKLIST
                       │
                       ▼
                   BITÁCORA
                       │
                       ▼
                     PWA
                       │
                       ▼
                  BETA PÚBLICA
                       │
                       ▼
                    v1.0
                       │
            ┌──────────┼──────────┐
            ▼          ▼          ▼
        AIRSPACE    HAZARDS    SYNC
            │          │          │
            └──────────┼──────────┘
                       ▼
                       v2
                       │
                       ▼
                CAPACITOR / STORE
```

---

# 237. Reglas de oro del proyecto

## Regla 1

**Nunca inventar datos.**

## Regla 2

**Mostrar la fuente.**

## Regla 3

**Mostrar cuándo se actualizó.**

## Regla 4

**No confundir apoyo con autorización.**

## Regla 5

**Privacidad por defecto.**

## Regla 6

**Primero PWA, después tiendas.**

## Regla 7

**Primero MVP, después complejidad.**

## Regla 8

**Todas las evaluaciones deben ser explicables.**

## Regla 9

**Toda fuente externa puede fallar.**

## Regla 10

**El usuario debe poder exportar sus datos.**

---

# 238. Definición de terminado

Una feature VantOPS se considera terminada cuando:

```text
[ ] funciona
[ ] tiene tests
[ ] maneja error
[ ] tiene fallback
[ ] tiene documentación
[ ] respeta privacidad
[ ] no inventa datos
[ ] no rompe otras features
[ ] funciona en móvil
```

---

# 239. Próximo paso recomendado

No iniciar inmediatamente todo el MVP.

Primero cerrar:

```text
1. Preguntas VANT-Q01 → VANT-Q14
2. arquitectura
3. modelo de datos
4. modelo de evaluación
5. fuentes
6. disclaimer
7. licencia
```

Después:

```text
FASE 0
```

---

# 240. FASE 0 — definición técnica exacta

Entregables:

```text
[ ] package.json
[ ] tsconfig
[ ] Vite
[ ] React
[ ] Tailwind
[ ] shadcn
[ ] routing
[ ] estructura de features
[ ] providers
[ ] storage
[ ] tests
[ ] CI
[ ] deploy
```

---

# 241. Primera pantalla funcional

La primera versión desplegada debe hacer algo tangible:

```text
VantOPS Chile

[Usar mi ubicación]

→ mapa
→ coordenadas
→ clima real
→ estado de fuente
```

No comenzar con un "Hello World" vacío durante demasiado tiempo.

---

# 242. Objetivo de la Fase 0

Al terminar:

> Debe existir una URL pública de VantOPS Chile que ya abra correctamente en teléfono y escritorio, aunque el producto todavía no esté terminado.

---

# 243. Resultado esperado de Fase 1

Al terminar:

> El usuario puede seleccionar una ubicación y obtener datos reales de clima, elevación y posición solar con fuentes claramente identificadas.

---

# 244. Resultado esperado de Fase 2

Al terminar:

> VantOPS puede producir una evaluación explicable basada en parámetros configurables, sin presentar esa evaluación como autorización legal.

---

# 245. Resultado esperado de Fase 3

Al terminar:

> El usuario puede completar una checklist y conservarla localmente.

---

# 246. Resultado esperado de Fase 4

Al terminar:

> El usuario puede registrar y respaldar sus vuelos.

---

# 247. Resultado esperado de Fase 5

Al terminar:

> VantOPS es una PWA usable offline para las funciones que no dependen de datos externos en tiempo real.

---

# 248. Resultado esperado de Fase 6

Al terminar:

> VantOPS puede publicarse como herramienta comunitaria abierta.

---

# 249. Resultado esperado de Fase 7

Al terminar:

> VantOPS inicia su segunda generación con integración progresiva de espacio aéreo, capas de riesgo, sincronización opcional y eventual distribución móvil.

---

# 250. Estado final del roadmap

```text
PROYECTO
VantOPS Chile

TIPO
PWA de planificación y apoyo a operaciones RPAS

ESTADO
Planificación

MVP
1.0.0

FOCO
Chile

PRINCIPIOS
Privacidad
Datos reales
Transparencia
Gratis
Mobile-first

STACK BASE
React 19
Vite
TypeScript
Tailwind
shadcn/ui
Leaflet
OpenStreetMap
Open-Meteo
SunCalc
IndexedDB/Dexie
TanStack Query
vite-plugin-pwa
GitHub Actions
GitHub Pages

MVP
Panel
Mapa
Clima
Elevación
Sol
Evaluación
Checklist
Bitácora
Baterías
Ajustes
PWA

V2
Airspace
Hazards
Sync
Capacitor
Stores
PDF
```

---

# 251. Registro de decisiones

> **Registro canónico único** — consolidado el 2026-08-26 tras auditoría.
> Cualquier decisión nueva se agrega aquí con ID secuencial.

| ID | Tema | Decisión | Estado |
|---|---|---|---|
| VANT-001 | Nombre | VantOPS Chile | ✅ |
| VANT-002 | Proceso | Roadmap antes de código | ✅ |
| VANT-003 | Framework | React 19 + Vite + TypeScript | ✅ |
| VANT-004 | Estilos/UI | Tailwind v4 + shadcn/ui | ✅ |
| VANT-005 | PWA | Enfoque principal, instalable | ✅ |
| VANT-007 | Cuentas | Sin registro en MVP | ✅ |
| VANT-008 | Datos personales | Locales (IndexedDB/Dexie) | ✅ |
| VANT-009 | Clima | Open-Meteo (pronóstico + elevación) | ✅ |
| VANT-010 | Mapa | OSM + Leaflet | ✅ |
| VANT-011 | Sol | SunCalc (local, offline) | ✅ |
| VANT-012 | Hosting | GitHub Pages + Actions | ✅ |
| VANT-013 | Bitácora | En MVP | ✅ |
| VANT-014 | Baterías | Básicas, en MVP | ✅ |
| VANT-015 | Aeronaves (Q01/Q09) | Perfil genérico manual, simple | ✅ |
| VANT-016 | Semáforo (Q02) | Condiciones + configuración personal; normativa solo referencia | ✅ |
| VANT-017 | Variables semáforo (Q03) | Viento, ráfaga, lluvia, visibilidad, hora solar | ✅ |
| VANT-018 | Límites (Q04) | Los define el piloto; precarga perfil genérico conservador | ✅ |
| VANT-019 | Espacio aéreo MVP (Q05) | Fuera del MVP | ✅ |
| VANT-020 | Incendios (Q06) | V2 | ✅ |
| VANT-021 | Alcance offline (Q07) | Datos propios + SunCalc + último clima cacheado | ✅ |
| VANT-022 | Lugares (Q11) | Sí, locales | ✅ |
| VANT-023 | Modo experto (Q12) | V1.1 | ✅ |
| VANT-024 | Licencia (Q13) | MIT | ✅ |
| VANT-025 | Alcance regional (Q14) | Arquitectura multi-país; Chile primero | ✅ |
| VANT-026 | Geocodificación | Nominatim + coordenadas manuales | ✅ |
| VANT-027 | Altura del viento | Evaluar a 10 m; mostrar 100 m informativo | ✅ |
| VANT-028 | Tiempos | Almacenar UTC; mostrar hora local + Zulu | ✅ |
| VANT-029 | METAR/SPECI | Tarjeta «Observación más cercana» (DMC ↔ NOAA), Fase 1 | ✅ |
| VANT-030 | Métrica de adopción | Sin analytics: issues, stars, feedback de comunidades | ✅ |
| VANT-031 | OpenAIP | Espacio aéreo | ⏳ V2 |
| VANT-032 | CONAF | Incendios activos | ⏳ V2 |
| VANT-033 | IDE Chile | Capas oficiales | ⏳ V2 |
| VANT-034 | Supabase | Sincronización opt-in | ⏳ Futuro |
| VANT-035 | Capacitor / Play Store | Empaquetado móvil | ⏳ V2 |
| VANT-036 | App Store | Distribución iOS | ⏳ Posterior |

*(VANT-006 quedó fusionado en VANT-005 al consolidar IDs duplicados.)*

---

# 252. Fuente de este documento

Este roadmap se reconstruye a partir de la conversación en la que se definió específicamente:

- el nombre **VantOPS (Chile)**;
- la decisión de elaborar primero un plan/roadmap;
- una PWA gratuita orientada a pilotos RPAS;
- datos reales;
- seis pantallas MVP;
- React 19 + Vite + TypeScript;
- Tailwind CSS;
- shadcn/ui;
- Leaflet/OpenStreetMap;
- Open-Meteo;
- Open-Meteo Elevation;
- SunCalc;
- almacenamiento local;
- PWA/offline;
- GitHub Pages;
- GitHub Actions;
- OpenAIP y capas chilenas como evolución;
- Capacitor/Google Play y sincronización como evolución futura.

La conversación registra que VantOPS fue elegido como nombre y que el usuario pidió explícitamente **primero plan/roadmap y después desarrollo**.

---

# 253. Estado de revisión

```text
DOCUMENTO
VantOPS Chile — Roadmap Maestro

VERSIÓN
1.1 — auditada, decisiones cerradas y consolidadas

FECHA
26-08-2026

FASE
LISTA PARA FASE 0

PRÓXIMO HITO
Fase 0 — scaffold técnico (repo vantops-chile)

DESPUÉS
Release 0.1 — Foundation
```

---

## FIN DEL ROADMAP MAESTRO DE VANTOPS CHILE
