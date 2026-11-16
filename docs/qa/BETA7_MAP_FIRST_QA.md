# QA Beta 7 — mapa primero

Fecha local: 2026-11-16  
Versión: `1.1.0-beta.7`  
Rama: `feat/vantops-map-first-terrain-workspace`

## Evidencia y método

- Navegador real Chromium/Playwright contra Vite local, además de una sesión visible en el navegador integrado.
- Viewports comprobados: 320×700, 390×844, 1366×768 y 1440×900. En 320 y 390 se midió `documentElement.scrollWidth === clientWidth`; en escritorio, `body.scrollHeight === innerHeight`.
- Se verificó visualmente el mapa raíz, panel abierto/colapsado, scroll interno, cambio Calles/Topográfico, atribución, paneles y contacto.
- Capturas: `beta7-map-desktop.png`, `beta7-map-mobile.png`, `beta7-conditions-desktop.png` y `beta7-contact-mobile.png` en `docs/screenshots/`.
- Evidencia automatizada final: lint y TypeScript sin errores; 60 archivos de prueba, 650 tests aprobados y 1 omitido; build PWA correcto con 56 entradas precache (856,91 KiB).
- `NO EJECUTADO` se usa cuando no hubo una prueba real del escenario exacto; no se infiere un PASS solo por lectura de código.

## Matriz U01–U75

