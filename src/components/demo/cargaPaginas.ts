import type { ComponentType } from "react";
import type { DemoPage } from "./DemoContext";

/* El Resumen viaja con la demo (lo importa `AppDemo`); las otras cuatro páginas,
   cada una en su trozo. Juntas eran tres cuartas partes de la demo, y en un móvil
   el Resumen esperaba a que llegaran y se compilaran. `AppDemo` las pide en
   reposo nada más montarse y `DemoContext` no cambia de página hasta tener la
   nueva: nunca se ve un panel vacío. Si una falla (sin red), se vuelve a pedir
   la próxima vez. */
type Diferida = Exclude<DemoPage, "dashboard">;

const CARGAS: Record<Diferida, () => Promise<ComponentType>> = {
  trades: () => import("./pages/TradesPage").then((m) => m.TradesPage),
  detail: () => import("./pages/TradeDetailPage").then((m) => m.TradeDetailPage),
  analytics: () => import("./pages/AnalyticsPage").then((m) => m.AnalyticsPage),
  journal: () => import("./pages/JournalPage").then((m) => m.JournalPage),
};

const cargadas: Partial<Record<Diferida, ComponentType>> = {};
const enCurso = new Map<Diferida, Promise<ComponentType>>();

/** El componente de una página diferida si ya llegó; `null` si no. */
export function paginaCargada(pagina: Diferida): ComponentType | null {
  return cargadas[pagina] ?? null;
}

export function estaLista(pagina: DemoPage): boolean {
  return pagina === "dashboard" || paginaCargada(pagina) !== null;
}

export function cargaPagina(pagina: DemoPage): Promise<unknown> {
  if (pagina === "dashboard") return Promise.resolve();
  const lista = cargadas[pagina];
  if (lista) return Promise.resolve(lista);
  let pendiente = enCurso.get(pagina);
  if (!pendiente) {
    pendiente = CARGAS[pagina]().then(
      (componente) => {
        cargadas[pagina] = componente;
        enCurso.delete(pagina);
        return componente;
      },
      (error: unknown) => {
        enCurso.delete(pagina);
        throw error;
      },
    );
    enCurso.set(pagina, pendiente);
  }
  return pendiente;
}

export function precargaPaginas(): Promise<unknown> {
  return Promise.allSettled((Object.keys(CARGAS) as Diferida[]).map(cargaPagina));
}
