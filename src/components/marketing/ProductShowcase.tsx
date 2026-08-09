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
 * ── Por qué una sola captura y no una galería ─────────────────────────
 * Ya hubo una galería y se retiró (commit 3608d0d). Una sola pantalla
 * completa, a densidad real, demuestra que el programa aguanta trabajo de
 * verdad; una galería de seis recortes parece que se está tapando que hay
 * poco. La segunda lámina vive en /demo, donde el visitante ya ha
 * decidido mirar en serio.
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

        <ProductPlate lamina={LAMINAS_PRODUCTO.resumen} />

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
