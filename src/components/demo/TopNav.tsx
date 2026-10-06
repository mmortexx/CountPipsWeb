"use client";

import { useEffect } from "react";
import { Viajero } from "./Viajero";
import { useDemo, type DemoPage } from "./DemoContext";
import { useLang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { destinoConFlechas } from "@/lib/flechas";

/*
 * Menú superior, réplica del NavigationView en modo Top de la app
 * (MainWindow.xaml L175-317): items de texto plano con el activo en color de
 * acento y una barrita corta debajo; menú centrado ópticamente (aquí con una
 * rejilla de 3 columnas, en la app con un clon invisible del pie del panel) y
 * a la derecha tres botones fantasma: streamer, tema e idioma.
 *
 * Solo salen las cuatro primeras secciones de la app (ver DemoPage). Los
 * iconos son trazos equivalentes a los glifos Segoe Fluent (E80F, E8AB, E9D2,
 * E70B), que no existen fuera de Windows.
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

/** Cuántas pestañas se alcanzan con las teclas 1…n; la ayuda de atajos lo cita de aquí. */
export const PESTANAS_NUMERADAS = NAV_ITEMS.length;

export function TopNav() {
  const { page, setPage } = useDemo();
  const { t, lang, setLang } = useLang();
  const { theme, toggleTheme } = useTheme();

  // El detalle cuelga de la pestaña de operaciones.
  const activeNavKey = page === "detail" ? "trades" : page;
  const activeIndex = NAV_ITEMS.findIndex((item) => item.key === activeNavKey);

  const focusTab = (index: number) => {
    const root = document.getElementById("demo-tablist");
    if (!root) return;
    const buttons = root.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    buttons[index]?.focus();
    setPage(NAV_ITEMS[index].key);
  };

  // Mismas teclas que el resto de pestañas del sitio; dan la vuelta en los extremos.
  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const destino = destinoConFlechas(e.key, activeIndex, NAV_ITEMS.length, true);
    if (destino === null) return;
    e.preventDefault();
    focusTab(destino);
  };

  // Atajos 1–4, equivalente web del Ctrl+1..4 de la app (MainWindow.xaml L19-32).
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
      /* Ctrl/Cmd/Alt + cifra es del navegador. Una tecla sola solo actúa con el
         foco dentro de la demo (WCAG 2.1.4) y sin paleta ni ayuda abiertas. */
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!target?.closest("[data-demo-raiz]")) return;
      const capas = document.body.dataset;
      if (capas.demoPaletteOpen === "true" || capas.demoShortcutsOpen === "true" || capas.shortcutsHelpOpen === "true") return;
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
    /* En sm+ rejilla 1fr / auto / 1fr: la columna izquierda, vacía, hace de
       contrapeso y centra las pestañas sea cual sea el ancho de los botones de
       la derecha. En móvil, auto / 1fr / auto: la derecha no baja de sus 44 px
       de toque y las pestañas reparten el resto con scroll horizontal. `min-w-0`
       evita que los botones empujen el ancho del panel. */
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
              // `min-w-[44px]` garantiza el tamaño de toque con solo icono. En móvil
              // el activo lleva además un fondo teñido (`sm:bg-transparent` lo
              // quita) y la barrita sube de w-5 a w-6.
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
              {/* Indicador del NavigationView: barrita corta centrada bajo el item
                  (24 px en móvil, 20 en sm+) que viaja al nuevo item (`Viajero`). */}
              {active && (
                <Viajero
                  clave="demo-indicador-pestana"
                  className="absolute bottom-[6px] left-1/2 -ml-3 sm:-ml-2.5 w-6 sm:w-5 h-[3px] rounded-[1px]"
                  style={{ background: "rgb(var(--accent-base))" }}
                  ms={400}
                  curva="cubic-bezier(0.1, 0.9, 0.2, 1)"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Pie del panel (NavigationView.PaneFooter, XAML L289-313). El botón de
          streamer es decorativo y se oculta bajo `lg` para que tema e idioma no se
          compriman en anchos intermedios (768–1023 px). */}
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

/** Botón fantasma del pie del menú (GhostButtonStyle de la app): caja de
 *  32 px, que en móvil crece a 44×44 para cumplir el tamaño de toque. */
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
