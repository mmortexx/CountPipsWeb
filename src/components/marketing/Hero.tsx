"use client";

import { Link } from "@/components/tj/LocaleLink";
import { ArrowRight, Play } from "lucide-react";
import { useLang } from "@/lib/i18n";

/**
 * Hero — sección `#top`.
 *
 * R28 — reescritura en clave INSTITUCIONAL. La versión anterior estaba
 * bien construida pero hablaba el idioma equivocado: era una landing de
 * SaaS de consumo (píldoras, resplandores, tarjeta flotante) delante de
 * un titular que promete "opera como una mesa institucional". Lo que se
 * ha retirado y por qué:
 *
 *  - PÍLDORAS `rounded-full` de 54 px en los CTA → rectángulos de 4 px,
 *    que es el radio de control real de la app (Styles.xaml). Una
 *    píldora lee "app store"; un rectángulo lee "terminal".
 *  - HALO de acento difuminado 64 px sobre el titular. Era una mancha de
 *    color puro cuya única función era decorar; competía con el ojo del
 *    fondo y ensuciaba el texto.
 *  - TARJETA FLOTANTE decorativa ("[ 2026 ] · Hecho para el trader
 *    serio") con esquinas de 18 px, blur y doble sombra. Un recuadro
 *    suelto flotando sin anclaje a la rejilla es justo lo contrario de
 *    lo institucional. Su información útil (plataforma y versión) baja
 *    a la barra de especificaciones, plana y alineada.
 *  - CURSIVA + SUBRAYADO en la palabra de acento. Floritura editorial.
 *    Ahora el acento es solo color, y quien marca el bloque es una
 *    hairline de ancho completo bajo el titular.
 *  - PUNTOS CON RESPLANDOR (`box-shadow` de color + keyframe de brillo)
 *    en el antetítulo y entre los distintivos → cuadrado de 1 px sin
 *    glow y reglas verticales hairline. Un panel de instrumentos no
 *    parpadea en verde.
 *  - BOLITA VIAJERA del indicador de scroll, con su glow y su bucle de
 *    2,2 s → riel estático con marca. El movimiento gratuito es lo
 *    primero que delata a una web de marketing.
 *  - SHEEN y sombras de color en los botones → sin brillo, sin sombra
 *    de acento. El realce al pasar por encima es un cambio de tono.
 *
 * Lo que se conserva porque sí es institucional: la rejilla vertical
 * 25/50/75 %, ahora ANCLA REAL de la maqueta (el contenido se alinea a
 * ella en vez de flotar por encima), el scrim lateral de legibilidad,
 * las cifras tabulares y el `data-seq` que consume IntroSequence.
 *
 * Entrada: los elementos llevan `data-seq` y los revela IntroSequence.
 * Por eso este componente NO usa framer-motion para la entrada — dos
 * sistemas animando opacity a la vez se pisan.
 */
