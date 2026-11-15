# Guía operativa — integración B1 y preparación de la siguiente fase

Estado al preparar este documento: `v1.1.0-beta.2` en producción. **Este cambio incorpora recursos al README/documentación; no cambia los assets instalables ni publica APK.**

## Selección de recursos de los kits

| Destino | Recursos | Forma de integración | Validación |
|---|---|---|---|
| GitHub/portfolio | `docs/branding/app-icon.svg`, `hero-banner.svg` | Versionados, livianos, sin dependencia externa | Preview GitHub y modo claro/oscuro |
| Barra de navegación | Símbolo B1 simplificado en componente o SVG accesible | Sustituir `Plane` genérico solo tras prueba visual | 320–1440 px, no distorsión |
| Favicon/web | SVG B1 y PNG 16/32/48 | Referencias compatibles con `/vantops-chile/` | HTTP 200 público y pestaña navegador |
| PWA | PNG 192/512 + maskable real + Apple Touch | `vite.config.ts`, `public/`, `index.html` | Lighthouse, manifest, instalación |
| Splash PWA | Fondo B1 ligero | CSS/SVG, no imagen grande bloqueante | Primer render y accesibilidad |
| Estados UI | Subconjunto de 24 estados del Pack 02 | Cargar bajo demanda | Offline, sin datos, permisos, error |
| Mapa | Leyenda y marcadores del Pack 02 | Solo recursos con tamaño adecuado | Atribución OSM, contraste y performance |
| Social preview | Imagen editorial de web/repositorio | Tamaño OG correcto, metadata | Link preview y URL absoluta de proyecto |
| Android futuro | Adaptive launcher, monochrome, splash | Recurso del kit para proyecto Android/Capacitor | Safe area y pruebas en dispositivo |
| Screenshots tienda | **Capturas reales** sobre plantillas | No reemplazar pantallas por composiciones ficticias | Integridad con build publicado |

## Hallazgos técnicos para abordar con Codex

1. `index.html` referencia iconos con rutas absolutas raíz (`/icon-192.png`) que pueden romperse en hosting de proyecto GitHub Pages; usar base real de Vite o rutas correctas.
2. `src/app/App.tsx` usa `Plane` de Lucide como marca en el encabezado y el ancho máximo `max-w-2xl` obliga a una navegación horizontal extensa. Adoptar B1 como símbolo y volver el mapa más visible **sin ocultar funciones**.
3. `src/features/dashboard/DashboardPage.tsx` tiene un mapa secundario; ofrecer una tarjeta prominente/expandible del mapa de operaciones con enlace a la utilidad completa, como prioridad ya acordada.
4. `src/features/utilities/map/OperationalMapPage.tsx` concentra estado y UI. Separar gradualmente presentación, geometría, guardado y rutas para mejorar accesibilidad/testabilidad, sin refactor destructivo.
5. Completar QA real: permisos GPS, mosaicos fallidos, recorrido de teclado/lector, fallo IndexedDB, actualizaciones PWA sin pérdida de datos.
6. `vite.config.ts` usa un `maskable` apuntando al mismo PNG estándar; comprobar padding y recorte real antes de afirmar soporte de icono adaptable.
7. Desaconsejar cargar 2.800+ assets al bundle. Selección objetivo: marca de barra y favicons, ~8–12 estados UI, ~8 marcadores de mapa; resto externo.
8. Mantener integridad de Dexie v4 y backup v3 y no modificar semáforo operacional con decisiones puramente visuales.

## Criterios de integración

- No reemplazar logo B1 por variantes decorativas; el original es la única marca principal.
- Medir pesos antes/después y usar lazy loading para ilustraciones.
- Conservar `base: "/vantops-chile/"`, HashRouter y PWA `id`/`scope`; no borrar IndexedDB.
- Comprobar `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`.
- Ejecutar browser QA en producción y registrar SHA desplegado antes de declarar «publicado».
- Mantener permiso/georreferencia local y disclaimer de que VantOPS no otorga autorizaciones de vuelo.

## Qué se hizo en esta etapa

Se actualizó la **presentación GitHub** y se agregaron fuentes de marca B1 reutilizables; la integración en `src/` y `public/`, el nuevo homepage y la APK quedan para la etapa de desarrollo, con pruebas.
