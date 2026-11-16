# Beta 6 — reconciliación del baseline

Fecha: 2026-11-15. Base real: `origin/main` en `386df6b`, correspondiente a
`1.1.0-beta.5`. El checkout original con cambios locales se conservó intacto;
la integración se realizó en un worktree y rama separados.

## Lo que ya existía y se preservó

- Radios personalizados, múltiples y arrastrables; medición geodésica y cámara
  estable sin remontajes intencionales.
- Pines inline beta.5, catálogo curado de más de 60 perfiles RPAS, búsqueda por
  fabricante/tipo y submenús del selector de aeronave.
- Dexie v4, backups v1-v3, mapas operacionales y preparaciones locales.

## Decisiones de integración

- `SavedPlace` pasa a ser el registro canónico de cada pin. Los pines inline se
  migran en una transacción y el mapa guarda referencias opcionales.
- La última ubicación conserva compatibilidad, pero se acompaña de un contexto
  tipado con fuente, etiqueta, precisión e IDs relacionados.
- El autoguardado usa una sola cola por editor: valida, espera la escritura,
  expone fallo/reintento y hace `flush` antes de cambiar de contexto.
- Dexie v5 y backup v4 son aditivos. Importar v1-v3 sigue permitido y no borra
  registros locales más recientes.
- La ruta `/lugares` se mantiene como compatibilidad y redirige al mapa; no se
  elimina la tabla ni los datos históricos.

## Límites conscientes

- GPS continúa siendo una acción explícita del usuario.
- No se añadieron capas aeronáuticas ni afirmaciones de autorización.
- LinkedIn e Instagram quedan ocultos si no existe una URL personal verificada
  configurada por entorno.
- APK/Capacitor permanece fuera de esta beta web.
