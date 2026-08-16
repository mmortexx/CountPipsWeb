"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLang } from "@/lib/i18n";
import { useTheme, type PaletteName } from "@/lib/theme";
import { useDemo } from "./DemoContext";
import { TRADES } from "@/lib/trading/data";

/* ------------------------------------------------------------------ */
/* DemoCommandPalette — Cmd+K palette scoped to the demo window        */
/* ------------------------------------------------------------------ */

interface DemoCommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface Command {
  id: string;
  labelEs: string;
  labelEn: string;
  /** Optional kbd hint shown at the right of the row (e.g. "1", "T"). */
  hint?: string;
  icon: ReactNode;
  section: "nav" | "actions";
  run: () => void;
}

/**
 * DemoCommandPalette — a Cmd+K (or Ctrl+K) command palette that works
 * INSIDE the demo window, separate from the global site-wide CommandPalette.
 * Lets users quickly navigate demo tabs + run demo actions:
 *
 *   NAV     — 7 destinations (Resumen, Operaciones, Detalle, Analítica,
 *             Diario, Playbook, Ajustes).
 *   ACTIONS — Cambiar idioma / Cambiar tema / Cambiar paleta / Reiniciar demo.
 *
 * Triggered by Cmd+K when the demo is "active" (hovered or focused within)
 * — the AppDemo component owns a capture-phase keydown listener that
 * intercepts Cmd+K and opens this palette (calling `setPaletteOpen(true)`),
 * preventing the global CommandPalette from also opening.
 *
 * While open, marks the modal root with the `cmdk-root` attribute (so the
 * existing GlobalShortcuts + AppDemo F-key listeners — which check
 * `[cmdk-root]` — skip their keys) and sets `body[data-demo-palette-open]`
 * so the AppDemo `?` interceptor skips too.
 *
 * Refined styling: `.tj-paper tj-paper-dense rounded-[2px] border border-[rgb(var(--divider)/0.16)]` modal with a
 * search input (magnifier icon + Esc kbd) + a list of commands. Each row
 * has an icon + label + optional kbd hint. Active row highlighted with
 * `bg-[rgb(var(--divider)/0.1)]` + an accent-color left border (`inset 2px 0 0 ...`).
 *
 * Keyboard: ArrowUp/Down to navigate, Enter to execute, Esc to close.
 * Filtering: case-insensitive substring match on label or id.
 */
