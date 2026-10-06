"use client";

import { useSyncExternalStore } from "react";
import { useLang } from "@/lib/i18n";
import { useDemo } from "./DemoContext";
import { BrandGlyph } from "@/components/tj/BrandGlyph";
import { PLAZAS, avance, estaAbierta, horaLocal } from "@/lib/sesiones";

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Avisa a React una vez por segundo (pausado cuando la pestaña está en segundo plano). */
function subscribeToSecond(onChange: () => void): () => void {
  let id = 0;
  const tick = () => onChange();
  const parar = () => {
    if (id) window.clearInterval(id);
    id = 0;
  };
  const arrancar = () => {
    parar();
    if (typeof document !== "undefined" && document.hidden) return;
    tick();
    id = window.setInterval(tick, 1000);
  };
  arrancar();
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", arrancar);
  }
  return () => {
    parar();
    if (typeof document !== "undefined") {
      document.removeEventListener("visibilitychange", arrancar);
    }
  };
}

/**
 * Segundos enteros desde época. Se redondea a propósito: React llama a esta
 * función en cada render y exige el mismo valor mientras no cambie; con
 * milisegundos habría un bucle de renders.
 */
function getSecondSnapshot(): number {
  return Math.floor(Date.now() / 1000);
}

/** En servidor no hay hora que enseñar. */
function getServerSecondSnapshot(): number {
  return 0;
}

/**
 * Reloj de la barra de título, réplica de `controls:MarketClock`
 * (Controls/MarketClock.xaml): hora UTC con segundos y, tras un filete, las
 * cuatro plazas con su punto abierto/cerrado, hora local y barra de avance de
 * su ventana de mercado. Al estrechar la ventana la app deja solo el bloque
 * UTC (AdjustTitleBarDensity); aquí lo hacen los breakpoints.
 */
