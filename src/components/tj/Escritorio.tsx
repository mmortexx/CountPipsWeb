/** Fondo de escritorio para el cristal: luz difusa y, si se pide, una curva
 *  nítida que se ve limpia fuera del cristal y difuminada a través de él. */
export function Escritorio({ curva = false, className = "" }: { curva?: boolean; className?: string }) {
  return (
    <div aria-hidden="true" className={`tj-escritorio ${className}`}>
      {curva && (
        <svg className="tj-escritorio-curva" viewBox="0 0 1200 400" preserveAspectRatio="none">
          <path
            vectorEffect="non-scaling-stroke"
            d="M0,276L20,288L40,275L60,260L80,264L100,261L120,250L140,255L160,260L180,257L200,259L220,260L240,267L260,253L280,244L300,247L320,250L340,228L360,231L380,239L400,265L420,286L440,281L460,291L480,302L500,305L520,306L540,304L560,315L580,326L600,317L620,306L640,314L660,303L680,285L700,273L720,266L740,254L760,266L780,263L800,267L820,295L840,292L860,297L880,294L900,290L920,283L940,266L960,277L980,256L1000,246L1020,236L1040,237L1060,249L1080,245L1100,228L1120,220L1140,207L1160,197L1180,190L1200,179"
          />
        </svg>
      )}
    </div>
  );
}
