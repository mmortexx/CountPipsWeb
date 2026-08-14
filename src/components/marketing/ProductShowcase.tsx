"use client";

import { useState } from "react";
import { useLang } from "@/lib/i18n";
import { ProductPlate } from "@/components/tj/ProductPlate";
import { LAMINAS_PRODUCTO } from "@/lib/laminas";
import { Link } from "@/components/tj/LocaleLink";

const PLATES_LIST = [
  { key: "resumen", num: "I", labelEs: "Resumen", labelEn: "Overview" },
  { key: "registro", num: "II", labelEs: "Registro", labelEn: "Logging" },
  { key: "guardian", num: "III", labelEs: "Guardián", labelEn: "Guardian" },
  { key: "operaciones", num: "IV", labelEs: "Operaciones", labelEn: "Trades" },
  { key: "analitica", num: "V", labelEs: "Analítica", labelEn: "Analytics" },
  { key: "playbooks", num: "VI", labelEs: "Playbooks", labelEn: "Playbooks" },
  { key: "diario", num: "VII", labelEs: "Diario", labelEn: "Journal" },
];

export function ProductShowcase() {
  const { lang } = useLang();
  const es = lang === "es";
  const [selectedKey, setSelectedKey] = useState<string>("resumen");

  const currentLamina = LAMINAS_PRODUCTO[selectedKey] ?? LAMINAS_PRODUCTO.resumen;

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

        {/* Selector interactivo de láminas */}
        <div className="flex flex-wrap items-center gap-1.5 mb-6 overflow-x-auto pb-2 no-scrollbar">
          {PLATES_LIST.map((p) => {
            const active = selectedKey === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setSelectedKey(p.key)}
                className={`h-8 px-3 rounded-[2px] text-xs font-mono transition-all flex items-center gap-1.5 ${
                  active
                    ? "bg-[rgb(var(--accent-base))] text-[rgb(var(--accent-ink))] font-bold shadow-sm"
                    : "border border-[rgb(var(--divider)/0.15)] bg-[rgb(var(--divider)/0.03)] text-secondary hover:text-primary hover:border-[rgb(var(--divider)/0.3)]"
                }`}
              >
                <span className="opacity-70">{p.num}.</span>
                <span>{es ? p.labelEs : p.labelEn}</span>
              </button>
            );
          })}
        </div>

        {/* Lámina activa */}
        <div key={selectedKey} className="transition-opacity duration-200">
          <ProductPlate lamina={currentLamina} priority />
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
