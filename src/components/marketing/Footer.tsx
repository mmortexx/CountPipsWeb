"use client";

import { type ReactElement } from "react";
import { Link } from "@/components/tj/LocaleLink";
import { useLang } from "@/lib/i18n";
import { GlossaryLauncher } from "@/components/tj/GlossaryLauncher";
import { MagneticButton } from "@/components/tj/MagneticButton";
import { BrandGlyph } from "@/components/tj/BrandGlyph";
import { reopenConsent } from "@/lib/consent";
import { ANIO_PUBLICACION } from "@/lib/publicacion";

/**
 * Social link definition — icon + accessible label.
 *
 * SOLO PERFILES QUE EXISTEN. Aquí había cinco iconos y cuatro apuntaban a
 * `href="#"` porque las cuentas no estaban creadas: X, YouTube, Discord y
 * RSS. Eso son cuatro enlaces muertos repetidos en las diez páginas del
 * sitio, y un enlace que no lleva a ninguna parte cuesta más credibilidad
 * de la que aporta el icono.
 *
 * Se quedan fuera hasta que la cuenta exista de verdad. Para volver a
 * ponerlos basta añadir la línea con su dirección real — los iconos siguen
 * definidos más abajo, no hay que rehacer nada.
 *
 * El RSS además no puede existir todavía por otro motivo: no hay blog del
 * que emitir un canal.
 */
type SocialLink = { label: string; href: string; Icon: () => ReactElement };

const SOCIAL_LINKS: SocialLink[] = [
  { label: "GitHub", href: "https://github.com/mmortexx/CountPipsWeb", Icon: GitHubIcon },
];

/**
 * Institutional closing footer — the "closing statement" of the marketing
 * site, designed to read as the footer of a Stripe / Linear / Vercel /
 * Bloomberg fintech product rather than a generic link dump.
 *
 * Layout — 4-column responsive grid (`grid-cols-2 md:grid-cols-[1.6fr_1fr_1fr_1fr]`):
 *  - Brand column (1.6fr): the candlestick brand mark + wordmark lockup
 *    (mirrors `Navbar.BrandMark` exactly so the lockup reads as one
 *    product across the chrome), the tagline (`t("tagline")` —
 *    "Tu operativa, medida." / "Your trading, measured."), a "100 % local"
 *    inline pill (lock glyph + label, signalling the local-first promise
 *    inline), and the 5 social icons (28px hit-targets, `MagneticButton`
 *    wrappers with a 0.3 magnetic pull, `liquid-glass` surface).
 *  - 3 link columns (1fr each): Producto / Recursos / Empresa, each with
 *    a refined `.eyebrow` header (uppercase, wide tracking, text-tertiary)
 *    and `text-sm text-secondary hover:text-primary` links that carry the
 *    `.link-underline` left-sweep accent underline on hover (the design
 *    system's inline-text hover affordance — the same one the FAQ support
 *    link uses, and the one `globals.css` documents as the canonical
 *    "Footer columns" treatment).
 *
 * Trust strip — a row of 4 small inline pills ("Pago único · Sin
 * suscripción", "Datos 100 % locales", "ES + EN", "Garantía 30 días")
 * with un filete y un tinte muy leves, ambos atados a `--divider`.
 * Reads as a quiet institutional credentials row — the PositioningStrip
 * on the home page carries the visual version of these; the footer's is
 * the closing reminder.
 *
 * Bottom bar — copyright on the left, status indicator + legal links +
 * version + locale on the right. The status indicator is a pulsing
 * emerald dot + "All systems operational" label (Stripe / Vercel pattern).
 * The top edge is the `.liquid-glass::before` machined rim PLUS a
 * filete `border-t` atado a `--divider` para que el pie se lea como panel
 * closing panel rather than a soft fade.
 *
 * Material — `liquid-glass` (rgba(0,0,0,0.4) + 4px blur + machined inset
 * edges + `::before` rim gradient) — the same surface language as the
 * Navbar's scrolled state, demo chrome, and floating cards.
 * `safe-bottom` clears the iOS home indicator via env(safe-area-inset-bottom).
 *
 * SIN RADIO EN LA ESQUINA SUPERIOR. Llevaba `rounded-t-xl`, y el resultado
 * era que una banda a sangre completa —pegada a los dos bordes de la
 * ventana y al inferior— se redondeaba solo por arriba. Eso no lee como
 * "cerrar la página con suavidad": lee como una tarjeta gigante mal
 * recortada, porque el rim de `liquid-glass::before` hereda el radio y
 * dibuja el contorno curvo contra un elemento que no tiene margen donde
 * apoyarlo. Un elemento a sangre no se redondea; se separa con un filete,
 * que es lo que hace ya el `border-t`.
 *
 * Accessibility — `<footer>` landmark with three `<nav aria-label="...">`
 * subsections (one per link column) so screen-reader users can navigate
 * the footer by section. Links use `.link-underline` which exposes its
 * hover affordance to `:focus-visible` as well (so keyboard focus also
 * draws the accent underline). The pulsing status dot is `aria-hidden`
 * (decorative); the "All systems operational" text is the accessible
 * label. The lock glyph in the "100 % local" pill is `aria-hidden`.
 */
