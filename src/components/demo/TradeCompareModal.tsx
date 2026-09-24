"use client";

import { useEffect, useRef } from "react";
import { useLang } from "@/lib/i18n";
import { type Trade, nombreSetup } from "@/lib/trading/data";
import { fmtMoney, fmtNum, fmtR, fmtPrice, fmtDuration, fmtDateTime } from "@/lib/trading/format";
import { Chip } from "@/components/tj/Chip";
import { Money } from "@/components/tj/Money";
import { X } from "lucide-react";

interface TradeCompareModalProps {
  tradeA: Trade;
  tradeB: Trade;
  onClose: () => void;
}

export function TradeCompareModal({ tradeA, tradeB, onClose }: TradeCompareModalProps) {
  const { lang } = useLang();
  const es = lang === "es";

  /* `<dialog>` nativo abierto con `showModal()`, como el visor de capturas:
     el navegador pone el foco dentro, lo retiene, deja inerte lo de detrás y
     cierra con Escape. Era un `div` con `aria-modal` que no hacía ninguna de
     las cuatro cosas: Escape no cerraba y el tabulador se iba a la página. */
  const ventana = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ventana.current;
    if (d && !d.open) d.showModal();
    return () => d?.close();
  }, []);

  return (
    <dialog
      ref={ventana}
      aria-labelledby="compare-title"
      className="tj-comparador"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-3xl overflow-hidden rounded-[4px] border border-[rgb(var(--divider)/0.2)] tj-paper-dense shadow-[var(--ficha-sombra)]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[rgb(var(--divider)/0.12)] px-5 py-3.5 bg-[color-mix(in_oklab,var(--surface-2)_60%,transparent)]">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[rgb(var(--accent-base))]">
              {es ? "COMPARATIVA DE EJECUCIONES" : "TRADE EXECUTION COMPARISON"}
            </span>
            <span className="text-xs text-tertiary">
              #{tradeA.id} vs #{tradeB.id}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={es ? "Cerrar comparativa" : "Close comparison"}
            className="h-7 w-7 rounded-[2px] border border-[rgb(var(--divider)/0.15)] text-tertiary hover:text-primary inline-flex items-center justify-center transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Comparison Grid */}
        <div className="p-5 overflow-y-auto max-h-[80vh] space-y-5">
          {/* Top side-by-side header cards */}
          <div className="grid grid-cols-2 gap-4">
            {/* Trade A Header */}
            <div className="p-4 rounded-[3px] border border-[rgb(var(--divider)/0.12)] bg-[rgb(var(--divider)/0.03)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-primary">{tradeA.instrument}</span>
                <Chip variant={tradeA.direction === "long" ? "pos" : "neg"}>
                  {tradeA.direction.toUpperCase()}
                </Chip>
              </div>
              <div className="flex items-baseline gap-2">
                <Money value={tradeA.netPnl} sign colorizeSign className="text-xl font-semibold font-mono" />
                <span className={`text-sm font-mono font-semibold ${tradeA.rMultiple >= 0 ? "text-[rgb(var(--pnl-pos))]" : "text-[rgb(var(--pnl-neg))]"}`}>
                  ({fmtR(tradeA.rMultiple, lang, 2)})
                </span>
              </div>
              <div className="text-[11px] text-tertiary">
                {nombreSetup(tradeA.setup, lang)} · {fmtDateTime(tradeA.closedAt, lang)}
              </div>
            </div>

            {/* Trade B Header */}
            <div className="p-4 rounded-[3px] border border-[rgb(var(--divider)/0.12)] bg-[rgb(var(--divider)/0.03)] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-primary">{tradeB.instrument}</span>
                <Chip variant={tradeB.direction === "long" ? "pos" : "neg"}>
                  {tradeB.direction.toUpperCase()}
                </Chip>
              </div>
              <div className="flex items-baseline gap-2">
                <Money value={tradeB.netPnl} sign colorizeSign className="text-xl font-semibold font-mono" />
                <span className={`text-sm font-mono font-semibold ${tradeB.rMultiple >= 0 ? "text-[rgb(var(--pnl-pos))]" : "text-[rgb(var(--pnl-neg))]"}`}>
                  ({fmtR(tradeB.rMultiple, lang, 2)})
                </span>
              </div>
              <div className="text-[11px] text-tertiary">
                {nombreSetup(tradeB.setup, lang)} · {fmtDateTime(tradeB.closedAt, lang)}
              </div>
            </div>
          </div>

          {/* Metric Comparison Table */}
          <div className="border border-[rgb(var(--divider)/0.12)] rounded-[3px] overflow-hidden text-xs font-mono">
            <div className="grid grid-cols-[1fr_1fr_1fr] bg-[rgb(var(--divider)/0.06)] px-3 py-2 text-[10px] uppercase tracking-wider text-tertiary border-b border-[rgb(var(--divider)/0.1)]">
              <div>{es ? "MÉTRICA DE EJECUCIÓN" : "EXECUTION METRIC"}</div>
              <div className="text-center font-semibold text-primary">#{tradeA.id} ({tradeA.instrument})</div>
              <div className="text-center font-semibold text-primary">#{tradeB.id} ({tradeB.instrument})</div>
            </div>

            {[
              {
                label: es ? "Precio de entrada → salida" : "Entry → exit price",
                valA: `${fmtPrice(tradeA.entry, 2, lang)} → ${fmtPrice(tradeA.exit, 2, lang)}`,
                valB: `${fmtPrice(tradeB.entry, 2, lang)} → ${fmtPrice(tradeB.exit, 2, lang)}`,
              },
              {
                label: es ? "Riesgo en $ (1R)" : "Risk $ (1R)",
                valA: fmtMoney(tradeA.riskUsd, lang),
                valB: fmtMoney(tradeB.riskUsd, lang),
              },
              {
                label: es ? "R:R planificado" : "Planned R:R",
                valA: `1:${fmtNum(tradeA.plannedRr, lang, 2)}`,
                valB: `1:${fmtNum(tradeB.plannedRr, lang, 2)}`,
              },
              {
                label: "MAE (Max Adverse Excursion)",
                valA: fmtR(tradeA.mae, lang, 2),
                valB: fmtR(tradeB.mae, lang, 2),
              },
              {
                label: "MFE (Max Favorable Excursion)",
                valA: fmtR(tradeA.mfe, lang, 2),
                valB: fmtR(tradeB.mfe, lang, 2),
              },
              {
                label: es ? "Duración de posición" : "Trade Duration",
                valA: fmtDuration(tradeA.durationMin, lang),
                valB: fmtDuration(tradeB.durationMin, lang),
              },
              {
                label: es ? "Sesión de mercado" : "Market Session",
                valA: tradeA.session,
                valB: tradeB.session,
              },
              {
                label: es ? "Cumplimiento del plan" : "Plan compliance",
                valA: tradeA.compliance === "yes" ? (es ? "✓ Cumplido (100%)" : "✓ Respected (100%)") : (es ? "✕ Ruptura de plan" : "✕ Rule break"),
                valB: tradeB.compliance === "yes" ? (es ? "✓ Cumplido (100%)" : "✓ Respected (100%)") : (es ? "✕ Ruptura de plan" : "✕ Rule break"),
              },
            ].map((row, idx) => (
              <div
                key={row.label}
                className={`grid grid-cols-[1fr_1fr_1fr] px-3 py-2.5 items-center border-b last:border-b-0 border-[rgb(var(--divider)/0.06)] ${
                  idx % 2 === 0 ? "bg-transparent" : "bg-[rgb(var(--divider)/0.02)]"
                }`}
              >
                <div className="text-secondary font-sans text-xs">{row.label}</div>
                <div className="text-center font-semibold text-primary">{row.valA}</div>
                <div className="text-center font-semibold text-primary">{row.valB}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[rgb(var(--divider)/0.12)] px-5 py-3 bg-[rgb(var(--divider)/0.03)] text-xs text-tertiary">
          <span>{es ? "Análisis de dispersión de ejecución y disciplina" : "Execution variance & discipline analysis"}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-[2px] border border-[rgb(var(--divider)/0.2)] bg-[rgb(var(--divider)/0.06)] text-primary hover:bg-[rgb(var(--divider)/0.12)] font-medium transition-colors"
          >
            {es ? "Cerrar" : "Close"}
          </button>
        </div>
      </div>
    </dialog>
  );
}
