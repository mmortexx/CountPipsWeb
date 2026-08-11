"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLang } from "@/lib/i18n";
import { DemoProvider, useDemo, type DemoPage } from "./DemoContext";
import { WindowChrome } from "./WindowChrome";
import { TopNav } from "./TopNav";
import { StatusBar } from "./StatusBar";
import { DemoCommandPalette } from "./DemoCommandPalette";
import { DemoShortcutsHint } from "./DemoShortcutsHint";
import { DashboardPage } from "./pages/DashboardPage";
import { TradesPage } from "./pages/TradesPage";
import { TradeDetailPage } from "./pages/TradeDetailPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { JournalPage } from "./pages/JournalPage";

/** The demo: a windowed recreation of the native app, fully interactive. */
/**
 * @param hideHeader Oculta la cabecera interna (eyebrow + titular +
 * subtítulo). La sección HomeDemo ya pinta su propio titular antes de
 * incrustar el demo, así que sin esta bandera el visitante veía DOS
 * veces seguidas "La app, en tu navegador." — uno alineado a la
 * izquierda y otro centrado. La ruta /demo sí usa la cabecera interna.
 */
export function AppDemo({ hideHeader = false }: { hideHeader?: boolean } = {}) {
  return (
    <DemoProvider>
      {/* La bandera tiene que BAJAR hasta AppDemoInner: la cabecera se
          pinta ahí dentro, no en este envoltorio. */}
      <AppDemoInner hideHeader={hideHeader} />
    </DemoProvider>
  );
}

