"use client";

import { useLang } from "@/lib/i18n";
import { Reveal } from "@/components/tj/Reveal";
import { SectionHeader } from "@/components/layout/SectionHeader";

/* ── LAS CELDAS DE TEXTO TAMBIÉN TIENEN IDIOMA ──────────────────────
   `labelEs`/`labelEn` traducían la etiqueta de cada fila, y las celdas
   eran un único array de cadenas. Resultado: la tabla de /en/pricing
   —la única del sitio donde un visitante anglófono compara precios—
   servía ocho celdas en español bajo encabezados en inglés: «Local · tu
   equipo», «Servidor ajeno», «Suscripción mensual», «40+
   institucionales», «Manual / fórmulas».

   Los símbolos (`yes`/`no`/`partial`) no necesitan idioma: los traduce
   `CellRenderer`. Sólo lo necesita el texto libre. */
type Texto = { es: string; en: string };
type Cell = "yes" | "yes-pro" | "no" | "partial" | Texto;
type Row = { labelEs: string; labelEn: string; cells: [Cell, Cell, Cell] };

const ROWS: Row[] = [
  {
    labelEs: "Privacidad",
    labelEn: "Privacy",
    cells: [
      /* TJ */ { es: "Local · tu equipo", en: "Local · your machine" },
      /* cloud */ { es: "Servidor ajeno", en: "Someone else's server" },
      /* excel */ { es: "Local · tu equipo", en: "Local · your machine" },
    ],
  },
  {
    labelEs: "Precio",
    labelEn: "Pricing",
    cells: [
      { es: "Core $149 · Pro $249", en: "Core $149 · Pro $249" },
      { es: "Suscripción mensual", en: "Monthly subscription" },
      { es: "Gratis", en: "Free" },
    ],
  },
  {
    labelEs: "Métricas",
    labelEn: "Metrics",
    cells: [
      { es: "40+ institucionales", en: "40+ institutional" },
      { es: "10–20 básicas", en: "10–20 basic" },
      { es: "Manual / fórmulas", en: "Manual / formulas" },
    ],
  },
  {
    labelEs: "Disciplina",
    labelEn: "Discipline",
    cells: ["yes", "no", "no"],
  },
  {
    labelEs: "Playbook en vivo",
    labelEn: "Live playbook",
    cells: ["yes", "no", "no"],
  },
  {
    labelEs: "Sin servidor",
    labelEn: "No server needed",
    cells: ["yes", "no", "yes"],
  },
  {
    labelEs: "Modo prop firm",
    labelEn: "Prop firm mode",
    cells: ["yes", "partial", "no"],
  },
  {
    labelEs: "Simulador Monte Carlo",
    labelEn: "Monte Carlo simulator",
    cells: ["yes-pro", "partial", "no"],
  },
  {
    labelEs: "Informe de track record",
    labelEn: "Track record report",
    cells: ["yes-pro", "no", "no"],
  },
];

