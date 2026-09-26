"use client";

import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/tj/Reveal";
import { SectionHeader } from "@/components/layout/SectionHeader";

interface Broker {
  name: string;
  via: string;
}

/**
 * Las plantillas de importación que trae el programa (`BrokerTemplates.cs`)
 * y la única sincronización que existe (Binance, solo lectura). Son
 * plantillas de mejor esfuerzo: el asistente corrige cualquier columna y
 * guarda la receta. Cualquier otro CSV entra con mapeo manual.
 */
const BROKERS: Broker[] = [
  { name: "Interactive Brokers", via: "CSV · Flex Query" },
  { name: "MetaTrader 4/5", via: "CSV" },
  { name: "TradingView", via: "CSV" },
  { name: "Binance", via: "CSV · API" },
  { name: "Bybit", via: "CSV" },
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
              {/* Sin monograma: «IB», «MT»… en una baldosa hacían de
                  logotipo sin serlo. El nombre y cómo entra, nada más. */}
              <p className="t-h4 m-0 text-primary">{b.name}</p>
              <span className="text-[12px] font-medium text-tertiary">{b.via}</span>
            </div>
          ))}
          </div>
        </div>

        {/* Universal-CSV reminder line. */}
        <Reveal delay={0.15} className="mt-8">
          <p className="medida text-sm text-tertiary leading-[1.6]">
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
