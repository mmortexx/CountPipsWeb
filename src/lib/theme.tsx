"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { flushSync } from "react-dom";

export type Theme = "dark" | "light";
/* Estilo único. `data-palette` es el gancho del que cuelgan los tokens y
   reglas de globals.css y siempre vale "clasico". El tipo es una unión de un
   solo miembro a propósito: un segundo estilo solo exigiría añadirlo aquí. */
export type PaletteName = "clasico";

export const PALETTES: {
  name: PaletteName;
  light: string;
  dark: string;
}[] = [
  /* Acento del estilo, con contraste WCAG AA sobre sus fondos (#131D26 sobre
     #CBD0D4: 9,61:1; #CDD9E4 sobre #0C1116: 10,27:1). */
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

/* Quién decide el tema, en este orden: 1) lo que el visitante eligió con el
 * interruptor; 2) si nunca ha elegido, lo que pida su sistema; 3) si el
 * sistema no dice nada, el papel (el material que define la marca).
 * `tj-theme` significa «lo eligió una persona»: solo la escribe el interruptor,
 * no el efecto de sincronización, o una primera visita anularía al sistema
 * para siempre. */
const CLAVE_TEMA = "tj-theme";

function temaDelSistema(): Theme {
  try {
    return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  } catch {
    return "light";
  }
}

function temaElegido(): Theme | null {
  try {
    const saved = localStorage.getItem(CLAVE_TEMA);
    return saved === "dark" || saved === "light" ? saved : null;
  } catch {
    /* Navegación privada o almacenamiento bloqueado: nadie ha elegido. */
    return null;
  }
}

function readSavedTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return temaElegido() ?? temaDelSistema();
}
function readSavedPalette(): PaletteName {
  // Siempre "clasico": se reescribe en el DOM y en localStorage para que los
  // valores antiguos guardados migren solos.
  return "clasico";
}

/**
 * Cambia el tema dentro de una transición de vista, si el navegador la tiene
 * y no se pidió menos movimiento. El DOM se toca dentro del callback
 * (atributo, clase y `flushSync`) porque el navegador fotografía la página
 * antes y después de él. `tj-tema-cambia` enciende el fundido de globals.css.
 */
function cambiarTemaConFundido(next: Theme, aplicar: () => void) {
  const doc = document as Document & {
    startViewTransition?: (cb: () => void) => { finished: Promise<void> };
  };
  const root = document.documentElement;
  const pintar = () => {
    root.dataset.theme = next;
    root.classList.toggle("dark", next === "dark");
    flushSync(aplicar);
  };
  if (
    typeof doc.startViewTransition !== "function" ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  ) {
    pintar();
    return;
  }
  root.classList.add("tj-tema-cambia");
  let vt: { finished: Promise<void> };
  try {
    vt = doc.startViewTransition(pintar);
  } catch {
    root.classList.remove("tj-tema-cambia");
    pintar();
    return;
  }
  // `finished` rechaza si el navegador salta la transición (pestaña oculta,
  // otra en curso): se limpia igual y sin promesa rechazada en consola.
  const fin = () => root.classList.remove("tj-tema-cambia");
  vt.finished.then(fin, fin);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Servidor y cliente arrancan con los valores por defecto para no romper la
  // hidratación; el script de layout.tsx ya aplicó el DOM antes del pintado.
  const [theme, setTheme] = useState<Theme>("light");
  const [palette, setPalette] = useState<PaletteName>("clasico");
  const [mounted, setMounted] = useState(false);

  // Se lee lo guardado una vez tras montar (inicialización segura con SSR).
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
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme, mounted]);

  // Mientras no haya elección, el tema sigue al sistema también en vivo.
  useEffect(() => {
    if (!mounted) return;
    let mq: MediaQueryList;
    try {
      mq = matchMedia("(prefers-color-scheme: dark)");
    } catch {
      return;
    }
    const alCambiar = () => {
      if (temaElegido() === null) setTheme(temaDelSistema());
    };
    mq.addEventListener("change", alCambiar);
    return () => mq.removeEventListener("change", alCambiar);
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.dataset.palette = palette;
    try {
      localStorage.setItem("tj-palette", palette);
    } catch {
      // Almacenamiento no disponible o lleno.
    }
  }, [palette, mounted]);

  // Solo el interruptor escribe la preferencia.
  const elegir = useCallback((t: Theme) => {
    try {
      localStorage.setItem(CLAVE_TEMA, t);
    } catch {
      /* Sin almacenamiento la elección vale para esta pestaña y ya. */
    }
    cambiarTemaConFundido(t, () => setTheme(t));
  }, []);

  const value = useMemo<ThemeCtx>(
    () => ({
      theme,
      setTheme: elegir,
      toggleTheme: () => elegir(theme === "dark" ? "light" : "dark"),
      palette,
      setPalette,
    }),
    [theme, palette, elegir]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTheme must be used within ThemeProvider");
  return c;
}
