/**
 * Marca de clase de activo (cripto, divisas, acciones, futuros, materias
 * primas). Se codifica por forma y en tinta terciaria, nunca por color: el
 * verde y el rojo son solo del P&L, y a 6 px los tonos de la paleta se leían
 * como ganancia o pérdida (contraste de 1,5:1, bajo el 3:1 de una señal
 * gráfica). Sin discos, que se leen como píldora de estado.
 */

const FORMA: Record<string, string> = {
  crypto: "rotate-45",
  forex: "[clip-path:polygon(50%_0%,100%_100%,0%_100%)]",
  stock: "bg-transparent border-[1.5px] border-[rgb(var(--txt-tertiary))] rounded-[1px]",
  futures: "rounded-[1px]",
  commodity: "bg-transparent border-[1.5px] border-[rgb(var(--txt-tertiary))] rotate-45 rounded-[0.5px]",
};

export function AssetMark({
  assetClass,
  title,
  className = "",
}: {
  assetClass?: string;
  title?: string;
  className?: string;
}) {
  const forma = FORMA[assetClass ?? "stock"] ?? FORMA.stock;
  return (
    // Caja fija de 10×10: el rombo sobresale de su cuadro al girar y desalinearía la columna.
    <span
      className={`inline-grid place-items-center w-[10px] h-[10px] shrink-0 ${className}`}
      aria-hidden="true"
      title={title}
    >
      <span
        className={`block w-[7px] h-[7px] bg-[rgb(var(--txt-tertiary))] ${forma}`}
      />
    </span>
  );
}
