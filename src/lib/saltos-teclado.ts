/**
 * Los saltos `g` + letra, en un solo sitio.
 *
 * Antes estaban dos veces: el mapa tecla → ruta en `GlobalShortcuts`, que
 * es quien navega, y la lista tecla → nombre en `ShortcutsHelp`, que es
 * quien la enseña. Añadir un destino en uno y olvidarlo en el otro no
 * rompía nada: dejaba un atajo que funciona y no está documentado, o uno
 * documentado que no hace nada. Con una sola tabla eso no puede pasar.
 *
 * El orden es el que se lee en la ayuda.
 */
export type SaltoTeclado = {
  /** Segunda tecla de la secuencia. Siempre minúscula. */
  tecla: string;
  ruta: string;
  es: string;
  en: string;
};

export const SALTOS_TECLADO: readonly SaltoTeclado[] = [
  { tecla: "h", ruta: "/", es: "Inicio", en: "Home" },
  { tecla: "f", ruta: "/features", es: "Características", en: "Features" },
  { tecla: "m", ruta: "/features/metricas", es: "Métricas", en: "Metrics" },
  { tecla: "d", ruta: "/features/disciplina", es: "Disciplina", en: "Discipline" },
  { tecla: "s", ruta: "/features/seguridad", es: "Seguridad", en: "Security" },
  { tecla: "p", ruta: "/pricing", es: "Precios", en: "Pricing" },
  { tecla: "e", ruta: "/demo", es: "Demo", en: "Demo" },
  { tecla: "a", ruta: "/about", es: "Acerca de", en: "About" },
  { tecla: "q", ruta: "/faq", es: "FAQ", en: "FAQ" },
  { tecla: "t", ruta: "/test", es: "Test de disciplina", en: "Discipline test" },
  { tecla: "c", ruta: "/herramientas", es: "Herramientas", en: "Tools" },
  { tecla: "o", ruta: "/glosario", es: "Glosario", en: "Glossary" },
  { tecla: "b", ruta: "/beta", es: "Acceso anticipado (Beta)", en: "Early access (Beta)" },
  { tecla: "u", ruta: "/traders/manual", es: "Operativa manual", en: "Manual trading" },
  { tecla: "r", ruta: "/traders/prop-firms", es: "Prop firms", en: "Prop firms" },
];

/** Tecla → ruta, lo que consulta el teclado global al resolver la secuencia. */
export const G_NAV_MAP: Record<string, string> = Object.fromEntries(
  SALTOS_TECLADO.map((s) => [s.tecla, s.ruta]),
);
