"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLang } from "@/lib/i18n";

/**
 * ShortcutsHelp — keyboard shortcuts overlay.
 *
 * Opens via the `tj:open-shortcuts-help` window CustomEvent (dispatched by
 * `GlobalShortcuts` when `?` is pressed, or by the Navbar `?` button). Closes
 * on Escape, backdrop click, or the X button. Framer Motion handles a soft
 * scale + fade entrance/exit. Copy is bilingual ES/EN via `useLang()`.
 *
 * While open, sets `body[data-shortcuts-help-open="true"]` so other global
 * listeners (GlobalShortcuts) can suppress their own keys.
 *
 * The `?` keyboard trigger itself lives in `GlobalShortcuts`, which performs
 * the input/textarea/select/contentEditable + CommandPalette-open guards
 * before dispatching the open event.
 *
 * ── Componente CONTROLADO ─────────────────────────────────────────────
 * Igual que la paleta: el `open` y la escucha del evento de apertura
 * viven en `OverlayHost`, que sabe abrir esta ventana sin haber cargado
 * antes su código. Este overlay solo se ve cuando alguien pulsa `?`, así
 * que no tiene por qué viajar en el arranque de todas las páginas.
 */
export function ShortcutsHelp({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { lang } = useLang();
  const es = lang === "es";
  const setOpen = onOpenChange;

  const panelRef = useRef<HTMLDivElement>(null);

  // While open: mark body so GlobalShortcuts can skip T/L, and capture Escape
  // on the way down (capture phase) so cmdk's or any other Escape handlers
  // can't swallow it.
  useEffect(() => {
    if (!open) return;
    document.body.dataset.shortcutsHelpOpen = "true";
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onEsc, true);
    return () => {
      delete document.body.dataset.shortcutsHelpOpen;
      window.removeEventListener("keydown", onEsc, true);
    };
    /* `setOpen` es la prop `onOpenChange`, no un setter estable de
       `useState`. `OverlayHost` la memoiza con dependencias vacías, así que
       incluirla no vuelve a suscribir el listener. */
  }, [open, setOpen]);

  // Focus trap + focus restore (mirrors the Navbar mobile-drawer pattern,
  // Navbar.tsx ~L82-128, and the CommandPalette trap). While the overlay
  // is open, Tab / Shift+Tab cycle within the panel — the body backdrop
  // and underlying page can't be reached. On close, focus is returned to
  // whatever element opened the overlay so keyboard users keep their
  // place on the page. Escape is handled by the capture-phase effect
  // above (which also stops propagation so this handler never sees it).
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Move initial focus into the panel (first focusable — the close X
    // button — so the user can immediately read the dialog with their
    // AT and dismiss it with one Tab + Enter if they wish).
    const raf = requestAnimationFrame(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = getFocusables(panel);
      const target = focusables[0] ?? panel;
      target.focus();
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = getFocusables(panel);
      if (focusables.length === 0) {
        e.preventDefault();
        panel.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      const inside = panel.contains(active);
      if (e.shiftKey) {
        if (!inside || active === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (!inside || active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  const shortcuts: { keys: ReactNode; label: string }[] = [
    {
      keys: (
        <>
          <Kbd>⌘/Ctrl</Kbd>
          <Kbd>K</Kbd>
        </>
      ),
      label: es ? "Abrir command palette" : "Open command palette",
    },
    {
      keys: <Kbd>?</Kbd>,
      label: es ? "Mostrar esta ayuda" : "Show this help",
    },
    {
      keys: <Kbd>1–6</Kbd>,
      label: es ? "Cambiar pestaña de demo" : "Switch demo tab",
    },
    {
      keys: <Kbd>F</Kbd>,
      label: es ? "Pantalla completa (demo)" : "Toggle fullscreen (demo)",
    },
    {
      keys: <Kbd>Esc</Kbd>,
      label: es ? "Cerrar" : "Close",
    },
    {
      keys: <Kbd>T</Kbd>,
      label: es ? "Cambiar tema" : "Toggle theme",
    },
    {
      keys: <Kbd>L</Kbd>,
      label: es ? "Cambiar idioma" : "Toggle language",
    },
    {
      keys: (
        <>
          <Kbd>g</Kbd>
          <Kbd>h</Kbd>
        </>
      ),
      label: es ? "Ir a Inicio" : "Go to Home",
    },
    {
      keys: (
        <>
          <Kbd>g</Kbd>
          <Kbd>f</Kbd>
        </>
      ),
      label: es ? "Ir a Características" : "Go to Features",
    },
    {
      keys: (
        <>
          <Kbd>g</Kbd>
          <Kbd>m</Kbd>
        </>
      ),
      label: es ? "Ir a Métricas" : "Go to Metrics",
    },
    {
      keys: (
        <>
          <Kbd>g</Kbd>
          <Kbd>d</Kbd>
        </>
      ),
      label: es ? "Ir a Disciplina" : "Go to Discipline",
    },
    {
      keys: (
        <>
          <Kbd>g</Kbd>
          <Kbd>s</Kbd>
        </>
      ),
      label: es ? "Ir a Seguridad" : "Go to Security",
    },
    {
      keys: (
        <>
          <Kbd>g</Kbd>
          <Kbd>p</Kbd>
        </>
      ),
      label: es ? "Ir a Precios" : "Go to Pricing",
    },
    {
      keys: (
        <>
          <Kbd>g</Kbd>
          <Kbd>e</Kbd>
        </>
      ),
      label: es ? "Ir a Demo" : "Go to Demo",
    },
    {
      keys: (
        <>
          <Kbd>g</Kbd>
          <Kbd>a</Kbd>
        </>
      ),
      label: es ? "Ir a Acerca de" : "Go to About",
    },
    {
      keys: (
        <>
          <Kbd>g</Kbd>
          <Kbd>q</Kbd>
        </>
      ),
      label: es ? "Ir a FAQ" : "Go to FAQ",
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        /* `key` obligatoria — mismo motivo que en `CommandPalette`: sin
           ella `AnimatePresence` no registra este bloque y la ventana no
           se cierra nunca. */
        <motion.div
          key="shortcuts-help"
          className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[15vh]"
          role="dialog"
          aria-modal="true"
          aria-label={es ? "Atajos de teclado" : "Keyboard shortcuts"}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Backdrop — subtle blur + fade-in */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm backdrop-saturate-150"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Panel — liquid-glass card, springy fade + scale + lift entrance */}
          <motion.div
            ref={panelRef}
            tabIndex={-1}
            className="relative w-full max-w-md tj-paper tj-paper-dense rounded-[2px] border border-[rgb(var(--divider)/0.16)] shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -4 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b ">
              <div className="min-w-0">
                <h2 className="text-sm font-medium tracking-tight text-primary">
                  {es ? "Atajos de teclado" : "Keyboard shortcuts"}
                </h2>
                <p className="text-[11px] text-tertiary mt-0.5">
                  {es
                    ? "Muévete más rápido por la app."
                    : "Move faster through the app."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={es ? "Cerrar" : "Close"}
                className="icon-btn shrink-0 w-8 h-8 rounded-md flex items-center justify-center text-tertiary hover:text-primary hover:bg-[rgb(var(--divider)/0.08)] transition-colors"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M4 4l8 8M12 4l-8 8"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            {/* List */}
            <ul className="px-2 py-2">
              {shortcuts.map((s, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-4 px-2 py-2 rounded-md hover:bg-[rgb(var(--divider)/0.03)] transition-colors"
                >
                  <span className="text-sm text-secondary">{s.label}</span>
                  <span className="flex items-center gap-1 shrink-0">
                    {s.keys}
                  </span>
                </li>
              ))}
            </ul>

            {/* Footer hint */}
            <div
              className="flex items-center justify-between gap-2 px-3 py-2 border-t  text-[11px] text-tertiary"
              aria-hidden="true"
            >
              <span className="flex items-center gap-1.5">
                <Kbd>esc</Kbd>
                <span>{es ? "cerrar" : "close"}</span>
              </span>
              <span>
                {es ? "Pulsa ? cuando quieras" : "Press ? anytime"}
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Small inline keyboard key chip — mirrors the CommandPalette styling. */
function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded border  bg-[rgb(var(--divider)/0.03)] text-[11px] font-mono text-secondary tnum">
      {children}
    </kbd>
  );
}

/* ------------------------------------------------------------------ */
/* Focus-trap helper (mirrors Navbar.tsx getFocusables)               */
/* ------------------------------------------------------------------ */

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
  "audio[controls]",
  "video[controls]",
  "details > summary:first-of-type",
].join(",");

function getFocusables(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((el) => {
    const rects = el.getClientRects();
    if (rects.length === 0) return false;
    const { width, height } = rects[0];
    return width > 0 && height > 0;
  });
}

/* `openShortcutsHelp` se mudó a `@/lib/overlays`. Importarlo desde aquí
   obligaba a `GlobalShortcuts` —presente en todas las páginas— a cargar
   esta ventana entera sólo para poder pedir su apertura. Ver el
   encabezado de ese módulo. */
