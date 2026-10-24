import { coincide } from "@/lib/busqueda";
import type { Lang } from "@/lib/locale";
import { notaEnIdioma, type Compliance, type Direction, type Trade } from "./data";

export interface FiltrosDemo {
  instrument: string;
  setup: string;
  direction: Direction | "all";
  compliance: Compliance | "all";
}

/** El mismo criterio en Operaciones y en Analítica: cada nivel se filtra por sí mismo. */
export function pasaCumplimiento(c: Compliance, filtro: Compliance | "all"): boolean {
  return filtro === "all" || c === filtro;
}

/** El buscador de Operaciones: mira instrumento, clave del setup, su rótulo
 *  visible («Ruptura», no solo «Breakout») y las dos notas. Como el resto de
 *  buscadores del sitio (`coincide`): sin tildes ni mayúsculas, y con todas las
 *  palabras en cualquier orden. Las notas, en el idioma en que se leen: en la
 *  demo en inglés, la versión inglesa de las de la muestra. */
export function coincideOperacion(tr: Trade, consulta: string, rotuloSetup: string, lang: Lang = "es"): boolean {
  return coincide(
    consulta,
    tr.instrument,
    tr.setup,
    rotuloSetup,
    notaEnIdioma(tr.entryNote, lang),
    notaEnIdioma(tr.closeNote, lang),
  );
}

export function filtraOperaciones(trades: readonly Trade[], f: FiltrosDemo): Trade[] {
  return trades.filter((tr) => {
    if (f.instrument !== "all" && tr.instrument !== f.instrument) return false;
    if (f.setup !== "all" && tr.setup !== f.setup) return false;
    if (f.direction !== "all" && tr.direction !== f.direction) return false;
    if (!pasaCumplimiento(tr.compliance, f.compliance)) return false;
    return true;
  });
}
