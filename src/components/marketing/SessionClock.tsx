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
  id: "asia" | "london" | "ny";
  nameEs: string;
  nameEn: string;
  startUtc: number; // hour 0-24
  endUtc: number;
  color: string;
  cityEs: string;
  cityEn: string;
};

const SESSIONS: Session[] = [
  { id: "asia", nameEs: "Asia", nameEn: "Asia", startUtc: 0, endUtc: 9, color: "rgb(var(--sig-amber))", cityEs: "Tokio", cityEn: "Tokyo" },
  { id: "london", nameEs: "Londres", nameEn: "London", startUtc: 7, endUtc: 16, color: "rgb(var(--accent-base))", cityEs: "Londres", cityEn: "London" },
  { id: "ny", nameEs: "Nueva York", nameEn: "New York", startUtc: 12, endUtc: 21, color: "rgb(var(--pnl-pos))", cityEs: "Nueva York", cityEn: "New York" },
];

export function SessionClock({ num = "02" }: { num?: string }) {
  const { lang } = useLang();
  const es = lang === "es";

  // Hora UTC actual como fracción de día (0-24). SSR-safe: empieza en
  // 0 y se corrige tras mount para evitar mismatch de hidratación.
  const [utcHour, setUtcHour] = useState<number | null>(null);
  const [localTz, setLocalTz] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const h = now.getUTCHours() + now.getUTCMinutes() / 60;
      setUtcHour(h);
      try {
        setLocalTz(Intl.DateTimeFormat().resolvedOptions().timeZone || "");
      } catch {
        setLocalTz("UTC");
      }
    };
    tick();
    const id = window.setInterval(tick, 60_000); // cada minuto
    return () => window.clearInterval(id);
  }, []);

  // Estado de cada sesión: open / closed + si está en solape
  const states = useMemo(() => {
    if (utcHour === null) return null;
    return SESSIONS.map((s) => {
      const open = utcHour >= s.startUtc && utcHour < s.endUtc;
      return { ...s, open };
    });
  }, [utcHour]);

  // Solapes activos
  const overlaps = useMemo(() => {
    if (utcHour === null) return [];
    const active = SESSIONS.filter((s) => utcHour >= s.startUtc && utcHour < s.endUtc);
    if (active.length < 2) return [];
    // Construye pares
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
              {es ? "SESIONES" : "SESSIONS"}
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
                ¿Qué sesión <span style={{ color: "rgb(var(--accent-base))" }}>abre ahora</span>?
              </>
            ) : (
              <>
                Which session <span style={{ color: "rgb(var(--accent-base))" }}>is open now</span>?
              </>
            )}
          </h2>
          <p className="mt-4" style={{ fontSize: "clamp(1rem, 1.2vw, 1.08rem)", lineHeight: 1.6, color: "var(--ink-2)" }}>
            {es
              ? "Las sesiones de trading marcan la liquidez. Los solapes (London ∩ New York) son las ventanas más activas. Tu zona horaria: " + (localTz || "—") + "."
              : "Trading sessions drive liquidity. Overlaps (London ∩ New York) are the most active windows. Your timezone: " + (localTz || "—") + "."}
          </p>
        </div>

        {/* Live status cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
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
                      {es ? s.cityEs : s.cityEn} · {fmtHour(s.startUtc)}–{fmtHour(s.endUtc)} UTC
                    </div>
                  </div>
                  {/* Live status dot */}
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.1em]"
                    style={{
                      background: open ? `color-mix(in oklab, ${s.color} 14%, transparent)` : "color-mix(in oklab, rgb(var(--divider)) 8%, transparent)",
                      color: open ? s.color : "var(--ink-3)",
                      border: `1px solid color-mix(in oklab, ${open ? s.color : "rgb(var(--divider))"} ${open ? "35%" : "12%"}, transparent)`,
                    }}
                  >
                    {open && (
                      <MotionPingDot color={s.color} />
                    )}
                    {!open && <span aria-hidden className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--ink-3)" }} />}
                    {open ? (es ? "Abierta" : "Open") : (es ? "Cerrada" : "Closed")}
                  </span>
                </div>
                {/* Local-time conversion (when open) */}
                {open && utcHour !== null && (
                  <div className="tnum text-[11px]" style={{ color: "var(--ink-2)" }}>
                    {es ? "Ahora" : "Now"}: {fmtHour(utcHour)} UTC
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 24h band */}
        <div
          className="tj-paper tj-paper-glow rounded-[2px] p-5 mb-4"
          style={{ border: "1px solid rgb(var(--divider) / 0.13)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="tnum" style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)" }}>
              {es ? "Banda 24h (UTC)" : "24h band (UTC)"}
            </span>
            {openCount > 0 && (
              <span className="tnum text-[11px]" style={{ color: "var(--ink-2)" }}>
                {openCount} {es ? "abierta(s)" : "open"}
              </span>
            )}
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
            {SESSIONS.map((s) => (
              <div
                key={s.id}
                className="absolute top-1 bottom-1 rounded-[2px]"
                style={{
                  left: `${hourPct(s.startUtc)}%`,
                  width: `${hourPct(s.endUtc - s.startUtc)}%`,
                  // La banda abierta baja del 38 % al 22 %. No es un ajuste
                  // de gusto: a 38 % el tinte competía con su propio rótulo y
                  // lo dejaba en 3,23:1 en el peor caso —Londres, sobre el
                  // acento—, por debajo del mínimo. A 22 % la banda sigue
                  // leyéndose como abierta y el peor caso sube a 5,2:1. El
                  // filete acompaña, que es donde vive de verdad la señal.
                  background: `color-mix(in oklab, ${s.color} ${states?.find((x) => x.id === s.id)?.open ? "22%" : "14%"}, transparent)`,
                  border: `1px solid color-mix(in oklab, ${s.color} ${states?.find((x) => x.id === s.id)?.open ? "58%" : "20%"}, transparent)`,
                }}
                aria-label={`${es ? s.nameEs : s.nameEn} ${fmtHour(s.startUtc)}-${fmtHour(s.endUtc)} UTC`}
              >
                {/* La sesión abierta rotula en TINTA, no en su propio color.
                    Lo llevaba en el color de la sesión, y como la banda ya se
                    tiñe con ese mismo color al 38 %, el rótulo quedaba en
                    3,54:1 sobre su propio fondo — color sobre su tinte, que es
                    la peor combinación posible. Que la sesión está abierta ya
                    lo dicen el relleno y el filete; el nombre sólo tiene que
                    leerse. */}
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-semibold uppercase tracking-[0.08em]" style={{ color: states?.find((x) => x.id === s.id)?.open ? "var(--ink)" : "var(--ink-2)" }}>
                  {es ? s.nameEs : s.nameEn}
                </span>
              </div>
            ))}
            {/* Now marker (live) */}
            {utcHour !== null && (
              <div
                aria-hidden
                className="absolute top-0 bottom-0"
                style={{ left: `${hourPct(utcHour)}%`, width: 2, background: "var(--ink)", boxShadow: "0 0 8px rgb(var(--accent-base))" }}
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
                className="tnum absolute text-[9px]"
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
                  ? ". Ventana de máxima liquidez y volatilidad."
                  : ". Window of maximum liquidity and volatility."}
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
