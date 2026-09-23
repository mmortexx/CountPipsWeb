"use client";

import { useLang } from "@/lib/i18n";
import { Database, FileLock2, KeyRound, Check, X } from "lucide-react";

/**
 * SecuritySection — sección `#security` del HTML. Local-first:
 * 3 tarjetas (100 % en local, archivo .sqlite, export/import)
 * + tabla comparativa "Diario en la nube vs CountPips".
 */
/** `enPagina`: bajo un PageHeader que ya titula, la cabecera propia solo queda para lectores de pantalla. */
export function SecuritySection({ enPagina = false }: { enPagina?: boolean } = {}) {
  const { lang } = useLang();
  const es = lang === "es";
  const cards = [
    { i: Database, t: es ? "En tu equipo" : "On your machine", d: es ? "Tus operaciones viven en tu disco. Sin cuenta, sin telemetría y sin servidores de CountPips." : "Your trades live on your disk. No account, no telemetry and no CountPips servers." },
    { i: FileLock2, t: es ? "Un solo archivo" : "One single file", d: es ? "Una base de datos SQLite con copias automáticas verificadas y restauración a la vista." : "One SQLite database with verified automatic backups and visible restore." },
    { i: KeyRound, t: es ? "Exportar e importar" : "Export & import", d: es ? "Exporta a CSV, JSON completo y PDF, e importa cualquier CSV con mapeo de columnas." : "Export to CSV, full JSON and PDF, and import any CSV with column mapping." },
  ];
  const compare: { l: string; tj: string | boolean; cloud: string | boolean; bueno?: boolean }[] = [
    { l: es ? "Dónde viven los datos" : "Where data lives", tj: es ? "Tu disco" : "Your disk", cloud: es ? "Servidores del proveedor" : "Vendor servers" },
    { l: es ? "Modelo" : "Model", tj: es ? "Pago único previsto" : "Planned one-time payment", cloud: es ? "Suscripción mensual" : "Monthly subscription" },
    { l: es ? "Funciona sin internet" : "Works offline", tj: true, cloud: false, bueno: true },
    { l: es ? "Sin crear una cuenta" : "No account to create", tj: true, cloud: false, bueno: true },
    { l: es ? "Tu historial si dejas de pagar" : "Your history if you stop paying", tj: es ? "Legible y exportable" : "Readable and exportable", cloud: es ? "Depende del proveedor" : "Up to the vendor" },
  ];
  const conexiones = es
    ? [
        ["Licencia", "La clave y el nombre del equipo, como mucho una vez al día"],
        ["Actualizaciones", "Solo cuando las pides"],
        ["Mercados", "Datos públicos (BCE, Tesoro de EE. UU., CFTC, SEC, FMI, Kraken) al pulsar Actualizar"],
        ["Binance", "Tu histórico en solo lectura, si configuras la sincronización"],
        ["Webhooks", "Un aviso a la dirección que tú pongas, si los activas"],
        ["Nube", "Una copia cifrada en tu propia carpeta de nube, si la activas"],
      ]
    : [
        ["Licence", "The key and the computer name, at most once a day"],
        ["Updates", "Only when you ask for them"],
        ["Markets", "Public data (ECB, US Treasury, CFTC, SEC, IMF, Kraken) when you press Refresh"],
        ["Binance", "Your history in read-only mode, if you set up the sync"],
        ["Webhooks", "An alert to the address you choose, if you turn them on"],
        ["Cloud", "An encrypted copy in your own cloud folder, if you turn it on"],
      ];
  return (
    <section
      id="security"
      className="section scroll-mt-24"
    >
      <div className="tj-container">
        <div className={enPagina ? "sr-only" : "max-w-[760px] mx-auto text-center mb-12"}>
          <div className="inline-flex items-center gap-3 mb-5">
            <span className="eyebrow">
              {es ? "SEGURIDAD" : "SECURITY"}
            </span>
          </div>
          <h2 className="t-h2 m-0 text-primary text-balance">
            {es ? (
              <>
                Tus datos <span className="text-gradient">no salen</span> de tu equipo si tú no lo decides.
              </>
            ) : (
              <>
                Your data <span className="text-gradient">stays</span> on your machine unless you decide otherwise.
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
              ? "Una app nativa de Windows que guarda tus operaciones en una base de datos SQLite de tu disco. Lo que sale del equipo está escrito abajo, conexión por conexión."
              : "A native Windows app that stores your trades in a SQLite database on your disk. What leaves the machine is listed below, connection by connection."}
          </p>
        </div>
        {/* Tres principios en columnas con filete arriba, como los
            apartados de un informe: sin caja alrededor ni icono en un
            cuadradito, que es el vocabulario de una plantilla. */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-8 mb-14">
          {cards.map((c) => {
            const Icon = c.i;
            return (
              <div
                key={c.t}
                data-entra="ciclo"
                className="border-t border-[var(--line-2)] pt-5"
              >
                <Icon size={18} strokeWidth={1.6} aria-hidden className="text-tertiary" />
                <h3 className="mt-4 mb-1.5 text-[17px] text-primary">{c.t}</h3>
                <p className="m-0" style={{ fontSize: 14, lineHeight: 1.6, color: "var(--ink-2)" }}>
                  {c.d}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mb-14">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-tertiary">
              {es ? "Todo lo que se conecta a internet" : "Everything that goes online"}
            </p>
            <dl className="mt-3 divide-y divide-[var(--line)] border-y border-[var(--line)] text-[14px]">
              {conexiones.map(([k, v]) => (
                <div key={k} className="grid gap-1 py-2.5 sm:grid-cols-[10rem_1fr] sm:gap-6">
                  <dt className="font-medium text-primary">{k}</dt>
                  <dd className="m-0 text-secondary">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="medida mt-3 text-[13px] text-tertiary">
              {es ? "Nada más. Las copias locales cifradas y Windows Hello están construidos pero apagados hasta tener su flujo completo." : "Nothing else. Encrypted local backups and Windows Hello are built but switched off until their flow is complete."}
            </p>
          </div>
        </div>

        {/* Tabla comparativa — mobile: horizontal scroll inside the card. */}
        <div className="tj-ficha relative overflow-hidden">
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
              <tr style={{ borderBottom: "1px solid var(--ficha-division)" }}>
                <th
                  scope="col"
                  className="tnum w-[33%]"
                  style={{ padding: "12px 0 12px 18px", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)", fontWeight: 400 }}
                >
                  <span className="sr-only">{es ? "Característica" : "Feature"}</span>
                </th>
                <th
                  scope="col"
                  className="tnum w-[33%] tj-columna-propia"
                  style={{ padding: "14px 12px", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink)", fontWeight: 600 }}
                >
                  CountPips
                </th>
                <th
                  scope="col"
                  className="tnum w-[34%]"
                  style={{ padding: "14px 18px 14px 12px", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-3)", fontWeight: 500 }}
                >
                  {es ? "Diario en la nube" : "Cloud-based journal"}
                </th>
              </tr>
            </thead>
            <tbody>
              {compare.map((row, i) => {
                const borde =
                  i < compare.length - 1 ? "1px solid var(--ficha-division)" : undefined;
                /* El sello: icono decorativo + veredicto en texto para
                   quien no lo ve. `positivo` no es lo mismo que el valor
                   de la celda — en la columna de la nube, un `true`
                   («envía tus datos fuera») es una MALA noticia, y por eso
                   allí se pinta en rojo. Se pasa explícito para que el
                   color y la palabra no puedan divergir. */
                /* Mismo sello que la comparativa de /pricing: el glifo
                   desnudo y el veredicto EN TEXTO, a la vista. Aquí el
                   icono vivía dentro de una ficha de color con la
                   palabra en `sr-only`, así que las dos tablas
                   comparativas del sitio —que dicen lo mismo— se leían
                   como dos componentes de sitios distintos, y esta
                   obligaba a deducir el veredicto del color. */
                const sello = (valor: boolean, positivo: boolean) => {
                  const tinta = positivo ? "rgb(var(--pnl-pos))" : "rgb(var(--pnl-neg))";
                  return (
                    <span className="inline-flex items-center gap-2">
                      {valor ? (
                        <Check size={14} strokeWidth={2.2} aria-hidden style={{ color: tinta }} />
                      ) : (
                        <X size={13} strokeWidth={2} aria-hidden style={{ color: tinta }} />
                      )}
                      <span style={{ fontSize: 14, color: "var(--ink-2)" }}>
                        {valor ? (es ? "Sí" : "Yes") : "No"}
                      </span>
                    </span>
                  );
                };
                return (
                  <tr key={row.l} style={{ borderBottom: borde }}>
                    <th
                      scope="row"
                      style={{ padding: "14px 0 14px 18px", fontSize: 14, color: "var(--ink-2)", fontWeight: 400 }}
                    >
                      {row.l}
                    </th>
                    <td className="tj-columna-propia" style={{ padding: "14px 12px", fontSize: 14, color: "var(--ink)" }}>
                      {typeof row.tj === "boolean" ? sello(row.tj, row.tj === (row.bueno ?? true)) : row.tj}
                    </td>
                    <td style={{ padding: "14px 18px 14px 12px", fontSize: 14, color: "var(--ink-2)" }}>
                      {typeof row.cloud === "boolean" ? sello(row.cloud, row.cloud === (row.bueno ?? true)) : row.cloud}
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
                background: "linear-gradient(to left, var(--ficha-fondo), transparent)",
              }}
            />
          </div>
          {/* Mobile-only scroll hint. */}
          <div className="md:hidden py-2 px-4 text-[12px] uppercase tracking-[0.08em] text-tertiary font-semibold text-center">
            <span aria-hidden>←</span>{" "}{es ? "Desliza para comparar" : "Swipe to compare"}{" "}<span aria-hidden>→</span>
          </div>
        </div>
      </div>
    </section>
  );
}
