"use client";

import { useLang } from "@/lib/i18n";
import { SelloPrevisto } from "@/components/tj/SelloPrevisto";

export function ProductStatus() {
  const { lang } = useLang();
  const es = lang === "es";
  /* Las tres columnas se marcan con una palabra en la misma voz. Antes eran
     un ✓ verde, un reloj y la palabra «Previsto»: tres dialectos para una
     sola escala, y el ojo leía el color del primero antes que su estado. */
  const rows = [
    { estado: es ? "Disponible" : "Available", previsto: false, title: es ? "Listo para probar" : "Ready to test", text: es ? "Demo navegable, métricas y diario local." : "Clickable demo, metrics and local journal." },
    { estado: es ? "Por invitación" : "By invitation", previsto: false, title: es ? "Piloto privado" : "Private pilot", text: es ? "Flujos de disciplina, riesgo y prop firm con usuarios invitados." : "Discipline, risk and prop-firm workflows with invited users." },
    { estado: "", previsto: true, title: es ? "Apertura comercial" : "Commercial launch", text: es ? "Entrega, licencia, soporte y precios definitivos." : "Delivery, licensing, support and final pricing." },
  ];
  return (
    <section className="section">
      <div className="tj-container">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="eyebrow">{es ? "Estado del producto" : "Product status"}</p>
            <h2 className="mt-5 t-h2 text-primary">
              {es ? (
                <>
                  Lo que está listo.{" "}
                  <span className="text-gradient tj-frase-nueva">Y lo que aún estamos comprobando.</span>
                </>
              ) : (
                <>
                  What is ready.{" "}
                  <span className="text-gradient tj-frase-nueva">And what we are still validating.</span>
                </>
              )}
            </h2>
          </div>
          <div data-orden className="grid gap-3 sm:grid-cols-3">
            {rows.map(({ estado, previsto, title, text }) => (
              <div key={title} className="border-t border-[rgb(var(--divider)/0.18)] pt-4">
                {previsto ? (
                  <SelloPrevisto es="Previsto" en="Planned" />
                ) : (
                  <span className="rotulo-estado">{estado}</span>
                )}
                <h3 className="mt-3 text-sm font-semibold text-primary">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-secondary">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/** Backwards-compatible export for internal imports while the public copy
 * moves from beta language to private early access. */
export const BetaStatus = ProductStatus;
