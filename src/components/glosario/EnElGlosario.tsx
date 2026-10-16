"use client";

import { Link } from "@/components/tj/LocaleLink";
import { useLang } from "@/lib/i18n";
import type { EnlaceTermino } from "@/lib/glosario";

/**
 * «En el glosario: …», una línea de enlaces a voces del glosario. Las voces
 * llegan calculadas del servidor para no traer el glosario al navegador.
 */
export function EnElGlosario({ terminos, className = "" }: { terminos: EnlaceTermino[]; className?: string }) {
  const { lang } = useLang();
  const es = lang === "es";
  if (terminos.length === 0) return null;

  return (
    /* Cada enlace crece 12 px arriba y abajo para el dedo (`-my-3 py-3`):
       24 px entre renglones, y quien la coloca deja otros 24 con lo de encima,
       para que no se pisen. Cada coma va pegada a su enlace: suelta, podía
       abrir renglón. */
    <p className={`medida m-0 flex flex-wrap items-baseline gap-x-1 gap-y-6 text-[14px] leading-[1.6] text-tertiary ${className}`}>
      <span>{es ? "En el glosario:" : "In the glossary:"}</span>
      {terminos.map((t, i) => (
        <span key={t.slug} className="whitespace-nowrap">
          <Link
            href={`/glosario/${t.slug}`}
            lang={es && t.nombreEs === t.nombreEn ? "en" : undefined}
            className="link-underline-host -my-3 inline-flex py-3 text-secondary transition-colors hover:text-primary"
          >
            <span className="link-underline">{es ? t.nombreEs : t.nombreEn}</span>
          </Link>
          {i < terminos.length - 1 && ","}
        </span>
      ))}
    </p>
  );
}
