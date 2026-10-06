"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Toaster } from "@/components/ui/toaster";
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

/**
 * La demo: recreación interactiva de la app nativa dentro de una ventana.
 * @param hideHeader Oculta la cabecera interna (eyebrow, titular y subtítulo);
 * HomeDemo ya pinta su propio titular, y la ruta /demo sí usa la interna.
 */
export function AppDemo({ hideHeader = false }: { hideHeader?: boolean } = {}) {
  /* El movimiento es CSS (`.tj-dm-*` en globals.css) y `useViaje`; los dos
     respetan «reducir movimiento» por su cuenta. */
  return (
    <DemoProvider>
      <AppDemoInner hideHeader={hideHeader} />
    </DemoProvider>
  );
}

function AppDemoInner({ hideHeader = false }: { hideHeader?: boolean }) {
  const { t, lang } = useLang();
  const { page, fullscreen, setFullscreen, setPage, goBack } = useDemo();

  /* La primera página no entra animada: el esqueleto de AppDemoClient ya dibuja
     su silueta y animarla la dejaba medio segundo invisible. Solo anima el cambio. */
  const [paginaPrevia, setPaginaPrevia] = useState(page);
  const [haCambiado, setHaCambiado] = useState(false);
  if (page !== paginaPrevia) {
    setPaginaPrevia(page);
    setHaCambiado(true);
  }

  // Estado de la paleta y de la ayuda de atajos, aquí para que el listener de
  // captura los abra y los paneles queden dentro de la ventana de la demo.
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Contexto de posición de los paneles y condición del interceptor de Cmd+K / `?`
  // (solo actúa con la demo bajo el ratón o con foco, para no pisar los globales).
  const demoRootRef = useRef<HTMLDivElement>(null);

  const panelLabelKey =
    page === "detail"
      ? "pageTrades"
      : (`page${page.charAt(0).toUpperCase()}${page.slice(1)}` as
          | "pageDashboard"
          | "pageTrades"
          | "pageAnalytics"
          | "pageJournal");

  // Escape sale de pantalla completa. El setState va en el manejador, no en el
  // cuerpo del efecto (regla set-state-in-effect).
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

  // Tecla F: pantalla completa. No actúa al escribir en un campo, con modificadores
  // (no pisa Ctrl+F del navegador) ni con una paleta o ayuda abierta.
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
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Una tecla sola, solo con el foco dentro de la demo (WCAG 2.1.4).
      if (!target?.closest("[data-demo-raiz]")) return;
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

  // Interceptor de Cmd+K (paleta) y `?` (atajos) propios de la demo. Va en fase de
  // captura y con `stopPropagation` para que no salten los globales; solo actúa con
  // la demo bajo el ratón o con foco, y no al escribir en un campo ni con un
  // panel de la demo ya abierto (su Escape lo cierra).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const root = demoRootRef.current;
      if (!root) return;
      if (!root.matches(":hover, :focus-within")) return;
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
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        e.stopPropagation();
        setPaletteOpen(true);
        return;
      }
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

  // Gesto horizontal: avanza o retrocede por las cuatro pestañas del TopNav. Desde el
  // detalle (que cuelga de operaciones), derecha vuelve a la lista e izquierda va a
  // análisis. Umbral de 50 px con eje dominante horizontal, para no pisar el scroll
  // vertical; se ignora si empieza en un control interactivo.
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
    if (Math.abs(dy) > Math.abs(dx)) return;

    if (dx < 0) {
      if (page === "detail") {
        setPage(PAGES_ORDER[2]);
      } else {
        const i = PAGES_ORDER.indexOf(page);
        if (i >= 0 && i < PAGES_ORDER.length - 1) {
          setPage(PAGES_ORDER[i + 1]);
        }
      }
    } else {
      if (page === "detail") {
        goBack();
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
      {!hideHeader && (
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="eyebrow inline-flex items-center gap-2 justify-center mb-3">
            <span className="w-6 h-px bg-[rgb(var(--divider)/0.45)]" />
            {t("demoTitle")}
            <span className="w-6 h-px bg-[rgb(var(--divider)/0.45)]" />
          </div>
          <h2 className="font-medium tracking-[-0.03em] leading-tight" style={{ fontSize: "clamp(1.75rem, 4vw, 3rem)" }}>
            {lang === "es" ? (
              <>La app, en tu navegador.</>
            ) : (
              <>The app, in your browser.</>
            )}
          </h2>
          <p className="text-lg text-secondary mt-4 leading-relaxed">{t("demoSubtitle")}</p>
        </div>
      )}

      {/* Ventana opaca con filete y sombra, no tarjeta de cristal: `.demo-window`
          (ver globals.css) y no `.liquid-glass`. Radio de 2 px, el del sistema. */}
      <div
        ref={demoRootRef}
        data-demo-raiz=""
        className={`relative mx-auto transition-[transform,border-radius,box-shadow,opacity] duration-500 ease-[var(--ease-suave)] ${
          fullscreen ? "fixed inset-3 z-[100] rounded-[2px]" : "rounded-[2px]"
        }`}
      >
        {/* `overflow-clip` y no `overflow-hidden`: `hidden` crea un contenedor de
            desplazamiento y `animation-timeline: view()` ancla su línea de tiempo
            a él; esta ventana nunca se desplaza, así que cuarenta piezas de la
            demo se quedaban a opacidad 0. Sombra corta, como todo lo que flota. */}
        <div className="rounded-[2px] overflow-clip border border-[rgb(var(--divider)/0.10)] shadow-[var(--cristal-sombra-flota)]">
        <div className="demo-window rounded-[2px] overflow-clip">
          <WindowChrome />
          <TopNav />

          {/* Panel de alto fijo con scroll propio. El degradado inferior indica que
              hay más contenido; es constante porque `scroll-timeline` aún no
              tiene soporte suficiente. */}
          <div className="relative">
            <div
              role="tabpanel"
              id="demo-tabpanel"
              aria-label={t(panelLabelKey)}
              tabIndex={0}
              /* Alto del panel: 560 en móvil, 640 en md+. Si cambia, hay que
                 cambiarlo también en el esqueleto (AppDemoClient) y en la altura
                 reservada del contenedor, o la página salta al hidratar. */
              className="relative h-[560px] md:h-[640px] overflow-y-auto custom-scroll focus:outline-none"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {/* Como en la app (Fluent): una sección entra desde abajo con la curva de
                  deceleración de WinUI y abrir una operación es un «drill-in».
                  Sin salida animada, la página nueva empieza a entrar al pulsar. */}
              <div key={page} className={`min-h-full ${!haCambiado ? "" : page === "detail" ? "tj-demo-fondo" : "tj-demo-entra"}`}>
                {page === "dashboard" && <DashboardPage />}
                {page === "trades" && <TradesPage />}
                {page === "detail" && <TradeDetailPage />}
                {page === "analytics" && <AnalyticsPage />}
                {page === "journal" && <JournalPage />}
              </div>
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

          <StatusBar />

          {/* Dentro del contexto de posición de la demo, para que cubra solo la ventana. */}
          <DemoCommandPalette
            open={paletteOpen}
            onClose={() => setPaletteOpen(false)}
          />

          <DemoShortcutsHint
            open={shortcutsOpen}
            onClose={() => setShortcutsOpen(false)}
          />

          {/* Filo de luz superior al 8 %: a más leía como reflejo de cristal. */}
          <div
            aria-hidden="true"
            className="absolute top-0 left-0 right-0 h-px bg-[rgb(var(--divider)/0.08)] pointer-events-none z-10"
          />
        </div>
        </div>
      </div>
      {/* Solo la demo lanza avisos y la librería viaja con ella (en el layout la
          cargarían todas las páginas, con una región «Notifications» vacía). Va al
          `body` por portal: un ancestro con `contain` o `transform` encerraría su
          `position: fixed`. */}
      {createPortal(<Toaster />, document.body)}
    </div>
  );
}
