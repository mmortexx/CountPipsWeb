"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Direction, Compliance } from "@/lib/trading/data";

/**
 * Páginas que expone la demo: las cuatro primeras del NavigationView de la app
 * (Resumen, Operaciones, Analítica, Diario) más el detalle de una operación,
 * al que se entra desde la lista. El resto de secciones de la app quedan fuera
 * a propósito.
 */
export type DemoPage =
  | "dashboard"
  | "trades"
  | "detail"
  | "analytics"
  | "journal";

export interface DemoFilters {
  instrument: string;
  setup: string;
  direction: Direction | "all";
  compliance: Compliance | "all";
}

const DEFAULT_FILTERS: DemoFilters = {
  instrument: "all",
  setup: "all",
  direction: "all",
  compliance: "all",
};

interface DemoCtx {
  page: DemoPage;
  setPage: (p: DemoPage) => void;
  goDetail: (tradeId: number) => void;
  goBack: () => void;
  selectedTradeId: number | null;
  filters: DemoFilters;
  setFilters: (f: Partial<DemoFilters>) => void;
  clearFilters: () => void;
  fullscreen: boolean;
  setFullscreen: (v: boolean) => void;
}

const Ctx = createContext<DemoCtx | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [page, setPageState] = useState<DemoPage>("dashboard");
  const [selectedTradeId, setSelectedTradeId] = useState<number | null>(null);
  const [filters, setFiltersState] = useState<DemoFilters>(DEFAULT_FILTERS);
  const [fullscreen, setFullscreen] = useState(false);

  const value = useMemo<DemoCtx>(
    () => ({
      page,
      setPage: (p) => {
        setPageState(p);
        if (p !== "detail") setSelectedTradeId(null);
      },
      goDetail: (tradeId) => {
        setSelectedTradeId(tradeId);
        setPageState("detail");
      },
      goBack: () => {
        setPageState("trades");
        setSelectedTradeId(null);
      },
      selectedTradeId,
      filters,
      setFilters: (f) => setFiltersState((prev) => ({ ...prev, ...f })),
      clearFilters: () => setFiltersState(DEFAULT_FILTERS),
      fullscreen,
      setFullscreen,
    }),
    [page, selectedTradeId, filters, fullscreen]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDemo() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDemo must be used within DemoProvider");
  return c;
}