export function DemoCommandPalette({ open, onClose }: DemoCommandPaletteProps) {
  const { lang, toggle: toggleLang } = useLang();
  const { theme, toggleTheme, palette, setPalette } = useTheme();
  const { setPage, goDetail, setFilters, clearFilters } = useDemo();
  const es = lang === "es";

  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  /* ---- "Open" markers (cmdk-root + body dataset) ---- */
  useEffect(() => {
    if (!open) return;
    const root = rootRef.current;
    if (root) root.setAttribute("cmdk-root", "");
    document.body.dataset.demoPaletteOpen = "true";
    return () => {
      if (root) root.removeAttribute("cmdk-root");
      delete document.body.dataset.demoPaletteOpen;
    };
  }, [open]);

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setQuery("");
      setActive(0);
    }
  }

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  const paletteOrder: PaletteName[] = useMemo(() => ["clasico"], []);

  /* ---- Command list ---- */
  const commands = useMemo<Command[]>(() => {
    const nav: Command[] = [
      {
        id: "go-dashboard",
        labelEs: "Ir a Resumen",
        labelEn: "Go to Dashboard",
        hint: "1",
        section: "nav",
        icon: <DashboardIcon />,
        run: () => setPage("dashboard"),
      },
      {
        id: "go-trades",
        labelEs: "Ir a Operaciones",
        labelEn: "Go to Trades",
        hint: "2",
        section: "nav",
        icon: <TradesIcon />,
        run: () => setPage("trades"),
      },
      {
        id: "go-detail",
        labelEs: "Ir a Detalle",
        labelEn: "Go to Trade detail",
        section: "nav",
        icon: <DetailIcon />,
        run: () => goDetail(TRADES[0].id),
      },
      {
        id: "go-analytics",
        labelEs: "Ir a Analítica",
        labelEn: "Go to Analytics",
        hint: "3",
        section: "nav",
        icon: <AnalyticsIcon />,
        run: () => setPage("analytics"),
      },
      {
        id: "go-journal",
        labelEs: "Ir a Diario",
        labelEn: "Go to Journal",
        hint: "4",
        section: "nav",
        icon: <JournalIcon />,
        run: () => setPage("journal"),
      },
    ];

    const filters: Command[] = [
      {
        id: "filter-offplan",
        labelEs: "Filtrar: Operaciones fuera de plan",
        labelEn: "Filter: Off-plan trades",
        section: "actions",
        icon: <FilterIcon />,
        run: () => {
          setFilters({ compliance: "no" });
          setPage("trades");
        },
      },
      {
        id: "filter-compliant",
        labelEs: "Filtrar: Operaciones en plan (100% disciplina)",
        labelEn: "Filter: In-plan trades (100% disciplined)",
        section: "actions",
        icon: <FilterIcon />,
        run: () => {
          setFilters({ compliance: "yes" });
          setPage("trades");
        },
      },
      {
        id: "filter-nq",
        labelEs: "Filtrar: NQ (E-mini Nasdaq-100)",
        labelEn: "Filter: NQ (E-mini Nasdaq-100)",
        section: "actions",
        icon: <FilterIcon />,
        run: () => {
          setFilters({ instrument: "NQ" });
          setPage("trades");
        },
      },
      {
        id: "filter-es",
        labelEs: "Filtrar: ES (E-mini S&P 500)",
        labelEn: "Filter: ES (E-mini S&P 500)",
        section: "actions",
        icon: <FilterIcon />,
        run: () => {
          setFilters({ instrument: "ES" });
          setPage("trades");
        },
      },
      {
        id: "clear-filters",
        labelEs: "Limpiar todos los filtros",
        labelEn: "Clear all filters",
        section: "actions",
        icon: <ResetIcon />,
        run: () => {
          clearFilters();
          setPage("trades");
        },
      },
    ];

    const actions: Command[] = [
      {
        id: "toggle-lang",
        labelEs: "Cambiar idioma",
        labelEn: "Toggle language",
        hint: "L",
        section: "actions",
        icon: <LangIcon />,
        run: toggleLang,
      },
      {
        id: "toggle-theme",
        labelEs: "Cambiar tema",
        labelEn: "Toggle theme",
        hint: "T",
        section: "actions",
        icon: theme === "dark" ? <SunIcon /> : <MoonIcon />,
        run: toggleTheme,
      },
      {
        id: "cycle-palette",
        labelEs: "Cambiar paleta",
        labelEn: "Cycle palette",
        section: "actions",
        icon: <PaletteIcon />,
        run: () => {
          const i = paletteOrder.indexOf(palette);
          const next = paletteOrder[(i + 1) % paletteOrder.length];
          setPalette(next);
        },
      },
      {
        id: "reset-demo",
        labelEs: "Reiniciar demo",
        labelEn: "Reset demo",
        section: "actions",
        icon: <ResetIcon />,
        run: () => setPage("dashboard"),
      },
    ];

    return [...nav, ...filters, ...actions];
  }, [setPage, goDetail, setFilters, clearFilters, toggleLang, toggleTheme, setPalette, palette, paletteOrder, theme]);

  /* ---- Filter ---- */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => {
      const labelEs = c.labelEs.toLowerCase();
      const labelEn = c.labelEn.toLowerCase();
      return labelEs.includes(q) || labelEn.includes(q) || c.id.includes(q);
    });
  }, [commands, query]);

  /* ---- Clamp active index when filter changes — handled at read time
     via `safeActive` (below) instead of a setState-in-effect, so the
     lint rule `react-hooks/set-state-in-effect` doesn't fire. The
     underlying `active` state can lag the filtered list by one render;
     the displayed + Enter-targeted index is always valid. */
  const safeActive =
    filtered.length === 0 ? 0 : Math.min(active, filtered.length - 1);

  /* ---- Keyboard navigation (capture phase so we beat any bubble
          listeners, including the global Cmd+K toggler). ---- */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((p) => (filtered.length ? Math.min(p + 1, filtered.length - 1) : 0));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((p) => (filtered.length ? Math.max(p - 1, 0) : 0));
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        const cmd = filtered[safeActive];
        if (cmd) {
          cmd.run();
          onClose();
        }
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, filtered, safeActive, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-40 flex items-start justify-center pt-[12vh] px-4"
          role="dialog"
          aria-modal="true"
          aria-label={es ? "Paleta de comandos" : "Command palette"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Backdrop — subtle blur + fade-in. Click anywhere to close. */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-md backdrop-saturate-150"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel — fluent acrylic depth-4 with hardware acceleration */}
          <motion.div
            ref={rootRef}
            style={{ contain: "layout paint", willChange: "transform, opacity" }}
            className="relative w-full max-w-lg tj-paper tj-paper-dense rounded-[2px] border border-[rgb(var(--divider)/0.16)] shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.985, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.985, y: -4 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Search input row — h-12 (48 px) para que el input tenga un
                área de toque cómoda en móvil (≥44 px) y el kbd de Esc no
                quede pegado al borde superior en pantallas pequeñas. */}
            <div className="flex items-center gap-2.5 px-3 h-12 border-b border-[rgb(var(--divider)/0.1)]">
              <SearchIcon />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActive(0);
                }}
                placeholder={es ? "Escribe un comando…" : "Type a command…"}
                aria-label={es ? "Buscar comando" : "Search command"}
                className="flex-1 h-full bg-transparent text-sm text-primary placeholder:text-tertiary focus:outline-none tnum"
                autoComplete="off"
                spellCheck={false}
              />
              <kbd className="bg-[rgb(var(--divider)/0.1)] border border-[rgb(var(--divider)/0.15)] rounded px-1.5 py-0.5 text-[10px] font-mono tnum text-tertiary">
                Esc
              </kbd>
            </div>

            {/* Command list */}
            <ul className="max-h-[min(50vh,320px)] overflow-y-auto custom-scroll py-1.5">
              {filtered.length === 0 ? (
                <li className="px-4 py-6 text-center text-sm text-tertiary">
                  {es ? "Sin resultados." : "No results."}
                </li>
              ) : (
                filtered.map((cmd, i) => {
                  const isActive = i === safeActive;
                  const label = es ? cmd.labelEs : cmd.labelEn;
                  return (
                    <li key={`${cmd.section}-${cmd.id}`}>
                      <button
                        type="button"
                        onMouseEnter={() => setActive(i)}
                        onClick={() => {
                          cmd.run();
                          onClose();
                        }}
                        aria-current={isActive ? "true" : undefined}
                        className={`w-full flex items-center gap-3 px-3 min-h-[44px] py-2.5 text-left transition-colors ${
                          isActive
                            ? "bg-[rgb(var(--divider)/0.1)] text-primary"
                            : "text-secondary hover:bg-[rgb(var(--divider)/0.04)]"
                        }`}
                        style={
                          isActive
                            ? { boxShadow: "inset 2px 0 0 rgb(var(--accent-base))" }
                            : undefined
                        }
                      >
                        <span
                          className={`w-5 h-5 flex items-center justify-center shrink-0 ${
                            isActive ? "text-[rgb(var(--accent-base))]" : "text-tertiary"
                          }`}
                          aria-hidden="true"
                        >
                          {cmd.icon}
                        </span>
                        <span className="flex-1 text-[13px] truncate">{label}</span>
                        {cmd.hint ? (
                          <kbd className="bg-[rgb(var(--divider)/0.1)] border border-[rgb(var(--divider)/0.15)] rounded px-1.5 py-0.5 text-[10px] font-mono tnum text-tertiary">
                            {cmd.hint}
                          </kbd>
                        ) : null}
                      </button>
                    </li>
                  );
                })
              )}
            </ul>

            {/* Footer hint */}
            <div className="flex items-center justify-between gap-2 px-3 py-2 border-t border-[rgb(var(--divider)/0.1)] text-[10px] text-tertiary">
              <span className="flex items-center gap-1.5">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
                <span>{es ? "navegar" : "navigate"}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>↵</Kbd>
                <span>{es ? "ejecutar" : "run"}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>Esc</Kbd>
                <span>{es ? "cerrar" : "close"}</span>
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* Small kbd chip (footer hints)                                      */
/* ------------------------------------------------------------------ */

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[18px] h-5 px-1.5 rounded bg-[rgb(var(--divider)/0.06)] border border-[rgb(var(--divider)/0.15)] text-[10px] font-mono tnum text-secondary">
      {children}
    </kbd>
  );
}

