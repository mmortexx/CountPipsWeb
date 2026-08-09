"use client";

import { useLang } from "@/lib/i18n";
import { ProductPlate } from "@/components/tj/ProductPlate";
import { LAMINAS_PRODUCTO } from "@/lib/laminas";
import { Link } from "@/components/tj/LocaleLink";

/**
 * ProductShowcase — la sección donde la portada, por fin, enseña el producto.
 *
 * ── El sitio que ocupa ────────────────────────────────────────────────
 * Va justo después de la banda de cifras y antes de la primera lámina
 * dibujada. Es el punto exacto en que el visitante acaba de leer una
 * promesa («opera como una mesa institucional») y todavía no ha visto
 * nada que la sostenga. Ponerla más abajo la deja fuera del alcance de
 * quien decide en diez segundos, que es la mayoría del tráfico frío.
 *
 * ── Por qué DOS capturas y no una galería ─────────────────────────────
 * Ya hubo una galería y se retiró (commit 3608d0d): seis recortes
 * pequeños parecen estar tapando que hay poco. Una pantalla completa a
 * densidad real demuestra lo contrario.
 *
 * Pero una sola tampoco basta, y por un motivo que no es estético: la
 * primera enseña lo que el programa MUESTRA y la segunda, lo que el
 * programa COMPRUEBA. Sin la segunda, un visitante que ya ha visto veinte
 * journals no tiene forma de distinguir éste — todos enseñan una curva y
 * un calendario. La analítica con sus intervalos de confianza y su tabla
 * por periodos es la que no tiene ningún otro.
 *
 * (Aquí ponía «la segunda lámina vive en /demo». No era cierto: /demo no
 * monta ninguna lámina de producto, así que `LAMINAS_PRODUCTO.analitica`
 * llevaba desde el primer día definida y sin que la usara nadie. Una
 * afirmación en un comentario tiene la misma vida útil que el código que
 * describe, y ésta ya estaba muerta cuando se escribió.)
 */
export function ProductShowcase() {
  const { lang } = useLang();
  const es = lang === "es";

  return (
    <section
      id="producto"
      className="section border-b border-[rgb(var(--divider)/0.1)]"
      aria-labelledby="producto-titulo"
    >
      <div className="mx-auto w-[var(--page-w)]">
        <header className="mb-8 max-w-[52ch]">
          <p className="t-label mb-3 text-tertiary">
            {es ? "§ 02 — El programa" : "§ 02 — The application"}
          </p>
          <h2 id="producto-titulo" className="t-h2 mb-4">
            {es ? "Esto es lo que abres cada mañana." : "This is what you open every morning."}
          </h2>
          <p className="t-body text-secondary">
            {es
              ? "No es una ilustración ni un vídeo: es la ventana del programa, con datos de muestra. " +
                "La misma que puedes recorrer entera en la demo, sin registro y sin instalar nada."
              : "Not an illustration and not a video: it is the application window, with sample data. " +
                "The same one you can walk through in the demo, with no sign-up and nothing to install."}
          </p>
        </header>

        <ProductPlate lamina={LAMINAS_PRODUCTO.resumen} priority />

        {/* La segunda va perezosa a propósito: está por debajo del pliegue
            en cualquier pantalla, y adelantarla competiría por el ancho de
            banda con la primera, que sí decide si el visitante sigue. */}
        <div className="mt-12">
          <ProductPlate lamina={LAMINAS_PRODUCTO.analitica} />
        </div>

        <p className="mt-7 text-[13.5px]">
          <Link
            href="/demo"
            className="text-primary underline decoration-[rgb(var(--divider)/0.4)] underline-offset-4 transition-colors hover:decoration-[rgb(var(--accent-base)/0.7)]"
          >
            {es ? "Recorrer la demo interactiva" : "Walk through the interactive demo"} →
          </Link>
        </p>
      </div>
    </section>
  );
}
