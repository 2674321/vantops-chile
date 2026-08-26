# 🚁 VantOPS Chile

> Planifica tu vuelo RPAS con datos reales. PWA gratuita, sin registro y privacy-first para pilotos de drones en Chile.

**Estado:** 🚧 Development · v0.1.0 · [Roadmap completo](docs/ROADMAP.md)

▶️ **Demo:** https://2674321.github.io/vantops-chile/

## Qué hace (hoy)

- Consulta **condiciones meteorológicas reales** (Open-Meteo) por ubicación GPS o coordenadas manuales: viento a 10 m y 100 m, ráfagas, precipitación, humedad, amanecer/atardecer.
- Muestra el **estado de la fuente** (● Actualizado / Datos parciales / Sin conexión) — nunca presenta datos viejos como actuales.
- Guarda tu última ubicación **solo en tu dispositivo**.
- Diseño *dark cockpit* mobile-first.

## Roadmap

| Release | Contenido | Estado |
|---|---|---|
| 0.1 Foundation | Scaffold + CI + Pages + clima real básico | ✅ |
| 0.2 Data Core | Mapa Leaflet/OSM, METAR más cercano, elevación, sol offline | ⏳ |
| 0.3 Assessment | Semáforo explicable «¿Puedo volar?» configurable | ⏳ |
| 0.4 Checklist | Checklist prevuelo contextual persistente | ⏳ |
| 0.5 Logbook | Bitácora de vuelos/baterías local + export/import | ⏳ |
| 0.6–1.0 | PWA instalable offline → beta pública → MVP | ⏳ |

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · TanStack Query · Vitest · Biome · GitHub Actions + Pages

## Desarrollo

Requisitos: Node ≥ 18.

```bash
npm install
npm run dev        # servidor local
npm test           # tests unitarios (Vitest)
npm run lint       # Biome
npm run typecheck  # tsc --noEmit
npm run build      # build producción a dist/
```

La ruta base de producción es `/vantops-chile/` (GitHub Pages); en `npm run dev` es `/`.

> **Nota:** se usa `HashRouter` (`/#/acerca`) porque GitHub Pages no soporta
> reescrituras de servidor: con `BrowserRouter`, recargar una ruta interna
> respondería 404.

## Estructura

```
src/
├── app/            # App shell, providers, rutas
├── components/     # UI base (button, card, badges)
├── domain/         # tipos y reglas puras (coordenadas)
├── features/
│   ├── about/      # página Acerca (fuentes, disclaimer)
│   ├── dashboard/  # pantalla principal
│   ├── location/   # geolocalización + persistencia local
│   └── weather/    # servicio Open-Meteo, mapper, panel
├── i18n/           # textos es-CL
└── lib/            # utilidades (cn)
```

## Fuentes y atribuciones

- [Open-Meteo](https://open-meteo.com/) — pronóstico meteorológico · CC BY 4.0
- [OpenStreetMap](https://www.openstreetmap.org/copyright) — mapas · ODbL (próximamente)
- METAR/SPECI: Dirección Meteorológica de Chile (DMC) e IFIS DGAC, respaldo NOAA aviationweather.gov — Fase 1

## Privacidad

Sin cuentas, sin analytics, sin telemetría. Los datos personales (ubicaciones, futura bitácora) se almacenan únicamente en tu dispositivo.

## Aviso

VantOPS es una herramienta de apoyo a la planificación. No sustituye la normativa vigente ni las instrucciones de las autoridades competentes. El piloto es responsable de operar conforme a la normativa (DGAC).

## Licencia

[MIT](LICENSE) © Patricio Varela C. (CA2OPX)
