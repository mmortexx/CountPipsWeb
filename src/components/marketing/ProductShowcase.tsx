"use client";

import { useId, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import { Link } from "@/components/tj/LocaleLink";
import { ProductPlate } from "@/components/tj/ProductPlate";
import { LAMINAS_PRODUCTO } from "@/lib/laminas";
import { ArrowRight } from "lucide-react";

/**
 * ProductShowcase — la sección que enseña el programa en la portada.
 *
 * ── LO QUE HABÍA AQUÍ, Y POR QUÉ SE VA ────────────────────────────────
 * Cuatro fotomontajes de estudio: un monitor curvo en una oficina de
 * noche, con la aplicación reducida al 20 % de su tamaño dentro de la
 * pantalla y un rótulo blanco encima que hablaba de «monitor curvo
 * ultrawide». O sea, la sección que existe para enseñar el producto
 * enseñaba MOBILIARIO, y del producto no se leía una cifra.
 *
 * No era falta de material: las siete pantallas reales llevaban meses
 * en `public/img/`, recortadas, en los dos temas y con recorte de móvil
 * aparte, montadas sólo en `/features`. La portada —que es donde llega
 * quien no conoce el programa— era la única página que no lo enseñaba.
 *
 * ── POR QUÉ ENTRAN POR LA PUERTA DE `ProductPlate` ────────────────────
 * Porque ya hay una: numeración, filete doble y pie que dice qué se
 * está viendo, con el `<picture>` que sirve la captura del tema activo
 * y un recorte dedicado en pantalla estrecha. Montar aquí un segundo
 * marco —con su degradado negro y su ficha flotante— no sólo repetiría
 * el trabajo: sobre una captura real, ese degradado tapa justo la parte
 * baja de la interfaz, que es donde el programa pone las cifras.
 *
 * ── POR QUÉ SIGUEN LAS PESTAÑAS ───────────────────────────────────────
 * Cuatro capturas apiladas son cuatro pantallas de scroll en una portada
 * que ya mide diez mil píxeles. La barra imita la del propio programa
 * —que es como se cambia de sección dentro de él—, así que además de
 * ahorrar recorrido enseña cómo se navega. Se monta sólo la activa: el
 * resto se descarga cuando se pide.
 */

/** Las cuatro pantallas que sostienen el argumento en la portada: el
    parte de la mañana, el registro de la operación, el histórico y la
    analítica. El guardián tiene sección propia más abajo. */
const PANTALLAS_PORTADA = ["resumen", "registro", "operaciones", "analitica"] as const;

export function ProductShowcase() {
  const { lang } = useLang();
  const es = lang === "es";
  const idBase = useId();
  const tablist = useRef<HTMLDivElement>(null);
  const [activa, setActiva] = useState<string>(PANTALLAS_PORTADA[0]);

  const lamina = LAMINAS_PRODUCTO[activa];

  const enTeclado = (e: React.KeyboardEvent, i: number) => {
    const n = PANTALLAS_PORTADA.length;
    const salto =
      e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : e.key === "Home" ? -i : e.key === "End" ? n - 1 - i : 0;
    if (!salto) return;
    e.preventDefault();
    const destino = (i + salto + n) % n;
    setActiva(PANTALLAS_PORTADA[destino]);
    tablist.current?.querySelectorAll<HTMLButtonElement>("[role='tab']")[destino]?.focus();
  };

  return (
    <section
      id="producto"
      /* `bg-veil` — esta sección se quedó fuera de la pasada de velos.
         Es la que el propietario señaló: el rótulo «§ 02», el titular,
         su párrafo y la fila de pestañas quedaban cruzados por la
         figura de puntos del fondo. Medido a 656 px antes de ponerlo:
         el peor píxel bajo el rótulo daba 1,01:1 y bajo el párrafo
         1,00:1, con hasta un 6,4 % del área por debajo del mínimo; con
         el atlas apagado, 0,0 %. */
      /* `overflow-clip` y no `hidden`: la lámina entra con `data-entra`,
         que cuelga su línea de tiempo del contenedor de desplazamiento
         más cercano, y `hidden` crea uno que no se mueve nunca. Con
         `hidden` la captura aparecía puesta, sin gesto — lo detecta
         `scripts/humo.mjs`. Está escrito en globals.css: las secciones
         de este sitio recortan con `clip`. */
      className="section border-b border-[rgb(var(--divider)/0.1)] relative overflow-clip bg-veil"
      aria-labelledby="producto-titulo"
    >
      <div className="mx-auto w-[var(--page-w)]">

        {/* Cabecera de Sección */}
        <div className="max-w-[56ch] mb-8">
          <p className="t-label mb-3 text-tertiary">
            {es ? "§ 02 — El entorno de operativa" : "§ 02 — The trading workspace"}
          </p>
          <h2 id="producto-titulo" className="t-h2 mb-3">
            {es ? "Esto es lo que abres cada mañana." : "This is what you open every morning."}
          </h2>
          <p className="t-body text-secondary mb-0">
            {es
              ? "Capturas del programa con datos de muestra, no ilustraciones. Elige una pantalla y mira lo que hay dentro."
              : "Screenshots of the application with sample data, not illustrations. Pick a screen and look inside."}
          </p>
        </div>

        {/* La barra de pantallas, con el mismo gesto que la del programa.
            Se desplaza en horizontal en móvil en vez de partirse en dos
            filas: partida deja de leerse como una barra de aplicación. */}
        <div
          ref={tablist}
          role="tablist"
          aria-label={es ? "Pantallas del programa" : "Application screens"}
          className="mb-8 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {PANTALLAS_PORTADA.map((clave, i) => {
            const l = LAMINAS_PRODUCTO[clave];
            const seleccionada = clave === activa;
            return (
              <button
                key={clave}
                role="tab"
                type="button"
                id={`${idBase}-tab-${clave}`}
                aria-selected={seleccionada}
                aria-controls={`${idBase}-panel`}
                /* Sólo la activa entra en el orden del tabulador: dentro
                   de un `tablist` se navega con flechas. */
                tabIndex={seleccionada ? 0 : -1}
                onClick={() => setActiva(clave)}
                onKeyDown={(e) => enTeclado(e, i)}
                className="min-h-[44px] shrink-0 rounded-[2px] px-3.5 py-2 text-[13px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]"
                style={{
                  color: seleccionada ? "var(--ink)" : "var(--ink-3)",
                  background: seleccionada ? "rgb(var(--divider) / 0.10)" : "transparent",
                  boxShadow: seleccionada ? "inset 0 -2px 0 rgb(var(--accent-base) / 0.9)" : "none",
                }}
              >
                <span
                  className="tnum mr-2 text-[10.5px] tracking-[0.14em]"
                  style={{ color: "rgb(var(--accent-base))" }}
                >
                  {l.roman}
                </span>
                {es ? l.pestanaEs : l.pestanaEn}
              </button>
            );
          })}
        </div>

        <div role="tabpanel" id={`${idBase}-panel`} aria-labelledby={`${idBase}-tab-${activa}`}>
          {/* `key` fuerza a React a reemplazar la lámina en vez de
              reutilizarla: sin él, el `<img>` conserva la captura
              anterior mientras descarga la nueva y la pestaña parece no
              responder. La primera va con prioridad porque es la que se
              pinta sin que nadie la pida.

              `tj-lamina-cambia` es lo que le faltaba: la galería de
              `/features` monta ESTE MISMO componente con esta misma
              interacción y allí el cambio de pestaña se revela, mientras
              que aquí —en la portada, que es donde más gente lo va a
              tocar— la captura se reemplazaba de golpe. La misma acción
              no puede comportarse de dos maneras según la página. */}
          <div key={activa} className="tj-lamina-cambia">
            <ProductPlate lamina={lamina} priority={activa === PANTALLAS_PORTADA[0]} />
          </div>
        </div>

        {/* ── EL PIE DE LA SECCIÓN, CON PESO Y CON SUELO ──────────────
            Aquí había dos líneas de monoespaciado de 12 px sueltas sobre
            el fondo: la ficha técnica a la izquierda y, a la derecha, la
            ÚNICA salida hacia la demo de toda la sección. Dos problemas a
            la vez.

            El de lectura: el grabado pasa por detrás con su trama densa
            justo a esa altura, y el punteado cruzaba las letras —se ve en
            cuanto se mira la portada a 1440 px—. Ahora el pie se apoya en
            papel, que es lo que este sitio usa cuando un texto tiene que
            ganarle al fondo.

            El de jerarquía, que era el peor: después de enseñar la
            aplicación a toda anchura, la invitación a probarla era letra
            pequeña de la misma talla que el pie de specs. Pasa a botón
            sólido, el mismo de la portada, porque es la acción que esta
            sección existe para provocar. */}
        <div className="tj-paper mt-8 flex flex-col gap-4 rounded-[2px] border border-[rgb(var(--divider)/0.13)] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <span className="text-xs font-mono leading-relaxed text-[var(--ink-3)]">
            {es
              ? "Arquitectura nativa de Windows · Cero latencia en local · SQLite integrado"
              : "Native Windows architecture · Zero local latency · Embedded SQLite"}
          </span>

          <Link
            href="/demo"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[2px] px-5 text-[13.5px] font-semibold outline-none transition-[background-color,transform] duration-200 ease-[var(--ease-suave)] hover:bg-[rgb(var(--accent-hover))] hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] active:translate-y-0"
            style={{ background: "rgb(var(--accent-base))", color: "rgb(var(--accent-ink))" }}
          >
            {es ? "Recorrer la demo sin registro" : "Explore the demo, no sign-up"}
            <ArrowRight size={15} aria-hidden />
          </Link>
        </div>

      </div>
    </section>
  );
}
