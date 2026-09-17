# AGENTS.md — VantOPS Chile

Reglas operativas para agentes que trabajen en este repositorio.

## Flujo de trabajo

- **Commit y push automáticos:** realizar `git commit` y `git push` sin pedir
  confirmación cuando haya cambios terminados y verificados. El usuario autorizó
  explícitamente este flujo de forma permanente.
- Antes de commitear: correr `npm run lint`, `npm run typecheck`, `npm test` y
  `npm run build`. No commitear con la suite en rojo.
- Mantener el estilo de mensajes de commit existente (`R0.X.Y Título`).
- Nunca hacer `git reset --hard` ni descartar cambios sin autorización.
- No eliminar ni reducir tests para que la suite pase.

## Calidad

- Biome para lint (`npm run lint`), TypeScript estricto (`npm run typecheck`),
  Vitest para tests (`npm test`).
- Mantener actualizados `CHANGELOG.md`, `README.md` y `docs/ROADMAP.md` en cada
  release.
