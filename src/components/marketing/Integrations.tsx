"use client";

import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/tj/Reveal";
import { SectionHeader } from "@/components/layout/SectionHeader";

interface Broker {
  name: string;
  /** Two-letter monogram for the logo placeholder chip. */
  mark: string;
  via: string;
}

/**
 * Las plantillas de importación que trae el programa (`BrokerTemplates.cs`)
 * y la única sincronización que existe (Binance, solo lectura). Son
 * plantillas de mejor esfuerzo: el asistente corrige cualquier columna y
 * guarda la receta. Cualquier otro CSV entra con mapeo manual.
 */
const BROKERS: Broker[] = [
  { name: "Interactive Brokers", mark: "IB", via: "CSV · Flex Query" },
  { name: "MetaTrader 4/5", mark: "MT", via: "CSV" },
  { name: "TradingView", mark: "TV", via: "CSV" },
  { name: "Binance", mark: "BN", via: "CSV · API" },
  { name: "Bybit", mark: "BY", via: "CSV" },
];

/** Logo wall of broker / import integrations. Bilingual. */
export function Integrations() {
  const { lang } = useLang();
  const es = lang === "es";

  return (
    <section className="section relative overflow-clip">
      <div className="relative tj-container">
        <SectionHeader
          composicion="apilada"
          etiqueta={es ? "Integraciones" : "Integrations"}
          titulo={es ? (
              <>
                Importa desde <span className="text-gradient">tu plataforma.</span>
              </>
            ) : (
              <>
                Import from <span className="text-gradient">your platform.</span>
              </>
            )}
          entradilla={es
              ? "Plantillas para las plataformas más habituales y cualquier otro CSV con mapeo de columnas. La receta se guarda y la próxima vez no hay que mapear nada."
              : "Templates for the most common platforms and any other CSV with column mapping. The recipe is saved, so next time there is nothing to map."}
        />

        <div className="mt-10 overflow-clip border-t border-[rgb(var(--divider)/0.14)]">
          <div className="-ml-px grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          {BROKERS.map((b) => (
            <div
              data-entra="ciclo"
              key={b.name}
              className="group relative p-4 min-w-0 flex flex-col gap-3 border-b border-l border-[rgb(var(--divider)/0.14)]"
            >
              {/* Row: monogram mark (left) + CSV chip (right). */}
              <div className="relative flex items-center justify-between">
                <span
                  className="w-10 h-10 rounded-[4px] bg-[rgb(var(--divider)/0.05)] border border-[rgb(var(--divider)/0.10)] shadow-[inset_0_1px_0_rgb(var(--divider)/0.08)] flex items-center justify-center text-primary text-[13px] font-bold tracking-tight"
                  style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
                  aria-hidden="true"
                >
                  {b.mark}
                </span>
                <span className="inline-flex items-center rounded-[4px] px-[0.55rem] py-[0.15rem] bg-[var(--chip)] text-[rgb(var(--accent-base))] border border-[var(--chip-line)] text-[11px] font-semibold tracking-[0.02em]">
                  {b.via}
                </span>
              </div>

              {/* Broker name. */}
              <div className="relative">
                {/* R25-1e — broker name brightens on hover, coordinating
                    with the card's accent border glow so the name reads
                    as the card's "active" element on hover. */}
                <p className="t-h4 text-secondary transition-colors duration-300 group-hover:text-primary">{b.name}</p>
              </div>
            </div>
          ))}
          </div>
        </div>

        {/* Universal-CSV reminder line. */}
        <Reveal delay={0.15} className="mt-8">
          <p className="text-sm text-tertiary leading-[1.6]">
            {es ? (
              <>
                ¿Tu plataforma no está en la lista?{" "}
                <span className="text-secondary font-medium">
                  Si exporta a CSV, el asistente la importa.
                </span>{" "}
                Mapeas las columnas una vez y la receta queda guardada. Binance puede además sincronizarse en solo lectura con tus propias claves.
              </>
            ) : (
              <>
                Your platform not on the list?{" "}
                <span className="text-secondary font-medium">
                  If it exports to CSV, the wizard imports it.
                </span>{" "}
                Map the columns once and the recipe is saved. Binance can also sync in read-only mode with your own keys.
              </>
            )}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
