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
      className="section relative overflow-clip border-y border-[var(--line)] bg-[var(--surface)]"
      aria-labelledby="producto-titulo"
    >
      <div className="tj-container">
        <div className="mb-10 max-w-[40rem]">
          <p className="eyebrow">{es ? "El programa" : "The application"}</p>
          <h2 id="producto-titulo" className="t-h2 mt-5 text-primary">
            {es ? "Esto es lo que abres cada mañana." : "This is what you open every morning."}
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-secondary">
            {es
              ? "Capturas reales del programa con datos de muestra. Elige una pantalla."
              : "Real screenshots of the application with sample data. Pick a screen."}
          </p>
        </div>

        <div
          ref={tablist}
          role="tablist"
          aria-label={es ? "Pantallas del programa" : "Application screens"}
          className="tj-pestanas mb-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
            <ProductPlate lamina={lamina} priority={activa === PANTALLAS_PORTADA[0]} />
          </div>
        </div>

        <div className="mt-10">
          <Link href="/demo" className="cta cta--primario">
            {es ? "Recorrer la demo sin registro" : "Explore the demo, no sign-up"}
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
