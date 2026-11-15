# Baseline — Utilidades y mapa de operaciones

Fecha de inspección: 2026-11-15. Base: `origin/main` en `b960b3a`.

## Existe

- PWA React/Vite con `HashRouter`, GitHub Pages y carga lazy por ruta.
- Mapa Leaflet/OSM en el panel, selección por clic y un círculo en metros.
- Dominio `OperationZone`, radio técnico 50–50.000 m y validadores estrictos de coordenadas.
- Geolocalización bajo acción, búsqueda Nominatim explícita con caché y espera mínima, lugares y última ubicación locales.
- Preferencias de unidades, planes con `location`/`radiusMeters`, Dexie v3 y backup v2 compatible con v1.

## Parcial antes del cambio

- El mapa estaba acoplado al dashboard y recentraba ante cada cambio de coordenada.
- El radio único podía guardarse como setting o copiarse a un plan, pero no existían mapas ni zonas múltiples.
- La navegación horizontal era desplazable, aunque sin acceso a Utilidades.

## No existía

- Rutas `/utilidades` y `/utilidades/mapa`.
- CRUD de mapas locales, selección individual, radios concéntricos/independientes y ajuste de vista.
- Medición geodésica, área/perímetro, backup de mapas y migración Dexie v4.
- Flujo explícito zona guardada → preparación.

## Riesgos y decisiones

- Los cambios locales del checkout original se preservan mediante worktree separado.
- `tile.openstreetmap.org` es best-effort y prohíbe prefetch/offline masivo; solo se solicitan mosaicos del viewport interactivo con atribución visible.
- Nominatim público limita la aplicación completa a 1 solicitud/s. El cliente actual evita autocomplete, espera y cachea, pero una adopción mayor requerirá proveedor/proxy configurable.
- Las coordenadas y mapas pueden ser sensibles: permanecen en IndexedDB y solo salen si el usuario exporta el respaldo.
- La migración es aditiva: mismo nombre `vantops`, tablas históricas intactas y nueva tabla `operationalMaps`.
