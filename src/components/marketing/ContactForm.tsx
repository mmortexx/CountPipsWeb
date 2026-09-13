"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";

import { useLang } from "@/lib/i18n";
import { Eyebrow } from "@/components/tj/Eyebrow";
import { Reveal } from "@/components/tj/Reveal";
import { submitForm, SUPPORT_EMAIL, type SubmitFailure } from "@/lib/forms";
import { useHydrated } from "@/hooks/use-hydrated";

/**
 * ContactForm — compact contact form (ES/EN) wired to a real endpoint.
 *
 * Behaviour:
 *  - Three controlled fields: name, email, message (textarea).
 *  - Client-side validation: required fields + simple email regex.
 *      On error, a small helper line lists the offending fields.
 *  - On submit the message is POSTed through `@/lib/forms` (Web3Forms) and
 *    lands in the support inbox. The success state is only shown once the
 *    endpoint confirms delivery — a failed send shows the reason plus a
 *    mailto fallback, never a fake checkmark.
 *  - On success: la confirmación entra por partes — el disco se estampa,
 *    la marca de verificación se dibuja encima y el texto sube detrás,
 *    con animaciones CSS y sin biblioteca. Ver el comentario largo junto
 *    al bloque, que explica qué se conservó y qué se dejó ir.
 *
 * Estilo: lámina de papel a canto vivo, entradas como en el resto de la
 * web (relleno `rgb(var(--divider)/0.05)` + filete `rgb(var(--divider)/0.10)`,
 * foco en el acento). Sin más color que el del sistema.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = "idle" | "sending" | "sent";

/** Copy por tipo de fallo. El usuario necesita saber si reintentar o escribir directo. */
function failureCopy(reason: SubmitFailure, es: boolean): string {
  switch (reason) {
    case "network":
      return es
        ? "No hemos podido conectar. Revisa tu conexión e inténtalo de nuevo."
        : "We couldn't connect. Check your connection and try again.";
    case "unconfigured":
    case "rejected":
      return es
        ? "El envío ha fallado por un problema nuestro. Escríbenos directamente:"
        : "The send failed on our side. Email us directly:";
  }
}

/* Aquí ponía «Te respondemos en menos de 24 h» y «Te responderemos en
   24h». Es un compromiso de servicio que este proyecto YA había decidido
   retirar —está escrito en `ContactSupport.tsx`, la tarjeta que vive en
   la misma sección de la misma página— porque no hay nadie detrás que
   pueda cumplirlo hoy. La decisión se aplicó a un componente y se olvidó
   el de al lado, así que la página prometía las dos cosas a la vez. */
