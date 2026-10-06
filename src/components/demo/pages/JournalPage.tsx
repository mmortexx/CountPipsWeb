"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { useAlVer } from "@/hooks/use-al-ver";
import { Viajero } from "../Viajero";
import { useLang } from "@/lib/i18n";
import {
  TRADES,
  METRICS,
  weekdayBreakdown,
  monthlyBreakdown,
  cumplimientoMensual,
  nivelDisciplina,
  type Trade,
} from "@/lib/trading/data";
import { fmtInt, fmtNum, fmtDate, fmtOperaciones, fmtPct, pctSep, LOCALE_FECHA } from "@/lib/trading/format";
import { Eyebrow } from "@/components/tj/Eyebrow";
import { Chip } from "@/components/tj/Chip";
import { Money } from "@/components/tj/Money";
import { CountUp } from "@/components/tj/CountUp";
import { Reveal } from "@/components/tj/Reveal";
import { moverConFlechas } from "@/lib/flechas";

// Contenido bilingüe estático, sin claves de i18n.
interface ChecklistItem {
  id: string;
  es: string;
  en: string;
}

const PRE_ITEMS: ChecklistItem[] = [
  { id: "plan", es: "¿Plan definido?", en: "Is the plan defined?" },
  { id: "limits", es: "¿Límites de pérdida?", en: "Loss limits set?" },
  { id: "mind", es: "¿Estado mental listo?", en: "Mental state ready?" },
  { id: "news", es: "¿Noticias revisadas?", en: "News checked?" },
];

const POST_ITEMS: ChecklistItem[] = [
  { id: "respect", es: "¿Respetaste el plan?", en: "Did you respect the plan?" },
  { id: "mgmt", es: "¿Gestión correcta?", en: "Was management right?" },
  { id: "emotions", es: "¿Emociones controladas?", en: "Emotions in check?" },
  { id: "learn", es: "¿Aprendizaje extraído?", en: "Lesson extracted?" },
];

const PRE_PLACEHOLDER = {
  es: "Tu plan antes de abrir: sesgo, niveles, escenarios y riesgo máximo.",
  en: "Your plan before the open: bias, levels, scenarios and max risk.",
};
const POST_PLACEHOLDER = {
  es: "Cómo fue la sesión: qué hiciste bien, qué mejorar, cómo te sentiste.",
  en: "How the session went: what you did well, what to improve, how you felt.",
};
const COST_COPY = {
  es: { cost: "Lo que tu indisciplina te costó", saver: "Tu indisciplina te benefició esta vez" },
  en: { cost: "What your indiscipline cost you", saver: "Your indiscipline paid off this time" },
};

// Reparto del cumplimiento: la fila «Sí · a medias · no» de la app.
const NIVELES_CUMPLIMIENTO: { key: Trade["compliance"]; es: string; en: string; tono: string }[] = [
  { key: "yes", es: "Cumplí el plan", en: "Followed the plan", tono: "bg-pnl-pos" },
  { key: "partial", es: "Lo cumplí a medias", en: "Followed it partly", tono: "bg-pnl-warn" },
  { key: "no", es: "Me salté el plan", en: "Broke the plan", tono: "bg-pnl-neg" },
];

function repartoCumplimiento(trades: Trade[]) {
  return NIVELES_CUMPLIMIENTO.map((nivel) => ({
    ...nivel,
    count: trades.filter((t) => t.compliance === nivel.key).length,
  }));
}

