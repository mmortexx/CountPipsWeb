"use client";

import { Link } from "@/components/tj/LocaleLink";
import { useLang } from "@/lib/i18n";

/** Qué clase de página es; sólo ajusta la medida del subtítulo y el aire. */
export type TonoPagina = "capitulo" | "instrumento" | "registro" | "tarifa" | "documento";

interface PageHeaderProps {
  eyebrowEs: string;
  eyebrowEn: string;
  titleEs: string;
  titleEn: string;
  /** Tramo del titular que va en el tono secundario. */
  titleHighlightEs?: string;
  titleHighlightEn?: string;
  subtitleEs: string;
  subtitleEn: string;
  breadcrumbEs: string;
  breadcrumbEn: string;
  tono?: TonoPagina;
}

function Titular({ text, highlight }: { text: string; highlight?: string }) {
  const i = highlight ? text.lastIndexOf(highlight) : -1;
  if (!highlight || i < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="text-gradient">{highlight}</span>
      {text.slice(i + highlight.length)}
    </>
  );
}

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
  tono = "capitulo",
}: PageHeaderProps) {
  const { lang } = useLang();
  const es = lang === "es";

  return (
    <section className="tj-cabecera relative border-b border-[var(--line)]" data-tono={tono}>
      <div className="tj-container">
        <nav
          data-entra="1"
          className="mb-8 flex items-center gap-2 text-[13px] text-tertiary"
          aria-label={es ? "Migas de pan" : "Breadcrumb"}
        >
          <Link
            href="/"
            className="-my-2 inline-flex min-h-[44px] items-center rounded-[3px] py-2 pr-1 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]"
          >
            {es ? "Inicio" : "Home"}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-secondary" aria-current="page">
            {es ? breadcrumbEs : breadcrumbEn}
          </span>
        </nav>

        <p data-entra="2" className="eyebrow">
          {es ? eyebrowEs : eyebrowEn}
        </p>

        <h1 data-entra="2" className="t-h1 mt-5 max-w-[22ch] text-primary">
          <Titular
            text={es ? titleEs : titleEn}
            highlight={es ? titleHighlightEs : titleHighlightEn}
          />
        </h1>

        <p
          data-entra="3"
          className="mt-6 text-lg leading-[1.6] text-secondary md:text-xl"
          style={{ maxWidth: "var(--medida, 62ch)" }}
        >
          {es ? subtitleEs : subtitleEn}
        </p>
      </div>
    </section>
  );
}
