"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n";
import { withLocale } from "@/lib/locale";
import { useTheme } from "@/lib/theme";
import { openShortcutsHelp } from "@/lib/overlays";
import { G_NAV_MAP } from "@/lib/saltos-teclado";

/**
 * Enrutador invisible de atajos globales: `T` cambia el tema, `L` el idioma,
 * `?` abre la ayuda y `g` + letra navega (tabla `G_NAV_MAP` en
 * `@/lib/saltos-teclado`). El prefijo `g` dura 1 s y muestra una pista
 * flotante.
 *
 * Se ignoran las teclas al escribir en un campo, con la paleta de /demo
 * abierta (`[cmdk-root]`), con la ayuda abierta
 * (`body[data-shortcuts-help-open]`) o con meta/ctrl/alt (son del navegador);
 * Shift sí vale, para `?`, `T` y `L` en mayúscula.
 */

const G_PREFIX_TIMEOUT = 1000; // ms que dura el prefijo `g`

export function GlobalShortcuts() {
  const { lang, toggle: toggleLang } = useLang();
  const es = lang === "es";
  const { toggleTheme } = useTheme();
  const router = useRouter();
  const gPrefixActive = useRef(false);
  const gPrefixTimer = useRef<number | null>(null);
  const [showHint, setShowHint] = useState(false);
  // La pista no entra en el árbol hasta la primera pulsación de `g`; luego se queda.
  const [pistaMontada, setPistaMontada] = useState(false);

  useEffect(() => {
    const armPrefix = () => {
      gPrefixActive.current = true;
      // Montar y mostrar en fotogramas distintos, o no habría transición.
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

      if (document.querySelector("[cmdk-root]")) return;
      if (document.body.dataset.shortcutsHelpOpen === "true") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key;

      if (
        key === "?" ||
        (e.shiftKey && (key === "/" || e.code === "Slash"))
      ) {
        e.preventDefault();
        openShortcutsHelp();
        return;
      }

      // Escape cancela el prefijo `g` sin esperar al plazo.
      if (key === "Escape" && gPrefixActive.current) {
        e.preventDefault();
        disarmPrefix();
        return;
      }

      if (key.length !== 1) return;

      const lower = key.toLowerCase();

      if (gPrefixActive.current) {
        disarmPrefix();
        const dest = G_NAV_MAP[lower];
        if (dest) {
          e.preventDefault();
          // `withLocale`: no pasa por `LocaleLink`, y `g p` debe ir a `/en/pricing` en inglés.
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
    // Visible por atributo: entrada y salida son una transición CSS (`.tj-emerge`).
    pistaMontada ? (
    <div
      className="tj-emerge fixed bottom-6 left-1/2 z-50 pointer-events-none"
      style={{ translate: "-50% 0" }}
      data-visible={showHint ? "true" : "false"}
      aria-hidden="true"
    >
          <div className="tj-paper tj-paper-dense rounded-[4px] pl-3 pr-3.5 py-1.5 flex items-center gap-2 border border-[rgb(var(--divider)/0.15)]">
            <span className="text-[12px] text-tertiary font-medium hidden sm:inline">
              {es ? "navegación" : "navigation"}
            </span>
            <span className="hidden sm:inline w-px h-3 bg-[rgb(var(--divider)/0.2)]" aria-hidden />
            <kbd className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded border border-[rgb(var(--divider)/0.15)] bg-[rgb(var(--divider)/0.06)] text-[12px] font-mono text-secondary tnum">
              g
            </kbd>
            <span className="text-[12px] text-tertiary font-medium">
              +
            </span>
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded border border-dashed border-[rgb(var(--accent-base)/0.5)] text-[12px] font-mono text-[rgb(var(--accent-base))] tnum">
              ?
            </span>
      </div>
    </div>
    ) : null
  );
}
