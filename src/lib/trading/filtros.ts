import type { Compliance, Direction, Trade } from "./data";

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

export function filtraOperaciones(trades: readonly Trade[], f: FiltrosDemo): Trade[] {
  return trades.filter((tr) => {
    if (f.instrument !== "all" && tr.instrument !== f.instrument) return false;
    if (f.setup !== "all" && tr.setup !== f.setup) return false;
    if (f.direction !== "all" && tr.direction !== f.direction) return false;
    if (!pasaCumplimiento(tr.compliance, f.compliance)) return false;
    return true;
  });
}
