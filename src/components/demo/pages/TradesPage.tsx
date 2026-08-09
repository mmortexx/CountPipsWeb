"use client";

import { memo, useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLang } from "@/lib/i18n";
import {
  TRADES,
  computeMetrics,
  INSTRUMENTS,
  SETUP_NAMES,
} from "@/lib/trading/data";
import {
  customTradeToTrade,
  deleteTrade,
  useCustomTrades,
} from "@/lib/trading/demoStore";
import { useToast } from "@/hooks/use-toast";
import {
  fmtNum,
  fmtPrice,
  fmtDate,
  fmtDuration,
} from "@/lib/trading/format";
import { Eyebrow } from "@/components/tj/Eyebrow";
import { Chip } from "@/components/tj/Chip";
import { Money } from "@/components/tj/Money";
import { CountUp } from "@/components/tj/CountUp";
import { Reveal } from "@/components/tj/Reveal";
import { AssetMark } from "@/components/demo/AssetMark";
import { useDemo } from "@/components/demo/DemoContext";

/* ============================================================
 * Tablas estáticas — la clase de activo ya no se codifica por color (ver
 * AssetMark), sólo queda su etiqueta y la de plaza y decimales.
 * ============================================================ */

const DECIMALS: Record<string, number> = Object.fromEntries(
  INSTRUMENTS.map((i) => [i.symbol, i.decimals])
);

const ASSET_LABEL: Record<string, { es: string; en: string }> = {
  crypto: { es: "Cripto", en: "Crypto" },
  forex: { es: "Forex", en: "Forex" },
  stock: { es: "Acciones", en: "Stock" },
  futures: { es: "Futuros", en: "Futures" },
};

/** La app escribe la plaza con su nombre completo y traducido ("Nueva
 *  York", "Londres", "Asia"), no con la abreviatura interna del dato. */
const SESSION_LABEL: Record<string, { es: string; en: string }> = {
  London: { es: "Londres", en: "London" },
  NY: { es: "Nueva York", en: "New York" },
  Asia: { es: "Asia", en: "Asia" },
};

const PAGE_SIZE = 20;

type FilterGroup =
  | "instrument"
  | "direction"
  | "compliance"
  | "outcome"
  | "setup";

/** Sortable column keys — mirrors the five GhostButtonStyle sort headers
 *  in TradesPage.xaml (symbol / duration / date / pnl / r). */
type SortKey = "symbol" | "duration" | "date" | "pnl" | "r";
type SortDir = "asc" | "desc";

/* `SortKey` sigue vivo (lo usan el estado y `handleSort`); la tabla
   `SORT_KEYS` con los rótulos y alineaciones de las cinco cabeceras, no:
   las cabeceras se escriben en el JSX. Tenerla aquí era una segunda fuente
   de la verdad esperando a discrepar de la primera. */

/* ============================================================
 * R chip — pill background tinted by sign, mirrors the XAML
 * PnlPositiveSoftBrush / PnlNegativeSoftBrush chips for the R
 * column (TradesPage.xaml lines 652-673).
 * ============================================================ */
function RChip({ value, lang }: { value: number; lang: "es" | "en" }) {
  const tone = value > 0 ? "pos" : value < 0 ? "neg" : "neutral";
  if (tone === "neutral") {
    return (
      <span className="text-tertiary tnum text-sm">—</span>
    );
  }
  const cls =
    tone === "pos"
      ? "bg-pnl-pos/15 text-pnl-pos border-pnl-pos/30 shadow-[inset_0_0_0_1px_rgb(var(--pnl-pos)/0.08)]"
      : "bg-pnl-neg/15 text-pnl-neg border-pnl-neg/30 shadow-[inset_0_0_0_1px_rgb(var(--pnl-neg)/0.08)]";
  return (
    <span className={`pill tnum text-[11px] font-semibold border ${cls}`}>
      {value > 0 ? "+" : ""}
      {fmtNum(value, lang, 2)}R
    </span>
  );
}

/* ============================================================
 * Sort header button — ghost-style header cell that mirrors
 * TradesPage.xaml's GhostButtonStyle sort columns. Shows the
 * column caption + an ▲/▼ glyph when active.
 * ============================================================ */
