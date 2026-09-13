"use client";

import { useState, useEffect, useMemo } from "react";
import { useLang } from "@/lib/i18n";

import { PLAZAS, estaAbierta, horaLocal, proximaApertura, ventanaUtc, type Plaza } from "@/lib/sesiones";

/**
 * Reloj de sesiones con los horarios locales de la app de escritorio: cada plaza
 * se evalúa en su zona, con cambio de hora, y cierra en fin de semana.
 */
const COLOR: Record<Plaza["id"], string> = {
  sydney: "rgb(var(--sig-purple, 168 85 247))",
  tokyo: "rgb(var(--sig-amber))",
  london: "rgb(var(--accent-base))",
  newyork: "rgb(var(--pnl-pos))",
};

type Ventana = { id: string; es: string; en: string; tz: string; abre: number; cierra: number; notaEs: string; notaEn: string };

const VENTANAS: Ventana[] = [
  { id: "london_open", es: "Apertura de Londres", en: "London open", tz: "Europe/London", abre: 8 * 60, cierra: 11 * 60, notaEs: "Arranca la sesión europea.", notaEn: "The European session starts." },
  { id: "ny_open", es: "Apertura de Nueva York", en: "New York open", tz: "America/New_York", abre: 9 * 60 + 30, cierra: 11 * 60 + 30, notaEs: "Coincide con Londres abierta.", notaEn: "Overlaps with London still open." },
  { id: "london_close", es: "Cierre de Londres", en: "London close", tz: "Europe/London", abre: 15 * 60, cierra: 16 * 60 + 30, notaEs: "Última hora y media de Europa.", notaEn: "Europe's last hour and a half." },
];

type Referencia = "local" | "utc" | "ny" | "madrid";

const norm = (h: number) => ((h % 24) + 24) % 24;

