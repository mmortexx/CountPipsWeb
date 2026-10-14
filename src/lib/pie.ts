import type { Lang } from "@/lib/locale";

export type EnlacePie = {
  label: string;
  href: string;
  /** Si es true, se pinta como disparador del glosario en vez de enlace. */
  glossary?: boolean;
};

export type ColumnaPie = { title: string; links: EnlacePie[] };

type Textos = Record<Lang, string>;

const igual = (texto: string): Textos => ({
  es: texto,
  en: texto,
  pt: texto,
  fr: texto,
  de: texto,
  it: texto,
});

/** Columnas del pie: título y rótulos por idioma, y el destino fijo de cada enlace. */
const COLUMNAS: {
  title: Textos;
  links: { label: Textos; href: string; glossary?: boolean }[];
}[] = [
  {
    title: { es: "Producto", en: "Product", pt: "Produto", fr: "Produit", de: "Produkt", it: "Prodotto" },
    links: [
      { label: { es: "Características", en: "Features", pt: "Funcionalidades", fr: "Fonctionnalités", de: "Funktionen", it: "Funzionalità" }, href: "/features" },
      { label: { es: "Demo", en: "Demo", pt: "Demo", fr: "Démo", de: "Demo", it: "Demo" }, href: "/demo" },
      { label: { es: "Precios", en: "Pricing", pt: "Preços", fr: "Tarifs", de: "Preise", it: "Prezzi" }, href: "/pricing" },
      { label: { es: "Operativa manual", en: "Manual trading", pt: "Trading manual", fr: "Trading manuel", de: "Manuelles Trading", it: "Trading manuale" }, href: "/traders/manual" },
      { label: { es: "Prop firms", en: "Prop firms", pt: "Prop firms", fr: "Prop firms", de: "Prop-Firms", it: "Prop firms" }, href: "/traders/prop-firms" },
      { label: { es: "Acceso anticipado", en: "Early access", pt: "Acesso antecipado", fr: "Accès anticipé", de: "Vorabzugang", it: "Accesso anticipato" }, href: "/beta" },
      { label: { es: "Novedades", en: "Changelog", pt: "Novidades", fr: "Nouveautés", de: "Changelog", it: "Novità" }, href: "/about#changelog" },
    ],
  },
  {
    title: { es: "Recursos", en: "Resources", pt: "Recursos", fr: "Ressources", de: "Ressourcen", it: "Risorse" },
    links: [
      { label: igual("FAQ"), href: "/faq" },
      { label: { es: "Glosario", en: "Glossary", pt: "Glossário", fr: "Glossaire", de: "Glossar", it: "Glossario" }, href: "/glosario" },
      { label: { es: "Herramientas", en: "Tools", pt: "Ferramentas", fr: "Outils", de: "Tools", it: "Strumenti" }, href: "/herramientas" },
      { label: { es: "Test de disciplina", en: "Discipline test", pt: "Teste de disciplina", fr: "Test de discipline", de: "Disziplintest", it: "Test di disciplina" }, href: "/test" },
    ],
  },
  {
    title: { es: "Empresa", en: "Company", pt: "Empresa", fr: "Entreprise", de: "Unternehmen", it: "Azienda" },
    links: [
      { label: { es: "Acerca de", en: "About", pt: "Sobre", fr: "À propos", de: "Über uns", it: "Chi siamo" }, href: "/about" },
      /* El único formulario de contacto vive en /faq, no en /about. */
      { label: { es: "Contacto", en: "Contact", pt: "Contato", fr: "Contact", de: "Kontakt", it: "Contatti" }, href: "/faq#contacto" },
    ],
  },
  {
    title: { es: "Legal", en: "Legal", pt: "Jurídico", fr: "Légal", de: "Rechtliches", it: "Legale" },
    links: [
      { label: { es: "Privacidad", en: "Privacy", pt: "Privacidade", fr: "Confidentialité", de: "Datenschutz", it: "Privacy" }, href: "/privacidad" },
      { label: { es: "Términos", en: "Terms", pt: "Termos", fr: "Conditions", de: "AGB", it: "Termini" }, href: "/terminos" },
      { label: igual("Cookies"), href: "/cookies" },
      { label: { es: "Aviso legal", en: "Legal notice", pt: "Aviso legal", fr: "Mentions légales", de: "Impressum", it: "Note legali" }, href: "/aviso-legal" },
    ],
  },
];

export function columnasPie(lang: Lang): ColumnaPie[] {
  return COLUMNAS.map((col) => ({
    title: col.title[lang],
    links: col.links.map(({ label, ...enlace }) => ({ ...enlace, label: label[lang] })),
  }));
}
