# Cómo se publica esta web

La web se publica en **dos sitios a la vez**, a propósito y de forma temporal:

| Dónde | Dirección | Para qué |
|---|---|---|
| **Cloudflare Pages** | `https://countpips.com` | El sitio de verdad |
| GitHub Pages | `https://mmortexx.github.io/CountPipsWeb` | Copia antigua, mientras se comprueba la nueva |

Los dos se compilan del mismo código. La diferencia es **desde dónde cuelgan las
páginas**: Cloudflare las sirve en la raíz del dominio y GitHub desde un
subdirectorio. Por eso existe la variable `NEXT_PUBLIC_BASE_PATH`, que solo
declara el flujo de GitHub Actions. Sin ella el sitio se compila para la raíz,
que es lo que necesitan tanto Cloudflare como el desarrollo local.

## La dirección oficial, y por qué NO está fijada todavía

`countpips.com` **aún no está comprado**, así que el sitio declara como
dirección oficial la de GitHub Pages, que es donde está publicado de verdad.

Esto no es provisionalidad por pereza: un canónico que apunta a un dominio que
no resuelve es **peor que no tener ninguno**. El buscador lo sigue, no encuentra
nada, y lo razonable por su parte es dejar de indexar unas páginas que declaran
"la buena es esta otra" señalando al vacío.

El día que el dominio esté comprado y apuntando a Cloudflare, se activa con una
variable de entorno y **no hay que tocar código**. Cada PR ya compila el sitio
así, en la raíz y con esta dirección (trabajo «Dominio propio» de
`comprobar.yml`), y `tests/dominio-propio.test.ts` comprueba que canónico, mapa
del sitio, `robots.txt` y tarjetas sociales no dejan atrás ninguna dirección vieja:

```
NEXT_PUBLIC_SITE_URL = https://countpips.com
```

En Cloudflare Pages → *Settings → Environment variables*. A partir de ahí, la
canónica, el mapa del sitio, la tarjeta de redes y los datos estructurados pasan
al dominio propio de golpe y en todas las páginas.

Cuando eso ocurra, conviene definir esa MISMA variable también en GitHub
Actions: así la copia antigua declarará como canónica la dirección buena, y el
buscador concentrará en ella lo que ahora repartiría entre las dos.

---

## Configurar Cloudflare Pages (una sola vez)

En el panel de Cloudflare → **Workers & Pages** → *Create* → *Pages* → conectar
con el repositorio de GitHub. Cuando pida la configuración de compilación:

| Campo | Valor |
|---|---|
| Framework preset | *None* |
| Build command | `bun install --frozen-lockfile && bun run build` |
| Build output directory | `out` |
| Root directory | *(vacío)* |

La instalación va en el propio comando, con `SKIP_DEPENDENCY_INSTALL=1`, porque
la de Cloudflare por su cuenta no garantiza usar Bun ni respetar `bun.lock`, y
su Bun por defecto (1.2) no es el del proyecto: `BUN_VERSION` lo fija al mismo
que `package.json` y los flujos de GitHub.

**No** definas `NEXT_PUBLIC_BASE_PATH` aquí. Esa variable es exclusiva de
GitHub Pages; si la añades, Cloudflare compilará el sitio esperando un
subdirectorio que no existe y **todos los enlaces y recursos darán 404**.

Las que sí hay que añadir, en *Settings → Environment variables*:

- `BUN_VERSION` = `1.3.14` y `SKIP_DEPENDENCY_INSTALL` = `1` (ver arriba).
- `NEXT_PUBLIC_WEB3FORMS_KEY` — destino de los formularios de contacto.
- `NEXT_PUBLIC_WAITLIST_URL` y `NEXT_PUBLIC_BETA_API_URL` — destinos
  opcionales del formulario de `/beta` (ver abajo).
- `NEXT_PUBLIC_POSTHOG_KEY` — clave de proyecto de PostHog (host EU). Sin
  ella no se carga analítica; el sitio funciona igual.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — site key pública de Turnstile. Sin
  ella no se renderiza el widget anti-bot en `/beta`.
- `NEXT_PUBLIC_SITE_URL` = `https://countpips.com` — **solo con el dominio
  ya comprado**. Se puede poner al crear el proyecto, antes de conectar el
  dominio: mientras tanto el sitio solo está en `*.pages.dev`, que
  `public/_headers` deja fuera del buscador (`X-Robots-Tag: noindex`).

Si faltan, el sitio se publica igual pero los formularios avisan del fallo en
vez de fingir que han enviado.

## A dónde van las solicitudes de acceso anticipado

