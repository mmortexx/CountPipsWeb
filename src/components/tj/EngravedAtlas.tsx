"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { alLevantarCortina } from "@/lib/intro";
import {
  platesForRoute,
  ROTULOS,
  SERIES_ROTULOS,
  type PlateId,
  type RotuloId,
} from "@/lib/atlas";

/**
 * ── EL IDIOMA DE LOS RÓTULOS GRABADOS ─────────────────────────────────
 * El pie de cada lámina lleva desde el principio en los dos idiomas, pero
 * lo que se pinta DENTRO del dibujo estaba escrito a mano en español. En
 * `/en` el resultado era un pie en inglés bajo una figura rotulada «TECHO
 * HISTÓRICO».
 *
 * El idioma se guarda en una variable de módulo, no se pasa por las
 * diecisiete funciones de dibujo: `plateChrome` y las dieciséis `plate*`
 * reciben ya seis o siete argumentos cada una, y añadirles uno más que sólo
 * usan para consultar un diccionario ensucia diecisiete firmas para
 * resolver algo que es de ámbito global — mientras se dibuja un fotograma,
 * el idioma es uno solo.
 *
 * Se fija en cada repintado desde `<html lang>`, que es la fuente que el
 * `postbuild` deja correcta en las 76 páginas inglesas.
 */
let idiomaRotulos: "es" | "en" = "es";

/** El rótulo, en el idioma del documento. */
function rot(id: RotuloId): string {
  return ROTULOS[id][idiomaRotulos];
}

/** Una serie de rótulos (ejes, días, plazas), en el idioma del documento. */
function serie(id: keyof typeof SERIES_ROTULOS): readonly string[] {
  return SERIES_ROTULOS[id][idiomaRotulos];
}

/**
 * EngravedAtlas — el fondo del sitio: un atlas grabado a lápiz.
 *
 * Un atlas es el libro de láminas de un tratado. Este se pasa solo: al
 * bajar por la página, el fondo va GRABANDO una lámina tras otra, trazo
 * a trazo, y cada lámina es una pantalla real de la aplicación.
 *
 *   I.   La curva de rendimiento — capital, techo histórico y drawdown.
 *   II.  El calendario de resultados — el mes día a día.
 *   III. La distribución de R — dónde cae de verdad cada operación.
 *   IV.  El cuadrante de riesgo — cuánto queda antes del límite.
 *
 * ── Por qué NO es una secuencia de fotogramas ─────────────────────────
 * El recurso habitual para un fondo que avanza con el scroll es un vídeo
 * despiezado en 200-400 imágenes que se pintan en un canvas. Funciona,
 * pero cuesta entre 8 y 40 MB, hay que esperar a que descargue antes de
 * que el efecto exista, y queda pixelado en pantallas grandes porque son
 * mapas de bits de tamaño fijo.
 *
 * Aquí no hay fotogramas: hay GEOMETRÍA. Cada lámina se calcula y se
 * dibuja en el momento, así que el fondo entero pesa 0 kB de descarga,
 * es nítido a cualquier resolución, arranca al instante y puede
 * dibujarse A MEDIAS — que es justo lo que permite el efecto de que se
 * esté grabando delante de ti. Un vídeo solo sabe reproducirse; esto
 * sabe dibujarse.
 *
 * ── La lámina, no el diagrama ─────────────────────────────────────────
 * Una primera versión dibujaba solo la figura: curva, ejes, retícula.
 * Salía limpia y salía sosa — un gráfico, no una lámina. Lo que hace que
 * una plancha del XIX se lea como pieza dibujada no es la figura
 * central, es todo lo que la rodea, y aquí está todo:
 *
 *   · MARCO de filete doble con las esquinas REBASADAS. Cuando alguien
 *     traza un rectángulo con regla, las líneas se cruzan un poco en las
 *     esquinas. Ese defecto es la firma de la mano y se dibuja a
 *     propósito; sin él, el marco delata la máquina.
 *   · COLOFÓN de cierre: dos filetes y un rombo, sin rotular nada — a
 *     la figura la nombra su pie, que vive en la página.
 *   · ROSETONES en las cuatro esquinas interiores.
 *   · DETALLE AMPLIADO: un círculo que agranda un fragmento de la figura
 *     y se une a su origen con dos líneas guía. Es EL recurso de la
 *     lámina científica, y aquí amplía justo el peor drawdown.
 *   · ANOTACIONES al margen y escala graduada con sus divisiones.
 *   · SOMBREADO de grafito: trama cruzada más el polvillo de grano que
 *     deja el lápiz al insistir.
 *
 * ── Cómo se consigue el trazo "a lápiz" ───────────────────────────────
 *  - REVELADO POR LONGITUD. Cada línea conoce su recorrido y se pinta
 *    solo hasta el punto que le toca; el buril parece ir avanzando en
 *    vez de aparecer la figura de golpe.
 *  - VARIAS PASADAS. Un trazo importante se repasa dos o tres veces, y
 *    cada pasada lleva su propio temblor y su propia altura. Una sola
 *    línea a opacidad plena sale de vector y canta.
 *  - GROSOR Y OPACIDAD VARIABLES a lo largo del recorrido.
 *  - TEMBLOR DETERMINISTA: un desvío mínimo por punto, siempre el mismo
 *    para el mismo punto. La mano nunca es perfecta; un `Math.random()`
 *    sí lo parecería, además de bailar en cada fotograma y romper la
 *    hidratación.
 *  - TRAMA en vez de relleno: un lápiz no rellena, raya. Los grises
 *    salen de rayar más o menos junto.
 *
 * ── El arranque ───────────────────────────────────────────────────────
 * En p=0 la primera lámina estaría en blanco, así que quien abre la
 * página encontraba un fondo vacío y no se enteraba de que existe. Al
 * montar, la lámina I se graba SOLA durante unos segundos hasta media
 * altura; a partir de ahí manda el scroll. Se entra viendo dibujar.
 *
 * ── Rendimiento ───────────────────────────────────────────────────────
 *  - El scroll solo APUNTA un objetivo; quien dibuja es un bucle de rAF
 *    que lo persigue con suavizado exponencial, así el trazo va fluido
 *    aunque la rueda dé saltos, y nunca se dibuja dentro del manejador
 *    de scroll.
 *  - Si el progreso no se movió lo suficiente, no se redibuja. Parado,
 *    el coste es cero.
 *  - El bucle se detiene con la pestaña oculta.
 *  - dpr limitado a 2.
 *  - Con `prefers-reduced-motion` no hay bucle ni grabado inicial: la
 *    lámina que toque se dibuja entera de una vez. Quien pide menos
 *    movimiento sigue viendo el atlas, no un hueco.
 */

/* ══════════════════════════════════════════════════════════════════════
   EL REVELADO POR TRAMA — el trazo se imprime en puntos
   ══════════════════════════════════════════════════════════════════════
   Las dieciséis láminas se siguen DIBUJANDO igual: mismas curvas, mismos
   rótulos, mismo temblor de pulso, mismo revelado por longitud. Lo que
   cambia es cómo se IMPRIMEN. En vez de estampar el trazo tal cual, se
   muestrea y se vuelve a componer como una trama de puntos, igual que una
   plancha de medio tono.

   ── POR QUÉ, Y NO ES DECORACIÓN ───────────────────────────────────────
   El problema que resuelve estaba escrito en este mismo archivo: «una sola
   línea a opacidad plena sale de vector y canta». Por eso el atlas vivía a
   una décima parte de tinta — y a esa fuerza, la figura ya no es una
   figura: es una mancha. Tres intentos anteriores lo atacaron bajando el
   velo, ensanchando los márgenes y oscureciendo el lápiz, y ninguno
   funcionó, porque el problema no era de opacidad.

   Un punto no canta. Una trama admite tinta plena sin leerse como vector,
   porque el ojo no la lee como línea sino como MATERIAL — que es
   exactamente lo que hay debajo: papel impreso. Así que el revelado por
   trama es lo que permite subir la figura hasta que se vea de verdad, que
   es lo único que le faltaba al atlas.

   Y hay una segunda razón, que es la que hace que esto sea de ESTE
   producto y no de cualquiera: una trama de medio tono es, literalmente,
   una rejilla de muestreo. El tamaño de cada punto es la densidad de tinta
   de ese cuadrito, y la densidad de tinta de estas láminas es el dato —
   la curva, la caída, el calendario, la distribución de R. Los puntos no
   dibujan un adorno: dibujan la magnitud.

   ── CÓMO ─────────────────────────────────────────────────────────────
   No se toca ni una línea de las láminas. Se dibuja la lámina DOS veces:

     1. En una MÁSCARA diminuta, a escala 1/PASO. Un trazo de 1 px sale de
        0,2 px, y el navegador lo resuelve con antialiasing — que es
        justamente medir cuánta tinta cae en ese píxel. El canal alfa de la
        máscara ES la cobertura. No hay que aproximar nada: el propio
        rasterizador ya hace la integral.
     2. En el lienzo real, un punto por celda, con el ÁREA proporcional a
        la cobertura (de ahí la raíz cuadrada del radio: duplicar el radio
        cuadruplica el área, y lo que tiene que ser proporcional es la
        tinta, no la anchura).

   El coste está acotado por diseño. La máscara de una ventana de 1440×900
   con paso 5 son 288×180 = 51.840 celdas: leerla entera es medio milisegundo
   y no depende de la densidad de pantalla. Y los puntos que de verdad se
   pintan son pocos, porque un dibujo de línea cubre un porcentaje pequeño
   del papel; van todos en un único `Path2D` que se rellena de una sola vez,
   así que son dos llamadas al contexto y no seis mil.

   Ojo al orden: esto vive DENTRO del lienzo cacheado de cada lámina, o
   sea que solo corre cuando el trazo AVANZA, no en cada fotograma. Una
   lámina terminada se trama una vez y a partir de ahí solo se estampa. */

/** Interruptor de comparación. Se deja escrito porque la única forma
 *  honesta de saber lo que cuesta el revelado es medir el MISMO recorrido
 *  con él y sin él; ponerlo a `false` devuelve el trazo de línea. */
/** Separación entre centros de punto, en píxeles CSS.
 *
 *  ESTE NÚMERO MANDA SOBRE EL PRESUPUESTO DE FOTOGRAMAS. El coste de
 *  regrabar una lámina crece con el CUADRADO de la densidad: a paso 3,2
 *  una ventana de 1440×900 son 126.504 celdas frente a las 36.000 del
 *  paso 6, y un regrabado —que no se puede partir— se iba a 75 ms
 *  medidos por el banco (`scripts/fluidez.mjs`), con un presupuesto de
 *  28. El «micro-estipulado hiperdenso» se retiró por eso: no era un
 *  cambio de gusto, era una regresión de fluidez que el banco pilló.
 *  Si se quiere densificar, se mide FLUIDEZ con cada paso y se queda
 *  el número más fino que lo respete. */
const PASO_TRAMA = 6;

/* ── CUÁNTAS VECES SE REVELA UNA LÁMINA MIENTRAS AVANZA ────────────────
   48 pasos: suficientes para que el avance se lea continuo (un paso es
   una fracción de punto de trama) sin multiplicar los regrabados — cada
   paso extra es otra pasada por el muestreo completo de la máscara. */
const PASOS_TRAZO = 48;
/** Radio máximo, en fracción del paso. */
const RADIO_TRAMA = 0.44;
/** Amplificación de la cobertura muestreada. Con el paso 6, compensa la
    rejilla más gruesa subiendo la tinta de las coberturas parciales. */
const GANANCIA_TRAMA = 3.4;
/** Cobertura por debajo de la cual no se pinta punto. */
const UMBRAL_TRAMA = 0.06;

/* ── EL ASIENTO: un punto no aparece colocado, se COLOCA ─────────────── */
const VENTANA_ASIENTO = 0.055;
/** Cuánto se aparta de su casilla un punto recién nacido, en píxeles. */
const DISPERSION_TRAMA = PASO_TRAMA * 1.5;
/** Tamaño del punto recién nacido, en fracción del que tendrá asentado. */
const CRIA_TRAMA = 0.35;
/** A partir de aquí la lámina fuerza el asiento de todo lo que le quede. */
const CIERRE_ASIENTO = 0.9;

const R_MAX = PASO_TRAMA * RADIO_TRAMA;
const R_PLENO_LUT = new Float32Array(256);
for (let b = 0; b < 256; b++) {
  const alfa = b / 255;
  const cobertura = alfa * GANANCIA_TRAMA;
  if (cobertura < UMBRAL_TRAMA) {
    R_PLENO_LUT[b] = 0;
  } else {
    R_PLENO_LUT[b] = R_MAX * Math.sqrt(cobertura > 1 ? 1 : cobertura);
  }
}

/**
 * Dibuja `lamina` en `destino` convertida en trama de puntos.
 *
 * `mascara` se reutiliza entre llamadas: crear un lienzo por repintado es
 * lo único de todo esto que sí costaría.
 *
 * `nacido` recuerda, por celda, el progreso al que recibió tinta por
 * primera vez (−1 = vacía). Vive en la capa de cada lámina y no aquí,
 * porque cada figura tiene su propio recorrido; compartirlo mezclaría el
 * asiento de una con el de la siguiente en cada transición.
 */
function tramar(
  destino: CanvasRenderingContext2D,
  mascara: CanvasRenderingContext2D,
  lamina: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void,
  w: number,
  h: number,
  t: number,
  tinta: string,
  nacido: Float32Array | null,
): void {
  const cols = mascara.canvas.width;
  const filas = mascara.canvas.height;
  if (cols < 1 || filas < 1) return;

  /* La máscara mide COBERTURA, no color: se dibuja en negro opaco sobre
     transparente y solo se lee el canal alfa. Da igual que la tinta del
     tema sea clara u oscura. */
  mascara.setTransform(1, 0, 0, 1, 0, 0);
  mascara.clearRect(0, 0, cols, filas);
  mascara.setTransform(1 / PASO_TRAMA, 0, 0, 1 / PASO_TRAMA, 0, 0);
  mascara.globalAlpha = 1;
  mascara.strokeStyle = "#000";
  mascara.fillStyle = "#000";
  lamina(mascara, w, h, t);

  let datos: Uint8ClampedArray;
  try {
    datos = mascara.getImageData(0, 0, cols, filas).data;
  } catch {
    /* Un lienzo contaminado no se puede leer. No debería ocurrir —aquí
       solo se dibujan vectores— pero si ocurriera, más vale la lámina en
       trazo que ninguna lámina. */
    lamina(destino, w, h, t);
    return;
  }

  const puntos = new Path2D();
  /* El cierre de la lámina asienta todo lo que quede suelto, y va aparte
     del asiento propio de cada punto: se toma el mayor de los dos. */
  const cierre =
    t <= CIERRE_ASIENTO ? 0 : (t - CIERRE_ASIENTO) / (1 - CIERRE_ASIENTO);
  const invVentana = 1 / VENTANA_ASIENTO;

  for (let fila = 0; fila < filas; fila++) {
    const rowOffset = fila * cols;
    const cyBase = (fila + 0.5) * PASO_TRAMA;
    for (let col = 0; col < cols; col++) {
      const k = rowOffset + col;
      const aByte = datos[(k << 2) + 3];
      if (aByte === 0) {
        if (nacido) nacido[k] = -1;
        continue;
      }
      const rPleno = R_PLENO_LUT[aByte];
      if (rPleno === 0) {
        if (nacido) nacido[k] = -1;
        continue;
      }

      let asiento = 1;
      if (nacido) {
        if (nacido[k] < 0) nacido[k] = t;
        const propio = (t - nacido[k]) * invVentana;
        asiento = propio > cierre ? propio : cierre;
        if (asiento > 1) asiento = 1;
        else if (asiento < 0) asiento = 0;
      }

      const r = asiento === 1 ? rPleno : rPleno * (CRIA_TRAMA + (1 - CRIA_TRAMA) * asiento);
      if (r < 0.25) continue;

      if (asiento === 1) {
        const cx = (col + 0.5) * PASO_TRAMA;
        puntos.moveTo(cx + r, cyBase);
        puntos.arc(cx, cyBase, r, 0, Math.PI * 2);
      } else {
        const inv = 1 - asiento;
        const d = inv * inv * DISPERSION_TRAMA;
        const cx = (col + 0.5) * PASO_TRAMA + jitter(k) * d;
        const cy = cyBase + jitter(k + 7919) * d;
        puntos.moveTo(cx + r, cy);
        puntos.arc(cx, cy, r, 0, Math.PI * 2);
      }
    }
  }

  destino.fillStyle = tinta;
  destino.fill(puntos);
}

