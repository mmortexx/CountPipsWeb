"use client";

/*
 * Persistencia en el cliente del registro de operaciones de la demo. Las de
 * muestra (`TRADES`, data.ts) son inmutables; las que el visitante registra
 * desde el Resumen viven en `localStorage` (clave `tj-demo-trades`) y se
 * mezclan con ellas en tablas y gráficos.
 *
 * Seguro en servidor: toda lectura y escritura comprueba `typeof window`, así
 * el SSR y el primer pintado devuelven una lista vacía y no hay desajuste de
 * hidratación. `useCustomTrades` se suscribe con `useSyncExternalStore`.
 */

import { useSyncExternalStore } from "react";
import type {
  Compliance,
  Direction,
  Session,
  SetupName,
  Trade,
} from "@/lib/trading/data";

export const DEMO_TRADES_KEY = "tj-demo-trades";

/** Evento propio tras cada escritura, para que se repinte la pestaña que escribe (`storage` solo salta en las otras). */
const DEMO_TRADES_EVENT = "tj-demo-trades-changed";

/** Forma reducida de operación que se guarda: solo lo que recoge el composer;
 *  el resto de campos de `Trade` se sintetiza al mostrarla. */
export interface CustomTrade {
  /** Id basado en la marca de tiempo; también sirve para reconocer las propias en una lista mezclada. */
  id: number;
  instrument: string;
  setup: SetupName;
  direction: Direction;
  entry: number;
  exit: number;
  qty: number;
  netPnl: number;
  rMultiple: number;
  compliance: Compliance;
  /** Cadena ISO, apta para JSON; se convierte a Date al mostrarla. */
  closedAt: string;
  note: string;
}

/** Sesión según la hora de cierre, para rellenar la columna «Sesión» sin preguntar. */
function sessionForHour(hour: number): Session {
  if (hour >= 8 && hour < 13) return "London";
  if (hour >= 13 && hour < 21) return "NY";
  return "Asia";
}

/** Convierte una operación guardada en un `Trade` completo, para que tablas,
 *  gráficos y métricas la consuman sin cambios. El composer solo recoge
 *  instrumento, setup, dirección, entrada, salida, cantidad, P&L, R,
 *  cumplimiento, cierre y nota; el resto se sintetiza:
 *   - riskUsd = |netPnl / rMultiple| (0 si R es 0 o NaN).
 *   - fees = 3 % de |netPnl| y grossPnl = netPnl + fees, como en data.ts.
 *   - plannedRr: max(r + 0,5; 1,5) si gana, 1,5 si pierde.
 *   - mae y mfe derivados de R, con un valor plausible por operación.
 *   - initialStop y target desde la entrada, la dirección y un stop del 1 %.
 *   - durationMin entre 30 y 120 min, determinista por id, para no volcar
 *     todas las propias en el cubo «<15m». */
export function customTradeToTrade(c: CustomTrade): Trade {
  const closedAt = new Date(c.closedAt);
  const isWin = c.netPnl > 0;
  const r = Number.isFinite(c.rMultiple) ? c.rMultiple : 0;
  const riskUsd = r !== 0 ? Math.abs(c.netPnl / r) : 0;
  const fees = +(Math.abs(c.netPnl) * 0.03).toFixed(2);
  const grossPnl = +(c.netPnl + fees).toFixed(2);
  const plannedRr = isWin ? Math.max(r + 0.5, 1.5) : 1.5;
  const mae = isWin ? -0.2 : Math.min(r - 0.3, -0.9);
  const mfe = isWin ? r + 0.3 : 0.2;
  const stopDist = c.entry * 0.01;
  const initialStop =
    c.direction === "long"
      ? +(c.entry - stopDist).toFixed(2)
      : +(c.entry + stopDist).toFixed(2);
  const target =
    c.direction === "long"
      ? +(c.entry + stopDist * plannedRr).toFixed(2)
      : +(c.entry - stopDist * plannedRr).toFixed(2);
  const durationMin = 30 + (Math.abs(c.id) % 91);
  return {
    id: c.id,
    instrument: c.instrument,
    setup: c.setup,
    direction: c.direction,
    // En UTC: las ventanas de `sessionForHour` son horarios de mercado, no la hora de quien mira. Ver `data.ts`.
    session: sessionForHour(closedAt.getUTCHours()),
    entry: c.entry,
    exit: c.exit,
    qty: c.qty,
    grossPnl,
    fees,
    netPnl: c.netPnl,
    rMultiple: c.rMultiple,
    riskUsd,
    plannedRr,
    mae,
    mfe,
    initialStop,
    target,
    compliance: c.compliance,
    openedAt: new Date(closedAt.getTime() - durationMin * 60000),
    closedAt,
    durationMin,
    dayScore: 0,
    entryNote: c.note,
    closeNote: c.note,
  };
}

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** Guarda de tipo en ejecución: un `localStorage` corrupto o parcial degrada a lista vacía en vez de romper la demo. */
function isCustomTrade(v: unknown): v is CustomTrade {
  if (!v || typeof v !== "object") return false;
  const t = v as Record<string, unknown>;
  return (
    typeof t.id === "number" &&
    typeof t.instrument === "string" &&
    typeof t.setup === "string" &&
    (t.direction === "long" || t.direction === "short") &&
    typeof t.entry === "number" &&
    typeof t.exit === "number" &&
    typeof t.qty === "number" &&
    typeof t.netPnl === "number" &&
    typeof t.rMultiple === "number" &&
    (t.compliance === "yes" ||
      t.compliance === "partial" ||
      t.compliance === "no") &&
    typeof t.closedAt === "string" &&
    typeof t.note === "string"
  );
}

