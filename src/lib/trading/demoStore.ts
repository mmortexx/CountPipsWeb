"use client";

/*
 * Client-side persistence for the demo's "log trade" composer.
 *
 * The deterministic sample trades (`TRADES` in data.ts) are immutable and
 * shipped with every build; the user can additionally log their own trades
 * from the Dashboard composer. Those custom trades live in `localStorage`
 * under the `tj-demo-trades` key and merge into the demo tables/charts so
 * the user sees their entries side-by-side with the sample.
 *
 * Server-safe: every read/write guards `typeof window` so SSR + first paint
 * return an empty list (no hydration mismatch). The `useCustomTrades` hook
 * subscribes via `useSyncExternalStore` — React's idiomatic API for external
 * stores — so updates propagate without cascading renders.
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

/** Same-tab custom event we dispatch after every write so subscribers in the
 *  writing tab re-render (the native `storage` event only fires in OTHER tabs). */
const DEMO_TRADES_EVENT = "tj-demo-trades-changed";

/** Simplified trade shape persisted to localStorage. The full `Trade` interface
 *  has 25+ fields; we only capture what the composer form actually collects and
 *  synthesize sensible defaults for the rest when displaying in tables. */
export interface CustomTrade {
  /** Timestamp-based id — also used to detect custom trades inside a merged list. */
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
  /** ISO string for JSON-safe persistence. Convert to Date at the display layer. */
  closedAt: string;
  note: string;
}

/** Derive a trading session from the close hour — keeps the trades-table
 *  "Sesión" column populated for custom trades without asking the user. */
function sessionForHour(hour: number): Session {
  if (hour >= 8 && hour < 13) return "London";
  if (hour >= 13 && hour < 21) return "NY";
  return "Asia";
}

/** Convert a stored CustomTrade into a full Trade object so the existing
 *  table rows, charts, and metric calculators consume it without changes.
 *
 *  The composer only captures {instrument, setup, direction, entry, exit,
 *  qty, netPnl, rMultiple, compliance, closedAt, note}. From those we
 *  SYNTHESIZE sensible values for the rest so a custom trade participates
 *  fully in every chart and metric (R-histogram, MAE/MFE scatter, duration
 *  histogram, gross-vs-net column, etc.) instead of being a "blank" row
 *  that breaks the analytics page.
 *
 *  Synthesis rules:
 *   - riskUsd = |netPnl / rMultiple|  (the inverse of how netPnl was
 *     derived from risk × R in the sample generator). Falls back to 0
 *     when rMultiple is 0 or NaN.
 *   - fees = ~3 % of |netPnl|  (typical broker commission + slippage
 *     on a $100–500 P&L; matches the lower end of the sample range).
 *   - grossPnl = netPnl + fees  (consistent with data.ts: fees are a
 *     positive cost deducted from gross to get net).
 *   - plannedRr: winners use max(r + 0.5, 1.5) (you typically plan a
 *     target beyond where you actually exit), losers default to 1.5.
 *   - mae / mfe: derived from rMultiple so the MAE/MFE scatter plot
 *     gets a plausible point for every custom trade (winners dip
 *     slightly negative before running to +R; losers spike slightly
 *     positive before falling to -R).
 *   - initialStop / target: synthesized from entry, direction, and a
 *     1 % stop distance (matches the sample generator's mid-range).
 *   - durationMin: 30–120 min so the duration histogram doesn't dump
 *     every custom trade into the "<15m" bucket. */
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
  // 1 % stop distance (mid-range of the sample generator's 0.4–1.6 %).
  const stopDist = c.entry * 0.01;
  const initialStop =
    c.direction === "long"
      ? +(c.entry - stopDist).toFixed(2)
      : +(c.entry + stopDist).toFixed(2);
  const target =
    c.direction === "long"
      ? +(c.entry + stopDist * plannedRr).toFixed(2)
      : +(c.entry - stopDist * plannedRr).toFixed(2);
  // 30–120 min pseudo-duration derived deterministically from the
  // trade id so the same trade always shows the same duration.
  const durationMin = 30 + (Math.abs(c.id) % 91);
  return {
    id: c.id,
    instrument: c.instrument,
    setup: c.setup,
    direction: c.direction,
    // En UTC: las ventanas de sesión de `sessionForHour` son horarios de
    // mercado (Londres, Nueva York, Asia), no la hora del reloj de quien
    // mira la página. Ver la cabecera de `data.ts`.
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

/* ------------------------------------------------------------------ */
/* Low-level storage I/O — guards window for SSR safety.              */
/* ------------------------------------------------------------------ */

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/** Runtime type guard so corrupted / partial localStorage payloads degrade
 *  gracefully to an empty list instead of crashing the demo. */
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
    // Invalidate the in-memory snapshot cache BEFORE dispatching the event so
    // the cache is always fresh — even when no `useCustomTrades()` consumer
    // is currently mounted to receive the dispatched event. Without this,
    // a trade added from the Dashboard composer (no TradesPage mounted yet)
    // would write to localStorage but leave the cache holding the prior
    // (empty) snapshot, so a TradesPage that mounts afterwards wouldn't see
    // the new trade until the next external mutation.
    invalidateSnapshot();
    // Notify same-tab subscribers (the storage event only fires in other tabs).
    window.dispatchEvent(new CustomEvent(DEMO_TRADES_EVENT));
  } catch {
    /* storage full or unavailable — demo degrades to in-memory only. */
  }
}