/* Hash entero determinista ultrarrápido → [-0.5, 0.5]. El temblor de la mano. */
function jitter(seed: number): number {
  let h = Math.imul((seed | 0) ^ 0x61c88647, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967296 - 0.5;
}
function rnd(seed: number): number {
  let h = Math.imul((seed | 0) ^ 0x9e3779b9, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h = (h ^ (h >>> 16)) >>> 0;
  return h / 4294967296;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (t: number) => t * t * (3 - 2 * t);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
/** Progreso de una fase dentro de la lámina: empieza en `from`, dura `len`.
 *
 *  Salida CUADRÁTICA, no cúbica. Una lámina tiene veinte fases —el marco,
 *  los rosetones, la retícula, los ejes, la curva, la lente, cada
 *  rótulo—, y con la cúbica cada una arranca a plena velocidad y frena de
 *  golpe: veinte latigazos escalonados, que es lo que hacía que el
 *  revelado se leyera mecánico en vez de dibujado. La cuadrática entra
 *  con menos brusquedad y frena más largo, que es como avanza una mano
 *  sobre el papel. Es un cambio de una línea y se nota en las dieciséis
 *  láminas a la vez, porque todas pasan por aquí. */
const phase = (t: number, from: number, len: number) => {
  const u = clamp01((t - from) / len);
  return 1 - (1 - u) * (1 - u);
};

/** Una `cubic-bezier` del CSS, resuelta por bisección. */
function bezier(x1: number, y1: number, x2: number, y2: number) {
  const bx = (t: number) => 3 * (1 - t) * (1 - t) * t * x1 + 3 * (1 - t) * t * t * x2 + t * t * t;
  const by = (t: number) => 3 * (1 - t) * (1 - t) * t * y1 + 3 * (1 - t) * t * t * y2 + t * t * t;
  return (x: number) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let lo = 0;
    let hi = 1;
    let t = x;
    for (let i = 0; i < 18; i++) {
      if (bx(t) < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return by(t);
  };
}

/* La cadencia del grabado de bienvenida: la punta se posa, recorre con
   decisión y se detiene largo. Con la salida cúbica que había, la mitad
   de la lámina aparecía en el primer segundo y los cuatro restantes se
   arrastraban — el gesto entero se veía al revés de como se dibuja. */
const curvaIntro = bezier(0.42, 0, 0.18, 1);

type Ctx = CanvasRenderingContext2D;
type Pt = [number, number];

/* ── PRIMITIVAS EXPORTADAS ──────────────────────────────────────────────
   El grabado de la 404 (`Grabado404.tsx`) comparte este vocabulario de
   trazo —temblor, lápiz, trama, marco— pero no el motor de scroll, que
   no tiene sentido en una página de una sola pantalla. Se exportan las
   piezas puras; quien las use decide cuándo y a qué ritmo llamarlas,
   igual que hacen las dieciséis láminas de este archivo. */
export { clamp01, ease, easeOut, phase, pencil, hatch, graphite, engraveLine, handRect, label, plateChrome, jitter, rnd };
export type { Ctx, Pt };

/* =====================================================================
   Utilidades de grabado
   ===================================================================== */

/**
 * Traza una polilínea revelándola progresivamente.
 * El último segmento se corta a mitad para que la punta avance de forma
 * continua y no a saltos de vértice.
 */
function engraveLine(
  ctx: Ctx,
  pts: Pt[],
  reveal: number,
  width: number,
  alpha: number,
  seed = 0
) {
  if (pts.length < 2 || reveal <= 0 || alpha <= 0) return;

  const lens: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    lens.push(d);
    total += d;
  }
  const target = total * clamp01(reveal);

  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  /* ---- Segmentos AGRUPADOS, no uno a uno ------------------------------
     La versión anterior hacía `beginPath`/`stroke` por cada segmento
     para poder variar el grosor. Con 150 puntos y tres pasadas de lápiz
     eso son 450 llamadas de dibujo POR TRAZO, y la lámina tiene varios:
     el fotograma se iba a decenas de milisegundos y el scroll se
     entrecortaba.

     Aquí el grosor cambia cada GROUP segmentos en vez de cada uno, así
     que un tramo entero se traza de una sola vez. Baja de ~450 llamadas
     a ~19 sin que se note: el temblor del trazo lo dan el jitter de los
     puntos y las pasadas superpuestas, no la variación de grosor
     segmento a segmento, que a esta escala es invisible. */
  const GROUP = 8;
  let acc = 0;
  let i = 1;
  while (i < pts.length && acc < target) {
    ctx.lineWidth = width * (0.72 + rnd(i + seed) * 0.62);
    ctx.beginPath();
    ctx.moveTo(pts[i - 1][0], pts[i - 1][1]);
    let g = 0;
    while (i < pts.length && g < GROUP && acc < target) {
      const seg = lens[i - 1];
      const [px, py] = pts[i - 1];
      let [x, y] = pts[i];
      if (acc + seg > target) {
        const f = (target - acc) / seg;
        x = px + (x - px) * f;
        y = py + (y - py) * f;
        ctx.lineTo(x, y);
        acc = target;
        break;
      }
      ctx.lineTo(x, y);
      acc += seg;
      i++;
      g++;
    }
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Repasa el mismo recorrido varias veces, cada pasada con su temblor y
 * su altura. Es lo que hace la mano al insistir sobre un trazo, y lo que
 * separa un lápiz de una línea de vector.
 */
function pencil(
  ctx: Ctx,
  pts: Pt[],
  reveal: number,
  width: number,
  alpha: number,
  seed = 0,
  passes = 3
) {
  const specs: [number, number, number, number][] = [
    [0, 1.1, 0.75, 0.42],
    [0, 0, 1, 1],
    [0.4, -0.6, 0.8, 0.62],
  ];
  for (let p = 0; p < Math.min(passes, specs.length); p++) {
    const [dx, dy, wk, ak] = specs[p];
    const j = 0.55 + p * 0.35;
    const moved: Pt[] = pts.map((q, i) => [
      q[0] + dx + jitter(i + seed + p * 977) * j,
      q[1] + dy + jitter(i + seed + p * 977 + 500) * j,
    ]);
    engraveLine(ctx, moved, reveal, width * wk, alpha * ak, seed + p * 31);
  }
}

/** Raya la región ya recortada con paralelas a `angle` radianes. */
function hatch(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  angle: number,
  spacing: number,
  width: number,
  alpha: number,
  reveal: number,
  seed = 0
) {
  if (reveal <= 0 || alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.lineCap = "butt";
  const diag = Math.hypot(w, h);
  const cx = x + w / 2;
  const cy = y + h / 2;
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  const n = Math.ceil(diag / spacing);
  const shown = Math.ceil(n * clamp01(reveal));
  /* ---- Tres pasadas, no una por raya ---------------------------------
     Una trama densa puede llegar a 400 rayas, y trazarlas de una en una
     para variar el grosor costaba 400 llamadas de dibujo. El grosor se
     reparte en TRES grupos y cada grupo se traza de una vez: 3 llamadas
     en lugar de 400, con la misma irregularidad a la vista, porque lo
     que se percibe en una trama no es el grosor de cada raya sino que
     no todas sean iguales. */
  const BUCKETS = 3;
  for (let b = 0; b < BUCKETS; b++) {
    ctx.lineWidth = width * (0.7 + (b / (BUCKETS - 1)) * 0.7);
    ctx.beginPath();
    for (let i = b; i < shown; i += BUCKETS) {
      const px = -diag / 2 + i * spacing;
      /* Las rayas no llegan siempre al mismo sitio: la mano levanta
         antes o después. Sin esto, los bordes salen a escuadra. */
      ctx.moveTo(px, -diag / 2 + rnd(i + seed + 7) * 6);
      ctx.lineTo(px, diag / 2 - rnd(i + seed + 13) * 6);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Polvillo de grafito: motas sueltas dentro de la región recortada.
 * Es lo que queda en el papel al insistir con el lápiz, y lo que impide
 * que una trama regular se lea como una textura generada.
 */
function graphite(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  count: number,
  alpha: number,
  reveal: number,
  seed = 0
) {
  if (reveal <= 0 || alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  const shown = Math.ceil(count * clamp01(reveal));
  /* Todas las motas en UN solo trazado y un solo relleno. Antes era un
     `beginPath`/`arc`/`fill` por mota — hasta 420 rellenos por lámina y
     por fotograma, el gasto más caro de todo el atlas para lo poco que
     aporta cada punto. `moveTo` antes de cada arco evita que se unan
     entre sí con una línea. */
  ctx.beginPath();
  for (let i = 0; i < shown; i++) {
    const px = x + rnd(i * 3 + seed) * w;
    const py = y + rnd(i * 3 + seed + 101) * h;
    const r = 0.28 + rnd(i + seed + 55) * 0.5;
    ctx.rect(px - r, py - r, r * 2, r * 2);
  }
  ctx.fill();
  ctx.restore();
}

/**
 * La familia serif que use el tema en este momento, en el formato que
 * pide `ctx.font`.
 *
 * El canvas no hereda CSS: hay que darle una cadena de fuente completa. Si
 * esa cadena se escribe a mano, el día que cambie la tipografía del sitio
 * los rótulos del fondo se quedan en la vieja —o en el respaldo— y nada
 * avisa, porque no hay compilador ni prueba que mire dentro de un
 * `ctx.font`. Leerla del mismo token que usa el resto de la página
 * (`--font-serif`) es lo que mantiene las dos cosas juntas.
 */
let serifCache = "";
function serifDelTema(): string {
  if (serifCache) return serifCache;
  const v =
    typeof getComputedStyle === "function"
      ? getComputedStyle(document.documentElement).getPropertyValue("--font-serif").trim()
      : "";
  serifCache = v || 'Georgia, "Times New Roman", serif';
  return serifCache;
}

/** Rótulo grabado: versalitas espaciadas, como en una plancha. */
function label(
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  size: number,
  alpha: number,
  reveal: number,
  align: CanvasTextAlign = "left"
) {
  if (reveal <= 0.02 || alpha <= 0) return;
  const shown = Math.ceil(text.length * clamp01(reveal));
  const s = text.slice(0, shown);
  ctx.save();
  ctx.globalAlpha *= alpha;
  /* La serif del sitio, leída del tema — no escrita a mano.
     Aquí estaba clavado «Instrument Serif», y al cambiar la serif de los
     titulares esta cadena se quedó pidiendo una fuente que ya no se
     carga: los rótulos grabados caían en Georgia mientras los titulares
     de la página salían en Newsreader. Un `ctx.font` no lo ve ni el
     compilador ni una prueba de unidad. */
  ctx.font = `${size}px ${serifDelTema()}`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  /* Letra a letra, con su microdesvío: una cadena de golpe sale
     perfectamente alineada y en una lámina eso no pasa. */
  let cx = x;
  if (align === "center") {
    cx = x - measure(ctx, s, size) / 2;
    ctx.textAlign = "left";
  } else if (align === "right") {
    cx = x - measure(ctx, s, size);
    ctx.textAlign = "left";
  }
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    ctx.fillText(ch, cx, y + jitter(i + 300) * 0.7);
    cx += ctx.measureText(ch).width + size * 0.19;
  }
  ctx.restore();
}
function measure(ctx: Ctx, s: string, size: number) {
  let w = 0;
  for (const ch of s) w += ctx.measureText(ch).width + size * 0.19;
  return w;
}

/* =====================================================================
   Cromo de la lámina — lo que la convierte en lámina y no en diagrama
   ===================================================================== */

/** Rectángulo a mano: las esquinas REBASAN, como al usar la regla. */
function handRect(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  reveal: number,
  width: number,
  alpha: number,
  seed: number,
  over = 4
) {
  const o = over;
  const sides: Pt[][] = [
    [
      [x - o, y],
      [x + w + o, y],
    ],
    [
      [x + w, y - o],
      [x + w, y + h + o],
    ],
    [
      [x + w + o, y + h],
      [x - o, y + h],
    ],
    [
      [x, y + h + o],
      [x, y - o],
    ],
  ];
  /* Los cuatro lados se trazan en orden, no a la vez: se ve cómo se
     cierra el marco. */
  sides.forEach((s, i) => {
    const r = clamp01(reveal * 4 - i);
    /* Cada lado se comba levemente: una recta perfecta de 900 px a mano
       no existe. El punto medio se desvía menos de un píxel. */
    const mid: Pt = [
      (s[0][0] + s[1][0]) / 2 + jitter(seed + i) * 1.6,
      (s[0][1] + s[1][1]) / 2 + jitter(seed + i + 40) * 1.6,
    ];
    engraveLine(ctx, [s[0], mid, s[1]], r, width, alpha, seed + i * 17);
  });
}

/** Rosetón de esquina: cuatro radios y un arco. */
function rosette(ctx: Ctx, x: number, y: number, sx: number, sy: number, r: number, t: number) {
  const p = phase(t, 0.12, 0.3);
  if (p <= 0) return;
  const a: Pt[] = [
    [x + sx * r, y],
    [x, y],
    [x, y + sy * r],
  ];
  engraveLine(ctx, a, p, 0.9, 0.48, 71);
  const arc: Pt[] = [];
  for (let i = 0; i <= 12; i++) {
    const ang = (i / 12) * (Math.PI / 2);
    arc.push([x + sx * r * 0.62 * Math.cos(ang), y + sy * r * 0.62 * Math.sin(ang)]);
  }
  engraveLine(ctx, arc, p, 0.6, 0.32, 83);
  engraveLine(
    ctx,
    [
      [x + sx * r * 0.26, y + sy * r * 0.26],
      [x + sx * r * 0.44, y + sy * r * 0.44],
    ],
    p,
    0.5,
    0.2,
    91
  );
}

/**
 * El cromo completo: marco de filete doble con las esquinas rebasadas,
 * rosetones en las cuatro esquinas, colofón de cierre y las dos reglas
 * de margen graduadas. Sin un solo rótulo: nombrar la figura es trabajo
 * del pie que vive en la página, no del fondo.
 */
function plateChrome(ctx: Ctx, w: number, h: number, t: number) {
  const m = Math.min(w, h) * 0.055;
  const x = m;
  const y = m;
  const pw = w - m * 2;
  const ph = h - m * 2;

  const fr = phase(t, 0, 0.34);
  handRect(ctx, x, y, pw, ph, fr, 1.3, 0.5, 11, 6);
  handRect(ctx, x + 7, y + 7, pw - 14, ph - 14, phase(t, 0.06, 0.3), 0.55, 0.3, 29, 3);

  const rr = Math.min(pw, ph) * 0.06;
  rosette(ctx, x + 14, y + 14, 1, 1, rr, t);
  rosette(ctx, x + pw - 14, y + 14, -1, 1, rr, t);
  rosette(ctx, x + 14, y + ph - 14, 1, -1, rr, t);
  rosette(ctx, x + pw - 14, y + ph - 14, -1, -1, rr, t);

  /* ---- El colofón -----------------------------------------------------
     Aquí iban el número de lámina en romanos y su título rotulado. Se
     retiran: el fondo NO debe rotularse.

     Dos motivos. Uno de lectura — un letrero grande detrás del texto
     compite con él, y en el cruce entre láminas llegaban a verse dos
     rótulos distintos superpuestos, que es la clase de detalle que
     delata una plantilla. Otro de reparto: quien nombra la figura es su
     PIE, que vive en la página (`PlateInterlude`) donde se puede leer de
     verdad. Que el fondo se rotulara a sí mismo era decir dos veces lo
     mismo, y una de las dos veces mal.

     En su lugar, el remate que un impresor pone al cerrar una plancha:
     dos filetes cortos con un rombo en medio. No dice nada — cierra. */
  const cy = y + ph + m * 0.42;
  const cp = phase(t, 0.5, 0.36);
  const cx = x + pw / 2;
  if (cp > 0) {
    const half = Math.min(pw * 0.17, 170);
    const gap = 22;
    engraveLine(ctx, [[cx - half, cy], [cx - gap, cy]], cp, 0.8, 0.42, 101);
    engraveLine(ctx, [[cx + gap, cy], [cx + half, cy]], cp, 0.8, 0.42, 103);
    /* El rombo del centro, dibujado a línea como todo lo demás. */
    const d = 4.5;
    engraveLine(
      ctx,
      [
        [cx, cy - d],
        [cx + d, cy],
        [cx, cy + d],
        [cx - d, cy],
        [cx, cy - d],
      ],
      cp,
      0.85,
      0.46,
      105
    );
  }

  /* ---- Las reglas de margen -------------------------------------------
     Dos escalas milimetradas verticales pegadas al marco, con su marca
     larga cada cinco divisiones.

     No son adorno: son la ÚNICA parte del atlas que el contenido no
     puede tapar nunca. La mancha de texto ocupa el centro de la pantalla,
     así que todo lo que se dibuje ahí queda debajo del velo; la franja
     de margen, en cambio, está siempre despejada. Poniendo aquí un
     elemento denso y regular, el fondo pasa de intuirse a leerse — que
     era justo lo que faltaba.

     Y es lo que lleva una lámina técnica de verdad al borde del papel:
     la escala con la que se miden las distancias de la figura. */
  const rp = phase(t, 0.2, 0.5);
  if (rp > 0.01) {
    const step = 11;
    const n = Math.floor(ph / step);
    const shown = Math.ceil(n * rp);
    ctx.save();
    ctx.globalAlpha *= 0.34;
    /* Dos trazados —marcas largas y marcas cortas— en vez de uno por
       marca. Son ~150 marcas entre los dos márgenes; de 150 llamadas de
       dibujo a 2. */
    for (const long of [false, true]) {
      ctx.lineWidth = long ? 0.9 : 0.5;
      const len = long ? 13 : 6;
      ctx.beginPath();
      for (let i = 0; i <= shown && i <= n; i++) {
        if ((i % 5 === 0) !== long) continue;
        const yy = y + i * step;
        for (const [sx, dir] of [
          [x - 12, -1],
          [x + pw + 12, 1],
        ] as [number, number][]) {
          ctx.moveTo(sx, yy + jitter(i * 7) * 0.5);
          ctx.lineTo(sx + dir * len, yy + jitter(i * 7 + 3) * 0.5);
        }
      }
      ctx.stroke();
    }
    ctx.restore();
    /* El nervio del que cuelgan las marcas. */
    engraveLine(
      ctx,
      [
        [x - 12, y],
        [x - 12, y + ph],
      ],
      rp,
      0.7,
      0.3,
      171
    );
    engraveLine(
      ctx,
      [
        [x + pw + 12, y],
        [x + pw + 12, y + ph],
      ],
      rp,
      0.7,
      0.3,
      173
    );
  }
}

/* ---- EL SUELO DE LA FIGURA ------------------------------------------
   El pie de la lámina (`.tj-interlude-caption`) se apoya en el canto
   inferior de la pausa y trae su propio velo, que sube 3,5 rem por
   encima del texto para que el grabado no cruce las letras. Medido en
   la pausa de la portada, ese velo empieza en el 0,62 del alto de la
   ventana a 1280×720, y más abajo en ventanas más altas.

   O sea: TODO lo que una figura quiera que se lea —ejes, rótulos,
   graduación, la aguja de un instrumento, la barra de totales— tiene
   que quedar por encima de esa línea. Tres láminas lo ignoraban y
   dibujaban hasta el borde: el calendario perdía la cabecera de días y
   la barra de totales (que caía FUERA del lienzo), la distribución
   enterraba su eje y sus rótulos de R bajo el velo, y del cuadrante de
   riesgo se veía la bóveda pero no la aguja, ni el eje, ni la peana.
   Quedaban tres figuras a medio contar debajo de un pie que las
   describía enteras.

   No vale una constante: la pausa de la portada mide 88 vh y la de las
   páginas interiores 62, así que el pie sube o baja según dónde se
   esté. Medido, el suelo va del 0,43 (una interior en una ventana de
   640 de alto) al 0,69 (la portada a 1000). Fijarlo en el peor caso
   encogería la portada sin motivo, y en el mejor volvería a enterrar
   las figuras de las interiores.

   Así que lo mide `measureAnchors`, que ya recorre las pausas una a una
   cuando cambia la maqueta: aprovecha el mismo recorrido y no cuesta
   una medida más de las que ya se pagan. Este valor es el de partida,
   el que rige hasta la primera medida. */
let sueloFigura = 0.54;

/** El alto útil de la figura: por debajo empieza el velo del pie. */
function suelo(h: number): number {
  return h * sueloFigura;
}

/* =====================================================================
   LÁMINA I — La curva de rendimiento
   ===================================================================== */
const SERIES = (() => {
  const N = 150;
  const vals: number[] = [];
  let v = 0.2;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const dip =
      (t > 0.17 && t < 0.24 ? -0.011 : 0) +
      (t > 0.46 && t < 0.58 ? -0.016 : 0) +
      (t > 0.82 && t < 0.87 ? -0.01 : 0);
    v = Math.max(0.05, v + 0.0062 + (rnd(i) - 0.45) * 0.014 + dip);
    vals.push(v);
  }
  const peaks: number[] = [];
  let p = -Infinity;
  for (const x of vals) {
    p = Math.max(p, x);
    peaks.push(p);
  }
  /* El punto más hundido bajo el techo: el que se amplía en el detalle. */
  let worst = 0;
  let worstDD = 0;
  for (let i = 0; i < vals.length; i++) {
    const dd = (peaks[i] - vals[i]) / peaks[i];
    if (dd > worstDD) {
      worstDD = dd;
      worst = i;
    }
  }
  return { vals, peaks, max: Math.max(...vals), worst, worstDD };
})();

function plateEquity(ctx: Ctx, w: number, h: number, t: number) {
  plateChrome(ctx, w, h, t);

  /* La figura ocupa CASI TODO el ancho, no el 73 % central.
     Antes iba de 0,14 a 0,87 del ancho: justo el tramo que la mancha de
     contenido cubre, así que la parte interesante del dibujo quedaba
     siempre debajo del texto y en los márgenes —lo único que se ve— solo
     caía retícula. Extendida a los bordes, la curva CRUZA por detrás del
     contenido y sus dos extremos quedan a la vista en los márgenes. */
  const x0 = w * 0.055;
  const x1 = w * 0.945;
  const y0 = h * 0.17;
  const y1 = h * 0.8;
  const { vals, peaks, max, worst } = SERIES;
  const n = vals.length;
  const sx = (i: number) => x0 + (i / (n - 1)) * (x1 - x0);
  const sy = (v: number) => y1 - (v / (max * 1.1)) * (y1 - y0);

  /* Retícula: dos densidades, como el papel milimetrado real. */
  const gp = phase(t, 0.04, 0.22);
  ctx.save();
  ctx.globalAlpha *= 0.115 * gp;
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  for (let i = 0; i <= 50; i++) {
    const x = x0 + ((x1 - x0) * i) / 50;
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y1);
  }
  for (let i = 0; i <= 30; i++) {
    const y = y0 + ((y1 - y0) * i) / 30;
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
  }
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha *= 0.24 * gp;
  ctx.lineWidth = 0.55;
  ctx.beginPath();
  for (let i = 0; i <= 10; i++) {
    const x = x0 + ((x1 - x0) * i) / 10;
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y1);
  }
  for (let i = 0; i <= 6; i++) {
    const y = y0 + ((y1 - y0) * i) / 6;
    ctx.moveTo(x0, y);
    ctx.lineTo(x1, y);
  }
  ctx.stroke();
  ctx.restore();

  /* Ejes con graduación larga/corta y sus cifras. */
  const ap = phase(t, 0.02, 0.2);
  pencil(
    ctx,
    [
      [x0, y0 - 12],
      [x0, y1],
      [x1 + 12, y1],
    ],
    ap,
    1.15,
    0.42,
    31,
    2
  );
  ctx.save();
  ctx.globalAlpha *= 0.4 * ap;
  for (let i = 0; i <= 40; i++) {
    const x = x0 + ((x1 - x0) * i) / 40;
    const long = i % 5 === 0;
    ctx.lineWidth = long ? 0.9 : 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y1);
    ctx.lineTo(x, y1 + (long ? 7 : 3.5));
    ctx.stroke();
  }
  for (let i = 0; i <= 24; i++) {
    const y = y0 + ((y1 - y0) * i) / 24;
    const long = i % 4 === 0;
    ctx.lineWidth = long ? 0.9 : 0.5;
    ctx.beginPath();
    ctx.moveTo(x0 - (long ? 7 : 3.5), y);
    ctx.lineTo(x0, y);
    ctx.stroke();
  }
  ctx.restore();
  for (let i = 0; i <= 6; i++) {
    const y = y1 - ((y1 - y0) * i) / 6;
    label(ctx, String(i * 20), x0 - 12, y, 10, 0.3, phase(t, 0.3, 0.3), "right");
  }

  const curveR = phase(t, 0.12, 0.56);
  const shownTo = Math.floor(curveR * (n - 1));

  /* Drawdown: trama cruzada + polvillo, recortados a la región entre el
     techo y la curva. La sombra no puede existir antes que la curva que
     la proyecta, así que va atada al mismo progreso. */
  if (shownTo > 2) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(sx(0), sy(peaks[0]));
    for (let i = 1; i <= shownTo; i++) ctx.lineTo(sx(i), sy(peaks[i]));
    for (let i = shownTo; i >= 0; i--) ctx.lineTo(sx(i), sy(vals[i]));
    ctx.closePath();
    ctx.clip();
    hatch(ctx, x0, y0, x1 - x0, y1 - y0, -Math.PI / 4, 5.5, 0.5, 0.4, 1, 5);
    hatch(ctx, x0, y0, x1 - x0, y1 - y0, Math.PI / 3.2, 9, 0.4, 0.22, 1, 45);
    graphite(ctx, x0, y0, x1 - x0, y1 - y0, 420, 0.3, 1, 9);
    ctx.restore();
  }

  /* Techo histórico: escalera discontinua, nunca una curva suave. */
  const stair: Pt[] = [[sx(0), sy(peaks[0])]];
  for (let i = 1; i < peaks.length; i++) {
    if (peaks[i] !== peaks[i - 1]) {
      stair.push([sx(i), sy(peaks[i - 1])]);
      stair.push([sx(i), sy(peaks[i])]);
    }
  }
  stair.push([sx(n - 1), sy(peaks[n - 1])]);
  ctx.save();
  ctx.setLineDash([6, 5]);
  engraveLine(ctx, stair, curveR, 0.9, 0.42, 7);
  ctx.restore();

  const pts: Pt[] = vals.map((v, i) => [sx(i), sy(v)]);
  pencil(ctx, pts, curveR, 1.25, 0.62, 3);

  /* ---- Detalle ampliado ----
     El recurso de la lámina científica: un círculo que agranda un
     fragmento y dos líneas guía que lo atan a su origen. Amplía el peor
     drawdown, que es el punto que de verdad se mira en esta curva. */
  const dp = phase(t, 0.62, 0.34);
  if (dp > 0.01) {
    const ox = sx(worst);
    const oy = sy(vals[worst]);
    const R = Math.min(w, h) * 0.115;
    const dx = Math.min(w * 0.8, ox + R * 2.1);
    const dy = Math.max(y0 + R * 0.8, oy - R * 1.7);
    /* Aumento y anchura del fragmento. Van juntos y hay que calcularlos,
       no elegirlos a ojo: el trozo ampliado tiene que caber DENTRO de la
       lente. Con ±26 puntos a ×3,4 el fragmento medía cinco veces el
       diámetro del círculo, así que todo caía fuera del recorte y la
       lente salía vacía — un círculo con dos líneas guía apuntando a
       nada. Con ±7 puntos a ×3 el fragmento mide ≈1,05 diámetros: llena
       la lente y sobra lo justo por los lados, que es lo que hace que se
       lea como una ampliación y no como un recorte. */
    const K = 3;
    const SPAN = 7;

    /* Líneas guía desde el origen hasta la circunferencia. */
    for (const s of [-1, 1] as const) {
      const a = Math.atan2(dy - oy, dx - ox) + s * 0.42;
      engraveLine(
        ctx,
        [
          [ox + Math.cos(a) * 8, oy + Math.sin(a) * 8],
          [dx - Math.cos(a) * R, dy - Math.sin(a) * R],
        ],
        dp,
        0.55,
        0.26,
        111 + s
      );
    }

    ctx.save();
    ctx.beginPath();
    ctx.arc(dx, dy, R, 0, Math.PI * 2);
    ctx.clip();
    /* El mismo tramo, a escala K alrededor del punto ampliado. */
    const zpts: Pt[] = [];
    const zstair: Pt[] = [];
    for (let i = Math.max(0, worst - SPAN); i < Math.min(n, worst + SPAN); i++) {
      zpts.push([dx + (sx(i) - ox) * K, dy + (sy(vals[i]) - oy) * K]);
      zstair.push([dx + (sx(i) - ox) * K, dy + (sy(peaks[i]) - oy) * K]);
    }
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(zstair[0][0], zstair[0][1]);
    for (const p of zstair) ctx.lineTo(p[0], p[1]);
    for (let i = zpts.length - 1; i >= 0; i--) ctx.lineTo(zpts[i][0], zpts[i][1]);
    ctx.closePath();
    ctx.clip();
    hatch(ctx, dx - R, dy - R, R * 2, R * 2, -Math.PI / 4, 4.5, 0.5, 0.42, dp, 121);
    ctx.restore();
    ctx.save();
    ctx.setLineDash([5, 4]);
    engraveLine(ctx, zstair, dp, 0.8, 0.4, 131);
    ctx.restore();
    pencil(ctx, zpts, dp, 1.35, 0.6, 141, 2);
    ctx.restore();

    /* Doble filete de la lente + rótulo del aumento. */
    const circle = (r: number): Pt[] => {
      const o: Pt[] = [];
      for (let i = 0; i <= 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        o.push([dx + Math.cos(a) * r, dy + Math.sin(a) * r]);
      }
      return o;
    };
    engraveLine(ctx, circle(R), dp, 1.15, 0.4, 151);
    engraveLine(ctx, circle(R + 4), dp, 0.5, 0.22, 153);
    label(ctx, "×3", dx, dy + R + 14, 11.5, 0.44, phase(t, 0.74, 0.18), "center");
  }

  label(
    ctx,
    rot("techoHistorico"),
    x1,
    sy(peaks[n - 1]) - 14,
    11,
    0.3,
    phase(t, 0.72, 0.22),
    "right"
  );
}

/* =====================================================================
   LÁMINA II — El calendario de resultados
   ===================================================================== */
function plateCalendar(ctx: Ctx, w: number, h: number, t: number) {
  plateChrome(ctx, w, h, t);

  const cols = 7;
  const rows = 5;
  /* La rejilla se calcula desde el hueco que queda LIBRE —entre el
     margen del marco y el suelo de la figura—, no desde el lienzo
     entero. Antes salía de `min(w·0.86, h·1.55)` con alto fijo de
     0,66 del ancho: a 1440×900 daban 1238×817 sobre un lienzo de 900,
     así que la cabecera de días arrancaba pegada al canto y la barra
     de totales caía en el píxel 903 — fuera. */
  const m = Math.min(w, h) * 0.055;
  const techo = m + 34;
  const sueloY = suelo(h);
  const anchoUtil = w - (m + 30) * 2;
  const ALTO_CABECERA = 26;
  const ALTO_TOTALES = 42;
  const altoRejilla = sueloY - techo - ALTO_CABECERA - ALTO_TOTALES;
  /* Celda apaisada, como la de un calendario impreso, pero sin pasar de
     1,55 de proporción ni caer en columnas estrechas y altas cuando la
     ventana es de móvil. */
  const chBruto = Math.min(altoRejilla / rows, 120);
  const cw = Math.min(anchoUtil / cols, chBruto * 1.55);
  const ch = Math.min(chBruto, cw * 1.15);
  const gw = cw * cols;
  const gh = ch * rows;
  const x0 = (w - gw) / 2;
  const y0 = techo + ALTO_CABECERA + Math.max(0, (altoRejilla - gh) / 2);

  const days = serie("diasSemana");
  const hp = phase(t, 0.06, 0.2);
  for (let c = 0; c < cols; c++) {
    label(ctx, days[c], x0 + c * cw + cw / 2, y0 - 16, 12, 0.4, hp, "center");
  }
  engraveLine(
    ctx,
    [
      [x0, y0 - 7],
      [x0 + gw, y0 - 7],
    ],
    hp,
    1.2,
    0.5,
    201
  );

  const cells = cols * rows;
  const prog = clamp01((t - 0.14) / 0.66);
  for (let i = 0; i < cells; i++) {
    const local = clamp01(prog * cells * 1.12 - i);
    if (local <= 0) continue;
    const c = i % cols;
    const r = Math.floor(i / cols);
    const x = x0 + c * cw;
    const y = y0 + r * ch;
    const pad = 3;

    /* El filete de la celda pesa más que antes (0,55 y 0,24 de tinta):
       la máscara de trama se dibuja a 1/6 de escala, y ahí una línea de
       medio píxel a un cuarto de tinta se queda por debajo del umbral y
       no llega a soltar punto. Sin filete, las treinta y cinco celdas
       se fundían en un solo campo rayado. */
    handRect(ctx, x + pad, y + pad, cw - pad * 2, ch - pad * 2, easeOut(local), 1.15, 0.5, i * 3, 2);
    label(ctx, String(i + 1), x + cw - pad - 6, y + pad + 9, 9.5, 0.3, easeOut(local), "right");

    if (c === 5 || c === 6) continue; // el mercado cierra
    const v = rnd(i * 13 + 4);
    if (v < 0.26) continue; // día sin operar
    const win = rnd(i * 7 + 2) > 0.36;
    const mag = 0.3 + rnd(i * 5 + 9) * 0.7;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x + pad + 1.5, y + pad + 1.5, cw - pad * 2 - 3, ch - pad * 2 - 3);
    ctx.clip();
    /* Más apretado = día más grande. El rango era 7,5→3,3 px, y ahí
       estaba el ruido: la trama de puntos tiene paso 6 (`PASO_TRAMA`),
       así que una raya cada 5-9 px LATE contra la rejilla y sale moaré
       en vez de sombreado. Por debajo de 4 el muestreo la lee como
       mancha llena —uniforme, sin densidad que leer— y el rango viejo
       cruzaba las dos zonas: unas celdas macizas, otras vibrando.

       De 15 a 23 px cada raya cae en su sitio y se cuenta: seis en un
       día flojo, diez en uno fuerte. Es la diferencia que el pie
       promete. */
    const sp = 27 - mag * 12;
    hatch(ctx, x, y, cw, ch, -Math.PI / 4, sp, 0.5, 0.4, easeOut(local), i);
    /* Los días en pérdida llevan la segunda pasada cruzada: en grabado,
       el negro más profundo se hace cruzando la trama. */
    if (!win) {
      hatch(ctx, x, y, cw, ch, Math.PI / 4, sp, 0.5, 0.4, easeOut(local), i + 99);
      graphite(ctx, x, y, cw, ch, 26, 0.3, easeOut(local), i + 7);
    }
    ctx.restore();
  }

  /* Barra de totales bajo la rejilla: el resultado de cada columna. */
  const bp = phase(t, 0.74, 0.24);
  const by = y0 + gh + 16;
  for (let c = 0; c < cols; c++) {
    const val = c > 4 ? 0 : 0.25 + rnd(c * 17 + 3) * 0.75;
    const bh = val * 26;
    if (bh < 1) continue;
    const bx = x0 + c * cw + cw * 0.3;
    const bwid = cw * 0.4;
    ctx.save();
    ctx.beginPath();
    ctx.rect(bx, by, bwid, bh * bp);
    ctx.clip();
    hatch(ctx, bx, by, bwid, bh, Math.PI / 2, 3.2, 0.45, 0.36, 1, c * 11);
    ctx.restore();
    handRect(ctx, bx, by, bwid, bh * bp, bp, 1.1, 0.5, c * 23, 1.5);
  }
  engraveLine(
    ctx,
    [
      [x0, by],
      [x0 + gw, by],
    ],
    bp,
    1.2,
    0.5,
    211
  );
}

/* =====================================================================
   LÁMINA III — La distribución de R
   ===================================================================== */
const BARS = (() => {
  const n = 19;
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) / 3.3;
    /* Campana asimétrica: más operaciones pequeñas en pérdida que en
       ganancia, pero las ganadoras llegan más lejos. Es la forma de una
       ventaja real, no una campana simétrica. */
    const g = Math.exp(-x * x * 0.6) * (x < 0 ? 1.08 : 0.88);
    out.push(Math.max(0.03, g + (rnd(i * 3) - 0.5) * 0.08));
  }
  return out;
})();

function plateDistribution(ctx: Ctx, w: number, h: number, t: number) {
  plateChrome(ctx, w, h, t);

  const x0 = w * 0.07;
  const x1 = w * 0.93;
  const y0 = h * 0.17;
  /* El eje va por encima del velo del pie, con hueco para los rótulos
     de R que cuelgan trece píxeles por debajo. Estaba en 0,76 del alto:
     el histograma se apoyaba sobre una línea que nadie llegaba a ver. */
  const y1 = suelo(h) - 34;
  const n = BARS.length;
  const bw = (x1 - x0) / n;
  const max = Math.max(...BARS);

  const ap = phase(t, 0.02, 0.2);
  pencil(
    ctx,
    [
      [x0, y0 - 12],
      [x0, y1],
      [x1 + 10, y1],
    ],
    ap,
    1.1,
    0.42,
    31,
    2
  );

  const prog = clamp01((t - 0.14) / 0.62);
  for (let i = 0; i < n; i++) {
    const local = easeOut(clamp01(prog * n * 1.3 - i));
    if (local <= 0) continue;
    const bh = (BARS[i] / (max * 1.12)) * (y1 - y0) * local;
    const x = x0 + i * bw + bw * 0.15;
    const bwid = bw * 0.7;
    const y = y1 - bh;
    const loss = i < (n - 1) / 2;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, bwid, bh);
    ctx.clip();
    hatch(ctx, x, y, bwid, bh, Math.PI / 2, 3.2, 0.45, 0.38, 1, i * 4);
    if (loss) {
      hatch(ctx, x, y, bwid, bh, 0, 3.2, 0.45, 0.28, 1, i * 4 + 71);
      graphite(ctx, x, y, bwid, bh, 40, 0.26, 1, i + 3);
    }
    ctx.restore();

    handRect(ctx, x, y, bwid, bh, 1, 0.7, 0.44, i * 9, 1.5);
    label(ctx, `${i - (n - 1) / 2 > 0 ? "+" : ""}${(i - (n - 1) / 2) / 2}R`, x + bwid / 2, y1 + 13, 9, 0.26, phase(t, 0.66, 0.26), "center");
  }

  /* La línea del cero: la referencia que separa ganar de perder. */
  const zx = x0 + ((n - 1) / 2 + 0.5) * bw;
  ctx.save();
  ctx.setLineDash([5, 4]);
  engraveLine(
    ctx,
    [
      [zx, y0 - 10],
      [zx, y1 + 10],
    ],
    phase(t, 0.08, 0.24),
    1.1,
    0.46,
    17
  );
  ctx.restore();

  /* Curva envolvente: la forma teórica sobre el histograma real. Lo que
     un tratado dibuja encima de sus barras para decir "esto es lo que
     debería salir si la ventaja es real". */
  const env: Pt[] = [];
  for (let i = 0; i <= 120; i++) {
    const f = i / 120;
    const bi = f * (n - 1);
    const lo = Math.floor(bi);
    const hi = Math.min(n - 1, lo + 1);
    const k = bi - lo;
    const v = BARS[lo] * (1 - k) + BARS[hi] * k;
    env.push([x0 + bw * 0.5 + f * (x1 - x0 - bw), y1 - (v / (max * 1.12)) * (y1 - y0)]);
  }
  pencil(ctx, env, phase(t, 0.5, 0.4), 1.05, 0.4, 301, 2);

  label(ctx, rot("perdida"), zx - 16, y0 - 4, 11, 0.28, phase(t, 0.78, 0.2), "right");
  label(ctx, rot("ganancia"), zx + 16, y0 - 4, 11, 0.28, phase(t, 0.82, 0.2));
}

