"use client";

import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/tj/Reveal";
import { SectionHeader } from "@/components/layout/SectionHeader";

/* Las celdas de texto llevan su idioma; los símbolos los traduce `Celda`. */
type Texto = { es: string; en: string };
type Cell = "yes" | "yes-pro" | "no" | "partial" | Texto;
type Row = { labelEs: string; labelEn: string; cells: [Cell, Cell, Cell] };

const ROWS: Row[] = [
  {
    labelEs: "Dónde viven tus datos",
    labelEn: "Where your data lives",
    cells: [
      { es: "Tu equipo", en: "Your machine" },
      { es: "Servidor del proveedor", en: "The vendor's server" },
      { es: "Tu equipo", en: "Your machine" },
    ],
  },
  {
    labelEs: "Modelo de pago",
    labelEn: "Payment model",
    cells: [
      { es: "Pago único previsto", en: "Planned one-time payment" },
      { es: "Suscripción mensual o anual", en: "Monthly or annual subscription" },
      { es: "Sin coste añadido", en: "No extra cost" },
    ],
  },
  {
    labelEs: "Métricas calculadas solas",
    labelEn: "Metrics computed for you",
    cells: [{ es: "Más de 40", en: "40+" }, "yes", { es: "A mano, con fórmulas", en: "By hand, with formulas" }],
  },
  { labelEs: "Funciona sin internet", labelEn: "Works offline", cells: ["yes", "no", "yes"] },
  {
    labelEs: "Tu historial si dejas de pagar",
    labelEn: "Your history if you stop paying",
    cells: [
      { es: "Siempre legible y exportable", en: "Always readable and exportable" },
      { es: "Depende del proveedor", en: "Up to the vendor" },
      { es: "Tuyo", en: "Yours" },
    ],
  },
  { labelEs: "Español nativo", labelEn: "Native Spanish and English", cells: ["yes", "no", "yes"] },
  { labelEs: "Sin crear una cuenta", labelEn: "No account to create", cells: ["yes", "no", "yes"] },
  { labelEs: "Modo prop firm", labelEn: "Prop firm mode", cells: ["yes-pro", "partial", "no"] },
];

