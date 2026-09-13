"use client";

import { Link } from "@/components/tj/LocaleLink";
import { useLang } from "@/lib/i18n";

export function BetaDetails() {
  const { lang } = useLang();
  const es = lang === "es";
  return (
    <section
      className="section"
    >
      <div className="tj-container grid gap-5 md:grid-cols-2">
        <article className="border-t border-[rgb(var(--divider)/0.18)] pt-5">
          <p className="eyebrow">{es ? "Precios de lanzamiento" : "Launch pricing"}</p>
          <h2 className="mt-4 t-h3 text-primary">Core $149 · Pro $249</h2>
          <p className="mt-3 text-secondary">{es ? "Son referencias de lanzamiento. La compra se abrirá cuando la entrega comercial, la licencia y el soporte estén listos; este formulario no es una preventa." : "These are launch references. Purchase opens when commercial delivery, licensing and support are ready; this form is not a pre-order."}</p>
          <Link href="/pricing" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline underline-offset-4">{es ? "Ver el detalle previsto" : "See planned details"}</Link>
        </article>
        <article className="border-t border-[rgb(var(--divider)/0.18)] pt-5">
          <p className="eyebrow">{es ? "Preguntas" : "Questions"}</p>
          <h2 className="mt-4 t-h3 text-primary">{es ? "¿Quieres saber algo antes?" : "Want to know something first?"}</h2>
          <p className="mt-3 text-secondary">{es ? "La FAQ explica privacidad, compatibilidad e importación. Si falta una respuesta, escríbenos." : "The FAQ covers privacy, compatibility and imports. If an answer is missing, write to us."}</p>
          <Link href="/faq" className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-primary underline underline-offset-4">{es ? "Abrir la FAQ" : "Open the FAQ"}</Link>
        </article>
      </div>
    </section>
  );
}

export function BetaApplicationNote() {
  const { lang } = useLang();
  const es = lang === "es";
  return (
    <p className="mx-auto mt-5 max-w-2xl text-center text-xs leading-relaxed text-tertiary">
      {es
        ? "La solicitud no es una compra ni garantiza una invitación. Se revisa por perfil y fase del producto; puedes pedir la eliminación de tus datos en cualquier momento."
        : "The application is not a purchase and does not guarantee an invitation. We review by profile and product phase; you can request deletion of your data at any time."}
    </p>
  );
}
