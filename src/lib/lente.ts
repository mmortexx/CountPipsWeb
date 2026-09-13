/**
 * Cristal líquido: refracción real en el bisel y reflejo especular, como el
 * Liquid Glass de Apple. Cada superficie recibe un filtro SVG propio que se
 * aplica con `backdrop-filter: url(#id)` — sólo Chromium (Chrome y Edge, los
 * de Windows) lo admite; el resto se queda con el esmerilado de `.tj-cristal`.
 *
 * El mapa codifica en R/G el desplazamiento hacia dentro de la superficie
 * según la pendiente de un perfil squircle y la ley de Snell (n = 1,5).
 */
export type Lente = {
  /** Anchura del bisel curvo en px. */
  bisel: number;
  /** Desplazamiento máximo en px. */
  escala: number;
  /** Desenfoque interior (stdDeviation del SVG). */
  blur: number;
  saturacion: number;
  /** Intensidad 0–1 del reflejo especular. */
  brillo: number;
  /** Mide el `::before` en vez del elemento (la cápsula de la barra). */
  pseudo?: boolean;
  /** Propiedad CSS donde se publica el `url(#id)`. */
  propiedad?: string;
};

export const LENTES = {
  panel: { bisel: 28, escala: 44, blur: 9, saturacion: 1.8, brillo: 0.9 },
  control: { bisel: 0, escala: 34, blur: 1.2, saturacion: 1.9, brillo: 1 },
  barra: { bisel: 20, escala: 34, blur: 7, saturacion: 1.9, brillo: 0.95, pseudo: true, propiedad: "--lente-barra" },
} satisfies Record<string, Lente>;

const N = 1.5;
const perfil = (t: number) => Math.pow(1 - Math.pow(1 - t, 4), 0.25);

/** Magnitud 0–1 del desplazamiento a lo largo del bisel (t = 0 en el canto). */
function curvaRefraccion(muestras = 128): Float32Array {
  const raw = new Float32Array(muestras);
  const h = 1e-3;
  let max = 0;
  for (let i = 0; i < muestras; i++) {
    const t = Math.min(1 - h, Math.max(h, i / (muestras - 1)));
    const pendiente = (perfil(t + h) - perfil(t - h)) / (2 * h);
    const incidencia = Math.atan(pendiente);
    const refractado = Math.asin(Math.sin(incidencia) / N);
    raw[i] = Math.tan(incidencia - refractado) * (1 - perfil(t) * 0.5);
    max = Math.max(max, raw[i]);
  }
  for (let i = 0; i < muestras; i++) raw[i] = max ? raw[i] / max : 0;
  return raw;
}

const CURVA = curvaRefraccion();
const LUZ = { x: -0.55, y: -0.83 };

/**
 * Mapas RGBA (desplazamiento y brillo) para una superficie de w×h con radio r.
 * Fuera del bisel el desplazamiento es neutro (128) y el brillo transparente.
 */
export function mapasLente(w: number, h: number, r: number, lente: Lente) {
  const desp = new Uint8ClampedArray(w * h * 4);
  const luz = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < desp.length; i += 4) {
    desp[i] = 128;
    desp[i + 1] = 128;
    desp[i + 2] = 128;
    desp[i + 3] = 255;
    luz[i] = 255;
    luz[i + 1] = 255;
    luz[i + 2] = 255;
  }
  const radio = Math.min(r, w / 2, h / 2);
  const bisel = Math.max(1, Math.min(lente.bisel || Math.min(w, h) * 0.34, w / 2, h / 2));
  const cx = w / 2;
  const cy = h / 2;
  const banda = radio + bisel;

  for (let y = 0; y < h; y++) {
    const py = y + 0.5;
    const filaEntera = py < banda || py > h - banda;
    for (let x = 0; x < w; x++) {
      if (!filaEntera && x + 0.5 > banda && x + 0.5 < w - banda) continue;
      const px = x + 0.5;
      const qx = Math.abs(px - cx) - (cx - radio);
      const qy = Math.abs(py - cy) - (cy - radio);
      const ox = Math.max(qx, 0);
      const oy = Math.max(qy, 0);
      const fuera = Math.hypot(ox, oy);
      const d = -(fuera + Math.min(Math.max(qx, qy), 0) - radio);
      if (d < 0 || d >= bisel) continue;
      let nx = fuera > 0 ? ox / fuera : qx > qy ? 1 : 0;
      let ny = fuera > 0 ? oy / fuera : qx > qy ? 0 : 1;
      nx *= Math.sign(px - cx) || 1;
      ny *= Math.sign(py - cy) || 1;
      const t = d / bisel;
      const m = CURVA[Math.min(CURVA.length - 1, Math.round(t * (CURVA.length - 1)))];
      const i = (y * w + x) * 4;
      desp[i] = 128 - nx * m * 127;
      desp[i + 1] = 128 - ny * m * 127;

      const cara = nx * LUZ.x + ny * LUZ.y;
      const canto = Math.pow(1 - t, 2.6);
      const filo = t < 1.6 / bisel ? 0.55 : 0;
      const brillo = (Math.pow(Math.max(0, cara), 1.6) + 0.4 * Math.pow(Math.max(0, -cara), 1.6)) * canto + filo * (0.35 + 0.65 * Math.abs(cara));
      luz[i + 3] = Math.min(1, brillo * lente.brillo) * 255;
    }
  }
  return { desp, luz };
}

