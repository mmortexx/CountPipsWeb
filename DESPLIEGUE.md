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
variable de entorno y **no hay que tocar código**:

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
| Build command | `bun run build` |
| Build output directory | `out` |
| Root directory | *(vacío)* |

**No** definas `NEXT_PUBLIC_BASE_PATH` aquí. Esa variable es exclusiva de
GitHub Pages; si la añades, Cloudflare compilará el sitio esperando un
subdirectorio que no existe y **todos los enlaces y recursos darán 404**.

Las que sí hay que añadir, en *Settings → Environment variables*:

- `NEXT_PUBLIC_WEB3FORMS_KEY` — destino de los formularios de contacto.
- `NEXT_PUBLIC_WAITLIST_URL` — Apps Script de respaldo para `/beta`
  (`docs/waitlist-apps-script.js`).
- `NEXT_PUBLIC_BETA_API_URL` — URL de `POST /v1/applications` del Worker
  `services/beta-api`. Sin ella, el formulario de `/beta` cae al mismo
  Apps Script que la lista de espera (mismo contrato, sin panel interno
  ni deduplicación por base de datos).
- `NEXT_PUBLIC_POSTHOG_KEY` — clave de proyecto de PostHog (host EU). Sin
  ella no se carga analítica; el sitio funciona igual.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — site key pública de Turnstile. Sin
  ella no se renderiza el widget anti-bot en `/beta`.
- `NEXT_PUBLIC_SITE_URL` — **solo cuando el dominio esté comprado y
  apuntando**. Antes de eso, déjala sin definir: el sitio usará la dirección
  donde está publicado y todo seguirá siendo coherente.

Si faltan, el sitio se publica igual pero los formularios avisan del fallo en
vez de fingir que han enviado.

## Apuntar el dominio

Con `countpips.com` ya comprado: Cloudflare Pages → el proyecto → *Custom
domains* → añadir `countpips.com`. Si el dominio está registrado fuera de
Cloudflare, hay que cambiar sus servidores de nombres a los que Cloudflare
indique; tarda unas horas en propagarse. El certificado HTTPS lo emite
Cloudflare solo, no hay que hacer nada.

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