/** Comparison table — CountPips vs cloud journals vs Excel. */
export function Comparison() {
  const { lang } = useLang();
  const es = lang === "es";

  const cols = [
    { key: "tj", label: es ? "CountPips" : "CountPips", sub: es ? "Esta app" : "This app", highlight: true },
    // «Diarios» y no «Journals»: es el mismo objeto que la columna de al
    // lado, y esa se llama por su nombre español en todo el sitio.
    { key: "cloud", label: es ? "Diarios en la nube" : "Cloud journals", sub: es ? "Suscripción" : "Subscription", highlight: false },
    { key: "excel", label: es ? "Excel / Sheets" : "Excel / Sheets", sub: es ? "Gratis" : "Free", highlight: false },
  ];

  return (
    <section className="section cv-auto relative overflow-clip">
      <div className="relative z-10 tj-container">
        <SectionHeader
          composicion="partida"
          etiqueta={es ? "Comparativa" : "Comparison"}
          titulo={es ? (
              <>
                No es lo mismo <span className="text-gradient">medir que apuntar.</span>
              </>
            ) : (
              <>
                Measuring is not <span className="text-gradient">the same as noting.</span>
              </>
            )}
          entradilla={es
              ? "Excel es libre pero mudo. La nube es cómoda pero cara y ajena. Esta app es local, honesta y tuya."
              : "Excel is free but silent. The cloud is convenient but costly and foreign. This app is local, honest and yours."}
        />

        {/* ── La comparativa ya era una tabla; le sobraba el marco ──────
            Estaba metida en una caja con esquina, sombra de tercer nivel
            y un `scale` de 1,005 al pasar el ratón. Una matriz de
            comparación no necesita que la presenten como objeto: sus
            propios filetes de fila y columna YA son la retícula. Lo
            único que hacía el envoltorio era añadir un segundo sistema
            de trazos alrededor del primero.

            Fuera la caja y fuera el `scale`: ampliar la tabla entera al
            acercar el puntero sugiere que se puede manipular, y no se
            puede — se lee. */}
        <Reveal delay={0.08} className="mt-10">
          <div className="relative border-t border-[rgb(var(--divider)/0.14)]">
            {/* Horizontal scroll wrapper for mobile. The 4-column comparison
                table has min-w-[680px] so on a 375px viewport it scrolls
                horizontally inside this container. Two mobile-only scroll
                affordances: (1) a theme-aware gradient fade pinned to the
                right edge that signals "more content this way" without
                blocking touch, and (2) a tiny eyebrow-style text hint below
                the table. Both are hidden at md+ where the table fits
                without scrolling. */}
            {/* ── EL DESPLAZAMIENTO LATERAL SÓLO DONDE HACE FALTA ──────
                La tabla pide 680 px. Por debajo de `lg` no caben y el
                `overflow-x-auto` es imprescindible; de `lg` para arriba
                sobra el sitio y nadie desplaza nada, pero la caja seguía
                siendo contenedor de desplazamiento igualmente — y con
                ella las VEINTISIETE filas de dentro colgaban su `view()`
                de algo que no se mueve y no llegaban a entrar nunca
                (medido por `scripts/humo.mjs` en escritorio y portátil).

                `clip` recorta igual pero no abre contenedor, y es la
                única que deja el eje vertical en `visible`. Así en
                escritorio las filas recuperan su entrada escalonada y en
                móvil se conserva el desplazamiento que allí sí se usa. */}
            {/* Y con el desplazamiento, su aviso: la tabla pide 680 px y a
                390 esconde 330 —las dos últimas columnas, «Diarios en la
                nube» y «Excel»— contra el canto, que no se lee como «hay
                más a la derecha» sino como una tabla rota. `--sin-reserva`
                porque el envoltorio tiene un solo hijo, y `--hasta-lg`
                porque de `lg` para arriba la caja pasa a `clip` y ya no
                desplaza nada. */}
            <div className="tj-fila-sigue tj-fila-sigue--sin-reserva tj-fila-sigue--hasta-lg relative overflow-x-auto lg:overflow-x-clip">
              <div className="relative w-full min-w-[680px]">
                <table className="w-full text-sm table-fixed tnum">
                  <colgroup>
                    <col className="w-[33%]" />
                    <col className="w-[33%]" />
                    <col className="w-[17%]" />
                    <col className="w-[17%]" />
                  </colgroup>
                {/* Cabecera — el `sticky top-0` es una mejora que hoy no
                    llega a activarse: el `overflow-x-auto` que necesita
                    el desplazamiento lateral en móvil crea su propio
                    contexto y bloquea el anclaje respecto al viewport.
                    (El `overflow-hidden` que también lo impedía se fue
                    con la caja; el que queda basta para bloquearlo.)
                    Desbloquearlo pide partir la tabla o sincronizar la
                    cabecera por JS, y eso es otra tarea.

                    Lo que SÍ funciona es el `sticky left-0` de la
                    primera columna: al desplazar en horizontal las
                    celdas pasan por debajo, y por eso su fondo tiene que
                    ser opaco de verdad.

                    El fondo de cada `th` es OPACO y sin desenfoque.
                    Antes era `--bg` al 92 % con `backdrop-blur-md`, y
                    las dos cosas sobraban. El desenfoque contradice el
                    material —el papel no se esmerila— y era lo último
                    que quedaba con cristal en todo el sitio. Y la
                    transparencia sólo tendría sentido si la cabecera
                    llegara a flotar sobre las filas al hacer scroll,
                    que es exactamente lo que estos ancestros con
                    `overflow` impiden: se estaba pagando composición
                    por difuminar un fondo que nunca se mueve. Una banda
                    sólida con su filete es además como se ancla la
                    cabecera de una tabla impresa. */}
                <thead className="sticky top-0 z-20">
                  <tr className="border-b border-[rgb(var(--divider)/0.15)]">
                    <th
                      scope="col"
                      className="text-left p-5 md:p-6 text-xs uppercase tracking-[0.12em] font-semibold text-tertiary h-14 md:h-16 align-bottom sticky left-0 z-20"
                      // T2h: opaque background via color-mix (works for both
                      // hex and RGB-component --bg values across all themes).
                      // The original bg-[rgb(var(--bg))] was invalid CSS when
                      // --bg is a hex value (most themes), leaving the sticky
                      // column transparent and letting scroll content show
                      // through. color-mix at 100% == var(--bg) opaque.
                      style={{ backgroundColor: "color-mix(in srgb, var(--bg) 100%, transparent)" }}
                    >
                      {es ? "Característica" : "Feature"}
                    </th>
                    {cols.map((c) => (
                      <th
                        key={c.key}
                        scope="col"
                        className={`p-5 md:p-6 text-left align-top relative h-14 md:h-16 ${
                          c.highlight
                            ? "shadow-[inset_3px_0_0_0_rgb(var(--accent-base)),inset_0_-1px_0_0_rgb(var(--accent-base)/0.18)]"
                            : ""
                        }`}
                        /* Mismo arreglo que en las dos columnas fijas: el
                           `bg-[rgb(var(--bg))]` que había aquí era CSS
                           inválido —`--bg` es un hex— y dejaba la banda
                           de cabecera sin fondo. Ahora que la tabla no
                           vive dentro de una caja, ese fondo es lo único
                           que separa la cabecera del material de la
                           sección, así que tiene que pintar de verdad. */
                        style={{ backgroundColor: "color-mix(in srgb, var(--bg) 100%, transparent)" }}
                      >
                        {/* Premium top accent rail on the highlighted column —
                            a 2px gradient bar pinned to the top inside edge,
                            visible only when the column is highlighted. Reads
                            as a "recommended tier" marker (mirrors the Pro
                            pricing-card rail) and reinforces the inset accent
                            stroke on the left edge (R20-3c). */}
                        {c.highlight && (
                          <span
                            aria-hidden="true"
                            className="absolute top-0 left-3 right-3 h-[2px] pointer-events-none"
                            style={{
                              background:
                                "linear-gradient(90deg, transparent 0%, rgb(var(--accent-base) / 0.85) 30%, rgb(var(--accent-hover) / 0.95) 50%, rgb(var(--accent-base) / 0.85) 70%, transparent 100%)",
                            }}
                          />
                        )}
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className={`min-w-0 font-medium tracking-tight ${c.highlight ? "text-primary" : "text-primary"}`}>
                            {c.label}
                          </span>
                          {c.highlight && (
                            <span
                              className="inline-flex items-center rounded-[2px] px-[0.55rem] py-[0.15rem] border text-[10px] font-semibold leading-[1.4] uppercase tracking-[0.1em]"
                              style={{
                                background: "rgb(var(--accent-base) / 0.14)",
                                color: "rgb(var(--accent-base))",
                                borderColor: "rgb(var(--accent-base) / 0.35)",
                              }}
                            >
                              {es ? "Recomendado" : "Recommended"}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-tertiary mt-1">{c.sub}</div>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Body */}
                <tbody>
                  {ROWS.map((row, i) => (
                    /* R24-1d: `group` + bumped hover opacity (/0.05 → /0.07) on the tr so the lit row reads more deliberately; the row-label th picks up a 3px accent left inset rail on hover via `group-hover` for a "selected row" affordance that ties to the permanent accent rail on the TJ column. */
                    <tr
                      data-entra="ciclo"
                      key={row.labelEs}
                      /* La última fila conserva su filete: antes lo
                         descolgaba con `last:border-b-0` porque el canto
                         de la caja ya cerraba la tabla por abajo, y sin
                         caja ese trazo es lo único que la cierra. El
                         alfa pasa a 0,14, que es el del sistema — el
                         `border-b` a secas heredaba el 0,10 del reglaje
                         global y quedaba medio tono por debajo del resto
                         de retículas de la página. */
                      className={`group border-b border-[rgb(var(--divider)/0.14)] transition-colors hover:bg-[rgb(var(--divider)/0.07)] ${
                        i % 2 === 1 ? "bg-[rgb(var(--divider)/0.015)]" : ""
                      }`}
                    >
                      <th
                        scope="row"
                        className="text-left p-5 md:p-6 font-medium text-secondary text-[14px] h-16 md:h-[72px] align-middle sticky left-0 z-10"
                        // T2h: opaque background for the sticky row-header
                        // column — same color-mix approach as the col header.
                        style={{ backgroundColor: "color-mix(in srgb, var(--bg) 100%, transparent)" }}
                      >
                        {es ? row.labelEs : row.labelEn}
                      </th>
                      {row.cells.map((cell, j) => (
                        <td
                          key={j}
                          className={`p-5 md:p-6 align-middle relative h-16 md:h-[72px] ${
                            j === 0 ? "bg-[rgb(var(--divider)/0.06)] shadow-[inset_3px_0_0_0_rgb(var(--accent-base))]" : ""
                          }`}
                        >
                          <CellRenderer cell={cell} highlight={j === 0} es={es} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              {/* Degradado del borde derecho, sólo en móvil: avisa de que
                  la tabla sigue hacia ese lado sin bloquear el toque.

                  Va por `color-mix` y no por `rgb(var(--bg) / 0.92)`:
                  `--bg` es un hex (#d4d9dd en el tema vivo), así que
                  `rgb()` recibía un hex, la declaración era inválida y
                  el degradado no llegaba a pintarse. Mismo fallo que ya
                  se había corregido en las dos columnas fijas, pero aquí
                  quedó sin corregir. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 md:hidden"
                style={{
                  background:
                    "linear-gradient(to left, color-mix(in srgb, var(--bg) 92%, transparent), transparent)",
                }}
              />
            </div>
          </div>

          {/* Mobile-only scroll hint — tiny eyebrow-style label with
              bidirectional arrows. Sits below the table so it doesn't
              compete with the table header for vertical space. */}
          <div className="md:hidden mt-3 flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.14em] text-tertiary font-semibold">
            <span aria-hidden="true">←</span>
            <span>{es ? "Desliza para comparar" : "Swipe to compare"}</span>
            <span aria-hidden="true">→</span>
          </div>
        </Reveal>

        {/* Footnote */}
        <Reveal delay={0.12} className="mt-6">
          <p className="text-xs text-tertiary text-center max-w-2xl mx-auto">
            {es
              ? "Comparamos con la media de los diarios web más conocidos y con Excel/Sheets sin plantillas avanzadas. Cada caso es distinto; este es el nuestro."
              : "We compare against the average of popular web journals and against Excel/Sheets without advanced templates. Each case is different; this is ours."}
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function CellRenderer({
  cell,
  highlight,
  es,
}: {
  cell: Cell;
  highlight: boolean;
  es: boolean;
}) {
  if (cell === "yes") {
    return (
      <span className="inline-flex items-center gap-2">
        <span
          data-entra="sello"
          className="inline-flex"
        >
          <CheckIcon />
        </span>
        <span className="text-[13px] font-medium text-signal-green">{es ? "Sí" : "Yes"}</span>
      </span>
    );
  }
  if (cell === "yes-pro") {
    // "Yes" + a Pro pill — used for Pro-only features (Monte Carlo, track record report).
    return (
      <span className="inline-flex items-center gap-1.5 flex-wrap">
        <span
          data-entra="sello"
          className="inline-flex"
        >
          <CheckIcon />
        </span>
        <span className="text-[13px] font-medium text-signal-green">{es ? "Sí" : "Yes"}</span>
        <span className="inline-flex items-center rounded-[2px] px-1.5 py-0 bg-[rgb(var(--divider)/0.05)] text-primary border border-[rgb(var(--divider)/0.20)] text-[10px] font-semibold leading-[1.4] uppercase tracking-[0.1em]">
          Pro
        </span>
      </span>
    );
  }
  if (cell === "no") {
    return (
      <span className="inline-flex items-center gap-2">
        <span
          data-entra="sello"
          className="inline-flex"
        >
          <CrossIcon />
        </span>
        <span className="text-[13px] text-tertiary">{es ? "No" : "No"}</span>
      </span>
    );
  }
  if (cell === "partial") {
    return (
      <span className="inline-flex items-center gap-2">
        <span
          data-entra="sello"
          className="inline-flex"
        >
          <PartialIcon />
        </span>
        <span className="text-[13px] text-pnl-warn">{es ? "Parcial" : "Partial"}</span>
      </span>
    );
  }
  // Texto libre, en el idioma de la página.
  return (
    <span className={`text-[13px] tnum ${highlight ? "text-primary font-medium" : "text-secondary"}`}>
      {es ? cell.es : cell.en}
    </span>
  );
}

function CheckIcon() {
  return (
    /* R24-1d — se subió el tinte de /15 a /20 y se le puso un anillo
       interior para que las fichas del icono conserven su definición en
       tema claro (donde /15 era casi invisible sobre el velo de papel)
       sin quedar chillonas en oscuro.

       ── EL VERDE ES EL DEL SEMÁFORO, NO EL DEL P&L ──────────────────
       Iba en `--pnl-pos`, y en tema oscuro ése es #00F5A0: un menta de
       neón que en este producto SIGNIFICA dinero ganado. Un check de
       «esta app lo tiene» no habla de dinero, habla de estado, y para
       eso existe la tercera familia de color: `--sig-green`, #3DAE73,
       el mismo verde apagado e institucional. En tema claro los dos
       tokens valen lo mismo (#1E7A4C), así que el cambio sólo se ve en
       oscuro — que es justo donde el neón desentonaba. */
    <span className="inline-flex w-5 h-5 rounded-[2px] bg-signal-green/20 ring-1 ring-inset ring-signal-green/15 items-center justify-center">
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M2 6.5l2.5 2.5L10 3.5" stroke="rgb(var(--sig-green))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function CrossIcon() {
  return (
    <span className="inline-flex w-5 h-5 rounded-[2px] bg-pnl-neg/20 ring-1 ring-inset ring-pnl-neg/15 items-center justify-center">
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M3 3l6 6M9 3l-6 6" stroke="rgb(var(--pnl-neg))" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function PartialIcon() {
  return (
    <span className="inline-flex w-5 h-5 rounded-[2px] bg-pnl-warn/20 ring-1 ring-inset ring-pnl-warn/15 items-center justify-center">
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M2 6h8" stroke="rgb(var(--pnl-warn))" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </span>
  );
}