/* =====================================================================
   LÁMINA IV — El cuadrante de riesgo
   ===================================================================== */
function plateGauge(ctx: Ctx, w: number, h: number, t: number) {
  plateChrome(ctx, w, h, t);

  const cx = w / 2;
  /* El eje del instrumento —la aguja, el cubo y la peana— es lo último
     que se dibuja y lo primero que hay que ver. Estaba en 0,68 del
     alto, dentro del velo del pie: se veía la bóveda graduada y nada
     más, como un arco suelto. Sube por encima del suelo de la figura,
     dejando sitio para la peana, que cuelga veinte píxeles. */
  const cy = suelo(h) - 44;
  const R = Math.min(w * 0.42, h * 0.42);
  const A0 = Math.PI * 1.04;
  const A1 = Math.PI * 1.96;

  const arcPts = (r: number, from = A0, to = A1): Pt[] => {
    const o: Pt[] = [];
    const steps = 120;
    for (let i = 0; i <= steps; i++) {
      const a = from + (to - from) * (i / steps);
      o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    return o;
  };

  const arcR = phase(t, 0.04, 0.32);
  pencil(ctx, arcPts(R), arcR, 1.3, 0.46, 41, 2);
  engraveLine(ctx, arcPts(R + 9), arcR, 0.95, 0.42, 43);
  engraveLine(ctx, arcPts(R - 26), arcR, 0.9, 0.38, 47);

  /* Graduación: marca larga cada cinco, con su cifra. */
  const tickR = phase(t, 0.16, 0.34);
  const ticks = 50;
  const shown = Math.ceil(ticks * tickR);
  ctx.save();
  /* La graduación es lo que convierte un arco en un instrumento, y era
     justo lo que no llegaba a pintarse: a 0,55 px de grueso y 0,42 de
     tinta, la máscara de trama —que se dibuja a 1/6— no pasaba del
     umbral y el cuadrante salía liso. */
  ctx.globalAlpha *= 0.55;
  for (let i = 0; i <= shown && i <= ticks; i++) {
    const a = A0 + (A1 - A0) * (i / ticks);
    const long = i % 5 === 0;
    const r0 = R - (long ? 18 : 9);
    ctx.lineWidth = long ? 1.9 : 1.1;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0);
    ctx.lineTo(cx + Math.cos(a) * (R - 1), cy + Math.sin(a) * (R - 1));
    ctx.stroke();
  }
  ctx.restore();
  for (let i = 0; i <= 10; i++) {
    const a = A0 + (A1 - A0) * (i / 10);
    const r = R - 32;
    label(
      ctx,
      String(i * 10),
      cx + Math.cos(a) * r,
      cy + Math.sin(a) * r,
      9.5,
      0.3,
      phase(t, 0.3 + i * 0.012, 0.2),
      "center"
    );
  }

  /* Zona de peligro: el último tramo, rayado. El instrumento dice dónde
     está el límite ANTES de que lo cruces — que es literalmente lo que
     hace el guardián del producto. */
  const dangerR = phase(t, 0.34, 0.3);
  if (dangerR > 0) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, R - 2, A1 - (A1 - A0) * 0.24, A1);
    ctx.arc(cx, cy, R - 25, A1, A1 - (A1 - A0) * 0.24, true);
    ctx.closePath();
    ctx.clip();
    /* Separaciones por encima del doble del paso de trama: a 4,5 y 7 px
       la zona de peligro salía vibrando contra la rejilla de puntos en
       vez de rayada. */
    hatch(ctx, cx - R, cy - R, R * 2, R * 2, Math.PI / 4, 15, 0.9, 0.5, dangerR, 61);
    hatch(ctx, cx - R, cy - R, R * 2, R * 2, -Math.PI / 4, 23, 0.7, 0.3, dangerR, 63);
    graphite(ctx, cx - R, cy - R, R * 2, R * 2, 260, 0.3, dangerR, 67);
    ctx.restore();
    label(
      ctx,
      rot("limite"),
      cx + Math.cos(A1 - (A1 - A0) * 0.12) * (R + 26),
      cy + Math.sin(A1 - (A1 - A0) * 0.12) * (R + 26),
      11,
      0.34,
      phase(t, 0.56, 0.22),
      "center"
    );
  }

  /* La aguja barre hasta su lectura y se queda ahí. */
  const needleR = phase(t, 0.4, 0.44);
  const a = A0 + (A1 - A0) * 0.62 * needleR;
  pencil(
    ctx,
    [
      [cx - Math.cos(a) * 16, cy - Math.sin(a) * 16],
      [cx + Math.cos(a) * (R - 30), cy + Math.sin(a) * (R - 30)],
    ],
    1,
    1.5,
    0.6 * needleR,
    53,
    2
  );
  /* El cubo y la peana iban en píxeles fijos —6 de radio, 68 de ancho—
     bajo una esfera que en escritorio pasa de setecientos de diámetro:
     el instrumento quedaba apoyado en una pieza de juguete. Van atados
     al radio, como en cualquier lámina de instrumento. */
  const rHub = Math.max(6, R * 0.028);
  const hub: Pt[] = [];
  for (let i = 0; i <= 24; i++) {
    const ang = (i / 24) * Math.PI * 2;
    hub.push([cx + Math.cos(ang) * rHub, cy + Math.sin(ang) * rHub]);
  }
  engraveLine(ctx, hub, needleR, 1.3, 0.55, 57);

  /* Pie del instrumento: la peana. */
  const fp = phase(t, 0.66, 0.26);
  const pw2 = Math.max(34, R * 0.13);
  const pw1 = pw2 * 0.58;
  const ph2 = Math.max(20, R * 0.075);
  engraveLine(
    ctx,
    [
      [cx - pw2, cy + ph2],
      [cx - pw1, cy + ph2 * 0.3],
      [cx + pw1, cy + ph2 * 0.3],
      [cx + pw2, cy + ph2],
    ],
    fp,
    1.15,
    0.46,
    59
  );
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx - pw2, cy + ph2);
  ctx.lineTo(cx - pw1, cy + ph2 * 0.3);
  ctx.lineTo(cx + pw1, cy + ph2 * 0.3);
  ctx.lineTo(cx + pw2, cy + ph2);
  ctx.closePath();
  ctx.clip();
  /* Trama por debajo del paso de la rejilla: a esta escala la peana se
     quiere maciza, no rayada. */
  hatch(ctx, cx - pw2, cy, pw2 * 2, ph2 * 1.2, Math.PI / 4, 2.6, 0.5, 0.34, fp, 69);
  ctx.restore();
}

