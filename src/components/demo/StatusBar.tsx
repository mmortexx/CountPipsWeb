"use client";

import { useLang } from "@/lib/i18n";
import { METRICS, nivelDisciplina } from "@/lib/trading/data";
import { fmtPct } from "@/lib/trading/format";

/**
 * Barra de estado bajo el panel de la demo, como la de la app
 * (MainWindow.xaml L286-331), con tres zonas: pip de disciplina con
 * «Disciplina: NN %» (el cumplimiento de la muestra), nota de guardado
 * (recurso Status_DataNote de la app) y la versión.
 */
export function StatusBar() {
  const { t, lang } = useLang();

  // Cumplimiento de la muestra, acotado a [0, 1].
  const compliance = Math.max(0, Math.min(1, METRICS.compliancePct));
  const nivel = nivelDisciplina(compliance);
  const isHealthy = nivel === "alta";
  const complianceLabel = fmtPct(compliance, lang, 0);

  return (
    <div className="demo-chrome demo-hairline border-t relative flex items-center justify-between px-3 sm:px-4 h-7 text-[11px] text-tertiary select-none gap-2">
      {/* Estático, como el DisciplineStatus de la app: indicador, no navegación. */}
      <span
        className="flex items-center gap-2 min-w-0"
        title={`${t("discipline")}: ${complianceLabel}`}
        aria-label={`${t("discipline")}: ${complianceLabel}`}
      >
        <DisciplineLED healthy={isHealthy} />
        <span className="truncate">
          {t("discipline")}:{" "}
          <span
            className={`tnum font-medium ${
              { alta: "text-pnl-pos", media: "text-pnl-warn", baja: "text-pnl-neg" }[nivel]
            }`}
          >
            {complianceLabel}
          </span>
        </span>
      </span>

      <div className="hidden sm:flex items-center gap-3 truncate ml-3">
        <span>{t("autoSaved")}</span>
      </div>

      <span className="tnum tabular-nums ml-auto shrink-0 font-mono">v0.1.0</span>
    </div>
  );
}

/** Pip fijo, sin pulso ni halo: verde con disciplina sana, ámbar con aviso. Canto de 1 px, como el resto. */
function DisciplineLED({ healthy }: { healthy: boolean }) {
  const colorVar = healthy ? "--pnl-pos" : "--pnl-warn";
  return (
    <span
      className="w-2 h-2 rounded-[1px] shrink-0"
      style={{ backgroundColor: `rgb(var(${colorVar}))` }}
      aria-hidden="true"
    />
  );
}
