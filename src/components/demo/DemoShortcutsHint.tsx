"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLang } from "@/lib/i18n";
import { useDemo } from "./DemoContext";
import { useTeclaMando } from "@/hooks/use-tecla-mando";

/* ------------------------------------------------------------------ */
/* DemoShortcutsHint — in-demo keyboard shortcuts overlay             */
/* ------------------------------------------------------------------ */

interface DemoShortcutsHintProps {
  open: boolean;
  onClose: () => void;
}

/**
 * DemoShortcutsHint — small liquid-glass popover anchored bottom-right
 * INSIDE the demo window (just above the status bar). Lists the demo's
 * keyboard shortcuts:
 *
 *   1–7     switch tabs (6 main tabs + the Trade-detail drill-down)
 *   ⌘/Ctrl K  command palette (demo-scoped)
 *   ?       this help
 *   Esc     close
 *   /       focus search (only when on the Trades page)
 *
 * Opens when the user presses `?` while the demo is "active" (hovered or
 * focused-within) — the AppDemo component owns a capture-phase keydown
 * listener that intercepts `?` and opens this overlay, preventing the
 * global ShortcutsHelp from also opening. Also opens when the keyboard
 * icon in the status bar is clicked.
 *
 * Replaces the prior static section card that lived below the demo on the
 * /demo page — the in-demo overlay is more discoverable (always reachable
 * via the keyboard icon in the status bar) and matches how Linear / VS
 * Code surface their shortcut hints.
 *
 * While open, sets `body[data-demo-shortcuts-open="true"]` so other global
 * listeners (and the AppDemo `?` interceptor) can suppress their own keys
 * while this overlay is mounted.
 *
 * Refined kbd styling: `<kbd>` elements with `bg-[rgb(var(--divider)/0.1)] border
 * border-[rgb(var(--divider)/0.15)] rounded px-1.5 py-0.5 text-xs font-mono tnum`.
 *
 * Positioning: `absolute bottom-9 right-2 z-30` — anchored to the
 * bottom-right of the demo window, just above the h-7 (28px) status bar.
 * `bottom-9` (36px) gives an 8px gap between the popover and the bar.
 */
export function DemoShortcutsHint({ open, onClose }: DemoShortcutsHintProps) {
  const { lang } = useLang();
  const { page } = useDemo();
  const es = lang === "es";
  const mando = useTeclaMando();

  // While open: mark body so the AppDemo `?` interceptor + GlobalShortcuts
  // can skip their own keys, and capture Escape on the way down so any
  // bubble-phase Escape handlers can't swallow it.
  useEffect(() => {
    if (!open) return;
    document.body.dataset.demoShortcutsOpen = "true";
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onEsc, true);
    return () => {
      delete document.body.dataset.demoShortcutsOpen;
      window.removeEventListener("keydown", onEsc, true);
    };
  }, [open, onClose]);

  // The `/` shortcut only makes sense on the Trades page (where the search
  // input lives). Hide it elsewhere so the list doesn't lie about what's
  // available.
  const showSearch = page === "trades" || page === "detail";

  const shortcuts: {
    keys: ReactNode;
    labelEs: string;
    labelEn: string;
    show?: boolean;
  }[] = [
    {
      keys: (
        <>
          <Kbd>1</Kbd>
          <Dash />
          <Kbd>7</Kbd>
        </>
      ),
      labelEs: "Cambiar pestaña",
      labelEn: "Switch tab",
    },
    {
      keys: (
        <>
          {/* La tecla del teclado que tiene delante quien lee, no la de
              un Mac por defecto. Ver `useTeclaMando`. */}
          <Kbd>{mando}</Kbd>
          <Kbd>K</Kbd>
        </>
      ),
      labelEs: "Paleta de comandos",
      labelEn: "Command palette",
    },
    {
      keys: <Kbd>?</Kbd>,
      labelEs: "Mostrar esta ayuda",
      labelEn: "Show this help",
    },
    {
      keys: <Kbd>Esc</Kbd>,
      labelEs: "Cerrar",
      labelEn: "Close",
    },
    {
      keys: <Kbd>/</Kbd>,
      labelEs: "Buscar en Operaciones",
      labelEn: "Focus search on Trades",
      show: showSearch,
    },
  ];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute bottom-9 right-2 z-30 w-[17rem] max-w-[calc(100%-1rem)]"
          role="dialog"
          aria-modal="false"
          aria-label={es ? "Atajos de teclado" : "Keyboard shortcuts"}
          initial={{ opacity: 0, y: 6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.97 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Backdrop — invisible click-catcher that closes the popover when
              the user clicks anywhere outside it. pointer-events-auto only
              on this layer; the popover itself sits above via z-30. */}
          <div
            className="fixed inset-0 z-[-1]"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="tj-paper tj-paper-dense rounded-[2px] border border-[rgb(var(--divider)/0.16)] p-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <KeyboardIcon />
                <h3 className="text-sm font-medium text-primary leading-tight truncate">
                  {es ? "Atajos de teclado" : "Keyboard shortcuts"}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={es ? "Cerrar" : "Close"}
                className="shrink-0 text-tertiary hover:text-primary transition-colors flex items-center"
              >
                <svg
                  width="12"
                  height="12"
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

            {/* Shortcuts list */}
            <ul className="space-y-2">
              {shortcuts
                .filter((s) => s.show !== false)
                .map((s, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-xs text-secondary">
                      {es ? s.labelEs : s.labelEn}
                    </span>
                    <span className="flex items-center gap-1 shrink-0">
                      {s.keys}
                    </span>
                  </li>
                ))}
            </ul>

            {/* Footer */}
            <div className="mt-3 pt-3 border-t border-[rgb(var(--divider)/0.1)] text-[10px] text-tertiary leading-snug">
              {es
                ? "Funcionan sobre la demo · pulsa ? cuando quieras"
                : "Work while on the demo · press ? anytime"}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* Small inline primitives                                            */
/* ------------------------------------------------------------------ */

/** Refined kbd keycap — `bg-[rgb(var(--divider)/0.1)] border border-[rgb(var(--divider)/0.15)] rounded
 *  px-1.5 py-0.5 text-xs font-mono tnum`. */
function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[18px] h-5 px-1.5 rounded bg-[rgb(var(--divider)/0.1)] border border-[rgb(var(--divider)/0.15)] text-[10px] font-mono tnum text-secondary">
      {children}
    </kbd>
  );
}

function Dash() {
  return <span className="text-tertiary text-[10px] mx-0.5">–</span>;
}

function KeyboardIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[rgb(var(--accent-base))] shrink-0"
      aria-hidden="true"
    >
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M7 10h0M11 10h0M15 10h0M7 14h0M11 14h0M15 14h0M18 14h0" />
    </svg>
  );
}