function CheckMark({ checked }: { checked: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={16}
      height={16}
      aria-hidden="true"
      className="overflow-visible"
    >
      <path
        d="M5 12.5 L10 17.5 L19 7"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
        strokeDasharray={1}
        style={{ strokeDashoffset: checked ? 0 : 1, opacity: checked ? 1 : 0 }}
        className={`motion-safe:transition-[stroke-dashoffset,opacity] motion-safe:duration-[320ms] motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] ${checked ? "tj-dm-traza" : ""}`}
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
          className={`shrink-0 w-5 h-5 rounded-[2px] border flex items-center justify-center transition-colors ${
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

/** Nota del día, de 0 a 5 puntos. */
function DayScoreDots({
  value,
  onChange,
  idPrefix,
}: {
  value: number;
  onChange: (v: number) => void;
  idPrefix: string;
}) {
  const { lang } = useLang();
  return (
    <div
      className="flex items-center gap-1.5"
      role="radiogroup"
      aria-label={lang === "es" ? "Nota del día" : "Day score"}
    >
      {[0, 1, 2, 3, 4, 5].map((n) => {
        const active = n <= value;
        const isSelected = n === value;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={isSelected}
            tabIndex={isSelected ? 0 : -1}
            aria-label={
              n === 0
                ? lang === "es" ? "Sin nota" : "No score"
                : lang === "es" ? `Nota ${fmtInt(n, lang)}` : `Score ${fmtInt(n, lang)}`
            }
            onClick={() => onChange(n)}
            onKeyDown={(e) => moverConFlechas(e, n, onChange)}
            style={{ "--dm-pulsa": 0.8 } as CSSProperties}
            className="tj-dm-crece tj-dm-pulsa relative w-5 h-5"
          >
            <span
              className="absolute inset-0 rounded-[2px] bg-[rgb(var(--divider)/0.10)]"
            />
            <span
              className="absolute inset-0 rounded-[2px] bg-[rgb(var(--accent-base))] motion-safe:transition-[opacity,transform] motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ opacity: active ? 1 : 0, transform: active ? "none" : "scale(0.7)" }}
            />
            {isSelected && (
              <Viajero
                clave={`${idPrefix}-day-score-ring`}
                className="absolute -inset-1 rounded-[2px] border border-[rgb(var(--accent-base)/0.55)]"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Columna del ritual, antes o después del mercado. */
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
  score?: number;
  onScoreChange?: (n: number) => void;
  note: string;
  onNoteChange: (s: string) => void;
  accent: boolean;
  idPrefix: string;
  placeholder: string;
}) {
  const { t, lang } = useLang();
  const checkedCount = items.filter((it) => state[it.id]).length;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-[1px] ${
              accent ? "bg-[rgb(var(--accent-base))]" : "bg-pnl-pos"
            }`}
          />
          <h3 className="font-medium text-primary">{title}</h3>
        </div>
        <Chip variant="count" rounded="sm" className="tnum">
          {fmtInt(checkedCount, lang)}/{fmtInt(items.length, lang)}
        </Chip>
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

      <textarea
          aria-label={placeholder}
          value={note}
          onChange={(e) => onNoteChange(e.target.value)}
          rows={3}
          placeholder={placeholder}
          className="w-full bg-[rgb(var(--divider)/0.05)] border border-[rgb(var(--divider)/0.1)] rounded-[2px] p-3 text-sm text-primary placeholder:text-tertiary focus:border-[rgb(var(--divider)/0.2)] focus:bg-[rgb(var(--divider)/0.08)] outline-none transition-colors resize-none custom-scroll"
      />

      {score !== undefined && onScoreChange && (
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
      )}
    </div>
  );
}

/** Anillo de cumplimiento con el trazo animado. */
function ComplianceRing({ pct, label }: { pct: number; label: string }) {
  const { lang } = useLang();
  const alVer = useAlVer<HTMLDivElement>();
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
    <div
      ref={alVer}
      className="tj-dm-entra relative w-40 h-40 md:w-44 md:h-44 mx-auto"
      style={{ "--dm-s": 0.92, "--dm-o": 0.5 } as CSSProperties}
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
        {/* Se pasa un poco del valor y vuelve a él. */}
        <circle
          cx="60"
          cy="60"
          r={R}
          fill="none"
          stroke={`rgb(var(${colorVar}))`}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={C}
          className="tj-dm-anillo-rebasa"
          style={{ strokeDashoffset: targetOffset, "--dm-anillo": C, "--dm-rebase": overshootOffset } as CSSProperties}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className={`text-3xl md:text-4xl font-semibold tnum ${toneClass} leading-none`}>
          <CountUp to={pct * 100} decimals={0} suffix={pctSep(lang)} />
        </div>
        <div className="text-[10px] uppercase tracking-[0.15em] text-tertiary mt-1.5 text-center">
          {label}
        </div>
      </div>
    </div>
  );
}

