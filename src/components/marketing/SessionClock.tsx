"use client";

import { useState, useEffect, useMemo } from "react";
import { useLang } from "@/lib/i18n";

/**
 * SessionClock — reloj de sesiones de trading (Asia / London / New York).
 *
 * Muestra qué sesiones están abiertas AHORA (según la hora local del
 * visitante), cuáles se solapan (ventanas de mayor volatilidad) y una
 * banda horizontal de 24h con las sesiones pintadas.
 *
 * ── Por qué en /about ─────────────────────────────────────────────────
 * /about cuenta la historia y los valores del producto. Una herramienta
 * práctica que el trader puede usar cada día refuerza que CountPips
 * entiende su rutina. Es pegadiza: la gente vuelve a mirar qué sesión
 * toca.
 *
 * ── Horarios (UTC, horas redondeadas) ─────────────────────────────────
 *   · Asia    : 00:00–09:00 UTC  (Tokio 09:00–18:00 JST)
 *   · London  : 07:00–16:00 UTC  (08:00–17:00 London)
 *   · New York: 12:00–21:00 UTC  (08:00–17:00 ET)
 * Solapes clave:
 *   · London ∩ NY   : 12:00–16:00 UTC  (la ventana más líquida)
 *   · Asia  ∩ London: 07:00–09:00 UTC
 *
 * Se calcula en el cliente (usa la hora local del navegador convertida
 * a UTC) para que sea correcta sin importar la zona del visitante.
 *
 * ── Material ──────────────────────────────────────────────────────────
 * .tj-paper + .tj-paper-glow. Sin overflow mobile. Actualiza cada minuto.
 */
type Session = {
  id: "sydney" | "asia" | "london" | "ny";
  nameEs: string;
  nameEn: string;
  startUtc: number; // hour 0-24
  endUtc: number;
  color: string;
  cityEs: string;
  cityEn: string;
  avgVolatilityPips: number;
};

type Killzone = {
  id: string;
  nameEs: string;
  nameEn: string;
  startUtc: number;
  endUtc: number;
  descriptionEs: string;
  descriptionEn: string;
};

const SESSIONS: Session[] = [
  { id: "sydney", nameEs: "Sídney", nameEn: "Sydney", startUtc: 21, endUtc: 6, color: "rgb(var(--sig-purple, 168 85 247))", cityEs: "Sídney", cityEn: "Sydney", avgVolatilityPips: 42 },
  { id: "asia", nameEs: "Asia / Tokio", nameEn: "Asia / Tokyo", startUtc: 0, endUtc: 9, color: "rgb(var(--sig-amber))", cityEs: "Tokio", cityEn: "Tokyo", avgVolatilityPips: 58 },
  { id: "london", nameEs: "Londres", nameEn: "London", startUtc: 7, endUtc: 16, color: "rgb(var(--accent-base))", cityEs: "Londres", cityEn: "London", avgVolatilityPips: 94 },
  { id: "ny", nameEs: "Nueva York", nameEn: "New York", startUtc: 12, endUtc: 21, color: "rgb(var(--pnl-pos))", cityEs: "Nueva York", cityEn: "New York", avgVolatilityPips: 112 },
];

const KILLZONES: Killzone[] = [
  { id: "london_open", nameEs: "London Open Killzone", nameEn: "London Open Killzone", startUtc: 7, endUtc: 10, descriptionEs: "Inyección masiva de liquidez europea y establecimiento del rango diario.", descriptionEn: "Massive European liquidity injection establishing the initial daily range." },
  { id: "ny_open", nameEs: "NY Open Killzone", nameEn: "NY Open Killzone", startUtc: 12, endUtc: 15, descriptionEs: "Solape transatlántico de máxima volatilidad y volumen de negociación.", descriptionEn: "Transatlantic overlap with highest volatility and trading volume." },
  { id: "london_close", nameEs: "London Close Killzone", nameEn: "London Close Killzone", startUtc: 15, endUtc: 16.5, descriptionEs: "Tomas de beneficio de mesas institucionales y reversiones de fin de sesión.", descriptionEn: "Institutional profit taking and end-of-day mean reversions." },
];

