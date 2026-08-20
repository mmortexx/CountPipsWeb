"use client";

import { Link } from "@/components/tj/LocaleLink";
import { Clock } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Eyebrow } from "@/components/tj/Eyebrow";
import { AnimatedHeading } from "@/components/tj/AnimatedHeading";

/**
 * El registro de una página: qué CLASE de documento es.
 *
 * ── Por qué la cabecera necesita saberlo ──────────────────────────────
 * Porque las nueve páginas interiores usaban exactamente la misma, y no
 * son la misma clase de cosa. Un capítulo que explica una idea, una
 * calculadora que se usa, un índice que se consulta, una tarifa que se
 * compara y un texto legal que se archiva tienen ritmos de lectura
 * distintos, y una cabecera idéntica en las cinco le dice al visitante
 * que da igual dónde esté. Da igual dónde esté es exactamente lo que no
 * se quiere de un sitio de nueve páginas.
 *
 * Cada tono cambia tres cosas —el folio del margen, el peso del filete
 * y la medida del titular— y NO cambia ninguna otra: la retícula, los
 * colores y la tipografía son los mismos, porque lo que se busca es que
 * cada página tenga carácter dentro del mismo libro, no que parezca de
 * otro sitio.
 */
export type TonoPagina =
  /** Desarrolla una idea. Folio romano al margen, titular a plena caja. */
  | "capitulo"
  /** Se usa, no se lee. Folio entre corchetes, como una referencia de pieza. */
  | "instrumento"
  /** Se consulta por entradas. El folio es el RECUENTO de lo que contiene. */
  | "registro"
  /** Se compara. El folio es una cifra tabular, del mismo palo que los precios. */
  | "tarifa"
  /** Se archiva. Sin folio y con la medida más estrecha: aquí sobra el ornamento. */
  | "documento";

interface PageHeaderProps {
  eyebrowEs: string;
  eyebrowEn: string;
  titleEs: string;
  titleEn: string;
  /**
   * Optional substring of `titleEs` rendered with the `text-gradient`
   * class. Lets a page keep its "rest + gradient emphasis" design
   * while every char still animates individually. Must live within a
   * single line of `titleEs`.
   */
  titleHighlightEs?: string;
  /** Optional substring of `titleEn` rendered with `text-gradient`. */
  titleHighlightEn?: string;
  subtitleEs: string;
  subtitleEn: string;
  breadcrumbEs: string;
  breadcrumbEn: string;
  /**
   * Optional reading time in minutes (computed at build time by the
   * page from its section content). When provided, a small meta row
   * with a clock icon + "N min de lectura" renders below the subtitle.
   * Omit on pages where reading time doesn't make sense (e.g. pricing).
   */
  readingTimeMin?: number;
  /** Qué clase de documento es esta página. Ver `TonoPagina`. */
  tono?: TonoPagina;
  /**
   * El folio: la marca del margen. Su significado depende del tono — un
   * ordinal romano en un capítulo, una referencia en un instrumento, un
   * recuento en un registro, una cifra en una tarifa. Se omite en los
   * documentos, que no llevan.
   */
  folio?: string;
}

/**
 * La cabecera de todas las páginas interiores.
 *
 * ── Aquí vivía la mitad del «h1 invisible sin JavaScript» ─────────────
 * Las migas, el epígrafe y el subtítulo entraban con `framer-motion` y
 * `initial={{ opacity: 0 }}`, o sea renderizados a opacidad cero en el
 * HTML servido y subidos a uno sólo cuando React hidrata. En una
 * exportación estática eso significa una cabecera en blanco para quien
 * no ejecute JavaScript —incluidos los rastreadores que no lo hacen— y
 * un parpadeo para todos los demás.
 *
 * Ahora la entrada es CSS (`data-entra`, ver globals.css): el HTML sale
 * con el texto a plena tinta y la animación, si el navegador la
 * soporta, va atada al scroll. El componente sigue siendo de cliente
 * sólo por `useLang()`.
 *
 * El titular ya lo había resuelto `AnimatedHeading` en su día por el
 * mismo motivo; ver la nota de su encabezado.
 */
