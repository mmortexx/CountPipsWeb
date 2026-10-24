"use client";

import { useLang } from "@/lib/i18n";

const TEXTOS = {
  formulario: {
    es: "El formulario necesita JavaScript para enviarse. Actívalo en el navegador y recarga la página.",
    en: "The form needs JavaScript to be sent. Turn it on in your browser and reload the page.",
  },
  test: {
    es: "El test se responde en el navegador y necesita JavaScript. Actívalo y recarga la página.",
    en: "The test runs in your browser and needs JavaScript. Turn it on and reload the page.",
  },
  demo: {
    es: "La demo se ejecuta en el navegador y necesita JavaScript. Actívalo y recarga la página.",
    en: "The demo runs in your browser and needs JavaScript. Turn it on and reload the page.",
  },
} as const;

/** Lo que ve quien llega sin JavaScript a una página que no funciona sin él; `humo.mjs` lo comprueba. */
export function SinJavaScript({ que }: { que: keyof typeof TEXTOS }) {
  const { lang } = useLang();
  return (
    <noscript>
      <p data-sin-js className="tj-container medida text-secondary leading-[1.6]">
        {lang === "es" ? TEXTOS[que].es : TEXTOS[que].en}
      </p>
    </noscript>
  );
}