function sortDesc(trades: CustomTrade[]): CustomTrade[] {
  return [...trades].sort(
    (a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime()
  );
}

/* ------------------------------------------------------------------ */
/* Public API — used by DashboardPage, TradesPage, SettingsPage.      */
/* ------------------------------------------------------------------ */

/** Read all custom trades, newest first. Returns `[]` on the server. */
export function getCustomTrades(): CustomTrade[] {
  return sortDesc(readRaw());
}

/** Persist a new trade. `id` (timestamp) is assigned automatically. */
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

/** Patch an existing trade by id. Returns the updated trade or `null` if the
 *  id isn't found. (Currently unused by the demo UI but part of the spec.) */
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

/** Delete a single trade by id. Returns `true` if a trade was actually removed. */
export function deleteTrade(id: number): boolean {
  const trades = readRaw();
  const next = trades.filter((t) => t.id !== id);
  if (next.length === trades.length) return false;
  writeRaw(next);
  return true;
}

/** Clear every custom trade, leaving the deterministic sample intact.
 *  Wired to Settings → "Cargar datos de ejemplo". */
export function resetToSample(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(DEMO_TRADES_KEY);
    // Mirror `writeRaw`'s pre-dispatch invalidation: clear the in-memory
    // snapshot cache before notifying subscribers so even consumers that
    // mount AFTER this call (and have therefore not registered a listener
    // yet) will see the cleared state on their first `getSnapshot()` call.
    invalidateSnapshot();
    window.dispatchEvent(new CustomEvent(DEMO_TRADES_EVENT));
  } catch {
    /* ignore */
  }
}

/* ------------------------------------------------------------------ */
/* React subscription hook                                            */
/* ------------------------------------------------------------------ */

const EMPTY: CustomTrade[] = [];

/**
 * Snapshot cache for `useSyncExternalStore`. The hook requires `getSnapshot`
 * to return a referentially-stable value when the underlying data hasn't
 * changed, otherwise it loops forever. We invalidate this cache on every
 * write (same-tab) and on every `storage` event (cross-tab), then re-build
 * lazily on the next `getSnapshot()` call.
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

/** React hook that returns the current list of custom trades and re-renders
 *  on any change — same-tab (custom event) or cross-tab (storage event).
 *
 *  SSR-safe: the server snapshot is the immutable `EMPTY` array, so the
 *  server-rendered HTML matches the first client paint (both `[]`); after
 *  hydration the client snapshot reads from `localStorage`. */
export function useCustomTrades(): CustomTrade[] {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => EMPTY
  );
}

/** Pure helper for components that need the merged sample+custom list
 *  without subscribing to updates (e.g. one-off renders). The reactive
 *  version is `useAllTrades()` below. */
export function mergeTrades(
  sample: Trade[],
  custom: CustomTrade[]
): Trade[] {
  const mapped = custom.map(customTradeToTrade);
  return [...sample, ...mapped].sort(
    (a, b) => b.closedAt.getTime() - a.closedAt.getTime()
  );
}

/** Convenience hook: sample TRADES + custom trades, sorted newest first.
 *  Re-renders whenever custom trades change. */
export function useAllTrades(sample: Trade[]): Trade[] {
  const custom = useCustomTrades();
  return mergeTrades(sample, custom);
}
