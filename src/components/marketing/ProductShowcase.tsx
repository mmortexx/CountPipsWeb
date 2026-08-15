"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { Link } from "@/components/tj/LocaleLink";
import { asset } from "@/lib/asset";
import { ArrowRight, BarChart3, Calendar, ListFilter, Layout, Monitor } from "lucide-react";

interface StudioSetup {
  id: "analitica" | "resumen" | "operaciones" | "playbook";
  num: string;
  labelEs: string;
  labelEn: string;
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
  img: string;
  icon: typeof Monitor;
  badgesEs: string[];
  badgesEn: string[];
}

const STUDIO_SETUPS: StudioSetup[] = [
  {
    id: "analitica",
    num: "01",
    labelEs: "Estación de Analítica",
    labelEn: "Analytics Station",
    titleEs: "Estación Cuantitativa Panorámica",
    titleEn: "Panoramic Quantitative Station",
    descEs: "Monitor curvo ultrawide con auditoría estadística integral: Sharpe (4.08), Sortino (1.59), Calmar (30.53) y verificación matemática de ventaja al 99% de confianza.",
    descEn: "Ultrawide curved display with comprehensive statistical audit: Sharpe (4.08), Sortino (1.59), Calmar (30.53) and 99% confidence edge verification.",
    img: "/img/studio/studio-analitica.webp",
    icon: BarChart3,
    badgesEs: ["Sharpe: 4,08", "Sortino: 1,59", "Calmar: 30,53", "Ventaja Confirmada: 99%"],
    badgesEn: ["Sharpe: 4.08", "Sortino: 1.59", "Calmar: 30.53", "Confirmed Edge: 99%"],
  },
  {
    id: "resumen",
    num: "02",
    labelEs: "Mesa de Resumen",
    labelEn: "Overview Command",
    titleEs: "Panel de Mando y Calendario Diario",
    titleEn: "Command Deck & Daily Calendar",
    descEs: "Entorno de trading con curva de rendimiento acumulada y mapa de calor de PnL diario. Detección en vivo de rachas y control preventivo de sobreoperativa.",
    descEn: "Trading workspace with cumulative equity curve and daily PnL heatmap calendar. Real-time streak detection and overtrading guard.",
    img: "/img/studio/studio-resumen.webp",
    icon: Calendar,
    badgesEs: ["Curva Acumulada", "Heatmap PnL Diario", "Guardián de Sobregestión"],
    badgesEn: ["Cumulative Curve", "Daily PnL Heatmap", "Overtrading Guard"],
  },
  {
    id: "operaciones",
    num: "03",
    labelEs: "Mesa de Ejecución",
    labelEn: "Execution Deck",
    titleEs: "Registro y Auditoría de Operaciones",
    titleEn: "Trade Log & Precision Audit",
    descEs: "Espacio de ejecución de alta concentración con filtrado institucional de operaciones, setups individuales, duración exacta y ratios de cumplimiento de plan.",
    descEn: "High-concentration execution setup with institutional trade filtering, setup tagging, exact trade duration, and discipline score.",
    img: "/img/studio/studio-operaciones.webp",
    icon: ListFilter,
    badgesEs: ["200 Trades Auditados", "Filtrado por Setup", "Win Rate: 50%", "Expectancy: +0,36 R"],
    badgesEn: ["200 Audited Trades", "Filter by Setup", "Win Rate: 50%", "Expectancy: +0.36 R"],
  },
  {
    id: "playbook",
    num: "04",
    labelEs: "Terminal de Playbooks",
    labelEn: "Strategy Playbooks",
    titleEs: "Aislamiento Estadístico de Estrategias",
    titleEn: "Statistical Strategy Isolation",
    descEs: "Matriz multiescritorio diseñada para aislar la esperanza matemática de cada setup (Rango, Reversión, Ruptura, Tendencia, Pullback) y descartar lo que no funciona.",
    descEn: "Multi-setup matrix built to isolate the mathematical expectancy of each setup (Range, Reversal, Breakout, Trend, Pullback) and eliminate unprofitable patterns.",
    img: "/img/studio/studio-playbook.webp",
    icon: Layout,
    badgesEs: ["6 Modelos de Entrada", "Expectancy por Setup", "Curvas Desacopladas"],
    badgesEn: ["6 Entry Models", "Expectancy per Setup", "Decoupled Curves"],
  },
];