El formulario de `/beta` envía cada solicitud a **un** destino. Sin configurar
nada más, es **Web3Forms con la misma clave que el formulario de contacto**: la
solicitud llega al correo del titular como un mensaje con un dato por línea. Dos
variables opcionales la desvían a un sitio con más control:

| Variable | Secreto en GitHub | Qué es |
|---|---|---|
| `NEXT_PUBLIC_WAITLIST_URL` | `WAITLIST_URL` | El Apps Script que guarda las solicitudes en una hoja de Google (`docs/waitlist-apps-script.js`; la dirección acaba en `/exec`) |
| `NEXT_PUBLIC_BETA_API_URL` | `BETA_API_URL` | El Worker `services/beta-api` (`POST /v1/applications`), con base de datos y panel propio |

- Con **ninguna**, va al correo por Web3Forms. Es lo que hay publicado ahora.
  Sin deduplicación ni Turnstile (el filtro antibot es el campo trampa), y el
  plan gratuito de Web3Forms admite 250 envíos al mes entre los dos formularios;
  pasado el límite, el formulario avisa del fallo en vez de fingir el envío.
- Con **la hoja** (`WAITLIST_URL`), va a la hoja y ya no al correo.
- Con **el Worker** (`BETA_API_URL`), va al Worker, aunque esté la hoja: no es
  una copia de seguridad que salte si el Worker falla.
- Sin ninguna de las dos y sin la clave de Web3Forms, el formulario dice que no
  ha podido enviar; no finge que ha guardado nada.

Una variable vacía o en blanco cuenta como si no existiera. Importa porque
GitHub entrega vacío un secreto que no está creado, y así el flujo de
publicación siempre pasa las dos (`tests/destino-beta.test.ts`).

En GitHub Pages los valores se ponen como secretos del repositorio
(*Settings → Secrets and variables → Actions → New repository secret*) y entran
en el siguiente despliegue. En Cloudflare Pages, como variables de entorno con el
nombre `NEXT_PUBLIC_…`. Las dos direcciones son públicas por diseño: viajan en el
JavaScript de la página y solo permiten añadir solicitudes, no leerlas.

## Apuntar el dominio

Con `countpips.com` ya comprado: Cloudflare Pages → el proyecto → *Custom
domains* → añadir `countpips.com`. Si el dominio está registrado fuera de
Cloudflare, hay que cambiar sus servidores de nombres a los que Cloudflare
indique; tarda unas horas en propagarse. El certificado HTTPS lo emite
Cloudflare solo, no hay que hacer nada. Comprado en Cloudflare, ese cambio no
hace falta.

Conviene añadir también `www.countpips.com` como segundo dominio del mismo
proyecto, para que quien lo teclee con `www` llegue. El canónico sigue siendo
el de sin `www`.

## Cabeceras

`public/_headers` lleva las cabeceras de seguridad y de caché, incluida la
`Content-Security-Policy` (restringe scripts/conexiones a los dominios que el
sitio usa de verdad: Turnstile, PostHog, Web3Forms, Apps Script). Lo lee
Cloudflare; GitHub Pages lo ignora porque no permite configurarlas — así que
la copia de GitHub Pages **no lleva CSP ni el resto de estas cabeceras**, y
ese fichero no puede romper la publicación antigua. Es una de las cosas que se
ganan con este cambio.

---

## Cuando toque apagar GitHub Pages

Dos pasos, y ninguno toca la configuración del proyecto:

1. Borrar las dos variables `NEXT_PUBLIC_BASE_PATH` y `NEXT_PUBLIC_SITE_URL`
   de `.github/workflows/deploy.yml`.
2. Desactivar Pages en el repositorio (*Settings → Pages → Source: None*).

Aviso: GitHub Pages **no sabe hacer redirecciones reales**. Quien tenga
guardado un enlace antiguo se encontrará una página caída, no un salto al
dominio nuevo. Por eso conviene dejarla encendida hasta que el dominio lleve un
tiempo funcionando y esté indexado.

## Comprobar un cambio antes de publicarlo

```bash
bun run build      # compila para la raíz, igual que Cloudflare
npx serve out      # y se abre en http://localhost:3000
```

Para reproducir la compilación de GitHub Pages hay que definir la variable, y
en Windows conviene hacerlo desde PowerShell: Git Bash convierte
`/CountPipsWeb` en una ruta de disco y el build falla con un error que
despista (`basePath has to start with a /`).

```powershell
$env:NEXT_PUBLIC_BASE_PATH = "/CountPipsWeb"; bun run build
```