/* ======================================================================
   LÁMINAS POR SECCIÓN
   ======================================================================
   Las cuatro primeras láminas cuentan la operativa: curva, calendario,
   distribución y riesgo. Como fondo de la portada están bien, porque la
   portada habla justo de eso. Repetidas en las nueve rutas, no: detrás
   de la página de seguridad, una curva de resultados no dice nada — y
   un fondo que no dice nada es decoración, que es exactamente lo que
   este atlas no quiere ser.

   Así que cada sección graba SUS figuras. Lo que se dibuja detrás de un
   texto habla del mismo asunto que el texto.
   ==================================================================== */

/* ---- El mapa de calor de la sesión ----------------------------------
   Días en horizontal, horas de mercado en vertical. Cuanto más apretada
   la trama, más resultado deja esa casilla. Responde a una pregunta que
   ningún promedio contesta: no cuánto ganas, sino CUÁNDO. */
function plateHeatmap(ctx: Ctx, w: number, h: number, t: number) {
  plateChrome(ctx, w, h, t);
  const m = Math.min(w, h) * 0.055;
  const x0 = m + w * 0.1;
  const y0 = m + h * 0.16;
  const gw = w - x0 - m - w * 0.08;
  const gh = h - y0 - m - h * 0.2;
  const cols = 10;
  const rows = 7;
  const cw = gw / cols;
  const ch = gh / rows;

  const gp = phase(t, 0.08, 0.34);
  /* La retícula, en dos trazados: todas las verticales y todas las
     horizontales. Una llamada por línea multiplicaría por 17 el coste
     sin cambiar el resultado. */
  for (let c = 0; c <= cols; c++) {
    engraveLine(
      ctx,
      [
        [x0 + c * cw, y0],
        [x0 + c * cw, y0 + gh],
      ],
      gp,
      0.4,
      0.16,
      c * 13 + 401
    );
  }
  for (let r = 0; r <= rows; r++) {
    engraveLine(
      ctx,
      [
        [x0, y0 + r * ch],
        [x0 + gw, y0 + r * ch],
      ],
      gp,
      0.4,
      0.16,
      r * 17 + 431
    );
  }

  /* Las casillas. La intensidad viene de una función determinista —
     nunca `Math.random()`, que daría un dibujo distinto en el servidor y
     en el navegador y rompería la hidratación. Las horas centrales
     pesan más, como en una sesión de verdad. */
  const cp = phase(t, 0.24, 0.52);
  if (cp > 0.01) {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        /* Sesgo por hora: la apertura y el cierre concentran el
           movimiento, la mitad de la sesión se apaga. */
        const hourBias = 1 - Math.abs(r - rows / 2) / (rows / 2);
        const v = rnd(i * 7 + 91) * 0.65 + (1 - hourBias) * 0.5;
        const shown = clamp01((cp - (i / (rows * cols)) * 0.5) * 2);
        if (shown <= 0.02 || v < 0.34) continue;
        const cx = x0 + c * cw + 1.6;
        const cy = y0 + r * ch + 1.6;
        const cwi = cw - 3.2;
        const chi = ch - 3.2;
        ctx.save();
        ctx.beginPath();
        ctx.rect(cx, cy, cwi, chi);
        ctx.clip();
        /* Cuanto mayor el valor, más junta la trama. El paso es lo que
           codifica la magnitud: en grabado no hay escala de grises, hay
           densidad de línea. */
        const step = 5.2 - v * 3.1;
        hatch(ctx, cx, cy, cwi, chi, Math.PI / 4, step, 0.42, 0.3 + v * 0.34, shown, i + 7);
        /* Las casillas fuertes van cruzadas: dos direcciones de trama es
           como una plancha dice "aquí hay más" sin cambiar de tinta. */
        if (v > 0.82)
          hatch(ctx, cx, cy, cwi, chi, -Math.PI / 4, step * 1.5, 0.34, 0.26, shown, i + 313);
        ctx.restore();
      }
    }
  }

  /* Ejes: los días abajo, las horas a la izquierda. */
  const lp = phase(t, 0.62, 0.3);
  if (lp > 0.02) {
    /* Dos semanas laborables seguidas: los cinco primeros, repetidos. */
    const semana = serie("diasSemana");
    const dias = [...semana.slice(0, 5), ...semana.slice(0, 5)];
    for (let c = 0; c < cols; c++)
      label(ctx, dias[c], x0 + c * cw + cw / 2, y0 + gh + 15, 8.5, 0.42, lp, "center");
    for (let r = 0; r < rows; r++)
      label(ctx, `${9 + r}h`, x0 - 12, y0 + r * ch + ch / 2, 8, 0.4, lp, "right");
  }
}

/* ---- La curva rolling con su banda -----------------------------------
   Un ratio medido sobre ventana móvil, con la franja de incertidumbre
   rayada alrededor. La franja es el asunto: un número suelto parece un
   hecho, y con pocas operaciones detrás es casi ruido. Dibujar el margen
   de error es decir cuánto te puedes fiar. */
function plateRolling(ctx: Ctx, w: number, h: number, t: number) {
  plateChrome(ctx, w, h, t);
  const m = Math.min(w, h) * 0.055;
  const x0 = m + w * 0.1;
  const y0 = m + h * 0.2;
  const gw = w - x0 - m - w * 0.07;
  const gh = h - y0 - m - h * 0.24;

  const N = 68;
  const mid: Pt[] = [];
  const up: Pt[] = [];
  const dn: Pt[] = [];
  for (let i = 0; i < N; i++) {
    const p = i / (N - 1);
    /* Suma de tres senos de periodo distinto: se lee como una serie real
       —sube, corrige, vuelve— y es reproducible en cada repintado. */
    const base =
      0.52 +
      Math.sin(p * 5.1) * 0.12 +
      Math.sin(p * 11.3 + 1.1) * 0.06 +
      Math.sin(p * 2.2 + 0.4) * 0.14;
    /* La banda se ESTRECHA hacia la derecha: cuantas más operaciones
       acumuladas, menos margen de error. Es la forma de la estadística,
       no un adorno. */
    const band = 0.17 * (1 - p * 0.62) + 0.02;
    const X = x0 + p * gw;
    mid.push([X, y0 + (1 - base) * gh]);
    up.push([X, y0 + (1 - base - band) * gh]);
    dn.push([X, y0 + (1 - base + band) * gh]);
  }

  const ap = phase(t, 0.06, 0.26);
  engraveLine(
    ctx,
    [
      [x0, y0],
      [x0, y0 + gh],
      [x0 + gw, y0 + gh],
    ],
    ap,
    0.9,
    0.4,
    701
  );

  /* La banda, rayada por dentro. Se recorta con el contorno cerrado
     (arriba de ida, abajo de vuelta) y se traman las paralelas. */
  const bp = phase(t, 0.2, 0.44);
  if (bp > 0.01) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(up[0][0], up[0][1]);
    for (const p of up) ctx.lineTo(p[0], p[1]);
    for (let i = dn.length - 1; i >= 0; i--) ctx.lineTo(dn[i][0], dn[i][1]);
    ctx.closePath();
    ctx.clip();
    hatch(ctx, x0, y0, gw, gh, Math.PI / 3, 6, 0.36, 0.2, bp, 733);
    ctx.restore();
    engraveLine(ctx, up, bp, 0.42, 0.24, 741);
    engraveLine(ctx, dn, bp, 0.42, 0.24, 743);
  }

  /* La línea central, a lápiz insistido: es la que se lee. */
  pencil(ctx, mid, phase(t, 0.3, 0.5), 1.15, 0.6, 751);

  /* El umbral por debajo del cual el ratio no significa nada. */
  const tp = phase(t, 0.66, 0.26);
  if (tp > 0.02) {
    const ty = y0 + (1 - 0.34) * gh;
    const dash: Pt[] = [];
    for (let X = x0; X < x0 + gw; X += 13) dash.push([X, ty], [X + 7, ty]);
    for (let i = 0; i + 1 < dash.length; i += 2)
      engraveLine(ctx, [dash[i], dash[i + 1]], tp, 0.5, 0.3, i + 761);
    label(ctx, rot("umbral"), x0 + gw, ty - 7, 8, 0.42, tp, "right");
  }
}

/* ---- La tablilla de reglas -------------------------------------------
   Las condiciones que el operador se ha impuesto, una por renglón, con
   su marca al margen: cumplida o no. Es literalmente lo que hace el
   guardián de la aplicación antes de dejar abrir una posición. */
function plateRules(ctx: Ctx, w: number, h: number, t: number) {
  plateChrome(ctx, w, h, t);
  const m = Math.min(w, h) * 0.055;
  const pad = Math.min(w * 0.2, 210);
  const x0 = m + pad;
  const gw = w - (m + pad) * 2;
  const rows = 6;
  const y0 = m + h * 0.2;
  const step = Math.min((h - y0 - m - h * 0.16) / rows, 62);

  /* Cada regla: la casilla del margen, el renglón y el estado. Las
     cuatro primeras se cumplen; la quinta no, y es la que importa —
     un guardián que nunca frena no sirve de nada. */
  for (let i = 0; i < rows; i++) {
    const p = phase(t, 0.06 + i * 0.11, 0.3);
    if (p <= 0.01) continue;
    const y = y0 + i * step;
    const bx = x0;
    const bs = 15;

    handRect(ctx, bx, y - bs / 2, bs, bs, p, 0.62, 0.36, i * 29 + 801, 2.4);

    const fail = i === 4;
    if (p > 0.4) {
      const cp = clamp01((p - 0.4) / 0.5);
      if (fail) {
        /* Aspa: dos trazos cruzados. */
        engraveLine(
          ctx,
          [
            [bx + 3.5, y - bs / 2 + 3.5],
            [bx + bs - 3.5, y + bs / 2 - 3.5],
          ],
          cp,
          1.1,
          0.62,
          i + 811
        );
        engraveLine(
          ctx,
          [
            [bx + bs - 3.5, y - bs / 2 + 3.5],
            [bx + 3.5, y + bs / 2 - 3.5],
          ],
          cp,
          1.1,
          0.62,
          i + 813
        );
      } else {
        /* Marca de verificación, en dos tramos como se traza a mano. */
        engraveLine(
          ctx,
          [
            [bx + 3.2, y + 0.6],
            [bx + 6.2, y + 4.4],
            [bx + bs - 3, y - 4.6],
          ],
          cp,
          1.1,
          0.55,
          i + 817
        );
      }
    }

    /* El renglón escrito: una línea de longitud variable insinúa texto
       sin fingir palabras. Rotularlas de verdad competiría con el texto
       real de la página, que es quien manda. */
    const lw = gw * (0.42 + rnd(i + 821) * 0.4);
    engraveLine(
      ctx,
      [
        [bx + bs + 14, y + 1],
        [bx + bs + 14 + lw, y + 1],
      ],
      p,
      0.55,
      fail ? 0.42 : 0.3,
      i + 823
    );

    /* La regla incumplida se subraya con trama: es la que frena. */
    if (fail && p > 0.6) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(bx + bs + 14, y - 9, lw, 18);
      ctx.clip();
      hatch(ctx, bx + bs + 14, y - 9, lw, 18, -Math.PI / 4, 5, 0.34, 0.2, clamp01((p - 0.6) / 0.4), 827);
      ctx.restore();
    }
  }

  /* El filete de cierre y el veredicto. */
  const fp = phase(t, 0.74, 0.24);
  if (fp > 0.02) {
    const fy = y0 + rows * step - step * 0.35;
    engraveLine(ctx, [[x0, fy], [x0 + gw, fy]], fp, 0.9, 0.4, 831);
    label(ctx, rot("operacionBloqueada"), x0, fy + 20, 9.5, 0.5, fp);
  }
}

/* ---- La cerradura ----------------------------------------------------
   Anillos concéntricos, guardas y un ojo de llave: el grabado con el que
   un tratado ilustra un mecanismo cerrado. Va detrás de la página que
   habla de dónde viven los datos, y dice lo mismo que ella: esto no se
   abre desde fuera. */
