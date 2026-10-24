# CountPips Beta API

Servicio aislado para recibir solicitudes de beta y operar el portal interno. La web pública sigue siendo estática en GitHub Pages; este Worker no se enlaza desde la navegación pública.

## Preparación

1. Crear las dependencias en Cloudflare:

   ```bash
   npx wrangler d1 create countpips-beta
   npx wrangler kv namespace create RATE_LIMIT
   ```

2. Copiar los identificadores devueltos a `wrangler.jsonc` en `database_id` e `id`.
3. Aplicar la migración:

   ```bash
   npx wrangler d1 migrations apply countpips-beta --remote
   ```

4. Configurar secretos fuera del repositorio:

   ```bash
   npx wrangler secret put TURNSTILE_SECRET
   npx wrangler secret put ADMIN_TOKEN
   npx wrangler secret put IP_HASH_SECRET
   ```

   `IP_HASH_SECRET` es una cadena larga y aleatoria (por ejemplo, la salida de `openssl rand -hex 32`) que no se usa para nada más. Con ella el Worker guarda de cada IP solo una huella (HMAC-SHA-256) en la columna `ip_hash` y en las claves del límite de peticiones. Sin el secreto, esa huella sería un simple sha256 y bastaría probar todas las IPv4 para saber a quién corresponde.

   Si falta, la IP no se guarda (`ip_hash` queda vacío), pero el límite por IP no puede funcionar y el alta responde `503 service_misconfigured`, igual que si faltara el KV. En local, `RATE_LIMIT_OPTIONAL=1` en `.dev.vars` permite probar sin él. Cambiar el secreto hace que las huellas nuevas no coincidan con las anteriores; no rompe nada más.

   Las filas guardadas antes de este cambio llevan el sha256 sin secreto. Para borrarlo:

   ```bash
   npx wrangler d1 execute countpips-beta --remote --command "UPDATE applications SET ip_hash = NULL"
   ```

5. Desplegar:

   ```bash
   npx wrangler deploy
   ```

6. Configurar `NEXT_PUBLIC_BETA_API_URL` en la web pública con la URL de `POST /v1/applications`.

7. Comprobar que la dirección desde la que se sirve la web está en `ALLOWED_ORIGINS` (`wrangler.jsonc`). Si se activa mientras el sitio solo vive en `*.pages.dev`, ese origen exacto (`https://<proyecto>.pages.dev`) hay que añadirlo: si no, el Worker rechaza todas las solicitudes con `403 origin_not_allowed`.

Turnstile solo da por buena la verificación si se resolvió en el mismo dominio que la petición. Con las claves de prueba de Turnstile (que dicen `example.com`), `TURNSTILE_HOSTNAME_OPTIONAL=1` en `.dev.vars` se salta esa comparación en local.

## Contrato

- `POST /v1/applications`: solicitud pública. Requiere origen permitido, consentimiento obligatorio, Turnstile válido y campos de perfil. Devuelve siempre `201 { ok: true }`, sin revelar si el correo ya estaba registrado ni exponer datos previos.
- `GET /v1/applications`: portal interno. Requiere `Authorization: Bearer <ADMIN_TOKEN>` y permite filtrar por `status` o `cohort`.
- `PATCH /v1/applications/:id`: cambia `status` y `cohort` desde el portal interno.
- `GET /admin`: interfaz privada de operaciones. No se enlaza desde CountPips. El HTML exige HTTP Basic Auth (usuario cualquiera, contraseña = `ADMIN_TOKEN`) antes de servirse; las llamadas que hace ese panel a `GET`/`PATCH /v1/applications` siguen exigiendo el mismo token como `Bearer`.
- `GET /health`: comprobación técnica sin datos de solicitudes.

Los estados válidos son `nuevo`, `revisando`, `invitado`, `aceptado`, `espera` y `descartado`. El correo se conserva sólo en D1 para operar invitaciones.

## Recomendación de seguridad adicional para `/admin`

El Basic Auth de arriba reutiliza `ADMIN_TOKEN` como contraseña — cierra la exposición pública del panel sin añadir un secreto nuevo, pero sigue siendo un único factor compartido con la propia API. Si el panel pasa a usarse en equipo o con más frecuencia, la mejora recomendada es poner **Cloudflare Access** (Zero Trust) delante de la ruta `/admin`, con autenticación por email/SSO independiente del token de la API. Esto se configura en el dashboard de Cloudflare (Zero Trust → Access → Applications), no en este código, y no es necesario para que el gate actual sea seguro.
