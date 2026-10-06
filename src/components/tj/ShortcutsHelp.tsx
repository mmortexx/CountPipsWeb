"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useLang } from "@/lib/i18n";
import { usePresencia } from "@/hooks/use-presencia";
import { useTeclaMando } from "@/hooks/use-tecla-mando";
import { SALTOS_TECLADO } from "@/lib/saltos-teclado";

/**
 * Ventana de atajos de teclado. Componente controlado: `open` y la escucha del
 * evento de apertura viven en `OverlayHost`, para no cargar este código en el
 * arranque. Se cierra con Escape, clic en el velo o la X. Mientras está abierta
 * pone `body[data-shortcuts-help-open="true"]` para que `GlobalShortcuts`
 * suspenda sus teclas.
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
  const mando = useTeclaMando();
  const setOpen = onOpenChange;

  const panelRef = useRef<HTMLDivElement>(null);
  // Mantiene la ventana en el árbol los 180 ms de su despedida.
  const { montado, saliendo } = usePresencia(open, 180);

  // Escape se captura en fase de captura para que ningún otro manejador lo trague.
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
    // `setOpen` es la prop `onOpenChange`; `OverlayHost` la memoiza, así que no resuscribe.
  }, [open, setOpen]);

  // Atrapa el foco dentro del panel y lo devuelve a quien abrió la ventana al cerrar.
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Foco inicial en el primer enfocable (la X de cerrar).
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

  // Agrupados: el prefijo «Ir a» vive en el título del grupo y cada fila dice solo su destino.
  const grupos: {
    titulo: string;
    filas: { keys: ReactNode; label: string }[];
  }[] = [
    {
      titulo: "General",
      filas: [
        {
          keys: (
            <>
              {/* La tecla real de este teclado (ver `useTeclaMando`). */}
              <Kbd>{mando}</Kbd>
              <Kbd>G</Kbd>
            </>
          ),
          label: es ? "Abrir el glosario" : "Open the glossary",
        },
        {
          keys: <Kbd>?</Kbd>,
          label: es ? "Mostrar esta ayuda" : "Show this help",
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
          keys: <Kbd>Esc</Kbd>,
          label: es ? "Cerrar" : "Close",
        },
      ],
    },
    {
      titulo: "Demo",
      filas: [
        {
          keys: <Kbd>1–6</Kbd>,
          label: es ? "Cambiar de pestaña" : "Switch tab",
        },
        {
          keys: <Kbd>F</Kbd>,
          label: es ? "Pantalla completa" : "Toggle fullscreen",
        },
      ],
    },
    {
      titulo: es ? "Ir a" : "Go to",
      filas: SALTOS_TECLADO.map((s) => ({
        keys: (
          <>
            <Kbd>g</Kbd>
            <Kbd>{s.tecla}</Kbd>
          </>
        ),
        label: es ? s.es : s.en,
      })),
    },
  ];

  return (
    <>
      {montado && (
        /* El desmontaje diferido lo lleva `usePresencia`; su plazo y la
           duración de `tj-velo-sale` / `tj-panel-sale` deben coincidir. */
        <div
          className="tj-hoja-atajos fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[15vh]"
          role="dialog"
          aria-modal="true"
          /* El nombre accesible sale del título visible, no de un `aria-label` paralelo. */
          aria-labelledby="tj-atajos-titulo"
          aria-describedby="tj-atajos-sub"
        >
          <div
            className={`tj-no-print absolute inset-0 bg-black/50 ${
              saliendo ? "tj-velo-sale" : "tj-velo-entra"
            }`}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div
            ref={panelRef}
            tabIndex={-1}
            style={{ contain: "layout paint", willChange: "transform, opacity" }}
            /* Con tope de alto y la lista con su propio scroll: sin él el panel
               desbordaba la ventana en móvil y los últimos atajos no se leían. */
            className={`tj-hoja-atajos-hoja relative flex max-h-[calc(85svh-2rem)] w-full max-w-md flex-col tj-cristal tj-cristal--denso overflow-hidden ${
              saliendo ? "tj-panel-sale" : "tj-panel-entra"
            }`}
          >
            <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-[var(--ficha-division)]">
              <div className="min-w-0">
                <h2
                  id="tj-atajos-titulo"
                  className="t-h4 m-0 text-primary"
                >
                  {es ? "Atajos de teclado" : "Keyboard shortcuts"}
                </h2>
                <p id="tj-atajos-sub" className="m-0 mt-1 text-sm text-secondary">
                  {es
                    ? "Muévete más rápido por la app."
                    : "Move faster through the app."}
                </p>
                {/* Solo en papel: la hoja impresa necesita decir de qué marca es. */}
                <p className="tj-solo-papel hidden mt-1 text-[11px] text-tertiary">
                  CountPips
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={es ? "Cerrar" : "Close"}
                className="tj-no-print icon-btn -mr-2 -mt-1.5 shrink-0 w-9 h-9 rounded-[4px] flex items-center justify-center text-tertiary hover:text-primary hover:bg-[rgb(var(--divider)/0.08)] transition-colors"
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

            <div className="min-h-0 flex-1 overflow-y-auto custom-scroll px-2 py-2">
              {grupos.map((g, n) => (
                <section key={g.titulo} className="mt-4 first:mt-0">
                  {/* `<p>` y no `<h3>`: el estilo global de `h3` fuerza minúsculas con `!important`. */}
                  <p
                    id={`tj-atajos-g${n}`}
                    className="eyebrow px-2 pb-1.5"
                  >
                    {g.titulo}
                  </p>
                  <ul aria-labelledby={`tj-atajos-g${n}`}>
                    {g.filas.map((s, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between gap-4 px-2 py-2 rounded-[4px] hover:bg-[rgb(var(--divider)/0.03)] transition-colors"
                      >
                        <span className="text-sm text-secondary">{s.label}</span>
                        <span className="flex items-center gap-1 shrink-0">
                          {s.keys}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>

            <div
              className="tj-no-print flex items-center justify-between gap-2 px-3 py-2 border-t  text-[12px] text-tertiary"
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
          </div>
        </div>
      )}
    </>
  );
}

/** Tecla en línea. */
function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded border  bg-[rgb(var(--divider)/0.03)] text-[12px] font-mono text-secondary tnum">
      {children}
    </kbd>
  );
}

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
