"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Theme = "dark" | "light";
/* ---- Estilo único: "clasico" ----------------------------------------
   El sitio tiene UN estilo. `data-palette` sobrevive como el gancho del
   que cuelgan sus tokens y sus reglas en globals.css, pero ya no es una
   elección: siempre vale "clasico".

   Antes hubo dos —"grafito", el terminal institucional del producto, y
   este— con un conmutador en la barra. Se retiró por decisión del dueño:
   una identidad no se elige desde un menú. Lo que quedaba del estilo
   anterior (el iris WebGL del fondo, el acento champagne, los titulares
   en sans mayúscula) está en el historial de git.

   El tipo se conserva como union de un solo miembro a propósito: si
   algún día vuelve a haber más de un estilo, se añade aquí y el resto
   del sistema —persistencia, anti-FOUC, `data-palette`— ya funciona. */
export type PaletteName = "clasico";

export const PALETTES: {
  name: PaletteName;
  light: string;
  dark: string;
}[] = [
  /* El swatch es el acento del estilo, verificado contra WCAG AA sobre
     sus propios fondos (grafito nardo #131D26 → 9,61:1 sobre la chapa
     #CBD0D4; la plata #CDD9E4 → 10,27:1 sobre el nocturno #0C1116). */
  { name: "clasico", light: "#131D26", dark: "#CDD9E4" },
];

interface ThemeCtx {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  palette: PaletteName;
  setPalette: (p: PaletteName) => void;
}

const Ctx = createContext<ThemeCtx | null>(null);

/* El papel es el estado natural de este estilo, así que el tema por
   defecto es el CLARO. Antes era oscuro porque el estilo anterior nacía
   de una terminal; la primera visita debe abrir en el material que
   define la marca, no en su variante nocturna. */
function readSavedTheme(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    const saved = localStorage.getItem("tj-theme");
    return saved === "dark" || saved === "light" ? saved : "light";
  } catch {
    return "light";
  }
}
function readSavedPalette(): PaletteName {
  // Estilo único. Se sigue escribiendo en el DOM y en localStorage para
  // que los visitantes con un valor antiguo guardado ("verde", "oro",
  // "grafito"…) migren solos en la próxima visita, en vez de quedarse
  // con un `data-palette` que ya no tiene bloque de tokens detrás.
  return "clasico";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Start with defaults on both server and client to avoid hydration mismatch.
  // The inline script in layout.tsx already applied the DOM attributes before
  // paint, so there's no visual flash. We sync to localStorage after mount.
  const [theme, setTheme] = useState<Theme>("light");
  const [palette, setPalette] = useState<PaletteName>("clasico");
  const [mounted, setMounted] = useState(false);

  // Read saved preferences once after mount (standard theme hydration pattern).
  // This is the canonical SSR-safe theme initialization: render default on
  // server + first client paint, then sync to stored value after hydration.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setTheme(readSavedTheme());
    setPalette(readSavedPalette());
    setMounted(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("tj-theme", theme);
    } catch {
      // Storage unavailable or quota exceeded
    }
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dataset.palette = palette;
    try {
      localStorage.setItem("tj-palette", palette);
    } catch {
      // Storage unavailable or quota exceeded
    }
  }, [palette, mounted]);

  const value = useMemo<ThemeCtx>(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme((p) => (p === "dark" ? "light" : "dark")),
      palette,
      setPalette,
    }),
    [theme, palette]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTheme must be used within ThemeProvider");
  return c;
}
