"use client";

import { useSyncExternalStore } from "react";
import { useLang } from "@/lib/i18n";
import { useDemo } from "./DemoContext";
import { BrandGlyph } from "@/components/tj/BrandGlyph";

/* ------------------------------------------------------------------ */
/* Reloj de mercado                                                    */
/* ------------------------------------------------------------------ */

/*
 * Las cuatro plazas, con su apertura y cierre en minutos desde la
 * medianoche UTC. Mismos valores que el control MarketClock de la app
 * (Controls/MarketClock.xaml) y que @/components/tj/MarketClock; se
 * duplican aquí a propósito para no arrastrar al chrome de la demo —
 * que está montado siempre — el bundle del control grande, que además
 * pinta un canvas.
 */
const SESSIONS = [
  // `offset` = minutos respecto a UTC, para pintar la hora local de cada
  // plaza junto a su nombre igual que hace la app.
  { id: "sydney", nameEs: "Sídney", nameEn: "Sydney", open: 21 * 60, close: 6 * 60, offset: 600 },
  { id: "tokyo", nameEs: "Tokio", nameEn: "Tokyo", open: 23 * 60, close: 8 * 60, offset: 540 },
  { id: "london", nameEs: "Londres", nameEn: "London", open: 8 * 60, close: 16 * 60 + 30, offset: 60 },
  {
    id: "newyork",
    nameEs: "Nueva York",
    nameEn: "New York",
    open: 13 * 60 + 30,
    close: 20 * 60,
    offset: -240,
  },
] as const;

function sessionIsOpen(open: number, close: number, utcMin: number): boolean {
  if (open < close) return utcMin >= open && utcMin < close;
  // Sesión que cruza la medianoche UTC.
  return utcMin >= open || utcMin < close;
}