export function Footer() {
  const { t, lang } = useLang();
  const es = lang === "es";
  // El año de publicación, fijado al compilar. Nunca `new Date()`: el
  // porqué está en `next.config.ts`, junto a `anioDePublicacion()`.
  const year = ANIO_PUBLICACION;

  type FooterLink = {
    label: string;
    href: string;
    /** When true, render as a GlossaryModal trigger instead of an <a>. */
    glossary?: boolean;
  };

  const cols: { title: string; links: FooterLink[] }[] = [
    {
      title: es ? "Producto" : "Product",
      links: [
        { label: es ? "Características" : "Features", href: "/features" },
        { label: es ? "Demo" : "Demo", href: "/demo" },
        { label: es ? "Operativa manual" : "Manual trading", href: "/traders/manual" },
        { label: es ? "Prop firms" : "Prop firms", href: "/traders/prop-firms" },
        { label: es ? "Acceso anticipado" : "Early access", href: "/beta" },
        { label: es ? "Precios" : "Pricing", href: "/pricing" },
        { label: "Changelog", href: "/about#changelog" },
      ],
    },
    {
      title: es ? "Recursos" : "Resources",
      links: [
        { label: "FAQ", href: "/faq" },
        { label: es ? "Glosario" : "Glossary", href: "/glosario" },
        { label: es ? "Herramientas" : "Tools", href: "/herramientas" },
        { label: es ? "Test de disciplina" : "Discipline test", href: "/test" },
      ],
    },
    {
      title: es ? "Empresa" : "Company",
      links: [
        { label: es ? "Acerca de" : "About", href: "/about" },
        /* «Contacto» llevaba a /about, donde NO hay ningún formulario: el
           único del sitio vive en /faq. Quien pulsaba aquí aterrizaba en la
           historia del producto y tenía que buscarse la vida. */
        { label: es ? "Contacto" : "Contact", href: "/faq#contacto" },
      ],
    },
    {
      /* Columna legal. Antes «Privacidad» y «Términos» colgaban de
         «Empresa» y apuntaban a `#` —dos enlaces muertos en las diez
         páginas— mientras dos formularios recogían correos. Ahora las
         cuatro existen y tienen su columna, que es donde las busca quien
         las busca. */
      title: es ? "Legal" : "Legal",
      links: [
        { label: es ? "Privacidad" : "Privacy", href: "/privacidad" },
        { label: es ? "Términos" : "Terms", href: "/terminos" },
        { label: "Cookies", href: "/cookies" },
        { label: es ? "Aviso legal" : "Legal notice", href: "/aviso-legal" },
      ],
    },
  ];

  // Trust-signal pills — single-row strip above the bottom bar. Compact
  // pills with a hairline border + faint tint so the strip reads as a
  // quiet institutional credentials row, not a feature gallery. The
  // PositioningStrip on the home page carries the visual version of these;
  // the footer's is the closing reminder.

  // SE QUEDA EN `liquid-glass` a propósito: el pie es una banda a ancho
  // completo, no una tarjeta, y el papel —con su grano y su sombra
  // proyectada— convertiría el cierre de la página en una hoja flotando sin
  // apoyo. `glass-band` cuelga además del selector `.liquid-glass.glass-band`,
  // así que renombrar la clase apagaría la luz del canto superior. Mismo caso
  // que la cinta de cotizaciones.
  return (
    <footer className="relative mt-auto border-t border-[var(--line)] bg-[var(--bg)] safe-bottom">
      {/* `tj-container` (T2a's fluid gutter system: clamp(1.25rem, 4vw, 2.25rem))
          — same fluid gutter rhythm as Hero, StatsBand, MetricsShowcase, etc.
          so the footer's left/right inset reads as one with the page above it
          rather than a separate px-5/md:px-8 silo. `py-12 md:py-16` preserved
          for vertical breath. */}
      <div className="tj-container relative py-12 md:py-16">
        {/* Cinco columnas desde `md`, no cuatro: la legal es nueva. En
            móvil siguen siendo dos, y las cuatro de enlaces caen en dos
            filas de dos, que es lo que cabe en 376 px sin apretar. */}
        <div className="grid grid-cols-2 md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-8 md:gap-10">
          {/* Brand column — candlestick mark + wordmark lockup (mirrors
              Navbar.BrandMark exactly), tagline, "100 % local" inline
              pill, and the 5 social icons. The lockup matches the
              navbar's so the brand reads as one product across the
              chrome — same `text-[15px] font-semibold tracking-tight`
              wordmark ratio (Stripe / Linear / Vercel product-mark). */}
          <div className="col-span-2 md:col-span-1">
            {/* `-my-2 py-2` es un truco con un motivo: el bloque medía 28 px
                de alto, y un dedo no acierta 28 px. El relleno lo lleva a
                44; el margen negativo devuelve exactamente esos 8 px por
                arriba y por abajo, así que la zona que se puede tocar
                crece y NADA se mueve de sitio. Subir el alto a secas
                habría empujado el resto de la columna. */}
            <Link
              href="/"
              className="flex items-center gap-2.5 group rounded-[2px] -my-2 py-2"
              aria-label={t("appName")}
            >
              <BrandMark />
              <span className="text-[15px] font-semibold tracking-tight text-primary">
                {t("appName")}
              </span>
            </Link>
            <p className="mt-4 text-sm text-secondary max-w-xs leading-relaxed">
              {t("tagline")}
            </p>


            {/* Social links — icon-only buttons at the WCAG 2.5.5 (AAA)
                44 px tap target. P4 fix: this was `h-9 w-9` (36 px) which
                reads as a refined chip but is below the 44 px threshold
                the rest of the chrome holds (footer link rows, cookie
                buttons, BackToTop). Bumped to `h-11 w-11` (44 px) so the
                footer's social row is consistent with the rest of the
                site's touch language; the 14 px SVGs now sit with ~15 px
                of optical padding, which reads as deliberately generous
                (Stripe / Linear pattern) rather than cramped. `gap-2.5`
                (10 px) gives the row a touch more breathing room than
                the previous `gap-2` (8 px) — same premium-editorial
                rhythm the eyebrow column headers use. MagneticButton
                preserves the magnetic pull on fine-pointer devices. */}
            <div className="mt-4 -ml-3 flex items-center gap-1">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <MagneticButton
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  ariaLabel={label}
                  strength={0.3}
                  className="icon-btn grid h-11 w-11 place-items-center rounded-[4px] text-secondary transition-colors duration-150 hover:text-primary focus-visible:bg-[rgb(var(--divider)/0.08)] focus-visible:text-primary"
                >
                  <Icon />
                </MagneticButton>
              ))}
            </div>
          </div>

          {/* Link columns — refined `.eyebrow` header (uppercase, wide
              tracking, text-tertiary) + links in `text-sm text-secondary`
              that lift to `text-primary` on hover with a `.link-underline`
              left-sweep accent underline on hover/focus-visible (the design
              system's documented "Footer columns" affordance). Each column
              wrapped in its own `<nav aria-label>` so screen-reader users
              can jump between sections. */}
          {cols.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              {/* NO es un encabezado, y antes lo era (h3). El pie se
                  publica igual en las diez páginas, y esta web genera el
                  HTML con streaming: el marcador de carga de `<main>` se
                  serializa antes de que el contenido real —con su h1—
                  se inyecte, así que en el documento tal como llega al
                  navegador el `<footer>` va ANTES del titular de la
                  página. Con tres `<h3>` aquí, cualquiera que recorra el
                  documento por encabezados —o lo lea antes de que
                  termine de hidratarse— topaba con tres de nivel 3 sin
                  que existiera todavía ningún h1 ni h2.

                  No hacía falta que fueran encabezados para empezar: el
                  `<nav aria-label={col.title}>` que envuelve cada columna
                  ya le da nombre a la sección para quien navega por
                  regiones, que es la vía pensada para esto. El tamaño no
                  depende de la etiqueta —lo pone `.eyebrow`—, así que el
                  aspecto no cambia. */}
              <p className="eyebrow mb-3.5">{col.title}</p>
              {/* Each link is an inline-flex row with `min-h-[44px]` so the
                  tap target clears the WCAG 2.5.5 (AAA) 44 px threshold on
                  mobile without bloating the desktop rhythm — the row's
                  intrinsic height is the target, not the text bbox. The
                  visible accent underline lives on the inner `<span>`
                  (carrying `.link-underline`) so the sweep stays anchored
                  to the text rather than the bottom of the 44 px row,
                  which would otherwise read as a divider. `w-full` on the
                  outer `<a>`/`<button>` extends the tap zone across the
                  column, so a slightly-off tap on the right padding still
                  lands on the link. */}
              <ul>
                {col.links.map((l) => (
                  <li key={`${col.title}-${l.href}-${l.label}`}>
                    {l.glossary ? (
                      /* El glosario se carga al pulsarlo, no al pintar el
                         pie — que sale en las nueve rutas. Ver el
                         encabezado de GlossaryLauncher. */
                      <GlossaryLauncher>
                        <button
                          type="button"
                          className="link-underline-host inline-flex items-center min-h-[44px] w-full text-left text-sm text-secondary hover:text-primary transition-colors duration-200"
                        >
                          <span className="link-underline">{l.label}</span>
                        </button>
                      </GlossaryLauncher>
                    ) : (
                      <Link
                        href={l.href}
                        className="inline-flex items-center min-h-[44px] w-full text-sm text-secondary hover:text-primary transition-colors duration-200"
                      >
                        <span className="link-underline">{l.label}</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 h-px bg-[var(--line)]" />


        {/* Bottom bar — left: © year appName. rights; right: status
            indicator (pulsing emerald dot + label) + Privacy/Terms legal
            links + version + locale. Hairline top via the divider-grad
            above. Status dot is decorative (aria-hidden); the label text
            carries the accessible meaning. `mt-8` separates it from the
            trust pills above. */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-secondary">
            © <span className="tnum">{year}</span> {t("appName")}. {t("rights")}
          </p>
          {/* R27-1c — bottom bar cluster bumped from text-tertiary to
              text-secondary. VLM flagged the copyright + legal links as
              washed out on the bright footer surface; the parent already
              had tertiary here, but `border-[rgb(var(--divider)/0.1)]` +
              `liquid-glass` produce a near-white panel in light theme
              where tertiary's ≈5.5:1 reads as faded on small 12px text.
              The version `v1.4.2` is overridden back to text-tertiary
              below — it's pure metadata and the dimmer weight helps it
              read as secondary information next to the legal links. */}
          <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-xs text-secondary">
            {/* Aquí había un punto verde con «Sistemas operativos» que no
                consultaba absolutamente nada: era verde siempre, por
                estar escrito en verde. Un indicador de estado que no mide
                el estado es peor que ninguno — el día que algo se caiga
                seguirá diciendo que todo va bien.

                Y va acompañado de otra retirada: el pie declaraba la
                versión «v1.4.2» de un programa que aún no se puede
                descargar. Las dos afirmaciones se sostenían en el mismo
                historial de versiones inventado que se acaba de convertir
                en hoja de ruta.

                Cuando exista un servicio real que vigilar, esto vuelve —
                leyendo de algún sitio. */}
            {/* Aquí vivían otra vez «Privacidad» y «Términos», los mismos
                dos enlaces que la columna «Empresa» de arriba ya lista a
                unos centímetros. Duplicados y, además, rotos de otra
                manera: sin altura propia medían 16 px de alto, la mitad
                del mínimo que se puede acertar con el pulgar, mientras
                que los de la columna sí tienen sus 44 px.

                Se quedan los de la columna y desaparecen éstos: un mismo
                destino repetido dos veces en el mismo pie no da acceso,
                da ruido — y el que se retira era justo el inservible. */}
            <span>ES + EN</span>
            <span aria-hidden className="opacity-40">·</span>
            {/* ── RETIRAR EL CONSENTIMIENTO ────────────────────────────
                La política de privacidad instruye a "volver a elegir
                «Solo necesarias»" para dejar de ser medido. Ese aviso no
                volvía a salir nunca y no había ningún control en toda la
                web para provocarlo: la única vía real era abrir las
                herramientas del navegador y vaciar el almacenamiento del
                sitio. El RGPD pide que retirarlo sea tan fácil como
                darlo, y darlo era un clic.

                Va en el pie porque el pie está en las 154 páginas: la
                puerta de salida no puede estar sólo en la página que
                habla de cookies. Altura mínima de 44 px como el resto de
                objetivos táctiles del pie. */}
            <ConsentPreferencesButton />
          </div>
        </div>
      </div>
    </footer>
  );
}

/**
 * ConsentPreferencesButton — la puerta de salida de la analítica.
 *
 * Vuelve a abrir el aviso de consentimiento para poder cambiar la
 * elección. No borra nada al pulsarlo: quien lo abre y no toca nada
 * conserva lo que tenía. La retirada la ejecuta el propio aviso al elegir
 * "Solo necesarias".
 *
 * Se renderiza como texto, no como botón con caja, porque comparte fila
 * con los metadatos del pie; pero lleva `min-h-[44px]` para cumplir el
 * objetivo táctil de WCAG 2.5.5 igual que el resto de enlaces del pie, y
 * subrayado al enfocar con teclado.
 */
function ConsentPreferencesButton() {
  const { lang } = useLang();
  const es = lang === "es";
  return (
    <button
      type="button"
      onClick={reopenConsent}
      className="link-underline-host inline-flex min-h-[44px] items-center text-xs text-secondary transition-colors hover:text-primary focus-visible:text-primary"
    >
      <span className="link-underline">
        {es ? "Preferencias de privacidad" : "Privacy preferences"}
      </span>
    </button>
  );
}

/** BrandMark — el glifo de la marca, sin placa. */
function BrandMark() {
  return <BrandGlyph size={24} className="shrink-0" />;
}

/* ---------------- Inline brand SVG icons (currentColor, 14px box) ---------------- */

function GitHubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49v-1.71c-2.78.62-3.37-1.21-3.37-1.21-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05a9.36 9.36 0 015 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9v2.82c0 .27.18.59.69.49A10.26 10.26 0 0022 12.25C22 6.58 17.52 2 12 2z" />
    </svg>
  );
}

/* Aquí dormían los iconos de X, YouTube, Discord y RSS: cuatro SVG
   completos que no dibujaba nadie. El pie sólo enlaza el repositorio, y no
   hay cuenta de ninguna de esas cuatro cosas que enlazar — pintar el icono
   antes de tener el sitio al que lleva es prometer una comunidad que no
   existe. Cuando haya una, el icono se escribe entonces; el trabajo de
   volver a teclear un `path` de SVG no compensa tener cuatro puertas
   pintadas en la pared durante meses. */
