/**
 * El contrato entre quien PIDE abrir un overlay y quien lo pinta.
 *
 * Vive aparte por una razón muy concreta de peso de página. El disparador
 * (`openShortcutsHelp`) es una línea que despacha un evento; la ventana de
 * ayuda son 370 líneas más `framer-motion`. Mientras los dos compartieron
 * archivo, cualquiera que quisiera el disparador —`GlobalShortcuts`, que
 * está montado en todas las páginas— se llevaba la ventana entera detrás,
 * y eso anulaba en la práctica la carga diferida de `OverlayHost`: el
 * módulo pesado volvía a entrar en el arranque por la puerta de atrás.
 *
 * Separándolos, pedir la apertura no cuesta nada y sólo pinta quien
 * escucha. El nombre del evento se declara UNA vez y se importa: si
 * estuviera escrito a mano en cada extremo, bastaría una errata para que
 * la tecla dejara de abrir nada y sin ningún error que lo delatara.
 */
export const OPEN_SHORTCUTS_HELP = "tj:open-shortcuts-help";
export const OPEN_GLOSSARY = "tj:open-glossary";

/** Pide abrir la ayuda de atajos. La escucha `OverlayHost`. */
export function openShortcutsHelp() {
  window.dispatchEvent(new CustomEvent(OPEN_SHORTCUTS_HELP));
}

/** Pide abrir el glosario modal. La escucha `OverlayHost`. */
export function openGlossary() {
  window.dispatchEvent(new CustomEvent(OPEN_GLOSSARY));
}
