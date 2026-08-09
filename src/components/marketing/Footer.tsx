"use client";

import { type ReactElement } from "react";
import { Link } from "@/components/tj/LocaleLink";
import { useLang } from "@/lib/i18n";
import { GlossaryLauncher } from "@/components/tj/GlossaryLauncher";
import { MagneticButton } from "@/components/tj/MagneticButton";
import { BrandGlyph } from "@/components/tj/BrandGlyph";
import { reopenConsent } from "@/lib/consent";

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
  const year = new Date().getFullYear();

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
        /* El glosario ya NO abre la ventana emergente desde aquí: tiene
           sección propia con 51 páginas. La ventana sigue existiendo para
           consultar un término sin salir de la página que estás leyendo,
           que es otro caso de uso; desde el pie, lo que se espera al
           pulsar «Glosario» es ir al glosario. */
        { label: es ? "Glosario" : "Glossary", href: "/glosario" },
        { label: es ? "Herramientas" : "Tools", href: "/herramientas" },
        // "Blog" entry removed in R20-2b — no blog exists yet (re-add when
        // /blog lands). "Documentación" aliases /faq (FAQ serves as docs).
        { label: es ? "Documentación" : "Docs", href: "/faq" },
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
  const trust: string[] = [
    es ? "Demo interactiva · Sin registro" : "Interactive demo · No sign-up",
    es ? "Datos 100 % locales" : "100 % local data",
    "ES + EN",
    es ? "Acceso anticipado privado" : "Private early access",
  ];

  // SE QUEDA EN `liquid-glass` a propósito: el pie es una banda a ancho
  // completo, no una tarjeta, y el papel —con su grano y su sombra
  // proyectada— convertiría el cierre de la página en una hoja flotando sin
  // apoyo. `glass-band` cuelga además del selector `.liquid-glass.glass-band`,
  // así que renombrar la clase apagaría la luz del canto superior. Mismo caso
  // que la cinta de cotizaciones.
  return (
    <footer className="relative mt-auto liquid-glass glass-band border-t border-[rgb(var(--divider)/0.1)] safe-bottom">
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
              className="flex items-center gap-2.5 group rounded-md -my-2 py-2"
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

            {/* Local-first badge — small inline pill (lock glyph + label).
                Signals the "your data never leaves your machine" promise
                inline in the brand column. Same hairline language as the
                rest of the design system (filete sobre `--divider`). */}
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-[2px] border border-[rgb(var(--divider)/0.1)] bg-[rgb(var(--divider)/0.04)] px-2.5 py-1 text-[11px] font-medium text-secondary">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M5 7V5a3 3 0 016 0v2M4 7h8v7H4V7z"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{es ? "100 % local" : "100 % local"}</span>
            </div>

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
            <div className="mt-6 flex items-center gap-2.5">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <MagneticButton
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  ariaLabel={label}
                  strength={0.3}
                  className="icon-btn grid h-11 w-11 place-items-center rounded-[2px] bg-[rgb(var(--divider)/0.05)] text-secondary transition-colors duration-150 hover:bg-[rgb(var(--divider)/0.08)] hover:text-primary focus-visible:bg-[rgb(var(--divider)/0.08)] focus-visible:text-primary"
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
                  <li key={l.label}>
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

        {/* Structural separator — filete de 1px sobre `--divider`, en degradado
            12% opacity. Floats rather than terminating in a hard edge.
            Sits BETWEEN the link grid above and the trust-pills + bottom-bar
            cluster below — the link grid is the footer's primary content
            (navigation), and the trust pills + bottom bar are meta
            (credentials, copyright, status). The hairline gives the meta
            region its own visual zone rather than letting the pills float
            ambiguously between the two. `mt-12` gives the grid room to
            breathe above; `mb-8` gives the pills room below. */}
        <div className="divider-grad mt-12 mb-8" />

        {/* Trust signals — compact inline pill strip. Hairline border +
            faint tint so the pills read as quiet credentials, not as
            feature cards (PositioningStrip on the home page already
            carries the visual version). `flex-wrap` lets the row reflow
            on narrow viewports; `gap-2` keeps a tight institutional
            rhythm. Sits directly above the bottom bar so the two read
            as a single "meta region" separated from the link grid by
            the divider-grad above. */}
        <div className="flex flex-wrap items-center gap-2">
          {trust.map((item) => (
            <span
              key={item}
              className="inline-flex items-center rounded-[2px] border border-[rgb(var(--divider)/0.1)] bg-[rgb(var(--divider)/0.02)] px-2.5 py-1 text-xs text-tertiary"
            >
              {item}
            </span>
          ))}
        </div>

        {/* Bottom bar — left: © year appName. rights; right: status
            indicator (pulsing emerald dot + label) + Privacy/Terms legal
            links + version + locale. Hairline top via the divider-grad
            above. Status dot is decorative (aria-hidden); the label text
            carries the accessible meaning. `mt-8` separates it from the
            trust pills above. */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
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

/**
 * BrandMark — el logotipo (`BrandGlyph`, el mismo que la barra superior,
 * la intro y el cromo de la demo) sobre un cuadrado de vidrio mecanizado.
 *
 * Antes dibujaba aquí su propio trío de velas, "idéntico" al de la barra
 * superior salvo que no lo era: las mechas iban a 0,5 de opacidad en vez
 * de 0,45 y los cuerpos a otras alturas. Dos copias de una marca. Ahora
 * hay un único glifo y esto sólo pone la placa.
 *
 * La placa combina:
 *  - base de vidrio para que el dorado del logotipo resalte,
 *  - filete de 1 px con el mismo lenguaje que el resto del sistema,
 *  - realce blanco de 1 px arriba (el canto mecanizado de
 *    `.liquid-glass`),
 *  - un halo radial del acento desde el borde superior.
 *
 * `overflow-hidden` recorta el halo al cuadrado redondeado.
 *
 * Ya NO se le pasa un color de texto: el logotipo lleva su propia paleta
 * —la piel marrón, el dorado de las velas, el crema del canto—, que es lo
 * que lo hace reconocible como el icono del escritorio. Heredar la tinta
 * del tema lo convertiría en otra cosa. El glifo sube de 16 a 20 px por
 * el mismo motivo que en la barra: es un icono macizo y no una silueta
 * abierta, así que necesita menos aire alrededor.
 */
function BrandMark() {
  return (
    <span
      className="relative shrink-0 w-7 h-7 rounded-md grid place-items-center border overflow-hidden"
      style={{
        borderColor: "rgb(var(--divider) / 0.13)",
        background: "color-mix(in srgb, var(--surface) 66%, transparent)",
        boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.08)",
      }}
    >
      <span
        aria-hidden
        className="absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 0%, rgb(var(--accent-base) / 0.35) 0%, rgb(var(--accent-base) / 0) 60%)",
        }}
      />
      <BrandGlyph size={20} className="relative" />
    </span>
  );
}

