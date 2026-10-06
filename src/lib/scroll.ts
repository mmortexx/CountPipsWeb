/**
 * Desplazamientos de página decididos por el sitio, con un criterio por
 * distancia: menos de dos pantallas se anima entero; más, se salta hasta un
 * tramo del destino y solo ese tramo se anima (un `scroll-behavior: smooth`
 * global rebobinaría diez pantallas). Con `prefers-reduced-motion` no se
 * anima nada.
 */

/** Distancia, en pantallas, a partir de la cual el recorrido deja de ser legible. */
const LARGO_MAXIMO = 2;

/** Tramo final que se anima cuando el salto es largo. */
const ATERRIZAJE_PX = 220;

/** Duración del tramo animado, en milisegundos. */
const DURACION_MS = 280;

/** `true` si el visitante ha pedido que no se le anime nada. */
function sinMovimiento(): boolean {
  return (
    typeof matchMedia === "function" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** La animación en curso, para que dos clics seguidos no se peleen. */
let animacion = 0;

/**
 * Anima el tramo corto a mano. No vale `behavior: "smooth"`: encadenado tras
 * el salto, Chrome trata los dos desplazamientos como uno, descarta el
 * segundo y la página se queda en el punto de aterrizaje. A mano, además, la
 * duración es fija y se puede abandonar al primer gesto del visitante.
 */
function animarHasta(destino: number): void {
  const inicio = window.scrollY;
  const salto = destino - inicio;
  const t0 = performance.now();

  cancelAnimationFrame(animacion);

  // Si el visitante toca la rueda, la pantalla o el teclado, se abandona donde esté.
  const rendirse = () => {
    cancelAnimationFrame(animacion);
    quitar();
  };
  const opts = { passive: true, once: true } as const;
  const quitar = () => {
    window.removeEventListener("wheel", rendirse);
    window.removeEventListener("touchstart", rendirse);
    window.removeEventListener("keydown", rendirse);
  };
  window.addEventListener("wheel", rendirse, opts);
  window.addEventListener("touchstart", rendirse, opts);
  window.addEventListener("keydown", rendirse, { once: true });

  const paso = (ahora: number) => {
    const t = Math.min(1, (ahora - t0) / DURACION_MS);
    // Salida cúbica: arranca a velocidad plena y frena al final.
    const e = 1 - Math.pow(1 - t, 3);
    window.scrollTo(0, Math.round(inicio + salto * e));
    if (t < 1) animacion = requestAnimationFrame(paso);
    else quitar();
  };
  animacion = requestAnimationFrame(paso);
}

/** Lleva la página a una posición vertical; `top` se recorta a los límites reales del documento. */
export function irA(top: number): void {
  if (typeof window === "undefined") return;

  const maximo = Math.max(
    0,
    document.documentElement.scrollHeight - window.innerHeight,
  );
  const destino = Math.min(Math.max(0, Math.round(top)), maximo);
  const desde = window.scrollY;
  const distancia = Math.abs(destino - desde);

  // Ya estamos donde hay que estar: moverse 3 px se ve como un temblor.
  if (distancia <= 4) return;

  if (sinMovimiento()) {
    cancelAnimationFrame(animacion);
    window.scrollTo(0, destino);
    return;
  }

  if (distancia > window.innerHeight * LARGO_MAXIMO) {
    /* Salto: el aterrizaje queda del lado del que se venía, para que el tramo
       final siga la dirección del gesto. */
    const sentido = destino > desde ? -1 : 1;
    const intermedio = Math.min(
      Math.max(0, destino + sentido * ATERRIZAJE_PX),
      maximo,
    );
    cancelAnimationFrame(animacion);
    window.scrollTo(0, intermedio);
  }

  animarHasta(destino);
}

/** La cabecera de la página. */
export function irArriba(): void {
  irA(0);
}

/**
 * Lleva la página a una sección por su id, respetando su `scroll-margin-top`.
 * Devuelve `false` si no existe, para que quien llama deje actuar al navegador.
 */
export function irASeccion(id: string): boolean {
  if (typeof document === "undefined") return false;
  const el = document.getElementById(id);
  if (!el) return false;
  const margen = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  irA(el.getBoundingClientRect().top + window.scrollY - margen);
  /* Sin el salto nativo se pierde lo que el ancla hace sola: mover el punto
     de partida del tabulador; si no, el siguiente Tab esquiva la sección (WCAG 2.4.3). */
  if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
  el.setAttribute("data-destino-salto", "");
  el.focus({ preventScroll: true });
  return true;
}
