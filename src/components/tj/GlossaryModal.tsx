"use client";

import * as React from "react";
import { Search, BookOpen, ChevronDown, Clock } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Chip } from "@/components/tj/Chip";
import { Eyebrow } from "@/components/tj/Eyebrow";
import { useLang } from "@/lib/i18n";
import {
  GLOSSARY,
  GLOSSARY_CATEGORIES,
  type GlossaryCategory,
  type GlossaryTerm,
} from "@/lib/trading/glossary";

/**
 * GlossaryModal — bilingual trading glossary dialog.
 *
 * Reinforces the FROZEN GLOSSARY philosophy: the `term` is always rendered in
 * English (the lingua franca of the markets) even when the UI language is
 * Spanish. Only the *definition* and the surrounding UI chrome switch language.
 *
 * Features:
 *  - Search input (filters by term name + definition, case-insensitive).
 *  - Category filter chips AND a `<select>` dropdown (both control the same
 *    active category — chips for mouse users, dropdown for keyboard/power users).
 *  - Live count of terms matching the current filter.
 *  - Collapsed cards by default; expandable via click or keyboard.
 *  - Keyboard navigation: ArrowUp/ArrowDown moves focus, Enter toggles
 *    expand, Home/End jump to first/last. Roving-tabindex style.
 *  - "Recently viewed" section at the top: the last 3 expanded terms,
 *    persisted in `localStorage` under `tj-glossary-recent`.
 *
 * Controlled mode (optional): pass `open` + `onOpenChange` to drive the dialog
 * from a parent (e.g. FAQ's "no results" link).
 *
 * Usage:
 *   <GlossaryModal />                                            // uncontrolled
 *   <GlossaryModal trigger={<button>...</button>} />             // custom trigger
 *   <GlossaryModal open={o} onOpenChange={setO} />               // controlled
 */

const RECENT_KEY = "tj-glossary-recent";
const RECENT_MAX = 3;

function readRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => typeof x === "string").slice(0, RECENT_MAX);
  } catch {
    return [];
  }
}

function writeRecent(terms: string[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      RECENT_KEY,
      JSON.stringify(terms.slice(0, RECENT_MAX))
    );
  } catch {
    /* localStorage unavailable — keep in-memory only */
  }
}