| ID | Estado | Evidencia |
|---|---|---|
| U01 | PASS | Contexto Chromium nuevo abrió `/#/` directamente en el editor de mapa. |
| U02 | PASS | Test `routeCompatibility.test.tsx`: alias histórico redirige a mapa sin bucle. |
| U03 | PASS | Test de rutas conserva `mapId` y `zoneId`; prueba de editor abre mapa/zona solicitados. |
| U04 | PASS | Test de mapa y ruta conserva `mode=measure` y activa Medir. |
| U05 | PASS | Test de rutas fuerza `panel=pines` conservando parámetros. |
| U06 | PASS | Test de rutas: `/utilidades` redirige a la raíz. |
| U07 | PASS | Navegación visible: logo B1 enlaza a `/#/`; IndexedDB no se reinicia. |
| U08 | NO EJECUTADO | No se completó una matriz manual de historial atrás/adelante. |
| U09 | NO EJECUTADO | No se reinstaló la PWA en un dispositivo físico. |
| U10 | PASS | Manifest generado conserva shortcut Mapa hacia `/#/`. |
| U11 | PASS | Chromium 1440×900: mapa 1050 px, panel 390 px y documento sin scroll vertical. |
| U12 | PASS | Chromium 1366×768: mapa/panel dentro del viewport; panel con scroll propio. |
| U13 | PASS | Chromium 768×1024: panel inferior y atribución visibles. |
| U14 | PASS | Chromium 390×844: mapa, pestañas y navegación inferior utilizables, ancho exacto. |
| U15 | PASS | Chromium 320×700: `scrollWidth=clientWidth=320`; mapa y panel de 320 px. |
| U16 | PASS | Cuatro radios hicieron crecer solo `scrollHeight` del panel; body permaneció al alto del viewport. |
| U17 | PASS | Al colapsar, el mapa creció de 976 a 1318 px sin perder cámara ni selección. |
| U18 | PASS | Al reabrir se conservaron pestaña y datos editados. |
| U19 | PASS | Cambio Lugar/Radios/Pines/Datos conservó cámara y herramienta. |
| U20 | NO EJECUTADO | No se simuló teclado virtual de Android/iOS. |
| U21 | PASS | Tabs con roles ARIA, `aria-controls`, selección y flechas izquierda/derecha; navegación por teclado probada. |
| U22 | NO EJECUTADO | No se ejecutó prueba específica con `prefers-reduced-motion`. |
| U23 | PASS | Capturas desktop/móvil muestran atribución completa sin quedar tapada. |
| U24 | PASS | Zoom y medidor se mantuvieron accesibles con panel abierto y colapsado. |
| U25 | NO EJECUTADO | No se probó safe-area en hardware Android/iOS. |
| U26 | PASS | Calles carga OSM y atribución `© OpenStreetMap contributors`. |
| U27 | PASS | Topográfico cargó mosaicos OpenTopoMap, relieve y attribution CC-BY-SA. |
| U28 | NO EJECUTADO | Fallback está cubierto por lógica, pero no se forzó una caída real del proveedor en navegador. |
| U29 | NO APLICA | No se habilitó una capa Noche sin proveedor autorizado. |
| U30 | PASS | Satélite aparece deshabilitado como `No configurado`, sin URL ni requests. |
| U31 | NO APLICA | No existe clave/proveedor satelital autorizado en esta entrega. |
| U32 | PASS | Cambio Calles/Topográfico conservó centro y zoom; solo cambió el `TileLayer`. |
| U33 | NO EJECUTADO | No se realizó perfil de memoria con cambios rápidos prolongados. |
| U34 | NO EJECUTADO | No se recorrieron manualmente todos los límites de zoom del proveedor. |
| U35 | PASS | Tests `basemap` y `settings`: preferencia válida, persistencia y fallback OSM. |
| U36 | PASS | Pines/radios alternables y filtrables sin borrar registros; tests de mapa/pines. |
| U37 | NO EJECUTADO | No se simuló offline con caché parcial en navegador. |
| U38 | PASS | Observación de red: solo mosaicos del viewport; sin lógica de prefetch/bulk. |
| U39 | PASS | Catálogo y UI exponen proveedor, licencia, atribución y fecha de revisión. |
| U40 | PASS | Capturas en tema oscuro muestran radios/pines y controles con contraste legible. |
| U41 | PASS | Test `effectiveMapSelection`: un pin seleccionado prevalece sobre centro anterior. |
| U42 | PASS | Test `effectiveMapSelection`: zona seleccionada prevalece tras quitar el pin. |
| U43 | PASS | Tests del mapa: medición A/B no modifica ubicación activa. |
| U44 | PASS | Tests de mapa: mover radio actualiza y guarda la geometría. |
| U45 | PASS | Tests `pinActions`: mover pin persiste en `SavedPlace`. |
| U46 | PASS | Test de settings y repositorios: la preferencia de capa usa setting separado. |
| U47 | PASS | Tests `mapPickIntent`/rutas: `plan-new` vuelve a nueva preparación. |
| U48 | PASS | Tests `mapPickIntent` y formulario: `flight-new` conserva borrador y no crea vuelo. |
| U49 | PASS | Tests de geolocalización: al denegar siguen disponibles manual y buscador. |
| U50 | PASS | Tests de coordenadas aceptan 0,0 explícito sin fallback. |
| U51 | PASS | Tests de búsqueda muestran error de Nominatim sin bloquear navegación. |
| U52 | PASS | Tests `AutosaveController`: flush serializado antes de navegar/cambiar mapa. |
| U53 | PASS | Tests de autosave: error de persistencia no emite estado Guardado y permite reintento. |
| U54 | PASS | Edición y cambio rápido de pestañas verificados en navegador sin pérdida. |
| U55 | NO EJECUTADO | No se abrió una copia independiente de cada base beta.2–beta.6. |
| U56 | PASS | Suite de backup importa esquemas v1, v2, v3 y v4. |
| U57 | PASS | Suite de backup valida exportación v4 y datos esperados. |
| U58 | PASS | Tests de mapas/autosave: cambiar mapa hace flush y no sobreescribe el anterior. |
| U59 | PASS | Tests de repositorio y UI cubren duplicar; eliminar requiere confirmación. |
| U60 | NO EJECUTADO | No se realizó actualización instalada entre dos service workers en hardware. |
| U61 | PASS | Condiciones usa `activeLocationContext`; navegador abrió la vista sin solicitar GPS. |
| U62 | PASS | Suite de clima valida fecha/fuente/frescura; captura de Condiciones. |
| U63 | PASS | Tests METAR muestran ausencia y mantienen etiqueta comunitaria cuando corresponde. |
| U64 | PASS | Tests de evaluación no convierten viento desconocido en favorable. |
| U65 | PASS | Suite de checklist conserva estado local al cambiar de ruta. |
| U66 | PASS | Test de contacto valida `https://www.linkedin.com/in/patricioa2/`. |
| U67 | PASS | Test de contacto valida `https://www.instagram.com/__mudrock/`. |
| U68 | PASS | Test/panel de contacto conserva la cuenta pública GitHub. |
| U69 | PASS | Test/panel de contacto conserva `mailto:pvc.devno@gmail.com`. |
| U70 | PASS | Captura 390×844: Sobre/Contacto accesible desde Más y fuera del mapa. |
| U71 | PASS | Búsqueda de repositorio y navegador: no existe `herramienta destacada` ni landing repetitiva. |
| U72 | PASS | `package.json`, lock, UI, changelog, README y roadmap indican `1.1.0-beta.7`. |
| U73 | NO EJECUTADO | Pendiente CI del PR de publicación. |
| U74 | NO EJECUTADO | Pendiente deploy del SHA fusionado. |
| U75 | NO EJECUTADO | Pendiente smoke final contra GitHub Pages. |

## Observaciones

- A petición del propietario se retiró por completo el bloque “Radios de referencia”; la advertencia normativa permanece en Acerca y README, donde no consume espacio operativo.
- Satélite y Noche no se simulan: una capa solo se habilita con proveedor y términos autorizados.
- Las limitaciones `NO EJECUTADO` no se ocultan; deben considerarse antes de promover esta beta a estable.
