"use client";

import { useId, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { ProductPlate } from "@/components/tj/ProductPlate";
import { LAMINAS_PRODUCTO, ORDEN_LAMINAS } from "@/lib/laminas";

/**
 * GaleriaPantallas — las siete pantallas del programa, una cada vez.
 *
 * ── Por qué existe ────────────────────────────────────────────────────
 * `/features` lleva desde el principio prometiendo en sus datos
 * estructurados una «galería de la app», y no enseñaba ni una captura:
 * cuarenta características descritas con palabras, en una página cuyo
 * argumento entero es que el programa hace cosas que los demás no hacen.
 * Al mismo tiempo, cinco de las siete capturas de `public/img/` no las
 * montaba ningún componente del sitio — existían, pesaban y no las veía
 * nadie.
 *
 * ── Por qué pestañas y no una tira de siete láminas ───────────────────
 * Siete capturas apiladas son siete pantallas de scroll, y en la práctica
 * se ven las dos primeras. Con pestañas, la sección ocupa lo que ocupa
 * UNA y el visitante decide qué mira — que además es la forma en que se
 * usa el programa: una barra de secciones arriba y una pantalla debajo.
 * La galería imita esa barra a propósito.
 *
 * La portada monta las mismas láminas por su cuenta (`ProductShowcase`,
 * § 02) pero sólo cuatro: allí la sección tiene que caber en una portada
 * que ya mide diez mil píxeles. Aquí van las siete, que es lo que esta
 * página promete. Aquí ya ha entrado a leer las
 * características, así que elegir es una mejora y no un peaje.
 *
 * ── Lo que NO hace ────────────────────────────────────────────────────
 * No monta las siete láminas y esconde seis: eso descarga siete capturas
 * para enseñar una. Monta sólo la activa; el resto llega cuando se pide.
 * Con `loading="lazy"` en las imágenes, cambiar de pestaña cuesta una
 * petición de unos 60 KB.
 */
export function GaleriaPantallas({ num = "03" }: { num?: string }) {
  const { lang } = useLang();
  const es = lang === "es";
  const idBase = useId();
  const [activa, setActiva] = useState<string>(ORDEN_LAMINAS[0]);
  const tablist = useRef<HTMLDivElement>(null);

  const lamina = LAMINAS_PRODUCTO[activa];

  /* Flechas para moverse entre pestañas, como pide el patrón de pestañas
     de la WAI: con `role="tab"` el lector de pantalla anuncia «pestaña 3
     de 7» y quien navega con teclado espera que las flechas funcionen.
     Sin esto, el tabulador se para en las siete, una por una. */
  const enTeclado = (e: React.KeyboardEvent, i: number) => {
    const salto = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : e.key === "Home" ? -i : e.key === "End" ? ORDEN_LAMINAS.length - 1 - i : 0;
    if (!salto) return;
    e.preventDefault();
    const destino = (i + salto + ORDEN_LAMINAS.length) % ORDEN_LAMINAS.length;
    setActiva(ORDEN_LAMINAS[destino]);
    tablist.current?.querySelectorAll<HTMLButtonElement>("[role='tab']")[destino]?.focus();
  };

  return (
    <section
      id="galeria"
      className="section"
      aria-labelledby={`${idBase}-titulo`}
    >
      <div className="mx-auto w-[var(--page-w)]">
        <SectionHeader
          composicion="partida"
          etiqueta={`§ ${num} — ${es ? "La galería" : "The gallery"}`}
          titulo={
            <span id={`${idBase}-titulo`}>
              {es ? "Las siete pantallas, por dentro." : "The seven screens, from inside."}
            </span>
          }
          entradilla={
            es
              ? "Capturas del programa con datos de muestra, no ilustraciones. Elige la pantalla y " +
                "mira lo que hay dentro: cada pie cuenta qué se está viendo y por qué esa pantalla " +
                "existe."
              : "Screenshots of the application with sample data, not illustrations. Pick a screen " +
                "and look inside: each caption says what you are seeing and why that screen exists."
          }
        />

        {/* La barra de pantallas. Se desplaza en horizontal en móvil en vez
            de partirse en dos filas: partida deja de leerse como la barra
            de una aplicación, que es de donde saca su sentido. */}
        {/* `tj-fila-sigue`: la tira de pestañas se desplaza de lado y su
            barra va oculta a propósito, así que sin el desvanecido no
            había ningún indicio de que hubiera más. Medido a 390 px:
            335 px de 725 escondidos en /features, y 80 a 768 px. */}
        <div
          ref={tablist}
          role="tablist"
          aria-label={es ? "Pantallas del programa" : "Application screens"}
          className="tj-fila-sigue mt-10 mb-8 flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {ORDEN_LAMINAS.map((clave, i) => {
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
                /* Sólo la activa entra en el orden del tabulador: dentro de
                   un `tablist` se navega con flechas, y dejar las siete
                   tabulables obliga a pasar por todas para salir. */
                tabIndex={seleccionada ? 0 : -1}
                onClick={() => setActiva(clave)}
                onKeyDown={(e) => enTeclado(e, i)}
                className="shrink-0 rounded-[2px] px-3.5 py-2 text-[13px] transition-colors min-h-[44px]"
                style={{
                  color: seleccionada ? "var(--ink)" : "var(--ink-3)",
                  background: seleccionada ? "rgb(var(--divider) / 0.10)" : "transparent",
                  boxShadow: seleccionada
                    ? "inset 0 -2px 0 rgb(var(--accent-base) / 0.9)"
                    : "none",
                }}
              >
                <span className="tnum mr-2 text-[10.5px] tracking-[0.14em]" style={{ color: "rgb(var(--accent-base))" }}>
                  {l.roman}
                </span>
                {es ? l.pestanaEs : l.pestanaEn}
              </button>
            );
          })}
        </div>

        <div role="tabpanel" id={`${idBase}-panel`} aria-labelledby={`${idBase}-tab-${activa}`}>
          {/* `key` hace DOS cosas, y las dos hacen falta. Fuerza a React a
              reemplazar la lámina en vez de reutilizarla —sin él, el `<img>`
              conserva la imagen anterior mientras descarga la nueva y la
              pestaña parece no responder— y, al remontar el nodo, reinicia
              la animación de `tj-lamina-cambia`, que es lo que convierte el
              cambio en un gesto en vez de un corte. */}
          <div key={activa} className="tj-lamina-cambia">
            <ProductPlate lamina={lamina} />
          </div>
        </div>
      </div>
    </section>
  );
}
