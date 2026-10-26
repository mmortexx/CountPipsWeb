import type { DemoPage } from "./DemoContext";

/** Las pestañas de la demo, en el orden del menú: las teclas 1…n, el gesto
 *  lateral y la ayuda de atajos del sitio la leen de aquí. Sin JSX, para que esa
 *  ayuda no arrastre el menú de la demo a todas las páginas. */
export const PESTANAS_DEMO: readonly Exclude<DemoPage, "detail">[] = ["dashboard", "trades", "analytics", "journal"];
