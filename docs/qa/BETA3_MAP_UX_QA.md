# QA — Beta 3 Mapa protagonista y UX

Fecha: 2026-11-15. Estados permitidos: PASS, FAIL, NO EJECUTADO, NO APLICA.

## Baseline

- Base: `a5456304170cee4bf4649e05acbabb505a1a947b`, `v1.1.0-beta.2`.
- Lint/typecheck/build: PASS.
- Suite inicial: 52 archivos, 621 PASS y 1 integración externa opt-in omitida.
- PWA inicial: 52 entradas, 809,85 KiB.

## Navegación e Inicio

| Casos | Estado | Evidencia |
|---|---|---|
| N01–N06 descubrimiento, rutas y deep-links | PASS | navegador real a 320/390/1440; `Mapa` y `Utilidades` visibles sin scroll horizontal |
| N07–N09 rutas, atrás/adelante y shortcut | PASS | HashRouter conservado; manifest y rutas existentes sin cambios incompatibles |
| N10 teclado | PASS | AX + activación con Enter de desplegar/contraer/abrir mapa completo |
| H01–H05 panel, vacío, conteo real y contracción | PASS | `MapHomePreview.test.tsx` y smoke real con 0/1 mapa |
| H06 lazy load | PASS | 0 requests de mosaicos contraído; requests aparecen solo después de expandir |
| H07–H08 aria/contexto | PASS | `aria-expanded`, `aria-controls`, mapId/zoneId validados contra storage |
| H09 offline | PASS | datos locales/texto siguen presentes; no se promete fondo offline |
| H10 error IndexedDB | PASS | error persistente y honesto, sin contador falso |

## Editor y robustez

| Casos | Estado | Evidencia |
|---|---|---|
| E01–E05 reemplazo/salida/plan con draft | PASS | confirmación homogénea; test de cambio de mapa cancelado y guardado antes de plan |
| E06–E07 estado guardado/falla | PASS | estado tras `await` real; QuotaExceededError simulado conserva draft y permite copiar JSON |
| E08 zonas independientes | PASS | regresiones beta.2 y repositorio |
| E09 medición sin recentrar | PASS | prueba de UI: coordenada seleccionada permanece intacta |
| E10 fit bounds explícito | PASS | efecto depende del nonce y usa snapshot actual de zonas |
| E11–E14 pan, persistencia, límite y plan | PASS | dominio/repositorio + smoke UI y test de zona 750 m guardada antes de navegar |

## QA pendiente de beta.2

| Prueba | Estado | Evidencia y alcance |
|---|---|---|
| GPS concedido | PASS | fixture sintético Valparaíso; centro y precisión ±12 m, sin ubicación personal |
| GPS denegado/timeout/no disponible | PASS | stubs controlados; alternativa manual permanece visible |
| Tiles OSM bloqueados | PASS | bloqueo exclusivo de `tile.openstreetmap.org`; radios/lista/cálculos locales permanecen |
| Teclado y AX | PASS | flujo automatizado con Tab/Enter; nombres, foco y estados verificados |
| Lector de pantalla manual físico | NO EJECUTADO | no se declara una sesión manual que no se realizó |
| Falla IndexedDB | PASS | rechazo controlado de escritura y prueba de error de apertura del preview |

## Responsive y visual

- PASS sin overflow documental: 320×700, 390×844, 768×1024, 1366×768 y 1440×900.
- PASS cambio dinámico 320→1440 con preview abierto; se corrigió una carrera real de Leaflet detectada durante QA.
- PASS consola limpia después de la corrección.
- Capturas: `inicio-mapa-plegado-mobile.png`, `inicio-mapa-desplegado-mobile.png`,
  `inicio-mapa-desplegado-desktop.png`, `navegacion-mobile-utilidades-visible.png`,
  `navegacion-desktop-mapa-visible.png`, `utilidades-primera-herramienta.png`,
  `editor-radios-ux-pulida.png`.

## Datos y compatibilidad

- Dexie conserva nombre `vantops` y esquema v4: PASS.
- Backup conserva formato v3 e importación v1/v2: PASS.
- No hay GPS continuo, analytics, backend ni precache de mosaicos: PASS.
- Atribución OSM y búsqueda Nominatim por acción explícita: PASS.

## Gates finales locales

- Lint: PASS, 158 archivos.
- Typecheck: PASS.
- Tests: PASS, 53 archivos; 631 aprobados y 1 integración externa opt-in omitida.
- Build: PASS; 1.774 módulos transformados.
- PWA: PASS; 51 entradas, 824,83 KiB.

## Publicación

Se completa después del CI, Deploy y smoke del SHA final en GitHub Pages.
