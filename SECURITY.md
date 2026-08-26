# Política de Seguridad

## Reportar una vulnerabilidad

Reporta vulnerabilidades mediante los [security advisories privados de GitHub](https://github.com/2674321/vantops-chile/security/advisories/new) o contactando al autor vía GitHub.

Por favor incluye:

- descripción del problema;
- pasos para reproducirlo;
- impacto estimado.

No incluyas secretos ni datos personales en los reportes.

## Alcance

VantOPS Chile es una aplicación 100% cliente:

- no opera backend propio;
- no almacena credenciales ni secretos en el frontend;
- los datos del usuario permanecen en su dispositivo (localStorage/IndexedDB).

Las fuentes externas utilizadas (Open-Meteo, OpenStreetMap) se consumen por HTTPS sin claves.
