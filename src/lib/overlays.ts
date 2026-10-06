/**
 * Contrato entre quien pide abrir un overlay y quien lo pinta. Vive aparte
 * para que los disparadores (montados en todas las páginas) no arrastren la
 * ventana entera y anulen la carga diferida de `OverlayHost`. El nombre del
 * evento se declara una vez: una errata en un extremo no daría ningún error.
 */
export const OPEN_SHORTCUTS_HELP = "tj:open-shortcuts-help";
export const OPEN_GLOSSARY = "tj:open-glossary";

/** Pide abrir la ayuda de atajos. La escucha `OverlayHost`. */
export function openShortcutsHelp() {
  window.dispatchEvent(new CustomEvent(OPEN_SHORTCUTS_HELP));
}

/** Pide abrir el glosario modal; lo escucha `OverlayHost`, único sitio que lo
 *  carga (un `dynamic()` por disparador duplicaba el glosario). `ancla` es
 *  adónde vuelve el foco al cerrar: Safari no enfoca un botón al pulsarlo. */
export function openGlossary(ancla?: HTMLElement | null) {
  window.dispatchEvent(new CustomEvent(OPEN_GLOSSARY, { detail: { ancla: ancla ?? null } }));
}
