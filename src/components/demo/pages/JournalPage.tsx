"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLang } from "@/lib/i18n";
import {
  TRADES,
  METRICS,
  weekdayBreakdown,
  monthlyBreakdown,
  type Trade,
} from "@/lib/trading/data";
import { fmtInt, fmtDate, fmtMoney, fmtPct } from "@/lib/trading/format";
import { Eyebrow } from "@/components/tj/Eyebrow";
import { Chip } from "@/components/tj/Chip";
import { Money } from "@/components/tj/Money";
import { CountUp } from "@/components/tj/CountUp";
import { Reveal } from "@/components/tj/Reveal";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ============================================================
   Static bilingual content (no i18n keys for these)
   ============================================================ */

interface ChecklistItem {
  id: string;
  es: string;
  en: string;
}

const PRE_ITEMS: ChecklistItem[] = [
  { id: "plan", es: "¿Plan definido?", en: "Is the plan defined?" },
  { id: "limits", es: "¿Límites de pérdida?", en: "Loss limits set?" },
  { id: "mind", es: "¿Estado mental?", en: "Mental state ready?" },
  { id: "news", es: "¿Noticias revisadas?", en: "News checked?" },
];

const POST_ITEMS: ChecklistItem[] = [
  { id: "respect", es: "¿Respetaste el plan?", en: "Did you respect the plan?" },
  { id: "mgmt", es: "¿Gestión correcta?", en: "Was management right?" },
  { id: "emotions", es: "¿Emociones controladas?", en: "Emotions in check?" },
  { id: "learn", es: "¿Aprendizaje extraído?", en: "Lesson extracted?" },
];

const PRE_PLACEHOLDER = {
  es: "¿Qué vigilas hoy? ¿Qué evitas?",
  en: "What are you watching? What do you avoid?",
};
const POST_PLACEHOLDER = {
  es: "¿Qué aprendiste? ¿Qué cambiarás?",
  en: "What did you learn? What will you change?",
};
const COST_COPY = {
  es: { cost: "Lo que tu indisciplina te costó", saver: "Tu indisciplina te benefició esta vez" },
  en: { cost: "What your indiscipline cost you", saver: "Your indiscipline paid off this time" },
};

/* ============================================================
   Mistake-type labels for the discipline invoice breakdown.
   ============================================================ */

interface MistakeRow {
  key: string;
  es: string;
  en: string;
  count: number;
  cost: number;
}

const MISTAKE_LABELS: Record<string, { es: string; en: string }> = {
  wideStop: { es: "Stop lejano", en: "Wide stop" },
  earlyExit: { es: "Salida anticipada", en: "Early exit" },
  lateEntry: { es: "Entrada tardía", en: "Late entry" },
  oversized: { es: "Tamaño excesivo", en: "Oversized position" },
  noPlan: { es: "Operado sin plan", en: "Traded without plan" },
  partialPlan: { es: "Plan parcial", en: "Partial plan" },
};

function buildMistakeBreakdown(trades: Trade[]): MistakeRow[] {
  const inPlan = trades.filter((t) => t.compliance === "yes");
  const expInPlan = inPlan.length
    ? inPlan.reduce((s, t) => s + t.netPnl, 0) / inPlan.length
    : 0;
  const broke = trades.filter((t) => t.compliance !== "yes");

  const cats: Record<string, { count: number; cost: number }> = {};
  for (const t of broke) {
    let key: string;
    if (t.compliance === "no") key = "noPlan";
    else if (t.mae < -1) key = "wideStop";
    else if (t.rMultiple > 0 && t.mfe > t.rMultiple + 0.5) key = "earlyExit";
    else if (t.rMultiple < 0 && t.rMultiple > -0.95) key = "lateEntry";
    else if (Math.abs(t.netPnl) > 100) key = "oversized";
    else key = "partialPlan";

    if (!cats[key]) cats[key] = { count: 0, cost: 0 };
    cats[key].count += 1;
    cats[key].cost += expInPlan - t.netPnl;
  }

  return Object.entries(cats)
    .map(([key, v]) => ({
      key,
      es: MISTAKE_LABELS[key]?.es ?? key,
      en: MISTAKE_LABELS[key]?.en ?? key,
      count: v.count,
      cost: v.cost,
    }))
    .sort((a, b) => b.cost - a.cost);
}

/* ============================================================
   Animated checkbox — SVG path draws in when toggled on
   ============================================================ */

function CheckMark({ checked }: { checked: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      aria-hidden="true"
      className="overflow-visible"
    >
      <motion.path
        d="M5 12.5 L10 17.5 L19 7"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{
          pathLength: checked ? 1 : 0,
          opacity: checked ? 1 : 0,
        }}
        transition={{ duration: 0.32, ease: EASE }}
      />
    </svg>
  );
}

function ChecklistRow({
  item,
  checked,
  onToggle,
  accent,
}: {
  item: ChecklistItem;
  checked: boolean;
  onToggle: () => void;
  accent: boolean;
}) {
  const { lang } = useLang();
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={checked}
        className="w-full flex items-center gap-3 group text-left"
      >
        <span
          className={`shrink-0 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
            checked
              ? accent
                ? "bg-[rgb(var(--divider)/0.1)] border-[rgb(var(--divider)/0.2)] text-primary"
                : "bg-pnl-pos/20 border-pnl-pos/60 text-pnl-pos"
              : "border-[rgb(var(--divider)/0.15)] text-transparent group-hover:border-[rgb(var(--divider)/0.3)]"
          }`}
        >
          <CheckMark checked={checked} />
        </span>
        <span
          className={`text-sm transition-colors ${
            checked
              ? "text-tertiary"
              : "text-secondary group-hover:text-primary"
          }`}
        >
          {lang === "es" ? item.es : item.en}
        </span>
      </button>
    </li>
  );
}

/* ============================================================
   Day-score dots (0-5)
   ============================================================ */

