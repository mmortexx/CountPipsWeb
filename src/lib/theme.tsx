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

/* QUIÉN DECIDE EL TEMA, Y EN QUÉ ORDEN.
 *
 * 1. Lo que el visitante eligió con el interruptor. Manda siempre, y se
 *    guarda; si eligió papel teniendo el sistema en oscuro, es porque
 *    quería papel.
 * 2. Si no ha elegido nunca, lo que pida su sistema operativo.
 * 3. Y si su sistema no dice nada, el papel: es el estado natural de
 *    este estilo, y la primera visita debe abrir en el material que
 *    define la marca, no en su variante nocturna.
 *
 * El paso 2 es nuevo. Antes se abría en claro pasara lo que pasara, con
 * el argumento de la marca. Pero el sitio atiende a rajatabla la otra
 * preferencia del sistema —«reducir movimiento», que `globals.css`
 * respeta en todas sus reglas— y no hay motivo para tratar ésta de otro
 * modo: quien pone el sistema en oscuro suele hacerlo por la vista, no
 * por gusto, y recibía un fogonazo blanco. Con el sistema en claro —la
 * mayoría— no cambia nada.
 *
 * La clave `tj-theme` pasa a significar «esto lo eligió una persona».
 * Antes se reescribía en cada carga, así que bastaba una primera visita
 * para que el sistema no volviera a contar nunca; por eso el `setItem`
 * ya no vive en el efecto de sincronización, sino en el interruptor. */
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
  // Estilo único. Se sigue escribiendo en el DOM y en localStorage para
  // que los visitantes con un valor antiguo guardado ("verde", "oro",
  // "grafito"…) migren solos en la próxima visita, en vez de quedarse
  // con un `data-palette` que ya no tiene bloque de tokens detrás.
  return "clasico";
}

/**
 * Aplica un cambio de tema dentro de una transición de vista, si el
 * navegador la tiene y el visitante no ha pedido menos movimiento. El DOM
 * se toca DENTRO del callback —atributo y clase a mano, y el estado de
 * React vaciado con `flushSync`— porque el navegador fotografía la página
 * justo antes y justo después de ese callback; un cambio que llegara en un
 * efecto posterior quedaría fuera de la foto. La clase `tj-tema-cambia`
 * enciende el fundido en globals.css solo mientras dura.
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
  /* `finished` RECHAZA si el navegador salta la transición (pestaña
     oculta, otra transición en curso): se limpia igual y sin dejar una
     promesa rechazada en la consola. */
  const fin = () => root.classList.remove("tj-tema-cambia");
  vt.finished.then(fin, fin);
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
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme, mounted]);

  /* Mientras el visitante no haya elegido, el tema sigue a su sistema
     también EN VIVO: quien tiene el cambio automático al anochecer ve la
     página cambiar con el resto de su escritorio, sin recargar. En
     cuanto toca el interruptor, esto deja de mandar. */
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
      // Storage unavailable or quota exceeded
    }
  }, [palette, mounted]);

  /* Tocar el interruptor es lo ÚNICO que escribe la preferencia. Mientras
     nadie lo toque, la clave no existe y el sistema sigue mandando. */
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