/* ------------------------------------------------------------------ */
/* Inline icon set (no indigo/blue; accent + P&L vars only)            */
/* ------------------------------------------------------------------ */

function svgBase(children: ReactNode) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function DashboardIcon() {
  return svgBase(<path d="M3 13h8V3H3v10zm10 8h8V3h-8v18zM3 21h8v-6H3v6z" />);
}
function TradesIcon() {
  return svgBase(<path d="M4 6h16M4 12h16M4 18h10" />);
}
function DetailIcon() {
  return svgBase(
    <>
      <path d="M4 6h16M4 12h16M4 18h10" />
      <circle cx="18.5" cy="17.5" r="2.2" />
    </>
  );
}
function AnalyticsIcon() {
  return svgBase(<path d="M4 19V5M4 19h16M8 16l3-5 3 3 4-7" />);
}
function JournalIcon() {
  return svgBase(<path d="M5 4h14v16l-7-3-7 3V4z" />);
}
function LangIcon() {
  return svgBase(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 3.5 6 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-6-3.5-9s1-6.5 3.5-9z" />
    </>
  );
}
function SunIcon() {
  return svgBase(
    <>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.6v2.4M12 19v2.4M2.6 12h2.4M19 12h2.4M5.1 5.1l1.7 1.7M17.2 17.2l1.7 1.7M18.9 5.1l-1.7 1.7M6.8 17.2l-1.7 1.7" />
    </>
  );
}
function MoonIcon() {
  return svgBase(<path d="M20.4 14.6A8.4 8.4 0 1 1 9.4 3.6a6.6 6.6 0 0 0 11 11Z" />);
}
function PaletteIcon() {
  return svgBase(
    <>
      <path d="M12 3a9 9 0 100 18c1 0 1.5-.8 1.5-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.1 0-.9.8-1.7 1.7-1.7H16a5 5 0 005-5c0-4.4-4-8.3-9-8.3z" />
      <circle cx="7.5" cy="11" r="1" />
      <circle cx="12" cy="8" r="1" />
      <circle cx="16" cy="11" r="1" />
    </>
  );
}
function ResetIcon() {
  return svgBase(<path d="M13.5 8a5.5 5.5 0 11-1.7-3.95M13.5 2v3h-3" />);
}
function FilterIcon() {
  return svgBase(<path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />);
}
function SearchIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-tertiary shrink-0"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7.5" />
      <path d="m20.5 20.5-4.3-4.3" />
    </svg>
  );
}
