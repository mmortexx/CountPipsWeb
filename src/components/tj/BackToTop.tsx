"use client";

import { useEffect, useRef, useState } from "react";
import { useLang } from "@/lib/i18n";
import { irArriba } from "@/lib/scroll";
import { CONSENT_VISIBILITY_EVENT } from "@/lib/consent";

/**
 * Botón flotante de volver arriba. Aparece tras 400 px de scroll. Por debajo de
 * 1280 px no cabe en el margen y taparía texto, así que ahí solo se ve al subir
 * o cerca del final. Se levanta para esquivar la barra final del pie
 * (`[data-pie-final]`) y el aviso de cookies; se mide el `bottom` real (con la
 * muesca de iOS) en vez de suponer 24 px. Al pulsarlo usa `irArriba()`
 * (src/lib/scroll.ts).
 */
const SHOW_AFTER = 400;
/** Hueco (px) entre el borde inferior del botón levantado y lo que
 *  esquiva: la barra final del pie o el aviso de cookies. */
const COOKIE_GAP_PX = 8;
/** Desde este ancho el botón cae en el margen, fuera del texto. */
const ANCHO_CON_MARGEN = 1280;
/** Píxeles de subida seguidos que cuentan como «quiere volver arriba». */
const UMBRAL_SUBIDA = 6;
/** A esta distancia del final se muestra siempre: se acabó la lectura. */
const CERCA_DEL_FINAL = 640;

export function BackToTop() {
  const { lang } = useLang();
  const es = lang === "es";

  // `visible` arranca en false sin mirar `window`: el inicializador también
  // corre al hidratar, y con la página ya desplazada el cliente montaría un
  // botón que el servidor no mandó (error de hidratación). `update()` lo
  // corrige al montar.
  const [visible, setVisible] = useState(false);
  // No entra en el árbol hasta que el visitante baja; entonces se queda.
  const [montado, setMontado] = useState(false);
  const [pieLift, setPieLift] = useState(0);
  const [cookieLift, setCookieLift] = useState(0);
  const anclaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let ticking = false;
    let ultimoY = window.scrollY;
    let subiendo = false;
    const update = () => {
      const scrollTop = window.scrollY;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const delta = scrollTop - ultimoY;
      if (Math.abs(delta) >= UMBRAL_SUBIDA) {
        subiendo = delta < 0;
        ultimoY = scrollTop;
      }
      const libre =
        window.innerWidth >= ANCHO_CON_MARGEN || subiendo || scrollable - scrollTop < CERCA_DEL_FINAL;
      const debeVerse = scrollTop > SHOW_AFTER && libre;
      if (debeVerse) setMontado(true);
      setVisible(debeVerse);
      // Borde inferior del botón sin levantar: el `bottom` del ancla ya lleva
      // la muesca; sin ancla, 24 px.
      const ancla = anclaRef.current;
      const baseBoton = window.innerHeight - (ancla ? parseFloat(getComputedStyle(ancla).bottom) || 24 : 24);
      const pie = document.querySelector<HTMLElement>("[data-pie-final]");
      const pieTop = pie ? pie.getBoundingClientRect().top : Infinity;
      setPieLift(pieTop < window.innerHeight ? Math.max(0, Math.round(baseBoton - (pieTop - COOKIE_GAP_PX))) : 0);
      // Levantamiento por el aviso de cookies: comparten banda vertical en
      // pantallas estrechas. El aviso solo existe en el DOM mientras se ve.
      let cLift = 0;
      const cookieEl = document.querySelector<HTMLElement>("[data-cookie-consent='visible']");
      if (cookieEl) {
        const rect = cookieEl.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight && rect.top >= 0) {
          // El borde inferior del botón, COOKIE_GAP_PX por encima del aviso.
          cLift = Math.max(0, baseBoton - (rect.top - COOKIE_GAP_PX));
        }
      }
      setCookieLift(Math.round(cLift));
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };
    // El alto del aviso cambia al reflujo (giro, barra del navegador en móvil).
    const onResize = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    // El aviso de cookies entra y sale sin scroll ni resize; avisa con un
    // evento, sin `MutationObserver` sobre el documento entero.
    window.addEventListener(CONSENT_VISIBILITY_EVENT, onResize);
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener(CONSENT_VISIBILITY_EVENT, onResize);
    };
  }, []);

  // El salto es largo por definición: `irArriba` anima solo el último tramo y
  // respeta `prefers-reduced-motion`.
  const scrollToTop = () => irArriba();

  // Lo que más obligue de los dos; sin ninguno, el botón en su sitio.
  const totalLift = Math.max(pieLift, cookieLift);

  if (!montado) return null;

  return (
    <>
      {/* El contenedor lleva el `fixed` y el levantamiento; el botón, su
          entrada: son dos transformaciones sobre el mismo eje y en un solo
          elemento la última pisa a la anterior. `pointer-events-none`
          evita que el contenedor intercepte clics con el botón oculto. */}
      <div
        ref={anclaRef}
        className="fixed right-[calc(env(safe-area-inset-right)+1.5rem)] bottom-[calc(env(safe-area-inset-bottom)+1.5rem)] z-40 pointer-events-none transition-transform duration-200 ease-[var(--ease-suave)] motion-reduce:transition-none"
        style={{ transform: `translateY(-${totalLift}px)` }}
      >
        {/* Visible por atributo (`.tj-emerge`, globals.css). `tabIndex={-1}`
            oculto: a opacidad cero seguiría siendo alcanzable con Tab. */}
        <button
          type="button"
          onClick={scrollToTop}
          aria-label={es ? "Volver arriba" : "Back to top"}
          data-visible={visible ? "true" : "false"}
          tabIndex={visible ? 0 : -1}
          className="tj-emerge tj-subir pointer-events-auto relative w-10 h-10 rounded-[4px] tj-cristal tj-cristal--denso flex items-center justify-center text-primary"
        >
              <svg
                className="relative"
                width="16"
                height="16"
                viewBox="0 0 18 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9 14V4M4 8l5-5 5 5" />
              </svg>
        </button>
      </div>
    </>
  );
}