export function PageHeader({
  eyebrowEs,
  eyebrowEn,
  titleEs,
  titleEn,
  titleHighlightEs,
  titleHighlightEn,
  subtitleEs,
  subtitleEn,
  breadcrumbEs,
  breadcrumbEn,
  readingTimeMin,
  tono = "capitulo",
  folio,
}: PageHeaderProps) {
  const { lang } = useLang();
  const es = lang === "es";

  return (
    <section
      className="tj-cabecera relative overflow-clip"
      data-tono={tono}
    >
      {/* Antes: `bg-black` opaco — tapaba el fondo global en todas las
          subpáginas. Ahora el header es transparente y la legibilidad la
          garantiza un scrim lateral (mismo lenguaje que el hero de la
          home): el texto vive sobre la zona velada. */}
      <div aria-hidden className="page-header-scrim" />
      {/* Fade inferior: entrega suave hacia la primera sección velada. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-28"
        style={{
          background:
            "linear-gradient(180deg, transparent, color-mix(in srgb, var(--bg) 52%, transparent))",
        }}
      />
      {/* Section grain — opt-in 3 % fractalNoise overlay so the page
          header reads as the same machined surface as the sections below
          it rather than a flat black void. */}
      <div aria-hidden="true" className="grain absolute inset-0 pointer-events-none" />

      <div className="relative z-10 tj-container">
        {/* El folio. Va en la marginalia, en grande y muy tenue: es la
            marca que distingue una página de otra de un vistazo, antes
            incluso de leer el titular. Decorativo por completo — su
            contenido ya está dicho en el epígrafe y en las migas—, así
            que se oculta a los lectores de pantalla. */}
        {folio && tono !== "documento" && (
          <span aria-hidden className="tj-folio">
            {folio}
          </span>
        )}

        {/* Breadcrumb — Home / <current page>. Plain text on the trailing
            crumb (no link) so users can't tap into the page they're already
            on; the home crumb is the only navigable one. */}
        <nav
          data-entra="1"
          className="flex items-center gap-2 text-xs text-tertiary mb-6"
          aria-label={es ? "Migas de pan" : "Breadcrumb"}
        >
          <Link
            href="/"
            // min-h-[44px] + py + -my-1: el texto es pequeño (xs) pero el
            // área táctil cumple el mínimo de 44 px en móvil sin alterar
            // la altura visual de la fila de migas (el margin negativo
            // compensa el padding para que el layout no se desplace).
            className="inline-flex min-h-[44px] items-center -my-2 py-2 pr-2 hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] rounded-[2px]"
          >
            {es ? "Inicio" : "Home"}
          </Link>
          <span className="opacity-40" aria-hidden="true">/</span>
          <span className="text-secondary" aria-current="page">
            {es ? breadcrumbEs : breadcrumbEn}
          </span>
        </nav>

        <div data-entra="2">
          <Eyebrow>{es ? eyebrowEs : eyebrowEn}</Eyebrow>
        </div>

        {/* El filete bajo el epígrafe se traza de izquierda a derecha al
            entrar la cabecera, y su ancho lo fija el tono: es la
            segunda seña —tras el folio— de qué clase de página es
            ésta. */}
        <div className="tj-filete tj-filete-cabecera mt-4" aria-hidden />

        {/* Title — character-by-character entrance resuelta en CSS. La
            optional `highlight` se renderiza con `text-gradient` para
            conservar el diseño «resto + énfasis» de cada cabecera. */}
        <AnimatedHeading
          text={es ? titleEs : titleEn}
          highlight={es ? titleHighlightEs : titleHighlightEn}
          className="mt-5 t-h1 text-primary"
        />

        {/* La medida va en `ch`, no en `em`. Aquí ponía `max-w-[44em]`,
            que suena acotado pero no lo está: `em` mide contra el tamaño
            de letra, y a 20 px da ~880 px, o sea unos 88 caracteres por
            línea. Pasados los ~75 el ojo pierde el renglón al volver al
            margen izquierdo y hay que releer. `ch` mide en anchos de
            carácter: 62ch son 62 caracteres, y lo siguen siendo si
            mañana cambia el cuerpo. El tono la estrecha o la ensancha
            —un documento legal se lee más apretado que un capítulo—
            desde `--medida`. */}
        <p
          data-entra="3"
          className="mt-5 text-lg md:text-xl text-secondary leading-[1.6]"
          style={{ maxWidth: "var(--medida, 62ch)" }}
        >
          {es ? subtitleEs : subtitleEn}
        </p>

        {/* Reading time meta row — a quiet inline pill that signals the
            page's depth. Only renders when `readingTimeMin` is provided. */}
        {readingTimeMin != null && readingTimeMin > 0 && (
          <div data-entra="4" className="mt-5 flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 rounded-[2px] border border-[rgb(var(--divider)/0.12)] bg-[rgb(var(--divider)/0.03)] px-3 py-1 text-xs font-medium text-tertiary"
              aria-label={es ? `${readingTimeMin} minutos de lectura` : `${readingTimeMin} min read`}
            >
              <Clock size={12} className="opacity-70" aria-hidden />
              <span className="tnum">
                {readingTimeMin} {es ? "min de lectura" : "min read"}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Accent gradient divider — a 1px hairline that transitions from
          transparent → accent → transparent. Reads as a "machined edge"
          that separates the header from the first content section. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 8%, rgb(var(--accent-base) / 0.35) 38%, rgb(var(--accent-base) / 0.5) 50%, rgb(var(--accent-base) / 0.35) 62%, transparent 92%)",
        }}
      />
    </section>
  );
}
