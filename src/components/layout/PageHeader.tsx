"use client";

import { Link } from "@/components/tj/LocaleLink";
import { useLang, tx } from "@/lib/i18n";
import { Palabras } from "@/components/tj/Palabras";

/** Qué clase de página es; solo ajusta la medida del subtítulo y el aire. */
export type TonoPagina = "capitulo" | "instrumento" | "registro" | "tarifa" | "documento";

interface PageHeaderProps {
  /** Solo si dice algo que las migas no dicen (la familia de un término, «Gratis»). */
  eyebrowEs?: string;
  eyebrowEn?: string;
  titleEs: string;
  titleEn: string;
  titlePt?: string;
  titleFr?: string;
  titleDe?: string;
  titleIt?: string;
  /** Sin subtítulo cuando lo que sigue ya es la entradilla (la ficha de un término). */
  subtitleEs?: string;
  subtitleEn?: string;
  subtitlePt?: string;
  subtitleFr?: string;
  subtitleDe?: string;
  subtitleIt?: string;
  breadcrumbEs: string;
  breadcrumbEn: string;
  breadcrumbPt?: string;
  breadcrumbFr?: string;
  breadcrumbDe?: string;
  breadcrumbIt?: string;
  /** Nivel intermedio de las migas, enlazado: «Inicio / Glosario / Drawdown». */
  padre?: { href: string; es: string; en: string };
  tono?: TonoPagina;
}

export function PageHeader({
  eyebrowEs,
  eyebrowEn,
  titleEs,
  titleEn,
  titlePt,
  titleFr,
  titleDe,
  titleIt,
  subtitleEs,
  subtitleEn,
  subtitlePt,
  subtitleFr,
  subtitleDe,
  subtitleIt,
  breadcrumbEs,
  breadcrumbEn,
  breadcrumbPt,
  breadcrumbFr,
  breadcrumbDe,
  breadcrumbIt,
  padre,
  tono = "capitulo",
}: PageHeaderProps) {
  const { lang } = useLang();

  const tituloTexto = tx(lang, {
    es: titleEs,
    en: titleEn,
    pt: titlePt,
    fr: titleFr,
    de: titleDe,
    it: titleIt,
  });

  const migaTexto = tx(lang, {
    es: breadcrumbEs,
    en: breadcrumbEn,
    pt: breadcrumbPt,
    fr: breadcrumbFr,
    de: breadcrumbDe,
    it: breadcrumbIt,
  });

  const subtituloTexto = subtitleEs
    ? tx(lang, {
        es: subtitleEs,
        en: subtitleEn ?? subtitleEs,
        pt: subtitlePt,
        fr: subtitleFr,
        de: subtitleDe,
        it: subtitleIt,
      })
    : null;

  return (
    <section className="tj-cabecera relative" data-tono={tono}>
      <div className="tj-container">
        <nav
          data-entra="1"
          className="mb-8 flex items-center gap-2 text-[13px] text-tertiary"
          aria-label={tx(lang, {
            es: "Migas de pan",
            en: "Breadcrumb",
            pt: "Trilha de navegação",
            fr: "Fil d’Ariane",
            de: "Brotkrümelnavigation",
            it: "Percorso di navigazione",
          })}
        >
          <Link
            href="/"
            className="-my-2 inline-flex min-h-[44px] items-center rounded-[4px] py-2 pr-1 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]"
          >
            {tx(lang, {
              es: "Inicio",
              en: "Home",
              pt: "Início",
              fr: "Accueil",
              de: "Startseite",
              it: "Home",
            })}
          </Link>
          <span aria-hidden="true">/</span>
          {padre ? (
            <>
              <Link
                href={padre.href}
                className="-my-2 inline-flex min-h-[44px] shrink-0 items-center rounded-[4px] px-1 py-2 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]"
              >
                {tx(lang, { es: padre.es, en: padre.en })}
              </Link>
              <span aria-hidden="true">/</span>
            </>
          ) : null}
          {/* Una sola línea: a 320 px un nombre largo partía la miga en tres, y el
              título de debajo ya lo dice entero. */}
          <span className="min-w-0 truncate text-secondary" aria-current="page">
            {migaTexto}
          </span>
        </nav>

        {eyebrowEs ? (
          <p data-entra="2" className="eyebrow">
            {tx(lang, { es: eyebrowEs, en: eyebrowEn ?? eyebrowEs })}
          </p>
        ) : null}

        <h1 data-entra="2" className={`t-h1 max-w-[22ch] text-primary ${eyebrowEs ? "mt-5" : ""}`}>
          <Palabras lang={lang} texto={tituloTexto} />
        </h1>

        {subtituloTexto ? (
          <p
            data-entra="3"
            className="mt-6 t-lede text-secondary"
            style={{ maxWidth: "var(--medida, 62ch)" }}
          >
            {subtituloTexto}
          </p>
        ) : null}
      </div>
    </section>
  );
}
