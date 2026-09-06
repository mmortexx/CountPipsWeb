"use client";

import { useLang } from "@/lib/i18n";
import { Database, FileLock2, KeyRound, Check, X } from "lucide-react";

/**
 * SecuritySection — sección `#security` del HTML. Local-first:
 * 3 tarjetas (100 % en local, archivo .sqlite, export/import)
 * + tabla comparativa "Diario en la nube vs CountPips".
 *
 * `num` — ordinal del eyebrow. Por defecto el de la home ("06"); las
 * páginas internas pasan el suyo para mantener su propia secuencia.
 */
export function SecuritySection({ num = "06" }: { num?: string }) {
  const { lang } = useLang();
  const es = lang === "es";
  const cards = [
    { i: Database, t: es ? "100 % en local" : "100% local", d: es ? "Todo vive en tu disco. Ni telemetría, ni cuentas, ni servidores." : "Everything lives on your disk. No telemetry, no accounts, no servers." },
    { i: FileLock2, t: es ? "Un solo archivo" : "One single file", d: es ? "Una base de datos SQLite que se abre, se copia y se respalda como un archivo cualquiera." : "One SQLite database you can open, copy and back up like any file." },
    { i: KeyRound, t: es ? "Export e import" : "Export & import", d: es ? "CSV, JSON y PDF. Sin perder el formato, sin bloqueos por nubes." : "CSV, JSON and PDF. Without losing format, without cloud lock-in." },
  ];
  const compare = [
    { l: es ? "Dónde viven los datos" : "Where data lives", tj: es ? "Tu disco" : "Your disk", cloud: es ? "Servidores del proveedor" : "Vendor servers" },
    { l: es ? "Modelo actual" : "Current model", tj: es ? "Demo + piloto privado" : "Demo + private pilot", cloud: es ? "Suscripción mensual" : "Monthly subscription" },
    { l: es ? "Funciona sin internet" : "Works offline", tj: true, cloud: false },
    { l: es ? "Cifrado en reposo" : "Encrypted at rest", tj: true, cloud: false },
    { l: es ? "Bloqueo por proveedor" : "Vendor lock-in", tj: false, cloud: true },
  ];
  return (
    <section
      id="security"
      // R27-1b — `bg-veil` added: this section had NO background
      // backing at all (just `border-t`). The eye WebGL (bright
      // red/green fibers in light theme) was showing through the
      // entire section, washing out the "Tus datos no salen de tu
      // equipo. Nunca." heading + body copy + the TJ/cloud comparison
      // rows. `bg-veil` (82 % bg in light / 74 % in dark) occludes
      // the eye; the `border-t` top hairline is preserved.
      className="section border-t border-[rgb(var(--divider)/0.06)] bg-veil scroll-mt-24"
    >
      <div className="tj-container" style={{ maxWidth: 1240 }}>
        <div className="max-w-[760px] mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-5">
            <span
              className="tnum"
              style={{ fontSize: 12, fontWeight: 500, letterSpacing: "0.04em", color: "rgb(var(--accent-base))" }}
            >
              § {num}
            </span>
            <span aria-hidden style={{ width: 22, height: 1, background: "rgb(var(--divider) / 0.13)" }} />
            <span
              className="tnum"
              style={{ fontSize: 11, letterSpacing: "0.2em", color: "var(--ink-3)" }}
            >
              {es ? "SEGURIDAD" : "SECURITY"}
            </span>
          </div>
          <h2
            className="font-serif m-0"
            style={{
              fontSize: "clamp(2rem, 3.6vw, 3rem)",
              fontWeight: 400,
              letterSpacing: "-0.022em",
              lineHeight: 1.08,
              color: "var(--ink)",
              textWrap: "balance",
            }}
          >
            {es ? (
              <>
                Tus datos <span style={{ color: "rgb(var(--accent-base))" }}>no salen</span> de tu equipo. Nunca.
              </>
            ) : (
              <>
                Your data <span style={{ color: "rgb(var(--accent-base))" }}>never leaves</span> your machine.
              </>
            )}
          </h2>
          <p
            className="mt-5"
            style={{
              fontSize: "clamp(1rem, 1.3vw, 1.1rem)",
              lineHeight: 1.62,
              color: "var(--ink-2)",
              maxWidth: "38em",
              margin: "20px auto 0",
            }}
          >
            {es
              ? "Una app nativa de Windows que escribe una base de datos SQLite en tu disco. Eso es todo. Ni más ni menos."
              : "A native Windows app that writes a SQLite database to your disk. That's it. Nothing more, nothing less."}
          </p>
        </div>
        {/* 3 tarjetas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
          {cards.map((c) => {
            const Icon = c.i;
            return (
              <div
                key={c.t}
                data-entra="ciclo"
                // El papel translúcido conserva el filtrado del atlas por los
                // bordes; `tj-hoja` le pone encima el doble filete y el apoyo
                // del resto de superficies del sitio.
                className="tj-paper tj-hoja p-6 sm:p-7"
              >
                <span
                  className="w-10 h-10 rounded-[2px] bg-[rgb(var(--accent-base)/0.06)] border border-[rgb(var(--accent-base)/0.15)] shadow-[inset_0_1px_0_rgb(var(--divider)/0.08)] inline-grid place-items-center text-[rgb(var(--accent-base))]"
                >
                  <Icon size={18} aria-hidden />
                </span>
                <h3 className="mt-3 mb-1 font-serif" style={{ fontSize: 20, fontWeight: 400, color: "var(--ink)", letterSpacing: "-0.02em" }}>
                  {c.t}
                </h3>
                <p className="m-0" style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--ink-2)" }}>
                  {c.d}
                </p>
              </div>
            );
          })}
        </div>

        {/* Console de Telemetría SQLite Local */}
        <div className="mb-14 rounded-[3px] border border-[rgb(var(--divider)/0.18)] bg-[rgb(var(--divider)/0.03)] p-5 sm:p-6 font-mono text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[rgb(var(--divider)/0.12)]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-[1px] bg-[rgb(var(--pnl-pos))]" aria-hidden="true" />
              <span className="font-bold text-primary text-[11px] uppercase tracking-wider">
                {es ? "AUDITORÍA DE INTEGRIDAD SQLite NATIVA" : "NATIVE SQLite INTEGRITY AUDIT"}
              </span>
            </div>
            <span className="text-[10px] text-tertiary">
              PRAGMA quick_check = <b className="text-[rgb(var(--pnl-pos))]">ok</b>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 text-[11px]">
            <div>
              <span className="text-tertiary block text-[10px] uppercase tracking-wider mb-1">{es ? "Almacén en Disco" : "Disk Storage"}</span>
              <span className="block break-all font-semibold text-primary">%LOCALAPPDATA%\CountPips\countpips.sqlite</span>
            </div>
            <div>
              <span className="text-tertiary block text-[10px] uppercase tracking-wider mb-1">{es ? "Modo de Registro" : "Journal Mode"}</span>
              <span className="text-primary font-semibold">WAL (Write-Ahead Logging 2.0)</span>
            </div>
            <div>
              <span className="text-tertiary block text-[10px] uppercase tracking-wider mb-1">{es ? "Cifrado en Reposo" : "At-Rest Encryption"}</span>
              <span className="text-primary font-semibold">AES-256-GCM + Argon2id</span>
            </div>
            <div>
              <span className="text-tertiary block text-[10px] uppercase tracking-wider mb-1">{es ? "Fuga Externa" : "External Egress"}</span>
              <span className="text-[rgb(var(--pnl-pos))] font-bold">0.00 KB (Zero Sockets)</span>
            </div>
          </div>
        </div>

        {/* Tabla comparativa — mobile: horizontal scroll inside the card. */}
        <div
          // T3c — swap a `.tj-paper-dense`: la tabla comparativa tiene
          // 5 filas de texto pequeño + cabecera; el 86 % de opacidad
          // mantiene AA en los textos `--ink-2`/`--ink-3` y deja que el
          // atlas se filtre por los bordes sin competir con la tabla.
          className="tj-paper-dense tj-hoja tj-hoja--sangre relative overflow-hidden"
        >
          {/* `tj-fila-sigue`: la fila no cabe y se desplaza de lado.
                Sin aviso, la ultima entrada queda partida contra el canto
                y eso no se lee como «hay mas a la derecha» sino como un
                texto cortado. Medido a 390 px: 480 px de contenido en 348. */}
          <div className="tj-fila-sigue tj-fila-sigue--sin-reserva relative overflow-x-auto">
            <div className="min-w-[480px]">
          {/* ── UNA TABLA DE VERDAD, NO UNA REJILLA DE `div` ─────────────
              Esto era una rejilla de `div` con los iconos ✓ y ✕ desnudos:
              sin texto, sin `aria-label`, sin nada. Un lector de pantalla
              recorría las cinco filas y no podía distinguir un sí de un
              no en NINGUNA — leía la etiqueta de la característica y
              después silencio. Y es la tabla que sostiene el argumento
              central del producto (tus datos no salen de tu equipo), así
              que quedarse sin ella no es perder un adorno.

              Ahora es `<table>` con cabeceras de columna y de fila
              asociadas por `scope`, de modo que al llegar a una celda se
              anuncia «Copia de seguridad · CountPips · Sí». El veredicto
              va en un `.sr-only` junto al icono, que pasa a `aria-hidden`
              por ser lo que es: la representación visual de ese texto. */}
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">
              {es
                ? "Comparación entre CountPips y un diario de trading en la nube"
                : "CountPips compared with a cloud-based trading journal"}
            </caption>
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid rgb(var(--divider) / 0.06)",
                  background: "color-mix(in oklab, var(--surface-2) 40%, transparent)",
                }}
              >
                <th
                  scope="col"
                  className="tnum w-[33%]"
                  style={{ padding: "12px 0 12px 18px", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)", fontWeight: 400 }}
                >
                  <span className="sr-only">{es ? "Característica" : "Feature"}</span>
                </th>
                <th
                  scope="col"
                  className="tnum w-[33%] border-l-2 border-[rgb(var(--accent-base)/0.30)]"
                  style={{ padding: "12px 8px 12px 10px", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "rgb(var(--accent-base))", fontWeight: 600 }}
                >
                  CountPips
                </th>
                <th
                  scope="col"
                  className="tnum w-[34%]"
                  style={{ padding: "12px 18px 12px 0", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-3)", fontWeight: 400 }}
                >
                  {es ? "Diario en la nube" : "Cloud-based journal"}
                </th>
              </tr>
            </thead>
            <tbody>
              {compare.map((row, i) => {
                const borde =
                  i < compare.length - 1 ? "1px solid rgb(var(--divider) / 0.06)" : undefined;
                /* El sello: icono decorativo + veredicto en texto para
                   quien no lo ve. `positivo` no es lo mismo que el valor
                   de la celda — en la columna de la nube, un `true`
                   («envía tus datos fuera») es una MALA noticia, y por eso
                   allí se pinta en rojo. Se pasa explícito para que el
                   color y la palabra no puedan divergir. */
                const sello = (valor: boolean, positivo: boolean) => (
                  <span className="inline-flex items-center gap-2">
                    <span
                      aria-hidden
                      className="inline-flex items-center justify-center rounded-[2px]"
                      style={{
                        width: 20,
                        height: 20,
                        background: positivo
                          ? "rgb(var(--pnl-pos) / 0.15)"
                          : "rgb(var(--pnl-neg) / 0.15)",
                      }}
                    >
                      {valor ? (
                        <Check size={12} style={{ color: positivo ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))" }} />
                      ) : (
                        <X size={12} style={{ color: positivo ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))" }} />
                      )}
                    </span>
                    <span className="sr-only">
                      {valor ? (es ? "Sí" : "Yes") : es ? "No" : "No"}
                    </span>
                  </span>
                );
                return (
                  <tr key={row.l} style={{ borderBottom: borde }}>
                    <th
                      scope="row"
                      style={{ padding: "14px 0 14px 18px", fontSize: 13, color: "var(--ink-2)", fontWeight: 400 }}
                    >
                      {row.l}
                    </th>
                    <td
                      className="border-l-2 border-[rgb(var(--accent-base)/0.30)]"
                      style={{ padding: "14px 8px 14px 10px", fontSize: 13, color: "var(--ink)" }}
                    >
                      {typeof row.tj === "boolean" ? sello(row.tj, row.tj) : row.tj}
                    </td>
                    <td style={{ padding: "14px 18px 14px 0", fontSize: 13, color: "var(--ink-2)" }}>
                      {typeof row.cloud === "boolean" ? sello(row.cloud, !row.cloud) : row.cloud}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
            </div>
            {/* Mobile-only right-edge gradient fade — signals "swipe for more". */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 md:hidden"
              style={{
                background: "linear-gradient(to left, rgb(var(--bg) / 0.92), transparent)",
              }}
            />
          </div>
          {/* Mobile-only scroll hint. */}
          <div className="md:hidden py-2 px-4 text-[11px] uppercase tracking-[0.14em] text-tertiary font-semibold text-center">
            <span aria-hidden>←</span>{" "}{es ? "Desliza para comparar" : "Swipe to compare"}{" "}<span aria-hidden>→</span>
          </div>
        </div>
      </div>
    </section>
  );
}
