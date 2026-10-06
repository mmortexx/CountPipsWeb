"use client";

import { useId, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { ProductPlate } from "@/components/tj/ProductPlate";
import { LAMINAS_PRODUCTO, ORDEN_LAMINAS } from "@/lib/laminas";

/**
 * Las siete pantallas del programa, una cada vez, en pestañas que imitan la
 * barra de secciones de la app. Solo monta la lámina activa: montar las siete
 * y esconder seis descargaría siete capturas para enseñar una. La portada
 * monta solo cuatro (`ProductShowcase`); aquí van las siete.
 */
export function GaleriaPantallas() {
  const { lang } = useLang();
  const es = lang === "es";
  const idBase = useId();
  const [activa, setActiva] = useState<string>(ORDEN_LAMINAS[0]);
  const tablist = useRef<HTMLDivElement>(null);

  const lamina = LAMINAS_PRODUCTO[activa];

  /* Flechas, Inicio y Fin entre pestañas (patrón de pestañas de la WAI); sin
     ellas el tabulador se pararía en las siete. */
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
      <div className="tj-container">
        <SectionHeader
          composicion="partida"
          titulo={
            <span id={`${idBase}-titulo`}>
              {es ? "Las siete pantallas, por dentro." : "The seven screens, from the inside."}
            </span>
          }
          entradilla={
            es
              ? "Capturas del programa con datos de muestra, no ilustraciones. Elige la pantalla y " +
                "mira lo que hay dentro: cada pie cuenta qué se está viendo y por qué esa pantalla " +
                "existe."
              : "Screenshots of the application with sample data, not illustrations, taken in its " +
                "Spanish interface; it also runs in English. Pick a screen " +
                "and look inside: each caption says what you are seeing and why that screen exists."
          }
        />

        <div
          ref={tablist}
          role="tablist"
          aria-label={es ? "Pantallas del programa" : "Application screens"}
          className="tj-pestanas -m-1 mt-9 mb-5 p-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                tabIndex={seleccionada ? 0 : -1}
                onClick={() => setActiva(clave)}
                onKeyDown={(e) => enTeclado(e, i)}
              >
                {es ? l.pestanaEs : l.pestanaEn}
              </button>
            );
          })}
        </div>

        <div role="tabpanel" id={`${idBase}-panel`} aria-labelledby={`${idBase}-tab-${activa}`}>
          {/* `key` fuerza a reemplazar la lámina (si no, el `<img>` conserva la
              anterior mientras descarga) y reinicia la animación
              `tj-lamina-cambia`. */}
          <div key={activa} className="tj-lamina-cambia">
            <ProductPlate lamina={lamina} />
          </div>
        </div>
      </div>
    </section>
  );
}