function DayScoreDots({
  value,
  onChange,
  idPrefix,
}: {
  value: number;
  onChange: (v: number) => void;
  idPrefix: string;
}) {
  return (
    <div
      className="flex items-center gap-1.5"
      role="radiogroup"
      aria-label="Day score"
    >
      {[0, 1, 2, 3, 4, 5].map((n) => {
        const active = n <= value;
        const isSelected = n === value;
        return (
          <motion.button
            key={n}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={`Score ${n}`}
            onClick={() => onChange(n)}
            whileTap={{ scale: 0.8 }}
            whileHover={{ scale: 1.18 }}
            className="relative w-5 h-5"
          >
            <span
              className="absolute inset-0 rounded-full bg-[rgb(var(--divider)/0.10)]"
            />
            <motion.span
              className="absolute inset-0 rounded-full bg-[rgb(var(--accent-base))]"
              animate={{
                opacity: active ? 1 : 0,
                scale: active ? 1 : 0.7,
              }}
              transition={{ type: "spring", stiffness: 360, damping: 22 }}
            />
            {isSelected && (
              <motion.span
                layoutId={`${idPrefix}-day-score-ring`}
                className="absolute -inset-1 rounded-full border border-[rgb(var(--accent-base)/0.55)]"
                transition={{ type: "spring", stiffness: 320, damping: 26 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

/* ============================================================
   Ritual column (Pre-market / Post-market)
   ============================================================ */

function RitualColumn({
  title,
  items,
  state,
  onToggle,
  score,
  onScoreChange,
  note,
  onNoteChange,
  accent,
  idPrefix,
  placeholder,
}: {
  title: string;
  items: ChecklistItem[];
  state: Record<string, boolean>;
  onToggle: (id: string) => void;
  score: number;
  onScoreChange: (n: number) => void;
  note: string;
  onNoteChange: (s: string) => void;
  accent: boolean;
  idPrefix: string;
  placeholder: string;
}) {
  const { t } = useLang();
  const checkedCount = items.filter((it) => state[it.id]).length;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              accent ? "bg-[rgb(var(--accent-base))]" : "bg-pnl-pos"
            }`}
          />
          <h3 className="font-medium text-primary">{title}</h3>
        </div>
        <span className="pill bg-[rgb(var(--divider)/0.05)] text-tertiary border border-[rgb(var(--divider)/0.1)] tnum">
          {checkedCount}/{items.length}
        </span>
      </div>

      <ul className="space-y-2.5">
        {items.map((it) => (
          <ChecklistRow
            key={it.id}
            item={it}
            checked={!!state[it.id]}
            onToggle={() => onToggle(it.id)}
            accent={accent}
          />
        ))}
      </ul>

      <div className="space-y-1.5">
        <div className="text-[11px] uppercase tracking-[0.15em] text-tertiary">
          {t("dayScore")}
        </div>
        <DayScoreDots
          value={score}
          onChange={onScoreChange}
          idPrefix={idPrefix}
        />
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor={`${idPrefix}-note`}
          className="text-[11px] uppercase tracking-[0.15em] text-tertiary"
        >
          {t("freeNote")}
        </label>
        <textarea
          id={`${idPrefix}-note`}
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          rows={3}
          placeholder={placeholder}
          className="w-full bg-[rgb(var(--divider)/0.05)] border border-[rgb(var(--divider)/0.1)] rounded-md p-3 text-sm text-primary placeholder:text-tertiary focus:border-[rgb(var(--divider)/0.2)] focus:bg-[rgb(var(--divider)/0.08)] outline-none transition-colors resize-none custom-scroll"
        />
      </div>
    </div>
  );
}

/* ============================================================
   Compliance ring — SVG circular progress with animated stroke.
   ============================================================ */

function ComplianceRing({ pct, label }: { pct: number; label: string }) {
  const reduce = useReducedMotion();
  const R = 52;
  const C = 2 * Math.PI * R;
  const targetOffset = C * (1 - pct);
  const overshoot = C * 0.06 * (1 - pct);
  const overshootOffset = Math.max(0, targetOffset - overshoot);
  const tone: "pos" | "warn" | "neg" =
    pct > 0.7 ? "pos" : pct > 0.5 ? "warn" : "neg";
  const colorVar =
    tone === "pos"
      ? "--pnl-pos"
      : tone === "warn"
      ? "--pnl-warn"
      : "--pnl-neg";
  const toneClass =
    tone === "pos"
      ? "text-pnl-pos"
      : tone === "warn"
      ? "text-pnl-warn"
      : "text-pnl-neg";
  return (
    <motion.div
      className="relative w-40 h-40 md:w-44 md:h-44 mx-auto"
      initial={reduce ? undefined : { scale: 0.92, opacity: 0.5 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="60"
          cy="60"
          r={R}
          fill="none"
          stroke="rgb(var(--divider) / 0.14)"
          strokeWidth={8}
        />
        <motion.circle
          cx="60"
          cy="60"
          r={R}
          fill="none"
          stroke={`rgb(var(${colorVar}))`}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={C}
          initial={{ strokeDashoffset: C }}
          whileInView={
            reduce
              ? { strokeDashoffset: targetOffset }
              : {
                  strokeDashoffset: [
                    C,
                    overshootOffset,
                    targetOffset,
                  ],
                }
          }
          viewport={{ once: true, margin: "-40px" }}
          transition={
            reduce
              ? { duration: 1.4, ease: EASE, delay: 0.15 }
              : {
                  duration: 1.9,
                  ease: EASE,
                  delay: 0.15,
                  times: [0, 0.62, 1],
                }
          }
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={`text-3xl md:text-4xl font-bold tnum ${toneClass} leading-none`}>
          <CountUp to={pct * 100} decimals={0} suffix="%" />
        </div>
        <div className="text-[10px] uppercase tracking-[0.15em] text-tertiary mt-1.5 text-center">
          {label}
        </div>
      </div>
    </motion.div>
  );
}

/* ============================================================
   Traffic light — green / amber / red.
   ============================================================ */

function TrafficLight({ level }: { level: "green" | "amber" | "red" }) {
  const { lang } = useLang();
  const reduce = useReducedMotion();
  const label =
    lang === "es"
      ? level === "green"
        ? "Disciplina alta"
        : level === "amber"
        ? "Disciplina media"
        : "Disciplina baja"
      : level === "green"
      ? "High discipline"
      : level === "amber"
      ? "Medium discipline"
      : "Low discipline";
  const lights: { key: "green" | "amber" | "red"; color: string; rgb: string }[] = [
    { key: "green", color: "rgb(var(--sig-green))", rgb: "var(--sig-green)" },
    { key: "amber", color: "rgb(var(--sig-amber))", rgb: "var(--sig-amber)" },
    { key: "red", color: "rgb(var(--sig-red))", rgb: "var(--sig-red)" },
  ];
  return (
    <div
      className="flex items-center gap-2"
      role="status"
      aria-label={label}
    >
      {/* El alojamiento del semáforo es un HUECO: un rebaje en el material,
          no una pieza negra pegada encima. Atado al tinte del sistema y a
          la sombra tonal, se lee como rebaje en los dos temas; en negro
          fijo era una mancha sobre el papel claro. */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[rgb(var(--divider)/0.10)] border border-[rgb(var(--divider)/0.1)] shadow-[inset_0_1px_2px_rgb(var(--sombra)/0.28)]">
        {lights.map((l) => {
          const active = l.key === level;
          return (
            <div key={l.key} className="relative w-2.5 h-2.5">
              {active && !reduce && (
                <span
                  aria-hidden
                  className="absolute -inset-1.5 rounded-full pointer-events-none"
                  style={{
                    backgroundColor: l.color,
                    filter: "blur(5px)",
                    opacity: 0.55,
                  }}
                />
              )}
              <motion.span
                className="absolute inset-0 rounded-full"
                style={{
                  backgroundColor: l.color,
                  boxShadow: active
                    ? `0 0 6px 1px rgb(${l.rgb} / 0.8), inset 0 0 3px rgb(255 255 255 / 0.5)`
                    : "inset 0 0 2px rgb(0 0 0 / 0.4)",
                }}
                animate={{
                  opacity: active ? 1 : 0.22,
                  scale: active ? 1 : 0.7,
                }}
                transition={{ duration: 0.3 }}
              />
              <span
                aria-hidden
                className="absolute top-[1px] left-[1px] w-[3px] h-[3px] rounded-full bg-[rgb(var(--divider)/0.55)] pointer-events-none"
                style={{ opacity: active ? 0.85 : 0.18 }}
              />
            </div>
          );
        })}
      </div>
      <span className="text-[11px] uppercase tracking-[0.15em] text-tertiary">
        {label}
      </span>
    </div>
  );
}

/* ============================================================
   Diverging bar — in-plan vs out-of-plan expectancy
   ============================================================ */

function DivergingBar({
  inPlan,
  outPlan,
}: {
  inPlan: number;
  outPlan: number;
}) {
  const maxAbs = Math.max(Math.abs(inPlan), Math.abs(outPlan), 1);
  const inPct = (Math.abs(inPlan) / maxAbs) * 50;
  const outPct = (Math.abs(outPlan) / maxAbs) * 50;
  return (
    <div className="relative h-2.5 rounded-full bg-[rgb(var(--divider)/0.05)] overflow-hidden">
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[rgb(var(--divider)/0.25)] z-10" />
      <motion.div
        className="absolute top-0 bottom-0 right-1/2 bg-pnl-pos/80"
        initial={{ width: 0 }}
        whileInView={{ width: `${inPct}%` }}
        viewport={{ once: true, margin: "-20px" }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.4 }}
      />
      <motion.div
        className="absolute top-0 bottom-0 left-1/2 bg-pnl-neg/80"
        initial={{ width: 0 }}
        whileInView={{ width: `${outPct}%` }}
        viewport={{ once: true, margin: "-20px" }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.55 }}
      />
    </div>
  );
}

/* ============================================================
   P&L bar chart (weekly / monthly)
   ============================================================ */

function PnlBarChart({ data }: { data: { label: string; pnl: number }[] }) {
  const { lang } = useLang();
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const maxAbs = Math.max(...data.map((d) => Math.abs(d.pnl)), 1);
  return (
    <div className="flex items-stretch gap-1.5 sm:gap-2 h-44">
      {data.map((d, i) => {
        const pct = (Math.abs(d.pnl) / maxAbs) * 100;
        const isPos = d.pnl >= 0;
        return (
          <div
            key={d.label + i}
            className="flex-1 flex flex-col items-center gap-2 min-w-0 group"
            onPointerDown={() =>
              setActiveIdx((cur) => (cur === i ? null : i))
            }
          >
            <div className="relative w-full flex-1">
              <div className="absolute left-0 right-0 top-1/2 h-px bg-[rgb(var(--divider)/0.1)] -translate-y-1/2" />
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: `${pct / 2}%`, opacity: 1 }}
                transition={{ duration: 0.7, delay: 0.04 * i, ease: EASE }}
                className={`absolute left-1/2 -translate-x-1/2 w-2/3 rounded-sm group-hover:w-4/5 transition-[width] ${
                  isPos
                    ? "bottom-1/2 bg-pnl-pos/80"
                    : "top-1/2 bg-pnl-neg/80"
                }`}
              />
              <div
                className={`absolute left-1/2 -translate-x-1/2 text-[9.5px] tnum whitespace-nowrap ${
                  isPos
                    ? "bottom-[calc(50%+6px)]"
                    : "top-[calc(50%+6px)]"
                } text-tertiary transition-opacity ${
                  activeIdx === i
                    ? "opacity-100"
                    : "opacity-0 group-hover:opacity-100"
                }`}
              >
                {isPos ? "+" : "−"}
                {fmtInt(Math.abs(d.pnl), lang)}
              </div>
            </div>
            <div className="text-[10px] uppercase tracking-wider text-tertiary tnum truncate">
              {d.label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ============================================================
   History timeline — derived from TRADES grouped by day
   ============================================================ */

interface HistoryEntry {
  key: string;
  date: Date;
  sumPnl: number;
  avgScore: number;
  compliancePct: number;
  count: number;
  note: string;
  compliance: "yes" | "partial" | "no";
}

function buildHistory(trades: Trade[]): HistoryEntry[] {
  const groups = new Map<string, Trade[]>();
  for (const t of trades) {
    const k = t.closedAt.toISOString().slice(0, 10);
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k)!.push(t);
  }
  return [...groups.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 6)
    .map(([key, ts]) => {
      const sumPnl = ts.reduce((s, t) => s + t.netPnl, 0);
      const avgScore = Math.round(
        ts.reduce((s, t) => s + t.dayScore, 0) / ts.length
      );
      const complied = ts.filter((t) => t.compliance === "yes").length;
      const compliancePct = complied / ts.length;
      const overall: "yes" | "partial" | "no" =
        compliancePct >= 0.8
          ? "yes"
          : compliancePct >= 0.5
          ? "partial"
          : "no";
      return {
        key,
        date: ts[0].closedAt,
        sumPnl,
        avgScore,
        compliancePct,
        count: ts.length,
        note: ts[0].entryNote,
        compliance: overall,
      };
    });
}

/* ============================================================
   Daily check-in — sleep stepper + segmented mental/physical
   meters + plan toggle (mirrors the real JournalPage.xaml
   CHECK-IN DEL DÍA card, M10-A4).
   ============================================================ */

function SegmentedMeter({
  value,
  onChange,
  label,
  display,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  display: string;
}) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-end justify-between gap-2">
        <span className="text-[11px] uppercase tracking-[0.15em] text-tertiary">
          {label}
        </span>
        <span className="text-xs text-secondary tnum">{display}</span>
      </div>
      <div
        className="grid grid-cols-5 gap-1.5"
        role="radiogroup"
        aria-label={label}
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const active = n <= value;
          const isSelected = n === value;
          return (
            <motion.button
              key={n}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${label} ${n}`}
              onClick={() => onChange(n)}
              whileTap={{ scale: 0.92 }}
              className="relative h-8 rounded-md border transition-colors"
              style={{
                backgroundColor: active
                  ? "rgb(var(--accent-base) / 0.55)"
                  : "rgb(var(--divider) / 0.06)",
                borderColor: active
                  ? "rgb(var(--accent-base) / 0.75)"
                  : "rgb(var(--divider) / 0.16)",
              }}
            >
              {isSelected && (
                <motion.span
                  layoutId={`segmented-ring-${label}`}
                  className="absolute -inset-px rounded-md border border-[rgb(var(--accent-base)/0.55)] pointer-events-none"
                  transition={{ type: "spring", stiffness: 320, damping: 26 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

function SleepStepper({
  hours,
  onMinus,
  onPlus,
}: {
  hours: number;
  onMinus: () => void;
  onPlus: () => void;
}) {
  const { lang } = useLang();
  const reduce = useReducedMotion();
  const pct = Math.min(100, (hours / 12) * 100);
  return (
    <div className="space-y-2.5">
      <span className="text-[11px] uppercase tracking-[0.15em] text-tertiary">
        {lang === "es" ? "Sueño" : "Sleep"}
      </span>
      <div className="flex items-center gap-3">
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={onMinus}
          aria-label={lang === "es" ? "Restar 0,5 h" : "Subtract 0.5 h"}
          className="shrink-0 w-9 h-9 rounded-full border border-[rgb(var(--divider)/0.15)] text-secondary hover:text-primary hover:border-[rgb(var(--divider)/0.3)] transition-colors flex items-center justify-center"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </motion.button>
        <div className="flex-1 space-y-1.5 text-center">
          <div className="text-2xl font-semibold tnum text-primary leading-none">
            {hours.toFixed(1)}
            <span className="text-xs text-tertiary font-normal ml-1">h</span>
          </div>
          <div className="relative h-1.5 rounded-full bg-[rgb(var(--divider)/0.08)] overflow-hidden">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-[rgb(var(--accent-base))]"
              initial={reduce ? undefined : { width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.6, ease: EASE }}
            />
          </div>
        </div>
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={onPlus}
          aria-label={lang === "es" ? "Sumar 0,5 h" : "Add 0.5 h"}
          className="shrink-0 w-9 h-9 rounded-full border border-[rgb(var(--divider)/0.15)] text-secondary hover:text-primary hover:border-[rgb(var(--divider)/0.3)] transition-colors flex items-center justify-center"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}

function PlanToggle({
  on,
  onToggle,
}: {
  on: boolean;
  onToggle: () => void;
}) {
  const { lang } = useLang();
  return (
    <div className="space-y-2.5">
      <span className="text-[11px] uppercase tracking-[0.15em] text-tertiary">
        {lang === "es" ? "Plan del día" : "Today's plan"}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={onToggle}
        className="inline-flex items-center gap-2.5 group"
      >
        <span
          className={`relative w-11 h-6 rounded-full transition-colors ${
            on ? "bg-[rgb(var(--accent-base))]" : "bg-pnl-warn/40"
          }`}
        >
          <motion.span
            layout
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className={`absolute top-0.5 ${
              on ? "left-[1.375rem]" : "left-0.5"
            } w-5 h-5 rounded-full shadow-md ${
              // La manecilla se define por CONTRASTE con su propia pista, no
              // por un blanco fijo: sobre el acento va la tinta que el
              // sistema reserva para escribir encima del acento, y sobre la
              // pista de aviso va la tinta normal. Así se ve en los dos
              // temas — el blanco fijo desaparecía en el claro.
              on ? "bg-[rgb(var(--accent-ink))]" : "bg-[rgb(var(--txt-primary))]"
            }`}
          />
        </span>
        <span
          className={`text-xs tnum font-medium ${
            on ? "text-primary" : "text-pnl-warn"
          }`}
        >
          {on
            ? lang === "es" ? "Con plan" : "With plan"
            : lang === "es" ? "Sin plan" : "No plan"}
        </span>
      </button>
    </div>
  );
}

function CrossCell({
  label,
  lowLabel,
  highLabel,
  lowValue,
  highValue,
  sample,
}: {
  label: string;
  lowLabel: string;
  highLabel: string;
  lowValue: number;
  highValue: number;
  sample: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <span className="text-[10px] uppercase tracking-[0.14em] text-tertiary">
          {label}
        </span>
      </div>
      <div className="flex items-stretch gap-4">
        <div className="space-y-0.5">
          <div className="text-[9.5px] uppercase tracking-wider text-tertiary">
            {lowLabel}
          </div>
          <Money
            value={lowValue}
            sign
            colorizeSign
            className="text-sm font-semibold"
          />
        </div>
        <div className="space-y-0.5">
          <div className="text-[9.5px] uppercase tracking-wider text-tertiary">
            {highLabel}
          </div>
          <Money
            value={highValue}
            sign
            colorizeSign
            className="text-sm font-semibold"
          />
        </div>
      </div>
      <div className="text-[10px] text-tertiary tnum">{sample}</div>
    </div>
  );
}

/* ============================================================
   Main JournalPage
   ============================================================ */

export function JournalPage() {
  const { t, lang } = useLang();
  const reduce = useReducedMotion();

  // Check-in state — mirrors the real app's JournalViewModel.
  const [sleepHours, setSleepHours] = useState(7.0);
  const [mental, setMental] = useState(4);
  const [physical, setPhysical] = useState(3);
  const [hasPlan, setHasPlan] = useState(true);

  // Ritual state
  const [preState, setPreState] = useState<Record<string, boolean>>({
    plan: true,
    limits: true,
    mind: false,
    news: false,
  });
  const [postState, setPostState] = useState<Record<string, boolean>>({
    respect: false,
    mgmt: false,
    emotions: false,
    learn: false,
  });
  const [preScore, setPreScore] = useState(3);
  const [postScore, setPostScore] = useState(4);
  const [preNote, setPreNote] = useState("");
  const [postNote, setPostNote] = useState("");

  // Review tab
  const [tab, setTab] = useState<"weekly" | "monthly">("weekly");

  const weekly = useMemo(
    () =>
      weekdayBreakdown(TRADES, lang).map((d) => ({ label: d.day, pnl: d.pnl })),
    [lang]
  );
  const monthly = useMemo(
    () =>
      monthlyBreakdown(TRADES, lang).map((d) => ({ label: d.month, pnl: d.pnl })),
    [lang]
  );
  const history = useMemo(() => buildHistory(TRADES), []);

  // Discipline invoice breakdown — derived from the full TRADES set.
  const mistakeRows = useMemo(() => buildMistakeBreakdown(TRADES), []);
  const totalMistakeCount = useMemo(
    () => mistakeRows.reduce((s, r) => s + r.count, 0),
    [mistakeRows]
  );
  const totalMistakeCost = useMemo(
    () => mistakeRows.reduce((s, r) => s + r.cost, 0),
    [mistakeRows]
  );

  const compliancePct = METRICS.compliancePct;
  const costOfIndiscipline = METRICS.costOfIndiscipline;
  const expInPlan = METRICS.expectancyInPlan;
  const expOutPlan = METRICS.expectancyBrokePlan;

  const isRealCost = costOfIndiscipline > 0;
  const headlineValue = Math.abs(costOfIndiscipline);
  const headlinePrefix = isRealCost ? "−$" : "+$";
  const headlineTone = isRealCost ? "text-pnl-neg" : "text-pnl-pos";
  const headlineShadow = isRealCost
    ? "0 0 18px rgb(var(--pnl-neg) / 0.45)"
    : "0 0 18px rgb(var(--pnl-pos) / 0.35)";

  const trafficLevel: "green" | "amber" | "red" =
    compliancePct > 0.7 ? "green" : compliancePct > 0.5 ? "amber" : "red";

  // Deterministic cross-comparison values for the check-in card.
  // These mirror the real app's Sleep×Result / Mental×Result / Physical×Result
  // / Plan×Result breakdowns, computed deterministically from the dataset.
  const cross = useMemo(() => {
    const sorted = [...TRADES].sort(
      (a, b) => a.closedAt.getTime() - b.closedAt.getTime()
    );
    const mid = Math.floor(sorted.length / 2);
    const lowHalf = sorted.slice(0, mid);
    const highHalf = sorted.slice(mid);
    const avg = (arr: Trade[]) =>
      arr.length ? arr.reduce((s, t) => s + t.netPnl, 0) / arr.length : 0;
    const withPlan = sorted.filter((t) => t.compliance === "yes");
    const withoutPlan = sorted.filter((t) => t.compliance !== "yes");
    return {
      sleepLow: avg(lowHalf),
      sleepHigh: avg(highHalf),
      sleepSample: `${sorted.length} ${lang === "es" ? "días" : "days"}`,
      mentalLow: avg(lowHalf.filter((t) => t.dayScore <= 2)) || -42.18,
      mentalHigh: avg(highHalf.filter((t) => t.dayScore >= 4)) || 96.74,
      physicalLow: avg(lowHalf.filter((t) => t.dayScore === 1)) || -58.4,
      physicalHigh: avg(highHalf.filter((t) => t.dayScore === 5)) || 124.6,
      planWith: avg(withPlan),
      planWithout: avg(withoutPlan),
    };
  }, [lang]);

  // 30-day check-in streak strip (deterministic). The LCG state is
  // kept INSIDE the memo closure so it's never reassigned across the
  // component render (satisfies react-hooks/immutability).
  const streakStrip = useMemo(() => {
    const state = { s: 20260716 };
    const rnd = () => {
      state.s = (state.s * 9301 + 49297) % 233280;
      return state.s / 233280;
    };
    return Array.from({ length: 30 }, (_, i) => {
      const has = rnd() > 0.18;
      return { i, has };
    });
  }, []);
  const currentStreak = useMemo(() => {
    let n = 0;
    for (let i = streakStrip.length - 1; i >= 0; i--) {
      if (streakStrip[i].has) n++;
      else break;
    }
    return n;
  }, [streakStrip]);
  const bestStreak = useMemo(() => {
    let best = 0;
    let cur = 0;
    for (const d of streakStrip) {
      if (d.has) {
        cur++;
        best = Math.max(best, cur);
      } else cur = 0;
    }
    return best;
  }, [streakStrip]);

  // Monthly compliance trend (last 6 months, deterministic).
  const complianceTrend = useMemo(() => {
    const months = lang === "es"
      ? ["Feb", "Mar", "Abr", "May", "Jun", "Jul"]
      : ["Feb", "Mar", "Apr", "May", "Jun", "Jul"];
    const base = [0.62, 0.71, 0.66, 0.78, 0.74, compliancePct];
    return months.map((m, i) => ({ label: m, fraction: base[i] ?? 0.7 }));
  }, [lang, compliancePct]);

  const togglePre = (id: string) =>
    setPreState((p) => ({ ...p, [id]: !p[id] }));
  const togglePost = (id: string) =>
    setPostState((p) => ({ ...p, [id]: !p[id] }));

  const L = (es: string, en: string) => (lang === "es" ? es : en);

  return (
    <div className="relative p-5 md:p-6 space-y-5">
      {/* Header */}
      <Reveal>
        <header className="space-y-3 relative">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-16 -left-10 w-56 h-32 rounded-full opacity-50"
            style={{
              background:
                "radial-gradient(closest-side, rgb(var(--accent-base) / 0.16), transparent 70%)",
            }}
          />
          <div className="relative">
            <Eyebrow>{t("journalEyebrow")}</Eyebrow>
            {/* h2 y no h1: esta es una pantalla SIMULADA dentro de la página de
                la demo. El h1 del documento es el titular de esa página, y dos
                h1 rompen el esquema de encabezados —lectores de pantalla y
                buscadores lo usan para entender la jerarquía—. */}
            <h2 className="font-medium tracking-[-0.02em] text-primary text-2xl md:text-3xl">
              {t("journalTitle")}
            </h2>
            <p className="text-sm text-tertiary mt-1.5 max-w-2xl leading-relaxed">
              {L(
                "Ritual diario, coste real de la indisciplina y semáforo de cumplimiento.",
                "Daily ritual, real cost of indiscipline and compliance traffic light."
              )}
            </p>
          </div>
        </header>
      </Reveal>

      {/* ===========================================================
          DAILY CHECK-IN — mirrors the real app's CHECK-IN DEL DÍA card.
          Sleep (stepper ±0.5h) | Mental state (5-seg) | Physical state
          (5-seg) | Plan toggle, then cross-comparison strip showing
          sleep×result / mental×result / physical×result / plan×result
          with low/high averages and the 30-day streak strip.
          =========================================================== */}
      <Reveal delay={0.05}>
        <div className="demo-card p-5 md:p-6">
          <div className="space-y-5">
            <div className="space-y-1">
              <Eyebrow>
                {L("Check-in del día", "Today's check-in")}
              </Eyebrow>
              <p className="text-xs text-tertiary leading-relaxed max-w-xl">
                {L(
                  "Registra tu estado antes de operar. Los cruces debajo contrastan cada campo con el resultado real del día.",
                  "Log your state before trading. The crosses below contrast each field with the day's actual result."
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-7">
              <SleepStepper
                hours={sleepHours}
                onMinus={() => setSleepHours((h) => Math.max(0, h - 0.5))}
                onPlus={() => setSleepHours((h) => Math.min(12, h + 0.5))}
              />
              <SegmentedMeter
                value={mental}
                onChange={setMental}
                label={L("Estado mental", "Mental state")}
                display={`${mental}/5`}
              />
              <SegmentedMeter
                value={physical}
                onChange={setPhysical}
                label={L("Estado físico", "Physical state")}
                display={`${physical}/5`}
              />
              <PlanToggle on={hasPlan} onToggle={() => setHasPlan((p) => !p)} />
            </div>

            {/* Cross-comparison grid — mirrors the real app's
                Sleep×Expectancy + Mental×Result + Physical×Result +
                Plan×Result cross row. */}
            <div className="pt-4 border-t border-[rgb(var(--divider)/0.1)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <CrossCell
                  label={L("Sueño × resultado", "Sleep × result")}
                  lowLabel={L("≤ 6 h", "≤ 6 h")}
                  highLabel={L("≥ 8 h", "≥ 8 h")}
                  lowValue={cross.sleepLow}
                  highValue={cross.sleepHigh}
                  sample={cross.sleepSample}
                />
                <CrossCell
                  label={L("Mental × resultado", "Mental × result")}
                  lowLabel={L("Bajo", "Low")}
                  highLabel={L("Alto", "High")}
                  lowValue={cross.mentalLow}
                  highValue={cross.mentalHigh}
                  sample={`${TRADES.length} ${L("días", "days")}`}
                />
                <CrossCell
                  label={L("Físico × resultado", "Physical × result")}
                  lowLabel={L("Bajo", "Low")}
                  highLabel={L("Alto", "High")}
                  lowValue={cross.physicalLow}
                  highValue={cross.physicalHigh}
                  sample={`${TRADES.length} ${L("días", "days")}`}
                />
                <CrossCell
                  label={L("Plan × resultado", "Plan × result")}
                  lowLabel={L("Sin plan", "No plan")}
                  highLabel={L("Con plan", "With plan")}
                  lowValue={cross.planWithout}
                  highValue={cross.planWith}
                  sample={`${TRADES.length} ${L("días", "days")}`}
                />
              </div>
            </div>

            {/* 30-day streak strip — mirrors the real app's
                CheckinStrip with current/best streak counts. */}
            <div className="pt-4 border-t border-[rgb(var(--divider)/0.1)]">
              <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                <span className="text-[10px] uppercase tracking-[0.14em] text-tertiary">
                  {L("Constancia del check-in · 30 días", "Check-in consistency · 30 days")}
                </span>
                <div className="flex items-center gap-2">
                  {/* Current streak — accent-tinted pill so the count reads
                      as the strip's focal point. */}
                  {/* Etiquetas en `text-secondary`, no `text-tertiary`: la
                      terciaria se calibra para el fondo plano de la página,
                      y aquí se apoya en el tinte del acento — un paso más
                      de tinta es lo que le devuelve el margen. */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-[rgb(var(--accent-base)/0.12)] border border-[rgb(var(--accent-base)/0.3)]">
                    <span className="text-[10px] uppercase tracking-[0.12em] text-secondary">
                      {L("Actual", "Current")}
                    </span>
                    <span className="text-sm font-bold tnum text-primary leading-none">
                      {currentStreak}
                    </span>
                    <span className="text-[10px] text-secondary">
                      {L("días", "days")}
                    </span>
                  </span>
                  {/* Best streak — neutral pill. */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full bg-[rgb(var(--divider)/0.04)] border border-[rgb(var(--divider)/0.1)]">
                    <span className="text-[10px] uppercase tracking-[0.12em] text-tertiary">
                      {L("Mejor", "Best")}
                    </span>
                    <span className="text-sm font-bold tnum text-primary leading-none">
                      {bestStreak}
                    </span>
                    <span className="text-[10px] text-tertiary">
                      {L("días", "days")}
                    </span>
                  </span>
                </div>
              </div>
              <div className="flex items-end gap-[3px] h-5" aria-hidden="true">
                {streakStrip.map((d) => (
                  <div
                    key={d.i}
                    className="flex-1 h-full rounded-sm"
                    style={{
                      backgroundColor: d.has
                        ? "rgb(var(--accent-base))"
                        : "transparent",
                      border: d.has
                        ? "none"
                        : "1px solid rgb(255 255 255 / 0.12)",
                    }}
                    title={d.has ? L("Registrado", "Logged") : L("Sin registro", "Missing")}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Daily ritual card */}
      <Reveal delay={0.05}>
        <div className="demo-card p-5 md:p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-1 h-5 bg-[rgb(var(--accent-base))] rounded-full shrink-0" />
              <h2 className="font-medium text-primary text-base md:text-lg truncate">
                {t("ritualTitle")}
              </h2>
            </div>
            <span className="pill bg-[rgb(var(--divider)/0.08)] text-primary border border-[rgb(var(--divider)/0.2)] shrink-0">
              {L("Hoy", "Today")}
            </span>
          </div>

          <div className="relative grid md:grid-cols-2 gap-6 md:gap-8">
            <RitualColumn
              title={t("preMarket")}
              items={PRE_ITEMS}
              state={preState}
              onToggle={togglePre}
              score={preScore}
              onScoreChange={setPreScore}
              note={preNote}
              onNoteChange={setPreNote}
              accent
              idPrefix="pre"
              placeholder={
                lang === "es" ? PRE_PLACEHOLDER.es : PRE_PLACEHOLDER.en
              }
            />

            <div
              className="md:hidden col-span-full -my-1"
              aria-hidden="true"
            >
              <div className="h-px bg-gradient-to-r from-transparent via-[rgb(var(--divider)/0.18)] to-transparent" />
            </div>

            <RitualColumn
              title={t("postMarket")}
              items={POST_ITEMS}
              state={postState}
              onToggle={togglePost}
              score={postScore}
              onScoreChange={setPostScore}
              note={postNote}
              onNoteChange={setPostNote}
              accent={false}
              idPrefix="post"
              placeholder={
                lang === "es" ? POST_PLACEHOLDER.es : POST_PLACEHOLDER.en
              }
            />

            <div
              className="hidden md:block absolute left-1/2 top-0 bottom-0 -translate-x-1/2 pointer-events-none"
              aria-hidden="true"
            >
              <div className="h-full w-px bg-gradient-to-b from-transparent via-[rgb(var(--divider)/0.18)] to-transparent" />
            </div>
          </div>
        </div>
      </Reveal>

      {/* Discipline report — HERO + INVOICE */}
      <Reveal delay={0.1}>
        <div className="demo-card relative overflow-hidden p-5 md:p-6">
          <div className="relative space-y-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-1 h-5 bg-pnl-warn rounded-full shrink-0" />
                <h2 className="font-medium text-primary text-base md:text-lg truncate">
                  {t("disciplineReport")}
                </h2>
              </div>
              <TrafficLight level={trafficLevel} />
            </div>

            {/* Top row: compliance ring + streak + cost of indiscipline */}
            <div className="grid md:grid-cols-3 gap-6 md:gap-8 items-center">
              <div className="flex flex-col items-center">
                <ComplianceRing
                  pct={compliancePct}
                  label={t("compliancePct")}
                />
              </div>

              <div className="flex flex-col items-center text-center">
                <div className={`flex items-center gap-2 mb-2 justify-center ${headlineTone}`}>
                  <svg
                    width={20}
                    height={20}
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M12 3 L22 20 L2 20 Z"
                      stroke="currentColor"
                      strokeWidth={1.6}
                      strokeLinejoin="round"
                    />
                    <line
                      x1="12"
                      y1="9"
                      x2="12"
                      y2="14"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                    />
                    <circle cx="12" cy="17.4" r="0.9" fill="currentColor" />
                  </svg>
                  <span className="text-[11px] uppercase tracking-[0.15em] font-semibold">
                    {t("costOfIndiscipline")}
                  </span>
                </div>
                <motion.div
                  className={`relative font-bold tracking-tight text-4xl md:text-5xl tnum ${headlineTone}`}
                  initial={reduce ? undefined : { opacity: 0.55, scale: 0.94 }}
                  whileInView={reduce ? undefined : { opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
                  style={{ textShadow: headlineShadow }}
                >
                  <CountUp
                    to={headlineValue}
                    decimals={0}
                    prefix={headlinePrefix}
                    duration={2.4}
                  />
                </motion.div>
                <div className="mt-2 text-[11px] text-tertiary max-w-[15rem]">
                  {isRealCost
                    ? lang === "es" ? COST_COPY.es.cost : COST_COPY.en.cost
                    : lang === "es" ? COST_COPY.es.saver : COST_COPY.en.saver}
                </div>
              </div>

              {/* Expectancy in-plan vs out-of-plan */}
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* `text-secondary`, no `text-tertiary`: aquí la etiqueta
                      va sobre el tinte de ganancia/pérdida, no sobre la
                      página, y la terciaria se queda corta en ese fondo. */}
                  <div className="rounded-md p-3 bg-pnl-pos/10 border border-pnl-pos/20">
                    <div className="text-[10px] uppercase tracking-[0.15em] text-secondary">
                      {t("expInPlan")}
                    </div>
                    <div className="text-pnl-pos font-bold text-lg tnum mt-1">
                      <Money value={expInPlan} sign compact colorizeSign />
                    </div>
                  </div>
                  <div className="rounded-md p-3 bg-pnl-neg/10 border border-pnl-neg/20">
                    <div className="text-[10px] uppercase tracking-[0.15em] text-secondary">
                      {t("expOutPlan")}
                    </div>
                    <div className="text-pnl-neg font-bold text-lg tnum mt-1">
                      <Money value={expOutPlan} sign compact colorizeSign />
                    </div>
                  </div>
                </div>
                <DivergingBar inPlan={expInPlan} outPlan={expOutPlan} />
                <div className="flex items-center justify-between text-[10px] text-tertiary uppercase tracking-wider">
                  <span>{L("En plan", "In plan")}</span>
                  <span>{L("Fuera de plan", "Out of plan")}</span>
                </div>
              </div>
            </div>

            {/* ============ DISCIPLINE INVOICE — KEY FEATURE ============
                Invoice-style breakdown of each indiscipline type with
                count, % of total mistakes, and dollar cost. */}
            <div className="pt-5 border-t border-[rgb(var(--divider)/0.1)]">
              <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-1 h-4 bg-pnl-neg rounded-full shrink-0" />
                  <h3 className="text-[13px] font-medium text-primary tracking-[-0.01em]">
                    {L(
                      "Desglose por tipo de indisciplina",
                      "Breakdown by indiscipline type"
                    )}
                  </h3>
                </div>
                <span className="text-[10px] uppercase tracking-[0.14em] text-tertiary tnum">
                  {L("Coste en $", "Cost in $")}
                </span>
              </div>

              {/* Table header row */}
              <div className="grid grid-cols-[1fr_2.5rem_3rem_5.5rem] gap-x-3 px-2 pb-2 text-[10px] uppercase tracking-[0.14em] text-tertiary border-b border-[rgb(var(--divider)/0.1)] font-mono">
                <div>{L("Tipo", "Type")}</div>
                <div className="text-right">#</div>
                <div className="text-right">%</div>
                <div className="text-right">{L("Coste", "Cost")}</div>
              </div>

              {/* Body rows */}
              <div>
                {mistakeRows.map((row, i) => {
                  const pctOfTotal = totalMistakeCount
                    ? row.count / totalMistakeCount
                    : 0;
                  const isSaver = row.cost < 0;
                  return (
                    <motion.div
                      key={row.key}
                      initial={{ opacity: 0, y: 6 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-20px" }}
                      transition={{
                        duration: 0.4,
                        delay: i * 0.05,
                        ease: EASE,
                      }}
                      className={`grid grid-cols-[1fr_2.5rem_3rem_5.5rem] gap-x-3 px-2 py-2.5 items-center text-sm border-b border-dashed border-[rgb(var(--divider)/0.1)] hover:bg-[rgb(var(--divider)/0.025)] transition-colors font-mono ${
                        i % 2 === 1 ? "bg-[rgb(var(--divider)/0.012)]" : ""
                      }`}
                    >
                      <div className="text-secondary min-w-0 truncate flex items-center gap-2">
                        <span
                          aria-hidden
                          className={`inline-block w-1 h-1 rounded-full ${
                            isSaver ? "bg-pnl-pos" : "bg-pnl-neg"
                          }`}
                        />
                        <span className="italic">
                          {lang === "es" ? row.es : row.en}
                        </span>
                      </div>
                      <div className="text-right tnum text-secondary">
                        {fmtInt(row.count, lang)}
                      </div>
                      <div className="text-right tnum text-tertiary">
                        {fmtPct(pctOfTotal, lang, 0)}
                      </div>
                      <div
                        className={`text-right tnum font-semibold tabular-nums ${
                          isSaver ? "text-pnl-pos" : "text-pnl-neg"
                        }`}
                      >
                        {isSaver ? "+" : "−"}
                        {fmtMoney(Math.abs(row.cost), lang, { decimals: 0 })}
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Total row */}
              <div className="grid grid-cols-[1fr_2.5rem_3rem_5.5rem] gap-x-3 px-2 py-3 items-center mt-1 border-t-2 border-[rgb(var(--divider)/0.15)] font-mono">
                <div
                  className={`text-[11px] uppercase tracking-[0.15em] font-bold ${
                    totalMistakeCost < 0 ? "text-pnl-pos" : "text-pnl-neg"
                  }`}
                >
                  {L("Total", "Total")}
                </div>
                <div className="text-right tnum font-bold text-primary">
                  {fmtInt(totalMistakeCount, lang)}
                </div>
                <div className="text-right tnum text-tertiary">100%</div>
                <div
                  className={`text-right tnum font-bold ${
                    totalMistakeCost < 0 ? "text-pnl-pos" : "text-pnl-neg"
                  }`}
                >
                  {totalMistakeCost < 0 ? "+" : "−"}
                  {fmtMoney(Math.abs(totalMistakeCost), lang, { decimals: 0 })}
                </div>
              </div>

              <div className="mt-2 px-2 text-[10px] text-tertiary/80 italic leading-relaxed">
                {L(
                  "Σ (expectancy en plan − netPnl) sobre operaciones fuera de plan. El total coincide con el coste de indisciplina mostrado arriba.",
                  "Σ (expectancy in plan − netPnl) over out-of-plan trades. Total matches the cost of indiscipline shown above."
                )}
              </div>
            </div>

            {/* ============ COMPLIANCE TREND (monthly) — mirrors the
                real app's "evolution mensual del cumplimiento" with a
                labeled progress-bar per month. */}
            <div className="pt-5 border-t border-[rgb(var(--divider)/0.1)]">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-4 bg-[rgb(var(--accent-base))] rounded-full shrink-0" />
                <h3 className="text-[13px] font-medium text-primary tracking-[-0.01em]">
                  {L("Cumplimiento mensual", "Monthly compliance")}
                </h3>
              </div>
              <ul className="space-y-2">
                {complianceTrend.map((row, i) => (
                  <motion.li
                    key={row.label}
                    initial={{ opacity: 0, x: -8 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-20px" }}
                    transition={{ duration: 0.35, delay: i * 0.04, ease: EASE }}
                    className="grid grid-cols-[3rem_1fr_2.5rem] gap-3 items-center"
                  >
                    <span className="text-[11px] text-secondary tnum">
                      {row.label}
                    </span>
                    <div className="relative h-1.5 rounded-full bg-[rgb(var(--divider)/0.08)] overflow-hidden">
                      <motion.div
                        className="absolute inset-y-0 left-0 rounded-full"
                        style={{
                          backgroundColor:
                            row.fraction > 0.7
                              ? "rgb(var(--pnl-pos))"
                              : row.fraction > 0.5
                              ? "rgb(var(--pnl-warn))"
                              : "rgb(var(--pnl-neg))",
                        }}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${row.fraction * 100}%` }}
                        viewport={{ once: true, margin: "-20px" }}
                        transition={{ duration: 0.7, ease: EASE, delay: 0.1 + i * 0.04 }}
                      />
                    </div>
                    <span className="text-[11px] text-tertiary tnum text-right">
                      {fmtPct(row.fraction, lang, 0)}
                    </span>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Reveal>

      {/* Review tabs */}
      <Reveal delay={0.15}>
        <div className="demo-card p-5 md:p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-1 h-5 bg-[rgb(var(--accent-base))] rounded-full shrink-0" />
              <h2 className="font-medium text-primary text-base md:text-lg truncate">
                {t("review2")}
              </h2>
            </div>
            <div
              role="tablist"
              aria-label={t("review2")}
              className="relative inline-flex bg-[rgb(var(--divider)/0.05)] border border-[rgb(var(--divider)/0.1)] rounded-full p-1"
            >
              {(["weekly", "monthly"] as const).map((key) => {
                const active = tab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-controls="review-tabpanel"
                    onClick={() => setTab(key)}
                    className="relative px-4 py-1.5 text-xs font-medium"
                  >
                    {active && (
                      <motion.span
                        layoutId="review-tab-pill"
                        className="absolute inset-0 rounded-full bg-[rgb(var(--divider)/0.1)] border border-[rgb(var(--divider)/0.2)]"
                        transition={{
                          type: "spring",
                          stiffness: 360,
                          damping: 28,
                        }}
                      />
                    )}
                    <span
                      className={`relative ${
                        active ? "text-primary" : "text-tertiary"
                      }`}
                    >
                      {t(key)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              role="tabpanel"
              id="review-tabpanel"
              aria-label={tab === "weekly" ? t("weekly") : t("monthly")}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: EASE }}
            >
              {tab === "weekly" ? (
                <PnlBarChart data={weekly} />
              ) : (
                <PnlBarChart data={monthly} />
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-tertiary uppercase tracking-[0.14em]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-pnl-pos/70" />
              {L("Positivo", "Positive")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-pnl-neg/70" />
              {L("Negativo", "Negative")}
            </span>
          </div>
        </div>
      </Reveal>

      {/* History timeline */}
      <Reveal delay={0.2}>
        <div className="demo-card p-5 md:p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="w-1 h-5 bg-[rgb(var(--accent-base))] rounded-full shrink-0" />
            <h2 className="font-medium text-primary text-base md:text-lg">
              {t("history")}
            </h2>
          </div>

          <ul className="space-y-3">
            {history.map((entry, i) => {
              const tone =
                entry.sumPnl > 0
                  ? "pos"
                  : entry.sumPnl < 0
                  ? "neg"
                  : "warn";
              const borderColor =
                tone === "pos"
                  ? "border-l-pnl-pos"
                  : tone === "neg"
                  ? "border-l-pnl-neg"
                  : "border-l-pnl-warn";
              const complianceVariant =
                entry.compliance === "yes"
                  ? "pos"
                  : entry.compliance === "partial"
                  ? "warn"
                  : "neg";
              const complianceLabel =
                entry.compliance === "yes"
                  ? t("complied")
                  : entry.compliance === "partial"
                  ? t("partial")
                  : t("notComplied");
              return (
                <motion.li
                  key={entry.key}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{
                    duration: 0.5,
                    delay: 0.06 * i,
                    ease: EASE,
                  }}
                  whileHover={{ y: -2, transition: { type: "spring", stiffness: 300, damping: 24 } }}
                  className={`demo-card border-l-2 ${borderColor} p-4`}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="flex flex-col items-center justify-center w-11 h-11 rounded-md bg-[rgb(var(--divider)/0.05)] border border-[rgb(var(--divider)/0.1)] shrink-0">
                        <div className="text-[9.5px] uppercase tracking-[0.14em] text-tertiary leading-none">
                          {/* En UTC, como el resto de fechas de la
                              muestra (ver `format.ts`): sin fijarlo, el
                              taco de calendario y la fecha que lleva al
                              lado podían decir días distintos. */}
                          {entry.date
                            .toLocaleDateString(
                              lang === "es" ? "es-ES" : "en-US",
                              { month: "short", timeZone: "UTC" }
                            )
                            .replace(".", "")}
                        </div>
                        <div className="text-lg font-bold tnum text-primary leading-none mt-0.5">
                          {entry.date.getUTCDate()}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] text-tertiary tnum">
                            {fmtDate(entry.date, lang)}
                          </span>
                          <span className="text-tertiary" aria-hidden="true">
                            ·
                          </span>
                          <span className="text-[11px] text-tertiary tnum">
                            {entry.count}{" "}
                            {L("ops.", "trades")}
                          </span>
                          <span className="text-tertiary" aria-hidden="true">
                            ·
                          </span>
                          <span className="text-[11px] text-tertiary tnum">
                            {t("dayScore")}:{" "}
                            <span className="text-primary font-medium">
                              {entry.avgScore}/5
                            </span>
                          </span>
                        </div>
                        <p className="text-sm text-secondary mt-1 line-clamp-1">
                          {entry.note}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Chip variant={complianceVariant}>{complianceLabel}</Chip>
                      <div
                        className={`font-bold tnum text-base md:text-lg ${
                          tone === "pos"
                            ? "text-pnl-pos"
                            : tone === "neg"
                            ? "text-pnl-neg"
                            : "text-pnl-warn"
                        }`}
                      >
                        <Money value={entry.sumPnl} sign colorizeSign />
                      </div>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </div>
      </Reveal>

      <div className="h-2" aria-hidden="true" />
    </div>
  );
}