function MarketClock() {
  const { lang } = useLang();
  const es = lang === "es";
  // `useSyncExternalStore` distingue servidor de cliente sin efectos: la hora del
  // visitante y la del servidor no coinciden y romperían la hidratación.
  const epochSeconds = useSyncExternalStore(
    subscribeToSecond,
    getSecondSnapshot,
    getServerSecondSnapshot
  );

  // 0 = todavía en servidor/hidratación: no pintamos hora aún.
  if (epochSeconds === 0) return <div className="hidden md:block" aria-hidden="true" />;
  const now = new Date(epochSeconds * 1000);

  const utcTime = `${pad2(now.getUTCHours())}:${pad2(now.getUTCMinutes())}:${pad2(
    now.getUTCSeconds()
  )}`;

  return (
    <div className="hidden md:flex items-center gap-3">
      {/* El bloque UTC no desaparece: es la referencia con la que se anota una operación. */}
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] text-tertiary">UTC</span>
        <span
          className="text-[13px] font-semibold text-primary tabular-nums"
          style={{
            fontFamily: '"Cascadia Mono", Consolas, "Courier New", monospace',
          }}
        >
          {utcTime}
        </span>
      </div>

      {/* Las sesiones entran en `xl`, no en `lg`: las cuatro plazas piden ~330 px y a
          1024 la barra de título se salía 119 px. El bloque UTC sí cabe en `md`. */}
      <span
        aria-hidden="true"
        className="hidden xl:block w-px h-[18px] bg-[rgb(var(--divider)/0.12)]"
      />

      <div className="hidden xl:flex items-center gap-3.5">
        {PLAZAS.map((s) => {
          const open = estaAbierta(s, now);
          const name = es ? s.es : s.en;
          const localMin = horaLocal(s.tz, now).minuto;
          const localTime = `${pad2(Math.floor(localMin / 60))}:${pad2(localMin % 60)}`;
          return (
            <div
              key={s.id}
              className="min-w-[86px]"
              title={`${name} · ${open ? (es ? "Abierta" : "Open") : es ? "Cerrada" : "Closed"}`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={`w-[5px] h-[5px] rounded-[1px] shrink-0 ${
                    open ? "bg-pnl-pos" : "bg-pnl-neg opacity-50"
                  }`}
                />
                <span className="text-[11px] text-secondary">{name}</span>
                <span className="text-[11px] text-tertiary tabular-nums">
                  {localTime}
                </span>
              </div>
              {/* Avance de la ventana de mercado (ProgressBar de 2 px del XAML):
                  a cero con la plaza cerrada, para que no se lea como dato. */}
              <div className="mt-[3px] h-[2px] bg-[rgb(var(--divider)/0.10)] overflow-hidden">
                <div
                  className="h-full"
                  style={{
                    width: open
                      ? `${avance(s, now)}%`
                      : "0%",
                    background: "rgb(var(--accent-base))",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Barra de título de la app, réplica de MainWindow.xaml L76-168. Asimétrica
 * como la real: identidad y cuenta a la izquierda, reloj empujado a la
 * derecha y estado local-first antes de los botones de ventana.
 *
 * Los botones son de Windows 11 (46 px de ancho por el alto completo, el de
 * cerrar vira a rojo). Maximizar alterna la pantalla completa de la demo;
 * minimizar es decorativo.
 */
export function WindowChrome() {
  const { t } = useLang();
  const { fullscreen, setFullscreen } = useDemo();

  return (
    <div className="tj-paper-dense demo-chrome demo-hairline border-b flex items-center h-11 sm:h-10 text-xs shrink-0 relative cursor-default select-none">
      {/* `min-w-0` y `truncate` en el nombre evitan que el chip de cuenta empuje el
          reloj fuera en viewports estrechos. En móvil la barra sube a h-11 (44 px)
          para cumplir el tamaño mínimo de toque. */}
      <div className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 min-w-0 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <AppIcon />
          <span
            className="text-[13px] font-semibold text-primary truncate min-w-0"
            style={{
              fontFamily: '"Segoe UI Variable", "Segoe UI", system-ui, sans-serif',
            }}
          >
            {t("appName")}
          </span>
        </div>
        <AccountChip />
      </div>

      <div className="flex-1 min-w-0 flex justify-end pr-2 sm:pr-3">
        <MarketClock />
      </div>

      {/* En móvil cada botón mide 44 px de ancho (46 en sm+) y hereda el alto de
          la barra: área de toque de 44×44. */}
      <div className="flex items-stretch h-full shrink-0">
        <LocalFirstLED />
        <button
          type="button"
          aria-label={t("winMinimize")}
          tabIndex={-1}
          className="w-11 sm:w-[46px] h-full flex items-center justify-center text-tertiary hover:bg-[rgb(var(--divider)/0.08)] hover:text-primary transition-colors duration-150"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <line x1="0.5" y1="5" x2="9.5" y2="5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
        </button>
        <button
          type="button"
          aria-label={fullscreen ? t("winRestore") : t("winMaximize")}
          onClick={() => setFullscreen(!fullscreen)}
          className="w-11 sm:w-[46px] h-full flex items-center justify-center text-tertiary hover:bg-[rgb(var(--divider)/0.08)] hover:text-primary transition-colors duration-150"
        >
          {fullscreen ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <rect x="0.5" y="2.5" width="6" height="6" stroke="currentColor" strokeWidth="1" fill="none" />
              <path d="M2.5 2.5V1.5A1 1 0 0 1 3.5 0.5H8.5A1 1 0 0 1 9.5 1.5V6.5A1 1 0 0 1 8.5 7.5H7.5" stroke="currentColor" strokeWidth="1" fill="none" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <rect x="0.5" y="0.5" width="9" height="9" stroke="currentColor" strokeWidth="1" fill="none" />
            </svg>
          )}
        </button>
        <button
          type="button"
          aria-label={t("winClose")}
          onClick={() => {
            if (fullscreen) setFullscreen(false);
          }}
          className="w-11 sm:w-[46px] h-full flex items-center justify-center text-tertiary hover:bg-[rgb(var(--pnl-neg))] hover:text-[rgb(var(--pnl-ink))] transition-colors duration-150"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <line x1="0.5" y1="0.5" x2="9.5" y2="9.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            <line x1="9.5" y1="0.5" x2="0.5" y2="9.5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/** LED local-first, réplica del LocalFirstPanel (XAML L159-167): fijo y sin pulso, es un estado, no un latido. */
function LocalFirstLED() {
  const { t } = useLang();
  return (
    <div
      className="hidden sm:flex items-center gap-2 px-3 h-full"
      title={t("titleLocalFirstLed")}
      aria-label={t("titleLocalFirstLed")}
    >
      <span className="w-2 h-2 rounded-[1px] bg-pnl-pos" aria-hidden="true" />
      <span className="text-[11px] text-tertiary truncate">{t("localFirst")}</span>
    </div>
  );
}

/** Chip de cuenta de la barra de título (XAML L119-130). No es interactivo: en la app lleva IsHitTestVisible="False". */
function AccountChip() {
  const { t } = useLang();
  return (
    <span className="hidden sm:inline-flex items-center gap-2 h-[24px] px-2.5 rounded-[2px] border border-[rgb(var(--divider)/0.12)] pointer-events-none">
      <svg
        width="12"
        height="12"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-tertiary shrink-0"
        aria-hidden="true"
      >
        <path d="M2 5a1 1 0 011-1h10a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V5z" />
        <path d="M2 7h12" />
        <circle cx="11" cy="9.5" r="0.6" fill="currentColor" />
      </svg>
      <span
        className="text-[11px] text-secondary tabular-nums whitespace-nowrap"
        style={{ fontFamily: '"Cascadia Mono", Consolas, "Courier New", monospace' }}
      >
        {t("demoAccount")}
      </span>
    </span>
  );
}

/** Icono de la app, suelto y sin placa como en la barra de título real. */
function AppIcon() {
  return <BrandGlyph size={18} className="shrink-0" />;
}
