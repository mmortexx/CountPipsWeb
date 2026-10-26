"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { FiltrosDemo } from "@/lib/trading/filtros";
import { cargaPagina, estaLista } from "./cargaPaginas";

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

export type DemoFilters = FiltrosDemo;

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

  /* Una página que aún no ha llegado se pide y se cambia al tenerla; la de antes
     sigue a la vista mientras. Cada petición invalida las anteriores: dos clics
     seguidos acaban en el último aunque el primero llegue después. */
  const peticion = useRef(0);
  const cuandoEste = useCallback((pagina: DemoPage, cambia: () => void) => {
    const esta = ++peticion.current;
    if (estaLista(pagina)) {
      cambia();
      return;
    }
    cargaPagina(pagina).then(
      () => {
        if (esta === peticion.current) cambia();
      },
      (error: unknown) => console.error(`La página «${pagina}» de la demo no se pudo cargar`, error),
    );
  }, []);

  const value = useMemo<DemoCtx>(
    () => ({
      page,
      setPage: (p) =>
        cuandoEste(p, () => {
          setPageState(p);
          if (p !== "detail") setSelectedTradeId(null);
        }),
      goDetail: (tradeId) =>
        cuandoEste("detail", () => {
          setSelectedTradeId(tradeId);
          setPageState("detail");
        }),
      goBack: () =>
        cuandoEste("trades", () => {
          setPageState("trades");
          setSelectedTradeId(null);
        }),
      selectedTradeId,
      filters,
      setFilters: (f) => setFiltersState((prev) => ({ ...prev, ...f })),
      clearFilters: () => setFiltersState(DEFAULT_FILTERS),
      fullscreen,
      setFullscreen,
    }),
    [page, selectedTradeId, filters, fullscreen, cuandoEste]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDemo() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDemo must be used within DemoProvider");
  return c;
}
