"use client";

import { Escritorio } from "@/components/tj/Escritorio";
import { Link } from "@/components/tj/LocaleLink";
import { ArrowRight, Check } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { asset } from "@/lib/asset";

/**
 * Hero — sección `#top`. Titular centrado, dos llamadas y el producto a
 * tamaño real a caballo entre el blanco y la banda gris; debajo, las
 * plataformas cuyo CSV entra (compatibilidad comprobada, no integración).
 */
export function Hero() {
  const { lang } = useLang();
  const es = lang === "es";

  const datos = es
    ? ["Windows 10 y 11", "Tus datos en tu equipo", "Demo sin registro"]
    : ["Windows 10 and 11", "Your data on your machine", "Demo without sign-up"];

  const alt = es
    ? "Pantalla de analítica de CountPips: resultados por periodo, P&L total, win rate, expectancy, profit factor, drawdown máximo, Sharpe y Sortino calculados sobre 200 operaciones de muestra."
    : "CountPips analytics screen: results by period, total P&L, win rate, expectancy, profit factor, max drawdown, Sharpe and Sortino computed on 200 sample trades.";

  const compatibles = ["Interactive Brokers", "MetaTrader 4/5", "TradingView", "Binance", "Bybit"];

  return (
    <section id="top" className="tj-hero relative">
      <div className="tj-container pt-[clamp(6.5rem,13vh,8.75rem)] text-center">
        <p className="eyebrow">
          {es ? "Diario de trading para Windows" : "Trading journal for Windows"}
        </p>

        <h1 className="t-display mx-auto mt-6 max-w-[15ch] text-balance text-primary">
          {es ? "Opera como una mesa institucional." : "Trade like an institutional desk."}
        </h1>

        <p className="mx-auto mt-7 max-w-[40rem] text-[clamp(1.125rem,1.5vw,1.3125rem)] leading-[1.55] text-secondary">
          {es
            ? "40+ métricas de riesgo y rendimiento, un guardián que te avisa antes de romper tus reglas y tus datos en tu equipo."
            : "40+ risk and performance metrics, a guardian that warns you before you break your rules, and your data on your machine."}
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link href="/demo" className="cta cta--primario">
            {es ? "Ver la demo interactiva" : "See the interactive demo"}
            <ArrowRight size={16} aria-hidden />
          </Link>
          <Link href="/pricing" className="cta cta--secundario">
            {es ? "Ver precios" : "See pricing"}
          </Link>
        </div>

        <ul className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[14px] text-tertiary">
          {datos.map((d) => (
            <li key={d} className="flex items-center gap-2">
              <Check size={14} strokeWidth={2} aria-hidden className="text-primary" />
              {d}
            </li>
          ))}
        </ul>
      </div>

      <div className="tj-container relative mt-[clamp(3rem,5vw,4rem)]">
        <Escritorio className="tj-escritorio--ancho tj-escritorio--hero" />
        <figure className="tj-hero-producto tj-cristal">
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

        <div className="flex flex-col items-center gap-4 py-[clamp(2.5rem,5vw,3.5rem)] text-center md:flex-row md:justify-between md:text-left">
          <p className="m-0 text-[13px] text-tertiary">
            {es ? "Plantillas de importación CSV para" : "CSV import templates for"}
          </p>
          <ul className="m-0 grid grid-cols-2 gap-x-8 gap-y-2 p-0 text-[15px] font-semibold tracking-[-0.01em] text-secondary sm:flex sm:flex-wrap sm:items-center sm:justify-center">
            {compatibles.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
