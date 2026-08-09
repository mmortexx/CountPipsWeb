"use client";

import { useEffect } from "react";
import { BRAND_GLYPH_SVG } from "@/components/tj/BrandGlyph";
import { curva } from "@/lib/motion";

/**
 * IntroSequence — puerto del `_intro()` del HTML de referencia.
 *
 * Primera visita de la sesión (sessionStorage `tj_intro` vacío):
 *  1. Un script inline en el <head> (layout.tsx) añade `.tj-preload` al
 *     <html> ANTES del primer paint, así los elementos `[data-seq]`
 *     (hero) arrancan ocultos (opacity 0, y+30, blur 7px) sin flash.
 *  2. Este componente monta el loader #tj-loader (logo + marca + barra
 *     de progreso + contador fantasma 000→100 en 1.45 s, easeOutCubic).
 *  3. Al llegar a 100: cortina hacia arriba (`.done`, 0.9 s) y reveal
 *     escalonado de los [data-seq] (delay 50 + i·110 ms, 1.15 s con
 *     blur→0). El overlay se retira del DOM al terminar.
 *
 * Visitas siguientes: sin loader y sin animación (igual que el HTML:
 * los elementos nunca se ocultan). `prefers-reduced-motion`: todo
 * visible al instante.
 *
 * Detalles anti-conflicto con React:
 *  - El reveal usa Web Animations API (`el.animate()` con fill both),
 *    que NO escribe atributos del DOM — los elementos del hero pueden
 *    estar aún hidratándose (islas Suspense) sin provocar mismatches.
 *  - La clase de ocultación vive en <html> (fuera del árbol React) y
 *    el overlay del loader se cuelga de <body> imperativamente; React
 *    nunca reconcilia ninguno de los dos.
 *  - globals.css lleva además un failsafe CSS puro que fuerza la
 *    visibilidad a los 5 s si este componente nunca llegara a montar.
 */
/* ── EL PRESUPUESTO DE LA INTRO ────────────────────────────────────────
   La secuencia costaba unos 3 SEGUNDOS hasta que el titular de la
   portada era legible: 1.450 ms de contador, 220 de pausa, 50 + 110 de
   escalonado y 1.150 de entrada. Y el titular de la portada es el
   elemento más grande de la primera pantalla, o sea, lo que el navegador
   mide como tiempo de carga percibido. Tres segundos de pantalla de
   espera en una web comercial es justo donde las visitas empiezan a
   marcharse.

   No se retira la intro: es una decisión de marca deliberada y sólo la
   ve quien llega por primera vez en la sesión. Se APRIETA — mismo gesto,
   misma cortina, mismo contador, en algo menos de la mitad de tiempo. El
   titular queda legible sobre 1,8 s, y `scripts/humo.mjs` vigila ese
   presupuesto en cada comprobación para que no vuelva a crecer sin que
   nadie lo note. */
const LOADER_MS = 850;
const PAUSA_MS = 120;
const REVEAL_RETARDO_MS = 50;
const REVEAL_PASO_MS = 70;
const REVEAL_MS = 700;

export function IntroSequence() {
  useEffect(() => {
    const root = document.documentElement;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let first = false;
    try {
      first = !sessionStorage.getItem("tj_intro");
      sessionStorage.setItem("tj_intro", "1");
    } catch {
      /* storage bloqueado — se comporta como visita repetida */
    }

    // Red de seguridad JS: pase lo que pase, nada queda oculto tras 4,2 s.
    const failsafe = window.setTimeout(() => {
      root.classList.remove("tj-preload");
    }, 4200);

    if (reduce || !first) {
      root.classList.remove("tj-preload");
      return () => window.clearTimeout(failsafe);
    }

    const seq = Array.from(
      document.querySelectorAll<HTMLElement>("[data-seq]")
    );

    const reveal = () => {
      seq.forEach((el, i) => {
        el.animate(
          [
            { opacity: 0, transform: "translateY(30px)", filter: "blur(7px)" },
            { opacity: 1, transform: "none", filter: "blur(0px)" },
          ],
          {
            duration: REVEAL_MS,
            delay: REVEAL_RETARDO_MS + i * REVEAL_PASO_MS,
            // `curva()` resuelve el token del CSS: la Web Animations API
            // no admite `var(...)` aquí (ver src/lib/motion.ts).
            easing: curva("--ease-salida"),
            // `both`: mantiene el primer keyframe (oculto) durante el
            // delay — sin salto al retirar la clase — y el último al
            // acabar (que coincide con el estado natural del elemento).
            fill: "both",
          }
        );
      });
      // Con las animaciones ya registradas (frame siguiente), retirar la
      // clase de ocultación: WAAPI gobierna el visual desde ese momento.
      requestAnimationFrame(() => {
        root.classList.remove("tj-preload");
      });
    };

    // ---- Loader de primera visita ----
    const ov = document.createElement("div");
    ov.id = "tj-loader";
    ov.innerHTML =
      '<div style="position:absolute;left:0;right:0;bottom:0;height:2px;background:rgb(var(--divider) / 0.06)"><div data-lb style="height:100%;width:0;background:linear-gradient(90deg,rgb(var(--accent-base)),rgb(var(--accent-hover)));"></div></div>' +
      '<div style="display:flex;flex-direction:column;align-items:center;gap:15px">' +
      '<span style="width:46px;height:46px;border-radius:12px;background:color-mix(in srgb,var(--surface) 66%,transparent);border:1px solid rgb(var(--divider) / 0.13);display:grid;place-items:center">' +
      /* 30 px en una placa de 46: el logotipo es un icono macizo, no la
         silueta abierta de antes, y a 22 quedaba nadando en el centro. */
      BRAND_GLYPH_SVG(30) +
      "</span>" +
      '<div class="font-serif" style="font-size:25px;color:var(--ink);letter-spacing:-.01em">CountPips</div>' +
      /* El lema iba en español fijo, y esta es la PRIMERA pantalla que
         ve quien entra por `/en`: antes del hero, antes de la barra,
         antes de nada. El idioma se lee del `<html>`, que el script del
         layout ya ha corregido antes del primer pintado —este loader se
         monta en un efecto, mucho después—, así que no hay carrera. No
         se usa `useLang()` porque el nodo se construye con `innerHTML`
         fuera del árbol de React. */
      `<div class="tnum" style="font-size:10.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--ink-3)">${
        document.documentElement.lang === "en"
          ? "Made for the serious manual trader"
          : "Hecho para el trader manual serio"
      }</div>` +
      "</div>" +
      '<div data-ln class="tnum" style="position:absolute;right:26px;bottom:10px;font-size:clamp(3rem,9vw,7rem);font-weight:500;line-height:.8;color:color-mix(in srgb,var(--ink) 13%,transparent)">000</div>';
    document.body.appendChild(ov);

    const num = ov.querySelector<HTMLElement>("[data-ln]");
    const bar = ov.querySelector<HTMLElement>("[data-lb]");
    const t0 = performance.now();
    const dur = LOADER_MS;
    let rafId = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      const v = Math.round(e * 100);
      if (num) num.textContent = ("00" + v).slice(-3);
      if (bar) bar.style.width = (e * 100).toFixed(1) + "%";
      if (p < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        window.setTimeout(() => {
          ov.classList.add("done");
          reveal();
          window.setTimeout(() => {
            ov.remove();
          }, 950);
        }, PAUSA_MS);
      }
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      window.clearTimeout(failsafe);
      cancelAnimationFrame(rafId);
      ov.remove();
      root.classList.remove("tj-preload");
    };
  }, []);

  return null;
}