/** Comparativa: CountPips frente a diarios en la nube y hoja de cálculo. */
export function Comparison() {
  const { lang } = useLang();
  const es = lang === "es";

  const cols = [
    { key: "tj", label: "CountPips", sub: es ? "Esta app" : "This app" },
    { key: "cloud", label: es ? "Diarios en la nube" : "Cloud journals", sub: es ? "Suscripción" : "Subscription" },
    { key: "excel", label: "Excel / Sheets", sub: es ? "Hoja de cálculo" : "Spreadsheet" },
  ];

  const fondo = { backgroundColor: "var(--bg)" };
  const banda = { backgroundColor: "var(--surface)" };

  return (
    <section className="section cv-auto relative overflow-clip">
      <div className="relative z-10 tj-container">
        <SectionHeader
          composicion="partida"
          etiqueta={es ? "Comparativa" : "Comparison"}
          titulo={
            es ? (
              <>
                No es lo mismo <span className="text-gradient">medir que apuntar.</span>
              </>
            ) : (
              <>
                Measuring is not <span className="text-gradient">writing it down.</span>
              </>
            )
          }
          entradilla={
            es
              ? "Una hoja de cálculo guarda lo que apuntas; un diario en la nube lo calcula en su servidor. CountPips lo calcula en tu equipo."
              : "A spreadsheet stores what you write down; a cloud journal computes it on its server. CountPips computes it on your machine."
          }
        />

        <Reveal delay={0.08} className="mt-10">
          <div className="tj-fila-sigue tj-fila-sigue--sin-reserva tj-fila-sigue--hasta-lg relative overflow-x-auto lg:overflow-x-clip">
            <div className="relative w-full min-w-[680px]">
              <table className="w-full table-fixed text-sm tnum">
                <colgroup>
                  <col className="w-[31%]" />
                  <col className="w-[27%]" />
                  <col className="w-[21%]" />
                  <col className="w-[21%]" />
                </colgroup>
                <thead>
                  <tr className="border-b border-[var(--line-2)]">
                    <th scope="col" className="sticky left-0 z-20 p-5 pl-0 text-left align-bottom text-[13px] font-medium text-tertiary md:p-6 md:pl-0" style={fondo}>
                      <span className="sr-only">{es ? "Característica" : "Feature"}</span>
                    </th>
                    {cols.map((c, j) => (
                      <th
                        key={c.key}
                        scope="col"
                        className="p-5 text-left align-bottom md:p-6"
                        style={j === 0 ? banda : fondo}
                      >
                        <div className="text-[15px] font-semibold tracking-tight text-primary">{c.label}</div>
                        <div className="mt-0.5 text-[13px] font-normal text-tertiary">{c.sub}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row) => (
                    <tr data-entra="ciclo" key={row.labelEs} className="border-b border-[var(--line)]">
                      <th scope="row" className="sticky left-0 z-10 h-16 p-5 pl-0 text-left align-middle text-[14px] font-normal text-secondary md:p-6 md:pl-0" style={fondo}>
                        {es ? row.labelEs : row.labelEn}
                      </th>
                      {row.cells.map((cell, j) => (
                        <td
                          key={j}
                          className="h-16 p-5 align-middle md:p-6"
                          style={j === 0 ? banda : undefined}
                        >
                          <Celda cell={cell} destacada={j === 0} es={es} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 md:hidden"
              style={{ background: "linear-gradient(to left, color-mix(in srgb, var(--bg) 92%, transparent), transparent)" }}
            />
          </div>

          <div className="mt-3 flex items-center justify-center gap-2 text-[12px] text-tertiary md:hidden">
            <span aria-hidden="true">←</span>
            <span>{es ? "Desliza para comparar" : "Swipe to compare"}</span>
            <span aria-hidden="true">→</span>
          </div>
        </Reveal>

        <Reveal delay={0.12} className="mt-6">
          <p className="medida mx-auto text-center text-xs text-tertiary">
            {es
              ? "Diarios en la nube: TradeZella, TraderSync, TradesViz y Tradervue, según sus webs en septiembre de 2026; TradesViz y Tradervue tienen además un plan gratuito limitado. Hoja de cálculo sin plantillas avanzadas."
              : "Cloud journals: TradeZella, TraderSync, TradesViz and Tradervue, as published on their websites in September 2026; TradesViz and Tradervue also offer a limited free plan. Spreadsheet without advanced templates."}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function Celda({ cell, destacada, es }: { cell: Cell; destacada: boolean; es: boolean }) {
  if (cell === "yes" || cell === "yes-pro") {
    return (
      <span className="inline-flex items-center gap-2">
        <svg data-entra="sello" width="14" height="14" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2 6.5l2.5 2.5L10 3.5" stroke="rgb(var(--sig-green))" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className={`text-[14px] ${destacada ? "font-medium text-primary" : "text-secondary"}`}>{es ? "Sí" : "Yes"}</span>
        {cell === "yes-pro" && <span className="text-[12px] text-tertiary">· Pro</span>}
      </span>
    );
  }
  if (cell === "no") {
    return (
      <span className="inline-flex items-center gap-2">
        <svg data-entra="sello" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M3 3l6 6M9 3l-6 6" stroke="rgb(var(--pnl-neg))" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <span className="text-[14px] text-tertiary">No</span>
      </span>
    );
  }
  if (cell === "partial") {
    return (
      <span className="inline-flex items-center gap-2">
        <svg data-entra="sello" width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2.5 6h7" stroke="rgb(var(--pnl-warn))" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <span className="text-[14px] text-tertiary">{es ? "Parcial" : "Partial"}</span>
      </span>
    );
  }
  return <span className={`text-[14px] ${destacada ? "font-medium text-primary" : "text-secondary"}`}>{es ? cell.es : cell.en}</span>;
}
