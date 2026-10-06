"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePresencia } from "@/hooks/use-presencia";
import { useLang } from "@/lib/i18n";
import { useDemo } from "./DemoContext";
import { PESTANAS_NUMERADAS } from "./TopNav";
import { useTeclaMando } from "@/hooks/use-tecla-mando";

interface DemoShortcutsHintProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Ayuda de atajos dentro de la ventana de la demo, anclada abajo a la derecha
 * sobre la barra de estado (`bottom-9` deja 8 px sobre ella). Lista las
 * pestañas con 1–n (el detalle no tiene número), la paleta de comandos, `?`,
 * Esc y `/` (solo en Operaciones).
 *
 * Se abre con `?` cuando la demo está bajo el ratón o con foco: el listener de
 * captura de AppDemo lo intercepta e impide que se abra la ayuda global.
 * Abierta, pone `body[data-demo-shortcuts-open="true"]` para que los demás
 * listeners suspendan sus teclas.
 */
export function DemoShortcutsHint({ open, onClose }: DemoShortcutsHintProps) {
  const { lang } = useLang();
  const { page } = useDemo();
  const es = lang === "es";
  const mando = useTeclaMando();
  const caja = useRef<HTMLDivElement>(null);
  const cerrarRef = useRef<HTMLButtonElement>(null);
  const { montado, saliendo } = usePresencia(open, 180);

  /* Con `?` la esquina anclada puede quedar fuera de la pantalla (a 1440×900,
     94 px bajo el borde): se desplaza lo justo para enseñarla entera. */
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => {
      const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      caja.current?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: quieto ? "auto" : "smooth" });
    });
    return () => cancelAnimationFrame(id);
  }, [open]);

  /* Foco al botón de cerrar, para lectores de pantalla. Tiene que ir declarado
     después del efecto del `scrollIntoView` (React los ejecuta en orden) y con
     `preventScroll`. Al cerrar, el foco vuelve a quien lo tenía. */
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const id = requestAnimationFrame(() =>
      cerrarRef.current?.focus({ preventScroll: true })
    );
    return () => {
      cancelAnimationFrame(id);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  // Abierta, marca el body para que el interceptor de `?` y GlobalShortcuts se
  // aparten, y captura Escape antes de que lo absorban los manejadores en burbuja.
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

  // `/` solo existe donde está el buscador; en otras páginas se oculta para no mentir.
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
          <Kbd>{PESTANAS_NUMERADAS}</Kbd>
        </>
      ),
      labelEs: "Cambiar pestaña",
      labelEn: "Switch tab",
    },
    {
      keys: (
        <>
          {/* La tecla de mando del teclado real. Ver `useTeclaMando`. */}
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

  if (!montado) return null;
  return (
        <div
          ref={caja}
          className={`absolute bottom-9 right-2 z-30 w-[17rem] max-w-[calc(100%-1rem)] ${saliendo ? "tj-dm-globo-sale pointer-events-none" : "tj-dm-globo-entra"}`}
          role="dialog"
          aria-modal="false"
          aria-label={es ? "Atajos de teclado" : "Keyboard shortcuts"}
          inert={saliendo}
        >
          {/* Capa invisible que cierra la ayuda al hacer clic fuera. */}
          <div
            className="fixed inset-0 z-[-1]"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="tj-paper tj-paper-dense rounded-[2px] border border-[rgb(var(--divider)/0.16)] p-4 shadow-[var(--ficha-sombra)]">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <KeyboardIcon />
                <h3 className="text-sm font-medium text-primary leading-tight truncate">
                  {es ? "Atajos de teclado" : "Keyboard shortcuts"}
                </h3>
              </div>
              <button
                ref={cerrarRef}
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

            <div className="mt-3 pt-3 border-t border-[rgb(var(--divider)/0.1)] text-[10px] text-tertiary leading-snug">
              {es
                ? "Funcionan sobre la demo · pulsa ? cuando quieras"
                : "Work while on the demo · press ? anytime"}
            </div>
          </div>
        </div>
  );
}

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