export function ContactForm() {
  const { lang } = useLang();
  const es = lang === "es";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [botcheck, setBotcheck] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  /** Cuando el fallo es nuestro, ofrecemos el buzón de soporte como salida. */
  const [showFallback, setShowFallback] = useState(false);
  /** Qué campo concreto está mal, para marcarlo sólo a él. */
  const [invalidos, setInvalidos] = useState({ name: false, email: false, message: false });
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  /**
   * El envío depende por completo de JS: el <form> no tiene `action`, así que
   * un submit nativo (antes de hidratar, o con JS caído) recargaría la página
   * y perdería el mensaje sin avisar. El botón sigue deshabilitado hasta que
   * React puede interceptar el submit.
   */
  const ready = useHydrated();

  const sent = status === "sent";
  const sending = status === "sending";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sent || sending) return;

    /* ── QUÉ CAMPO FALLA, Y NO «ALGO FALLA» ────────────────────────────
       Antes esto sólo componía un texto de aviso y salía. Los tres
       campos llevaban `aria-invalid={!!error}`, es decir, el MISMO
       valor: si sólo el correo estaba mal, un lector de pantalla
       anunciaba también el nombre y el mensaje como erróneos. Y no se
       movía el foco a ninguna parte, así que quien navega con teclado
       se quedaba donde estaba, con un aviso arriba que quizá ni veía.

       Es un incumplimiento de WCAG 3.3.1 (identificar el error) en el
       mismo proyecto donde el formulario de acceso anticipado sí lo
       cumple — dos criterios distintos para lo mismo. Ahora se marca
       campo a campo y el foco viaja al primero que falla. */
    const fallan = {
      name: !name.trim(),
      email: !email.trim() || !EMAIL_RE.test(email.trim()),
      message: !message.trim(),
    };
    const missing: string[] = [];
    if (fallan.name) missing.push(es ? "nombre" : "name");
    if (fallan.email) missing.push(es ? "email válido" : "valid email");
    if (fallan.message) missing.push(es ? "mensaje" : "message");

    if (missing.length) {
      setShowFallback(false);
      setInvalidos(fallan);
      setError(
        es
          ? `Revisa: ${missing.join(", ")}.`
          : `Please check: ${missing.join(", ")}.`
      );
      const primero = fallan.name
        ? nameRef.current
        : fallan.email
          ? emailRef.current
          : messageRef.current;
      primero?.focus();
      return;
    }

    setInvalidos({ name: false, email: false, message: false });
    setError(null);
    setShowFallback(false);
    setStatus("sending");

    const result = await submitForm({
      subject: es
        ? `Nuevo mensaje de ${name.trim()} — CountPips`
        : `New message from ${name.trim()} — CountPips`,
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      botcheck,
    });

    if (result.ok) {
      setStatus("sent");
      return;
    }

    // Vuelta a "idle": el formulario sigue relleno para que se pueda
    // reintentar sin volver a escribirlo todo.
    setStatus("idle");
    setError(failureCopy(result.reason, es));
    setShowFallback(result.reason !== "network");
  }

  return (
    <section
      id="contacto"
      aria-label={es ? "Formulario de contacto" : "Contact form"}
      className="section-tight relative overflow-clip scroll-mt-24"
    >
      <div className="relative tj-container">
        <div className="max-w-xl mx-auto">
          <Reveal>
            <div className="flex justify-center">
              <Eyebrow>{es ? "Escríbenos" : "Send a message"}</Eyebrow>
            </div>
          </Reveal>
          <Reveal delay={0.06}>
            <h2
              className="mt-5 text-center t-h2 text-primary"
            >
              {es ? (
                <>
                  Envía un <span className="text-gradient">mensaje</span>
                </>
              ) : (
                <>
                  Send a <span className="text-gradient">message</span>
                </>
              )}
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-3 text-center text-secondary text-sm leading-relaxed">
              {es
                ? "Cuéntanos qué necesitas. Contesta quien lo desarrolla."
                : "Tell us what you need. The person who builds it replies."}
            </p>
          </Reveal>

          <Reveal delay={0.14} y={20}>
            {/* El formulario se apoya en una lámina de papel: es un objeto que
                se rellena, no un dato tabular, así que conserva material
                propio. */}
            <div className="tj-paper rounded-[2px] border border-[rgb(var(--divider)/0.13)] p-6 relative overflow-hidden mt-8">
              {/* min-height keeps layout stable when the form swaps to the
                  success state, so the card doesn't collapse on submit. */}
              <div className="min-h-[360px] flex flex-col justify-center">
                {/* AQUÍ HABÍA UN `AnimatePresence`, Y LO QUE HACÍA SE
                    CONSERVA MENOS UNA COSA.
                    Se conserva la coreografía de la confirmación: el
                    disco se estampa, la marca se dibuja encima y el
                    texto sube detrás, con los mismos retardos (0 / 0,25
                    / 0,55 s). Se conserva porque son animaciones de
                    ENTRADA, y una entrada no necesita biblioteca: basta
                    con que la clase esté puesta cuando el elemento se
                    monta.

                    Lo que se pierde es el fundido de SALIDA del
                    formulario, de 0,25 s. Eso sí necesita mantener vivo
                    en el árbol un elemento que React ya ha quitado, que
                    es exactamente el problema que `AnimatePresence`
                    existe para resolver — y la única razón por la que
                    esta página descargaba framer-motion entera (36 KB
                    comprimidos). Cambiar un cuarto de segundo de
                    desvanecido, en un formulario que se envía una vez,
                    por 36 KB en cada visita a /faq es un cambio que se
                    hace sin pensarlo mucho. */}
                {sent ? (
                    <div className="tj-sube-ya flex flex-col items-center gap-4 py-8 text-center">
                      <svg
                        width="64"
                        height="64"
                        viewBox="0 0 64 64"
                        fill="none"
                        aria-hidden="true"
                      >
                        {/* `pathLength="1"` normaliza el recorrido del
                            trazo a la unidad para que `stroke-dasharray:
                            1` funcione sin medir su longitud real en
                            píxeles. Ver `tj-dibuja` en globals.css. */}
                        <circle
                          className="tj-estampa-ya"
                          cx="32"
                          cy="32"
                          r="28"
                          stroke="rgb(var(--sig-green))"
                          strokeWidth="2"
                          fill="rgb(var(--sig-green) / 0.10)"
                        />
                        <path
                          className="tj-dibuja-ya"
                          pathLength="1"
                          d="M20 33.5l8 8 16-18"
                          stroke="rgb(var(--sig-green))"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          fill="none"
                        />
                      </svg>
                      <p
                        className="tj-sube-ya-tarde text-base font-medium text-primary"
                        aria-live="polite"
                        role="status"
                      >
                        {es
                          ? "✓ Mensaje enviado. Te contestamos en cuanto lo veamos."
                          : "✓ Message sent. We'll reply as soon as we see it."}
                      </p>
                    </div>
                  ) : (
                    <form
                      onSubmit={onSubmit}
                      noValidate
                      className="flex flex-col gap-4"
                    >
                      <Field label={es ? "Nombre" : "Name"} htmlFor="cf-name">
                        <input
                          id="cf-name"
                          ref={nameRef}
                          type="text"
                          autoComplete="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder={es ? "Tu nombre" : "Your name"}
                          aria-label={es ? "Nombre" : "Name"}
                          aria-invalid={invalidos.name || undefined}
                          aria-describedby={error ? "cf-error" : undefined}
                          required
                          className="w-full bg-[rgb(var(--divider)/0.06)] border border-[rgb(var(--divider)/0.22)] border-b-[rgb(var(--divider)/0.62)] rounded-[2px] h-11 px-3 text-base sm:text-sm text-primary placeholder:text-tertiary outline-none transition-[border-color,box-shadow,background-color] duration-200 hover:border-[rgb(var(--divider)/0.38)] focus-visible:border-[rgb(var(--accent-base)/0.50)] focus-visible:bg-[rgb(var(--divider)/0.07)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.20)] focus-visible:ring-offset-0 aria-invalid:border-[rgb(var(--pnl-neg)/0.50)] aria-invalid:hover:border-[rgb(var(--pnl-neg)/0.65)] aria-invalid:focus-visible:border-[rgb(var(--pnl-neg)/0.70)] aria-invalid:focus-visible:ring-[rgb(var(--pnl-neg)/0.18)]"
                        />
                      </Field>
                      <Field label={es ? "Email" : "Email"} htmlFor="cf-email">
                        <input
                          id="cf-email"
                          ref={emailRef}
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={es ? "tu@email.com" : "you@email.com"}
                          aria-label={es ? "Email" : "Email"}
                          aria-invalid={invalidos.email || undefined}
                          aria-describedby={error ? "cf-error" : undefined}
                          required
                          className="w-full bg-[rgb(var(--divider)/0.06)] border border-[rgb(var(--divider)/0.22)] border-b-[rgb(var(--divider)/0.62)] rounded-[2px] h-11 px-3 text-base sm:text-sm text-primary placeholder:text-tertiary outline-none transition-[border-color,box-shadow,background-color] duration-200 hover:border-[rgb(var(--divider)/0.38)] focus-visible:border-[rgb(var(--accent-base)/0.50)] focus-visible:bg-[rgb(var(--divider)/0.07)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.20)] focus-visible:ring-offset-0 aria-invalid:border-[rgb(var(--pnl-neg)/0.50)] aria-invalid:hover:border-[rgb(var(--pnl-neg)/0.65)] aria-invalid:focus-visible:border-[rgb(var(--pnl-neg)/0.70)] aria-invalid:focus-visible:ring-[rgb(var(--pnl-neg)/0.18)]"
                        />
                      </Field>
                      <Field label={es ? "Mensaje" : "Message"} htmlFor="cf-msg">
                        <textarea
                          id="cf-msg"
                          ref={messageRef}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder={es ? "¿En qué podemos ayudarte?" : "How can we help?"}
                          aria-label={es ? "Mensaje" : "Message"}
                          aria-invalid={invalidos.message || undefined}
                          aria-describedby={error ? "cf-error" : undefined}
                          required
                          rows={4}
                          className="w-full bg-[rgb(var(--divider)/0.06)] border border-[rgb(var(--divider)/0.22)] border-b-[rgb(var(--divider)/0.62)] rounded-[2px] px-3 py-2.5 text-base sm:text-sm text-primary placeholder:text-tertiary outline-none transition-[border-color,box-shadow,background-color] duration-200 hover:border-[rgb(var(--divider)/0.38)] focus-visible:border-[rgb(var(--accent-base)/0.50)] focus-visible:bg-[rgb(var(--divider)/0.07)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.20)] focus-visible:ring-offset-0 resize-y min-h-[112px] aria-invalid:border-[rgb(var(--pnl-neg)/0.50)] aria-invalid:hover:border-[rgb(var(--pnl-neg)/0.65)] aria-invalid:focus-visible:border-[rgb(var(--pnl-neg)/0.70)] aria-invalid:focus-visible:ring-[rgb(var(--pnl-neg)/0.18)]"
                        />
                      </Field>

                      {/* Honeypot — invisible para personas, tentador para bots.
                          Si llega relleno, Web3Forms descarta el envío. No usa
                          `display:none` porque algunos bots ignoran esos campos. */}
                      <div aria-hidden="true" className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
                        <label htmlFor="cf-botcheck">
                          {es ? "No rellenar" : "Do not fill"}
                          <input
                            id="cf-botcheck"
                            type="text"
                            name="botcheck"
                            tabIndex={-1}
                            autoComplete="off"
                            value={botcheck}
                            onChange={(e) => setBotcheck(e.target.value)}
                          />
                        </label>
                      </div>

                      {error && (
                          <div
                            id="cf-error"
                            className="tj-sube-ya text-xs text-pnl-neg"
                            role="alert"
                          >
                            {error}
                            {showFallback && (
                              <>
                                {" "}
                                <a
                                  href={`mailto:${SUPPORT_EMAIL}`}
                                  className="underline underline-offset-2 hover:text-[rgb(var(--accent-base))] transition-colors"
                                >
                                  {SUPPORT_EMAIL}
                                </a>
                              </>
                            )}
                          </div>
                        )}

                      <button
                        type="submit"
                        disabled={sending || !ready}
                        aria-busy={sending}
                        /* T2g — `min-h-[44px]` guarantees the ≥44 px touch target
                           regardless of label line-height; the previous `py-2.5`
                           alone produced a 40 px button on mobile (real touch-target
                           fix, same class of bug as T2d's Guardian buttons).
                           `w-full sm:w-fit sm:min-w-[180px]` makes the button
                           auto-width on tablet/desktop (≤260 px content) instead
                           of stretching as a full-width bar; on mobile it stays
                           full-width inside the max-w-xl card so it reads as the
                           primary action. Text color kept as #1A1917 (always-dark
                           ink on the medium-lightness gold accent fill — clears
                           AA in both themes; matches the Waitlist + Download CTA
                           treatment). */
                        className="w-full sm:w-fit sm:min-w-[180px] inline-flex items-center justify-center gap-2 min-h-[44px] bg-[rgb(var(--accent-base))] text-[rgb(var(--accent-ink))] px-6 py-2.5 rounded-[2px] text-sm font-semibold transition-[background-color,transform,opacity] duration-200 hover:bg-[rgb(var(--accent-hover))] hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.6)] focus-visible:ring-offset-2 focus-visible:ring-offset-transparent disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                      >
                        {sending
                          ? es ? "Enviando…" : "Sending…"
                          : es ? "Enviar" : "Send"}
                      </button>

                      <p className="text-[12px] text-tertiary text-center">
                        {es
                          ? "No compartimos tu email. Solo te respondemos."
                          : "We never share your email. We only reply to you."}
                      </p>
                    </form>
                  )}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: ReactNode;
}) {
  return (
    <div className="group flex flex-col gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-[12px] uppercase tracking-[0.14em] text-tertiary font-semibold transition-colors duration-200 group-focus-within:text-[rgb(var(--accent-base))]"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
