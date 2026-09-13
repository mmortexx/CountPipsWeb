"use client";

import { Link } from "@/components/tj/LocaleLink";
import { ArrowRight } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { asset } from "@/lib/asset";

/**
 * Hero — sección `#top`. Titular, entradilla, dos llamadas y el producto
 * a tamaño real debajo: la captura es la prueba de lo que promete el
 * titular, así que va en la primera pantalla y no tres secciones abajo.
 */
export function Hero() {
  const { lang } = useLang();
  const es = lang === "es";

  const datos = es
    ? ["Windows 10 · 11", "Datos 100 % en tu equipo", "Demo sin registro"]
    : ["Windows 10 · 11", "Data 100 % on your machine", "Demo without sign-up"];

  const alt = es
    ? "Pantalla de analítica de CountPips: resultados por periodo, P&L total, win rate, expectancy, profit factor, drawdown máximo, Sharpe y Sortino calculados sobre 200 operaciones de muestra."
    : "CountPips analytics screen: results by period, total P&L, win rate, expectancy, profit factor, max drawdown, Sharpe and Sortino computed on 200 sample trades.";

  return (
    <section id="top" className="relative overflow-clip">
      <div className="tj-container pt-[clamp(8rem,15vh,10.5rem)]">
        <div className="max-w-[48rem]">
          <p className="eyebrow">
            {es ? "Diario de trading para Windows" : "Trading journal for Windows"}
          </p>

          <h1 className="t-display mt-6 text-primary">
            {es ? "Opera como una mesa institucional." : "Trade like an institutional desk."}
          </h1>

          <p className="mt-7 max-w-[38rem] text-[clamp(1.125rem,1.5vw,1.3125rem)] leading-[1.55] text-secondary">
            {es
              ? "40+ métricas de riesgo y rendimiento, un guardián que te frena antes del error y tus datos siempre en tu máquina."
              : "40+ risk and performance metrics, a guardian that stops you before the mistake, and your data always on your machine."}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link href="/demo" className="cta cta--primario">
              {es ? "Ver la demo interactiva" : "See the interactive demo"}
              <ArrowRight size={16} aria-hidden />
            </Link>
            <Link href="/pricing" className="cta cta--secundario">
              {es ? "Ver precios" : "See pricing"}
            </Link>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[14px] text-tertiary">
            {datos.map((d) => (
              <li key={d} className="flex items-center gap-2">
                <span aria-hidden className="inline-block h-1 w-1 bg-[rgb(var(--txt-tertiary))]" />
                {d}
              </li>
            ))}
          </ul>
        </div>

        <figure className="tj-hero-producto mt-[clamp(3.5rem,7vw,5.5rem)]">
          {[
            { clase: "tj-captura--oscura", sufijo: "-oscuro" },
            { clase: "tj-captura--clara", sufijo: "" },
          ].map(({ clase, sufijo }) => (
            <picture key={clase} className={clase}>
              <source
                media="(max-width: 640px)"
                srcSet={asset(`/img/app-analitica${sufijo}-movil.webp`)}
                width={722}
                height={390}
              />
              <img
                src={asset(`/img/app-analitica${sufijo}.webp`)}
                width={1576}
                height={836}
                alt={alt}
                fetchPriority={sufijo ? "low" : "high"}
                decoding="async"
              />
            </picture>
          ))}
        </figure>
      </div>
    </section>
  );
}