type TimezoneMode = "local" | "utc" | "est" | "cet";

export function SessionClock({ num = "02" }: { num?: string }) {
  const { lang } = useLang();
  const es = lang === "es";

  const [utcHour, setUtcHour] = useState<number | null>(null);
  const [localTz, setLocalTz] = useState("");
  const [tzMode, setTzMode] = useState<TimezoneMode>("local");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const h = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
      setUtcHour(h);
      try {
        setLocalTz(Intl.DateTimeFormat().resolvedOptions().timeZone || "");
      } catch {
        setLocalTz("UTC");
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, []);

  const sessionIsOpen = (s: Session, h: number): boolean => {
    if (s.startUtc < s.endUtc) return h >= s.startUtc && h < s.endUtc;
    return h >= s.startUtc || h < s.endUtc;
  };

  // Estado de cada sesión
  const states = useMemo(() => {
    if (utcHour === null) return null;
    return SESSIONS.map((s) => ({
      ...s,
      open: sessionIsOpen(s, utcHour),
    }));
  }, [utcHour]);

  // Killzones activas
  const activeKillzones = useMemo(() => {
    if (utcHour === null) return [];
    return KILLZONES.filter((kz) => utcHour >= kz.startUtc && utcHour < kz.endUtc);
  }, [utcHour]);

  // Solapes activos
  const overlaps = useMemo(() => {
    if (utcHour === null) return [];
    const active = SESSIONS.filter((s) => sessionIsOpen(s, utcHour));
    if (active.length < 2) return [];
    const pairs: { a: Session; b: Session; label: string }[] = [];
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        pairs.push({
          a: active[i],
          b: active[j],
          label: `${active[i].nameEn} ∩ ${active[j].nameEn}`,
        });
      }
    }
    return pairs;
  }, [utcHour]);

  // Próxima sesión en abrir con temporizador en tiempo real
  const nextSession = useMemo(() => {
    if (utcHour === null) return null;
    const closed = SESSIONS.filter((s) => !sessionIsOpen(s, utcHour));
    if (closed.length === 0) return null;

    let closest: { session: Session; hoursUntil: number } | null = null;
    for (const s of closed) {
      let diff = s.startUtc - utcHour;
      if (diff < 0) diff += 24;
      if (!closest || diff < closest.hoursUntil) {
        closest = { session: s, hoursUntil: diff };
      }
    }
    return closest;
  }, [utcHour]);

  const tzOffset = useMemo(() => {
    if (utcHour === null) return 0;
    if (tzMode === "utc") return 0;
    if (tzMode === "est") return -5;
    if (tzMode === "cet") return 1;
    if (typeof window !== "undefined") {
      return -new Date().getTimezoneOffset() / 60;
    }
    return 0;
  }, [tzMode, utcHour]);

  const openCount = states?.filter((s) => s.open).length ?? 0;

  const fmtHour = (h: number) => {
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
  };

  // Para la banda de 24h: cada hora = 100/24 % de ancho
  const hourPct = (h: number) => (h / 24) * 100;

  return (
    <section className="section-tight bg-veil border-t border-[rgb(var(--divider)/0.06)]">
      <div className="tj-container">
        <div className="max-w-2xl mb-8">
          <div className="inline-flex items-center gap-3 mb-5">
            <span className="tnum" style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.04em", color: "rgb(var(--accent-base))" }}>
              § {num}
            </span>
            <span aria-hidden style={{ width: 22, height: 1, background: "rgb(var(--divider) / 0.13)" }} />
            <span className="tnum" style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--ink-3)" }}>
              {es ? "SESIONES Y KILLZONES" : "SESSIONS & KILLZONES"}
            </span>
          </div>
          <h2
            className="font-serif m-0"
            style={{
              fontSize: "clamp(1.85rem, 3.3vw, 2.8rem)",
              fontWeight: 400,
              letterSpacing: "-0.022em",
              lineHeight: 1.1,
              color: "var(--ink)",
              textWrap: "balance",
            }}
          >
            {es ? (
              <>
                ¿Qué sesión y killzone <span style={{ color: "rgb(var(--accent-base))" }}>están activas</span>?
              </>
            ) : (
              <>
                Which session and killzone <span style={{ color: "rgb(var(--accent-base))" }}>are active</span>?
              </>
            )}
          </h2>
          <p className="mt-4" style={{ fontSize: "clamp(1rem, 1.2vw, 1.08rem)", lineHeight: 1.6, color: "var(--ink-2)" }}>
            {es
              ? "Monitor en tiempo real de las 4 plazas mundiales, solapes de alta liquidez y las ventanas institucionales de ejecución (Killzones)."
              : "Real-time monitor across 4 global sessions, high-liquidity overlaps, and institutional execution windows (Killzones)."}
          </p>

          {/* Selector de zona horaria */}
          <div className="mt-5 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] uppercase tracking-wider text-tertiary mr-1">
              {es ? "Referencia horaria:" : "Timezone reference:"}
            </span>
            {[
              { id: "local" as const, labelEs: `Local (${localTz || "Auto"})`, labelEn: `Local (${localTz || "Auto"})` },
              { id: "utc" as const, labelEs: "UTC (Global)", labelEn: "UTC (Global)" },
              { id: "est" as const, labelEs: "EST (Nueva York)", labelEn: "EST (New York)" },
              { id: "cet" as const, labelEs: "CET (Europa Central)", labelEn: "CET (Central Europe)" },
            ].map((tz) => (
              <button
                key={tz.id}
                type="button"
                onClick={() => setTzMode(tz.id)}
                className={`min-h-[32px] px-3 rounded-[2px] text-xs font-mono transition-colors ${
                  tzMode === tz.id
                    ? "bg-[rgb(var(--accent-base))] text-[rgb(var(--accent-ink))] font-semibold"
                    : "bg-[rgb(var(--divider)/0.04)] border border-[rgb(var(--divider)/0.1)] text-secondary hover:text-primary"
                }`}
              >
                {es ? tz.labelEs : tz.labelEn}
              </button>
            ))}
          </div>
        </div>

        {/* Live status cards: 4 plazas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {SESSIONS.map((s) => {
            const open = states?.find((x) => x.id === s.id)?.open ?? false;
            return (
              <div
                key={s.id}
                className="tj-paper rounded-[2px] p-4 transition-[border-color,transform] duration-200 ease-[var(--ease-suave)] hover:-translate-y-0.5"
                style={{
                  border: `1px solid color-mix(in oklab, ${open ? s.color : "rgb(var(--divider))"} ${open ? "40%" : "14%"}, transparent)`,
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                      {es ? s.nameEs : s.nameEn}
                    </div>
                    <div className="text-[11px]" style={{ color: "var(--ink-3)" }}>
                      {s.cityEn} · {fmtHour(s.startUtc)}–{fmtHour(s.endUtc)} UTC
                    </div>
                  </div>
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.1em]"
                    style={{
                      background: open ? `color-mix(in oklab, ${s.color} 14%, transparent)` : "color-mix(in oklab, rgb(var(--divider)) 8%, transparent)",
                      color: open ? s.color : "var(--ink-3)",
                      border: `1px solid color-mix(in oklab, ${open ? s.color : "rgb(var(--divider))"} ${open ? "35%" : "12%"}, transparent)`,
                    }}
                  >
                    {open && <MotionPingDot color={s.color} />}
                    {!open && <span aria-hidden className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--ink-3)" }} />}
                    {open ? (es ? "Abierta" : "Open") : (es ? "Cerrada" : "Closed")}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-tertiary">{es ? "Volatilidad media:" : "Avg Volatility:"}</span>
                  <span className="font-bold text-primary">~{s.avgVolatilityPips} pips</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Panel de Killzones Institucionales */}
        <div className="mb-6 p-4 rounded-[2px] border border-[rgb(var(--divider)/0.12)] bg-[rgb(var(--divider)/0.03)]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] uppercase tracking-wider text-tertiary font-mono">
              {es ? "Ventanas Institucionales (Killzones)" : "Institutional Killzones"}
            </span>
            {activeKillzones.length > 0 ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[2px] text-xs font-mono font-bold bg-[rgb(var(--accent-base)/0.15)] text-[rgb(var(--accent-base))] border border-[rgb(var(--accent-base)/0.3)]">
                <span className="w-2 h-2 rounded-full bg-[rgb(var(--accent-base))]" />
                {activeKillzones.map((k) => (es ? k.nameEs : k.nameEn)).join(", ")}
              </span>
            ) : (
              <span className="text-xs font-mono text-tertiary">
                {es ? "Fuera de Killzones principales" : "Outside major Killzones"}
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {KILLZONES.map((kz) => {
              const active = utcHour !== null && utcHour >= kz.startUtc && utcHour < kz.endUtc;
              return (
                <div
                  key={kz.id}
                  className={`p-3 rounded-[2px] border transition-colors ${
                    active
                      ? "bg-[color-mix(in_oklab,rgb(var(--accent-base))_8%,transparent)] border-[rgb(var(--accent-base)/0.4)]"
                      : "bg-[rgb(var(--divider)/0.02)] border-[rgb(var(--divider)/0.08)]"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-semibold mb-1">
                    <span style={{ color: active ? "rgb(var(--accent-base))" : "var(--ink)" }}>{es ? kz.nameEs : kz.nameEn}</span>
                    <span className="font-mono text-tertiary">{fmtHour(kz.startUtc)}–{fmtHour(kz.endUtc)} UTC</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-secondary m-0">
                    {es ? kz.descriptionEs : kz.descriptionEn}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 24h band */}
        <div
          className="tj-paper tj-paper-glow rounded-[2px] p-5 mb-4"
          style={{ border: "1px solid rgb(var(--divider) / 0.13)" }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <span className="tnum" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)" }}>
              {es ? `Banda 24h (${tzMode.toUpperCase()} offset ${tzOffset >= 0 ? "+" : ""}${tzOffset}h)` : `24h band (${tzMode.toUpperCase()} offset ${tzOffset >= 0 ? "+" : ""}${tzOffset}h)`}
            </span>
            <div className="flex items-center gap-3">
              {nextSession && (
                <span className="tnum text-[11px] px-2 py-0.5 rounded-[2px] bg-[rgb(var(--divider)/0.06)] border border-[rgb(var(--divider)/0.1)] text-tertiary">
                  {es ? "Próxima apertura" : "Next open"}: <span className="font-semibold text-primary">{es ? nextSession.session.nameEs : nextSession.session.nameEn}</span> {es ? "en" : "in"} {fmtHour(nextSession.hoursUntil)}h
                </span>
              )}
              {openCount > 0 && (
                <span className="tnum text-[11px] font-medium text-secondary">
                  {openCount} {es ? "abierta(s)" : "open"}
                </span>
              )}
            </div>
          </div>

          {/* Track */}
          <div className="relative h-10 rounded-[2px] overflow-hidden" style={{ background: "color-mix(in oklab, var(--surface-2) 50%, transparent)" }}>
            {/* Hour gridlines every 6h */}
            {[0, 6, 12, 18, 24].map((h) => (
              <div
                key={h}
                aria-hidden
                className="absolute top-0 bottom-0"
                style={{ left: `${hourPct(h)}%`, width: 1, background: "rgb(var(--divider) / 0.16)" }}
              />
            ))}
            {/* Session bands */}
            {SESSIONS.map((s) => {
              const start = (s.startUtc + tzOffset + 24) % 24;
              const end = (s.endUtc + tzOffset + 24) % 24;
              const isCrossing = start > end;
              const isOpen = states?.find((x) => x.id === s.id)?.open ?? false;

              return (
                <div
                  key={s.id}
                  className="absolute top-1 bottom-1 rounded-[2px]"
                  style={{
                    left: `${hourPct(isCrossing ? 0 : start)}%`,
                    width: `${hourPct(isCrossing ? 24 : end - start)}%`,
                    background: `color-mix(in oklab, ${s.color} ${isOpen ? "22%" : "14%"}, transparent)`,
                    border: `1px solid color-mix(in oklab, ${s.color} ${isOpen ? "58%" : "20%"}, transparent)`,
                  }}
                  aria-label={`${es ? s.nameEs : s.nameEn} ${fmtHour(s.startUtc)}-${fmtHour(s.endUtc)} UTC`}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-[9.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: isOpen ? "var(--ink)" : "var(--ink-2)" }}>
                    {es ? s.nameEs : s.nameEn}
                  </span>
                </div>
              );
            })}
            {/* Now marker (live) */}
            {utcHour !== null && (
              <div
                aria-hidden
                className="absolute top-0 bottom-0"
                style={{ left: `${hourPct((utcHour + tzOffset + 24) % 24)}%`, width: 2, background: "var(--ink)", boxShadow: "0 0 8px rgb(var(--accent-base))" }}
              >
                <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full" style={{ background: "var(--ink)" }} />
              </div>
            )}
          </div>

          {/* Hour labels */}
          <div className="relative mt-1.5 h-4">
            {["00", "06", "12", "18", "24"].map((h) => (
              <span
                key={h}
                className="tnum absolute text-[9.5px]"
                style={{ left: `${hourPct(parseInt(h))}%`, transform: "translateX(-50%)", color: "var(--ink-3)" }}
              >
                {h}:00
              </span>
            ))}
          </div>

          {/* Overlap alert */}
          {overlaps.length > 0 && (
            <div
              className="mt-4 rounded-[2px] px-3 py-2.5 flex items-start gap-2"
              style={{
                background: "color-mix(in oklab, rgb(var(--pnl-pos)) 8%, transparent)",
                border: "1px solid color-mix(in oklab, rgb(var(--pnl-pos)) 26%, transparent)",
              }}
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0" aria-hidden="true" style={{ color: "rgb(var(--pnl-pos))" }}>
                <path d="M8 1.5l6.5 11.5h-13L8 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                <path d="M8 6.5v3M8 11.5v0.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              <div className="text-[12px] leading-[1.5]" style={{ color: "var(--ink)" }}>
                <span className="font-semibold" style={{ color: "rgb(var(--pnl-pos))" }}>
                  {es ? "Solape activo" : "Active overlap"}
                </span>
                {" — "}
                {overlaps.map((o) => `${o.a.nameEn} ∩ ${o.b.nameEn}`).join(", ")}
                {es
                  ? ". Ventana de máxima liquidez y volumen institucional."
                  : ". Window of maximum liquidity and institutional volume."}
              </div>
            </div>
          )}
        </div>

        <p className="text-[11px] leading-[1.55]" style={{ color: "var(--ink-3)" }}>
          {es
            ? "Horarios en UTC. Las sesiones se solapan: Asia ∩ Londres (07:00–09:00 UTC) y Londres ∩ Nueva York (12:00–16:00 UTC, la ventana más líquida). Actualización cada minuto."
            : "Times in UTC. Sessions overlap: Asia ∩ London (07:00–09:00 UTC) and London ∩ New York (12:00–16:00 UTC, the most liquid window). Updates every minute."}
        </p>
      </div>
    </section>
  );
}

/* ── MotionPingDot — punto pulsante para "Abierta" (live feel) ──
   Mayúscula inicial obligatoria: JSX distingue componente de etiqueta HTML
   por ahí. Escrito en minúscula, `<motionPingDot />` se compilaba como un
   elemento nativo desconocido y el punto no llegaba a dibujarse nunca. */
function MotionPingDot({ color }: { color: string }) {
  return (
    <span className="relative inline-flex w-1.5 h-1.5">
      <span
        aria-hidden
        className="absolute inline-flex w-full h-full rounded-full opacity-60"
        style={{ background: color, animation: "tj-ping 1.8s cubic-bezier(0,0,0.2,1) infinite" }}
      />
      <span aria-hidden className="relative inline-flex w-1.5 h-1.5 rounded-full" style={{ background: color }} />
    </span>
  );
}
