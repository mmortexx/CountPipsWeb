"use client";

import { useEffect } from "react";
import { Link } from "@/components/tj/LocaleLink";
import { useLang } from "@/lib/i18n";

/**
 * Root error boundary — must be a client component.
 * Receives `{ error, reset }` from Next.js. `reset()` re-renders the error
 * segment; the home link offers a hard exit back to the root route.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { lang } = useLang();
  const es = lang === "es";

  // Surface unexpected runtime errors to the console in dev/production for observability.
  useEffect(() => {
    console.error("Root error boundary caught:", error);
  }, [error]);

  return (
    <section
      aria-labelledby="error-heading"
      className="relative min-h-screen flex items-center justify-center overflow-clip px-5 py-20"
    >
      {/* Soft acrylic depth orb */}
      <div
        className="absolute top-1/4 -left-32 w-[440px] h-[440px] rounded-full blur-[130px] pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgb(var(--accent-base)), transparent 70%)",
          opacity: 0.16,
        }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-1/4 -right-32 w-[420px] h-[420px] rounded-full blur-[130px] pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgb(var(--pnl-neg) / 0.6), transparent 70%)",
          opacity: 0.12,
        }}
        aria-hidden="true"
      />

      <div className="relative z-[2] text-center max-w-xl mx-auto">
        <div
          className="tj-alza inline-flex items-center gap-2.5 px-3 py-1.5 rounded-[2px] tj-paper tj-paper-dense border border-[rgb(var(--divider)/0.16)] text-[12px] text-secondary mb-7"
        >
          <span className="relative flex w-1.5 h-1.5">
            <span className="absolute inline-flex w-full h-full rounded-full bg-pnl-neg opacity-60 animate-ping" />
            <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-pnl-neg" />
          </span>
          {es ? "Error en tiempo de ejecución" : "Runtime error"}
        </div>

        <h1
          id="error-heading"
          style={{ animationDelay: "0.1s" }}
          className="tj-alza text-3xl md:text-4xl font-semibold tracking-tight text-primary text-balance"
        >
          {es ? "Algo salió mal" : "Something went wrong"}
        </h1>

        <p
          style={{ animationDelay: "0.2s" }}
          className="tj-alza mt-4 text-base md:text-lg text-secondary leading-relaxed"
        >
          {es
            ? "Se produjo un error inesperado. Puedes intentar de nuevo o volver al inicio."
            : "An unexpected error occurred. You can try again or head back home."}
        </p>

        {/* Discrete digest for support / debugging */}
        {error?.digest ? (
          <p
            style={{ animationDelay: "0.3s" }}
            className="tj-alza mt-3 text-[11px] uppercase tracking-[0.15em] text-tertiary tnum"
          >
            {es ? "Referencia" : "Reference"}: {error.digest}
          </p>
        ) : null}

        <div
          style={{ animationDelay: "0.35s" }}
          className="tj-alza mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <div className="tj-pulsa inline-flex">
            <button
              type="button"
              onClick={reset}
              /* `group` + `min-h-[44px]`: el icono llevaba
                 `group-hover:-rotate-45` sin ningún padre `group`, así que
                 nunca rotaba; y con `py-2` el botón medía ~36 px, por
                 debajo del objetivo táctil de 44 px que exige R2 en
                 cualquier control interactivo. */
              className="group inline-flex min-h-[44px] items-center bg-[rgb(var(--accent-base))] text-[rgb(var(--accent-ink))] px-6 rounded-[2px] text-sm font-semibold hover:bg-[rgb(var(--accent-hover))] transition-[background-color,box-shadow] hover:shadow-[0_12px_32px_-8px_rgb(var(--accent-base)/0.7)]"
            >
              <svg
                className="mr-2 transition-transform group-hover:-rotate-45"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2 8a6 6 0 1 0 1.76-4.24M2 3v3h3"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {es ? "Reintentar" : "Try again"}
            </button>
          </div>
          <div className="tj-pulsa inline-flex">
            <Link
              href="/"
              className="tj-paper tj-paper-dense inline-flex min-h-[44px] items-center border border-[rgb(var(--divider)/0.20)] text-primary px-8 rounded-[2px] font-medium hover:bg-[rgb(var(--accent-base))] hover:text-[rgb(var(--accent-ink))] transition-[background-color,color,transform] hover:-translate-y-0.5"
            >
              {es ? "Volver al inicio" : "Back to home"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
