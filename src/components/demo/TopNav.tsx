"use client";

import { useEffect } from "react";
import { useDemo, type DemoPage } from "./DemoContext";
import { useLang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

/*
 * Menú superior — réplica del NavigationView en modo Top de la app real
 * (MainWindow.xaml L175-317).
 *
 * Lo que hace la app real y esta demo NO hacía:
 *   · Los items NO llevan píldora de fondo ni halo. Son texto plano; el
 *     activo se marca con el TEXTO en color de acento y una BARRITA corta
 *     de acento debajo, centrada bajo el item (el indicador nativo del
 *     NavigationView de WinUI). La demo pintaba un rectángulo blanco al
 *     10 % con una sombra dorada difusa alrededor — nada que ver.
 *   · El menú va ÓPTICAMENTE CENTRADO, no pegado a la izquierda. En la app
 *     lo consigue un clon invisible del pie del panel (ver el comentario
 *     largo del XAML); aquí basta una rejilla de 3 columnas.
 *   · A la derecha viven TRES botones fantasma — modo streamer (ojo), tema
 *     (sol/luna) e idioma (ES/EN) — no un botón "+ Nueva operación", que la
 *     app real no tiene en esta barra.
 *
 * Solo salen las CUATRO primeras secciones de la app (ver DemoPage). Los
 * iconos son trazos equivalentes a los glifos Segoe Fluent que usa la app
 * (E80F, E8AB, E9D2, E70B): Segoe Fluent Icons no existe fuera de Windows.
 */
const NAV_ITEMS: {
  key: DemoPage;
  icon: React.ReactNode;
  labelKey: "pageDashboard" | "pageTrades" | "pageAnalytics" | "pageJournal";
}[] = [
  {
    // E80F "Home" — la casa del Resumen.
    key: "dashboard",
    labelKey: "pageDashboard",
    icon: <path d="M4 10.5L12 4l8 6.5V19a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1v-8.5z" />,
  },
  {
    // E8AB "Switch" — las dos flechas cruzadas de Operaciones.
    key: "trades",
    labelKey: "pageTrades",
    icon: <path d="M4 8h13l-3-3M20 16H7l3 3" />,
  },
  {
    // E9D2 "StackedLineChart" — la analítica.
    key: "analytics",
    labelKey: "pageAnalytics",
    icon: <path d="M3 17l5-6 4 3 4-6 5 5" />,
  },
  {
    // E70B "Edit" (nota) — el Diario.
    key: "journal",
    labelKey: "pageJournal",
    icon: <path d="M5 4h11l4 4v12H5V4zM16 4v4h4M8 12h8M8 16h5" />,
  },
];

export function TopNav() {
  const { page, setPage } = useDemo();
  const { t, lang, setLang } = useLang();
  const { theme, toggleTheme } = useTheme();

  /** Map current `page` back to the nav item that owns it ("detail" → "trades"). */
  const activeNavKey = page === "detail" ? "trades" : page;
  const activeIndex = NAV_ITEMS.findIndex((item) => item.key === activeNavKey);

  const focusTab = (index: number) => {
    const root = document.getElementById("demo-tablist");
    if (!root) return;
    const buttons = root.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    const clamped = Math.max(0, Math.min(NAV_ITEMS.length - 1, index));
    buttons[clamped]?.focus();
    setPage(NAV_ITEMS[clamped].key);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        focusTab(activeIndex + 1);
        break;
      case "ArrowLeft":
        e.preventDefault();
        focusTab(activeIndex - 1);
        break;
      case "Home":
        e.preventDefault();
        focusTab(0);
        break;
      case "End":
        e.preventDefault();
        focusTab(NAV_ITEMS.length - 1);
        break;
      default:
        break;
    }
  };

  // Atajos 1–4, el equivalente web del Ctrl+1..4 de la app (los
  // KeyboardAccelerator de MainWindow.xaml L19-32). Se ignoran mientras el
  // foco está dentro de un campo para no secuestrar la escritura.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable
        ) {
          return;
        }
      }
      const num = Number.parseInt(e.key, 10);
      if (Number.isInteger(num) && num >= 1 && num <= NAV_ITEMS.length) {
        e.preventDefault();
        setPage(NAV_ITEMS[num - 1].key);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPage]);

  const es = lang === "es";

  return (
    /* Rejilla 1fr / auto / 1fr: la columna central queda centrada en la
       ventana pase lo que pase con el ancho de los botones de la derecha —
       el mismo resultado que la app consigue con su clon invisible. La
       columna izquierda está vacía a propósito y es la que hace de
       contrapeso. `min-w-0` en ambas columnas 1fr evita que los botones
       fantasma (≥44px en móvil) empujen el ancho del panel y rompan la
       página en viewports estrechos. `chrome-fill` es el velo de marco
       (ChromeFillBrush), el mismo que llevan la barra de título y la de
       estado. */
    /* Rejilla de tres columnas para el centreado óptico de las pestañas
        (ver comentario grande más abajo). En móvil se cambia a
        `auto / 1fr / auto`: la columna izquierda vacía colapsa a 0 y la
        derecha se dimensiona por su contenido (botones fantasma + ES),
        de modo que los botones de la derecha NO se comprimen por debajo
        de sus 44 px de toque y las pestañas se reparten el ancho restante
        con scroll horizontal limpio si hace falta. En sm+ se vuelve al
        `1fr / auto / 1fr` simétrico, que centra ópticamente las pestañas
        como en la app real. */
    <div className="demo-chrome demo-hairline border-b grid grid-cols-[auto_minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch h-[46px] shrink-0">
      <div aria-hidden="true" />

      <div
        id="demo-tablist"
        role="tablist"
        aria-label={t("demoTitle")}
        onKeyDown={onKeyDown}
        className="flex items-center gap-0.5 sm:gap-1 min-w-0 overflow-x-auto no-scrollbar overscroll-x-contain"
      >
        {NAV_ITEMS.map((item) => {
          const active =
            page === item.key || (item.key === "trades" && page === "detail");
          const label = t(item.labelKey);
          return (
            <button
              key={item.key}
              role="tab"
              aria-selected={active}
              aria-label={label}
              aria-controls="demo-tabpanel"
              tabIndex={active ? 0 : -1}
              onClick={() => setPage(item.key)}
              // `min-w-[44px]` en móvil garantiza el tamaño de toque mínimo
              // incluso cuando la etiqueta está oculta (solo icono). En sm+,
              // el texto le da al botón ancho de sobra y la restricción es
              // inofensiva. `justify-center` centra el icono en móvil.
              //
              // Active state on mobile: icon-only tabs need a clearer active
              // signal than the 3px gold bar alone (which reads at ~20px on a
              // 44px button). A subtle accent-tinted background pill (mobile
              // only, `sm:bg-transparent` resets it) + the gold bar reads as
              // "selected" the way iOS/Material tab bars do. The bar also
              // bumps from w-5 → w-6 on mobile for visibility.
              className={`relative h-full min-w-[44px] sm:min-w-0 px-3 sm:px-4 flex items-center justify-center sm:justify-start gap-2 text-[13px] transition-[background-color,color,transform] duration-150 ease-[var(--ease-menu-in)] whitespace-nowrap outline-none focus-visible:ring-1 focus-visible:ring-[rgb(var(--accent-base)/0.6)] focus-visible:-ring-offset-1 rounded-[2px] sm:rounded-none ${
                active
                  ? "text-primary bg-[rgb(var(--accent-base)/0.10)] sm:bg-transparent"
                  : "text-secondary hover:text-primary hover:bg-[rgb(var(--divider)/0.04)] sm:hover:bg-transparent"
              }`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="shrink-0"
                aria-hidden="true"
              >
                {item.icon}
              </svg>
              <span className="hidden sm:inline">{label}</span>
              {/* Indicador nativo del NavigationView: barrita de acento
                  corta y centrada bajo el item, no un subrayado de borde a
                  borde. `left-1/2 -translate-x-1/2 w-6 sm:w-5` reproduce el
                  ancho fijo del indicador de WinUI (24 px en móvil para
                  mejor visibilidad sobre iconos sin etiqueta, 20 px en sm+). */}
              {active && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-[6px] left-1/2 -translate-x-1/2 w-6 sm:w-5 h-[3px] rounded-[1px] transition-all duration-200 ease-[var(--ease-menu-in)]"
                  style={{ background: "rgb(var(--accent-base))" }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Pie del panel: modo streamer · tema · idioma. Son los tres botones
          fantasma que la app lleva en NavigationView.PaneFooter (XAML
          L289-313). El de streamer es decorativo aquí (oculta cifras en la
          app real, algo que la demo no necesita); tema e idioma sí actúan.
          El de streamer se oculta por debajo de `lg` para garantizar que los
          botones de tema/idioma mantengan sus 32 px de ancho nativo (y 44 px
          de toque en móvil) sin que la columna 1fr de la rejilla los comprima
          en viewports intermedios (768–1023 px). */}
      <div className="flex items-center justify-end gap-0.5 pr-2 sm:pr-2 min-w-0">
        <div className="hidden lg:block">
          <GhostButton
            label={es ? "Modo streamer" : "Streamer mode"}
            onClick={() => {}}
          >
            <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
            <circle cx="12" cy="12" r="2.6" />
          </GhostButton>
        </div>
        <GhostButton
          label={es ? "Cambiar tema" : "Toggle theme"}
          onClick={toggleTheme}
        >
          {theme === "dark" ? (
            <>
              <circle cx="12" cy="12" r="4" />
              <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" />
            </>
          ) : (
            <path d="M20 14.5A8 8 0 019.5 4a8 8 0 1010.5 10.5z" />
          )}
        </GhostButton>
        <button
          type="button"
          onClick={() => setLang(es ? "en" : "es")}
          aria-label={es ? "Idioma" : "Language"}
          title={es ? "Idioma" : "Language"}
          className="h-11 min-w-[44px] sm:h-8 sm:min-w-0 px-2 rounded-[2px] flex items-center justify-center gap-1 text-[12px] font-semibold text-secondary hover:text-primary hover:bg-[rgb(var(--txt-primary)/0.06)] transition-colors"
        >
          {es ? "ES" : "EN"}
          <svg
            width="8"
            height="8"
            viewBox="0 0 8 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.3"
            aria-hidden="true"
            className="opacity-60"
          >
            <path d="M1 2.5L4 5.5l3-3" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/** Botón fantasma del pie del menú — mismo tamaño y peso que el
 *  GhostButtonStyle de la app (icono de 16 px en una caja de 32).
 *  En móvil la caja crece a 44×44 px (h-11 w-11) para cumplir el mínimo
 *  de tamaño de toque; en sm+ vuelve a 32×32 como en la app real. */
function GhostButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="h-11 w-11 sm:h-8 sm:w-8 rounded-[2px] flex items-center justify-center text-secondary hover:text-primary hover:bg-[rgb(var(--txt-primary)/0.06)] transition-colors"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {children}
      </svg>
    </button>
  );
}
