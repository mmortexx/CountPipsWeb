"use client";

import { Check, Clock3 } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { SelloPrevisto } from "@/components/tj/SelloPrevisto";

export function ProductStatus() {
  const { lang } = useLang();
  const es = lang === "es";
  const rows = [
    { icon: Check, tone: "text-[rgb(var(--pnl-pos))]", title: es ? "Listo para probar" : "Ready to test", text: es ? "Demo navegable, métricas y diario local." : "Clickable demo, metrics and local journal." },
    { icon: Clock3, tone: "text-[rgb(var(--accent-base))]", title: es ? "Piloto privado" : "Private pilot", text: es ? "Flujos de disciplina, riesgo y prop firm con usuarios invitados." : "Discipline, risk and prop-firm workflows with invited users." },
    /* La tercera fila llevaba un `Circle` gris, que es un icono que no
       significa nada — un círculo vacío puede leerse como "pendiente",
       como "opcional" o como un radio button sin marcar. Lleva el sello,
       que es la pieza con la que este sitio dice «previsto» en todas
       partes: aquí, en el precio y en el registro de versiones. */
    { icon: null, tone: "", title: es ? "Apertura comercial" : "Commercial launch", text: es ? "Entrega, licencia, soporte y precios definitivos." : "Delivery, licensing, support and final pricing." },
  ];
  return (
    <section className="section bg-veil">
      <div className="tj-container">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="eyebrow">{es ? "Estado del producto" : "Product status"}</p>
            <h2 className="mt-5 t-h2 text-primary">{es ? "Lo que está listo. Y lo que aún estamos comprobando." : "What is ready. And what we are still validating."}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {rows.map(({ icon: Icon, tone, title, text }) => (
              <div key={title} className="border-t border-[rgb(var(--divider)/0.18)] pt-4">
                {Icon ? (
                  <Icon size={17} className={tone} aria-hidden />
                ) : (
                  <SelloPrevisto es="Previsto" en="Planned" />
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
