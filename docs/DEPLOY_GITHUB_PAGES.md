# Desarrollo y publicación en GitHub Pages

VantOPS se desarrolla en el repositorio original y se publica en
`https://2674321.github.io/vantops-chile/`. GitHub Pages sirve la aplicación;
no almacena la base IndexedDB de los usuarios. Vuelos, planes, baterías,
lugares y ajustes pertenecen a cada navegador, por lo que el respaldo JSON es
el mecanismo deliberado de traslado entre dispositivos.

## Desarrollo desde la PC original

```bash
git fetch --all --prune
git switch -c feat/descripcion origin/main
npm ci
npm run dev
```

No publicar cada experimento. Trabajar en una rama, mantener el cambio acotado
y conservar cualquier archivo local no confirmado antes de cambiar de rama o
crear un worktree.

## Gate antes de integrar

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Las integraciones externas son opt-in (`npm run test:integration`) y deben
registrarse como no ejecutadas cuando se omitan. No se fuerzan actualizaciones
mayores para silenciar `npm audit`; se revisan de forma controlada.

## Publicación

1. Empujar la rama y abrir un PR contra `main`.
2. Revisar el diff y esperar CI verde.
3. Integrar el PR sin reescribir el historial.
4. El push a `main` activa `.github/workflows/deploy.yml`.
5. Confirmar que CI y Deploy finalizaron correctamente para el mismo SHA.
6. Abrir la URL pública, comprobar la versión en «Acerca de» y recorrer Inicio,
   Mi operación, Bitácora y Ajustes, incluyendo una ruta hash cargada en forma
   directa.

## PWA, caché y datos locales

El service worker usa actualización automática y mantiene el mismo `id`,
`scope`, path público y nombre de IndexedDB. Ante una versión antigua, cerrar
y volver a abrir la PWA o hacer una recarga completa; no borrar datos del sitio
como primera medida. Exportar respaldo antes de cualquier diagnóstico
destructivo.

La actualización 1.0.1 → 1.1 migra Dexie a v3 y conserva registros anteriores.
El importador acepta respaldo v1 y el formato v2 añade planes y relaciones.

## Recuperación

Si una publicación presenta una regresión, revertir en Git el commit de merge,
validar de nuevo y empujar el revert a `main`. No cambiar el nombre de la base,
no limpiar IndexedDB y no degradar el esquema: el rollback del código debe
preservar los datos locales. Documentar el SHA revertido y verificar el nuevo
Deploy antes de comunicar la recuperación.
