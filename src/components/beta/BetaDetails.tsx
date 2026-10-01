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
      <div className="tj-container tj-split grid gap-y-10 md:grid-cols-2 md:gap-x-10">
        <article className="border-t border-[var(--line-2)] pt-5">
          <p className="eyebrow">{es ? "Precios de lanzamiento" : "Launch pricing"}</p>
          <h2 className="mt-4 t-h3 text-primary">{es ? "Core 149\u00a0$ y Pro 249\u00a0$" : "Core $149 and Pro $249"}</h2>
          <p className="medida mt-3 leading-[1.7] text-secondary">{es ? "Son referencias de lanzamiento. La compra se abrirá cuando la entrega comercial, la licencia y el soporte estén listos; este formulario no es una preventa." : "These are indicative launch prices. Purchase opens when commercial delivery, licensing and support are ready; this form is not a pre-order."}</p>
          <Link href="/pricing" className="cta cta--secundario mt-3">{es ? "Ver el detalle previsto" : "See planned details"}</Link>
        </article>
        <article className="border-t border-[var(--line-2)] pt-5">
          <p className="eyebrow">{es ? "Preguntas frecuentes" : "FAQ"}</p>
          <h2 className="mt-4 t-h3 text-primary">{es ? "¿Quieres saber algo antes?" : "Want to know something first?"}</h2>
          <p className="medida mt-3 leading-[1.7] text-secondary">{es ? "La FAQ explica privacidad, compatibilidad e importación. Si falta una respuesta, escríbenos." : "The FAQ covers privacy, compatibility and imports. If an answer is missing, write to us."}</p>
          <Link href="/faq" className="cta cta--secundario mt-3">{es ? "Abrir la FAQ" : "Open the FAQ"}</Link>
        </article>
      </div>
    </section>
  );
}

export function BetaApplicationNote() {
  const { lang } = useLang();
  const es = lang === "es";
  return (
    <p className="medida mt-5 text-[13px] leading-[1.6] text-tertiary">
      {es
        ? "La solicitud no es una compra ni garantiza una invitación. Se revisa por perfil y fase del producto; puedes pedir la eliminación de tus datos en cualquier momento."
        : "The application is not a purchase and does not guarantee an invitation. We review by profile and product phase; you can request deletion of your data at any time."}
    </p>
  );
}
