"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

import { useLang } from "@/lib/i18n";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { Reveal } from "@/components/tj/Reveal";
import { submitForm, SUPPORT_EMAIL, type SubmitFailure } from "@/lib/forms";
import { useHydrated } from "@/hooks/use-hydrated";

/**
 * Formulario de contacto (ES/EN) con tres campos (nombre, email, mensaje),
 * validación en cliente y envío por `@/lib/forms` (Web3Forms) al buzón de
 * soporte. La confirmación solo sale cuando el endpoint confirma la entrega;
 * si falla, se muestra el motivo y un `mailto` de reserva.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = "idle" | "sending" | "sent";

/** Texto por tipo de fallo: reintentar o escribir directo. */
function failureCopy(reason: SubmitFailure, es: boolean): string {
  switch (reason) {
    case "network":
      return es
        ? "No hemos podido conectar. Revisa tu conexión e inténtalo de nuevo."
        : "We couldn’t connect. Check your connection and try again.";
    case "unconfigured":
    case "rejected":
      return es
        ? SUPPORT_EMAIL ? "El envío ha fallado por un problema nuestro. Escríbenos directamente:" : "El envío ha fallado por un problema nuestro. Inténtalo de nuevo en unos minutos."
        : SUPPORT_EMAIL ? "The send failed on our side. Email us directly:" : "The send failed on our side. Please try again in a few minutes.";
  }
}

/* Sin plazo de respuesta prometido: hoy nadie puede cumplirlo. */
export function ContactForm() {
  const { lang } = useLang();
  const es = lang === "es";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [botcheck, setBotcheck] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  /** Si el fallo es nuestro, se ofrece el buzón de soporte como salida. */
  const [showFallback, setShowFallback] = useState(false);
  /** Qué campo concreto está mal, para marcarlo solo a él. */
  const [invalidos, setInvalidos] = useState({ name: false, email: false, message: false });
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  /**
   * El <form> no tiene `action`: un submit nativo (antes de hidratar o sin JS)
   * recargaría la página y perdería el mensaje. El botón queda deshabilitado
   * hasta que React puede interceptar el submit.
   */
  const ready = useHydrated();

  const sent = status === "sent";
  /* Al enviar se desmonta el `<form>` con el botón enfocado: el foco se lleva
     a la confirmación (como en /beta) para que el lector sepa que salió. */
  const enviadoRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (sent) enviadoRef.current?.focus();
  }, [sent]);
  const sending = status === "sending";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sent || sending) return;

    /* Cada campo se marca por separado (`aria-invalid`, WCAG 3.3.1) y el foco
       viaja al primero que falla, como en el formulario de /beta. */
    const fallan = {
      name: !name.trim(),
      email: !email.trim() || !EMAIL_RE.test(email.trim()),
      message: !message.trim(),
    };
    if (fallan.name || fallan.email || fallan.message) {
      setShowFallback(false);
      setInvalidos(fallan);
      setError(
        es
          ? "Completa los campos marcados para enviar el mensaje."
          : "Complete the marked fields to send your message."
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

    // Vuelta a "idle" con el formulario relleno para poder reintentar.
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
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <SectionHeader
            etiqueta={es ? "Contacto" : "Contact"}
            titulo={es ? (
              <>¿No encuentras tu respuesta?</>
            ) : (
              <>Can’t find your answer?</>
            )}
            entradilla={es
              ? "Escríbenos. Contesta quien desarrolla CountPips, en español o en inglés."
              : "Write to us. The person who builds CountPips replies, in Spanish or English."}
          />

          <Reveal delay={0.14} y={20}>
            <div className="tj-ficha p-6 sm:p-9 relative overflow-hidden">
              <div className="min-h-[360px] flex flex-col justify-center">
                {sent ? (
                    <div ref={enviadoRef} tabIndex={-1} className="tj-sube-ya py-8 outline-none" role="status">
                      <p className="t-h4 m-0 text-primary">
                        {es ? "Mensaje enviado." : "Message sent."}
                      </p>
                      <p className="mt-2 mb-0 text-secondary leading-relaxed">
                        {es
                          ? "Te contestamos en cuanto lo veamos."
                          : "We’ll reply as soon as we see it."}
                      </p>
                    </div>
                  ) : (
                    <form
                      onSubmit={onSubmit}
                      noValidate
                      className="flex flex-col gap-4"
                    >
                      <Field label={es ? "Nombre" : "Name"} htmlFor="cf-name" error={invalidos.name ? (es ? "Escribe tu nombre." : "Enter your name.") : null}>
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
                          aria-describedby={invalidos.name ? "cf-name-error" : undefined}
                          required
                          className="tj-campo w-full h-12 px-3.5 text-base sm:text-sm text-primary placeholder:text-tertiary outline-none"
                        />
                      </Field>
                      <Field label={es ? "Email" : "Email"} htmlFor="cf-email" error={invalidos.email ? (es ? "Escribe un email válido." : "Enter a valid email.") : null}>
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
                          aria-describedby={invalidos.email ? "cf-email-error" : undefined}
                          required
                          className="tj-campo w-full h-12 px-3.5 text-base sm:text-sm text-primary placeholder:text-tertiary outline-none"
                        />
                      </Field>
                      <Field label={es ? "Mensaje" : "Message"} htmlFor="cf-msg" error={invalidos.message ? (es ? "Escribe tu mensaje." : "Write your message.") : null}>
                        <textarea
                          id="cf-msg"
                          ref={messageRef}
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder={es ? "¿En qué podemos ayudarte?" : "How can we help?"}
                          aria-label={es ? "Mensaje" : "Message"}
                          aria-invalid={invalidos.message || undefined}
                          aria-describedby={invalidos.message ? "cf-msg-error" : undefined}
                          required
                          rows={4}
                          className="tj-campo w-full px-3.5 py-3 text-base sm:text-sm text-primary placeholder:text-tertiary outline-none resize-y min-h-[112px]"
                        />
                      </Field>

                      {/* Honeypot: si llega relleno, Web3Forms descarta el envío. Sin
                          `display:none` (algunos bots ignoran esos campos) ni
                          `aria-hidden` (ocultar un campo enfocable incumple WCAG
                          4.1.2); su etiqueta pide a las personas dejarlo vacío. */}
                      <div className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
                        <label htmlFor="cf-botcheck">
                          {es ? "No rellenar" : "Leave this field blank"}
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
                            className="tj-sube-ya text-sm text-pnl-neg"
                            role="alert"
                          >
                            {error}
                            {showFallback && SUPPORT_EMAIL && (
                              <>
                                {" "}
                                <a
                                  href={`mailto:${SUPPORT_EMAIL}`}
                                  className="underline underline-offset-2 decoration-[color-mix(in_srgb,currentColor_40%,transparent)] transition-[text-decoration-color] hover:decoration-current"
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
                        /* Ancho completo en móvil y `sm:w-fit` desde tableta. */
                        className="cta cta--primario w-full sm:w-fit sm:min-w-[180px] disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {sending
                          ? es ? "Enviando…" : "Sending…"
                          : es ? "Enviar" : "Send"}
                      </button>

                      <p className="text-[12px] text-tertiary">
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

/* Etiqueta, campo y aviso con las medidas del formulario de /beta. */
function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error: string | null;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-primary">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="m-0 -mt-0.5 text-xs text-pnl-neg">
          {error}
        </p>
      ) : null}
    </div>
  );
}
