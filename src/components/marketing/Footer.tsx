"use client";

import { Link } from "@/components/tj/LocaleLink";
import { useLang } from "@/lib/i18n";
import { GlossaryLauncher } from "@/components/tj/GlossaryLauncher";
import { BrandGlyph } from "@/components/tj/BrandGlyph";
import { reopenConsent } from "@/lib/consent";
import { ANIO_PUBLICACION, FECHA_PUBLICACION } from "@/lib/publicacion";
import { LOCALE_FECHA } from "@/lib/trading/format";

/** El único perfil externo que existe: el código de esta web. */
const REPOSITORIO = "https://github.com/mmortexx/CountPipsWeb";

/**
 * Pie del sitio: marca con lema y plataforma, cuatro columnas de enlaces
 * (Producto, Recursos, Empresa, Legal) y una línea final con el copyright,
 * la fecha de publicación, los idiomas, el código de la web y las
 * preferencias de privacidad. Solo enlaza lo que existe: ni perfiles
 * sociales sin cuenta detrás ni indicadores de estado que no miden nada.
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
        { label: es ? "Novedades" : "Changelog", href: "/about#changelog" },
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

  return (
    <footer className="tj-pie relative mt-auto safe-bottom">
      <div className="tj-container relative py-12 md:py-16">
        {/* Cinco columnas desde `lg`: marca y cuatro de enlaces. En
            tableta la marca sube a su propia fila y los enlaces van en
            cuatro columnas — con las cinco a 820 px cada una medía unos
            100 px y «Operativa manual», «Acceso anticipado» o «Test de
            disciplina» caían en dos renglones. En móvil, dos filas de dos,
            que es lo que cabe en 376 px sin apretar. */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-8 md:gap-10">
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            {/* `-my-2 py-2` es un truco con un motivo: el bloque medía 28 px
                de alto, y un dedo no acierta 28 px. El relleno lo lleva a
                44; el margen negativo devuelve exactamente esos 8 px por
                arriba y por abajo, así que la zona que se puede tocar
                crece y NADA se mueve de sitio. Subir el alto a secas
                habría empujado el resto de la columna. */}
            <Link
              href="/"
              className="flex items-center gap-2.5 group rounded-[4px] -my-2 py-2"
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
            <p className="mt-2 text-[13px] text-tertiary max-w-xs leading-relaxed">
              {lang === "es" ? "Diario de trading para Windows 10 y 11." : "Trading journal for Windows 10 and 11."}
            </p>
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
                          className="link-underline-host inline-flex items-center min-h-[44px] [@media(pointer:fine)]:min-h-[34px] w-full text-left text-sm text-secondary hover:text-primary transition-colors duration-200"
                        >
                          <span className="link-underline">{l.label}</span>
                        </button>
                      </GlossaryLauncher>
                    ) : (
                      <Link
                        href={l.href}
                        className="inline-flex items-center min-h-[44px] [@media(pointer:fine)]:min-h-[34px] w-full text-sm text-secondary hover:text-primary transition-colors duration-200"
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


        {/* Barra final: copyright a un lado; fecha, idiomas y
            preferencias al otro. `data-pie-final` es la marca que mide el
            botón de subir para quedarse encima al llegar aquí. */}
        <div data-pie-final className="mt-6 flex flex-col lg:flex-row items-center justify-between gap-4">
          <p className="text-xs text-secondary">
            © <span className="tnum">{year}</span> {t("appName")}. {t("rights")}
          </p>
          {/* Los puntos separadores solo desde `lg`, donde la fila cabe en
              una línea; por debajo se parte y separa el hueco. La fecha sale
              del último commit (`publicacion.ts`), no del reloj de quien mira. */}
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 lg:gap-x-3 text-xs text-secondary">
            {FECHA_PUBLICACION && (
              <>
                <span>
                  {es ? "Sitio actualizado el " : "Site updated "}
                  <time dateTime={FECHA_PUBLICACION}>
                    {new Date(FECHA_PUBLICACION).toLocaleDateString(LOCALE_FECHA[es ? "es" : "en"], {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      timeZone: "UTC",
                    })}
                  </time>
                </span>
                <span aria-hidden className="hidden lg:inline opacity-40">·</span>
              </>
            )}
            <span>ES + EN</span>
            <span aria-hidden className="hidden lg:inline opacity-40">·</span>
            <a
              href={REPOSITORIO}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline-host inline-flex min-h-[44px] items-center gap-1.5 text-xs text-secondary transition-colors hover:text-primary focus-visible:text-primary"
            >
              <GitHubIcon />
              <span className="link-underline">{es ? "Código de la web" : "Website source"}</span>
            </a>
            <span aria-hidden className="hidden lg:inline opacity-40">·</span>
            {/* Retirar el consentimiento tiene que ser tan fácil como darlo
                (RGPD), y el pie está en todas las páginas. */}
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

function GitHubIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49v-1.71c-2.78.62-3.37-1.21-3.37-1.21-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.27 2.75 1.05a9.36 9.36 0 015 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9v2.82c0 .27.18.59.69.49A10.26 10.26 0 0022 12.25C22 6.58 17.52 2 12 2z" />
    </svg>
  );
}
