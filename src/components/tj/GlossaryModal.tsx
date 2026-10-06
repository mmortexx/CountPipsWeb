"use client";

import * as React from "react";
import { Search, BookOpen, ChevronDown } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Eyebrow } from "@/components/tj/Eyebrow";
import { ResultadoAnunciado } from "@/components/tj/ResultadoAnunciado";
import { useLang } from "@/lib/i18n";
import { paraBuscar } from "@/lib/busqueda";
import {
  GLOSSARY,
  GLOSSARY_CATEGORIES,
  type GlossaryCategory,
  type GlossaryTerm,
} from "@/lib/trading/glossary";

/**
 * Diálogo del glosario. El término va siempre en inglés (glosario congelado);
 * solo cambian la definición y el resto del texto. Búsqueda, filtro por familia,
 * navegación con flechas/Home/End y los 3 últimos términos abiertos en
 * `localStorage` (`tj-glossary-recent`). Admite modo controlado (`open` +
 * `onOpenChange`) y disparador propio (`trigger`).
 */

const RECENT_KEY = "tj-glossary-recent";
const RECENT_MAX = 3;

/** `id` estable de cada opción del listbox, para `aria-activedescendant`.
 *  Función pura, para probarla contra todo `GLOSSARY` sin renderizar. */
export function idOpcionGlosario(term: string): string {
  // NFD y filtro de marcas combinantes por código de punto, no por un escape
  // `\uXXXX` en una regex: ese escape se degrada a literales al editar por shell.
  const sinAcentos = Array.from(term.toLowerCase().normalize("NFD"))
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      return code < 0x0300 || code > 0x036f;
    })
    .join("");
  const slug = sinAcentos.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `glosario-opcion-${slug || "x"}`;
}

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
    /* sin localStorage: solo en memoria */
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

  // Se leen al montar en el cliente, para no desajustar la hidratación.
  React.useEffect(() => {
    setRecent(readRecent());
  }, []);

  // Cada apertura parte de cero.
  React.useEffect(() => {
    if (open) {
      setQuery("");
      setActiveCat("all");
      setActiveIndex(0);
      setExpanded(new Set());
    }
  }, [open]);

  const filtered = React.useMemo(() => {
    const q = paraBuscar(query.trim());
    return GLOSSARY.filter((g) => {
      const matchesCat = activeCat === "all" || g.category === activeCat;
      const matchesQuery =
        q === "" ||
        paraBuscar(g.term).includes(q) ||
        paraBuscar(es ? g.es : g.en).includes(q);
      return matchesCat && matchesQuery;
    });
  }, [query, activeCat, es]);

  React.useEffect(() => {
    if (activeIndex >= filtered.length) {
      setActiveIndex(Math.max(0, filtered.length - 1));
    }
  }, [filtered, activeIndex]);

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
      {/* `trigger={false}`: el disparador vive fuera. `OverlayHost` es el único
          que monta el glosario; los demás piden abrirlo con `openGlossary`. */}
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

      {/* `flex flex-col` con tope de ventana en vez de la rejilla del primitivo:
          sin él la ficha desbordaba en móvil y se cortaban cabecera y pie. */}
      <DialogContent className="sm:max-w-2xl p-0 gap-0 overflow-hidden flex flex-col max-h-[calc(100svh-2rem)]">
        <DialogHeader className="px-6 pt-6 pb-4 text-left">
          <div className="flex justify-start">
            <Eyebrow>{es ? "Glosario" : "Glossary"}</Eyebrow>
          </div>
          <DialogTitle className="t-h3 mt-3 text-primary">
            {es
              ? "Términos de trading, sin traducir"
              : "Trading terms, in plain words"}
          </DialogTitle>
          <DialogDescription className="text-sm text-secondary leading-relaxed">
            {es
              ? "Los términos se mantienen en inglés aunque la app esté en español: es la lengua franca de los mercados. Solo la definición cambia de idioma."
              : "Every term the app uses, defined the way someone who trades uses it rather than the way a dictionary does."}
          </DialogDescription>
        </DialogHeader>

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
              className="tj-campo pl-9"
            />
          </div>
        </div>

        <div className="px-6 pb-4">
          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label={es ? "Filtrar por familia" : "Filter by family"}
          >
            {GLOSSARY_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                className="tj-filtro"
                onClick={() => setActiveCat(c.id)}
                aria-pressed={activeCat === c.id}
              >
                {es ? c.es : c.en}
              </button>
            ))}
          </div>

          <p className="mt-3 text-[13px] text-tertiary tnum">
            {filtered.length === 0
              ? es
                ? "0 términos"
                : "0 terms"
              : es
                ? `${filtered.length} ${filtered.length === 1 ? "término" : "términos"}`
                : `${filtered.length} ${filtered.length === 1 ? "term" : "terms"}`}
            {activeCat !== "all" || query.trim() !== ""
              ? es
                ? " · filtro aplicado"
                : " · filter applied"
              : ""}
          </p>
          <ResultadoAnunciado
            texto={
              filtered.length === 0
                ? es ? "Ningún término con ese filtro." : "No terms match that filter."
                : es
                  ? `${filtered.length} ${filtered.length === 1 ? "término" : "términos"}`
                  : `${filtered.length} ${filtered.length === 1 ? "term" : "terms"}`
            }
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto custom-scroll border-t border-[var(--ficha-division)] px-6 py-4">
          {recentTerms.length > 0 && (
            <div className="mb-4">
              <p className="m-0 mb-2 text-[13px] text-tertiary">
                {es ? "Vistos hace poco" : "Recently viewed"}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {recentTerms.map((g) => (
                  <button
                    key={`recent-${g.term}`}
                    type="button"
                    onClick={() => {
                      // Quita los filtros para que el término sea visible.
                      setQuery("");
                      setActiveCat("all");
                      const idx = GLOSSARY.findIndex((x) => x.term === g.term);
                      if (idx >= 0) {
                        setActiveIndex(idx);
                        // Espera a que el filtro se asiente.
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
                    aria-label={es ? `Abrir ${g.term}` : `Open ${g.term}`}
                    className="tj-filtro"
                    lang="en"
                  >
                    {g.term}
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
              aria-activedescendant={
                filtered.length === 0
                  ? undefined
                  : idOpcionGlosario(
                      filtered[Math.min(activeIndex, filtered.length - 1)].term
                    )
              }
              tabIndex={0}
              onKeyDown={handleListKeyDown}
              className="m-0 border-t border-[var(--ficha-division)] p-0 outline-none"
            >
              {filtered.map((g, i) => {
                const cat = GLOSSARY_CATEGORIES.find((c) => c.id === g.category);
                const isExpanded = expanded.has(g.term);
                const isActive = i === activeIndex;
                return (
                  <li
                    key={g.term}
                    id={idOpcionGlosario(g.term)}
                    role="option"
                    aria-selected={isActive}
                    data-glossary-index={i}
                    data-glossary-term={g.term}
                    /* `min-w-0` para que la definición recortada no ensanche la lista. */
                    className={[
                      "min-w-0 border-b border-[var(--ficha-division)] px-2 py-3.5 transition-colors cursor-pointer",
                      isActive
                        ? "bg-[color-mix(in_srgb,var(--ink)_4%,transparent)]"
                        : "hover:bg-[color-mix(in_srgb,var(--ink)_2.5%,transparent)]",
                    ].join(" ")}
                    onClick={() => toggleExpanded(g.term)}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <ChevronDown
                          className={[
                            "size-3.5 text-tertiary shrink-0 transition-transform duration-200",
                            isExpanded ? "rotate-180" : "",
                          ].join(" ")}
                          aria-hidden="true"
                        />
                        <h3
                          className="t-h5 m-0 text-primary truncate"
                          lang="en"
                        >
                          {g.term}
                        </h3>
                      </div>
                      {/* La familia solo dice algo cuando se ven todas. */}
                      {activeCat === "all" && (
                        <span className="shrink-0 text-[13px] text-tertiary">
                          {es ? cat?.es : cat?.en}
                        </span>
                      )}
                    </div>
                    <p
                      className={[
                        "m-0 mt-1.5 text-sm leading-[1.6]",
                        isExpanded ? "text-secondary" : "text-tertiary line-clamp-2",
                      ].join(" ")}
                    >
                      {es ? g.es : g.en}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}

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
