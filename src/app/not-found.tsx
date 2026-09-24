import type { Metadata } from "next";
import { NotFoundClient } from "@/components/tj/NotFoundClient";

/**
 * `not-found.tsx` es el único punto del árbol de rutas donde compensa que
 * exista un componente de servidor separado del de cliente: es la única
 * página cuyos metadatos NO deben ser los que hereda de `layout.tsx`.
 *
 * ── Los fallos que había, comprobados sobre el HTML exportado ─────────
 * Como este fichero no exportaba sus propios metadatos, heredaba TODO lo
 * del layout raíz: el `robots: { index: true, follow: true }` que
 * contradecía al `noindex` que Next inyecta por su cuenta en toda 404, la
 * canónica apuntando a la portada, y la tarjeta de compartir (título,
 * descripción y dirección) con la identidad de la portada. Cuatro señales
 * distintas, y las cuatro decían lo mismo: que esta página ES la portada.
 *
 * Lo de `robots` se queda a medio resolver y es correcto que así sea:
 * Next sigue emitiendo su propio `<meta name="robots" content="noindex">`
 * en toda página 404 exportada, sin que la API de metadatos pueda
 * suprimirlo — es una protección de la propia herramienta. El de aquí se
 * suma, no contradice: las dos etiquetas dicen «no indexar», así que ya
 * no hay instrucciones opuestas en el documento, solo una redundante que
 * no depende de este fichero.
 *
 * El resto SÍ se puede fijar del todo, y se fija: `alternates.canonical`
 * pasa a `undefined` explícito —así se ANULA lo heredado en vez de que el
 * campo se mezcle con el del padre, que es como Next combina objetos de
 * metadatos por defecto— y `openGraph`/`twitter` llevan su propio título,
 * descripción y dirección. Compartir el enlace de una 404 ya no enseña la
 * tarjeta de la portada.
 *
 * Antes esto era imposible de arreglar sin mover el componente: el
 * fichero llevaba `"use client"` arriba porque usa `useState` y
 * `useRouter`, y una directiva de cliente impide exportar `metadata`. El
 * componente pasó tal cual a `src/components/tj/NotFoundClient.tsx`.
 */
export const metadata: Metadata = {
  title: "404",
  description:
    "Esta página no existe, se ha movido o nunca estuvo publicada.",
  robots: { index: false, follow: true },
  alternates: { canonical: undefined },
  /* Idioma con el que se compila `404.html`: lo lee `LanguageProvider` al
     hidratar. Va en <head> porque el cuerpo aún puede estar a medio leer. */
  other: { "tj-idioma-compilado": "es" },
  openGraph: {
    title: "Página no encontrada — CountPips",
    description: "Esta dirección no existe, se ha movido o nunca estuvo publicada.",
    url: undefined,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Página no encontrada — CountPips",
    description: "Esta dirección no existe, se ha movido o nunca estuvo publicada.",
  },
};

export default function NotFound() {
  return <NotFoundClient />;
}
