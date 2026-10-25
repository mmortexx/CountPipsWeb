/**
 * Los saltos `g` + letra: tabla única para `GlobalShortcuts` (navega) y
 * `ShortcutsHelp` (los enseña), para que no haya atajos sin documentar ni
 * documentados que no hacen nada. El orden es el que se lee en la ayuda.
 */
export type SaltoTeclado = {
  /** Segunda tecla de la secuencia. Siempre minúscula. */
  tecla: string;
  ruta: string;
  es: string;
  en: string;
  pt: string;
  fr: string;
  de: string;
  it: string;
};

/* Los nombres, los mismos que el pie (`pie.ts`). */
export const SALTOS_TECLADO: readonly SaltoTeclado[] = [
  { tecla: "h", ruta: "/", es: "Inicio", en: "Home", pt: "Início", fr: "Accueil", de: "Startseite", it: "Home" },
  { tecla: "f", ruta: "/features", es: "Características", en: "Features", pt: "Funcionalidades", fr: "Fonctionnalités", de: "Funktionen", it: "Funzionalità" },
  { tecla: "m", ruta: "/features/metricas", es: "Métricas", en: "Metrics", pt: "Métricas", fr: "Métriques", de: "Kennzahlen", it: "Metriche" },
  { tecla: "d", ruta: "/features/disciplina", es: "Disciplina", en: "Discipline", pt: "Disciplina", fr: "Discipline", de: "Disziplin", it: "Disciplina" },
  { tecla: "s", ruta: "/features/seguridad", es: "Seguridad", en: "Security", pt: "Segurança", fr: "Sécurité", de: "Sicherheit", it: "Sicurezza" },
  { tecla: "p", ruta: "/pricing", es: "Precios", en: "Pricing", pt: "Preços", fr: "Tarifs", de: "Preise", it: "Prezzi" },
  { tecla: "e", ruta: "/demo", es: "Demo", en: "Demo", pt: "Demo", fr: "Démo", de: "Demo", it: "Demo" },
  { tecla: "a", ruta: "/about", es: "Acerca de", en: "About", pt: "Sobre", fr: "À propos", de: "Über uns", it: "Chi siamo" },
  { tecla: "q", ruta: "/faq", es: "FAQ", en: "FAQ", pt: "FAQ", fr: "FAQ", de: "FAQ", it: "FAQ" },
  { tecla: "t", ruta: "/test", es: "Test de disciplina", en: "Discipline test", pt: "Teste de disciplina", fr: "Test de discipline", de: "Disziplintest", it: "Test di disciplina" },
  { tecla: "c", ruta: "/herramientas", es: "Herramientas", en: "Tools", pt: "Ferramentas", fr: "Outils", de: "Tools", it: "Strumenti" },
  { tecla: "o", ruta: "/glosario", es: "Glosario", en: "Glossary", pt: "Glossário", fr: "Glossaire", de: "Glossar", it: "Glossario" },
  { tecla: "b", ruta: "/beta", es: "Acceso anticipado (Beta)", en: "Early access (Beta)", pt: "Acesso antecipado (Beta)", fr: "Accès anticipé (bêta)", de: "Früher Zugang (Beta)", it: "Accesso anticipato (Beta)" },
  { tecla: "u", ruta: "/traders/manual", es: "Operativa manual", en: "Manual trading", pt: "Trading manual", fr: "Trading manuel", de: "Manuelles Trading", it: "Trading manuale" },
  { tecla: "r", ruta: "/traders/prop-firms", es: "Prop firms", en: "Prop firms", pt: "Prop firms", fr: "Prop firms", de: "Prop-Firms", it: "Prop firms" },
];

/** Tecla → ruta, lo que consulta el teclado global al resolver la secuencia. */
export const G_NAV_MAP: Record<string, string> = Object.fromEntries(
  SALTOS_TECLADO.map((s) => [s.tecla, s.ruta]),
);