const SVG_NS = "http://www.w3.org/2000/svg";

/** Chromium en escritorio o móvil: el único motor que lee `url()` en backdrop-filter. */
export function admiteLente(): boolean {
  if (typeof window === "undefined" || typeof CSS === "undefined") return false;
  if (window.matchMedia?.("(prefers-reduced-transparency: reduce)").matches) return false;
  const nav = navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } };
  const chromium = nav.userAgentData?.brands?.some((b) => /Chromium/i.test(b.brand)) ?? false;
  return chromium && CSS.supports("backdrop-filter", "url(#a)");
}

let contador = 0;

function lienzo(w: number, h: number, datos: Uint8ClampedArray): string {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  c.getContext("2d")!.putImageData(new ImageData(datos as Uint8ClampedArray<ArrayBuffer>, w, h), 0, 0);
  return c.toDataURL("image/png");
}

function contenedor(): SVGSVGElement {
  let svg = document.getElementById("tj-lentes") as SVGSVGElement | null;
  if (!svg) {
    svg = document.createElementNS(SVG_NS, "svg");
    svg.id = "tj-lentes";
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";
    document.body.appendChild(svg);
  }
  return svg;
}

function nodo(tag: string, attrs: Record<string, string | number>) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
  return el;
}

/** Monta la lente sobre `el` y devuelve la limpieza. Sin soporte no hace nada. */
export function montarLente(el: HTMLElement, lente: Lente): () => void {
  if (!admiteLente()) return () => {};
  const id = `tj-lente-${++contador}`;
  const propiedad = lente.propiedad ?? "--lente";
  const filtro = nodo("filter", { id, x: 0, y: 0, width: 1, height: 1, "color-interpolation-filters": "sRGB" });
  contenedor().appendChild(filtro);
  let medida = "";
  let pendiente = 0;

  const construir = () => {
    pendiente = 0;
    const cs = getComputedStyle(el, lente.pseudo ? "::before" : null);
    const w = Math.round(lente.pseudo ? parseFloat(cs.width) : el.offsetWidth);
    const h = Math.round(lente.pseudo ? parseFloat(cs.height) : el.offsetHeight);
    const r = parseFloat(cs.borderTopLeftRadius) || 0;
    const clave = `${w}x${h}x${r}`;
    if (!w || !h || clave === medida) return;
    medida = clave;
    const { desp, luz } = mapasLente(w, h, r, lente);
    const img = { x: 0, y: 0, width: w, height: h, preserveAspectRatio: "none" };
    filtro.replaceChildren(
      nodo("feGaussianBlur", { in: "SourceGraphic", stdDeviation: lente.blur, edgeMode: "duplicate", result: "esmerilado" }),
      nodo("feImage", { ...img, href: lienzo(w, h, desp), result: "mapa" }),
      nodo("feDisplacementMap", { in: "esmerilado", in2: "mapa", scale: lente.escala, xChannelSelector: "R", yChannelSelector: "G", result: "refractado" }),
      nodo("feColorMatrix", { in: "refractado", type: "saturate", values: lente.saturacion, result: "vivo" }),
      nodo("feImage", { ...img, href: lienzo(w, h, luz), result: "luz" }),
      nodo("feComposite", { in: "luz", in2: "vivo", operator: "over" }),
    );
    el.style.setProperty(propiedad, `url(#${id})`);
    el.dataset.lente = "true";
  };

  const ro = new ResizeObserver(() => {
    if (!pendiente) pendiente = requestAnimationFrame(construir);
  });
  ro.observe(el);
  construir();

  return () => {
    ro.disconnect();
    if (pendiente) cancelAnimationFrame(pendiente);
    el.style.removeProperty(propiedad);
    delete el.dataset.lente;
    filtro.remove();
  };
}