function AppDemoInner({ hideHeader = false }: { hideHeader?: boolean }) {
  const { t, lang } = useLang();
  const { page, fullscreen, setFullscreen, setPage, goBack } = useDemo();

  // Demo-scoped command palette + shortcuts-overlay open state. Lifted here
  // so the capture-phase keydown listener (below) can toggle them, and so
  // the overlays render inside the demo window's positioning context.
  // (R25-1a: the StatusBar's keyboard-icon button used to also toggle
  // `shortcutsOpen` — that button was removed when the StatusBar was
  // restructured to match the real app; the `?` key is now the only way
  // to open the shortcuts overlay.)
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Ref on the demo window's outer wrapper — used (a) as the positioning
  // context for the absolute overlays and (b) to gate the Cmd+K / `?`
  // capture-phase interceptor (only fires when the demo is hovered or
  // focused-within, so the global CommandPalette / ShortcutsHelp keep
  // working when the user isn't interacting with the demo).
  const demoRootRef = useRef<HTMLDivElement>(null);

  // Label the scrollable panel with the active page name (used by role="tabpanel").
  const panelLabelKey =
    page === "detail"
      ? "pageTrades"
      : (`page${page.charAt(0).toUpperCase()}${page.slice(1)}` as
          | "pageDashboard"
          | "pageTrades"
          | "pageAnalytics"
          | "pageJournal");

  // Exit fullscreen on Escape — listener attaches only while fullscreen is
  // active. The `setFullscreen(false)` call lives inside the event handler,
  // not in the effect body, so we don't trip the set-state-in-effect rule.
  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setFullscreen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen, setFullscreen]);

  /* ----------------------------------------------------------------
     F key — toggles fullscreen from anywhere on the page (when not
     typing in a form field and no modifiers are held, so we never
     hijack the browser's Cmd/Ctrl+F find-in-page). Also skipped while
     the CommandPalette or ShortcutsHelp overlay is open so those
     surfaces keep owning the keyboard. Mirrors the Escape listener's
     pattern: re-attaches whenever `fullscreen` flips so the handler
     closure always reads the current value.
     ---------------------------------------------------------------- */
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
      // Never hijack browser-owned combos (Cmd/Ctrl/Alt + F = find, etc.).
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Defer to the command palette / shortcuts overlay when they're open.
      if (document.querySelector("[cmdk-root]")) return;
      if (document.body.dataset.shortcutsHelpOpen === "true") return;
      if (document.body.dataset.demoPaletteOpen === "true") return;
      if (document.body.dataset.demoShortcutsOpen === "true") return;

      if (e.key.toLowerCase() === "f") {
        e.preventDefault();
        setFullscreen(!fullscreen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [fullscreen, setFullscreen]);

  /* ----------------------------------------------------------------
     Demo-scoped Cmd+K (palette) + `?` (shortcuts overlay) interceptor.
     Capture-phase listener on `window` so it fires BEFORE the global
     CommandPalette / ShortcutsHelp bubble-phase listeners — calling
     `stopPropagation` prevents those global handlers from also firing,
     so the demo gets its own palette / overlay instead of the site-wide
     ones whenever the demo is "active" (hovered or focused-within).

     The `:hover, :focus-within` gate on `demoRootRef` is what scopes
     the interception: when the user isn't interacting with the demo,
     the global Cmd+K / `?` keep working as before. Skipped while typing
     in a form field, while any modifiers are held (so Cmd+Shift+K etc.
     pass through), and while either demo overlay is already open
     (their own Escape handlers own the close action).
     ---------------------------------------------------------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const root = demoRootRef.current;
      if (!root) return;
      // Only intercept when the demo is "active".
      if (!root.matches(":hover, :focus-within")) return;
      // Skip when typing in a form field.
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
      // Cmd+K / Ctrl+K → open the demo command palette.
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        e.stopPropagation();
        setPaletteOpen(true);
        return;
      }
      // `?` (Shift+/) → open the demo shortcuts overlay. Skipped while
      // the demo palette is open (let the palette's own Esc close it
      // first) and while the global ShortcutsHelp is open.
      if (
        document.body.dataset.demoPaletteOpen === "true" ||
        document.body.dataset.shortcutsHelpOpen === "true" ||
        document.body.dataset.demoShortcutsOpen === "true"
      ) {
        return;
      }
      if (
        e.key === "?" ||
        (e.shiftKey && (e.key === "/" || e.code === "Slash"))
      ) {
        e.preventDefault();
        e.stopPropagation();
        setShortcutsOpen(true);
      }
    };
    window.addEventListener("keydown", onKey, true); // capture phase
    return () => window.removeEventListener("keydown", onKey, true);
  }, []);

  /* ----------------------------------------------------------------
     Touch swipe — horizontal swipe on the demo content area advances
     to the next/previous page in the main navigation chain:
       dashboard → trades → analytics → journal
     (mismas cuatro pestañas que muestra el TopNav).
     The TradeDetailPage ("detail") is a drill-down from trades; a
     swipe-right there pops back to trades (matching the back button),
     a swipe-left jumps forward to analytics (the next main page).
     Threshold: 50px horizontal, dominant axis (|dx| > |dy|) so
     vertical scroll never triggers a page change. The gesture is
     ignored when it starts on an interactive control (button, input,
     select, textarea, contentEditable) so taps and form interactions
     are never hijacked.
     ---------------------------------------------------------------- */
  const PAGES_ORDER: readonly DemoPage[] = [
    "dashboard",
    "trades",
    "analytics",
    "journal",
  ] as const;
  const SWIPE_THRESHOLD = 50;
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (target) {
      const tag = target.tagName;
      if (
        tag === "BUTTON" ||
        tag === "INPUT" ||
        tag === "SELECT" ||
        tag === "TEXTAREA" ||
        target.isContentEditable
      ) {
        touchStart.current = null;
        return;
      }
    }
    const touch = e.touches[0];
    if (!touch) return;
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    // Vertical-dominant gestures are scroll, not swipe.
    if (Math.abs(dy) > Math.abs(dx)) return;

    if (dx < 0) {
      // Swipe left → next page
      if (page === "detail") {
        setPage(PAGES_ORDER[2]); // analytics (the page after trades)
      } else {
        const i = PAGES_ORDER.indexOf(page);
        if (i >= 0 && i < PAGES_ORDER.length - 1) {
          setPage(PAGES_ORDER[i + 1]);
        }
      }
    } else {
      // Swipe right → previous page
      if (page === "detail") {
        goBack(); // pop back to the trades list
      } else {
        const i = PAGES_ORDER.indexOf(page);
        if (i > 0) {
          setPage(PAGES_ORDER[i - 1]);
        }
      }
    }
  };

  return (
    <div className="max-w-page mx-auto px-5 md:px-8">
      {/* Cabecera de sección — se omite cuando quien incrusta el demo ya
          pone la suya (ver la nota de `hideHeader` arriba). */}
      {!hideHeader && (
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="eyebrow inline-flex items-center gap-2 justify-center mb-3">
            <span className="w-6 h-px bg-[rgb(var(--divider)/0.45)]" />
            {t("demoTitle")}
            <span className="w-6 h-px bg-[rgb(var(--divider)/0.45)]" />
          </div>
          <h2 className="font-medium tracking-[-0.03em] leading-tight" style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}>
            {lang === "es" ? (
              <>La app, <span className="text-gradient">en tu navegador.</span></>
            ) : (
              <>The app, <span className="text-gradient">in your browser.</span></>
            )}
          </h2>
          <p className="text-lg text-secondary mt-4 leading-relaxed">{t("demoSubtitle")}</p>
        </div>
      )}

      {/* La ventana de la app. Una ventana de Windows 11 no es una tarjeta
          de cristal: es una superficie OPACA con una hairline finísima y
          una sombra proyectada que la despega del fondo. Por eso aquí se
          usa `.demo-window` (el lienzo de la app, ver globals.css) y no
          `.liquid-glass`, que pintaba un contorno blanco al 30 % arriba y
          abajo — el brillo que hacía que esto pareciera un mockup web.
          Radio 8 px, el ControlCornerRadius de WinUI. */}
      <div
        ref={demoRootRef}
        className={`relative mx-auto transition-[transform,border-radius,box-shadow,opacity] duration-500 ease-[var(--ease-suave)] ${
          fullscreen ? "fixed inset-3 z-[100] rounded-lg" : "rounded-lg"
        }`}
      >
        {/* ── `overflow-clip` Y NO `overflow-hidden` ──────────────────
            Las dos recortan igual. La diferencia es que `hidden` crea un
            contenedor de desplazamiento, y `animation-timeline: view()`
            ancla su línea de tiempo al contenedor más cercano: como esta
            ventana no se desplaza nunca, el progreso se quedaba clavado
            en cero y CUARENTA piezas de la demo —«P&L total», «El parte
            de hoy», la fila de métricas entera— se quedaban a opacidad 0
            para siempre. No es que no entraran con gracia: es que no se
            veían. Medido en el navegador antes y después. */}
        <div className="rounded-lg overflow-clip border border-[rgb(var(--divider)/0.10)] shadow-[0_2px_8px_rgb(0_0_0/0.28),0_18px_50px_-12px_rgb(0_0_0/0.55)]">
        <div className="demo-window rounded-lg overflow-clip">
          <WindowChrome />
          <TopNav />

          {/* Page content.
              El panel tiene alto fijo y desplazamiento propio, como la
              ventana de una app de escritorio. El problema era que el
              corte se producía a media tarjeta —el campo "Nota" quedaba
              seccionado justo contra la barra de estado— sin ningún
              indicio de que allí hubiera más contenido: a primera vista
              parecía un fallo de dibujado. El degradado de abajo es esa
              señal, y desaparece al llegar al final del desplazamiento
              (`scroll-timeline` no tiene soporte suficiente todavía, así
              que se mantiene constante y muy sutil: 40 px). */}
          <div className="relative">
            <div
              role="tabpanel"
              id="demo-tabpanel"
              aria-label={t(panelLabelKey)}
              tabIndex={0}
              /* Alto del panel: 560 en móvil (era 480) / 640 en md+. Los 80px
                 que se ganan en el teléfono son los que meten el formulario
                 dentro de la primera vista en vez de dejarlo bajo el corte.
                 Si se toca este valor hay que tocarlo TAMBIÉN en el esqueleto
                 sin hidratar (AppDemoClient) y en la altura reservada del
                 contenedor, o la página da un salto al hidratar. */
              className="relative h-[560px] md:h-[640px] overflow-y-auto custom-scroll focus:outline-none"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={page}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  className="min-h-full"
                >
                  {page === "dashboard" && <DashboardPage />}
                  {page === "trades" && <TradesPage />}
                  {page === "detail" && <TradeDetailPage />}
                  {page === "analytics" && <AnalyticsPage />}
                  {page === "journal" && <JournalPage />}
                </motion.div>
              </AnimatePresence>
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-10"
              style={{
                background:
                  "linear-gradient(180deg, transparent, color-mix(in oklab, var(--surface) 92%, transparent))",
              }}
            />
          </div>

          {/* Status bar — restructured in R25-1a to match the real app's
              status bar (MainWindow.xaml L286-331): left = discipline LED +
              "Disciplina: NN %", center = "Guardado automático en tu equipo",
              right = "v2.4.1". The pre-R25-1a metrics ticker + clock +
              keyboard / fullscreen / share / reset icon buttons are gone
              (the real app doesn't have them in the status bar —
              fullscreen is via the title bar's Maximize button,
              keyboard shortcuts via the `?` key, no share/reset in the
              native chrome). */}
          <StatusBar />

          {/* In-demo command palette (Feature 2) — Cmd+K when the demo is
              active. Rendered here so it sits inside the demo window's
              positioning context (absolute inset-0 covers only the demo,
              not the whole page). The capture-phase keydown listener above
              opens it; the palette manages its own Esc / arrows / enter. */}
          <DemoCommandPalette
            open={paletteOpen}
            onClose={() => setPaletteOpen(false)}
          />

          {/* In-demo keyboard-shortcuts overlay (Feature 3) — `?` when the
              demo is active, or click the keyboard icon in the status bar.
              Anchored bottom-right, just above the status bar. */}
          <DemoShortcutsHint
            open={shortcutsOpen}
            onClose={() => setShortcutsOpen(false)}
          />

          {/* Filo de luz superior — la hairline donde una ventana real de
              Windows 11 recoge la luz del borde de arriba. Al 8 %: al 15 %
              leía como reflejo de cristal, no como canto de ventana. El
              filo inferior se ha retirado — la app no lo tiene y le daba a
              la ventana un aspecto de tarjeta flotante. */}
          <div
            aria-hidden="true"
            className="absolute top-0 left-0 right-0 h-px bg-[rgb(var(--divider)/0.08)] pointer-events-none z-10"
          />
        </div>
        </div>
      </div>
    </div>
  );
}