export function ProductShowcase() {
  const { lang } = useLang();
  const es = lang === "es";

  const [activeStudioIndex, setActiveStudioIndex] = useState(0);
  const currentStudio = STUDIO_SETUPS[activeStudioIndex];

  return (
    <section
      id="producto"
      className="section border-b border-[rgb(var(--divider)/0.1)] relative overflow-hidden"
      aria-labelledby="producto-titulo"
    >
      <div className="mx-auto w-[var(--page-w)]">
        
        {/* Cabecera de Sección */}
        <div className="max-w-[56ch] mb-8">
          <p className="t-label mb-3 text-tertiary">
            {es ? "§ 02 — El entorno de operativa" : "§ 02 — The trading workspace"}
          </p>
          <h2 id="producto-titulo" className="t-h2 mb-3">
            {es ? "Esto es lo que abres cada mañana." : "This is what you open every morning."}
          </h2>
          <p className="t-body text-secondary mb-0">
            {es
              ? "Una estación de trabajo construida para la calma operativa, el rigor estadístico y la consistencia en cuentas propias y de fondeo."
              : "A workstation engineered for trading discipline, statistical rigor, and consistency across personal and funded accounts."}
          </p>
        </div>

        {/* ══════════ FOTOGRAFÍAS DE ESTUDIO / WORKSPACE REAL ══════════ */}
        <div className="space-y-4">
          {/* Barra de Pestañas de Estudio */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {STUDIO_SETUPS.map((setup, idx) => {
              const active = activeStudioIndex === idx;
              const Icon = setup.icon;
              return (
                <button
                  key={setup.id}
                  type="button"
                  onClick={() => setActiveStudioIndex(idx)}
                  className={`h-9 px-3.5 rounded-[2px] text-xs font-mono transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                    active
                      ? "bg-[rgb(var(--accent-base))] text-[rgb(var(--accent-ink))] font-bold shadow-sm"
                      : "border border-[rgb(var(--divider)/0.15)] bg-[rgb(var(--surface-2)/0.5)] text-secondary hover:text-primary hover:border-[rgb(var(--divider)/0.3)]"
                  }`}
                >
                  <Icon size={13} className={active ? "opacity-100" : "opacity-70"} />
                  <span className="opacity-60">{setup.num}.</span>
                  <span>{es ? setup.labelEs : setup.labelEn}</span>
                </button>
              );
            })}
          </div>

          {/* Vitrina Fotográfica en Alta Definición */}
          <div
            className="relative rounded-[4px] border overflow-hidden shadow-xl"
            style={{
              borderColor: "rgb(var(--divider) / 0.18)",
              background: "var(--surface-1)",
              boxShadow: "0 20px 45px -15px rgba(0,0,0,0.22)",
            }}
          >
            {/* Imagen de Estudio con Carga Optimizada */}
            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-black/40">
              <img
                src={asset(currentStudio.img)}
                alt={es ? currentStudio.titleEs : currentStudio.titleEn}
                className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-[1.01]"
                loading="eager"
              />

              {/* Overlay sutil de iluminación en desktop */}
              <div className="hidden md:block absolute inset-0 pointer-events-none bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

              {/* Ficha Descriptiva HUD en desktop */}
              <div className="hidden md:block absolute bottom-0 inset-x-0 p-6 sm:p-7 text-white">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-[2px] bg-[rgb(var(--accent-base))] text-[rgb(var(--accent-ink))] text-[10.5px] font-mono font-bold">
                      {currentStudio.num} · {es ? "SETUP EN PRODUCCIÓN" : "LIVE SETUP"}
                    </span>
                    {(es ? currentStudio.badgesEs : currentStudio.badgesEn).map((b, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded-[2px] bg-black/60 backdrop-blur-md border border-white/15 text-[10.5px] font-mono text-white/90"
                      >
                        {b}
                      </span>
                    ))}
                  </div>

                  <h3 className="font-serif text-xl sm:text-2xl font-normal text-white m-0 tracking-tight">
                    {es ? currentStudio.titleEs : currentStudio.titleEn}
                  </h3>

                  <p className="mt-1.5 mb-0 text-xs sm:text-sm text-white/80 leading-relaxed font-sans max-w-2xl">
                    {es ? currentStudio.descEs : currentStudio.descEn}
                  </p>
                </div>
              </div>
            </div>

            {/* Ficha Descriptiva en Móvil */}
            <div className="block md:hidden p-4 border-t border-[rgb(var(--divider)/0.12)] bg-[var(--surface-2)]">
              <div className="flex flex-wrap items-center gap-1.5 mb-2">
                <span className="px-2 py-0.5 rounded-[2px] bg-[rgb(var(--accent-base))] text-[rgb(var(--accent-ink))] text-[10px] font-mono font-bold">
                  {currentStudio.num} · {es ? "SETUP EN PRODUCCIÓN" : "LIVE SETUP"}
                </span>
                {(es ? currentStudio.badgesEs : currentStudio.badgesEn).slice(0, 2).map((b, i) => (
                  <span
                    key={i}
                    className="px-1.5 py-0.5 rounded-[2px] bg-[rgb(var(--divider)/0.08)] border border-[rgb(var(--divider)/0.12)] text-[10px] font-mono text-[var(--ink-2)]"
                  >
                    {b}
                  </span>
                ))}
              </div>

              <h3 className="font-serif text-lg font-normal text-primary m-0 tracking-tight">
                {es ? currentStudio.titleEs : currentStudio.titleEn}
              </h3>

              <p className="mt-1 mb-0 text-xs text-secondary leading-relaxed font-sans">
                {es ? currentStudio.descEs : currentStudio.descEn}
              </p>
            </div>
          </div>
        </div>

        {/* Enlace a la Demo */}
        <div className="mt-8 pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-[rgb(var(--divider)/0.08)]">
          <span className="text-xs font-mono text-[var(--ink-3)]">
            {es
              ? "Arquitectura nativa de Windows · Cero latencia en local · SQLite integrado"
              : "Native Windows architecture · Zero local latency · Embedded SQLite"}
          </span>

          <Link
            href="/demo"
            className="text-xs font-mono font-semibold text-[rgb(var(--accent-base))] hover:underline flex items-center gap-1.5"
          >
            <span>{es ? "Recorrer la demo interactiva sin registro" : "Launch interactive demo without sign-up"}</span>
            <ArrowRight size={13} />
          </Link>
        </div>

      </div>
    </section>
  );
}
