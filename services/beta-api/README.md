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
   ```

5. Desplegar:

   ```bash
   npx wrangler deploy
   ```

6. Configurar `NEXT_PUBLIC_BETA_API_URL` en la web pública con la URL de `POST /v1/applications`.

## Contrato

- `POST /v1/applications`: solicitud pública. Requiere origen permitido, consentimiento obligatorio, Turnstile válido y campos de perfil. Devuelve respuesta uniforme `{ ok: true }` sin revelar si el correo ya estaba registrado ni exponer datos previos.
- `GET /v1/applications`: portal interno. Requiere `Authorization: Bearer <ADMIN_TOKEN>` y permite filtrar por `status` o `cohort`.
- `PATCH /v1/applications/:id`: cambia `status` y `cohort` desde el portal interno.
- `GET /admin`: interfaz privada de operaciones. No se enlaza desde CountPips. El HTML exige HTTP Basic Auth (usuario cualquiera, contraseña = `ADMIN_TOKEN`) antes de servirse; las llamadas que hace ese panel a `GET`/`PATCH /v1/applications` siguen exigiendo el mismo token como `Bearer`.
- `GET /health`: comprobación técnica sin datos de solicitudes.

Los estados válidos son `nuevo`, `revisando`, `invitado`, `aceptado`, `espera` y `descartado`. El correo se conserva sólo en D1 para operar invitaciones; PostHog no recibe correos, respuestas de formulario, calculadoras ni datos financieros.

## Recomendación de seguridad adicional para `/admin`

El Basic Auth de arriba reutiliza `ADMIN_TOKEN` como contraseña — cierra la exposición pública del panel sin añadir un secreto nuevo, pero sigue siendo un único factor compartido con la propia API. Si el panel pasa a usarse en equipo o con más frecuencia, la mejora recomendada es poner **Cloudflare Access** (Zero Trust) delante de la ruta `/admin`, con autenticación por email/SSO independiente del token de la API. Esto se configura en el dashboard de Cloudflare (Zero Trust → Access → Applications), no en este código, y no es necesario para que el gate actual sea seguro.
