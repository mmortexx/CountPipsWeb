"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePresencia } from "@/hooks/use-presencia";
import { usePathname } from "next/navigation";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { useLang } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import { asset } from "@/lib/asset";
import { withLocale } from "@/lib/locale";

/**
 * Cached at module load — used by `navigate()` to switch the in-page
 * smooth-scroll to an instant jump for users with `prefers-reduced-motion:
 * reduce`.
 */
const PREFERS_REDUCED_MOTION =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * CommandPalette — Cmd+K / Ctrl+K quick-navigation palette.
 *
 * Multi-page aware: navigates between all site routes (/, /features,
 * /demo, /traders, /herramientas, /pricing, /about, /faq, etc.).
 * When the target is the current page, it falls back to a smooth in-page
 * scroll instead of a reload.
 */

/* ------------------------------------------------------------------ */
/* Page model                                                          */
/* ------------------------------------------------------------------ */

type Page = {
  path: string;
  es: string;
  en: string;
  keywords?: string;
  category?: "main" | "tools" | "profiles";
};

/**
 * The site routes. Includes feature subpages, trader profiles, and all
 * specialized tools so the command palette offers complete keyboard navigation.
 */
const PAGES: Page[] = [
  { path: "/", es: "Inicio", en: "Home", keywords: "portada landing", category: "main" },
  { path: "/features", es: "Características", en: "Features", keywords: "producto vision general bento", category: "main" },
  { path: "/features/metricas", es: "Métricas institucionales", en: "Institutional metrics", keywords: "sharpe sortino profit factor expectancy sqn ratios", category: "main" },
  { path: "/features/disciplina", es: "Disciplina y Guardián", en: "Discipline & Guardian", keywords: "guardian reglas drawdown overtrading tilt", category: "main" },
  { path: "/features/seguridad", es: "Seguridad y Local-first", en: "Security & Local-first", keywords: "sqlite cifrado privacidad sin nube local", category: "main" },
  { path: "/demo", es: "Demo interactiva", en: "Interactive demo", keywords: "app diario operaciones trades dashboard journal analytics", category: "main" },
  { path: "/traders/manual", es: "Operativa manual", en: "Manual trading", keywords: "discrecional setups playbooks price action", category: "profiles" },
  { path: "/traders/prop-firms", es: "Prop firms y cuentas fondeadas", en: "Prop firms & funded accounts", keywords: "evaluaciones drawdown consistencia funding", category: "profiles" },
  { path: "/test", es: "Test de disciplina", en: "Discipline test", keywords: "diagnostico evaluacion quiz autoevaluacion", category: "tools" },
  { path: "/herramientas", es: "Herramientas de trading", en: "Trading tools", keywords: "calculadoras utilidades gratis", category: "tools" },
  { path: "/herramientas/calculadora-de-riesgo", es: "Calculadora de tamaño de posición", en: "Position size calculator", keywords: "riesgo stop loss lotes contratos apalancamiento", category: "tools" },
  { path: "/herramientas/significancia-estadistica", es: "¿Ventaja real o buena racha?", en: "Edge significance checker", keywords: "estadistica p-value suerte muestra aciertos", category: "tools" },
  { path: "/herramientas/monte-carlo", es: "Simulador de Monte Carlo", en: "Monte Carlo simulator", keywords: "simulacion r-multiplo abanico rachas ruina", category: "tools" },
  { path: "/herramientas/proyector-de-capital", es: "Proyector de capital", en: "Equity projector", keywords: "interes compuesto curva crecimiento proyeccion", category: "tools" },
  { path: "/herramientas/coste-de-indisciplina", es: "Calculadora de coste de indisciplina", en: "Cost of indiscipline calculator", keywords: "factura errores fomo gap fuga capital", category: "tools" },
  { path: "/herramientas/reloj-de-sesiones", es: "Reloj de sesiones de mercado", en: "Market session clock", keywords: "horarios londres nueva york asia solapes forex", category: "tools" },
  { path: "/herramientas/ahorro-vs-suscripcion", es: "Escenario de ahorro vs suscripción", en: "Savings vs subscription scenario", keywords: "precio coste retorno roi comparativa", category: "tools" },
  { path: "/herramientas/impacto-de-comisiones", es: "Calculadora de comisiones y deslizamiento", en: "Commission and slippage calculator", keywords: "comisiones tarifas cme spread deslizamiento slippage breakeven friccion", category: "tools" },
  { path: "/glosario", es: "Glosario de trading", en: "Trading glossary", keywords: "terminos definiciones vocabulario conceptos", category: "main" },
  { path: "/pricing", es: "Precios y licencias", en: "Pricing & licenses", keywords: "core pro coste pago unico", category: "main" },
  { path: "/about", es: "Acerca de y Manifiesto", en: "About & Manifesto", keywords: "historia principios tecnologia changelog", category: "main" },
  { path: "/faq", es: "Preguntas frecuentes (FAQ)", en: "FAQ", keywords: "preguntas soporte contacto ayuda dudas", category: "main" },
  { path: "/beta", es: "Solicitud de acceso anticipado", en: "Early access application", keywords: "invitacion registro piloto privado", category: "profiles" },
];

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const setOpen = onOpenChange;
  const { toggle: toggleLang, lang } = useLang();
  const es = lang === "es";
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  const panelRef = useRef<HTMLDivElement>(null);
  const { montado, saliendo } = usePresencia(open, 180);

  /* ---------------- Keyboard listeners ---------------- */

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onEsc, true);
    return () => window.removeEventListener("keydown", onEsc, true);
  }, [open, setOpen]);

  /* `cmdk` no autoenfoca su input: sin esto, ⌘K abre la paleta y lo
     primero que se teclea se pierde, porque el foco se queda en lo que
     ya lo tuviera antes de abrir. */
  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector<HTMLInputElement>("[cmdk-input]")?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;

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
      window.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  /* ---------------- Navigation helpers ---------------- */

  const navigate = useCallback(
    (path: string) => {
      setOpen(false);
      const destino = withLocale(path, lang);
      if (pathname === destino) {
        requestAnimationFrame(() => {
          window.scrollTo({
            top: 0,
            behavior: PREFERS_REDUCED_MOTION ? "auto" : "smooth",
          });
        });
        return;
      }
      window.location.href = asset(destino);
    },
    [pathname, setOpen, lang]
  );

  const run = useCallback(
    (fn: () => void) => {
      fn();
      setOpen(false);
    },
    [setOpen]
  );

  const itemClass =
    "data-[selected=true]:bg-[rgb(var(--divider)/0.08)] data-[selected=true]:text-primary transition-[background-color,transform] duration-100 ease-[var(--ease-menu-in)]";

  return (
    <>
      {montado && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-[15vh]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="command-palette-title"
        >
          <h2 id="command-palette-title" className="sr-only">
            {es ? "Paleta de comandos" : "Command palette"}
          </h2>

          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/50 backdrop-blur-md backdrop-saturate-150 ${
              saliendo ? "tj-velo-sale" : "tj-velo-entra"
            }`}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Panel */}
          <div
            ref={panelRef}
            tabIndex={-1}
            style={{ contain: "layout paint", willChange: "transform, opacity" }}
            className={`relative w-full max-w-xl tj-paper tj-paper-dense rounded-[2px] border border-[rgb(var(--divider)/0.16)] shadow-2xl overflow-hidden ${
              saliendo ? "tj-panel-sale" : "tj-panel-entra"
            }`}
          >
            <Command className="bg-transparent" loop>
              <CommandInput
                placeholder={
                  es
                    ? "Escribe un comando, herramienta o página…"
                    : "Type a command, tool or page…"
                }
                aria-label={es ? "Buscar comandos" : "Search commands"}
                autoComplete="off"
                spellCheck={false}
              />
              <CommandList className="max-h-[min(60vh,380px)] custom-scroll">
                <CommandEmpty>
                  {es ? "Sin resultados." : "No results found."}
                </CommandEmpty>

                {/* Navegación Principal */}
                <CommandGroup heading={es ? "Navegación principal" : "Main navigation"}>
                  {PAGES.filter((p) => p.category === "main").map((p) => {
                    const label = es ? `Ir a ${p.es}` : `Go to ${p.en}`;
                    return (
                      <CommandItem
                        key={p.path}
                        className={itemClass}
                        value={`${label} ${p.es} ${p.en} ${p.path} ${p.keywords ?? ""} ${
                          es ? "ir a pagina" : "go to page"
                        }`}
                        onSelect={() => navigate(p.path)}
                      >
                        <NavIcon />
                        <span className="text-primary">{label}</span>
                        <CommandShortcut className="tnum text-tertiary">
                          {p.path}
                        </CommandShortcut>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>

                <CommandSeparator />

                {/* Herramientas de trading */}
                <CommandGroup heading={es ? "Calculadoras y herramientas" : "Calculators & tools"}>
                  {PAGES.filter((p) => p.category === "tools").map((p) => {
                    const label = es ? p.es : p.en;
                    return (
                      <CommandItem
                        key={p.path}
                        className={itemClass}
                        value={`${label} ${p.es} ${p.en} ${p.path} ${p.keywords ?? ""} ${
                          es ? "calculadora herramienta utilidad" : "calculator tool utility"
                        }`}
                        onSelect={() => navigate(p.path)}
                      >
                        <ToolIcon />
                        <span className="text-primary">{label}</span>
                        <CommandShortcut className="tnum text-tertiary">
                          {p.path.replace("/herramientas/", "")}
                        </CommandShortcut>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>

                <CommandSeparator />

                {/* Perfiles y acceso */}
                <CommandGroup heading={es ? "Perfiles y acceso" : "Profiles & access"}>
                  {PAGES.filter((p) => p.category === "profiles").map((p) => {
                    const label = es ? p.es : p.en;
                    return (
                      <CommandItem
                        key={p.path}
                        className={itemClass}
                        value={`${label} ${p.es} ${p.en} ${p.path} ${p.keywords ?? ""}`}
                        onSelect={() => navigate(p.path)}
                      >
                        <ProfileIcon />
                        <span className="text-primary">{label}</span>
                        <CommandShortcut className="tnum text-tertiary">
                          {p.path}
                        </CommandShortcut>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>

                <CommandSeparator />

                {/* Preferences */}
                <CommandGroup heading={es ? "Preferencias" : "Preferences"}>
                  <CommandItem
                    className={itemClass}
                    value={
                      es
                        ? "cambiar tema oscuro claro apariencia"
                        : "toggle theme dark light appearance"
                    }
                    onSelect={() => run(toggleTheme)}
                  >
                    <ThemeIcon />
                    <span className="text-primary">
                      {es ? "Cambiar tema" : "Toggle theme"}
                    </span>
                    <CommandShortcut className="text-tertiary">
                      {theme === "dark"
                        ? es
                          ? "Oscuro"
                          : "Dark"
                        : es
                          ? "Claro"
                          : "Light"}
                    </CommandShortcut>
                  </CommandItem>
                  <CommandItem
                    className={itemClass}
                    value={
                      es
                        ? "cambiar idioma español inglés"
                        : "toggle language spanish english"
                    }
                    onSelect={() => run(toggleLang)}
                  >
                    <LangIcon />
                    <span className="text-primary">
                      {es ? "Cambiar idioma" : "Toggle language"}
                    </span>
                    <CommandShortcut className="tnum text-tertiary">
                      ES / EN
                    </CommandShortcut>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>

            {/* Footer keyboard hint */}
            <div
              className="flex items-center justify-between gap-2 px-3 py-2 border-t text-[11px] text-tertiary"
              aria-hidden="true"
            >
              <span className="flex items-center gap-1.5">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
                <span>{es ? "navegar" : "navigate"}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>↵</Kbd>
                <span>{es ? "seleccionar" : "select"}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>esc</Kbd>
                <span>{es ? "cerrar" : "close"}</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---------- Small inline icons (currentColor) ---------- */

function NavIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="mr-2 text-tertiary"
    >
      <path
        d="M3 8h10M8 3l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ToolIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="mr-2 text-[rgb(var(--accent-base))]"
    >
      <path
        d="M10.4 2.3a3.4 3.4 0 0 0-4 4.4L2.6 10.5a1.3 1.3 0 0 0 1.8 1.8l3.8-3.8a3.4 3.4 0 0 0 4.4-4l-2 2-1.6-1.6 2-1.6Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="mr-2 text-tertiary"
    >
      <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2.5 13.5c0-2.5 2.5-4 5.5-4s5.5 1.5 5.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

function ThemeIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="mr-2 text-tertiary"
    >
      <circle cx="8" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M8 1.5v1.5M8 13v1.5M1.5 8h1.5M13 8h1.5M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LangIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className="mr-2 text-tertiary"
    >
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M2.5 8h11M8 2a9 9 0 013 6 9 9 0 01-3 6 9 9 0 01-3-6 9 9 0 013-6z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[18px] h-4 px-1 rounded border border-[rgb(var(--divider)/0.15)] bg-[rgb(var(--divider)/0.06)] text-[10px] font-mono text-tertiary">
      {children}
    </kbd>
  );
}

function getFocusables(el: HTMLElement): HTMLElement[] {
  const sel =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(el.querySelectorAll<HTMLElement>(sel)).filter(
    (n) => n.offsetParent !== null
  );
}
