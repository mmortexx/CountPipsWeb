"use client";

import { Link } from "@/components/tj/LocaleLink";
import { useLang, tx } from "@/lib/i18n";
import { openGlossary } from "@/lib/overlays";
import { BrandGlyph } from "@/components/tj/BrandGlyph";
import { reopenConsent } from "@/lib/consent";
import { ANIO_PUBLICACION, FECHA_PUBLICACION } from "@/lib/publicacion";
import { columnasPie } from "@/lib/pie";
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
  // Año de publicación fijado al compilar, nunca `new Date()` (ver
  // `anioDePublicacion()` en `next.config.ts`).
  const year = ANIO_PUBLICACION;

  const cols = columnasPie(lang);

  return (
    <footer className="tj-pie relative mt-auto safe-bottom">
      <div className="tj-container relative py-12 md:py-16">
        {/* Cinco columnas desde `lg` (marca y cuatro de enlaces). En tableta la
            marca sube a su fila; con cinco a 820 px los rótulos largos caían
            en dos renglones. En móvil, dos de dos. */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr_1fr] gap-8 md:gap-10">
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            {/* `-my-2 py-2` lleva la zona táctil de 28 a 44 px sin mover nada: el
                margen negativo devuelve los 8 px de relleno. */}
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
              {tx(lang, { es: "Diario de trading para Windows 10 y 11.", en: "Trading journal for Windows 10 and 11.", pt: "Diário de trading para Windows 10 e 11.", fr: "Journal de trading pour Windows 10 et 11.", de: "Trading-Journal für Windows 10 und 11.", it: "Diario di trading per Windows 10 e 11." })}
            </p>
          </div>

          {/* Cada columna va en su `<nav aria-label>` para navegar por regiones. */}
          {cols.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              {/* No es un encabezado (`h3`): el HTML llega por streaming y el
                  pie quedaría antes del h1 de la página. El `<nav aria-label>`
                  ya nombra la sección y el tamaño lo pone `.eyebrow`. */}
              <p className="eyebrow mb-3.5">{col.title}</p>
              {/* Cada enlace es una fila `min-h-[44px]` (suelo táctil); el
                  subrayado va en el `<span>` interior (`.link-underline`) para
                  anclarse al texto y no al borde de la fila. `w-full` extiende
                  la zona de toque a la columna. */}
              <ul>
                {col.links.map((l) => (
                  <li key={`${col.title}-${l.href}-${l.label}`}>
                    {l.glossary ? (
                      /* El glosario se carga al pulsarlo, no al pintar el pie
                         (lo trae `OverlayHost`; ver `openGlossary`). */
                      <button
                        type="button"
                        onClick={(e) => openGlossary(e.currentTarget)}
                        className="link-underline-host inline-flex items-center min-h-[44px] [@media(pointer:fine)]:min-h-[34px] w-full text-left text-sm text-secondary hover:text-primary transition-colors duration-200"
                      >
                        <span className="link-underline link-underline--al-pasar">{l.label}</span>
                      </button>
                    ) : (
                      <Link
                        href={l.href}
                        className="inline-flex items-center min-h-[44px] [@media(pointer:fine)]:min-h-[34px] w-full text-sm text-secondary hover:text-primary transition-colors duration-200"
                      >
                        <span className="link-underline link-underline--al-pasar">{l.label}</span>
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 h-px bg-[var(--line)]" />


        {/* Barra final: datos a la izquierda (también en móvil), lo que se
            pulsa a la derecha. `data-pie-final` es la marca que mide el botón
            de subir para quedarse encima. */}
        <div data-pie-final className="mt-6 flex flex-col gap-2 text-xs text-secondary lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          {/* La fecha sale del último commit (`publicacion.ts`), no del reloj. */}
          <p className="m-0 flex flex-wrap gap-x-6 gap-y-1">
            <span>
              © <span className="tnum">{year}</span> {t("appName")}. {t("rights")}
            </span>
            {FECHA_PUBLICACION && (
              <span>
                {tx(lang, { es: "Sitio actualizado el ", en: "Site updated ", pt: "Site atualizado em ", fr: "Site mis à jour le ", de: "Website aktualisiert am ", it: "Sito aggiornato il " })}
                <time dateTime={FECHA_PUBLICACION}>
                  {new Date(FECHA_PUBLICACION).toLocaleDateString(LOCALE_FECHA[lang], {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    timeZone: "UTC",
                  })}
                </time>
              </span>
            )}
          </p>
          <div className="flex flex-wrap items-center gap-x-6">
            <a
              href={REPOSITORIO}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline-host inline-flex min-h-[44px] items-center text-xs text-secondary transition-colors hover:text-primary focus-visible:text-primary"
            >
              <span className="link-underline link-underline--al-pasar">{tx(lang, { es: "Código de la web", en: "Website source", pt: "Código do site", fr: "Code source du site", de: "Quellcode der Website", it: "Codice del sito" })}</span>
            </a>
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
 * Vuelve a abrir el aviso de consentimiento. No borra nada al pulsarlo: la
 * retirada la ejecuta el propio aviso al elegir «Solo necesarias».
 */
function ConsentPreferencesButton() {
  const { lang } = useLang();
  return (
    <button
      type="button"
      onClick={reopenConsent}
      className="link-underline-host inline-flex min-h-[44px] items-center text-xs text-secondary transition-colors hover:text-primary focus-visible:text-primary"
    >
      <span className="link-underline link-underline--al-pasar">
        {tx(lang, { es: "Preferencias de privacidad", en: "Privacy preferences", pt: "Preferências de privacidade", fr: "Préférences de confidentialité", de: "Datenschutzeinstellungen", it: "Preferenze di privacy" })}
      </span>
    </button>
  );
}

/** BrandMark — el glifo de la marca, sin placa. */
function BrandMark() {
  return <BrandGlyph size={24} className="shrink-0" />;
}