export function GlossaryModal({
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: {
  /** Disparador propio. `false` = no pintar ninguno (control externo). */
  trigger?: React.ReactNode | false;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { lang } = useLang();
  const es = lang === "es";

  // Controlled vs uncontrolled open state — lets a parent (e.g. FAQ search
  // "no results" link) drive the dialog.
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = openProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const setOpen = React.useCallback(
    (next: boolean) => {
      if (onOpenChangeProp) onOpenChangeProp(next);
      if (!isControlled) setInternalOpen(next);
    },
    [isControlled, onOpenChangeProp]
  );

  const [query, setQuery] = React.useState("");
  const [activeCat, setActiveCat] = React.useState<GlossaryCategory | "all">(
    "all"
  );
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [recent, setRecent] = React.useState<string[]>([]);

  // Load recent terms once on client mount (SSR-safe).
  React.useEffect(() => {
    setRecent(readRecent());
  }, []);

  // Reset filters each time the dialog opens (clean slate, no stale state).
  React.useEffect(() => {
    if (open) {
      setQuery("");
      setActiveCat("all");
      setActiveIndex(0);
      setExpanded(new Set());
    }
  }, [open]);

  // Filter by search (term + definition, case-insensitive) + active category.
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return GLOSSARY.filter((g) => {
      const matchesCat = activeCat === "all" || g.category === activeCat;
      const matchesQuery =
        q === "" ||
        g.term.toLowerCase().includes(q) ||
        (es ? g.es : g.en).toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });
  }, [query, activeCat, es]);

  // Clamp activeIndex whenever the filtered list shrinks.
  React.useEffect(() => {
    if (activeIndex >= filtered.length) {
      setActiveIndex(Math.max(0, filtered.length - 1));
    }
  }, [filtered, activeIndex]);

  // Resolve recent terms to full GlossaryTerm objects (preserve recency order).
  const recentTerms = React.useMemo(() => {
    return recent
      .map((term) => GLOSSARY.find((g) => g.term === term))
      .filter((g): g is GlossaryTerm => Boolean(g));
  }, [recent]);

  function trackRecent(term: string) {
    setRecent((prev) => {
      const next = [term, ...prev.filter((t) => t !== term)].slice(0, RECENT_MAX);
      writeRecent(next);
      return next;
    });
  }

  function toggleExpanded(term: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(term)) {
        next.delete(term);
      } else {
        next.add(term);
        trackRecent(term);
      }
      return next;
    });
  }

  function handleListKeyDown(e: React.KeyboardEvent<HTMLUListElement>) {
    if (filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const t = filtered[activeIndex];
      if (t) toggleExpanded(t.term);
    } else if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(filtered.length - 1);
    }
  }

  // Keep the active card scrolled into view as the user arrows around.
  const listRef = React.useRef<HTMLUListElement>(null);
  React.useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    if (!list) return;
    const active = list.querySelector<HTMLElement>(
      `[data-glossary-index="${activeIndex}"]`
    );
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* `trigger={false}` = el disparador lo pone el llamante y vive
          FUERA de este componente. Lo usa `GlossaryLauncher`, que pinta
          el enlace sin cargar el glosario y sólo trae este módulo cuando
          alguien lo abre de verdad. Sin este caso habría que renderizar
          un disparador de mentira y esconderlo. */}
      {trigger !== false && (
        <DialogTrigger asChild>
          {trigger ?? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover hover:underline"
            >
              <BookOpen className="size-4" aria-hidden="true" />
              {es ? "Glosario" : "Glossary"}
            </button>
          )}
        </DialogTrigger>
      )}

      {/* `flex flex-col` en vez de la rejilla del primitivo, y un tope de
          ventana: la ficha crecía con sus 57 términos y a 390×844 medía
          900 px dentro de 844, con 28 px cortados por arriba —la ceja y el
          titular— y otros 28 por abajo. Como el único que se desplazaba
          era el listado de dentro, esos 56 px no había forma de verlos.
          Ahora manda el alto de la ventana y el listado se queda con lo
          que sobra. */}
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden flex flex-col max-h-[calc(100svh-2rem)]">
        {/* Header — accent eyebrow + bilingual title + subtitle */}
        <DialogHeader className="px-6 pt-6 pb-4 text-left">
          <div className="flex justify-start">
            <Eyebrow>{es ? "Glosario congelado" : "Frozen glossary"}</Eyebrow>
          </div>
          <DialogTitle
            className="mt-3 font-semibold tracking-[-0.01em] text-primary"
            style={{ fontSize: "1.5rem" }}
          >
            {es
              ? "Términos de trading, sin traducir"
              : "Trading terms, untranslated"}
          </DialogTitle>
          <p className="text-sm text-secondary leading-relaxed">
            {es
              ? "Los términos se mantienen en inglés aunque la app esté en español: es la lengua franca de los mercados. Solo la definición cambia de idioma."
              : "Terms stay in English even when the app is in Spanish: it is the lingua franca of the markets. Only the definition changes language."}
          </p>
        </DialogHeader>

        {/* Search input */}
        <div className="px-6 pb-3">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-tertiary pointer-events-none"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={es ? "Buscar término…" : "Search term…"}
              aria-label={es ? "Buscar término" : "Search term"}
              className="pl-9 bg-[rgb(var(--divider)/0.03)] border-[rgb(var(--divider)/0.10)]"
            />
          </div>
        </div>

        {/* Filter row: category chips + native dropdown + live count */}
        <div className="px-6 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1.5">
              {GLOSSARY_CATEGORIES.map((c) => {
                const active = activeCat === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveCat(c.id)}
                    aria-pressed={active}
                    className="transition-transform active:scale-95"
                  >
                    <Chip variant={active ? "accent" : "neutral"}>
                      {es ? c.es : c.en}
                    </Chip>
                  </button>
                );
              })}
            </div>

            {/* Native select — alternative entry point for keyboard / power users */}
            <div className="relative ml-auto">
              <select
                value={activeCat}
                onChange={(e) =>
                  setActiveCat(e.target.value as GlossaryCategory | "all")
                }
                aria-label={es ? "Filtrar por categoría" : "Filter by category"}
                className="appearance-none bg-[rgb(var(--divider)/0.05)] border border-[rgb(var(--divider)/0.10)] rounded-[2px] h-9 pl-3 pr-8 text-sm text-secondary outline-none transition-colors hover:border-[rgb(var(--divider)/0.25)] focus-visible:border-[rgb(var(--divider)/0.30)] cursor-pointer"
              >
                {GLOSSARY_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id} className="bg-background text-primary">
                    {es ? c.es : c.en}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 size-4 text-tertiary"
                aria-hidden="true"
              />
            </div>
          </div>

          {/* Live count of matching terms */}
          <p className="mt-2.5 text-xs text-tertiary tnum">
            {filtered.length === 0
              ? es
                ? "0 términos"
                : "0 terms"
              : es
                ? `${filtered.length} ${filtered.length === 1 ? "término" : "términos"}`
                : `${filtered.length} ${filtered.length === 1 ? "term" : "terms"}`}
            {activeCat !== "all" || query.trim() !== ""
              ? es
                ? " · filtra aplicada"
                : " · filter applied"
              : ""}
          </p>
        </div>

        {/* Hairline divider between controls and list */}
        <div className="divider-grad" />

        {/* Scrollable list of term cards */}
        <div className="min-h-0 flex-1 overflow-y-auto custom-scroll px-6 py-4">
          {/* Recently viewed — last 3 expanded terms, persisted in localStorage */}
          {recentTerms.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center gap-1.5 mb-2 text-[12px] uppercase tracking-[0.12em] text-tertiary font-semibold">
                <Clock className="size-3" aria-hidden="true" />
                {es ? "Vistos recientemente" : "Recently viewed"}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {recentTerms.map((g) => (
                  <button
                    key={`recent-${g.term}`}
                    type="button"
                    onClick={() => {
                      // Reset filters so the term is visible, then expand it.
                      setQuery("");
                      setActiveCat("all");
                      const idx = GLOSSARY.findIndex((x) => x.term === g.term);
                      if (idx >= 0) {
                        setActiveIndex(idx);
                        // Ensure visible next tick after filter settles.
                        requestAnimationFrame(() => {
                          const list = listRef.current;
                          if (!list) return;
                          const el = list.querySelector<HTMLElement>(
                            `[data-glossary-term="${CSS.escape(g.term)}"]`
                          );
                          el?.scrollIntoView({ block: "center" });
                        });
                      }
                      trackRecent(g.term);
                      setExpanded((prev) => new Set(prev).add(g.term));
                    }}
                    className="transition-transform active:scale-95"
                    aria-label={es ? `Abrir ${g.term}` : `Open ${g.term}`}
                  >
                    <Chip variant="accent">{g.term}</Chip>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-tertiary">
                {es
                  ? "Sin resultados para tu búsqueda."
                  : "No results for your search."}
              </p>
            </div>
          ) : (
            <ul
              ref={listRef}
              role="listbox"
              aria-label={es ? "Términos del glosario" : "Glossary terms"}
              tabIndex={0}
              onKeyDown={handleListKeyDown}
              className="grid gap-2.5 outline-none"
            >
              {filtered.map((g, i) => {
                const cat = GLOSSARY_CATEGORIES.find((c) => c.id === g.category);
                const isExpanded = expanded.has(g.term);
                const isActive = i === activeIndex;
                return (
                  <li
                    key={g.term}
                    role="option"
                    aria-selected={isActive}
                    data-glossary-index={i}
                    data-glossary-term={g.term}
                    className={[
                      /* `min-w-0`: la ficha es item de una rejilla, y un
                         item de rejilla arranca con `min-width: auto`, o
                         sea que no baja de lo que mide su contenido. La
                         definicion lleva `truncate` —que es `nowrap`—, asi
                         que su contenido es la FRASE ENTERA y la columna
                         crecia con ella. Medido: 1.868 px de lista dentro
                         de una caja de 670, 1.198 escondidos de lado, y la
                         definicion cortada a media palabra contra el canto
                         en vez de con sus puntos suspensivos. */
                      "tj-paper tj-paper-dense min-w-0 rounded-[2px] border border-[rgb(var(--divider)/0.16)] p-4 transition-[border-color,box-shadow,background-color] cursor-pointer",
                      isActive
                        ? "border-[rgb(var(--divider)/0.30)] ring-1 ring-[rgb(var(--divider)/0.20)] bg-[rgb(var(--divider)/0.06)] shadow-[0_0_28px_-8px_rgb(var(--divider)/0.18)]"
                        : "hover:border-[rgb(var(--divider)/0.25)]",
                    ].join(" ")}
                    onClick={() => toggleExpanded(g.term)}
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {/* Expansion chevron — rotates when expanded */}
                        <ChevronDown
                          className={[
                            "size-3.5 text-tertiary shrink-0 transition-transform duration-200",
                            isExpanded ? "rotate-180" : "",
                          ].join(" ")}
                          aria-hidden="true"
                        />
                        {/* Term name — always English, accent, bold (frozen glossary) */}
                        <h3
                          className="text-base font-semibold text-primary tracking-tight truncate"
                          lang="en"
                        >
                          {g.term}
                        </h3>
                      </div>
                      {/* Category chip — bilingual label */}
                      <Chip variant="neutral">{es ? cat?.es : cat?.en}</Chip>
                    </div>
                    {/* Definition — in the active UI language.
                        Collapsed shows a single-line preview; expanded shows full text. */}
                    <p
                      className={[
                        "mt-2 text-sm leading-relaxed",
                        isExpanded ? "text-secondary" : "text-tertiary truncate",
                      ].join(" ")}
                    >
                      {es ? g.es : g.en}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Keyboard hint footer */}
          <p className="mt-4 text-[12px] text-tertiary text-center">
            {es
              ? "Usa ↑ ↓ para navegar y Enter para expandir."
              : "Use ↑ ↓ to navigate and Enter to expand."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
