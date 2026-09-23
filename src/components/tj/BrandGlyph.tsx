/**
 * BrandGlyph — el logotipo de CountPips: el «Corte», una C gruesa abierta
 * hacia arriba a la derecha con un pip cuadrado que sale por el hueco.
 *
 * ── De dónde sale ─────────────────────────────────────────────────────
 * La geometría la define una sola vez el generador de la aplicación de
 * escritorio; scripts/generate-brand.py la importa y de ahí salen
 * logo.png, apple-icon.png, favicon.ico, icon.svg y las dos constantes de
 * abajo, que imprime con `--tsx` y no se editan a mano.
 *
 * Sustituye a la retícula de puntos por decisión del propietario
 * (23/09/2026).
 *
 * ── El color no es fijo, y eso es deliberado ──────────────────────────
 * Se dibuja con `rgb(var(--accent-base))` —la plata nardo en tema oscuro y
 * la pizarra en claro—, igual que la app tiñe su barra de título con el
 * acento del tema. Un color fijo brillaría en un tema y desaparecería en
 * el otro.
 *
 * Es una sola forma rellena, sin `defs` ni degradados: dos instancias en
 * la misma página no pueden chocar y a 18 px se lee igual que a 64.
 */

const TRAZO = "M80.000 50.000A30 30 0 1 1 55.209 20.456L52.778 34.243A16 16 0 1 0 66.000 50.000ZM61.869 29.466H73.369V40.966H61.869Z";
const CAJA = "18 18 64 64";

export function BrandGlyph({
  size = 17,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={CAJA}
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path d={TRAZO} fill="rgb(var(--accent-base))" />
    </svg>
  );
}

/** Trazo y caja del logotipo, para las tarjetas que se dibujan fuera del DOM. */
export { TRAZO as TRAZO_MARCA, CAJA as CAJA_MARCA };
