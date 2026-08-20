"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n";
import { withLocale } from "@/lib/locale";
import { useTheme } from "@/lib/theme";
import { openShortcutsHelp } from "@/lib/overlays";

/**
 * GlobalShortcuts — invisible global keyboard shortcut router.
 *
 * Listens for:
 *  - `T`  → toggle theme (dark/light)
 *  - `L`  → toggle language (ES/EN)
 *  - `?` (Shift+/) → open the ShortcutsHelp overlay
 *  - `g` + letter → navigate to a page (GitHub-style two-key sequence):
 *      `g h` → /            (home)
 *      `g f` → /features    (features overview)
 *      `g m` → /features/metricas
 *      `g d` → /features/disciplina
 *      `g s` → /features/seguridad
 *      `g p` → /pricing
 *      `g e` → /demo        (e for "experiencia"/demo)
 *      `g a` → /about
 *      `g q` → /faq         (q for "questions")
 *
 * The `g` prefix sets a 1-second window; if no valid second key arrives
 * in time, the prefix expires silently. While the prefix is active, a
 * small floating hint chip ("g _") appears at the bottom-center of the
 * viewport so the user knows the next key is being captured — this
 * makes the power-user feature discoverable without a help overlay.
 *
 * All listeners are skipped when:
 *  - The user is typing in an INPUT, TEXTAREA, SELECT, or contentEditable
 *    element (so we don't hijack regular typing).
 *  - The CommandPalette is open (detected via the `[cmdk-root]` selector cmdk
 *    renders while mounted — see CommandPalette.tsx).
 *  - The ShortcutsHelp overlay itself is open (`body[data-shortcuts-help-open]`
 *    is set by ShortcutsHelp while it's mounted open).
 *  - A meta/ctrl/alt modifier is held (so we never swallow Cmd+T, Ctrl+L, etc.
 *    which the browser owns). Shift is allowed so `?` and uppercase `T`/`L`
 *    work naturally.
 */

const G_PREFIX_TIMEOUT = 1000; // ms — how long the `g` prefix stays active

const G_NAV_MAP: Record<string, string> = {
  h: "/",
  f: "/features",
  m: "/features/metricas",
  d: "/features/disciplina",
  s: "/features/seguridad",
  p: "/pricing",
  e: "/demo",
  a: "/about",
  q: "/faq",
  t: "/test",
  c: "/herramientas",
  o: "/glosario",
  b: "/beta",
  u: "/traders/manual",
  r: "/traders/prop-firms",
};

