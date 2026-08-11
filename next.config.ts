import { execFileSync } from "node:child_process";
import type { NextConfig } from "next";

/* ── EL AÑO DEL AVISO DE COPYRIGHT ─────────────────────────────────────
   Lo escribían el pie y el cajón de navegación con `new Date()
   .getFullYear()`, o sea con el reloj de quien mira. Eso tiene dos
   consecuencias, las dos malas y las dos invisibles hasta el 1 de enero:

     · El HTML se compila una vez y se sirve congelado. En cuanto cambia
       el año, el servidor dice 2026 y el navegador 2027 sobre el mismo
       nodo de texto: desajuste de hidratación, `Minified React error
       #418` en consola, en todas las páginas del sitio, hasta que alguien
       vuelva a publicar.
     · Y un aviso de copyright no declara en qué año estamos: declara
       cuándo se publicó la obra por última vez. El reloj del visitante no
       sabe eso.

   Se resuelve en el único sitio donde se puede: aquí, convirtiéndolo en
   un literal del paquete. Sale de la fecha del último commit —el mismo
   criterio y el mismo motivo que `src/lib/fechas.ts`, que no se puede
   importar desde un componente de cliente porque lee `node:child_process`
   y arrastraría medio Node al navegador—. Dos compilaciones del mismo
   código dan el mismo año. */
function anioDePublicacion(): string {
  try {
    const iso = execFileSync("git", ["log", "-1", "--format=%cI"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5_000,
    }).trim();
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) return String(d.getUTCFullYear());
  } catch {
    /* Sin git —un tarball descargado, por ejemplo— se compila igual. */
  }
  return String(new Date().getUTCFullYear());
}

/* ── DÓNDE CUELGA EL SITIO ─────────────────────────────────────────────
   El mismo código se publica en dos destinos que no sirven las páginas
   desde el mismo sitio:

     · Cloudflare Pages (countpips.com) — RAÍZ del dominio, sin prefijo.
     · GitHub Pages (mmortexx.github.io/JournalTradingWeb) — subdirectorio.

   El prefijo NO puede decidirse por "producción sí / desarrollo no", que
   es como estaba: con esa regla, cualquier compilación de producción
   metía `/JournalTradingWeb` delante de cada ruta, y en un dominio propio
   eso convierte todos los enlaces y todos los recursos en un 404.

   Ahora lo decide el ENTORNO. Sin variable, no hay prefijo — que es lo
   correcto para Cloudflare y también para el desarrollo local, así que el
   caso por defecto es el bueno y el raro tiene que pedirse a propósito:
   el flujo de GitHub Actions declara `NEXT_PUBLIC_BASE_PATH` y es el
   único que lo hace. Si mañana se apaga GitHub Pages, se borra esa línea
   del flujo y aquí no hay que tocar nada.

   Ojo con el detalle que ya mordió una vez: `basePath` afecta a las rutas
   que Next genera, pero NO a las cadenas que compone uno a mano; de eso
   se encarga `asset()` leyendo esta misma variable. Por eso se expone en
   `env` y no se queda como constante privada del build. */
const IS_DEV = process.env.NODE_ENV === "development";
const BASE_PATH = IS_DEV ? "" : (process.env.NEXT_PUBLIC_BASE_PATH ?? "");

const nextConfig: NextConfig = {
  // Exportación estática: vale igual para Cloudflare Pages y GitHub Pages.
  // En desarrollo NO se activa — `output: "export"` con Turbopack en modo
  // dev puede quedarse bloqueado.
  ...(IS_DEV ? {} : { output: "export" }),
  ...(BASE_PATH
    ? { basePath: BASE_PATH, assetPrefix: `${BASE_PATH}/` }
    : {}),
  /* Aquí se probó `experimental.viewTransition`, la bandera que hace que
     React envuelva cada navegación en `startViewTransition`. No sirve
     con esta versión: el componente que necesita —
     `unstable_ViewTransition`— sólo existe en las compilaciones
     experimentales de React, y la 19.2.3 estable que trae el proyecto
     no lo exporta ni en los tipos ni en el runtime (comprobado en
     ambos). La bandera compila, pero no habilita nada.

     La transición la dispara `TransicionPagina.tsx` llamando a la API
     del navegador directamente, que sí está disponible. */
  env: {
    NEXT_PUBLIC_BASE_PATH: BASE_PATH,
    // Ver `anioDePublicacion()` arriba: el año del aviso de copyright,
    // fijado en la compilación y no leído del reloj del visitante.
    NEXT_PUBLIC_ANIO_PUBLICACION: anioDePublicacion(),
    // Dirección pública del sitio (ver src/lib/site.ts). Se declara aquí
    // por el mismo motivo que las de abajo: sin declararla, la expresión
    // `process.env.X` sobrevive al empaquetado y revienta en el navegador.
    // Vacía = se usa el valor por defecto, que es la dirección donde el
    // sitio está publicado HOY. Se define con el dominio propio cuando
    // exista y esté apuntando, no antes.
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "",
    // Destino de los formularios (ver src/lib/forms.ts). Se declara aquí, y
    // no solo en el entorno, para que Next SIEMPRE lo sustituya por un
    // literal en el bundle del cliente. Si se deja sin declarar y la
    // variable no está definida, `process.env.X` sobrevive tal cual al
    // bundle y lanza "process is not defined" en el navegador, tumbando el
    // módulo entero. Sin valor queda "" y los formularios avisan del fallo.
    NEXT_PUBLIC_WEB3FORMS_KEY: process.env.NEXT_PUBLIC_WEB3FORMS_KEY ?? "",
    // URL del script de Google que guarda las altas. Mismo motivo para
    // declararlo aquí que la clave de arriba.
    NEXT_PUBLIC_WAITLIST_URL: process.env.NEXT_PUBLIC_WAITLIST_URL ?? "",
    NEXT_PUBLIC_BETA_API_URL: process.env.NEXT_PUBLIC_BETA_API_URL ?? "",
    NEXT_PUBLIC_POSTHOG_KEY: process.env.NEXT_PUBLIC_POSTHOG_KEY ?? "",
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "",
  },
  images: {
    // No loader needed for static export; we use SVG/unoptimized images only.
    unoptimized: true,
  },
  // Sin `typescript.ignoreBuildErrors`: estaba en `true`, lo que dejaba
  // publicar el sitio con errores de tipos dentro. Se puso para tolerar
  // examples/websocket/, que no compilaba porque le faltaban sus librerías;
  // ese directorio ya no existe, así que la excusa tampoco. Ahora un error
  // de tipos rompe el build y no llega a producción.
  /* Estaba en `false`. El modo estricto de React no cambia nada en
     producción: en desarrollo monta y desmonta cada efecto una vez de
     más para destapar los que no limpian lo que abren — intervalos,
     escuchas, animaciones. Este proyecto tiene unos cuantos: el reloj de
     la barra, la secuencia de intro, el atlas del fondo, los
     observadores de scroll. Apagarlo era renunciar justo al aviso que
     aquí hace falta. */
  reactStrictMode: true,
  ...(IS_DEV ? {} : { trailingSlash: true }),
};

export default nextConfig;