export function SessionClock() {
  const { lang } = useLang();
  const es = lang === "es";

  const [ahora, setAhora] = useState<Date | null>(null);
  const [ref, setRef] = useState<Referencia>("local");

  useEffect(() => {
    let id = 0;
    const tick = () => setAhora(new Date());
    const parar = () => {
      if (id) window.clearInterval(id);
      id = 0;
    };
    const arrancar = () => {
      parar();
      if (document.hidden) return;
      tick();
      id = window.setInterval(tick, 1000);
    };
    arrancar();
    document.addEventListener("visibilitychange", arrancar);
    return () => {
      parar();
      document.removeEventListener("visibilitychange", arrancar);
    };
  }, []);

  const utc = ahora ? ahora.getUTCHours() + ahora.getUTCMinutes() / 60 + ahora.getUTCSeconds() / 3600 : null;
  const minuto = ahora ? Math.floor(ahora.getTime() / 60_000) : 0;
  const listo = ahora !== null;
  const zonaLocal = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    } catch {
      return "";
    }
  }, []);

  const estado = useMemo(() => {
    const fecha = new Date(minuto * 60_000);
    const plazas = PLAZAS.map((p) => {
      const v = ventanaUtc(p, fecha);
      return { ...p, color: COLOR[p.id], desdeUtc: v.desde / 60, hastaUtc: v.hasta / 60, abierta: listo && estaAbierta(p, fecha) };
    });
    const ventanas = VENTANAS.map((v) => {
      const { minuto: m, dia, desfase } = horaLocal(v.tz, fecha);
      return {
        ...v,
        desdeUtc: norm((v.abre - desfase) / 60),
        hastaUtc: norm((v.cierra - desfase) / 60),
        activa: listo && dia >= 1 && dia <= 5 && m >= v.abre && m < v.cierra,
      };
    });
    const proxima = listo ? proximaApertura(fecha) : null;
    return { plazas, ventanas, proxima };
  }, [minuto, listo]);
  const { plazas, ventanas, proxima } = estado;

  const desfaseRef = useMemo(() => {
    const fecha = new Date(minuto * 60_000);
    if (ref === "utc") return 0;
    if (ref === "ny") return horaLocal("America/New_York", fecha).desfase / 60;
    if (ref === "madrid") return horaLocal("Europe/Madrid", fecha).desfase / 60;
    return ahora ? -ahora.getTimezoneOffset() / 60 : 0;
  }, [ref, minuto, ahora]);

  const abiertas = plazas.filter((p) => p.abierta);
  const nombre = (x: { es: string; en: string }) => (es ? x.es : x.en);

  const hora = (h: number) => {
    const t = Math.round(norm(h) * 60);
    return `${String(Math.floor(t / 60) % 24).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
  };
  const enRef = (h: number) => hora(h + desfaseRef);
  const falta = (h: number) => {
    const t = Math.round(h * 60);
    const dd = Math.floor(t / 1440);
    const hh = Math.floor((t % 1440) / 60);
    const mm = t % 60;
    if (dd > 0) return `${dd} d ${hh} h`;
    return hh > 0 ? `${hh} h ${mm} min` : `${mm} min`;
  };
  const etiquetaDesfase = `UTC${desfaseRef >= 0 ? "+" : "−"}${Math.abs(desfaseRef)}`;
  const pct = (h: number) => (h / 24) * 100;

  const tramos = (a: number, b: number) => (a <= b ? [[a, b]] : [[a, 24], [0, b]]);

  const referencias: { id: Referencia; label: string }[] = [
    { id: "local", label: es ? "Tu hora" : "Your time" },
    { id: "utc", label: "UTC" },
    { id: "ny", label: es ? "Nueva York" : "New York" },
    { id: "madrid", label: "Madrid" },
  ];

  return (
    <section className="section-tight">
      <div className="tj-container">
        <div className="mb-10 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="max-w-2xl">
            <span className="eyebrow">{es ? "Sesiones de mercado" : "Market sessions"}</span>
            <h2
              className="font-serif m-0 mt-5"
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
                  ¿Qué plazas están <span className="text-gradient">abiertas ahora?</span>
                </>
              ) : (
                <>
                  Which markets are <span className="text-gradient">open right now?</span>
                </>
              )}
            </h2>
            <p className="mt-4 mb-0" style={{ fontSize: "clamp(1rem, 1.2vw, 1.08rem)", lineHeight: 1.6, color: "var(--ink-2)" }}>
              {es
                ? "Las cuatro sesiones de referencia del mercado de divisas, sus solapes y las aperturas más vigiladas, con el cambio de hora ya aplicado."
                : "The four reference sessions of the currency market, their overlaps and the most watched opens, with daylight saving already applied."}
            </p>
          </div>
          <div>
            <div className="mb-2 text-[12px] text-tertiary">{es ? "Ver horas en" : "Show times in"}</div>
            <div className="tj-segmentado" role="group" aria-label={es ? "Referencia horaria" : "Time reference"}>
              {referencias.map((r) => (
                <button key={r.id} type="button" onClick={() => setRef(r.id)} aria-pressed={ref === r.id} title={r.id === "local" && ahora ? zonaLocal : undefined}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <ul className="m-0 mb-10 grid list-none grid-cols-1 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {plazas.map((p) => {
            const open = p.abierta;
            return (
              <li key={p.id} className="border-t border-[var(--line)] py-4 sm:pr-6">
                <div className="flex items-center gap-2 text-[13px]" style={{ color: open ? "var(--ink)" : "var(--ink-3)" }}>
                  <span aria-hidden className="h-2 w-2 rounded-[2px]" style={{ background: open ? p.color : "color-mix(in srgb, var(--ink) 20%, transparent)" }} />
                  {open ? (es ? "Abierta" : "Open") : (es ? "Cerrada" : "Closed")}
                </div>
                <div className="mt-2 text-[20px] font-semibold tracking-[-0.01em] text-primary">{nombre(p)}</div>
                <div className="tnum mt-1 text-[13px] text-tertiary">
                  {enRef(p.desdeUtc)}–{enRef(p.hastaUtc)}
                </div>
              </li>
            );
          })}
        </ul>

        <div className="tj-paper tj-paper-glow mb-10 p-5 sm:p-6">
          <div className="mb-4 flex flex-col justify-between gap-2 text-[13px] sm:flex-row sm:items-center">
            <span className="text-secondary">
              {es ? "Las 24 horas" : "The 24 hours"} <span className="tnum text-tertiary">· {etiquetaDesfase}</span>
            </span>
            {proxima && (
              <span className="tnum text-tertiary">
                {es ? "Próxima apertura:" : "Next open:"} <span className="font-medium text-primary">{nombre(proxima.plaza)}</span>{" "}
                {es ? "en" : "in"} {falta(proxima.minutos / 60)}
              </span>
            )}
          </div>

          <div className="relative h-[92px]">
            {[0, 6, 12, 18, 24].map((h) => (
              <div key={h} aria-hidden className="absolute top-0 bottom-0 w-px" style={{ left: `${pct(h)}%`, background: "var(--line)" }} />
            ))}
            {plazas.map((p, i) => {
              const open = p.abierta;
              const ts = tramos(norm(p.desdeUtc + desfaseRef), norm(p.hastaUtc + desfaseRef));
              const principal = ts.length > 1 && ts[1][1] - ts[1][0] > ts[0][1] - ts[0][0] ? 1 : 0;
              return ts.map(([a, b], k) => (
                <div
                  key={`${p.id}-${k}`}
                  className="absolute h-[18px] rounded-[4px]"
                  style={{
                    top: 4 + i * 22,
                    left: `${pct(a)}%`,
                    width: `${pct(b - a)}%`,
                    background: `color-mix(in oklab, ${p.color} ${open ? "55%" : "22%"}, transparent)`,
                  }}
                  aria-label={k === principal ? `${nombre(p)} ${enRef(p.desdeUtc)}–${enRef(p.hastaUtc)}` : undefined}
                  aria-hidden={k !== principal || undefined}
                >
                  {k === principal && (
                    <span className="absolute inset-y-0 left-2 flex items-center whitespace-nowrap text-[11px] font-medium" style={{ color: "var(--ink)" }}>
                      {nombre(p)}
                    </span>
                  )}
                </div>
              ));
            })}
            {utc !== null && (
              <div aria-hidden className="absolute -top-1 -bottom-1 w-[2px] rounded-[1px]" style={{ left: `${pct(norm(utc + desfaseRef))}%`, background: "var(--ink)" }} />
            )}
          </div>

          <div className="relative mt-2 h-4">
            {[0, 6, 12, 18, 24].map((h) => (
              <span
                key={h}
                className="tnum absolute text-[11px]"
                style={{ left: `${pct(h)}%`, transform: h === 0 ? "none" : h === 24 ? "translateX(-100%)" : "translateX(-50%)", color: "var(--ink-3)" }}
              >
                {String(h).padStart(2, "0")}:00
              </span>
            ))}
          </div>

          {abiertas.length > 1 && (
            <p className="m-0 mt-5 border-t border-[var(--line)] pt-4 text-[14px] leading-[1.5] text-primary">
              <span className="font-semibold">{es ? "Solape en curso: " : "Overlap now: "}</span>
              {abiertas.map(nombre).join(es ? " y " : " and ")}
              {es ? " están abiertas a la vez." : " are open at the same time."}
            </p>
          )}
        </div>

        <div className="mb-3 text-[13px] font-medium text-secondary">{es ? "Aperturas y cierres vigilados" : "Watched opens and closes"}</div>
        <ul className="m-0 grid list-none grid-cols-1 p-0 md:grid-cols-3">
          {ventanas.map((v) => {
            const activa = v.activa;
            return (
              <li key={v.id} className="border-t border-[var(--line)] py-4 md:pr-6">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[15px] font-medium text-primary">
                    {nombre(v)}
                    {activa && <span className="ml-2 text-[12px] font-normal text-[rgb(var(--pnl-pos))]">{es ? "ahora" : "now"}</span>}
                  </span>
                  <span className="tnum text-[13px] text-tertiary">
                    {enRef(v.desdeUtc)}–{enRef(v.hastaUtc)}
                  </span>
                </div>
                <p className="m-0 mt-1 text-[13px] leading-[1.55] text-tertiary">{es ? v.notaEs : v.notaEn}</p>
              </li>
            );
          })}
        </ul>

        <p className="mt-6 mb-0 text-[12px] leading-[1.55]" style={{ color: "var(--ink-3)" }}>
          {es
            ? "Horario de cada plaza en su hora local, el mismo que usa la app: 7:00–17:00 en Sídney, 8:00–17:00 en Tokio, 8:00–16:30 en Londres y 9:30–16:00 en Nueva York, de lunes a viernes. No es el horario de un bróker concreto."
            : "Each market's hours in its local time, the same the app uses: 7:00–17:00 in Sydney, 8:00–17:00 in Tokyo, 8:00–16:30 in London and 9:30–16:00 in New York, Monday to Friday. Not the schedule of any specific broker."}
        </p>
      </div>
    </section>
  );
}