export function Hero() {
  const { lang } = useLang();
  const es = lang === "es";

  /* Barra de especificaciones del pie del hero. Datos, no eslóganes:
     se lee como la placa de características de un instrumento. */
  const specs: { k: string; v: string }[] = [
    { k: es ? "PLATAFORMA" : "PLATFORM", v: "Windows 10 · 11" },
    { k: es ? "DATOS" : "DATA", v: es ? "100 % locales" : "100 % local" },
    { k: es ? "RECORRIDO" : "PATH", v: es ? "Demo interactiva" : "Interactive demo" },
    { k: es ? "IDIOMAS" : "LANGUAGES", v: "ES · EN" },
    /* Aquí había una quinta fila, «VERSIÓN: 1.4.2», del mismo historial
       de versiones inventado que ya se retiró del pie: un número de
       versión publicada de un producto que todavía no se puede
       descargar. Esta era la única instancia que quedaba en todo el
       sitio — el resto de la limpieza buscaba «v1.4.2» con la uve por
       delante, y aquí estaba escrita sin ella. */
  ];

  return (
    <section
      id="top"
      /* ── El contenido va CENTRADO con sesgo bajo, no pegado abajo ────
         Estaba en `items-end`, y la intención era buena: dejar la mitad
         de arriba para que se viera la curva del atlas. El precio no lo
         era. Medido a 1.220 px de alto, el titular arrancaba a 694 px y
         el borde inferior del botón principal caía en 988; en un
         portátil corriente de 900 px eso deja la llamada a la acción
         justo en el pliegue, y en uno de 800 por debajo.

         `items-center` con `pt-[8vh]` conserva lo que se buscaba —el
         contenido sigue por debajo del centro óptico, así que la figura
         respira arriba— y sube el bloque lo suficiente para que el
         botón quede holgado dentro de la primera pantalla en cualquier
         portátil. El sesgo es proporcional a la altura, no fijo: en una
         pantalla alta la figura gana más aire, que es donde sobra. */
      className="relative flex min-h-screen items-center overflow-hidden border-b pt-[8vh]"
      style={{ borderColor: "rgb(var(--divider) / 0.10)" }}
    >
      {/* Scrim lateral de legibilidad sobre la columna de texto. */}
      <div
        aria-hidden
        className="hero-side-scrim pointer-events-none absolute inset-0"
        style={{ zIndex: 1 }}
      />
      {/* Fundido inferior hacia el fondo, para que el hero entregue la
          página a la sección siguiente sin un corte duro. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: "linear-gradient(0deg, var(--bg), transparent 46%)",
          zIndex: 1,
        }}
      />

      {/* Aquí vivían tres reglas verticales al 25/50/75 % del ancho.
          Retiradas por decisión del dueño: cruzaban el iris y la mitad
          superior del hero, y a esa altura no hay contenido alineado a
          ellas, así que no estructuraban nada — solo ensuciaban el
          fondo. La rejilla sigue existiendo donde sí se sostiene: en las
          hairlines HORIZONTALES que separan titular, entradilla y placa
          de especificaciones, que sí marcan bloques reales. */}

      {/* P-mobile-center: en móvil el hero va CENTRADO (eyebrow, titular,
         regla, entradilla, CTAs, placa). En escritorio (lg) mantiene el
         layout original alineado a la izquierda en dos columnas. Antes
         el titular iba a la izquierda y los CTAs centrados — esa mezcla
         se leía como 'nada está centrado donde debe'. Ahora en móvil
         todo el bloque va centrado como un conjunto coherente. */}
      <div className="tj-legible-text relative z-10 mx-auto w-full max-w-[1240px] px-6 pt-32 pb-14 text-center sm:px-10 lg:text-left">
        {/* ---- Antetítulo ---- */}
        <div data-seq className="mb-6 flex items-center justify-center gap-2.5 lg:justify-start">
          {/* Cuadrado de acento de 5 px, sin resplandor ni animación:
              una marca de registro, no una luz de aviso. */}
          <span
            aria-hidden
            className="inline-block"
            style={{ width: 5, height: 5, background: "rgb(var(--accent-base))" }}
          />
          <span
            className="tnum uppercase"
            style={{ fontSize: 11.5, letterSpacing: "0.16em", color: "var(--ink-3)" }}
          >
            {es
              ? "Diario de trading · Windows nativo"
              : "Trading journal · Windows native"}
          </span>
        </div>

        {/* ---- Titular ---- */}
        <h1
          data-seq
          className="m-0 mx-auto font-sans break-words uppercase lg:mx-0"
          style={{
            fontSize: "clamp(2rem, 7.4vw, 5.4rem)",
            fontWeight: 600,
            lineHeight: 1.04,
            letterSpacing: "-0.035em",
            color: "var(--ink)",
            maxWidth: "16em",
            textWrap: "balance",
            textRendering: "optimizeLegibility",
            WebkitFontSmoothing: "antialiased",
          }}
        >
          {/* El espacio explícito antes del `<br />` no es cosmético: sin
              él, `textContent` del titular concatena "una" y "mesa" en
              "unamesa" —el salto de línea no aporta separación a la
              cadena, sólo a lo que se pinta—, y eso es lo que leen los
              extractores de texto plano: buscadores, previsualizaciones
              de enlace y cualquier herramienta que quite las etiquetas.
              El `{" "}` sobrevive al colapso de espacios de JSX. */}
          {es ? (
            <>
              Opera como una{" "}
              <br />
              mesa <span style={{ color: "rgb(var(--accent-base))" }}>institucional.</span>
            </>
          ) : (
            <>
              Trade like an{" "}
              <br />
              institutional <span style={{ color: "rgb(var(--accent-base))" }}>desk.</span>
            </>
          )}
        </h1>

        {/* Regla de ancho completo bajo el titular. Sustituye al
            subrayado de la palabra de acento: marca el bloque entero y
            ata el titular a la rejilla en vez de decorar una palabra.

            `.tj-rule` la dibuja según el estilo activo: hairline de 1 px
            en el estilo del producto —idéntica a la de antes— y filete
            doble en el clásico, que es el remate con el que un libro
            impreso cierra un bloque. Misma función, dos vocabularios. */}
        <div data-seq aria-hidden className="tj-rule mt-7 w-full" />

        {/* ---- Entradilla + CTA, en dos columnas sobre la rejilla ----
            P1 — ritmo vertical reequilibrado: `mt-7` (28 px) entre
            titular → regla y regla → entradilla (era `mt-8` 32 px en
            ambos, lo que dejaba 64 px de aire después del H1 y se leía
            como hueco muerto). `gap-y-7` en móvil (era 8) reduce el
            salto entre la entradilla y la columna de CTAs cuando se
            apilan, sin tocar el `gap-x-10` del escritorio. */}
        <div className="mt-7 grid gap-x-10 gap-y-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,26em)] lg:text-left">
          <div data-seq className="mx-auto lg:mx-0" style={{ maxWidth: "44em" }}>
            <p
              className="m-0 mx-auto break-words lg:mx-0"
              style={{
                fontSize: "clamp(1.05rem, 2vw, 1.5rem)",
                fontWeight: 300,
                lineHeight: 1.4,
                color: "color-mix(in oklab, var(--ink) 86%, transparent)",
                maxWidth: "20em",
                textWrap: "balance",
              }}
            >
              {es
                ? "Mídela con el rigor de una mesa profesional."
                : "Measure it with institutional-grade rigour."}
            </p>
            <p
              className="m-0 mt-4 mx-auto break-words lg:mx-0"
              style={{
                fontSize: "clamp(0.95rem, 1.3vw, 1.05rem)",
                fontWeight: 300,
                lineHeight: 1.6,
                color: "var(--ink-2)",
                maxWidth: "44em",
              }}
            >
              {es
                ? "40+ métricas institucionales, un guardián que te frena antes del error y tus datos 100 % en tu máquina. Explora el flujo completo antes de decidir."
                : "40+ institutional metrics, a guardian that brakes before the error, and your data 100 % on your machine. Explore the full workflow before deciding."}
            </p>
          </div>

          {/* CTA — rectángulos de 4 px, sin brillo ni sombra de color.
              El realce al pasar por encima y el foco son el MISMO gesto,
              declarados en CSS, para que teclado y ratón vayan igual.

              T2c — anchura: los botones ya no se estiran a todo el ancho
              del contenedor (leían como barra 280 px en 390 px). Ahora son
              `inline-flex` natural (w-fit) y el contenedor padre controla la
              alineación con `items-center` (móvil, apilados y centrados) →
              `sm:items-center` (sm-md, lado a lado) → `lg:items-end`
              (escritorio, apilados a la derecha en la columna estrecha).

              P1 — gap entre CTAs subido de `gap-3` (12 px) a `gap-3.5`
              (14 px): paridad con FinalCTANew. Las transiciones pasan de
              `transition-colors duration-150` a `transition-[background-color,border-color,transform] duration-200 ease-[var(--ease-suave)]` + `hover:-translate-y-0.5` para que el lift del hover sea el mismo gesto que el de las tarjetas KPI y los bento cards, manteniendo la consistencia del lenguaje de interacción en toda la home. El `min-w-[180px]` asegura que el botón secundario no quede visualmente enano frente al primario en móvil — los dos leen como un par coordinado.
              P1-r2 — altura `h-[50px]` → `h-[52px]`: paridad exacta con
              FinalCTANew (que ya estaba en 52 px). Unificar la altura del
              CTA primario/secundario entre las dos secciones de compra
              (Hero arriba, FinalCTA abajo) refuerza la lectura de par
              coordinado a lo largo de la página y elimina el salto visual
              de 2 px entre las dos llamadas a la acción principales. */}
          {/* ── LOS DOS BOTONES, DEL MISMO ANCHO ──────────────────────
              En escritorio se apilaban con `lg:items-end` y ancho
              natural, así que quedaban alineados por la derecha y
              desiguales por la izquierda: 238 px el primero y 178 el
              segundo, con un escalón de 60 px entre ambos. Un par de
              llamadas a la acción con el canto izquierdo dentado se lee
              como descuido, no como jerarquía — la jerarquía ya la da
              que uno vaya relleno y el otro perfilado.

              `grid-cols-[max-content]` hace que la columna mida lo que
              el más ancho de los dos, y `w-full` estira al otro hasta
              ahí. Se ajusta solo si mañana cambia el texto o el idioma,
              que es la razón de no fijar un ancho a mano. */}
          <div data-seq className="flex flex-col items-center gap-3.5 sm:flex-row sm:items-center sm:justify-center lg:grid lg:grid-cols-[max-content] lg:justify-end lg:self-end">
            <Link
              href="/demo"
              className="inline-flex h-[52px] min-w-[180px] w-fit lg:w-full items-center justify-center gap-2.5 rounded-[2px] px-7 text-[15px] font-semibold outline-none transition-[background-color,transform] duration-200 ease-[var(--ease-suave)] hover:bg-[rgb(var(--accent-hover))] hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] active:translate-y-0"
              style={{ background: "rgb(var(--accent-base))", color: "rgb(var(--accent-ink))" }}
            >
              {es ? "Ver la demo interactiva" : "See the interactive demo"}
              <ArrowRight size={16} aria-hidden />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex h-[52px] min-w-[180px] w-fit lg:w-full items-center justify-center gap-2.5 rounded-[2px] border px-7 text-[15px] font-semibold text-[var(--ink)] outline-none transition-[background-color,border-color,transform] duration-200 ease-[var(--ease-suave)] hover:bg-[color-mix(in_srgb,var(--ink)_6%,transparent)] hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] active:translate-y-0"
              style={{ borderColor: "rgb(var(--divider) / 0.20)" }}
            >
              <Play size={14} fill="currentColor" aria-hidden />
              {es ? "Ver precios" : "See pricing"}
            </Link>
          </div>
        </div>

        {/* ---- Placa de especificaciones ----
            Sustituye a la fila de distintivos con puntos de acento. Cada
            dato es una pareja etiqueta/valor separada por reglas
            hairline: se lee como la placa de un instrumento, no como una
            fila de sellos de confianza.

            P1 — `mt-14` (56 px) → `mt-12` (48 px): la placa se
            separaba demasiado de la entradilla en móvil (la columna de
            CTAs apilada dejaba un hueco de aire antes de la regla superior
            de la placa). 48 px conserva la jerarquía sin abrir un hueco
            tipográfico. El `pt-5` (20 px) entre la regla y los campos se
            mantiene: es el respiro correcto para una placa de datos. */}
        <div
          data-seq
          className="mt-12 border-t pt-5"
          style={{ borderColor: "rgb(var(--divider) / 0.14)" }}
        >
          {/* Rejilla, no flex con reglas verticales. La versión anterior
              separaba cada campo con un `border-left`, y al envolver a una
              segunda línea el primer campo de la fila nueva arrastraba su
              regla y quedaba huérfana. Con una rejilla de columnas fijas
              los campos se alinean solos en cualquier ancho y la jerarquía
              la da la etiqueta encima del valor — que además es como se
              lee una placa de características de verdad. */}
          {/* T2c — `gap-y-7` (era 6) y `min-w-0` en cada celda para que el
              valor largo no empuje al vecino en anchos límite. Las
              etiquetas siguen `uppercase tracking-[0.16em]` (ya estaban);
              los valores ahora `fontWeight: 600` (semibold) para leer la
              jerarquía sin depender solo del tamaño. */}
          {/* La rejilla iba `2 · 3 · 5` columnas para CUATRO datos, así
              que no cuadraba en ninguno de los dos saltos: en tableta
              dejaba una fila huérfana de uno (3 + 1) y en escritorio una
              quinta columna vacía. Cuatro elementos piden divisores de
              cuatro: 2 y 4. La quinta columna venía de cuando había un
              quinto dato —la versión «1.4.2»—, que se retiró por ser de
              un producto que aún no se puede descargar; la rejilla se
              quedó con el hueco. */}
          <dl className="m-0 grid grid-cols-2 gap-x-8 gap-y-7 sm:grid-cols-4 lg:mx-0" style={{ justifyItems: "center" }}>
            {specs.map((s) => (
              <div key={s.k} className="flex min-w-0 flex-col gap-1.5">
                <dt
                  className="tnum uppercase"
                  style={{ fontSize: 9.5, letterSpacing: "0.16em", color: "var(--ink-3)" }}
                >
                  {s.k}
                </dt>
                <dd
                  className="tnum m-0"
                  style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}
                >
                  {s.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* El indicador "Scroll" se retiró: quedaba centrado en el borde
          inferior, justo ENCIMA de la placa de especificaciones, y se
          pisaban. Entre una señal decorativa y una de datos, se queda la
          de datos — y que la página se desplaza ya lo dice la propia
          placa cortada por el borde. */}
    </section>
  );
}
