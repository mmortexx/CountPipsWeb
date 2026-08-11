"use client";

import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/tj/Reveal";
import { SectionHeader } from "@/components/layout/SectionHeader";

interface Broker {
  name: string;
  /** Two-letter monogram for the logo placeholder chip. */
  mark: string;
}

/**
 * Estos NO son integraciones directas: son plataformas cuyo fichero CSV se
 * ha comprobado que entra. El subtítulo de la sección ya lo dice, y es
 * importante que lo siga diciendo — un muro de logotipos se lee como
 * «conecta tu cuenta» aunque el texto de al lado diga otra cosa.
 *
 * Fuera TD Ameritrade: la marca dejó de existir al integrarse en Schwab, y
 * un logotipo de una casa que ya no opera envejece la lista entera. Entra
 * Charles Schwab, que es donde fueron a parar esas cuentas.
 */
const BROKERS: Broker[] = [
  { name: "Interactive Brokers", mark: "IB" },
  { name: "MetaTrader 4", mark: "M4" },
  { name: "MetaTrader 5", mark: "M5" },
  { name: "NinjaTrader", mark: "NT" },
  { name: "TradingView", mark: "TV" },
  { name: "Binance", mark: "BN" },
  { name: "Coinbase", mark: "CB" },
  { name: "OANDA", mark: "OA" },
  { name: "IG", mark: "IG" },
  { name: "Charles Schwab", mark: "CS" },
];

/** Logo wall of broker / import integrations. Bilingual. */
export function Integrations() {
  const { lang } = useLang();
  const es = lang === "es";

  return (
    <section className="section bg-veil relative overflow-clip">
      {/* Section grain — opt-in 3 % fractalNoise overlay. */}
      <div aria-hidden="true" className="grain absolute inset-0 pointer-events-none" />
      <div className="relative tj-container">
        <SectionHeader
          composicion="apilada"
          etiqueta={es ? "Integraciones" : "Integrations"}
          titulo={es ? (
              <>
                Importa de <span className="text-gradient">cualquier broker.</span>
              </>
            ) : (
              <>
                Import from <span className="text-gradient">any broker.</span>
              </>
            )}
          entradilla={es
              ? "CSV universal. Mapea columnas una sola vez y olvídate."
              : "Universal CSV. Map columns once and forget."}
        />

        {/* ── Muro de brókers en retícula ──────────────────────────────
            Eran diez cajas separadas por hueco, cada una levantándose al
            pasar el ratón. Pero esto es una lista de compatibilidad —
            qué entra y qué no—, y una lista de compatibilidad se publica
            como cuadro, no como diez objetos sueltos.

            Se retira el paso intermedio de 3 columnas: 10 no es
            divisible por 3 y dejaba la última fila con una sola celda,
            con el trazo colgando sobre el hueco. 2 y 5 sí dividen a 10,
            así que ambas retículas cierran exactas.

            Filete izquierdo en todas las celdas y −1 px en la rejilla:
            el trazo de la primera columna se sale del contenedor y se
            recorta, sin encadenar reglas `nth-child` por cada punto de
            ruptura. */}
        <div className="mt-10 overflow-hidden border-t border-[rgb(var(--divider)/0.14)]">
          <div className="-ml-px grid grid-cols-2 lg:grid-cols-5">
          {BROKERS.map((b) => (
            <div
              data-entra="ciclo"
              key={b.name}
              className="group relative p-4 min-w-0 flex flex-col gap-3 border-b border-l border-[rgb(var(--divider)/0.14)]"
            >
              {/* Row: monogram mark (left) + CSV chip (right). */}
              <div className="relative flex items-center justify-between">
                <span
                  className="w-10 h-10 rounded-md bg-[rgb(var(--divider)/0.05)] border border-[rgb(var(--divider)/0.10)] shadow-[inset_0_1px_0_rgb(var(--divider)/0.08)] flex items-center justify-center text-primary text-[12px] font-bold tracking-tight"
                  style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
                  aria-hidden="true"
                >
                  {b.mark}
                </span>
                <span className="inline-flex items-center rounded-[2px] px-[0.55rem] py-[0.15rem] bg-[rgb(var(--accent-base)/0.08)] text-[rgb(var(--accent-base))] border border-[rgb(var(--accent-base)/0.20)] text-[10px] font-semibold uppercase tracking-[0.14em]">
                  CSV
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
                ¿Tu broker no está en la lista?{" "}
                <span className="text-secondary font-medium">
                  Si exporta a CSV, este diario lo importa.
                </span>{" "}
                Mapea las columnas una sola vez y el perfil queda guardado para siempre.
              </>
            ) : (
              <>
                Your broker not on the list?{" "}
                <span className="text-secondary font-medium">
                  If it exports to CSV, this journal imports it.
                </span>{" "}
                Map the columns once and the profile is saved forever.
              </>
            )}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
