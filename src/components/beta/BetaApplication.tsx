"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { Link } from "@/components/tj/LocaleLink";
import { useHydrated } from "@/hooks/use-hydrated";
import { joinBetaApplication, type BetaApplicationData, type SubmitFailure } from "@/lib/forms";
import { trackEvent } from "@/lib/analytics";

type Profile = "manual" | "prop";
type Status = "idle" | "sending" | "error" | "success";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        "expired-callback": () => void;
        "error-callback": () => void;
      }) => string;
      reset: (widget?: string) => void;
    };
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const inputClass =
  "mt-2 min-h-12 w-full rounded-[2px] border border-[rgb(var(--divider)/0.18)] bg-[rgb(var(--divider)/0.05)] px-3.5 text-sm text-primary outline-none transition-colors placeholder:text-tertiary focus:border-[rgb(var(--accent-base)/0.62)] focus:ring-2 focus:ring-[rgb(var(--accent-base)/0.14)]";

/* WCAG 3.3.1 (identificación de errores): el resumen general en
   role="alert" dice que "algo falta", pero no cuál — quien usa lector de
   pantalla tenía que recorrer los 6 campos a ciegas. `aria-invalid` +
   `aria-describedby` identifican el campo exacto al llegar a él por
   teclado, sin disparar 6 alertas simultáneas y superpuestas. */
function fieldBorderClass(invalid: boolean) {
  return invalid
    ? "border-[rgb(var(--pnl-neg)/0.55)] focus:border-[rgb(var(--pnl-neg)/0.7)] focus:ring-[rgb(var(--pnl-neg)/0.14)]"
    : "";
}

function FieldError({ id, show, message }: { id: string; show: boolean; message: string }) {
  if (!show) return null;
  return (
    <p id={id} className="mt-1.5 text-xs text-pnl-neg">
      {message}
    </p>
  );
}

function failureCopy(reason: SubmitFailure, es: boolean) {
  if (reason === "network") {
    return es
      ? "No hemos podido conectar. Revisa tu conexión e inténtalo de nuevo."
      : "We couldn't connect. Check your connection and try again.";
  }
  return es
    ? "La solicitud no se ha podido guardar. Escríbenos a soporte@tradingjournal.app."
    : "The application could not be saved. Email soporte@tradingjournal.app.";
}