function SortHeader({
  active,
  dir,
  align,
  onClick,
  children,
}: {
  active: boolean;
  dir: SortDir;
  align: "left" | "right";
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 -mx-1.5 rounded-sm group/sort transition-colors hover:bg-[rgb(var(--divider)/0.04)] ${
        align === "right" ? "flex-row-reverse ml-auto" : ""
      }`}
    >
      <span
        className={`text-[10px] uppercase tracking-[0.15em] whitespace-nowrap transition-colors ${
          active ? "text-primary font-semibold" : "text-tertiary group-hover/sort:text-secondary"
        }`}
      >
        {children}
      </span>
      {/* Sort arrow — animate the swap between ascending / descending
          with a rotate so the user feels the column toggle. */}
      <motion.span
        key={active ? `${dir}` : "idle"}
        initial={{ opacity: 0, scale: 0.6, rotate: active && dir === "asc" ? -90 : 0 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        className={`text-[9px] leading-none transition-colors ${
          active ? "text-primary" : "text-tertiary/50 group-hover/sort:text-secondary"
        }`}
        aria-hidden="true"
      >
        {active ? (dir === "asc" ? "▲" : "▼") : "⇅"}
      </motion.span>
    </button>
  );
}

/* ============================================================
 * Trade row — memoized. Mirrors TradesPage.xaml's ItemTemplate
 * (lines 544-700): checkbox + direction chip in col 0, asset
 * dot + mono symbol + behaviour badges in col 1, setup, session,
 * entry→exit, duration, closed date, P&L (MoneyText), R chip,
 * compliance chip. Preserves the demo's custom-trade delete
 * affordance (sample trades are immutable).
 * ============================================================ */
const TradeRow = memo(function TradeRow({
  trade,
  index,
  isCustom,
  goDetail,
  onDelete,
  confirmingId,
  setConfirmingId,
  filterSig,
  selected,
  onToggleSelect,
}: {
  trade: (typeof TRADES)[number];
  index: number;
  isCustom: boolean;
  goDetail: (tradeId: number) => void;
  onDelete: (tradeId: number) => void;
  confirmingId: number | null;
  setConfirmingId: (id: number | null) => void;
  filterSig: string;
  selected: boolean;
  onToggleSelect: (tradeId: number) => void;
}) {
  const { t, lang } = useLang();
  const decimals = DECIMALS[trade.instrument] ?? 2;
  const inst = INSTRUMENTS.find((x) => x.symbol === trade.instrument);
  const assetLabel =
    ASSET_LABEL[inst?.assetClass ?? "stock"]?.[lang] ?? "";
  const isConfirming = confirmingId === trade.id;

  return (
    <motion.tr
      key={trade.id}
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{
        delay: Math.min(index * 0.025, 0.4),
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1],
      }}
      onClick={() => !isConfirming && goDetail(trade.id)}
      className={`group relative cursor-pointer border-b border-[rgb(var(--divider)/0.06)] last:border-b-0 transition-[background-color,box-shadow] duration-150 ${
        selected ? "bg-[rgb(var(--accent-base)/0.08)]" : "even:bg-[rgb(var(--divider)/0.02)] hover:bg-[rgb(var(--divider)/0.06)]"
      } hover:shadow-[inset_2px_0_0_0_rgb(var(--accent-base))] ${
        isConfirming ? "bg-pnl-neg/10" : ""
      }`}
    >
      {/* Col 0 — checkbox + direction chip (mirrors TradesPage.xaml col 0).
          Sticky left-0 on mobile so the direction chip + selection
          checkbox stay anchored while scrolling the wide table. The
          explicit bg-[rgb(var(--bg))] is opaque so scrolled cells don't
          bleed through; the row's alternating/hover bg is layered on top
          via the inner div so the striping still reads. */}
      <td className="pl-5 pr-3 py-2.5 whitespace-nowrap sticky left-0 z-10 bg-[rgb(var(--bg))]">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={selected}
            onClick={(e) => e.stopPropagation()}
            onChange={() => onToggleSelect(trade.id)}
            aria-label={`${trade.instrument} ${t("selectTrade")}`}
            className="h-3.5 w-3.5 rounded-[2px] border-[rgb(var(--divider)/0.2)] bg-[rgb(var(--divider)/0.05)] accent-[rgb(var(--accent-base))] cursor-pointer"
          />
          <Chip variant={trade.direction === "long" ? "pos" : "neg"}>
            {trade.direction === "long" ? t("long") : t("short")}
          </Chip>
        </div>
      </td>

      {/* Col 1 — marca de clase de activo + símbolo (mono) + distintivo. */}
      <td className="px-3 py-2.5 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <AssetMark assetClass={inst?.assetClass} title={assetLabel} />
          <span className="font-medium text-primary text-sm tnum">
            {trade.instrument}
          </span>
          {isCustom && (
            <span
              className="text-[9px] uppercase tracking-[0.15em] font-semibold text-primary border border-[rgb(var(--divider)/0.2)] rounded-sm px-1 py-px"
              title={t("customTradeBadge")}
            >
              {t("customTradeBadge")}
            </span>
          )}
        </div>
      </td>

      {/* Col 2 — setup. */}
      <td className="px-3 py-2.5 whitespace-nowrap text-secondary text-sm max-w-[220px] truncate">
        {trade.setup}
      </td>

      {/* Col 3 — session. */}
      <td className="px-3 py-2.5 whitespace-nowrap text-tertiary text-xs">
        {SESSION_LABEL[trade.session]?.[lang] ?? trade.session}
      </td>

      {/* Col 4 — entry → exit. */}
      <td className="px-3 py-2.5 whitespace-nowrap tnum text-secondary text-xs">
        {fmtPrice(trade.entry, decimals, lang)}
        <span className="text-tertiary mx-1.5" aria-hidden="true">→</span>
        {fmtPrice(trade.exit, decimals, lang)}
      </td>

      {/* Col 5 — duration. */}
      <td className="px-3 py-2.5 whitespace-nowrap tnum text-secondary text-xs">
        {trade.durationMin > 0
          ? fmtDuration(trade.durationMin, lang)
          : "—"}
      </td>

      {/* Col 6 — closed date. */}
      <td className="px-3 py-2.5 whitespace-nowrap text-tertiary tnum text-xs">
        {fmtDate(trade.closedAt, lang)}
      </td>

      {/* Col 7 — P&L (MoneyText). */}
      <td className="px-3 py-2.5 whitespace-nowrap text-right">
        <PnlCell value={trade.netPnl} filterSig={filterSig} />
      </td>

      {/* Col 8 — R chip (pill). */}
      <td className="px-3 py-2.5 whitespace-nowrap text-right">
        <RChip value={trade.rMultiple} lang={lang} />
      </td>

      {/* Col 9 — compliance chip + delete affordance for custom trades. */}
      <td className="pl-3 pr-4 py-2.5 whitespace-nowrap">
        <div className="flex items-center justify-end gap-1.5">
          {trade.compliance === "yes" && (
            <Chip variant="pos">{t("yes")}</Chip>
          )}
          {trade.compliance === "partial" && (
            <Chip variant="warn">{t("partial")}</Chip>
          )}
          {trade.compliance === "no" && (
            <Chip variant="neg">{t("no")}</Chip>
          )}

          {isCustom &&
            (isConfirming ? (
              <div
                className="flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-[11px] text-tertiary mr-0.5 whitespace-nowrap">
                  {t("deleteConfirm")}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(trade.id);
                    setConfirmingId(null);
                  }}
                  aria-label={t("confirmDelete")}
                  className="h-6 px-2 rounded text-[11px] font-semibold bg-pnl-neg/20 text-pnl-neg border border-pnl-neg/40 hover:bg-pnl-neg/30 transition-colors"
                >
                  {t("confirmDelete")}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmingId(null);
                  }}
                  aria-label={t("cancelDelete")}
                  className="h-6 px-2 rounded text-[11px] font-medium bg-[rgb(var(--divider)/0.05)] text-tertiary border border-[rgb(var(--divider)/0.1)] hover:bg-[rgb(var(--divider)/0.08)] hover:text-secondary transition-colors"
                >
                  {t("cancelDelete")}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmingId(trade.id);
                }}
                aria-label={t("deleteTrade")}
                title={t("deleteTrade")}
                className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100 transition-opacity duration-150 h-6 w-6 grid place-items-center rounded text-tertiary hover:text-pnl-neg hover:bg-pnl-neg/15 border border-transparent hover:border-pnl-neg/30"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6" />
                </svg>
              </button>
            ))}
        </div>
      </td>
    </motion.tr>
  );
});

/** P&L cell — keyed to the current filter signature so it re-mounts (and
 *  plays a brief color-flash animation) every time the user applies or
 *  clears a filter. */
const PnlCell = memo(function PnlCell({
  value,
  filterSig,
}: {
  value: number;
  filterSig: string;
}) {
  const tone = value > 0 ? "pos" : value < 0 ? "neg" : "neutral";
  const colorTriple =
    tone === "pos"
      ? "var(--pnl-pos)"
      : tone === "neg"
      ? "var(--pnl-neg)"
      : "156 163 175";
  return (
    <span className="relative inline-block">
      <motion.span
        key={`flash-${filterSig}-${value}`}
        aria-hidden
        className="pointer-events-none absolute -inset-x-2 -inset-y-0.5 rounded-md"
        style={{ backgroundColor: `rgb(${colorTriple})` }}
        initial={{ opacity: 0.28 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.span
        key={value}
        initial={{ opacity: 0.4, y: -3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="relative inline-block"
      >
        <Money
          value={value}
          colorizeSign
          sign
          className="text-sm font-semibold"
        />
      </motion.span>
    </span>
  );
});

/* ============================================================
 * Chip de filtro — réplica de FilterChipStyle (Styles.xaml
 * L380-430), que es un RadioButton re-plantillado:
 *   · En reposo: velo tenue, texto secundario, SIN borde,
 *     esquinas de píldora (CornerRadius 15) y padding 13,5.
 *   · Seleccionado: fondo BrandAccentSoftBrush (el acento al
 *     16 %) y texto AccentTextFillColorPrimaryBrush.
 * La demo pintaba el seleccionado con una píldora BLANCA con
 * borde — el chip activo quedaba gris en una app cuyo estado
 * activo es siempre del color de la paleta.
 * ============================================================ */
function FilterChip({
  active,
  onClick,
  children,
  group,
  label,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
  group: FilterGroup;
  label: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      whileTap={{ scale: 0.96 }}
      className="relative inline-flex items-center"
    >
      {/* El fondo del activo se desliza entre chips del mismo grupo
          (layoutId compartido) — el equivalente animado del cambio de
          VisualState del RadioButton. */}
      {active && (
        <motion.span
          layoutId={`trade-filter-${group}`}
          className="pointer-events-none absolute inset-0 rounded-full bg-[rgb(var(--accent-base)/0.16)]"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <span
        className={`relative inline-flex items-center rounded-full px-3 py-[5px] text-[12px] whitespace-nowrap transition-colors ${
          active
            ? "text-[rgb(var(--accent-hover))] font-medium"
            : "text-secondary bg-[rgb(var(--divider)/0.05)] hover:bg-[rgb(var(--divider)/0.09)] hover:text-primary"
        }`}
      >
        {children}
      </span>
    </motion.button>
  );
}

/* ============================================================
 * KPI strip cell — loose on canvas, no box. Mirrors the XAML
 * `VerticalHairlineStyle` separators between the four summary
 * tiles (TradesPage.xaml lines 233-271).
 * ============================================================ */
function KpiStripCell({
  label,
  filterSig,
  children,
  showHairline,
}: {
  label: string;
  filterSig: string;
  children: ReactNode;
  showHairline: boolean;
}) {
  return (
    <div className="flex items-stretch flex-1 min-w-[5.5rem] sm:min-w-[6rem] md:min-w-0 shrink-0 md:shrink">
      <div className="flex-1 min-w-0 flex flex-col gap-1.5 px-2 sm:px-3">
        <div className="text-[10px] uppercase tracking-[0.15em] text-tertiary truncate">
          {label}
        </div>
        <div className="font-bold text-lg sm:text-xl md:text-2xl tnum text-primary leading-none">
          <span key={filterSig}>{children}</span>
        </div>
      </div>
      {showHairline && (
        <div
          className="w-px shrink-0 self-stretch my-1 bg-[rgb(var(--divider)/0.18)]"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

/* ============================================================
 * Bulk action bar — mirrors TradesPage.xaml lines 474-536.
 * Appears only when at least one row is selected. Shows a
 * count pill + a tag-input + add/remove tag buttons + a clear
 * button. Tag add shows a toast (demo: not actually persisted).
 * ============================================================ */
function BulkActionBar({
  count,
  onClear,
  onTagAdd,
  onTagRemove,
  lang,
}: {
  count: number;
  onClear: () => void;
  onTagAdd: (tag: string) => void;
  onTagRemove: (tag: string) => void;
  lang: "es" | "en";
}) {
  const [tag, setTag] = useState("");
  return (
    // The accent left-edge bar (3px wide, full height) signals that the
    // bar is a contextual action strip — mirrors the WinUI accent bar on
    // command bars.
    <div className="relative border-y border-[rgb(var(--divider)/0.1)] bg-[rgb(var(--accent-base)/0.04)] px-5 py-2.5">
      <div
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-[3px] bg-[rgb(var(--accent-base))]"
      />
      <div className="flex flex-wrap items-center gap-3">
        <span className="pill tnum text-[11px] font-semibold bg-[rgb(var(--accent-base)/0.15)] text-primary border border-[rgb(var(--accent-base)/0.35)]">
          {count}
        </span>
        <span className="text-[10px] uppercase tracking-[0.15em] text-tertiary hidden sm:inline">
          {lang === "es" ? "seleccionadas" : "selected"}
        </span>

        <span className="hidden md:inline-block w-px h-4 bg-[rgb(var(--divider)/0.1)] mx-1" aria-hidden="true" />

        <span className="text-[10px] uppercase tracking-[0.15em] text-tertiary hidden md:inline">
          {lang === "es" ? "Etiqueta" : "Tag"}
        </span>
        <input
          type="text"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && tag.trim()) {
              onTagAdd(tag.trim());
              setTag("");
            }
          }}
          placeholder={lang === "es" ? "Añadir etiqueta…" : "Add tag…"}
          aria-label={lang === "es" ? "Etiqueta en lote" : "Bulk tag"}
          className="bg-[rgb(var(--divider)/0.05)] border border-[rgb(var(--divider)/0.1)] rounded-md h-7 px-2 text-xs text-primary placeholder:text-tertiary focus:outline-none focus:border-[rgb(var(--divider)/0.25)] focus:bg-[rgb(var(--divider)/0.08)] transition-colors w-40"
        />
        <button
          type="button"
          onClick={() => {
            if (tag.trim()) {
              onTagAdd(tag.trim());
              setTag("");
            }
          }}
          className="text-[11px] font-medium text-secondary hover:text-primary border border-[rgb(var(--divider)/0.1)] hover:border-[rgb(var(--divider)/0.25)] rounded-md h-7 px-2 transition-colors"
        >
          {lang === "es" ? "Añadir" : "Add"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (tag.trim()) {
              onTagRemove(tag.trim());
              setTag("");
            }
          }}
          className="text-[11px] font-medium text-tertiary hover:text-secondary border border-[rgb(var(--divider)/0.1)] hover:border-[rgb(var(--divider)/0.25)] rounded-md h-7 px-2 transition-colors"
        >
          {lang === "es" ? "Quitar" : "Remove"}
        </button>

        <span className="hidden md:inline-block w-px h-4 bg-[rgb(var(--divider)/0.1)] mx-1" aria-hidden="true" />

        <button
          type="button"
          onClick={onClear}
          className="text-[11px] font-medium text-tertiary hover:text-primary transition-colors ml-auto"
        >
          {lang === "es" ? "Limpiar selección" : "Clear selection"}
        </button>
      </div>
    </div>
  );
}

export function TradesPage() {
  const { t, tf, lang } = useLang();
  const es = lang === "es";
  const { toast } = useToast();
  const { filters, setFilters, clearFilters, goDetail } = useDemo();
  const customTrades = useCustomTrades();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  // Tercera fila de filtros de la app (TradesPage.xaml L107-213):
  // Resultado y Setup. Viven en estado local y no en el contexto de la
  // demo porque, a diferencia de instrumento/dirección/cumplimiento, no
  // los comparte ninguna otra página.
  const [outcome, setOutcome] = useState<"all" | "win" | "loss" | "be">("all");
  const [setupSel, setSetupSel] = useState<string>("all");

  const customIds = useMemo(
    () => new Set(customTrades.map((c) => c.id)),
    [customTrades]
  );
  const allTrades = useMemo(() => {
    const mapped = customTrades.map(customTradeToTrade);
    return [...TRADES, ...mapped].sort(
      (a, b) => b.closedAt.getTime() - a.closedAt.getTime()
    );
  }, [customTrades]);

  useEffect(() => {
    const id = setTimeout(() => {
      setDebounced(query);
      setVisibleCount(PAGE_SIZE);
    }, 150);
    return () => clearTimeout(id);
  }, [query]);

  const handleSetFilters = (f: Parameters<typeof setFilters>[0]) => {
    setFilters(f);
    setVisibleCount(PAGE_SIZE);
  };

  const filtered = useMemo(() => {
    const q = debounced.trim().toLowerCase();
    return allTrades.filter((tr) => {
      if (filters.instrument !== "all" && tr.instrument !== filters.instrument) return false;
      if (filters.direction !== "all" && tr.direction !== filters.direction) return false;
      if (filters.compliance === "yes" && tr.compliance !== "yes") return false;
      if (filters.compliance === "partial" && tr.compliance !== "partial") return false;
      if (filters.compliance === "no" && tr.compliance !== "no") return false;
      if (outcome === "win" && tr.netPnl <= 0) return false;
      if (outcome === "loss" && tr.netPnl >= 0) return false;
      if (outcome === "be" && tr.netPnl !== 0) return false;
      if (setupSel !== "all" && tr.setup !== setupSel) return false;
      if (q) {
        const hay =
          `${tr.instrument} ${tr.setup} ${tr.entryNote} ${tr.closeNote}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    allTrades,
    debounced,
    filters.instrument,
    filters.direction,
    filters.compliance,
    outcome,
    setupSel,
  ]);

  // Sort the filtered list by the active column.
  const sorted = useMemo(() => {
    const arr = [...filtered];
    const dirMul = sortDir === "asc" ? 1 : -1;
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "symbol":
          cmp = a.instrument.localeCompare(b.instrument);
          break;
        case "duration":
          cmp = a.durationMin - b.durationMin;
          break;
        case "date":
          cmp = a.closedAt.getTime() - b.closedAt.getTime();
          break;
        case "pnl":
          cmp = a.netPnl - b.netPnl;
          break;
        case "r":
          cmp = a.rMultiple - b.rMultiple;
          break;
      }
      return cmp * dirMul;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const metrics = useMemo(() => computeMetrics(filtered), [filtered]);

  const shown = sorted.slice(0, visibleCount);
  const hasMore = visibleCount < sorted.length;

  const filterActive =
    filters.instrument !== "all" ||
    filters.direction !== "all" ||
    filters.compliance !== "all" ||
    outcome !== "all" ||
    setupSel !== "all" ||
    debounced.trim() !== "";

  const filterSig = `${filters.instrument}|${filters.direction}|${filters.compliance}|${outcome}|${setupSel}|${debounced.trim()}|${sortKey}|${sortDir}`;

  const totalPnl = metrics.netPnl;
  const totalR =
    filtered.length > 0
      ? filtered.reduce((s, tr) => s + tr.rMultiple, 0) / filtered.length
      : 0;

  const resetAll = () => {
    clearFilters();
    setQuery("");
    setOutcome("all");
    setSetupSel("all");
  };

  function handleDelete(tradeId: number) {
    const ok = deleteTrade(tradeId);
    if (ok) {
      toast({ title: t("tradeDeleted") });
      setConfirmingId((cur) => (cur === tradeId ? null : cur));
      setSelectedIds((cur) => {
        const next = new Set(cur);
        next.delete(tradeId);
        return next;
      });
    }
  }

  function toggleSelect(tradeId: number) {
    setSelectedIds((cur) => {
      const next = new Set(cur);
      if (next.has(tradeId)) next.delete(tradeId);
      else next.add(tradeId);
      return next;
    });
  }

  function toggleSelectAllVisible() {
    setSelectedIds((cur) => {
      const allSelected = shown.every((tr) => cur.has(tr.id));
      const next = new Set(cur);
      if (allSelected) {
        shown.forEach((tr) => next.delete(tr.id));
      } else {
        shown.forEach((tr) => next.add(tr.id));
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(key === "symbol" ? "asc" : "desc");
    }
  }

  function handleTagAdd(tag: string) {
    toast({
      title: lang === "es"
        ? `Etiqueta “${tag}” aplicada a ${selectedIds.size} operaciones`
        : `Tag “${tag}” applied to ${selectedIds.size} trades`,
    });
  }
  function handleTagRemove(tag: string) {
    toast({
      title: lang === "es"
        ? `Etiqueta “${tag}” quitada de ${selectedIds.size} operaciones`
        : `Tag “${tag}” removed from ${selectedIds.size} trades`,
    });
  }

  const allVisibleSelected = shown.length > 0 && shown.every((tr) => selectedIds.has(tr.id));
  const someVisibleSelected = shown.some((tr) => selectedIds.has(tr.id)) && !allVisibleSelected;

  return (
    <div className="p-5 md:p-6 space-y-5">
      {/* ===== Header (eyebrow + title + count + search) ===== */}
      <Reveal>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div className="space-y-2">
            <Eyebrow>{t("tradesEyebrow")}</Eyebrow>
            <div className="flex items-end gap-3 flex-wrap">
              <h2 className="font-medium tracking-[-0.02em] text-primary text-2xl md:text-3xl">
                {t("tradesTitle")}
              </h2>
              <span className="text-sm text-tertiary tnum mb-1">
                {tf("tradesCount", filtered.length)}
              </span>
            </div>
          </div>

          {/* Search — AutoSuggestBox-style on the right. */}
          <div className="relative w-full md:w-80">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary pointer-events-none"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              className="bg-[rgb(var(--divider)/0.05)] border border-[rgb(var(--divider)/0.1)] rounded-md h-9 pl-9 pr-3 text-sm w-full text-primary placeholder:text-tertiary focus:outline-none focus:border-[rgb(var(--divider)/0.25)] focus:bg-[rgb(var(--divider)/0.08)] transition-colors"
            />
          </div>
        </div>
      </Reveal>

      {/* ===== Filter chips — TWO ROWS, caption-prefixed groups
           (mirrors TradesPage.xaml lines 42-226). Loose on canvas,
           no enclosing card. ===== */}
      <div className="space-y-2.5">
        {/* Row 1 — Instrument. Mobile: the caption column shrinks to 64px
             so the chips get more breathing room at 320–390px. */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="text-[10px] uppercase tracking-[0.15em] text-tertiary min-w-[64px] sm:min-w-[92px]">
            {t("colInstrument")}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <FilterChip
              active={filters.instrument === "all"}
              onClick={() => handleSetFilters({ instrument: "all" })}
              group="instrument"
              label={t("all")}
            >
              {t("all")}
            </FilterChip>
            {INSTRUMENTS.map((inst) => (
              <FilterChip
                key={inst.symbol}
                active={filters.instrument === inst.symbol}
                onClick={() => handleSetFilters({ instrument: inst.symbol })}
                group="instrument"
                label={inst.symbol}
              >
                {inst.symbol}
              </FilterChip>
            ))}
          </div>
        </div>

        {/* Row 2 — Direction + Compliance + Clear. */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <span className="text-[10px] uppercase tracking-[0.15em] text-tertiary min-w-[64px] sm:min-w-[92px]">
              {t("direction")}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <FilterChip
                active={filters.direction === "all"}
                onClick={() => handleSetFilters({ direction: "all" })}
                group="direction"
                label={t("all")}
              >
                {t("all")}
              </FilterChip>
              <FilterChip
                active={filters.direction === "long"}
                onClick={() => handleSetFilters({ direction: "long" })}
                group="direction"
                label={t("long")}
              >
                {t("long")}
              </FilterChip>
              <FilterChip
                active={filters.direction === "short"}
                onClick={() => handleSetFilters({ direction: "short" })}
                group="direction"
                label={t("short")}
              >
                {t("short")}
              </FilterChip>
            </div>
          </div>

          <span className="hidden md:inline-block w-px h-4 bg-[rgb(var(--divider)/0.1)]" aria-hidden="true" />

          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[10px] uppercase tracking-[0.15em] text-tertiary">
              {t("compliance")}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <FilterChip
                active={filters.compliance === "all"}
                onClick={() => handleSetFilters({ compliance: "all" })}
                group="compliance"
                label={t("all")}
              >
                {t("all")}
              </FilterChip>
              <FilterChip
                active={filters.compliance === "yes"}
                onClick={() => handleSetFilters({ compliance: "yes" })}
                group="compliance"
                label={t("complied")}
              >
                {t("complied")}
              </FilterChip>
              {/* "Parcial" existe en la app (el tipo Compliance es
                  yes/partial/no) y la demo se lo saltaba, así que un
                  tercio de las operaciones no era filtrable. */}
              <FilterChip
                active={filters.compliance === "partial"}
                onClick={() => handleSetFilters({ compliance: "partial" })}
                group="compliance"
                label={t("partial")}
              >
                {t("partial")}
              </FilterChip>
              <FilterChip
                active={filters.compliance === "no"}
                onClick={() => handleSetFilters({ compliance: "no" })}
                group="compliance"
                label={t("notComplied")}
              >
                {t("notComplied")}
              </FilterChip>
            </div>
          </div>
        </div>

        {/* Fila 3 — Resultado + Setup (TradesPage.xaml L107-213). Sin
            ella no se podía revisar "mis perdedoras de este setup", que
            es justo para lo que se abre esta pantalla. */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <span className="text-[10px] uppercase tracking-[0.15em] text-tertiary min-w-[64px] sm:min-w-[92px]">
              {es ? "Resultado" : "Result"}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              {(
                [
                  ["all", t("all")],
                  ["win", es ? "Ganadoras" : "Winners"],
                  ["loss", es ? "Perdedoras" : "Losers"],
                  ["be", es ? "A cero" : "Breakeven"],
                ] as const
              ).map(([key, label]) => (
                <FilterChip
                  key={key}
                  active={outcome === key}
                  onClick={() => {
                    setOutcome(key);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  group="outcome"
                  label={label}
                >
                  {label}
                </FilterChip>
              ))}
            </div>
          </div>

          <span className="hidden md:inline-block w-px h-4 bg-[rgb(var(--divider)/0.12)]" aria-hidden="true" />

          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-[10px] uppercase tracking-[0.15em] text-tertiary">
              Setup
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <FilterChip
                active={setupSel === "all"}
                onClick={() => {
                  setSetupSel("all");
                  setVisibleCount(PAGE_SIZE);
                }}
                group="setup"
                label={t("all")}
              >
                {t("all")}
              </FilterChip>
              {SETUP_NAMES.map((s) => (
                <FilterChip
                  key={s}
                  active={setupSel === s}
                  onClick={() => {
                    setSetupSel(s);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  group="setup"
                  label={s}
                >
                  {s}
                </FilterChip>
              ))}
            </div>
          </div>

          {filterActive && (
            <button
              type="button"
              onClick={resetAll}
              className="ml-auto inline-flex items-center gap-1.5 text-xs text-tertiary hover:text-secondary transition-colors px-2 py-1 rounded-md hover:bg-[rgb(var(--divider)/0.05)]"
              aria-label={t("clearFilters")}
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
                <path d="M2 6a4 4 0 1 0 1.2-2.8M2 2v2.5h2.5" />
              </svg>
              {t("clearFilters")}
            </button>
          )}
        </div>
      </div>

      {/* ===== KPI strip — loose on canvas, vertical hairlines
           (mirrors TradesPage.xaml lines 228-271). ===== */}
      <div className="space-y-2">
        <Eyebrow>{t("summary")}</Eyebrow>
        {/* Sin caja: en Operaciones la ÚNICA superficie encajonada es la
            tabla. Los filtros y los KPIs viven sobre el lienzo desnudo
            (TradesPage.xaml L15-16, "full-bleed: menos superficies
            encajonadas"). Meterlos en una tarjeta, como hacía la demo,
            rompía esa jerarquía y llenaba la pantalla de recuadros. */}
        <div className="flex items-stretch py-2 overflow-x-auto custom-scroll -mx-1 px-1">
          {/* El símbolo va DETRÁS de la cifra ("+5.732,24 US$"), como en
              toda la app y como en la propia columna P&L de la tabla de
              abajo. Con el prefijo "$" delante, este KPI era el único
              sitio de la demo que escribía el dinero al modo anglosajón
              — y estaba a tres centímetros de una columna que lo escribe
              al modo europeo. */}
          <KpiStripCell label={t("pnlTotal")} filterSig={filterSig} showHairline>
            <CountUp
              to={Math.abs(totalPnl)}
              decimals={2}
              prefix={totalPnl < 0 ? "−" : "+"}
              suffix=" US$"
              tone={totalPnl > 0 ? "pos" : totalPnl < 0 ? "neg" : "neutral"}
            />
          </KpiStripCell>
          <KpiStripCell label={t("winRate")} filterSig={filterSig} showHairline>
            <CountUp to={metrics.winRate * 100} decimals={1} suffix="%" />
          </KpiStripCell>
          <KpiStripCell label={t("operations")} filterSig={filterSig} showHairline>
            <CountUp to={metrics.closedCount} decimals={0} />
          </KpiStripCell>
          <KpiStripCell label={t("expectancyR")} filterSig={filterSig} showHairline={false}>
            <CountUp
              to={metrics.expectancyR}
              decimals={2}
              prefix="R "
              tone={metrics.expectancyR > 0 ? "pos" : "neg"}
            />
          </KpiStripCell>
        </div>
      </div>

      {/* ===== Trades table card (the only boxed surface) =====
           Mobile: the table is wider than the card (min-w-[1080px]) so it
           scrolls horizontally INSIDE the card via overflow-x-auto. A
           left-edge fade gradient mirrors the right one to hint at scroll
           affordance on both sides. min-w-0 on the wrappers prevents the
           table from inflating the card width on narrow viewports. */}
      <div className="demo-card overflow-hidden min-w-0">
        <div className="relative min-w-0">
          <div className="overflow-x-auto custom-scroll min-w-0">
            <table className="w-full text-sm border-collapse min-w-[1080px]">
              <thead className="demo-chrome border-b border-[rgb(var(--divider)/0.10)]">
                <tr className="text-left">
                  {/* Col 0 — select-all checkbox + direction caption.
                      Sticky on mobile so the checkbox + direction chip
                      stay visible while scrolling horizontally through
                      the wide table. Uses --bg (opaque page surface) so
                      scrolled cells underneath don't bleed through; on
                      desktop (md:) the sticky positioning is removed
                      because the table fits the card. */}
                  <th scope="col" className="pl-5 pr-3 py-3 whitespace-nowrap w-[88px] sticky left-0 z-20 bg-[rgb(var(--bg))] demo-chrome">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={allVisibleSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someVisibleSelected;
                        }}
                        onChange={toggleSelectAllVisible}
                        aria-label={t("selectAll")}
                        className="h-3.5 w-3.5 rounded-[2px] border-[rgb(var(--divider)/0.2)] bg-[rgb(var(--divider)/0.05)] accent-[rgb(var(--accent-base))] cursor-pointer"
                      />
                      <span className="text-[10px] uppercase tracking-[0.15em] text-tertiary">
                        {t("direction")}
                      </span>
                    </div>
                  </th>

                  {/* Col 1 — Symbol (sortable). */}
                  <th scope="col" className="px-3 py-3 whitespace-nowrap w-[140px]">
                    <SortHeader
                      active={sortKey === "symbol"}
                      dir={sortDir}
                      align="left"
                      onClick={() => handleSort("symbol")}
                    >
                      {lang === "es" ? "Instrumento" : "Instrument"}
                    </SortHeader>
                  </th>

                  {/* Col 2 — Setup (non-sortable caption). */}
                  <th scope="col" className="px-3 py-3 whitespace-nowrap">
                    <span className="text-[10px] uppercase tracking-[0.15em] text-tertiary">
                      {t("colSetup")}
                    </span>
                  </th>

                  {/* Col 3 — Session. */}
                  <th scope="col" className="px-3 py-3 whitespace-nowrap w-[80px]">
                    <span className="text-[10px] uppercase tracking-[0.15em] text-tertiary">
                      {lang === "es" ? "Sesión" : "Session"}
                    </span>
                  </th>

                  {/* Col 4 — Entry → Exit. */}
                  <th scope="col" className="px-3 py-3 whitespace-nowrap w-[180px]">
                    <span className="text-[10px] uppercase tracking-[0.15em] text-tertiary">
                      {t("entry")} → {t("exit")}
                    </span>
                  </th>

                  {/* Col 5 — Duration (sortable). */}
                  <th scope="col" className="px-3 py-3 whitespace-nowrap w-[90px]">
                    <SortHeader
                      active={sortKey === "duration"}
                      dir={sortDir}
                      align="left"
                      onClick={() => handleSort("duration")}
                    >
                      {t("colDuration")}
                    </SortHeader>
                  </th>

                  {/* Col 6 — Date (sortable). */}
                  <th scope="col" className="px-3 py-3 whitespace-nowrap w-[120px]">
                    <SortHeader
                      active={sortKey === "date"}
                      dir={sortDir}
                      align="left"
                      onClick={() => handleSort("date")}
                    >
                      {t("colClosed")}
                    </SortHeader>
                  </th>

                  {/* Col 7 — P&L (sortable, right). */}
                  <th scope="col" className="px-3 py-3 whitespace-nowrap w-[120px] text-right">
                    <SortHeader
                      active={sortKey === "pnl"}
                      dir={sortDir}
                      align="right"
                      onClick={() => handleSort("pnl")}
                    >
                      {t("colNetPnl")}
                    </SortHeader>
                  </th>

                  {/* Col 8 — R (sortable, right). */}
                  <th scope="col" className="px-3 py-3 whitespace-nowrap w-[90px] text-right">
                    <SortHeader
                      active={sortKey === "r"}
                      dir={sortDir}
                      align="right"
                      onClick={() => handleSort("r")}
                    >
                      {t("colR")}
                    </SortHeader>
                  </th>

                  {/* Col 9 — Compliance. */}
                  <th scope="col" className="pl-3 pr-4 py-3 whitespace-nowrap w-[120px] text-right">
                    <span className="text-[10px] uppercase tracking-[0.15em] text-tertiary">
                      {t("compliance")}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout" initial={false}>
                  {shown.map((trade, i) => (
                    <TradeRow
                      key={trade.id}
                      trade={trade}
                      index={i}
                      isCustom={customIds.has(trade.id)}
                      goDetail={goDetail}
                      onDelete={handleDelete}
                      confirmingId={confirmingId}
                      setConfirmingId={setConfirmingId}
                      filterSig={filterSig}
                      selected={selectedIds.has(trade.id)}
                      onToggleSelect={toggleSelect}
                    />
                  ))}
                </AnimatePresence>

                {/* Empty state — no trades match the filters. */}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={10} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-tertiary"
                          aria-hidden="true"
                        >
                          <circle cx="11" cy="11" r="8" />
                          <path d="m21 21-4.3-4.3" />
                        </svg>
                        <p className="text-secondary text-sm">
                          {lang === "es"
                            ? "Sin operaciones con esos filtros."
                            : "No trades match these filters."}
                        </p>
                        <button
                          type="button"
                          onClick={resetAll}
                          className="px-3 py-1.5 rounded-md text-xs font-medium border border-[rgb(var(--divider)/0.1)] hover:bg-[rgb(var(--divider)/0.05)] transition-colors text-secondary"
                        >
                          {t("clearFilters")}
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Footer totals row. */}
                {filtered.length > 0 && (
                  <tr className="bg-[rgb(var(--divider)/0.03)] border-t-2 border-[rgb(var(--divider)/0.1)]">
                    <td colSpan={6} className="pl-5 pr-3 py-3 text-xs uppercase tracking-[0.15em] text-tertiary">
                      {tf("tradesCount", filtered.length)}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-[10px] uppercase tracking-[0.15em] text-tertiary block">
                        {lang === "es" ? "Suma" : "Sum"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <Money
                        value={totalPnl}
                        colorizeSign
                        sign
                        className="text-sm font-bold"
                      />
                    </td>
                    <td
                      className={`px-3 py-3 text-right tnum font-bold ${
                        totalR > 0 ? "text-pnl-pos" : totalR < 0 ? "text-pnl-neg" : "text-secondary"
                      }`}
                    >
                      {fmtNum(totalR, lang, 2)}
                    </td>
                    <td className="pl-3 pr-4 py-3" />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Right-edge fade — hints that the table scrolls horizontally
              beyond the card's right edge. No left fade: the sticky first
              column (checkbox + direction chip) already signals "this is
              pinned, scroll right for more". */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-transparent to-[rgb(var(--sombra)/0.18)]" aria-hidden />
          {/* Subtle shadow on the right edge of the sticky first column —
              only visible while the table is scrolled horizontally, gives
              the pinned column a visual separation from the scrolling
              cells underneath. */}
          <div className="pointer-events-none absolute left-[88px] top-0 bottom-0 w-4 bg-gradient-to-r from-[rgb(var(--sombra)/0.14)] to-transparent md:hidden" aria-hidden />
        </div>

        {/* Bulk action bar — only when rows are selected. Spring in
            from the top with a subtle slide + opacity + height so the bar
            reads as a contextual strip rather than a sudden panel. */}
        <AnimatePresence>
          {selectedIds.size > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              transition={{
                duration: 0.24,
                ease: [0.22, 1, 0.36, 1],
                opacity: { duration: 0.18 },
              }}
              className="overflow-hidden"
            >
              <BulkActionBar
                count={selectedIds.size}
                onClear={clearSelection}
                onTagAdd={handleTagAdd}
                onTagRemove={handleTagRemove}
                lang={lang}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Load more — mirrors TradesPage.xaml's GhostButtonStyle
            "Load more" footer (lines 704-713). */}
        {hasMore && (
          <div className="border-t border-[rgb(var(--divider)/0.1)] p-4 flex justify-center">
            <button
              type="button"
              onClick={() =>
                setVisibleCount((c) => Math.min(c + PAGE_SIZE, sorted.length))
              }
              className="px-4 py-1.5 rounded-md text-xs font-medium border border-[rgb(var(--divider)/0.1)] text-secondary hover:text-primary hover:bg-[rgb(var(--divider)/0.05)] transition-colors"
            >
              {lang === "es"
                ? `Cargar más (${sorted.length - visibleCount} restantes)`
                : `Load more (${sorted.length - visibleCount} left)`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