function readRaw(): CustomTrade[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(DEMO_TRADES_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCustomTrade);
  } catch {
    return [];
  }
}

function writeRaw(trades: CustomTrade[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(DEMO_TRADES_KEY, JSON.stringify(trades));
    // La caché se invalida antes del evento aunque no haya consumidores montados: si no,
    // una operación añadida desde el Resumen dejaría la caché vacía y una TradesPage
    // montada después no la vería.
    invalidateSnapshot();
    window.dispatchEvent(new CustomEvent(DEMO_TRADES_EVENT));
  } catch {
    /* Almacenamiento lleno o no disponible: la demo queda solo en memoria. */
  }
}

function sortDesc(trades: CustomTrade[]): CustomTrade[] {
  return [...trades].sort(
    (a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime()
  );
}

/** Todas las operaciones propias, de la más reciente a la más antigua; `[]` en el servidor. */
export function getCustomTrades(): CustomTrade[] {
  return sortDesc(readRaw());
}

/** Guarda una operación nueva; el `id` (marca de tiempo) se asigna solo. */
export function addTrade(trade: Omit<CustomTrade, "id">): CustomTrade {
  const full: CustomTrade = {
    ...trade,
    id: Date.now(),
  };
  const trades = readRaw();
  trades.push(full);
  writeRaw(trades);
  return full;
}

/** Modifica una operación por id; devuelve la actualizada o `null` si no existe. */
export function updateTrade(
  id: number,
  updates: Partial<Omit<CustomTrade, "id">>
): CustomTrade | null {
  const trades = readRaw();
  const idx = trades.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  const updated: CustomTrade = { ...trades[idx], ...updates };
  trades[idx] = updated;
  writeRaw(trades);
  return updated;
}

/** Borra una operación por id; devuelve `true` si de verdad se quitó. */
export function deleteTrade(id: number): boolean {
  const trades = readRaw();
  const next = trades.filter((t) => t.id !== id);
  if (next.length === trades.length) return false;
  writeRaw(next);
  return true;
}

/** Borra todas las operaciones propias y deja intacta la muestra. */
export function resetToSample(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(DEMO_TRADES_KEY);
    // Invalida antes de avisar, como `writeRaw`: los consumidores que se monten después ven el estado limpio.
    invalidateSnapshot();
    window.dispatchEvent(new CustomEvent(DEMO_TRADES_EVENT));
  } catch {
    /* sin almacenamiento: nada que borrar */
  }
}

const EMPTY: CustomTrade[] = [];

/**
 * Caché del snapshot para `useSyncExternalStore`, que exige una referencia
 * estable mientras los datos no cambien o entra en bucle. Se invalida en cada
 * escritura (misma pestaña) y en cada evento `storage` (otras), y se
 * reconstruye en el siguiente `getSnapshot()`.
 */
let snapshotCache: CustomTrade[] | null = null;

function getSnapshot(): CustomTrade[] {
  if (snapshotCache === null) {
    snapshotCache = sortDesc(readRaw());
  }
  return snapshotCache;
}

function invalidateSnapshot(): void {
  snapshotCache = null;
}

function subscribe(listener: () => void): () => void {
  if (!isBrowser()) return () => {};
  const onChange = () => {
    invalidateSnapshot();
    listener();
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key === DEMO_TRADES_KEY || e.key === null) onChange();
  };
  window.addEventListener(DEMO_TRADES_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(DEMO_TRADES_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** Lista actual de operaciones propias; repinta ante cualquier cambio, de esta
 *  pestaña (evento propio) o de otra (`storage`). El snapshot del servidor es
 *  el `EMPTY` inmutable, así que el HTML coincide con el primer pintado. */
export function useCustomTrades(): CustomTrade[] {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => EMPTY
  );
}

/** Lista mezclada de muestra y propias, sin suscribirse a cambios. La reactiva es `useAllTrades()`. */
export function mergeTrades(
  sample: Trade[],
  custom: CustomTrade[]
): Trade[] {
  const mapped = custom.map(customTradeToTrade);
  return [...sample, ...mapped].sort(
    (a, b) => b.closedAt.getTime() - a.closedAt.getTime()
  );
}

/** Muestra y operaciones propias, de la más reciente a la más antigua; repinta al cambiar las propias. */
export function useAllTrades(sample: Trade[]): Trade[] {
  const custom = useCustomTrades();
  return mergeTrades(sample, custom);
}