/** Avance 0–100 de la ventana de mercado — la barrita bajo cada plaza. */
function sessionProgress(open: number, close: number, utcMin: number): number {
  const span = open < close ? close - open : 1440 - open + close;
  if (span <= 0) return 0;
  const elapsed = open < close ? utcMin - open : (utcMin - open + 1440) % 1440;
  return Math.max(0, Math.min(100, (elapsed / span) * 100));
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/* --- Fuente de tiempo para useSyncExternalStore --------------------- */

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
 * Segundos enteros desde época. Se redondea a segundo a propósito: React
 * llama a esta función en cada render y debe devolver el MISMO valor
 * mientras no haya cambiado de verdad; con milisegundos cambiaría en cada
 * llamada y provocaría un bucle de renders.
 */
function getSecondSnapshot(): number {
  return Math.floor(Date.now() / 1000);
}

/** En servidor no hay hora que enseñar. */
function getServerSecondSnapshot(): number {
  return 0;
}

/**
 * MarketClock — el reloj de la barra de título, réplica del control
 * `controls:MarketClock` de la app (Controls/MarketClock.xaml).
 *
 * La versión anterior de la demo reducía esto a cuatro puntitos de
 * colores sin nombre ni hora: se perdía justo lo que hace reconocible
 * la barra de título de la app. Aquí está lo que enseña de verdad:
 * la hora UTC con SEGUNDOS y, tras una hairline vertical, las cuatro
 * plazas con su punto abierto/cerrado, su nombre, su hora local y una
 * barra de 2 px con el avance de su ventana de mercado.
 *
 * Al estrechar la ventana la app deja solo el bloque UTC
 * (AdjustTitleBarDensity); aquí lo hace el breakpoint `lg`.
 */
function MarketClock() {
  const { lang } = useLang();
  const es = lang === "es";
  // El reloj es una fuente externa a React (el tiempo), así que se lee con
  // `useSyncExternalStore`, que es la herramienta prevista para eso y
  // distingue servidor de cliente sin efectos: la hora del visitante y la
  // del servidor no coinciden nunca y renderizarla en SSR rompería la
  // hidratación. La versión anterior usaba useState + useEffect, lo que
  // provocaba un render en cascada al montar (react-hooks/set-state-in-effect).
  const epochSeconds = useSyncExternalStore(
    subscribeToSecond,
    getSecondSnapshot,
    getServerSecondSnapshot
  );

  // 0 = todavía en servidor/hidratación: no pintamos hora aún.
  if (epochSeconds === 0) return <div className="hidden md:block" aria-hidden="true" />;
  const now = new Date(epochSeconds * 1000);

  const utcMin = now.getUTCHours() * 60 + now.getUTCMinutes();
  const utcTime = `${pad2(now.getUTCHours())}:${pad2(now.getUTCMinutes())}:${pad2(
    now.getUTCSeconds()
  )}`;

  return (
    <div className="hidden md:flex items-center gap-3">
      {/* Bloque UTC — nunca desaparece: es la referencia con la que se
          anota una operación. */}
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

      <span
        aria-hidden="true"
        className="hidden lg:block w-px h-[18px] bg-[rgb(var(--divider)/0.12)]"
      />

      <div className="hidden lg:flex items-center gap-3.5">
        {SESSIONS.map((s) => {
          const open = sessionIsOpen(s.open, s.close, utcMin);
          const name = es ? s.nameEs : s.nameEn;
          const localMin = (((utcMin + s.offset) % 1440) + 1440) % 1440;
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
              {/* Avance de la ventana de mercado (el ProgressBar de 2 px
                  del XAML). Solo se pinta cuando la plaza está abierta —
                  una barra a medias en una plaza cerrada se lee como un
                  dato, y no lo es. */}
              <div className="mt-[3px] h-[2px] bg-[rgb(var(--divider)/0.10)] overflow-hidden">
                <div
                  className="h-full"
                  style={{
                    width: open
                      ? `${sessionProgress(s.open, s.close, utcMin)}%`
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

/* ------------------------------------------------------------------ */
/* Barra de título                                                     */
/* ------------------------------------------------------------------ */

/**
 * Barra de título de la app, réplica de MainWindow.xaml L76-168.
 *
 * Es asimétrica a propósito, igual que la real: identidad a la
 * izquierda, cuenta pegada a ella como chip de terminal, reloj de
 * mercado empujado a la derecha, y el estado local-first justo antes de
 * los botones de ventana.
 *
 *   ┌──────────────────────────────────────────────────────────────────┐
 *   │ ▣ CountPips  ▭ DEMO · 10.000 $   UTC 15:25:47 │ ●Sídney…  │
 *   │                                          ● Local-first  ─ □ ✕   │
 *   └──────────────────────────────────────────────────────────────────┘
 *
 * Los botones de ventana siguen el estilo de Windows 11: 46 px de ancho
 * por el alto completo, para que el lavado del hover llegue a los bordes;
 * el de cerrar vira al rojo #C42B1C. Maximizar alterna el modo pantalla
 * completa de la demo; minimizar es decorativo (no hay analogía web).
 */
export function WindowChrome() {
  const { t } = useLang();
  const { fullscreen, setFullscreen } = useDemo();

  return (
    <div className="tj-paper-dense demo-chrome demo-hairline border-b flex items-center h-11 sm:h-10 text-xs shrink-0 relative cursor-default select-none">
      {/* Identidad + cuenta. `min-w-0` + `truncate` en el nombre evita que
          el chip de cuenta empuje el reloj fuera del panel en viewports
          estrechos. En móvil la barra sube a h-11 (44 px) para que los
          botones de ventana cumplan el mínimo de tamaño de toque sin tener
          que ensancharlos visualmente — el lavado del hover ya llega a los
          cantos. */}
      <div className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 min-w-0 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <AppIcon />
          {/* App name — visible on mobile too (was `hidden sm:inline`).
              Without it the mobile title bar showed just an 18px icon + 3
              caption buttons with 130px of dead space between them — the
              window read as untitled. "CountPips" at 13px is ~70px wide,
              fills the dead space without crowding the caption buttons. */}
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

      {/* Reloj — empujado contra el estado local-first, como en la app. */}
      <div className="flex-1 min-w-0 flex justify-end pr-2 sm:pr-3">
        <MarketClock />
      </div>

      {/* Estado local-first + botones de ventana. En móvil cada botón de
          .caption ocupa 44 px de ancho (de 46 px en escritorio) para cumplir
          el mínimo de toque sin que el alto de la barra tenga que crecer
          más allá de los 44 px que ya tiene — la regla h-full hereda esa
          altura y el área clicable queda en 44×44. En sm+ recuperan sus
          46 px nativos. */}
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
          className="w-11 sm:w-[46px] h-full flex items-center justify-center text-tertiary hover:bg-[rgb(var(--pnl-neg))] hover:text-white transition-colors duration-150"
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

/* ------------------------------------------------------------------ */

/**
 * LED local-first — punto verde + etiqueta, réplica del LocalFirstPanel
 * (XAML L159-167). La app usa un Ellipse fijo, sin pulso: es un
 * indicador de estado (siempre "encendido" en una app local-first), no
 * un latido. Aquí igual: sin animación.
 */
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

/**
 * Chip de cuenta — la píldora de terminal con hairline y texto
 * monoespaciado de la barra de título (XAML L119-130). No es
 * interactivo: en la app lleva IsHitTestVisible="False" para que el
 * arrastre de la ventana pase a través de él.
 */
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

/**
 * Icono de la app en la barra de título de la ventana simulada.
 *
 * Aquí ponía que `Assets/app-logo.png` era «el ojo de trazo champagne
 * sobre placa oscura». No lo es: es el cuaderno de piel con las tres
 * velas japonesas. Sobre esa descripción equivocada se montó una placa
 * oscura con un glifo dentro, imitando algo que la aplicación no hace.
 *
 * Esta barra reproduce la de la ventana real, y ahí el icono va suelto,
 * sin placa: el logotipo ya trae su propio cuerpo. Por eso desaparece el
 * cuadrado `#1A1917` y el glifo pasa a ocupar los 18 px enteros que antes
 * ocupaba la placa — el ancho de la fila no cambia.
 */
function AppIcon() {
  return <BrandGlyph size={18} className="shrink-0" />;
}
