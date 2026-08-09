/**
 * Cómo se mueve la página cuando el sitio decide moverla.
 *
 * ── El problema que resuelve ──────────────────────────────────────────
 * `html { scroll-behavior: smooth }` estaba puesto para todo el
 * documento, y con él cualquier salto —un ancla del menú, el botón de
 * volver arriba, el índice lateral— se animaba de principio a fin. En un
 * ancla cercana eso se agradece. Desde el pie de una página larga hasta
 * la cabecera son ocho o diez pantallas, y el navegador las recorre
 * todas: se ve el sitio entero pasar hacia atrás a toda velocidad, con
 * las secciones apareciendo y desapareciendo por el camino. No es una
 * transición, es un rebobinado.
 *
 * ── Lo que se hace en su lugar ────────────────────────────────────────
 * Un solo criterio, por distancia:
 *
 *   · **Menos de dos pantallas** — suave de verdad. Es un
 *     desplazamiento que el ojo puede seguir, y seguirlo es lo que le
 *     dice al visitante que no ha cambiado de página.
 *   · **Más de dos pantallas** — se salta hasta un palmo del destino y
 *     sólo ese palmo se anima. Ese último tramo llega en el mismo gesto
 *     que un recorrido corto, así que la llegada se lee igual de
 *     asentada; lo que desaparece es el viaje por en medio, que era la
 *     parte que no aportaba nada.
 *
 * Y por encima de todo, `prefers-reduced-motion`: quien lo pide no ve
 * ninguna animación, ni siquiera el tramo corto.
 */

/** A partir de aquí el recorrido deja de ser legible y pasa a ser ruido. */
const LARGO_MAXIMO = 2; // pantallas

/**
 * El tramo final que sí se anima cuando el salto es largo.
 *
 * 220 px es algo más de un palmo en pantalla: suficiente para que el
 * movimiento se perciba como una llegada y no como un parpadeo, y lo
 * bastante corto para que ninguna sección intermedia entre y salga por
 * el camino.
 */
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
 * Anima el tramo corto a mano, fotograma a fotograma.
 *
 * ── Por qué no `behavior: "smooth"` ───────────────────────────────────
 * Porque encadenado no funciona. La secuencia es «salta hasta un palmo
 * del destino y anima ese palmo», y medido en Chrome sobre la portada
 * —de 10.751 px a 0— el salto se aplicaba y la animación siguiente se
 * descartaba sin más: la página se quedaba clavada en el punto de
 * aterrizaje, a 220 px del destino. El navegador trata los dos
 * desplazamientos como uno solo y se queda con el primero, y eso no es
 * algo que se pueda pedir de otra manera.
 *
 * Hacerlo a mano cuesta veinte líneas y a cambio la duración es la que
 * se decide aquí —no la que el navegador estime por distancia—, así que
 * la llegada dura lo mismo venga de donde venga. Y se puede rendir al
 * primer gesto del visitante, que el scroll suave nativo tampoco deja
 * hacer.
 */
function animarHasta(destino: number): void {
  const inicio = window.scrollY;
  const salto = destino - inicio;
  const t0 = performance.now();

  cancelAnimationFrame(animacion);

  /* Si el visitante toca la rueda, la pantalla o el teclado, la página
     es suya: se abandona donde esté en ese momento. */
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
    // Salida suave (cúbica): arranca a velocidad plena y frena al final,
    // que es como se detiene un objeto con inercia.
    const e = 1 - Math.pow(1 - t, 3);
    window.scrollTo(0, Math.round(inicio + salto * e));
    if (t < 1) animacion = requestAnimationFrame(paso);
    else quitar();
  };
  animacion = requestAnimationFrame(paso);
}

/**
 * Lleva la página a una posición vertical concreta.
 *
 * `top` se recorta a los límites reales del documento: pedir un destino
 * fuera de rango dejaría la fase de aterrizaje esperando un movimiento
 * que el navegador no puede hacer.
 */
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
    /* Salto. El punto de aterrizaje se coloca del lado del que se venía
       —por debajo del destino si subimos, por encima si bajamos—, así
       que el tramo que queda va en la misma dirección que el gesto y no
       hay un cambio de sentido a mitad de camino. */
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
 * Lleva la página a una sección por su identificador.
 *
 * Respeta el `scroll-margin-top` que la sección declare, que es lo que
 * evita que la barra de navegación fija tape su titular al llegar.
 * Devuelve `false` si la sección no existe, para que quien llama pueda
 * dejar que el navegador haga lo suyo.
 */
export function irASeccion(id: string): boolean {
  if (typeof document === "undefined") return false;
  const el = document.getElementById(id);
  if (!el) return false;
  const margen = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  irA(el.getBoundingClientRect().top + window.scrollY - margen);
  return true;
}