/** Semáforo de disciplina: verde, ámbar o rojo. */
function TrafficLight({ level }: { level: "green" | "amber" | "red" }) {
  const { lang } = useLang();
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
  const lights: { key: "green" | "amber" | "red"; color: string }[] = [
    { key: "green", color: "rgb(var(--sig-green))" },
    { key: "amber", color: "rgb(var(--sig-amber))" },
    { key: "red", color: "rgb(var(--sig-red))" },
  ];
  return (
    <div
      className="flex items-center gap-2"
      role="status"
      aria-label={label}
    >
      {/* El alojamiento es un rebaje atado al tinte del sistema, legible en los
          dos temas; en negro fijo era una mancha sobre el papel claro. */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[2px] bg-[rgb(var(--divider)/0.10)] border border-[rgb(var(--divider)/0.1)]">
        {lights.map((l) => {
          const active = l.key === level;
          return (
            <div key={l.key} className="relative w-2.5 h-2.5">
              <span
                className="absolute inset-0 rounded-[1px] motion-safe:transition-[opacity,transform] motion-safe:duration-300"
                style={{
                  backgroundColor: l.color,
                  opacity: active ? 1 : 0.22,
                  transform: active ? "none" : "scale(0.7)",
                }}
              />
              <span
                aria-hidden
                className="absolute top-[1px] left-[1px] w-[3px] h-[3px] rounded-[1px] bg-[rgb(var(--divider)/0.55)] pointer-events-none"
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

/** Barra divergente: expectativa dentro del plan a la izquierda, fuera a la derecha. */
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
  const alVer = useAlVer<HTMLDivElement>();
  return (
    <div ref={alVer} className="relative h-2.5 rounded-[2px] bg-[rgb(var(--divider)/0.05)] overflow-hidden">
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[rgb(var(--divider)/0.25)] z-10" />
      <div
        className="tj-dm-ancho absolute top-0 bottom-0 right-1/2 bg-pnl-pos/80"
        style={{ width: `${inPct}%`, "--dm-retardo": "0.4s" } as CSSProperties}
      />
      <div
        className="tj-dm-ancho absolute top-0 bottom-0 left-1/2 bg-pnl-neg/80"
        style={{ width: `${outPct}%`, "--dm-retardo": "0.55s" } as CSSProperties}
      />
    </div>
  );
}

/** Barras de P&L semanal o mensual. */
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
              <div
                style={{ height: `${pct / 2}%`, "--dm-retardo": `${0.04 * i}s` } as CSSProperties}
                className={`tj-dm-alto absolute left-1/2 -translate-x-1/2 w-2/3 rounded-[2px] group-hover:w-4/5 transition-[width] ${
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

// Historial: las operaciones agrupadas por día.
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

// Check-in del día (tarjeta CHECK-IN DEL DÍA de JournalPage.xaml): sueño, estado mental y físico y plan.
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
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              aria-label={`${label} ${n}`}
              onClick={() => onChange(n)}
              onKeyDown={(e) => moverConFlechas(e, n - 1, (i) => onChange(i + 1))}
              className="tj-dm-pulsa relative h-8 rounded-[2px] border transition-colors"
              style={{
                "--dm-pulsa": 0.92,
                backgroundColor: active
                  ? "rgb(var(--accent-base) / 0.55)"
                  : "rgb(var(--divider) / 0.06)",
                borderColor: active
                  ? "rgb(var(--accent-base) / 0.75)"
                  : "rgb(var(--divider) / 0.16)",
              } as CSSProperties}
            >
              {isSelected && (
                <Viajero
                  clave={`segmented-ring-${label}`}
                  className="absolute -inset-px rounded-[2px] border border-[rgb(var(--accent-base)/0.55)] pointer-events-none"
                />
              )}
            </button>
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
  const pct = Math.min(100, (hours / 12) * 100);
  return (
    <div className="space-y-2.5">
      <span className="block text-[11px] uppercase tracking-[0.15em] text-tertiary">
        {lang === "es" ? "Sueño" : "Sleep"}
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          style={{ "--dm-pulsa": 0.9 } as CSSProperties}
          onClick={onMinus}
          aria-label={lang === "es" ? "Restar 0,5 h" : "Subtract 0.5 h"}
          className="tj-dm-pulsa shrink-0 w-9 h-9 rounded-[2px] border border-[rgb(var(--divider)/0.15)] text-secondary hover:text-primary hover:border-[rgb(var(--divider)/0.3)] transition-colors flex items-center justify-center"
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
        </button>
        <div className="flex-1 space-y-1.5 text-center">
          <div className="text-2xl font-semibold tnum text-primary leading-none">
            {fmtNum(hours, lang, 1)}
            <span className="text-xs text-tertiary font-normal ml-1">h</span>
          </div>
          <div className="relative h-1.5 rounded-[2px] bg-[rgb(var(--divider)/0.08)] overflow-hidden">
            <div
              className="tj-dm-ancho absolute inset-y-0 left-0 rounded-[2px] bg-[rgb(var(--accent-base))]"
              style={{ width: `${pct}%`, "--dm-dur": "0.6s" } as CSSProperties}
            />
          </div>
        </div>
        <button
          type="button"
          style={{ "--dm-pulsa": 0.9 } as CSSProperties}
          onClick={onPlus}
          aria-label={lang === "es" ? "Sumar 0,5 h" : "Add 0.5 h"}
          className="tj-dm-pulsa shrink-0 w-9 h-9 rounded-[2px] border border-[rgb(var(--divider)/0.15)] text-secondary hover:text-primary hover:border-[rgb(var(--divider)/0.3)] transition-colors flex items-center justify-center"
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
        </button>
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
      <span className="block text-[11px] uppercase tracking-[0.15em] text-tertiary">
        {lang === "es" ? "Plan del día" : "Today’s plan"}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={onToggle}
        className="inline-flex items-center gap-2.5 group"
      >
        <span
          className={`relative w-11 h-6 rounded-[2px] transition-colors ${
            on ? "bg-[rgb(var(--accent-base))]" : "bg-pnl-warn/40"
          }`}
        >
          <span
            className={`absolute top-0.5 motion-safe:transition-[left] motion-safe:duration-300 motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] ${
              on ? "left-[1.375rem]" : "left-0.5"
            } w-5 h-5 rounded-[2px] ${
              // Contraste con su pista, no blanco fijo (desaparecía en el tema
              // claro): tinta de acento sobre el acento, tinta normal sobre el aviso.
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

export function JournalPage() {
  const { t, lang } = useLang();
  const alVer = useAlVer<HTMLElement>();

  // Estado del check-in, como el JournalViewModel de la app.
  const [sleepHours, setSleepHours] = useState(7.0);
  const [mental, setMental] = useState(4);
  const [physical, setPhysical] = useState(3);
  const [hasPlan, setHasPlan] = useState(true);

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
  const [postScore, setPostScore] = useState(4);
  const [preNote, setPreNote] = useState("");
  const [postNote, setPostNote] = useState("");

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

  const reparto = useMemo(() => repartoCumplimiento(TRADES), []);
  const totalReparto = reparto.reduce((s, r) => s + r.count, 0);

  const compliancePct = METRICS.compliancePct;
  const costOfIndiscipline = METRICS.costOfIndiscipline;
  const expInPlan = METRICS.expectancyInPlan;
  const expOutPlan = METRICS.expectancyBrokePlan;

  const isRealCost = costOfIndiscipline > 0;
  const headlineValue = Math.abs(costOfIndiscipline);
  const headlineSigno = isRealCost ? "−" : "+";
  const headlinePrefix = lang === "es" ? headlineSigno : `${headlineSigno}$`;
  const headlineSuffix = lang === "es" ? "\u00a0$" : "";
  const headlineTone = isRealCost ? "text-pnl-neg" : "text-pnl-pos";
  const headlineShadow = isRealCost
    ? "0 0 18px rgb(var(--pnl-neg) / 0.45)"
    : "0 0 18px rgb(var(--pnl-pos) / 0.35)";

  const trafficLevel = ({ alta: "green", media: "amber", baja: "red" } as const)[nivelDisciplina(compliancePct)];

  // Cruces sueño, mental, físico y plan × resultado, deterministas sobre la muestra.
  const cross = useMemo(() => {
    // Sueño y estado físico salen de la nota del día con un desvío fijo por
    // operación, para que cada cruce agrupe operaciones distintas.
    const avg = (arr: Trade[]) =>
      arr.length ? arr.reduce((s, t) => s + t.netPnl, 0) / arr.length : 0;
    const sueno = (t: Trade) => t.dayScore + ((t.id * 7) % 3) - 1;
    const fisico = (t: Trade) => t.dayScore + ((t.id * 5) % 3) - 1;
    const cruce = (f: (t: Trade) => number, bajo: number, alto: number) => {
      const b = TRADES.filter((t) => f(t) <= bajo);
      const a = TRADES.filter((t) => f(t) >= alto);
      return { low: avg(b), high: avg(a), n: b.length + a.length };
    };
    const ops = (n: number) => fmtOperaciones(n, lang);
    const s = cruce(sueno, 2, 4);
    const m = cruce((t) => t.dayScore, 2, 4);
    const f = cruce(fisico, 2, 4);
    return {
      sleepLow: s.low,
      sleepHigh: s.high,
      sleepSample: ops(s.n),
      mentalLow: m.low,
      mentalHigh: m.high,
      mentalSample: ops(m.n),
      physicalLow: f.low,
      physicalHigh: f.high,
      physicalSample: ops(f.n),
      planWith: avg(TRADES.filter((t) => t.compliance === "yes")),
      planWithout: avg(TRADES.filter((t) => t.compliance !== "yes")),
      planSample: ops(TRADES.length),
    };
  }, [lang]);

  // Tira de racha de check-in de 30 días, determinista. El estado del LCG va
  // dentro del memo para no reasignarse entre renders (react-hooks/immutability).
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

  // Tendencia mensual de cumplimiento, calculada sobre la muestra.
  const complianceTrend = useMemo(() => {
    const mes = new Intl.DateTimeFormat(LOCALE_FECHA[lang], { month: "short", timeZone: "UTC" });
    return cumplimientoMensual(TRADES).map((m) => {
      const nombre = mes.format(m.inicio).replace(".", "");
      return { label: nombre.charAt(0).toUpperCase() + nombre.slice(1), fraction: m.fraccion };
    });
  }, [lang]);

  const togglePre = (id: string) =>
    setPreState((p) => ({ ...p, [id]: !p[id] }));
  const togglePost = (id: string) =>
    setPostState((p) => ({ ...p, [id]: !p[id] }));

  const L = (es: string, en: string) => (lang === "es" ? es : en);

  return (
    <div className="relative p-5 md:p-6 space-y-5">
      <Reveal>
        <header className="space-y-3 relative">
          <div className="relative">
            <Eyebrow>{t("journalEyebrow")}</Eyebrow>
            {/* h2 y no h1: es una pantalla simulada dentro de la página de la
                demo, cuyo h1 es el del documento; dos h1 rompen la jerarquía. */}
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

      <Reveal delay={0.05}>
        <div className="demo-card p-5 md:p-6">
          <div className="space-y-5">
            <div className="space-y-1">
              <Eyebrow>
                {L("Check-in del día", "Today’s check-in")}
              </Eyebrow>
              <p className="text-xs text-tertiary leading-relaxed max-w-xl">
                {L(
                  "Registra tu estado antes de operar. Los cruces debajo contrastan cada campo con el resultado real del día.",
                  "Log your state before trading. The crosses below contrast each field with the day’s actual result."
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
                display={`${fmtInt(mental, lang)}/5`}
              />
              <SegmentedMeter
                value={physical}
                onChange={setPhysical}
                label={L("Estado físico", "Physical state")}
                display={`${fmtInt(physical, lang)}/5`}
              />
              <PlanToggle on={hasPlan} onToggle={() => setHasPlan((p) => !p)} />
            </div>

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
                  sample={cross.mentalSample}
                />
                <CrossCell
                  label={L("Físico × resultado", "Physical × result")}
                  lowLabel={L("Bajo", "Low")}
                  highLabel={L("Alto", "High")}
                  lowValue={cross.physicalLow}
                  highValue={cross.physicalHigh}
                  sample={cross.physicalSample}
                />
                <CrossCell
                  label={L("Plan × resultado", "Plan × result")}
                  lowLabel={L("Sin plan", "No plan")}
                  highLabel={L("Con plan", "With plan")}
                  lowValue={cross.planWithout}
                  highValue={cross.planWith}
                  sample={cross.planSample}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[rgb(var(--divider)/0.1)]">
              <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
                <span className="text-[10px] uppercase tracking-[0.14em] text-tertiary">
                  {L("Constancia del check-in · 30 días", "Check-in consistency · 30 days")}
                </span>
                {/* `flex-wrap`: las dos pastillas piden 5 px más de los que hay a 320 px. */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Etiquetas en `text-secondary`: la terciaria se calibra para el
                      fondo plano y aquí se apoya en el tinte del acento. */}
                  <span className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-[2px] bg-[rgb(var(--accent-base)/0.12)] border border-[rgb(var(--accent-base)/0.3)]">
                    <span className="text-[10px] uppercase tracking-[0.12em] text-secondary">
                      {L("Actual", "Current")}
                    </span>
                    <span className="text-sm font-semibold tnum text-primary leading-none">
                      {fmtInt(currentStreak, lang)}
                    </span>
                    <span className="text-[10px] text-secondary">
                      {L("días", "days")}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 h-7 rounded-[2px] bg-[rgb(var(--divider)/0.04)] border border-[rgb(var(--divider)/0.1)]">
                    <span className="text-[10px] uppercase tracking-[0.12em] text-tertiary">
                      {L("Mejor", "Best")}
                    </span>
                    <span className="text-sm font-semibold tnum text-primary leading-none">
                      {fmtInt(bestStreak, lang)}
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
                    className="flex-1 h-full rounded-[2px]"
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

      <Reveal delay={0.05}>
        <div className="demo-card p-5 md:p-6">
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-1 h-5 bg-[rgb(var(--accent-base))] rounded-[1px] shrink-0" />
              {/* `sm:truncate` y no `truncate`: a 320 px los titulares perdían hasta
                  173 px de texto; bajo `sm` se parten en dos líneas. */}
              <h2 className="font-medium text-primary text-base md:text-lg sm:truncate">
                {t("ritualTitle")}
              </h2>
            </div>
            <Chip variant="accent" rounded="sm" className="shrink-0">
              {L("Hoy", "Today")}
            </Chip>
          </div>

          <div className="relative grid md:grid-cols-2 gap-6 md:gap-8">
            <RitualColumn
              title={t("preMarket")}
              items={PRE_ITEMS}
              state={preState}
              onToggle={togglePre}
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
              <div className="h-px bg-[rgb(var(--divider)/0.12)]" />
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
              <div className="h-full w-px bg-[rgb(var(--divider)/0.12)]" />
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="demo-card relative overflow-hidden p-5 md:p-6">
          <div className="relative space-y-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-1 h-5 bg-pnl-warn rounded-[1px] shrink-0" />
              <h2 className="font-medium text-primary text-base md:text-lg sm:truncate">
                  {t("disciplineReport")}
                </h2>
              </div>
              <TrafficLight level={trafficLevel} />
            </div>

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
                <div
                  ref={alVer}
                  className={`tj-dm-entra relative font-semibold tracking-tight text-4xl md:text-5xl tnum ${headlineTone}`}
                  style={{ textShadow: headlineShadow, "--dm-o": 0.55, "--dm-s": 0.94, "--dm-dur": "0.7s", "--dm-retardo": "0.15s" } as CSSProperties}
                >
                  <CountUp
                    to={headlineValue}
                    decimals={0}
                    prefix={headlinePrefix}
                    suffix={headlineSuffix}
                    duration={2.4}
                  />
                </div>
                <div className="mt-2 text-[11px] text-tertiary max-w-[15rem]">
                  {isRealCost
                    ? lang === "es" ? COST_COPY.es.cost : COST_COPY.en.cost
                    : lang === "es" ? COST_COPY.es.saver : COST_COPY.en.saver}
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {/* `text-secondary`: la etiqueta va sobre el tinte de ganancia o
                      pérdida y la terciaria se queda corta de contraste. */}
                  <div className="rounded-[2px] p-3 bg-pnl-pos/10 border border-pnl-pos/20">
                    <div className="text-[10px] uppercase leading-[1.25] tracking-[0.12em] text-secondary [overflow-wrap:anywhere]">
                      {t("expInPlan")}
                    </div>
                    <div className="mt-1 break-words font-semibold tnum text-pnl-pos text-base sm:text-lg">
                      <Money value={expInPlan} sign compact colorizeSign />
                    </div>
                  </div>
                  <div className="rounded-[2px] p-3 bg-pnl-neg/10 border border-pnl-neg/20">
                    <div className="text-[10px] uppercase leading-[1.25] tracking-[0.12em] text-secondary [overflow-wrap:anywhere]">
                      {t("expOutPlan")}
                    </div>
                    <div className="mt-1 break-words font-semibold tnum text-pnl-neg text-base sm:text-lg">
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

            {/* Reparto sí · a medias · no. Solo «me salté el plan» entra
                en el coste de indisciplina (DisciplineCalculator de la app). */}
            <div className="pt-5 border-t border-[rgb(var(--divider)/0.1)]">
              <div className="flex items-center gap-2 mb-3 min-w-0">
                <span className="w-1 h-4 bg-pnl-neg rounded-[1px] shrink-0" />
                <h3 className="text-[13px] font-medium text-primary tracking-[-0.01em]">
                  {L("Sí · a medias · no", "Yes · partly · no")}
                </h3>
              </div>

              <div className="flex h-1.5 w-full overflow-hidden rounded-[1px] bg-[rgb(var(--divider)/0.08)]" aria-hidden>
                {reparto.map((r) => (
                  <span
                    key={r.key}
                    className={r.tono}
                    style={{ width: `${totalReparto ? (r.count / totalReparto) * 100 : 0}%` }}
                  />
                ))}
              </div>

              <table className="mt-3 w-full text-sm tnum">
                <thead>
                  <tr className="text-[10px] uppercase tracking-[0.14em] text-tertiary border-b border-[rgb(var(--divider)/0.1)]">
                    <th scope="col" className="px-2 pb-2 text-left font-normal">{L("Cumplimiento", "Compliance")}</th>
                    <th scope="col" className="px-2 pb-2 text-right font-normal">{L("Operaciones", "Trades")}</th>
                    <th scope="col" className="px-2 pb-2 text-right font-normal">%</th>
                  </tr>
                </thead>
                <tbody>
                  {reparto.map((r) => (
                    <tr key={r.key} className="border-b border-dashed border-[rgb(var(--divider)/0.1)]">
                      <th scope="row" className="px-2 py-2.5 text-left font-normal text-secondary">
                        <span className="flex items-center gap-2">
                          <span aria-hidden className={`inline-block h-1.5 w-1.5 rounded-[1px] ${r.tono}`} />
                          {lang === "es" ? r.es : r.en}
                        </span>
                      </th>
                      <td className="px-2 py-2.5 text-right text-secondary">{fmtInt(r.count, lang)}</td>
                      <td className="px-2 py-2.5 text-right text-tertiary">
                        {fmtPct(totalReparto ? r.count / totalReparto : 0, lang, 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="mt-2 px-2 text-[11px] text-tertiary leading-relaxed">
                {L(
                  "El coste de indisciplina es el resultado neto de las operaciones que marcaste como «me salté el plan». Las de «a medias» bajan tu cumplimiento, pero no entran en el coste.",
                  "The cost of indiscipline is the net result of the trades you marked “broke the plan”. “Partly” trades lower your compliance but don’t count towards the cost."
                )}
              </p>
            </div>

            <div className="pt-5 border-t border-[rgb(var(--divider)/0.1)]">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-1 h-4 bg-[rgb(var(--accent-base))] rounded-[1px] shrink-0" />
                <h3 className="text-[13px] font-medium text-primary tracking-[-0.01em]">
                  {L("Cumplimiento mensual", "Monthly compliance")}
                </h3>
              </div>
              <ul className="space-y-2">
                {complianceTrend.map((row, i) => (
                  <li
                    key={row.label}
                    ref={alVer}
                    style={{ "--dm-x": "-8px", "--dm-dur": "0.35s", "--dm-retardo": `${i * 0.04}s` } as CSSProperties}
                    className="tj-dm-entra grid grid-cols-[3rem_1fr_2.5rem] gap-3 items-center"
                  >
                    <span className="text-[11px] text-secondary tnum">
                      {row.label}
                    </span>
                    <div className="relative h-1.5 rounded-[2px] bg-[rgb(var(--divider)/0.08)] overflow-hidden">
                      <div
                        className="tj-dm-ancho absolute inset-y-0 left-0 rounded-[2px]"
                        style={{
                          backgroundColor:
                            row.fraction > 0.7
                              ? "rgb(var(--pnl-pos))"
                              : row.fraction > 0.5
                              ? "rgb(var(--pnl-warn))"
                              : "rgb(var(--pnl-neg))",
                          width: `${row.fraction * 100}%`,
                          "--dm-dur": "0.7s",
                          "--dm-retardo": `${0.1 + i * 0.04}s`,
                        } as CSSProperties}
                      />
                    </div>
                    <span className="text-[11px] text-tertiary tnum text-right">
                      {fmtPct(row.fraction, lang, 0)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.15}>
        <div className="demo-card p-5 md:p-6">
          <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-1 h-5 bg-[rgb(var(--accent-base))] rounded-[1px] shrink-0" />
              {/* `sm:truncate`, por lo mismo que en el titular del ritual. */}
              <h2 className="font-medium text-primary text-base md:text-lg sm:truncate">
                {t("review2")}
              </h2>
            </div>
            <div
              role="tablist"
              aria-label={t("review2")}
              className="relative inline-flex bg-[rgb(var(--divider)/0.05)] border border-[rgb(var(--divider)/0.1)] rounded-[2px] p-1"
            >
              {(["weekly", "monthly"] as const).map((key, i, claves) => {
                const active = tab === key;
                return (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-controls="review-tabpanel"
                    tabIndex={active ? 0 : -1}
                    onClick={() => setTab(key)}
                    onKeyDown={(e) => moverConFlechas(e, i, (j) => setTab(claves[j]))}
                    className="relative px-4 py-1.5 text-xs font-medium"
                  >
                    {active && (
                      <Viajero
                        clave="review-tab-pill"
                        className="absolute inset-0 rounded-[2px] bg-[rgb(var(--divider)/0.1)] border border-[rgb(var(--divider)/0.2)]"
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

          <div
            key={tab}
            role="tabpanel"
            id="review-tabpanel"
            aria-label={tab === "weekly" ? t("weekly") : t("monthly")}
            className="tj-dm-entra"
            style={{ "--dm-y": "8px", "--dm-dur": "0.28s" } as CSSProperties}
          >
            {tab === "weekly" ? (
              <PnlBarChart data={weekly} />
            ) : (
              <PnlBarChart data={monthly} />
            )}
          </div>

          <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-tertiary uppercase tracking-[0.14em]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-pnl-pos/70" />
              {L("Positivo", "Positive")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-[2px] bg-pnl-neg/70" />
              {L("Negativo", "Negative")}
            </span>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.2}>
        <div className="demo-card p-5 md:p-6">
          <div className="flex items-center gap-2 mb-5">
            <span className="w-1 h-5 bg-[rgb(var(--accent-base))] rounded-[1px] shrink-0" />
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
                <li
                  key={entry.key}
                  ref={alVer}
                  style={{ "--dm-x": "-10px", "--dm-dur": "0.5s", "--dm-retardo": `${0.06 * i}s` } as CSSProperties}
                  className={`tj-dm-entra tj-dm-alza demo-card border-l-2 ${borderColor} p-4`}
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="flex flex-col items-center justify-center w-11 h-11 rounded-[2px] bg-[rgb(var(--divider)/0.05)] border border-[rgb(var(--divider)/0.1)] shrink-0">
                        <div className="text-[9.5px] uppercase tracking-[0.14em] text-tertiary leading-none">
                          {/* En UTC, como el resto de fechas de la muestra (ver `format.ts`):
                              si no, el taco y la fecha de al lado podían diferir. */}
                          {entry.date
                            .toLocaleDateString(
                              LOCALE_FECHA[lang],
                              { month: "short", timeZone: "UTC" }
                            )
                            .replace(".", "")}
                        </div>
                        <div className="text-lg font-semibold tnum text-primary leading-none mt-0.5">
                          {fmtInt(entry.date.getUTCDate(), lang)}
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
                            {fmtInt(entry.count, lang)}{" "}
                            {L("ops.", "trades")}
                          </span>
                          <span className="text-tertiary" aria-hidden="true">
                            ·
                          </span>
                          <span className="text-[11px] text-tertiary tnum">
                            {t("dayScore")}:{" "}
                            <span className="text-primary font-medium">
                              {fmtInt(entry.avgScore, lang)}/5
                            </span>
                          </span>
                        </div>
                        <p className="text-sm text-secondary mt-1 line-clamp-1">
                          {entry.note}
                        </p>
                      </div>
                    </div>
                    {/* `w-full` bajo `sm`: este grupo es `shrink-0` y a 390 px dejaba 60 px
                        al de la fecha y la nota, que partía «16 jul 2026» en tres líneas.
                        En su propia línea, el otro grupo recupera el ancho. */}
                    <div className="flex items-center gap-2 w-full justify-between sm:w-auto sm:justify-start shrink-0">
                      <Chip variant={complianceVariant}>{complianceLabel}</Chip>
                      <div
                        className={`break-words font-semibold tnum text-sm sm:text-base md:text-lg ${
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
                </li>
              );
            })}
          </ul>
        </div>
      </Reveal>

      <div className="h-2" aria-hidden="true" />
    </div>
  );
}