/* ---------------- Inline brand SVG icons (currentColor, 14px box) ---------------- */

function GitHubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49v-1.71c-2.78.62-3.37-1.21-3.37-1.21-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05a9.36 9.36 0 015 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9v2.82c0 .27.18.59.69.49A10.26 10.26 0 0022 12.25C22 6.58 17.52 2 12 2z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.66l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117l11.966 15.644z" />
    </svg>
  );
}

function YouTubeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M23.5 6.2a3.02 3.02 0 00-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.51A3.02 3.02 0 00.5 6.2C0 8.08 0 12 0 12s0 3.92.5 5.8a3.02 3.02 0 002.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 002.12-2.14c.5-1.88.5-5.8.5-5.8s0-3.92-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.317 4.369a19.79 19.79 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.249a18.27 18.27 0 00-5.487 0 12.6 12.6 0 00-.617-1.25.077.077 0 00-.079-.036A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028 14.09 14.09 0 001.226-1.994.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128c.126-.094.252-.192.371-.291a.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 01.078.009c.12.099.245.198.372.292a.077.077 0 01-.006.127c-.598.349-1.22.645-1.873.892a.076.076 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.84 19.84 0 006.002-3.03.077.077 0 00.032-.056c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 00-.031-.028zM8.02 15.331c-1.182 0-2.157-1.085-2.157-2.419 0-1.333.956-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.418 2.157-2.418 1.21 0 2.176 1.094 2.157 2.418 0 1.334-.946 2.419-2.157 2.419z" />
    </svg>
  );
}

function RSSIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6.18 15.64a2.18 2.18 0 012.18 2.18C8.36 19 7.38 20 6.18 20A2.18 2.18 0 014 17.82a2.18 2.18 0 012.18-2.18M4 4.44A15.56 15.56 0 0119.56 20h-2.83A12.73 12.73 0 004 7.27V4.44m0 5.66a9.9 9.9 0 019.9 9.9h-2.83A7.07 7.07 0 004 12.93V10.1z" />
    </svg>
  );
}
