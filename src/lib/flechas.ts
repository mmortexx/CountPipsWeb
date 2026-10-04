import type { KeyboardEvent } from "react";

/** Adónde lleva una tecla dentro de un grupo de opción o de pestañas
 *  (patrón de WAI-ARIA): las flechas dan la vuelta en los extremos; Inicio
 *  y Fin saltan a ellos. `null` si la tecla no mueve. En las pestañas solo
 *  cuentan ← y →: ↑ y ↓ siguen desplazando la página. */
export function destinoConFlechas(tecla: string, actual: number, total: number, soloHorizontal = false): number | null {
  if (total <= 0) return null;
  const siguiente = (actual + 1) % total;
  const anterior = (actual - 1 + total) % total;
  switch (tecla) {
    case "ArrowRight":
      return siguiente;
    case "ArrowLeft":
      return anterior;
    case "ArrowDown":
      return soloHorizontal ? null : siguiente;
    case "ArrowUp":
      return soloHorizontal ? null : anterior;
    case "Home":
      return 0;
    case "End":
      return total - 1;
    default:
      return null;
  }
}

/** Mueve la elección y el foco a la vez, como un grupo nativo: la
 *  selección sigue al foco. Un lector anuncia «1 de 4» al entrar en el
 *  grupo, así que sin esto se prometía un teclado que no existía.
 *  El grupo es el `radiogroup` o `tablist` más cercano, y cada opción debe
 *  llevar `tabIndex` 0 si es la elegida y −1 si no: una parada por grupo. */
export function moverConFlechas(e: KeyboardEvent<HTMLElement>, actual: number, elegir: (i: number) => void): void {
  const grupo = e.currentTarget.closest('[role="radiogroup"],[role="tablist"]');
  if (!grupo) return;
  const rol = grupo.getAttribute("role") === "tablist" ? "tab" : "radio";
  const opciones = Array.from(grupo.querySelectorAll<HTMLElement>(`[role="${rol}"]`));
  const destino = destinoConFlechas(e.key, actual, opciones.length, rol === "tab");
  if (destino === null) return;
  e.preventDefault();
  elegir(destino);
  opciones[destino]?.focus();
}