export function GlobalShortcuts() {
  const { lang, toggle: toggleLang } = useLang();
  const es = lang === "es";
  const { toggleTheme } = useTheme();
  const router = useRouter();
  const gPrefixActive = useRef(false);
  const gPrefixTimer = useRef<number | null>(null);
  // Chip visibility — separate state so the hint shows/hides without
  // re-rendering the whole component tree. Only flips true/false on
  // prefix arm/expire, not on every keystroke.
  const [showHint, setShowHint] = useState(false);
  /* La pista no entra en el árbol hasta que alguien pulsa `g` por
     primera vez, y desde entonces se queda. Es el mismo patrón que el
     cajón de navegación y por el mismo motivo: lo que se monta en el
     layout viaja en el HTML de las 155 páginas, y esto lo ve quien usa
     atajos de teclado — una minoría que, además, ya ha interactuado. */
  const [pistaMontada, setPistaMontada] = useState(false);

  useEffect(() => {
    const armPrefix = () => {
      gPrefixActive.current = true;
      /* Montar y mostrar en fotogramas distintos: en el mismo render la
         pista nacería ya visible y no habría transición que interpolar. */
      setPistaMontada(true);
      requestAnimationFrame(() => setShowHint(true));
      if (gPrefixTimer.current) window.clearTimeout(gPrefixTimer.current);
      gPrefixTimer.current = window.setTimeout(() => {
        gPrefixActive.current = false;
        setShowHint(false);
        gPrefixTimer.current = null;
      }, G_PREFIX_TIMEOUT);
    };

    const disarmPrefix = () => {
      gPrefixActive.current = false;
      setShowHint(false);
      if (gPrefixTimer.current) {
        window.clearTimeout(gPrefixTimer.current);
        gPrefixTimer.current = null;
      }
    };

    const onKey = (e: KeyboardEvent) => {
      // 1) Skip when typing in a form field or editable region.
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

      // 2) Skip when the CommandPalette is open.
      if (document.querySelector("[cmdk-root]")) return;

      // 3) Skip when the ShortcutsHelp overlay is open.
      if (document.body.dataset.shortcutsHelpOpen === "true") return;

      // 4) Never hijack browser shortcuts that involve meta/ctrl/alt.
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key;

      // `?` opens the help overlay.
      if (
        key === "?" ||
        (e.shiftKey && (key === "/" || e.code === "Slash"))
      ) {
        e.preventDefault();
        openShortcutsHelp();
        return;
      }

      // Escape cancels an active 'g' prefix explicitly — so the user
      // can disarm the two-key sequence without waiting for the 1s
      // timeout. No-op if the prefix isn't armed.
      if (key === "Escape" && gPrefixActive.current) {
        e.preventDefault();
        disarmPrefix();
        return;
      }

      // Single-character keys only.
      if (key.length !== 1) return;

      const lower = key.toLowerCase();

      // `g` prefix handling — GitHub-style two-key navigation.
      if (gPrefixActive.current) {
        disarmPrefix();
        const dest = G_NAV_MAP[lower];
        if (dest) {
          e.preventDefault();
          // `withLocale`: los atajos `g`+letra navegan directamente con
          // `router.push`, sin pasar por `LocaleLink`, así que `g p`
          // debe llevar a `/en/pricing` y no a `/pricing` si el
          // visitante está leyendo en inglés.
          router.push(withLocale(dest, lang));
        }
        return;
      }

      if (lower === "g") {
        e.preventDefault();
        armPrefix();
        return;
      }

      if (lower === "t") {
        e.preventDefault();
        toggleTheme();
      } else if (lower === "l") {
        e.preventDefault();
        toggleLang();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      if (gPrefixTimer.current) window.clearTimeout(gPrefixTimer.current);
    };
  }, [toggleTheme, toggleLang, router, lang]);

  return (
    /* Montado siempre, visible por atributo. La pista es un nodo
       diminuto y así la entrada y la salida son una transición CSS en
       vez de una biblioteca de animación en el paquete de las 155
       páginas — ver `.tj-emerge` en globals.css. */
    pistaMontada ? (
    <div
      className="tj-emerge fixed bottom-6 left-1/2 z-50 pointer-events-none"
      style={{ translate: "-50% 0" }}
      data-visible={showHint ? "true" : "false"}
      aria-hidden="true"
    >
          <div className="tj-paper tj-paper-dense rounded-full pl-3 pr-3.5 py-1.5 flex items-center gap-2 border border-[rgb(var(--divider)/0.15)] shadow-lg">
            {/* Label — tells the user what the prefix does */}
            <span className="text-[10px] uppercase tracking-[0.12em] text-tertiary font-semibold hidden sm:inline">
              {es ? "navegación" : "navigation"}
            </span>
            <span className="hidden sm:inline w-px h-3 bg-[rgb(var(--divider)/0.2)]" aria-hidden />
            {/* The 'g' key — already pressed, shown as "active" */}
            <kbd className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded border border-[rgb(var(--divider)/0.15)] bg-[rgb(var(--divider)/0.06)] text-[11px] font-mono text-secondary tnum">
              g
            </kbd>
            <span className="text-[11px] text-tertiary font-medium">
              +
            </span>
            {/* Accent placeholder for the next key */}
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded border border-dashed border-[rgb(var(--accent-base)/0.5)] text-[11px] font-mono text-[rgb(var(--accent-base))] tnum">
              ?
            </span>
      </div>
    </div>
    ) : null
  );
}
