/**
 * Logotipo de CountPips (el «Corte»: una C gruesa con un pip cuadrado en el
 * hueco). La geometría la define el generador de la app de escritorio;
 * `scripts/generate-brand.py` la importa e imprime con `--tsx` las dos
 * constantes de abajo, que no se editan a mano.
 *
 * Usa `rgb(var(--accent-base))`, no un color fijo, para verse en los dos temas.
 * Es una sola forma rellena, sin `defs` ni degradados: dos instancias no chocan.
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
