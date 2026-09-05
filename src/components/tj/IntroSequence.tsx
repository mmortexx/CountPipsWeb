"use client";

import { useEffect } from "react";
import { BRAND_GLYPH_SVG } from "@/components/tj/BrandGlyph";
import { curva } from "@/lib/motion";
import { levantarCortina } from "@/lib/intro";

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
   nadie lo note.

   ── Y SE VOLVIÓ A APRETAR, PORQUE 1,8 s ERAN CON LA CPU SUELTA ──────
   Ese 1,8 s se midió en un portátil de desarrollo. Con el freno a ×4 —un
   móvil de gama media, que es con lo que llega la mitad del tráfico— el
   titular tardaba 2.579 ms en ser legible, por encima del presupuesto de
   2.500 que `humo.mjs` da por bueno midiendo sin freno.

   Y no era culpa del rendimiento: era la coreografía. 850 de cortina más
   120 de pausa más 700 de fundido son 1,7 s de reloj que ninguna máquina
   puede acortar. Se recortan los cuatro tiempos manteniendo el gesto
   entero —cortina, contador, escalonado y fundido siguen ahí—, porque lo
   que hace elegante a una entrada es la curva, no cuánto dura.

   Lo vigila `scripts/arranque.mjs`, que mide esto CON el freno puesto:
   sin freno, cualquier cifra pasa y no se entera nadie. */
const LOADER_MS = 600;
const PAUSA_MS = 80;
const REVEAL_RETARDO_MS = 40;
/* 40 y no 55 desde que el escalonado va en la dirección del telón. Dos
   motivos, y los dos empujan al mismo sitio:

   · El canto del telón tarda unos 136 ms en recorrer el hero de abajo
     arriba (medido: la barra de specs se destapa a 1061 ms y la ceja a
     1197). Con 55 ms de paso, las seis piezas se reparten 275 ms y el
     escalonado se queda por detrás del canto; con 40 son 200 ms, que
     lo sigue de cerca.
   · Invertir el orden le pone al h1 el retardo largo en vez del corto,
     y el h1 es lo que `scripts/arranque.mjs` cronometra. Ese coste no
     se puede evitar del todo, sólo acotar: con paso de 40, medido tres
     veces por versión con el freno a ×4 (mediana), el titular pasa de
     1442 a 1530 ms — unos 90 ms, contra un presupuesto de 2500. El
     total de la secuencia no empeora: 2327 → 2308 ms.

     Se paga a sabiendas. Noventa milisegundos en una cifra que sobra
     por casi un segundo, a cambio de que la entrada del hero se vea en
     vez de ocurrir a oscuras, es un cambio que sale a favor. Si algún
     día ese presupuesto se aprieta, esto es lo primero que hay que
     mirar. */
const REVEAL_PASO_MS = 40;
const REVEAL_MS = 520;

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
      /* Sin telón, el atlas del fondo puede empezar su grabado ya. */
      levantarCortina();
      return () => window.clearTimeout(failsafe);
    }

    const seq = Array.from(
      document.querySelectorAll<HTMLElement>("[data-seq]")
    );

    /* ── EL ESCALÓN VA EN LA DIRECCIÓN DEL TELÓN ──────────────────────
       El telón sube, así que descubre la pantalla de ABAJO ARRIBA: la
       barra de specs asoma primero y la ceja la última. El escalonado
       iba al revés —de arriba abajo, por orden de lectura—, y las dos
       cosas se peleaban por el mismo segundo: las piezas de arriba
       tenían el retardo más corto justo donde el telón tardaba más en
       quitarse de en medio.

       Medido en la portada a 1440×900, opacidad de cada pieza en el
       instante en que el telón la destapa (0,00 = entra entera a la
       vista; 1,00 = ya entró a oscuras):

         ceja  h1    subtít.  CTA   CTA   specs
         1,00  1,00   0,98    0,95  0,90  0,36   ← antes
         0,88  0,61   0,00    0,00  0,00  0,00   ← sólo con la curva nueva
         0,00  0,00   0,00    0,00  0,00  0,00   ← con el escalón invertido

       Invertirlo no cuesta un milisegundo y convierte dos animaciones
       que competían en un solo gesto: el telón sube y la página sube
       detrás de él. El orden de lectura no se pierde —las seis piezas
       caben en 600 ms, que el ojo lee como dirección de movimiento y no
       como secuencia—. */
    const reveal = () => {
      const ultimo = seq.length - 1;
      seq.forEach((el, indice) => {
        const i = ultimo - indice;
        el.animate(
          [
            /* Sin `filter: blur()`. El desenfoque no se compone: obliga
               a rasterizar el elemento entero en CADA fotograma, y aquí lo
               llevaban los siete `[data-seq]` —incluido el h1, que es el
               elemento más grande de la primera pantalla— durante la
               hidratación, que es el peor momento del arranque. El gesto
               que se lee es la subida con el fundido; el desenfoque sólo
               se notaba en la factura. */
            { opacity: 0, transform: "translateY(30px)" },
            { opacity: 1, transform: "none" },
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
      /* La barra va al 100 % de ancho y se escala. Antes se le escribía
         `width` en cada fotograma durante 850 ms —justo mientras React
         hidrata—, y cambiar el ancho obliga a rehacer la maquetación;
         `transform` lo resuelve el compositor sin tocar el documento.
         `transform-origin: left` para que crezca desde la izquierda y no
         desde el centro. */
      '<div style="position:absolute;left:0;right:0;bottom:0;height:2px;background:rgb(var(--divider) / 0.06)"><div data-lb style="height:100%;width:100%;transform:scaleX(0);transform-origin:left;background:linear-gradient(90deg,rgb(var(--accent-base)),rgb(var(--accent-hover)));"></div></div>' +
      '<div style="display:flex;flex-direction:column;align-items:center;gap:15px">' +
      '<span style="width:46px;height:46px;border-radius:12px;background:color-mix(in srgb,var(--surface) 66%,transparent);border:1px solid rgb(var(--divider) / 0.13);display:grid;place-items:center">' +
      /* 30 px en una placa de 46: a menos, la reticula de puntos del
         logotipo quedaba nadando en el centro. */
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
        (typeof document !== "undefined" && document.documentElement.lang === "en") ||
        (typeof window !== "undefined" && (window.location.pathname === "/en" || window.location.pathname.startsWith("/en/")))
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
      if (bar) bar.style.transform = `scaleX(${e.toFixed(4)})`;
      if (p < 1) {
        rafId = requestAnimationFrame(tick);
      } else {
        window.setTimeout(() => {
          ov.classList.add("done");
          /* La cortina empieza a subir: el fondo arranca su grabado de
             bienvenida AHORA y no al montarse, para que el trazo se vea
             desde el primer punto en vez de nacer detrás del telón. */
          levantarCortina();
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
