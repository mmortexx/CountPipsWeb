"use client";

import { useId, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import { Link } from "@/components/tj/LocaleLink";
import { ProductPlate } from "@/components/tj/ProductPlate";
import { LAMINAS_PRODUCTO } from "@/lib/laminas";

/**
 * Sección de la portada que enseña el programa con capturas reales, una cada
 * vez en pestañas (imitan la barra de la app y ahorran scroll; solo se monta
 * la activa). Las láminas entran por `ProductPlate`, que ya sirve la captura
 * del tema activo y un recorte para pantalla estrecha: un marco propio
 * taparía con su degradado la parte baja de la interfaz, donde van las cifras.
 */

/** Las cuatro pantallas de la portada: resumen, registro, histórico y
    analítica. El guardián tiene sección propia. */
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
      className="section tj-banda relative overflow-clip"
      aria-labelledby="producto-titulo"
    >
      <div className="tj-container">
        <div className="mb-10 grid gap-y-6 lg:grid-cols-2 lg:items-end lg:gap-x-16 xl:gap-x-24">
          <div>
            <p className="eyebrow">{es ? "El programa" : "The application"}</p>
            <h2 id="producto-titulo" className="t-h2 mt-5 max-w-[16ch] text-primary">
              {es ? "Esto es lo que abres cada mañana." : "This is what you open every morning."}
            </h2>
          </div>
          <div className="lg:pb-1">
            <p className="max-w-[46ch] t-entradilla text-secondary">
              {es
                ? "Capturas reales del programa con datos de muestra. Elige una pantalla."
                : "Real screenshots of the application with sample data, taken in its Spanish interface; it also runs in English. Pick a screen."}
            </p>
            <div className="mt-5">
              <Link href="/demo" className="cta cta--secundario">
                {es ? "Recorrer la demo sin registro" : "Explore the demo, no sign-up"}
              </Link>
            </div>
          </div>
        </div>

        <div
          ref={tablist}
          role="tablist"
          aria-label={es ? "Pantallas del programa" : "Application screens"}
          className="tj-pestanas -m-1 mb-5 p-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
          <div key={activa} className="tj-lamina-cambia">
            <ProductPlate lamina={lamina} />
          </div>
        </div>
      </div>
    </section>
  );
}