function plateVault(ctx: Ctx, w: number, h: number, t: number) {
  plateChrome(ctx, w, h, t);
  const cx = w / 2;
  const cy = h / 2;
  const R = Math.min(w, h) * 0.3;

  /* Los anillos, de fuera adentro. */
  const rings = [1, 0.86, 0.66, 0.4];
  rings.forEach((k, i) => {
    const p = phase(t, 0.04 + i * 0.09, 0.32);
    if (p <= 0.01) return;
    const pts: Pt[] = [];
    for (let a = 0; a <= 72; a++) {
      const ang = (a / 72) * Math.PI * 2 - Math.PI / 2;
      pts.push([cx + Math.cos(ang) * R * k, cy + Math.sin(ang) * R * k]);
    }
    engraveLine(ctx, pts, p, i === 0 ? 1.2 : 0.7, 0.44 - i * 0.05, i * 37 + 901);
  });

  /* Las guardas: radios cortos entre el anillo exterior y el siguiente,
     como los dientes de una combinación. */
  const gp = phase(t, 0.3, 0.34);
  if (gp > 0.01) {
    for (let i = 0; i < 24; i++) {
      const ang = (i / 24) * Math.PI * 2 - Math.PI / 2;
      const long = i % 3 === 0;
      const r1 = R * 0.88;
      const r2 = R * (long ? 0.99 : 0.94);
      engraveLine(
        ctx,
        [
          [cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1],
          [cx + Math.cos(ang) * r2, cy + Math.sin(ang) * r2],
        ],
        gp,
        long ? 0.85 : 0.5,
        0.4,
        i * 11 + 911
      );
    }
  }

  /* El ojo de la llave: círculo y talle trapezoidal, tramado por dentro.
     Es la única masa oscura de la lámina y por eso ancla la figura. */
  const kp = phase(t, 0.46, 0.36);
  if (kp > 0.01) {
    const kr = R * 0.13;
    const ky = cy - R * 0.06;
    const circ: Pt[] = [];
    for (let a = 0; a <= 40; a++) {
      const ang = (a / 40) * Math.PI * 2;
      circ.push([cx + Math.cos(ang) * kr, ky + Math.sin(ang) * kr]);
    }
    engraveLine(ctx, circ, kp, 1, 0.5, 921);
    engraveLine(
      ctx,
      [
        [cx - kr * 0.5, ky + kr * 0.8],
        [cx - kr * 0.95, ky + kr * 3.1],
        [cx + kr * 0.95, ky + kr * 3.1],
        [cx + kr * 0.5, ky + kr * 0.8],
      ],
      kp,
      0.9,
      0.46,
      923
    );
    if (kp > 0.5) {
      const fp = clamp01((kp - 0.5) / 0.5);
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, ky, kr * 0.94, 0, Math.PI * 2);
      ctx.clip();
      hatch(ctx, cx - kr, ky - kr, kr * 2, kr * 2, Math.PI / 4, 2.6, 0.44, 0.5, fp, 927);
      ctx.restore();
      graphite(ctx, cx - kr, ky - kr, kr * 2, kr * 2, 46, 0.3, fp, 929);
    }
  }

  /* Los cuatro cerrojos que salen del anillo mayor. */
  const bp = phase(t, 0.66, 0.28);
  if (bp > 0.01) {
    for (let i = 0; i < 4; i++) {
      const ang = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const r1 = R * 1.02;
      const r2 = R * 1.2;
      const nx = Math.cos(ang);
      const ny = Math.sin(ang);
      const px = -ny * 7;
      const py = nx * 7;
      engraveLine(
        ctx,
        [
          [cx + nx * r1 + px, cy + ny * r1 + py],
          [cx + nx * r2 + px, cy + ny * r2 + py],
          [cx + nx * r2 - px, cy + ny * r2 - py],
          [cx + nx * r1 - px, cy + ny * r1 - py],
        ],
        bp,
        0.75,
        0.4,
        i * 19 + 931
      );
    }
  }
}

/* ---- El libro mayor --------------------------------------------------
   Dos páginas abiertas, con sus columnas y sus renglones. Es el objeto
   del que sale el nombre del producto y el mismo que dibuja el
   logotipo: el registro que se lleva a mano, operación por operación,
   antes de que exista ninguna métrica. */
function plateLedger(ctx: Ctx, w: number, h: number, t: number) {
  plateChrome(ctx, w, h, t);
  const m = Math.min(w, h) * 0.055;
  const bw = Math.min(w - m * 2 - w * 0.1, 940);
  const bh = Math.min(h - m * 2 - h * 0.24, 560);
  const x0 = (w - bw) / 2;
  const y0 = (h - bh) / 2;
  const cx = x0 + bw / 2;

  /* Las tapas: dos rectángulos y el lomo. */
  const op = phase(t, 0.04, 0.3);
  handRect(ctx, x0, y0, bw, bh, op, 1.25, 0.46, 1001, 7);
  engraveLine(ctx, [[cx, y0], [cx, y0 + bh]], op, 1, 0.4, 1003);

  /* La curvatura del papel junto al lomo — dos arcos suaves. Sin esto
     son dos rectángulos, no un libro. */
  const sp = phase(t, 0.14, 0.26);
  if (sp > 0.01) {
    for (const s of [-1, 1]) {
      const arc: Pt[] = [];
      for (let i = 0; i <= 20; i++) {
        const p = i / 20;
        arc.push([cx + s * (9 + Math.sin(p * Math.PI) * 7), y0 + p * bh]);
      }
      engraveLine(ctx, arc, sp, 0.5, 0.24, s > 0 ? 1005 : 1007);
    }
  }

  /* Los renglones y las columnas de cada página. */
  const pages: [number, number][] = [
    [x0 + 26, cx - 26],
    [cx + 26, x0 + bw - 26],
  ];
  pages.forEach(([a, b], pi) => {
    const pw = b - a;
    const rows = 11;
    const top = y0 + 46;
    const rh = (bh - 78) / rows;

    /* La cabecera de la página: filete doble. */
    const hp = phase(t, 0.24 + pi * 0.05, 0.24);
    engraveLine(ctx, [[a, top - 12], [b, top - 12]], hp, 0.85, 0.4, pi + 1011);
    engraveLine(ctx, [[a, top - 8], [b, top - 8]], hp, 0.45, 0.26, pi + 1013);

    /* Tres columnas: concepto, cantidad, resultado. */
    const colX = [a + pw * 0.54, a + pw * 0.76];
    const cp = phase(t, 0.34 + pi * 0.04, 0.3);
    for (let c = 0; c < colX.length; c++)
      engraveLine(ctx, [[colX[c], top - 12], [colX[c], top + rows * rh]], cp, 0.4, 0.2, c + pi * 7 + 1021);

    /* Los asientos. La longitud de cada renglón varía para que se lea
       como escritura y no como una plantilla. */
    for (let r = 0; r < rows; r++) {
      const p = phase(t, 0.4 + pi * 0.03 + r * 0.028, 0.22);
      if (p <= 0.01) continue;
      const y = top + r * rh + rh * 0.6;
      const i = r + pi * 40;
      engraveLine(
        ctx,
        [[a + 6, y], [a + 6 + pw * 0.4 * (0.55 + rnd(i + 1031) * 0.45), y]],
        p,
        0.5,
        0.28,
        i + 1033
      );
      engraveLine(
        ctx,
        [[colX[0] + 8, y], [colX[0] + 8 + pw * 0.14 * (0.5 + rnd(i + 1041) * 0.5), y]],
        p,
        0.5,
        0.26,
        i + 1043
      );
      engraveLine(
        ctx,
        [[colX[1] + 8, y], [colX[1] + 8 + pw * 0.15 * (0.5 + rnd(i + 1051) * 0.5), y]],
        p,
        0.5,
        0.3,
        i + 1053
      );
    }

    /* El renglón de suma, con su doble filete de cierre contable. */
    const tp = phase(t, 0.78, 0.22);
    if (tp > 0.02) {
      const ty = top + rows * rh + 6;
      engraveLine(ctx, [[colX[1], ty], [b, ty]], tp, 0.85, 0.44, pi + 1061);
      engraveLine(ctx, [[colX[1], ty + 3.5], [b, ty + 3.5]], tp, 0.85, 0.44, pi + 1063);
    }
  });
}

/* ---- La racha --------------------------------------------------------
   Sesiones consecutivas en columna, arriba las que suman y abajo las que
   restan, con el tope diario cruzando el dibujo. La figura enseña lo que
   ninguna media enseña: que las pérdidas no llegan repartidas, llegan
   seguidas, y que el límite existe para el día en que eso pasa. */
function plateStreak(ctx: Ctx, w: number, h: number, t: number) {
  plateChrome(ctx, w, h, t);
  const m = Math.min(w, h) * 0.055;
  const x0 = m + w * 0.09;
  const gw = w - x0 - m - w * 0.07;
  const cy = h / 2;
  const half = Math.min(h * 0.24, 190);
  const N = 26;
  const bw = (gw / N) * 0.64;

  /* El eje cero, que es de donde nacen todas las barras. */
  const zp = phase(t, 0.04, 0.24);
  engraveLine(ctx, [[x0, cy], [x0 + gw, cy]], zp, 1, 0.44, 1101);

  /* Una tirada determinista con una mala racha deliberada en el centro:
     seis sesiones seguidas en pérdida, que es justo el caso que hunde
     una cuenta de fondeo. */
  for (let i = 0; i < N; i++) {
    const p = phase(t, 0.12 + i * 0.023, 0.26);
    if (p <= 0.01) continue;
    const racha = i >= 12 && i <= 17;
    const raw = rnd(i * 5 + 1111);
    const v = racha ? -(0.35 + raw * 0.6) : raw > 0.36 ? 0.25 + raw * 0.72 : -(0.2 + raw * 0.5);
    const bh = Math.abs(v) * half;
    const bx = x0 + (i + 0.18) * (gw / N);
    const by = v > 0 ? cy - bh : cy;

    handRect(ctx, bx, by, bw, bh, p, 0.6, 0.34, i * 23 + 1121, 1.6);
    ctx.save();
    ctx.beginPath();
    ctx.rect(bx, by, bw, bh);
    ctx.clip();
    /* Las ganadoras se traman en un sentido y las perdedoras en el
       contrario: se distinguen sin recurrir al color, que en una plancha
       de una sola tinta no existe. */
    hatch(ctx, bx, by, bw, bh, v > 0 ? Math.PI / 4 : -Math.PI / 4, 4.2, 0.4, 0.34, p, i + 1131);
    if (racha) hatch(ctx, bx, by, bw, bh, Math.PI / 4, 4.2, 0.36, 0.28, p, i + 1141);
    ctx.restore();
  }

  /* El tope diario: la línea que el guardián no deja cruzar. */
  const lp = phase(t, 0.68, 0.28);
  if (lp > 0.02) {
    const ly = cy + half * 0.72;
    const dash: Pt[] = [];
    for (let X = x0; X < x0 + gw; X += 14) dash.push([X, ly], [X + 8, ly]);
    for (let i = 0; i + 1 < dash.length; i += 2)
      engraveLine(ctx, [dash[i], dash[i + 1]], lp, 0.7, 0.42, i + 1151);
    label(ctx, rot("limiteDiario"), x0 + 4, ly + 17, 9, 0.48, lp);
  }
}

/**
 * `tenure` — la adopción por evidencia, representada como una secuencia de
 * validación. La lámina conserva el lenguaje de instrumento y el eje
 * temporal, pero no presenta una compra que todavía no existe.
 */
function plateTenure(ctx: Ctx, w: number, h: number, t: number) {
  plateChrome(ctx, w, h, t);
  const m = Math.min(w, h) * 0.055;
  const x0 = m + w * 0.1;
  const gw = Math.min(w - x0 - m - w * 0.08, 900);
  const gh = Math.min(h - m * 2 - h * 0.26, 470);
  const yBase = h / 2 + gh / 2;
  const YEARS = 5;
  const stepX = gw / YEARS;

  /* Los dos ejes. Sin ellos las líneas flotan y el hueco no se mide
     contra nada. */
  const ap = phase(t, 0.03, 0.22);
  engraveLine(ctx, [[x0, yBase], [x0 + gw, yBase]], ap, 1, 0.44, 1201);
  engraveLine(ctx, [[x0, yBase], [x0, yBase - gh]], ap, 0.85, 0.36, 1203);

  /* Las marcas de cohorte. El eje es el tiempo de validación, no un
     calendario comercial. */
  for (let i = 0; i <= YEARS; i++) {
    const p = phase(t, 0.08 + i * 0.02, 0.2);
    if (p <= 0.01) continue;
    const X = x0 + i * stepX;
    engraveLine(ctx, [[X, yBase], [X, yBase + 6]], p, 0.6, 0.32, i + 1211);
    label(ctx, i === 0 ? rot("hoy") : `${rot("cohorte")} ${i}`, X, yBase + 19, 8.5, 0.42, p, "center");
  }

  /* LA ESCALERA — la validación. Cada cohorte añade evidencia, no un
     cobro recurrente. */
  const yTop = yBase - gh * 0.9;
  const subPts: Pt[] = [[x0, yBase]];
  for (let i = 1; i <= YEARS; i++) {
    const yPrev = yBase - ((i - 1) / YEARS) * (yBase - yTop);
    const yNow = yBase - (i / YEARS) * (yBase - yTop);
    subPts.push([x0 + i * stepX, yPrev], [x0 + i * stepX, yNow]);
  }
  const sp = phase(t, 0.2, 0.34);
  engraveLine(ctx, subPts, sp, 1.35, 0.5, 1221);
  label(ctx, rot("validacion"), x0 + gw - 6, yTop - 10, 9.5, 0.5, sp, "right");

  /* LA HORIZONTAL — el acceso anticipado privado: una condición estable
     durante esta fase, sin convertirla en una oferta comercial. */
  const yOnce = yBase - gh * 0.16;
  const oncePts: Pt[] = [[x0, yBase], [x0, yOnce], [x0 + gw, yOnce]];
  const op = phase(t, 0.42, 0.3);
  engraveLine(ctx, oncePts, op, 1.35, 0.52, 1231);
  label(ctx, rot("accesoPrivado"), x0 + 8, yOnce - 11, 9.5, 0.52, op, "left");

  /* EL HUECO — lo que separa una cosa de la otra, que es de lo que va la
     página. Se trama por franjas anuales siguiendo la escalera, no como
     un bloque: así se ve que el ahorro no es una cifra, sino algo que se
     acumula año a año. */
  const gp = phase(t, 0.62, 0.34);
  if (gp > 0.02) {
    for (let i = 1; i <= YEARS; i++) {
      const yNow = yBase - (i / YEARS) * (yBase - yTop);
      const bx = x0 + (i - 1) * stepX;
      ctx.save();
      ctx.beginPath();
      ctx.rect(bx, yNow, stepX, yOnce - yNow);
      ctx.clip();
      hatch(ctx, bx, yNow, stepX, yOnce - yNow, Math.PI / 4, 5.4, 0.38, 0.2, gp, i + 1241);
      ctx.restore();
    }
    label(ctx, rot("evidenciaAcumulada"), x0 + gw * 0.5, yTop + gh * 0.3, 9, 0.44, gp, "center");
  }
}

/**
 * `sessions` — el día partido en husos.
 *
 * Una banda de veinticuatro horas y, encima, las tres plazas que se van
 * pasando el mercado: Asia, Londres y Nueva York. Lo que la figura tiene
 * que dejar claro no son los horarios, sino los SOLAPES — las franjas en
 * que dos plazas están abiertas a la vez y la liquidez se dobla. Por eso
 * son lo único con doble trama: son la respuesta a "¿a qué hora opero?",
 * que es la pregunta que hay detrás.
 */
function plateSessions(ctx: Ctx, w: number, h: number, t: number) {
  plateChrome(ctx, w, h, t);
  const m = Math.min(w, h) * 0.055;
  const x0 = m + w * 0.08;
  const gw = Math.min(w - x0 - m - w * 0.06, 920);
  const bandH = Math.min(h * 0.1, 46);
  /* El eje NO va en el centro geométrico. Las tres plazas se apilan por
     encima de él y abajo sólo quedan las horas, así que centrar el eje
     dejaba la figura entera en la mitad superior y media lámina vacía —
     se vio en pantalla, no en el código. Se baja el eje justo la mitad de
     esa asimetría para que sea el DIBUJO lo que quede centrado. */
  const cy = h / 2 + (3.4 * bandH + 30 - 40) / 2;
  const hx = (hour: number) => x0 + (hour / 24) * gw;

  /* El eje del día, con su marca cada tres horas. Es la única referencia
     absoluta de la lámina: todo lo demás se mide contra él. */
  const ap = phase(t, 0.03, 0.22);
  engraveLine(ctx, [[x0, cy], [x0 + gw, cy]], ap, 1, 0.44, 1301);
  for (let hh = 0; hh <= 24; hh += 3) {
    const p = phase(t, 0.06 + hh * 0.006, 0.2);
    if (p <= 0.01) continue;
    engraveLine(ctx, [[hx(hh), cy], [hx(hh), cy + 7]], p, 0.6, 0.34, hh + 1311);
    label(ctx, `${String(hh).padStart(2, "0")}`, hx(hh), cy + 21, 8.5, 0.4, p, "center");
  }
  label(ctx, rot("horaUtc"), x0, cy + 40, 9, 0.42, ap, "left");

  /* Las tres plazas. Cada una es una barra a su propia altura para que
     los solapes se vean por superposición vertical y no por mezcla. */
  /* Las tres plazas, con su horario UTC y su carril. El nombre sale de la
     serie traducida: «LONDRES» y «NUEVA YORK» estaban escritos aquí. */
  const nombresPlaza = serie("plazas");
  const plazas: [string, number, number, number][] = [
    [nombresPlaza[0], 0, 9, -1],
    [nombresPlaza[1], 7, 16, -2],
    [nombresPlaza[2], 12, 21, -3],
  ];
  const bh = bandH;
  plazas.forEach(([nombre, ini, fin, nivel], i) => {
    const p = phase(t, 0.2 + i * 0.12, 0.28);
    if (p <= 0.01) return;
    const y = cy + nivel * (bh + 10) - bh * 0.4;
    const bx = hx(ini);
    const bw = hx(fin) - bx;
    handRect(ctx, bx, y, bw, bh, p, 0.95, 0.42, i * 31 + 1321, 3);
    ctx.save();
    ctx.beginPath();
    ctx.rect(bx, y, bw, bh);
    ctx.clip();
    hatch(ctx, bx, y, bw, bh, Math.PI / 4, 5.6, 0.36, 0.24, p, i + 1331);
    ctx.restore();
    label(ctx, nombre, bx + 6, y + bh * 0.62, 9.5, 0.5, p, "left");
  });

  /* LOS SOLAPES. Se graban al final, sobre las barras ya trazadas: son
     lectura de segundo orden, la que solo tiene sentido cuando ya se ve
     quién está abierto. Doble trama cruzada, que es como un grabado
     marca una zona sin disponer de color. */
  const sp = phase(t, 0.62, 0.32);
  if (sp > 0.02) {
    const solapes: [number, number][] = [
      [7, 9],
      [12, 16],
    ];
    const yTop = cy - 3 * (bh + 10) - bh * 0.4;
    const alto = cy - yTop - 6;
    solapes.forEach(([a, b], i) => {
      const bx = hx(a);
      const bw = hx(b) - bx;
      ctx.save();
      ctx.beginPath();
      ctx.rect(bx, yTop, bw, alto);
      ctx.clip();
      hatch(ctx, bx, yTop, bw, alto, Math.PI / 4, 4.4, 0.42, 0.22, sp, i + 1341);
      hatch(ctx, bx, yTop, bw, alto, -Math.PI / 4, 4.4, 0.42, 0.22, sp, i + 1351);
      ctx.restore();
      for (const X of [bx, bx + bw])
        engraveLine(ctx, [[X, yTop], [X, cy - 4]], sp, 0.55, 0.3, Math.round(X) + 1361);
    });
    label(ctx, rot("solape"), hx(14), yTop - 9, 9, 0.46, sp, "center");
  }
}