export function BetaApplication() {
  const { lang } = useLang();
  const es = lang === "es";
  const ready = useHydrated();
  const [profile, setProfile] = useState<Profile | "">("");
  const [email, setEmail] = useState("");
  const [experience, setExperience] = useState("");
  const [markets, setMarkets] = useState("");
  const [workflow, setWorkflow] = useState("");
  const [goal, setGoal] = useState("");
  const [notes, setNotes] = useState("");
  const [botcheck, setBotcheck] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstileRef = useRef<HTMLDivElement>(null);
  const [privacy, setPrivacy] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const startedRef = useRef(false);
  const profileRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const experienceRef = useRef<HTMLSelectElement>(null);
  const marketsRef = useRef<HTMLInputElement>(null);
  const workflowRef = useRef<HTMLSelectElement>(null);
  const goalRef = useRef<HTMLSelectElement>(null);
  const privacyRef = useRef<HTMLInputElement>(null);
  /* El aviso de error recibe el foco cuando lo que falla no es un campo
     —hoy sólo el caso de la verificación anti-bot—, para que el mensaje
     que explica la salida sea lo siguiente que se lee. `tabIndex={-1}`
     lo hace enfocable por código sin meterlo en el orden de tabulación. */
  const errorRef = useRef<HTMLParagraphElement>(null);
  /* Se pide el foco ANTES de que exista el elemento: `setError` sólo
     programa un repintado, así que en ese instante `errorRef.current`
     todavía es null. Esta bandera lo aplaza a después del render. */
  const pedirFocoAviso = useRef(false);
  /* Lo mismo al terminar: el `<form>` entero se desmonta y lo sustituye
     el mensaje de éxito, así que el foco —que estaba en el botón de
     enviar— se cae al principio del documento. Quien navega con teclado
     o con lector de pantalla se queda sin saber que ha funcionado. */
  const exitoRef = useRef<HTMLDivElement>(null);
  const turnstileSiteKey = (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "").trim();

  useEffect(() => {
    if (pedirFocoAviso.current && errorRef.current) {
      pedirFocoAviso.current = false;
      errorRef.current.focus();
    }
    if (status === "success") exitoRef.current?.focus();
  });

  const profileInvalid = submitted && !profile;
  const emailInvalid = submitted && !EMAIL_RE.test(email.trim());
  const experienceInvalid = submitted && !experience;
  const marketsInvalid = submitted && !markets.trim();
  const workflowInvalid = submitted && !workflow;
  const goalInvalid = submitted && !goal;
  const privacyInvalid = submitted && !privacy;

  useEffect(() => {
    if (!turnstileSiteKey || !turnstileRef.current) return;
    const render = () => {
      if (!turnstileRef.current || !window.turnstile) return;
      window.turnstile.render(turnstileRef.current, {
        sitekey: turnstileSiteKey,
        callback: setTurnstileToken,
        "expired-callback": () => setTurnstileToken(""),
        "error-callback": () => setTurnstileToken(""),
      });
    };
    if (window.turnstile) {
      render();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.addEventListener("load", render, { once: true });
    document.head.appendChild(script);
    return () => script.removeEventListener("load", render);
  }, [turnstileSiteKey]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "sending" || status === "success") return;
    setSubmitted(true);

    const faltanCampos =
      !profile ||
      !EMAIL_RE.test(email.trim()) ||
      !experience ||
      !markets.trim() ||
      !workflow ||
      !goal ||
      !privacy;
    /* La verificación anti-bot se cuenta aparte de los campos: no es un
       campo que el visitante pueda rellenar. */
    const faltaVerificacion = Boolean(turnstileSiteKey) && !turnstileToken;

    if (faltanCampos || faltaVerificacion) {
      /* ── EL CALLEJÓN SIN SALIDA ────────────────────────────────────
         Antes había un solo mensaje —«Completa los campos
         obligatorios»— y una cascada de foco que sólo contemplaba los
         campos. Si el formulario estaba entero relleno y lo único que
         faltaba era el token de Turnstile (un bloqueador de anuncios,
         una red corporativa o una CSP que corte `challenges.
         cloudflare.com` bastan), el resultado era: mensaje pidiendo
         rellenar campos ya rellenos, foco que no se mueve a ninguna
         parte, y ninguna pista de qué hacer. El visitante cualificado
         que llega hasta el final del formulario se queda fuera sin
         saber por qué.

         Ahora se distinguen los dos casos y el mensaje dice cuál es. */
      setError(
        faltanCampos
          ? es
            ? "Completa los campos obligatorios para enviar la solicitud."
            : "Complete the required fields to send your application."
          : es
            ? "Falta la verificación anti-bot. Si no aparece, suele ser un bloqueador de anuncios o una red que filtra challenges.cloudflare.com: desactívalo para esta página y vuelve a intentarlo, o escríbenos y te damos acceso a mano."
            : "The anti-bot check is missing. If it never appears, an ad blocker or a network filtering challenges.cloudflare.com is the usual cause: allow it for this page and try again, or write to us and we will let you in by hand."
      );
      setStatus("error");
      const firstInvalidRef = !profile
        ? profileRef
        : !EMAIL_RE.test(email.trim())
          ? emailRef
          : !experience
            ? experienceRef
            : !markets.trim()
              ? marketsRef
              : !workflow
                ? workflowRef
                : !goal
                  ? goalRef
                  : !privacy
                    ? privacyRef
                    : null;
      if (firstInvalidRef) firstInvalidRef.current?.focus();
      // Nada que corregir en los campos: el foco va al aviso, que es
      // donde está la explicacion y la salida.
      else pedirFocoAviso.current = true;
      return;
    }

    setError(null);
    setStatus("sending");
    const payload: BetaApplicationData = {
      email: email.trim(),
      profile,
      experience,
      markets: markets.trim(),
      workflow,
      goal,
      privacyConsent: privacy,
      notes: notes.trim(),
      marketingConsent: marketing,
      botcheck,
      turnstileToken,
      lang,
    };
    const result = await joinBetaApplication(payload);

    if (!result.ok) {
      /* Los tokens de Turnstile son de un solo uso: tras un envío
         fallido el que hay en memoria ya no vale, y sin reiniciar el
         widget el segundo intento fallaba SIEMPRE con el mismo error,
         pareciendo un problema del servidor que no se arregla nunca.
         Se reinicia y se olvida el token para que reintentar signifique
         algo. */
      window.turnstile?.reset?.();
      setTurnstileToken("");
      setError(failureCopy(result.reason, es));
      setStatus("error");
      return;
    }

    trackEvent("beta_application_submitted", { profile, duplicate: result.duplicate });
    setStatus("success");
  };

  if (status === "success") {
    return (
      <div ref={exitoRef} tabIndex={-1} className="tj-paper tj-paper-glow border border-[rgb(var(--divider)/0.14)] p-7 sm:p-10 outline-none" role="status">
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          <span className="grid size-14 place-items-center rounded-full bg-[rgb(var(--pnl-pos)/0.12)] text-[rgb(var(--pnl-pos))]">
            <Check size={26} aria-hidden />
          </span>
          <h2 className="mt-5 t-h3 text-primary">{es ? "Solicitud recibida." : "Application received."}</h2>
          <p className="mt-3 text-secondary leading-relaxed">
            {es
              ? "Revisaremos las solicitudes por perfil y fase del producto. Te escribiremos sólo si encaja con el piloto privado; no necesitas tarjeta."
              : "We review applications by profile and product phase. We will write only if you fit the private pilot; no card is required."}
          </p>
          <Link href="/demo" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-[2px] border border-[rgb(var(--divider)/0.2)] px-5 text-sm font-semibold text-primary hover:bg-[rgb(var(--divider)/0.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]">
            {es ? "Mientras tanto, ver la demo" : "In the meantime, see the demo"}
            <ArrowRight size={15} aria-hidden />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      onFocus={() => {
        if (!startedRef.current) {
          startedRef.current = true;
          trackEvent("beta_application_started", { profile: profile || null });
        }
      }}
      noValidate
      className="tj-paper tj-paper-glow border border-[rgb(var(--divider)/0.14)] p-5 sm:p-8"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div>
          <p className="eyebrow">{es ? "Solicitud breve" : "Short application"}</p>
          <h2 className="mt-4 t-h3 text-primary">{es ? "Cuéntanos cómo operas." : "Tell us how you trade."}</h2>
          <p className="mt-3 max-w-md text-secondary leading-relaxed">
            {es
              ? "Buscamos un piloto pequeño y útil. No hace falta que tengas una cuenta ni que compartas resultados o datos financieros."
              : "We are building a small, useful private pilot. You do not need an account or to share performance or financial data."}
          </p>
          <div className="mt-6 space-y-3 text-sm text-secondary">
            {[es ? "Piloto privado, por invitación" : "Private pilot, invite only", es ? "Datos de trading siempre locales" : "Trading data stays local", es ? "Sin spam ni newsletter por defecto" : "No spam or newsletter by default"].map((item) => (
              <div key={item} className="flex items-start gap-2.5">
                <Check size={16} className="mt-0.5 shrink-0 text-[rgb(var(--pnl-pos))]" aria-hidden />
                <span>{item}</span>
              </div>
            ))}
          </div>
          <div className="mt-7 flex items-start gap-2.5 border-t border-[rgb(var(--divider)/0.12)] pt-5 text-xs text-tertiary">
            <ShieldCheck size={16} className="mt-0.5 shrink-0" aria-hidden />
            <span>{es ? "No pedimos credenciales, saldos ni acceso a tu broker." : "We never ask for credentials, balances or broker access."}</span>
          </div>
        </div>

        <div className="space-y-4">
          <fieldset aria-describedby={profileInvalid ? "profile-error" : undefined}>
            <legend className="text-sm font-medium text-primary">{es ? "¿Qué tipo de trader eres?" : "What kind of trader are you?"}</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {(["manual", "prop"] as const).map((value) => {
                const active = profile === value;
                return (
                  <label key={value} className={`flex min-h-12 cursor-pointer items-center gap-3 border px-3.5 text-sm transition-colors ${active ? "border-[rgb(var(--accent-base)/0.62)] bg-[rgb(var(--accent-base)/0.1)] text-primary" : profileInvalid ? "border-[rgb(var(--pnl-neg)/0.55)] text-secondary" : "border-[rgb(var(--divider)/0.18)] text-secondary hover:border-[rgb(var(--divider)/0.35)]"}`}>
                    <input ref={value === "manual" ? profileRef : undefined} type="radio" name="profile" value={value} checked={active} onChange={() => { setProfile(value); trackEvent("beta_profile_selected", { profile: value }); }} className="accent-[rgb(var(--accent-base))]" />
                    {value === "manual" ? es ? "Operativa manual" : "Manual trading" : es ? "Prop firm / evaluación" : "Prop firm / evaluation"}
                  </label>
                );
              })}
            </div>
            <FieldError id="profile-error" show={profileInvalid} message={es ? "Selecciona un tipo de trader." : "Select a trader type."} />
          </fieldset>

          <label className="block text-sm font-medium text-primary">
            {es ? "Email" : "Email"}
            <input ref={emailRef} className={`${inputClass} ${fieldBorderClass(emailInvalid)}`} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={es ? "tu@email.com" : "you@email.com"} required aria-invalid={emailInvalid} aria-describedby={emailInvalid ? "email-error" : undefined} />
          </label>
          <FieldError id="email-error" show={emailInvalid} message={es ? "Escribe un email válido." : "Enter a valid email."} />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-primary">
              {es ? "Experiencia" : "Experience"}
              <select ref={experienceRef} className={`${inputClass} ${fieldBorderClass(experienceInvalid)}`} value={experience} onChange={(e) => setExperience(e.target.value)} required aria-invalid={experienceInvalid} aria-describedby={experienceInvalid ? "experience-error" : undefined}>
                <option value="">{es ? "Selecciona" : "Select"}</option>
                <option value="under-1">{es ? "Menos de 1 año" : "Under 1 year"}</option>
                <option value="1-3">1–3 {es ? "años" : "years"}</option>
                <option value="3-plus">3+ {es ? "años" : "years"}</option>
              </select>
              <FieldError id="experience-error" show={experienceInvalid} message={es ? "Selecciona tu experiencia." : "Select your experience."} />
            </label>
            <label className="block text-sm font-medium text-primary">
              {es ? "Mercados" : "Markets"}
              <input ref={marketsRef} className={`${inputClass} ${fieldBorderClass(marketsInvalid)}`} value={markets} onChange={(e) => setMarkets(e.target.value)} placeholder={es ? "Forex, futuros, acciones…" : "Forex, futures, equities…"} required aria-invalid={marketsInvalid} aria-describedby={marketsInvalid ? "markets-error" : undefined} />
              <FieldError id="markets-error" show={marketsInvalid} message={es ? "Indica qué mercados operas." : "Tell us which markets you trade."} />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-primary">
              {es ? "Cómo llevas hoy tu diario" : "How you journal today"}
              <select ref={workflowRef} className={`${inputClass} ${fieldBorderClass(workflowInvalid)}`} value={workflow} onChange={(e) => setWorkflow(e.target.value)} required aria-invalid={workflowInvalid} aria-describedby={workflowInvalid ? "workflow-error" : undefined}>
                <option value="">{es ? "Selecciona" : "Select"}</option>
                <option value="spreadsheet">{es ? "Excel / Sheets" : "Excel / Sheets"}</option>
                <option value="journal">{es ? "Otro diario" : "Another journal"}</option>
                <option value="notes">{es ? "Notas sueltas" : "Loose notes"}</option>
                <option value="nothing">{es ? "Todavía no" : "Not yet"}</option>
              </select>
              <FieldError id="workflow-error" show={workflowInvalid} message={es ? "Selecciona una opción." : "Select an option."} />
            </label>
            <label className="block text-sm font-medium text-primary">
              {es ? "Qué quieres mejorar primero" : "What you want to improve first"}
              <select ref={goalRef} className={`${inputClass} ${fieldBorderClass(goalInvalid)}`} value={goal} onChange={(e) => setGoal(e.target.value)} required aria-invalid={goalInvalid} aria-describedby={goalInvalid ? "goal-error" : undefined}>
                <option value="">{es ? "Selecciona" : "Select"}</option>
                <option value="metrics">{es ? "Métricas y edge" : "Metrics and edge"}</option>
                <option value="discipline">{es ? "Disciplina" : "Discipline"}</option>
                <option value="risk">{es ? "Riesgo y reglas" : "Risk and rules"}</option>
                <option value="review">{es ? "Revisión de operaciones" : "Trade review"}</option>
              </select>
              <FieldError id="goal-error" show={goalInvalid} message={es ? "Selecciona una opción." : "Select an option."} />
            </label>
          </div>

          <label className="block text-sm font-medium text-primary">
            {es ? "Algo más que debamos saber (opcional)" : "Anything else we should know (optional)"}
            <textarea className={`${inputClass} min-h-24 resize-y py-3`} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={800} />
          </label>

          <div aria-hidden="true" className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
            <label htmlFor="beta-botcheck">{es ? "No rellenar" : "Do not fill"}<input id="beta-botcheck" tabIndex={-1} autoComplete="off" value={botcheck} onChange={(e) => setBotcheck(e.target.value)} /></label>
          </div>

          <div>
            <label className="flex items-start gap-2.5 text-xs text-secondary">
              <input ref={privacyRef} type="checkbox" checked={privacy} onChange={(e) => setPrivacy(e.target.checked)} className="mt-0.5 accent-[rgb(var(--accent-base))]" required aria-invalid={privacyInvalid} aria-describedby={privacyInvalid ? "privacy-error" : undefined} />
              <span>{es ? <>He leído la <Link href="/privacidad" className="text-primary underline underline-offset-2">política de privacidad</Link> y acepto que se gestione esta solicitud.</> : <>I have read the <Link href="/privacidad" className="text-primary underline underline-offset-2">privacy policy</Link> and agree to this application being processed.</>}</span>
            </label>
            <FieldError id="privacy-error" show={privacyInvalid} message={es ? "Debes aceptar la política de privacidad para continuar." : "You must accept the privacy policy to continue."} />
          </div>
          <label className="flex items-start gap-2.5 text-xs text-secondary">
            <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-0.5 accent-[rgb(var(--accent-base))]" />
            <span>{es ? "Quiero recibir avisos puntuales sobre el lanzamiento y futuras versiones." : "I want occasional updates about launch and future versions."}</span>
          </label>

          {turnstileSiteKey && (
            <div
              ref={turnstileRef}
              className="min-h-[65px]"
              aria-label={es ? "Verificación anti-bot" : "Anti-bot verification"}
            />
          )}

          {error && (<p ref={errorRef} tabIndex={-1} className="text-sm text-pnl-neg outline-none" role="alert">{error}</p>)}
          <button type="submit" disabled={!ready || status === "sending"} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[2px] bg-[rgb(var(--accent-base))] px-5 text-sm font-semibold text-[rgb(var(--accent-ink))] transition-colors hover:bg-[rgb(var(--accent-hover))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] disabled:cursor-not-allowed disabled:opacity-60">
            {status === "sending" ? es ? "Enviando…" : "Sending…" : es ? "Solicitar acceso" : "Request access"}
            {status !== "sending" && <ArrowRight size={15} aria-hidden />}
          </button>
        </div>
      </div>
    </form>
  );
}
