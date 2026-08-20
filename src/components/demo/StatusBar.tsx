"use client";

import { useLang } from "@/lib/i18n";
import { METRICS } from "@/lib/trading/data";
import { fmtPct } from "@/lib/trading/format";

/* ------------------------------------------------------------------ */
/* StatusBar (institutional WinUI 3 / Bloomberg-style status bar —    */
/* restructured R25-1a to match the real app's MainWindow.xaml L286-331) */
/* ------------------------------------------------------------------ */

/**
 * StatusBar — institutional WinUI 3 / Bloomberg-Terminal-style status
 * bar that sits below the demo's tabpanel. Restructured in R25-1a to
 * match the real app's status bar (MainWindow.xaml L286-331), which
 * has three regions:
 *
 *   ┌──────────────────────────────────────────────────────────────────────┐
 *   │ ● Disciplina: 84 %        Guardado automático en tu equipo    v2.4.1 │
 *   └──────────────────────────────────────────────────────────────────────┘
 *
 *   LEFT    — discipline pip + "Disciplina: NN %" text. The
 *             % is the deterministic demo's compliancePct — the share
 *             of trades that respected the plan. Reads as the
 *             institutional "are you trading well?" heartbeat the real
 *             app shows (the real app's text + color are managed by
 *             RefreshRiskStatus() in code-behind; the demo uses a
 *             stable deterministic value).
 *   CENTER  — "Guardado automático en tu equipo" / "Auto-saved on your
 *             machine" (the real app's Status_DataNote resource,
 *             Strings/{es-ES,en-GB}/Resources.resw L31). Replaces the
 *             pre-R25-1a live mini-metrics ticker (cycling Net P&L /
 *             Win Rate / Expectancy / Trades every 4 s) — the real app
 *             doesn't have a metrics ticker in the status bar.
 *   RIGHT   — version text "v2.4.1" with tabular numerals (mirrors the
 *             real app's VersionText, managed by code-behind from the
 *             assembly). Replaces the pre-R25-1a clock + data text +
 *             keyboard / fullscreen / share / reset icon buttons — the
 *             real app doesn't have those in the status bar (fullscreen
 *             is via the title bar's Maximize button, keyboard
 *             shortcuts are still accessible via the `?` key, no
 *             share/reset affordance in the native chrome).
 *
 * Layout: `.liquid-glass border-t border-[rgb(var(--divider)/0.1)] h-7 flex items-center
 * justify-between px-3 text-[11px] text-tertiary tnum` — the
 * institutional status-bar pattern. The bottom corners are rounded
 * automatically by the parent window's `overflow-hidden` +
 * `rounded-[2px]`.
 *
 * The pre-R25-1a `onOpenShortcuts` + `onReset` props are removed — the
 * buttons that used them are gone (the keyboard-shortcuts overlay is
 * still accessible via the `?` key, handled by AppDemo's capture-phase
 * keydown listener; reset is handled by clicking the Dashboard tab).
 */
export function StatusBar() {
  const { t, lang } = useLang();

  // Compliance % from the deterministic demo metrics — the share of
  // trades that respected the plan. Used as the "discipline" status
  // value, mirroring the real app's RefreshRiskStatus() output (which
  // derives text + color from a similar compliance calculation against
  // real trades). Capped at [0, 1] for safety.
  const compliance = Math.max(0, Math.min(1, METRICS.compliancePct));
  const isHealthy = compliance >= 0.7;
  const complianceLabel = fmtPct(compliance, lang, 0);

  return (
    <div className="demo-chrome demo-hairline border-t relative flex items-center justify-between px-3 sm:px-4 h-7 text-[11px] text-tertiary select-none gap-2">
      {/* LEFT — pip de disciplina + texto. Estático, como el
          DisciplineStatus de la app: indicador, no navegación. */}
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
              isHealthy ? "text-pnl-pos" : "text-pnl-warn"
            }`}
          >
            {complianceLabel}
          </span>
        </span>
      </span>

      {/* CENTRO — nota de guardado y telemetría de motor */}
      <div className="hidden sm:flex items-center gap-3 truncate ml-3">
        <span>{t("autoSaved")}</span>
        <span className="text-[10px] opacity-60 font-mono hidden md:inline">· SQLite WAL &lt; 0.2ms</span>
      </div>

      {/* DERECHA — versión, en texto terciario y cifras tabulares, igual
          que el VersionText de la app. */}
      <span className="tnum tabular-nums ml-auto shrink-0 font-mono">v2.4.1</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* DisciplineLED                                                      */
/* ------------------------------------------------------------------ */

/**
 * DisciplineLED — pip fijo, sin pulso ni halo. Verde = disciplina
 * sana, ámbar = aviso. Un disco redondo aquí se leía como semáforo
 * de consumo; el canto de 1 px es el del resto de la mesa.
 */
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