/**
 * `significance` — dónde acaba la suerte.
 *
 * La campana de lo que una racha cualquiera produce por puro azar, y a su
 * derecha el umbral a partir del cual un resultado deja de explicarse así.
 * La cola sombreada es la zona de la que se puede decir algo; todo lo que
 * queda a la izquierda, por bueno que parezca, cabe dentro del ruido.
 *
 * Es deliberadamente incómoda: la parte tramada es pequeña comparada con
 * el cuerpo de la campana, y esa desproporción ES el argumento. Casi
 * cualquier racha corta vive bajo la joroba.
 */
function plateSignificance(ctx: Ctx, w: number, h: number, t: number) {
  plateChrome(ctx, w, h, t);
  const m = Math.min(w, h) * 0.055;
  const x0 = m + w * 0.09;
  const gw = Math.min(w - x0 - m - w * 0.07, 900);
  const gh = Math.min(h - m * 2 - h * 0.28, 420);
  const yBase = h / 2 + gh / 2;
  const cx = x0 + gw * 0.44;
  const sigma = gw * 0.14;
  const campana = (x: number) => yBase - gh * Math.exp(-Math.pow((x - cx) / sigma, 2) / 2);

  const ap = phase(t, 0.03, 0.22);
  engraveLine(ctx, [[x0, yBase], [x0 + gw, yBase]], ap, 1, 0.44, 1401);

  /* La curva. Se traza de un tirón porque una campana partida en tramos
     deja de leerse como una sola cosa. */
  const pts: Pt[] = [];
  for (let i = 0; i <= 120; i++) {
    const X = x0 + (i / 120) * gw;
    pts.push([X, campana(X)]);
  }
  const cp = phase(t, 0.14, 0.36);
  engraveLine(ctx, pts, cp, 1.3, 0.5, 1411);

  /* El umbral. Una vertical y su rótulo: la frontera del argumento. */
  const xU = cx + sigma * 1.96;
  const up = phase(t, 0.46, 0.26);
  if (up > 0.02) {
    const dash: Pt[] = [];
    for (let Y = yBase; Y > yBase - gh * 0.98; Y -= 13) dash.push([xU, Y], [xU, Y - 7]);
    for (let i = 0; i + 1 < dash.length; i += 2)
      engraveLine(ctx, [dash[i], dash[i + 1]], up, 0.7, 0.4, i + 1421);
    label(ctx, rot("umbral"), xU + 7, yBase - gh * 0.9, 9.5, 0.5, up, "left");
  }

  /* La cola: lo que ya no cabe en la casualidad. Franjas verticales
     estrechas bajo la curva, no un bloque, para que se vea que se agota
     poco a poco y no de golpe. */
  const tp = phase(t, 0.62, 0.34);
  if (tp > 0.02) {
    const paso = 5.2;
    for (let X = xU; X < x0 + gw; X += paso) {
      const yTop = campana(X);
      if (yBase - yTop < 0.6) continue;
      ctx.save();
      ctx.beginPath();
      ctx.rect(X, yTop, paso * 0.82, yBase - yTop);
      ctx.clip();
      hatch(ctx, X, yTop, paso * 0.82, yBase - yTop, Math.PI / 4, 3.4, 0.4, 0.26, tp, Math.round(X) + 1431);
      ctx.restore();
    }
    label(ctx, rot("yaNoEsSuerte"), x0 + gw, yBase + 22, 9, 0.46, tp, "right");
  }

  /* Y el nombre de lo que ocupa casi todo el ancho, que es lo que se
     suele confundir con una ventaja. */
  label(ctx, rot("soloAzar"), cx, yBase + 22, 9, 0.44, cp, "center");
}

/**
 * `workspace` — la mesa de trabajo.
 *
 * El alzado de la aplicación: marco, barra de título, columna de
 * navegación y la mancha de contenido dividida en paneles. No es un
 * pantallazo —un grabado no reproduce una interfaz—, es el plano de
 * cómo está repartida.
 *
 * Va en `/demo`, y ahí tiene una función que ninguna figura prestada
 * podía cumplir: la página enseña la aplicación funcionando, y el fondo
 * la dibuja como se dibujaría un instrumento en un tratado.
 */
/**
 * `blueprint` — el despiece de lo que está construido y lo que no.
 *
 * Un plano de taller: piezas numeradas dentro de su caja, unas trazadas a
 * línea llena y otras a línea discontinua. En el dibujo técnico esa es
 * exactamente la convención de "previsto pero no ejecutado", y aquí
 * significa lo mismo.
 *
 * Va en `/beta`, y es la única figura del atlas que dice algo que el
 * resto no podía decir: que el producto está a medio hacer y que eso se
 * declara en vez de disimularse. Una curva de resultados detrás de la
 * página de acceso anticipado prometía lo contrario.
 */
function plateBlueprint(ctx: Ctx, w: number, h: number, t: number) {
  plateChrome(ctx, w, h, t);
  const m = Math.min(w, h) * 0.055;
  const x0 = m + w * 0.08;
  const y0 = m + h * 0.14;
  const gw = w - x0 - m - w * 0.06;
  const gh = h - y0 - m - h * 0.12;

  /* Cinco piezas de tamaños distintos, colocadas a mano: una retícula
     regular se leería como una tabla, y esto es un despiece. */
  const piezas: Array<[number, number, number, number, boolean]> = [
    /* x, y, ancho, alto, ¿ejecutada? — en fracciones de la caja */
    [0.0, 0.0, 0.44, 0.42, true],
    [0.48, 0.0, 0.52, 0.24, true],
    [0.48, 0.28, 0.24, 0.36, true],
    [0.76, 0.28, 0.24, 0.36, false],
    [0.0, 0.48, 0.44, 0.34, false],
  ];

  piezas.forEach(([fx, fy, fw, fh, hecha], i) => {
    const p = phase(t, 0.06 + i * 0.09, 0.3);
    if (p <= 0.01) return;
    const bx = x0 + fx * gw;
    const by = y0 + fy * gh;
    const bw = fw * gw;
    const bh = fh * gh;

    if (hecha) {
      handRect(ctx, bx, by, bw, bh, p, 0.85, 0.42, i * 31 + 2201, 2);
      ctx.save();
      ctx.beginPath();
      ctx.rect(bx, by, bw, bh);
      ctx.clip();
      hatch(ctx, bx, by, bw, bh, Math.PI / 4, 7.5, 0.4, 0.2, p, i + 2211);
      ctx.restore();
    } else {
      /* Pieza prevista: solo el contorno, y a trazos. Sin trama dentro,
         porque no hay nada dentro todavía. */
      const seg: Pt[] = [];
      const paso = 11;
      for (let X = bx; X < bx + bw; X += paso) seg.push([X, by], [Math.min(X + 6, bx + bw), by]);
      for (let Y = by; Y < by + bh; Y += paso) seg.push([bx + bw, Y], [bx + bw, Math.min(Y + 6, by + bh)]);
      for (let X = bx + bw; X > bx; X -= paso) seg.push([X, by + bh], [Math.max(X - 6, bx), by + bh]);
      for (let Y = by + bh; Y > by; Y -= paso) seg.push([bx, Y], [bx, Math.max(Y - 6, by)]);
      for (let k = 0; k + 1 < seg.length; k += 2)
        engraveLine(ctx, [seg[k], seg[k + 1]], p, 0.62, 0.3, k + i * 37 + 2221);
    }

    /* Número de pieza, como en una lámina de despiece. */
    label(ctx, String(i + 1).padStart(2, "0"), bx + 8, by + 20, 10, hecha ? 0.5 : 0.34, p);
  });

  /* La leyenda que hace legible la convención. Sin ella, el trazo
     discontinuo es solo un estilo; con ella, es información. */
  const lp = phase(t, 0.62, 0.3);
  if (lp > 0.02) {
    const ly = y0 + gh + 26;
    engraveLine(ctx, [[x0, ly - 14], [x0 + gw * 0.5, ly - 14]], lp, 0.6, 0.3, 2251);
    label(ctx, rot("lineaLlena"), x0, ly + 2, 9, 0.44, lp);
    label(ctx, rot("lineaTrazos"), x0 + gw * 0.42, ly + 2, 9, 0.34, lp);
  }
}

/**
 * `profile` — el perfil trazado punto a punto.
 *
 * Seis ejes que salen de un centro y un polígono que los une: la forma
 * clásica de dibujar un perfil cuando lo que importa no es cada valor
 * suelto sino la silueta que forman juntos.
 *
 * Va en `/test`, que es exactamente lo que hace esa página — te pregunta
 * y dibuja tu perfil. Antes compartía figura con la página de disciplina,
 * y dos secciones que abren con la misma figura se leen como la misma
 * página aunque digan cosas distintas.
 */
function plateProfile(ctx: Ctx, w: number, h: number, t: number) {
  plateChrome(ctx, w, h, t);
  const cx = w / 2;
  const cy = h * 0.52;
  const R = Math.min(w * 0.3, h * 0.36);
  const EJES = 6;
  const ang = (i: number) => -Math.PI / 2 + (i / EJES) * Math.PI * 2;

  /* Las circunferencias de referencia: una de cada tres más marcada, que
     es la convención de curva índice de la cartografía. Sin ella, una
     retícula de seis anillos es ruido; con ella, se puede leer un valor. */
  const anillos = 5;
  for (let k = 1; k <= anillos; k++) {
    const p = phase(t, 0.04 + k * 0.02, 0.26);
    if (p <= 0.01) continue;
    const r = (R * k) / anillos;
    const pts: Pt[] = [];
    for (let i = 0; i <= EJES; i++) pts.push([cx + Math.cos(ang(i)) * r, cy + Math.sin(ang(i)) * r]);
    const indice = k % 3 === 0 || k === anillos;
    engraveLine(ctx, pts, p, indice ? 0.85 : 0.45, indice ? 0.3 : 0.16, 2301 + k * 7);
  }

  /* Los radios. */
  for (let i = 0; i < EJES; i++) {
    const p = phase(t, 0.14 + i * 0.02, 0.24);
    if (p <= 0.01) continue;
    engraveLine(
      ctx,
      [[cx, cy], [cx + Math.cos(ang(i)) * R, cy + Math.sin(ang(i)) * R]],
      p,
      0.5,
      0.2,
      2331 + i * 5,
    );
  }

  /* El perfil: valores deterministas, ni redondos ni perfectos — un
     perfil regular sería un dibujo, no una medida. */
  const valores = [0.82, 0.46, 0.68, 0.9, 0.38, 0.62];
  const vert = (i: number): Pt => [
    cx + Math.cos(ang(i)) * R * valores[i % EJES],
    cy + Math.sin(ang(i)) * R * valores[i % EJES],
  ];
  const pp = phase(t, 0.3, 0.36);
  if (pp > 0.01) {
    const pts: Pt[] = [];
    for (let i = 0; i <= EJES; i++) pts.push(vert(i));
    pencil(ctx, pts, pp, 1.25, 0.5, 2361, 2);
  }

  /* Marca en cada vértice: una cruz fina, no un punto gordo. Un punto
     grueso tapa el valor que está señalando. */
  for (let i = 0; i < EJES; i++) {
    const p = phase(t, 0.42 + i * 0.03, 0.22);
    if (p <= 0.02) continue;
    const [vx, vy] = vert(i);
    engraveLine(ctx, [[vx - 4, vy], [vx + 4, vy]], p, 0.75, 0.42, 2401 + i);
    engraveLine(ctx, [[vx, vy - 4], [vx, vy + 4]], p, 0.75, 0.42, 2411 + i);
  }

  /* Rótulo de los ejes, fuera del polígono para no pisarlo. */
  const ROTULOS_EJES = serie("ejesPerfil");
  const rp = phase(t, 0.6, 0.3);
  if (rp > 0.02) {
    for (let i = 0; i < EJES; i++) {
      const a = ang(i);
      const rx = cx + Math.cos(a) * (R + 26);
      const ry = cy + Math.sin(a) * (R + 26);
      label(ctx, ROTULOS_EJES[i], rx - ROTULOS_EJES[i].length * 2.6, ry + 3, 9, 0.4, rp);
    }
  }
}

function plateWorkspace(ctx: Ctx, w: number, h: number, t: number) {
  plateChrome(ctx, w, h, t);
  const m = Math.min(w, h) * 0.055;
  const bw = Math.min(w - m * 2 - w * 0.1, 940);
  const bh = Math.min(h - m * 2 - h * 0.2, 560);
  const x0 = (w - bw) / 2;
  const y0 = (h - bh) / 2;

  /* El marco y su barra de título. */
  const fp = phase(t, 0.03, 0.28);
  handRect(ctx, x0, y0, bw, bh, fp, 1.25, 0.46, 1501, 6);
  const tbh = Math.min(bh * 0.1, 44);
  engraveLine(ctx, [[x0, y0 + tbh], [x0 + bw, y0 + tbh]], fp, 0.9, 0.4, 1503);
  for (let i = 0; i < 3; i++) {
    const p = phase(t, 0.1 + i * 0.03, 0.2);
    if (p <= 0.01) continue;
    rosette(ctx, x0 + bw - 26 - i * 22, y0 + tbh / 2, 1, 1, 5, p);
  }
  label(ctx, rot("marca"), x0 + 16, y0 + tbh * 0.66, 9.5, 0.46, fp, "left");

  /* La columna de navegación, con sus entradas como renglones. */
  const navW = Math.min(bw * 0.22, 190);
  const np = phase(t, 0.22, 0.26);
  engraveLine(ctx, [[x0 + navW, y0 + tbh], [x0 + navW, y0 + bh]], np, 0.85, 0.38, 1511);
  for (let i = 0; i < 6; i++) {
    const p = phase(t, 0.26 + i * 0.022, 0.22);
    if (p <= 0.01) continue;
    const ry = y0 + tbh + 26 + i * 30;
    if (ry > y0 + bh - 18) break;
    engraveLine(ctx, [[x0 + 16, ry], [x0 + navW - 18, ry]], p, 0.6, i === 1 ? 0.44 : 0.26, i + 1521);
    if (i === 1) handRect(ctx, x0 + 10, ry - 11, navW - 22, 20, p, 0.5, 0.24, i + 1531, 2);
  }

  /* La mancha de contenido: una gráfica arriba y dos paneles debajo. Es
     el reparto real de la aplicación, no un relleno. */
  const cx0 = x0 + navW + 18;
  const cw = x0 + bw - cx0 - 18;
  const cy0 = y0 + tbh + 18;
  const ch = y0 + bh - cy0 - 18;

  const gp = phase(t, 0.42, 0.3);
  const gh2 = ch * 0.52;
  handRect(ctx, cx0, cy0, cw, gh2, gp, 0.7, 0.3, 1541, 3);
  /* Dentro, una curva: lo que la aplicación enseña de verdad. */
  const curva: Pt[] = [];
  for (let i = 0; i <= 40; i++) {
    const p = i / 40;
    const yy = cy0 + gh2 * (0.78 - p * 0.5 + Math.sin(p * 7.1) * 0.08 + rnd(i + 1551) * 0.05);
    curva.push([cx0 + 12 + p * (cw - 24), yy]);
  }
  engraveLine(ctx, curva, phase(t, 0.5, 0.3), 1.1, 0.44, 1553);

  const pp = phase(t, 0.66, 0.28);
  const py = cy0 + gh2 + 14;
  const ph = ch - gh2 - 14;
  const pw = (cw - 14) / 2;
  for (let i = 0; i < 2; i++) {
    handRect(ctx, cx0 + i * (pw + 14), py, pw, ph, pp, 0.7, 0.3, i + 1561, 3);
    ctx.save();
    ctx.beginPath();
    ctx.rect(cx0 + i * (pw + 14), py, pw, ph);
    ctx.clip();
    hatch(ctx, cx0 + i * (pw + 14), py, pw, ph, i === 0 ? Math.PI / 4 : -Math.PI / 4, 6.2, 0.34, 0.16, pp, i + 1571);
    ctx.restore();
  }
}

/* ---- El reparto por ruta ---------------------------------------------
   Cada entrada es el guion de una sección: qué se graba, en qué orden y
   cuántas figuras. No todas llevan cuatro — el número sale de lo larga
   que sea la página, no de rellenar una cuadrícula.

   Las claves son rutas SIN barra final y sin el prefijo de despliegue;
   `platesFor` normaliza antes de buscar. */
type PlateFn = (ctx: Ctx, w: number, h: number, t: number) => void;

/**
 * De identificador a función de dibujo. El REPARTO por sección no está
 * aquí: vive en `@/lib/atlas`, junto a los pies de figura, porque las
 * pausas de la página tienen que nombrar exactamente la figura que se
 * está grabando. Con las dos listas separadas bastaba reordenar una ruta
 * para que el pie describiera otra cosa, y nada lo delataba.
 */
const PLATE_FN: Record<PlateId, PlateFn> = {
  equity: plateEquity,
  calendar: plateCalendar,
  distribution: plateDistribution,
  gauge: plateGauge,
  heatmap: plateHeatmap,
  rolling: plateRolling,
  rules: plateRules,
  streak: plateStreak,
  vault: plateVault,
  ledger: plateLedger,
  tenure: plateTenure,
  sessions: plateSessions,
  significance: plateSignificance,
  workspace: plateWorkspace,
  blueprint: plateBlueprint,
  profile: plateProfile,
};

/** Juego de láminas de una ruta, ya resuelto a funciones de dibujo. */
function platesFor(pathname: string): PlateFn[] {
  return platesForRoute(pathname).map((id) => PLATE_FN[id]);
}

export function EngravedAtlas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /* El juego de láminas depende de la sección. Al cambiar de ruta cambia
     el array y el efecto vuelve a montarse entero: se remiden las pausas
     de la página nueva y el grabado arranca desde el principio, que es
     lo que corresponde — entrar en una sección es abrir otro capítulo,
     no continuar el anterior por la mitad. */
  const pathname = usePathname();
  const PLATES = useMemo(() => platesFor(pathname), [pathname]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    /* Ruta sin figura —las legales, y cualquiera que nadie haya previsto—.
       No se monta nada: ni contexto, ni bucle, ni escuchas de scroll. Sin
       esta salida, `1 / PLATES.length` valdría Infinity y el grabado
       intentaría dibujar una lámina que no existe. Estas páginas se quedan
       con el papel y su graduación de margen, que es lo que les toca. */
    if (PLATES.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let ink = "#1a1714";
    let raf = 0;
    let shown = -1;
    let target = 0;
    let last = 0;
    let visible = true;
    let introStart = 0;
    let quitarCortina: (() => void) | null = null;
    let topeIntro = 0;
    /* La primera lámina, en unidades de progreso global. */
    const span0 = 1 / PLATES.length;
    /* Si el bucle está parado. No es «pausado por la pestaña»: es que el
       dibujo ya llegó a donde tenía que llegar y no hay nada que animar
       hasta que el visitante se mueva. Ver `despertar`. */
    let dormido = false;
    /* Lo que dura el grabado de bienvenida. Lo leen el bucle —para saber si
       aún tiene trabajo— y la propia interpolación. */
    const DURACION_INTRO_MS = 5000;
    /* Hasta dónde llega el grabado de bienvenida dentro de la lámina I.
       Lo usan DOS sitios —el bucle, para saber a dónde ir; y el mapa de
       anclas, para que el scroll arranque exactamente ahí— y por eso es
       una constante y no un número escrito dos veces. Cuando lo estaba,
       el mapa decía «progreso 0 en scroll 0» mientras la bienvenida ya
       había dibujado la figura, así que las tres primeras pantallas de
       scroll no movían el dibujo: el scroll pedía menos de lo que ya
       había y `Math.max` se quedaba con lo que había. */
    const INTRO_HASTA = 0.78;

    const readInk = () => {
      const antes = ink;
      /* `--ink` está declarado como `rgb(var(--txt-primary))`.
         `getPropertyValue("--ink")` devuelve ESA cadena, sin resolver
         la variable anidada. El canvas no entiende `rgb(var(...))` y
         ignora el stroke: el grabado se pintaba en negro por defecto,
         invisible sobre el tema oscuro y como un polvillo sobre el
         claro — exactamente "no sale ningún gráfico". Se resuelve
         asignando `color: var(--ink)` a un nodo y leyendo el color
         computado, que sí es un `rgb()` real. */
      const probe = document.createElement("span");
      probe.style.color = "var(--ink)";
      probe.style.position = "absolute";
      probe.style.visibility = "hidden";
      document.documentElement.appendChild(probe);
      const resolved = getComputedStyle(probe).color;
      probe.remove();
      ink =
        resolved && resolved !== "rgba(0, 0, 0, 0)" ? resolved : "#1a1714";
      /* Cambiar de tema cambia la tinta, y las láminas guardadas están
         grabadas con la anterior. Se tiran. */
      if (ink !== antes) descartarBitmaps();
    };

    /* ---- Trazar y componer son dos cosas distintas ----------------------
       Aquí está la decisión de fondo, y viene de un error propio: la
       versión anterior bajaba el fondo a treinta imágenes por segundo para
       que costara menos. Costaba menos y se movía peor, que es exactamente
       lo contrario de lo que hay que hacer en un monitor de alta tasa. No
       se trata de dibujar MENOS VECES, sino de que cada vez cueste poco.

       Son dos trabajos con precios muy distintos:

         TRAZAR una lámina —cientos de segmentos con temblor de pulso,
         tramas, rótulos— es lo más caro que hay en la página, y solo hace
         falta cuando el trazo AVANZA.

         COMPONER —estampar una imagen ya hecha con su opacidad y su
         desplazamiento— cuesta 0,025 ms medidos en esta página, y es lo
         único que necesita ir al ritmo del monitor, porque es lo que
         produce el movimiento que se ve.

       Así que cada lámina tiene su propio lienzo, donde se traza a su
       ritmo, y el lienzo visible NO traza nunca: solo estampa. El
       resultado es que la composición puede correr a 165 fotogramas por
       segundo sin despeinarse, mientras el trazo se rehace bastante menos
       a menudo sin que se note — porque entre dos rehechos el trazo avanza
       una fracción de píxel.

       Una lámina terminada, además, no vuelve a trazarse nunca más: su
       lienzo ya es definitivo y solo se estampa. Que es el caso en el que
       la lámina pasa la mayor parte del tiempo. */
    type Capa = {
      cv: HTMLCanvasElement;
      ctx: CanvasRenderingContext2D;
      t: number;
      /** Progreso al que cada celda de la trama recibió tinta por primera
       *  vez, −1 si está vacía. Es la memoria del asiento (ver `tramar`).
       *  Una por lámina: cada figura tiene su propio recorrido. */
      nacido: Float32Array | null;
    };
    let capas: (Capa | null)[] = PLATES.map(() => null);

    const soltarCapa = (i: number) => {
      const c = capas[i];
      if (!c) return;
      /* Encoger el bitmap antes de soltarlo libera su memoria de vídeo sin
         esperar al recolector, que con lienzos grandes puede tardar. */
      c.cv.width = 0;
      c.cv.height = 0;
      capas[i] = null;
    };

    const descartarBitmaps = () => {
      for (let i = 0; i < capas.length; i++) soltarCapa(i);
      capas = PLATES.map(() => null);
    };

    /* ---- La máscara de la trama ----------------------------------------
       Una sola para todas las láminas y para toda la vida del efecto: el
       revelado la limpia entera antes de cada uso, así que compartirla no
       mezcla nada, y crear un lienzo por repintado sería lo único caro de
       todo el revelado.

       Su tamaño NO depende de la densidad de pantalla, a propósito. La
       trama es la unidad de impresión —una celda de PASO_TRAMA píxeles
       CSS— y esa retícula tiene que medir lo mismo en un portátil normal
       que en uno del doble de densidad, o el grabado saldría con el punto
       más fino en la pantalla buena, que es al revés de lo que espera
       cualquiera. Lo que sí cambia con la densidad es la NITIDEZ del
       punto, porque el punto se pinta en el lienzo real. */
    let mascara: CanvasRenderingContext2D | null = null;
    const mascaraDe = (): CanvasRenderingContext2D | null => {
      const cols = Math.ceil(w / PASO_TRAMA);
      const filas = Math.ceil(h / PASO_TRAMA);
      if (cols < 1 || filas < 1) return null;
      if (!mascara) {
        const cv = document.createElement("canvas");
        /* `willReadFrequently`: este lienzo existe para leerlo con
           `getImageData` en cada repintado. Sin la pista, el navegador lo
           mantiene en la GPU y cada lectura obliga a traerlo de vuelta —
           que es el patrón más lento que hay en canvas. */
        const mctx = cv.getContext("2d", { willReadFrequently: true });
        if (!mctx) return null;
        mascara = mctx;
      }
      if (mascara.canvas.width !== cols || mascara.canvas.height !== filas) {
        mascara.canvas.width = cols;
        mascara.canvas.height = filas;
      }
      return mascara;
    };

    /** Lienzo de la lámina `i` trazado hasta `t`. `null` si no puede crearse. */
    /* ── EL PRESUPUESTO DE REGRABADO ─────────────────────────────────
       Volver a trazar una lámina es, con diferencia, lo más caro que pasa
       aquí: se dibuja entera y se vuelve a muestrear en trama. Mientras el
       lienzo sólo se COMPONE (estampar una capa ya hecha) el fotograma
       cuesta centésimas; cuando toca regrabar, milésimas.

       El revelado avanza en 160 pasos, así que un scroll rápido cruza
       varios por fotograma y encadena regrabados justo cuando menos
       margen hay. Medido con el banco del proyecto: p99 de 40 ms contra un
       presupuesto de 28.

       La solución no es regrabar peor, es regrabar MENOS VECES POR
       SEGUNDO: cada fotograma trae un presupuesto de milisegundos, y
       cuando se agota se compone la capa que ya había. El dibujo se queda
       un paso por detrás durante el scroll —invisible: un paso es medio
       punto de trama— y se pone al día en cuanto el visitante afloja, que
       es cuando sobra tiempo. Antes que un fotograma perdido, un punto
       menos. */
    const PRESUPUESTO_REGRABADO_MS = 1.0;
    let inicioFotograma = 0;
    /* Si todas las capas compuestas en el último fotograma estaban al
       día. Lo pone a false `capaDe` cuando se queda sin presupuesto. */
    let capasAlDia = true;

    const capaDe = (i: number, t: number): HTMLCanvasElement | null => {
      if (w < 1 || h < 1) return null;
      let c = capas[i];
      if (!c) {
        const cv = document.createElement("canvas");
        cv.width = canvas.width;
        cv.height = canvas.height;
        const cctx = cv.getContext("2d");
        /* Sin contexto no hay capa posible: se devuelve null y quien llama
           traza directamente sobre el lienzo visible. Peor rendimiento,
           pero se sigue viendo — nunca una pantalla en blanco. */
        if (!cctx) return null;
        c = { cv, ctx: cctx, t: -1, nacido: null };
        capas[i] = c;
      }
      /* Ya trazada a este progreso: no se toca. Cubre de un golpe el caso
         de la lámina terminada, que se queda con t = 1 para siempre. */
      if (c.t === t) return c.cv;

      const elapsed = performance.now() - inicioFotograma;
      if (c.t >= 0 && elapsed > PRESUPUESTO_REGRABADO_MS) {
        capasAlDia = false;
        return c.cv;
      }
      if (c.t < 0 && elapsed > 6.0) {
        capasAlDia = false;
        return c.cv;
      }

      c.ctx.setTransform(1, 0, 0, 1, 0, 0);
      c.ctx.clearRect(0, 0, c.cv.width, c.cv.height);
      /* Las láminas dibujan en unidades CSS; el bitmap está en píxeles de
         dispositivo. */
      c.ctx.setTransform(cssDpr, 0, 0, cssDpr, 0, 0);
      c.ctx.strokeStyle = ink;
      c.ctx.fillStyle = ink;
      const m = mascaraDe();
      if (m) {
        /* La memoria del asiento se dimensiona con la trama y se reinicia
           si el trazo RETROCEDE. Retroceder es subir con la rueda: la
           figura se está deshaciendo, así que lo que vuelva a aparecer
           tiene que volver a asentarse desde cero, no aparecer ya
           colocado. */
        const celdas = m.canvas.width * m.canvas.height;
        if (!c.nacido || c.nacido.length !== celdas) {
          c.nacido = new Float32Array(celdas).fill(-1);
        } else if (t < c.t) {
          c.nacido.fill(-1);
        }
        tramar(c.ctx, m, PLATES[i], w, h, t, ink, c.nacido);
      } else {
        PLATES[i](c.ctx, w, h, t);
      }
      c.t = t;
      return c.cv;
    };

    /* ---- Tamaño del lienzo ---------------------------------------------
       Tres cosas tenían que arreglarse aquí, y las tres se veían.

       1) SE BORRABA Y REARRANCABA. Asignar `canvas.width` vacía el
          bitmap, siempre, aunque le pongas el mismo número. La versión
          anterior lo asignaba en cada evento de resize y, en lugar de
          repintar ahí mismo, dejaba `shown = -1` para que lo hiciera el
          siguiente fotograma. Pero `shown` no es una bandera: es el
          progreso desde el que interpola el bucle. Ponerlo en -1
          significaba "vuelve a grabar el atlas entero desde antes del
          principio". Por eso al arrastrar el borde de la ventana el
          fondo desaparecía y volvía a dibujarse solo. Ahora el
          repintado es SÍNCRONO, dentro del mismo evento y con el
          progreso real: el bitmap nunca llega vacío a pantalla.

       2) SÓLO ESCUCHABA `window.resize`. El lienzo no ocupa la ventana:
          ocupa su contenedor. Y ese contenedor cambia de ancho sin que
          la ventana se mueva —cuando aparece o desaparece la barra de
          scroll al cargarse las secciones diferidas, con el zoom del
          navegador, o al arrastrar la ventana a un monitor de otra
          densidad—. En todos esos casos el bitmap se quedaba con la
          medida vieja y el navegador lo ESTIRABA para rellenar: de ahí
          el marco descuadrado, con las esquinas fuera de sitio y los
          filetes dobles. Un `ResizeObserver` sobre el propio lienzo se
          entera de todos ellos; `window.resize` no.

       3) MEDÍA EN ENTEROS. `clientWidth` redondea: un contenedor de
          1306,4 px se declaraba de 1306, y el navegador estiraba esos
          1306 px de bitmap sobre 1306,4 px de caja. Cuatro décimas de
          píxel bastan para que un filete de una línea salga gris en vez
          de negro y para que las esquinas del marco no cierren. El
          rectángulo de `getBoundingClientRect` da la medida fraccional
          y el estiramiento desaparece. */
    let cssW = 0;
    let cssH = 0;
    let cssDpr = 0;
    /* Hasta que el bucle no ha arrancado, `shown` todavía no significa
       nada y no hay nada que repintar. */
    let ready = false;

    const applySize = (nextW: number, nextH: number, dpr: number) => {
      if (nextW === cssW && nextH === cssH && dpr === cssDpr) return false;
      cssW = nextW;
      cssH = nextH;
      cssDpr = dpr;
      w = nextW;
      h = nextH;
      canvas.width = Math.max(1, Math.round(nextW * dpr));
      canvas.height = Math.max(1, Math.round(nextH * dpr));
      /* Los grabados guardados tienen el tamaño anterior: ya no sirven. */
      descartarBitmaps();
      /* La transformación se pierde al redimensionar el bitmap; hay que
         reponerla o el dibujo saldría a escala 1 en una pantalla 2×. */
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      return true;
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      /* Techo de 1,5 y no de 2. El coste de grabar una lámina crece con el
         número de PÍXELES, así que una pantalla al doble de densidad
         cuadruplica el trabajo — y es justo donde más se notaba, en
         portátiles densos y en móviles.

         A cambio no se pierde nada visible: esto es un grabado a lápiz de
         líneas finísimas y muy tenues sobre papel, no tipografía ni una
         captura. Entre 1,5× y 2× no hay diferencia apreciable en un trazo
         de medio píxel al treinta por ciento de opacidad, y sí la hay —del
         44 % de área— en lo que cuesta pintarlo. */
      /* Probado bajarlo a 1,25 buscando fotogramas: dos corridas del
         banco de fluidez con cada valor, y la diferencia se quedó
         dentro del ruido de la medida (p99 de 30-41 ms en los dos
         casos). El coste de regrabar una lámina está en TRAZAR las
         curvas, no en cuántos píxeles ocupan, así que bajar la
         resolución sólo habría quitado nitidez a cambio de nada. */
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      const changed = applySize(r.width, r.height, dpr);
      measureAnchors();
      if (changed && ready) {
        /* El bitmap acaba de quedarse en blanco. Se rellena aquí mismo,
           antes de devolver el control al navegador, para que no llegue
           a componerse un solo fotograma vacío. */
        target = scrollProgress();
        draw(shown < 0 ? target : shown);
      }
      /* Cambiar de tamaño mueve las anclas, y con ellas el destino: si el
         bucle estaba dormido hay que volver a ponerlo en marcha para que
         alcance el nuevo. */
      despertar();
    };

    /* ---- Anclaje a las pausas de lámina --------------------------------
       Las pausas (`PlateInterlude`, marcadas con `data-plate`) son las
       franjas donde el fondo se ve entero. Que una de ellas te pille en
       mitad de una transición —dos figuras a medias superpuestas— sería
       el peor momento posible, justo el que se ha reservado para
       lucirlo.

       Así que el progreso no se reparte a ciegas por el scroll: se ANCLA.
       Se mide dónde está el centro de cada pausa y se construye una
       curva de progreso que pasa obligatoriamente por esos puntos, con
       la lámina N al 97 % cuando la pausa N está centrada en pantalla.
       Entre anclas se interpola linealmente, así que el trazo sigue
       avanzando de forma continua mientras lees los capítulos.

       Se recalcula al redimensionar y cuando cambia la altura del
       documento — las secciones cargan de forma diferida y crecen, y una
       posición cacheada de más se traduce en láminas descuadradas. */
    let anchors: [number, number][] = [];
    /* Las anclas se remiden CUANDO CAMBIA ALGO, no por reloj.
       ────────────────────────────────────────────────────────────────
       Estaban remidiéndose diez veces por segundo, siempre, con el
       argumento de que `content-visibility` hace crecer las secciones sin
       que cambie `scrollHeight`. El argumento es cierto; la solución era
       cara: cada medida es un `querySelectorAll`, un `getBoundingClientRect`
       por pausa y una lectura de `scrollHeight`, y las tres obligan al
       navegador a recalcular la maquetación EN MITAD DEL SCROLL, que es
       justo cuando no hay milisegundos que gastar. Medido: p99 de 40 ms
       contra un presupuesto de 28.

       Lo que de verdad invalida una medida es que el documento cambie de
       forma. Eso lo dicen los observadores, sin coste mientras no pasa: un
       `ResizeObserver` sobre el documento y sobre cada pausa, y un
       `MutationObserver` que sólo levanta una bandera cuando aparece o
       desaparece contenido. Medir sigue costando lo mismo; lo que cambia
       es cuántas veces se paga. */
    let anclasSucias = true;
    let pausasVistas = -1;
    let lastAnchorMeasure = 0;

    const measureAnchors = () => {
      const nodes = [...document.querySelectorAll("[data-plate]")].sort(
        (a, b) => Number(a.getAttribute("data-plate")) - Number(b.getAttribute("data-plate"))
      );
      const span = 1 / PLATES.length;
      /* El primer ancla arranca donde termina la bienvenida, no en cero:
         ver `INTRO_HASTA`. */
      const list: [number, number][] = [[0, INTRO_HASTA * span]];
      /* De paso —y sin pagar una pasada más— se mide dónde empieza el
         velo del pie de cada pausa cuando está centrada: es el suelo por
         debajo del cual una figura ya no se lee. Se queda el más alto de
         todos, que es el que sirve para todas. Ver `sueloFigura`. */
      let suelo0 = 1;
      nodes.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        /* Scroll al que esta pausa queda centrada en la ventana. */
        const centred = r.top + scrollY + r.height / 2 - innerHeight / 2;
        list.push([Math.max(0, centred), Math.min(1, (i + 0.97) * span)]);
        /* Sólo cuentan las pausas ALTAS —62 vh o 88 vh, las dos medidas
           reales del sitio—, nunca las cortas. En ≤900 px de ancho la
           propia hoja de estilos encoge la pausa a 32-38 vh (la nota
           está junto a `.tj-interlude` en `globals.css`) para no dejar
           un hueco muerto de scroll. Ahí el pie ocupa casi toda la caja
           y su velo arranca casi en el techo del recorte —a un 0,29 de
           la ventana, medido—, muy por encima de donde de verdad hace
           falta subir la figura: el lienzo es del tamaño de la VENTANA
           entera, no de la pausa, así que tomar ese suelo habría
           encogido el cuadrante de riesgo hasta dejarlo asomando por
           detrás de la sección anterior. El umbral de la mitad separa
           limpio los dos mundos —0,62 y 0,88 pasan, 0,32-0,38 no—; en
           una pausa corta la propia caja ya reparte el espacio y no
           necesita esta medida. */
        if (r.height < innerHeight * 0.5) return;
        const pie = el.querySelector(".tj-interlude-caption");
        if (pie && innerHeight > 0) {
          /* `top: -3.5rem` en `.tj-interlude-caption::before`. */
          const arriba = pie.getBoundingClientRect().top + scrollY - 56 - centred;
          const f = arriba / innerHeight;
          if (f < suelo0) suelo0 = f;
        }
      });
      /* Los topes evitan que una maqueta a medio asentar deje el atlas
         dibujando en una franja absurda. */
      if (suelo0 < 1) sueloFigura = Math.min(0.72, Math.max(0.46, suelo0));
      const max = document.documentElement.scrollHeight - innerHeight;
      if (max > 0) list.push([max, 1]);
      /* Estrictamente creciente en x: si dos anclas caen en el mismo
         punto (pausas muy juntas o layout aún sin asentar), la
         interpolación dividiría por cero. */
      anchors = list.filter((p, i) => i === 0 || p[0] > list[i - 1][0]);
      anclasSucias = false;
      /* Cuántas pausas se han visto. Si el número cambia, es que se ha
         montado (o desmontado) una: hay que volver a medir aunque nadie
         haya cambiado de tamaño. */
      pausasVistas = nodes.length;
    };

    /* Progreso del atlas — atado al scroll ABSOLUTO, no al relativo.
       ────────────────────────────────────────────────────────────────
       Lo natural sería `scrollY / (scrollHeight - innerHeight)`, y es lo
       que había. No funciona en este sitio: las secciones se revelan al
       entrar en pantalla y varias montan contenido diferido, así que la
       altura del documento CRECE mientras bajas. Con el denominador
       cambiando bajo los pies, el mismo píxel de scroll valía un
       progreso distinto de un instante a otro — las láminas se
       adelantaban, y al crecer la página retrocedían a la anterior. Se
       veía como un fondo que va y viene sin motivo.

       Midiendo en pantallas recorridas, el denominador es constante y el
       progreso solo puede avanzar cuando el visitante avanza. Cada
       lámina dura 0,9 pantallas: cuatro láminas en 3,6 pantallas, que es
       algo menos de lo que mide la portada, así que se ven las cuatro
       enteras. En una página más corta se verán las que quepan y la
       última se queda puesta, que es el comportamiento correcto — un
       atlas no obliga a llegar al final para tener sentido. */
    const scrollProgress = () => {
      /* Con anclas: interpolación lineal por tramos entre ellas. */
      if (anchors.length >= 2) {
        const y = scrollY;
        if (y <= anchors[0][0]) return anchors[0][1];
        for (let i = 1; i < anchors.length; i++) {
          const [x1, p1] = anchors[i];
          if (y <= x1) {
            const [x0, p0] = anchors[i - 1];
            return clamp01(p0 + ((y - x0) / (x1 - x0)) * (p1 - p0));
          }
        }
        return anchors[anchors.length - 1][1];
      }
      /* Sin pausas en la página (rutas que no son la home): reparto por
         pantallas recorridas. Es estable aunque el documento crezca,
         que es lo que rompía el reparto relativo al scrollHeight. */
      const perPlate = Math.max(320, innerHeight * 0.9);
      return clamp01(scrollY / (perPlate * PLATES.length));
    };

    const draw = (p: number) => {
      /* Arranca el reloj del presupuesto de regrabado (ver `capaDe`). */
      inicioFotograma = performance.now();
      capasAlDia = true;
      /* El idioma de los rótulos grabados, en cada repintado. Se lee del
         `<html lang>` y no de `useLang()` a propósito: este dibujo corre
         fuera del árbol de React —dentro de un `requestAnimationFrame` con
         lienzos cacheados— y suscribirlo a un contexto obligaría a
         reconstruir el efecto entero cada vez que cambia cualquier otra
         cosa del proveedor. El atributo es la misma fuente que corrige el
         `postbuild` en las 76 páginas inglesas, y está puesto antes del
         primer fotograma. */
      idiomaRotulos = document.documentElement.lang === "en" ? "en" : "es";

      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = ink;
      ctx.fillStyle = ink;

      const n = PLATES.length;
      const span = 1 / n;
      for (let i = 0; i < n; i++) {
        const local = (p - i * span) / span;
        if (local < -0.2 || local > 1.2) {
          /* Fuera de plano: se suelta su lienzo. Cada uno pesa lo que uno
             del tamaño de la ventana —unos 10 MB en un monitor grande—, y
             guardar los de toda la página serían cuarenta por tener a mano
             figuras que no se están viendo. Como mucho hay dos láminas en
             pantalla a la vez, así que ese es el techo real de memoria. */
          soltarCapa(i);
          continue;
        }

        /* Cruce corto: con un solape largo, dos figuras técnicas
           conviven a media opacidad durante un buen tramo de scroll y
           eso no se lee como transición, se lee como fondo sucio. */
        const fadeIn = ease(clamp01((local + 0.2) / 0.2));
        const fadeOut = 1 - ease(clamp01((local - 1) / 0.2));
        const alpha = Math.min(fadeIn, fadeOut);
        if (alpha <= 0.004) continue;

        /* El desplazamiento del cruce va con la MISMA curva que su
           fundido. Era lineal, así que la lámina saliente se apartaba a
           velocidad constante y se cortaba en seco al desaparecer; ahora
           las dos cosas —lo que se ve y lo que se mueve— llegan juntas. */
        const lift =
          local > 1
            ? -46 * ease(clamp01((local - 1) / 0.2))
            : local < 0
              ? 30 * (1 - ease(clamp01((local + 0.2) / 0.2)))
              : 0;

        /* El progreso del TRAZO se redondea a pasos fijos; el de la
           COMPOSICIÓN no se toca. Así, entre dos pasos, la lámina se
           estampa tal cual —gratis— y lo que sigue moviéndose de forma
           continua es su opacidad y su desplazamiento, que es lo que el
           ojo lee como fluidez.

           Cuántos pasos —y por qué ese número y no otro— está en
           `PASOS_TRAZO`: lo fija el paso de la retícula de la trama, no
           el píxel. Una lámina terminada cae siempre en el último paso y
           por tanto no se vuelve a revelar jamás. */
        const tLocal = clamp01(local);
        const tTrazo = Math.round(tLocal * PASOS_TRAZO) / PASOS_TRAZO;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(0, lift);
        const capa = capaDe(i, tTrazo);
        /* Sin capa (contexto no disponible) se traza directo: peor, pero
           el fondo se sigue viendo. */
        if (capa) ctx.drawImage(capa, 0, 0, w, h);
        else PLATES[i](ctx, w, h, tLocal);
        ctx.restore();
      }
    };

    const frame = (now: number) => {
      /* El siguiente fotograma NO se pide aquí arriba. Se pide en cada
         salida, porque una de ellas —la de «no ha cambiado nada y la
         bienvenida ya terminó»— es la que deja el bucle dormido. Pedirlo
         antes de saberlo era lo que mantenía esto girando para siempre. */
      if (!visible) {
        /* Pestaña oculta: el navegador no ejecutaría el fotograma de
           todas formas. Se duerme y lo despierta `visibilitychange`. */
        dormido = true;
        raf = 0;
        return;
      }
      const dt = Math.min(now - last, 64);
      last = now;

      /* Las pausas se vuelven a medir 10 veces por segundo, SIEMPRE.
         La versión anterior solo remedía cuando cambiaba
         `scrollHeight`, y ese atajo estaba roto: las secciones usan
         `content-visibility`, así que su altura definitiva no se conoce
         hasta que entran en pantalla, pero el alto total del documento
         puede quedarse igual porque el navegador ya lo tenía estimado.
         Resultado: las anclas se quedaban con las posiciones de la
         primera medida y la lámina no coincidía con su pausa — al
         llegar a la tercera seguía dibujándose la primera.

         EL INTERVALO VA POR RELOJ, NO POR FOTOGRAMAS. Estaba escrito como
         "uno de cada seis", que son diez veces por segundo sólo si la
         pantalla va a sesenta. En un monitor de 165 Hz eran veintisiete, y
         cada una mide rectángulos y el alto del documento: lecturas que
         obligan al navegador a recalcular el diseño ENTERO en ese
         instante. El efecto era tan absurdo como suena — cuanto mejor la
         pantalla, más trabajo inútil y menos fluidez, que es justo lo
         contrario de lo que debe pasar.

         Con reloj, medir cuesta lo mismo a 60 que a 165 o a 240 — pero
         costaba SIEMPRE. Ahora la bandera la levantan los observadores
         (ver `anclasSucias`) y aquí sólo se paga cuando el documento ha
         cambiado de forma de verdad. `scrollProgress` sí se recalcula en
         cada fotograma: es aritmética sobre `anchors` y `scrollY`, sin
         tocar la maquetación. */
      if (anclasSucias && (now - lastAnchorMeasure > 200 || anchors.length === 0)) {
        measureAnchors();
        lastAnchorMeasure = now;
      }
      target = scrollProgress();

      /* Grabado inicial: la lámina I se dibuja SOLA, entera, en la primera
         pantalla. Sin esto, quien abre la página encuentra el fondo en
         blanco —el trazo solo existiría al hacer scroll— y no llega a
         enterarse de que el atlas está ahí. A partir de ese punto manda el
         scroll, y el `max` hace que desplazarse nunca dé marcha atrás al
         dibujo.

         ── POR QUÉ ENTERA Y NO A MEDIAS ──────────────────────────────
         Esto llevaba a `0.5 * span0`: media lámina. Media figura no se
         lee como una figura — se lee como un fondo con algo suelto, y el
         síntoma era exactamente ese: «el gráfico no se ve en la primera
         sección, hay que hacer mucho scroll para que empiece».

         Media lámina además dejaba fuera justo lo que la identifica: la
         curva se corta a medio recorrido y el marco, la cartela y la
         graduación viven en el último tramo del revelado. Ahora llega a
         0,97 —el mismo valor con el que una pausa da una lámina por
         terminada— en cinco segundos: lo bastante lento para que se vea
         DIBUJAR, que es el efecto que justifica todo este componente, y
         lo bastante rápido para estar completa antes de que nadie haya
         terminado de leer el titular.

         ── Y POR QUÉ NO HASTA EL FINAL DEL TRAMO ─────────────────────
         Porque `Math.max` no compara la intro con el scroll: le gana. La
         primera pausa está a unas tres pantallas, y hasta ella el
         progreso que pide el scroll es MENOR que el que dejó la intro,
         así que el dibujo se quedaba clavado durante todo ese tramo. El
         visitante hacía scroll y el fondo no se movía — la otra mitad
         del mismo síntoma.

         Con 0,78 la lámina llega a la primera pantalla con su curva y su
         marco ya trazados, y aún le queda un quinto de revelado que el
         scroll se encarga de completar justo cuando la pausa I entra en
         pantalla. La intro presenta la figura; el scroll la termina. */
      /* ── LA BIENVENIDA SE GRABABA DETRÁS DEL TELÓN, Y ADEMÁS NO ERA
         LA BIENVENIDA ────────────────────────────────────────────────
         Dos fallos encadenados, y el efecto que justifica todo este
         componente —ver cómo se dibuja la primera lámina— no se veía.

         Uno: el reloj arrancaba al montar el lienzo, y el loader de
         primera visita tapa la pantalla durante más de un segundo. Ese
         primer tramo, que es el que más se nota porque el papel está en
         blanco, ocurría detrás de la cortina. Ahora `introStart` vale −1
         hasta que `IntroSequence` avisa de que la cortina sube (ver
         `@/lib/intro`), con un tope por si nadie avisara.

         Dos: el objetivo se tomaba como el MAYOR entre el scroll y la
         bienvenida, y el primer ancla del mapa de scroll ya declara
         `INTRO_HASTA` en scrollY = 0 —para que al empezar a bajar el
         dibujo no retroceda—. O sea que el máximo daba el destino entero
         desde el primer fotograma: la lámina se plantaba de un tirón, al
         ritmo del suavizado, y la curva de cinco segundos no gobernaba
         nada. Ahora la bienvenida es la parte del recorrido por debajo de
         `INTRO_HASTA` y el scroll sólo añade lo que pida por encima, así
         que las dos cosas conviven en vez de pisarse. */
      const introT = introStart < 0 ? 0 : clamp01((now - introStart) / DURACION_INTRO_MS);
      const base = INTRO_HASTA * span0;
      const goal = Math.max(target - base, 0) + curvaIntro(introT) * base;

      const next = shown + (goal - shown) * (1 - Math.exp((-dt * 6) / 1000));

      /* NO hay techo de fotogramas ni umbral de avance. Los hubo, y eran un
         error: ahorraban trabajo a costa de lo único que se nota, que es la
         suavidad. Ahora componer cuesta 0,025 ms —una imagen ya hecha con
         su opacidad y su desplazamiento—, así que el fondo puede seguir la
         tasa del monitor, sea de 60 o de 165, sin pagar por ello.

         Lo único que se descarta es el fotograma en que no ha cambiado
         absolutamente nada, y se compara contra el valor exacto, no contra
         una tolerancia: si el progreso se movió una millonésima, se
         compone. */
      if (next === shown && capasAlDia) {
        /* ── Y CUANDO NO CAMBIA NADA, EL BUCLE SE DUERME ──────────────
           Aquí ponía que descartar el fotograma «lo deja a coste cero».
           No lo dejaba: descartar el DIBUJO no descarta el fotograma. El
           `requestAnimationFrame` se seguía reprogramando, así que con el
           visitante leyendo parado el hilo principal se despertaba unas
           53 veces por segundo, y una de cada diez veces medía el
           documento entero. Contado en una página sin figura —que no
           monta esto— eran 1 despertar en 5 s; en una con figura, 266.

           Ahora, cuando el dibujo ha convergido y la bienvenida ha
           terminado, el bucle se PARA. Lo despierta lo único que puede
           cambiar el destino: el scroll, un cambio de tamaño o volver a
           la pestaña. Parado de verdad, no parado de mentira. */
        const introViva = introStart >= 0 && now - introStart < DURACION_INTRO_MS;
        if (!introViva && goal === shown && capasAlDia) {
          dormido = true;
          raf = 0;
          return;
        }
        raf = requestAnimationFrame(frame);
        return;
      }

      raf = requestAnimationFrame(frame);
      shown = next;
      draw(shown);
    };

    /* Vuelve a poner el bucle en marcha si estaba dormido. Idempotente: si
       ya corre, no encadena un segundo rAF —eso duplicaría el trabajo por
       fotograma y es el error clásico de este patrón. */
    const despertar = () => {
      if (!dormido || reduce) return;
      dormido = false;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    };

    const onScroll = () => {
      target = scrollProgress();
      if (reduce) {
        shown = target;
        draw(shown);
        return;
      }
      despertar();
    };

    readInk();
    resize(); // mide también las anclas
    target = scrollProgress();

    if (reduce) {
      /* Sin movimiento, el mismo destino que el grabado de bienvenida.
         Quien pide menos animación ve la figura, no media figura. */
      shown = Math.max(target, span0 * INTRO_HASTA);
      ready = true;
      draw(shown);
    } else {
      shown = 0;
      introStart = -1;
      ready = true;
      draw(shown);
      /* Arranca DORMIDO: lo despierta la cortina —o el scroll, si alguien
         se adelanta—. El tope de tres segundos es la red de seguridad
         para el caso en que `IntroSequence` no llegara a montar. */
      dormido = true;
      const empezarIntro = () => {
        if (introStart >= 0) return;
        introStart = performance.now();
        despertar();
      };
      quitarCortina = alLevantarCortina(empezarIntro);
      topeIntro = window.setTimeout(empezarIntro, 3000);
    }

    addEventListener("scroll", onScroll, { passive: true });

    /* El observador vigila el LIENZO, no la ventana — ver el comentario
       de `resize`. Se salta la primera notificación, que llega sola al
       observar y repetiría la medida que ya se hizo al arrancar. */
    let firstObservation = true;
    const ro = new ResizeObserver(() => {
      if (firstObservation) {
        firstObservation = false;
        return;
      }
      resize();
    });
    ro.observe(canvas);

    /* ── QUIÉN AVISA DE QUE LAS ANCLAS HAN CADUCADO ──────────────────
       Dos observadores y ningún reloj.

       El de tamaño mira el documento y cada pausa: cubre el caso que
       motivó la medición continua —una sección con `content-visibility`
       que crece al asomar— porque crecer es cambiar de tamaño, y aquí eso
       llega como notificación en vez de sondearse sesenta veces.

       El de mutaciones sólo observa `childList` en el árbol principal y no
       lee NADA del layout: levanta la bandera y se va. Es lo que cubre las
       pausas que aún no existían al arrancar. */
    const marcarSucias = () => {
      anclasSucias = true;
      despertar();
    };
    const roDoc = new ResizeObserver(marcarSucias);
    roDoc.observe(document.documentElement);
    document.querySelectorAll("[data-plate]").forEach((el) => roDoc.observe(el));

    const moPausas = new MutationObserver(() => {
      /* `querySelectorAll` sobre un selector de atributo es barato y no
         fuerza maquetación; comparar el número evita remedir por cualquier
         cambio de texto del documento. */
      const n = document.querySelectorAll("[data-plate]").length;
      if (n === pausasVistas) return;
      document.querySelectorAll("[data-plate]").forEach((el) => roDoc.observe(el));
      marcarSucias();
    });
    moPausas.observe(document.body, { childList: true, subtree: true });

    /* Cambio de densidad de pantalla: arrastrar la ventana de un monitor
       normal a uno de alta resolución no altera ni un píxel CSS del
       lienzo, así que el observador de tamaño no se entera — pero el
       bitmap se queda a la mitad de resolución y el trazo sale borroso.
       La media query se reengancha en cada disparo porque el valor que
       vigila cambia justo cuando salta. */
    let dprQuery: MediaQueryList | null = null;
    const watchDpr = () => {
      dprQuery?.removeEventListener("change", onDprChange);
      dprQuery = matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
      dprQuery.addEventListener("change", onDprChange);
    };
    function onDprChange() {
      resize();
      watchDpr();
    }
    watchDpr();

    const onVis = () => {
      visible = !document.hidden;
      last = performance.now();
      /* Al volver a la pestaña el bucle está dormido —se durmió al
         ocultarse—, así que hay que llamarlo. */
      if (visible) despertar();
    };
    document.addEventListener("visibilitychange", onVis);

    /* El tema se puede cambiar en caliente; la tinta debe seguirlo. */
    const obs = new MutationObserver(() => {
      readInk();
      draw(shown);
      /* Las láminas guardadas se tiraron con la tinta vieja: hay que
         volver a grabarlas, y para eso el bucle no puede estar dormido. */
      despertar();
    });
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-palette"],
    });

    return () => {
      cancelAnimationFrame(raf);
      quitarCortina?.();
      window.clearTimeout(topeIntro);
      removeEventListener("scroll", onScroll);
      ro.disconnect();
      roDoc.disconnect();
      moPausas.disconnect();
      dprQuery?.removeEventListener("change", onDprChange);
      document.removeEventListener("visibilitychange", onVis);
      obs.disconnect();
      /* Y los lienzos de las láminas. Este efecto se rehace en CADA cambio
         de ruta —el juego de láminas es distinto en cada sección—, así que
         sin esto cada navegación deja atrás hasta dos lienzos del tamaño
         de la ventana esperando al recolector. Soltarlos aquí devuelve la
         memoria en el acto en vez de cuando al navegador le parezca. */
      descartarBitmaps();
      /* Y la máscara de la trama, por el mismo motivo: es pequeña, pero
         una por navegación se acumula igual. */
      if (mascara) {
        mascara.canvas.width = 0;
        mascara.canvas.height = 0;
        mascara = null;
      }
    };
  }, [PLATES]);

  return <canvas ref={canvasRef} aria-hidden className="tj-engraved-atlas" />;
}
