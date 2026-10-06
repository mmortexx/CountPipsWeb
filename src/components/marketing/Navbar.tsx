"use client";

import { useEffect, useId, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { Link } from "@/components/tj/LocaleLink";
import { usePathname } from "next/navigation";
import { useLang, type Lang } from "@/lib/i18n";
import { sinPrefijoEn } from "@/lib/locale";
import { useTheme } from "@/lib/theme";
import { BrandGlyph } from "@/components/tj/BrandGlyph";

/**
 * Barra fija: opaca arriba y de papel translúcido (`.tj-barra`) al desplazar.
 * El menú de «Producto» flota en cristal y el cajón móvil es opaco.
 *
 * El realce de hover y foco va en CSS (`hover:` / `focus-visible:`) para que
 * ratón y teclado reciban lo mismo. El fondo es solo de hover/foco; la regla
 * de acento marca la ruta activa.
 */
/* Altura fija (con y sin scroll): una barra que cambia de alto mueve su
   contenido mientras se lee y descuadra `scroll-padding-top` y los
   `scroll-mt-*` de los anclajes. Al desplazar solo cambian sombra y filo. */
const ALTURA_BARRA = 68;

const PRODUCT_ITEMS: {
  href: string;
  labelEs: string;
  labelEn: string;
  descEs: string;
  descEn: string;
  grupo: "producto" | "recursos";
}[] = [
  {
    href: "/features",
    labelEs: "Características",
    labelEn: "Features",
    descEs: "Vista general del producto",
    descEn: "Product overview",
    grupo: "producto",
  },
  {
    href: "/features/metricas",
    labelEs: "Métricas",
    labelEn: "Metrics",
    descEs: "Sharpe, profit factor, expectancy",
    descEn: "Sharpe, profit factor, expectancy",
    grupo: "producto",
  },
  {
    href: "/features/disciplina",
    labelEs: "Disciplina",
    labelEn: "Discipline",
    descEs: "Semáforo de riesgo y freno duro",
    descEn: "Risk light and hard brake",
    grupo: "producto",
  },
  {
    href: "/features/seguridad",
    labelEs: "Seguridad",
    labelEn: "Security",
    descEs: "Tus datos en tu equipo, sin cuenta",
    descEn: "Your data on your machine, no account",
    grupo: "producto",
  },
  {
    href: "/test",
    labelEs: "Test de disciplina",
    labelEn: "Discipline test",
    descEs: "Mídete en cinco ejes, sin email",
    descEn: "Measure yourself across five axes, no email",
    grupo: "recursos",
  },
  {
    href: "/herramientas",
    labelEs: "Herramientas",
    labelEn: "Tools",
    descEs: "Diez calculadoras, gratis y sin registro",
    descEn: "Ten calculators, free and with no sign-up",
    grupo: "recursos",
  },
  {
    href: "/glosario",
    labelEs: "Glosario",
    labelEn: "Glossary",
    descEs: "57 términos explicados sin rodeos",
    descEn: "57 terms explained without waffle",
    grupo: "recursos",
  },
  {
    href: "/faq",
    labelEs: "Preguntas frecuentes",
    labelEn: "FAQ",
    descEs: "La demo, el alcance y el acceso",
    descEn: "The demo, scope and access",
    grupo: "recursos",
  },
];

const DRAWER_GRUPOS: {
  id: "producto" | "recursos" | "empresa";
  es: string;
  en: string;
}[] = [
  { id: "producto", es: "Producto", en: "Product" },
  { id: "recursos", es: "Recursos", en: "Resources" },
  { id: "empresa", es: "Empresa", en: "Company" },
];

const DRAWER_LINKS: {
  href: string;
  labelEs: string;
  labelEn: string;
  grupo: (typeof DRAWER_GRUPOS)[number]["id"];
}[] = [
  {
    href: "/features",
    labelEs: "Características",
    labelEn: "Features",
    grupo: "producto",
  },
  {
    href: "/demo",
    labelEs: "Demo",
    labelEn: "Demo",
    grupo: "producto",
  },
  {
    href: "/pricing",
    labelEs: "Precios",
    labelEn: "Pricing",
    grupo: "producto",
  },
  {
    href: "/traders/manual",
    labelEs: "Operativa manual",
    labelEn: "Manual trading",
    grupo: "producto",
  },
  {
    href: "/traders/prop-firms",
    labelEs: "Prop firms",
    labelEn: "Prop firms",
    grupo: "producto",
  },
  {
    href: "/beta",
    labelEs: "Acceso anticipado",
    labelEn: "Early access",
    grupo: "producto",
  },
  {
    href: "/about",
    labelEs: "Acerca de",
    labelEn: "About",
    grupo: "empresa",
  },
  {
    href: "/test",
    labelEs: "Test de disciplina",
    labelEn: "Discipline test",
    grupo: "recursos",
  },
  {
    href: "/herramientas",
    labelEs: "Herramientas",
    labelEn: "Tools",
    grupo: "recursos",
  },
  {
    href: "/glosario",
    labelEs: "Glosario",
    labelEn: "Glossary",
    grupo: "recursos",
  },
  {
    href: "/faq",
    labelEs: "FAQ",
    labelEn: "FAQ",
    grupo: "recursos",
  },
];

export function Navbar() {
  const { t, lang } = useLang();
  const es = lang === "es";
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  /* El cajón se monta en la primera apertura y se queda montado: desde el
     principio añadiría su menú al HTML de todas las páginas, y desmontarlo
     al cerrar quitaría la animación de salida. */
  const [cajonMontado, setCajonMontado] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  /** Elemento de navegación bajo el puntero o el foco. */
  const [hovered, setHovered] = useState<string | null>(null);
  const megaCloseTimer = useRef<number | null>(null);

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const megaButtonRef = useRef<HTMLButtonElement>(null);
  /** El disparador y su panel: lo que cuenta como «dentro» del menú. */
  const megaWrapRef = useRef<HTMLDivElement>(null);
  const focoRef = useRef<HTMLSpanElement>(null);
  /* Un trazo compartido (`.tj-nav-foco`) viaja al enlace bajo el puntero o el
     foco. Sobre el enlace activo se apaga: ahí manda la barra de acento. Se
     mueve escribiendo en su estilo, sin estado, para no repintar la barra. */
  const mueveFoco = (el: HTMLElement, activo: boolean, sangria: number) => {
    const f = focoRef.current;
    if (!f) return;
    if (activo) {
      f.dataset.visible = "false";
      return;
    }
    const nuevo = f.dataset.visible !== "true";
    if (nuevo) f.dataset.quieto = "true";
    f.style.setProperty("--x", `${el.offsetLeft + sangria}px`);
    f.style.setProperty("--w", String(Math.max(0, el.offsetWidth - 2 * sangria)));
    f.dataset.visible = "true";
    if (nuevo) {
      void f.offsetWidth;
      delete f.dataset.quieto;
    }
  };
  const ocultaFoco = () => {
    if (focoRef.current) focoRef.current.dataset.visible = "false";
  };
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Megamenú: el retardo de cierre evita que se cierre al cruzar el hueco
  // entre botón y panel.
  const megaEnter = () => {
    if (megaCloseTimer.current) window.clearTimeout(megaCloseTimer.current);
    punteroEnMega.current = true;
    setMegaOpen(true);
  };
  const megaLeave = () => {
    if (megaCloseTimer.current) window.clearTimeout(megaCloseTimer.current);
    punteroEnMega.current = false;
    megaCloseTimer.current = window.setTimeout(() => setMegaOpen(false), 140);
  };

  /* El menú se abre al pasar el ratón, así que un clic que alternara lo
     cerraría justo después de abrirlo. Con el puntero encima, el clic solo
     abre; con teclado (`detail === 0`) alterna. En táctil no hay «apartarse»:
     el cierre al tocar fuera evita que el panel quede clavado en tabletas
     de más de 1.120 px. */
  const punteroEnMega = useRef(false);
  const megaClick = (e: ReactMouseEvent<HTMLButtonElement>) => {
    if (e.detail === 0) {
      setMegaOpen((o) => !o);
      return;
    }
    if (punteroEnMega.current) setMegaOpen(true);
    else setMegaOpen((o) => !o);
  };

  useEffect(() => {
    if (!megaOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMegaOpen(false);
        // Devuelve el foco al disparador para conservar el orden de tabulación.
        megaButtonRef.current?.focus();
      }
    };
    /* `pointerdown` y no `click`, para cerrar antes de que el elemento de
       debajo reciba el suyo. En captura, para que llegue siempre. */
    const onFuera = (e: PointerEvent) => {
      const destino = e.target as Node | null;
      if (!destino) return;
      if (megaWrapRef.current?.contains(destino)) return;
      setMegaOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onFuera, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onFuera, true);
    };
  }, [megaOpen]);

  // Trampa de foco del cajón móvil.
  useEffect(() => {
    if (!mobileOpen) return;
    /* `.tj-cajon` nace con `visibility: hidden` y `focus()` sobre un elemento
       invisible falla sin error. Un solo `requestAnimationFrame` no basta
       (corre antes del recálculo de estilo), así que se reintenta hasta que
       el foco queda dentro del cajón. */
    let cancelado = false;
    let raf = 0;
    const entrar = (intentosRestantes: number) => {
      if (cancelado) return;
      const drawer = drawerRef.current;
      if (!drawer) return;
      const focusables = getFocusables(drawer);
      const target = focusables[0] ?? drawer;
      target.focus();
      if (!drawer.contains(document.activeElement) && intentosRestantes > 0) {
        raf = requestAnimationFrame(() => entrar(intentosRestantes - 1));
      }
    };
    raf = requestAnimationFrame(() => entrar(5));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setMobileOpen(false);
        return;
      }
      if (e.key !== "Tab") return;
      const drawer = drawerRef.current;
      if (!drawer) return;
      const focusables = getFocusables(drawer);
      if (focusables.length === 0) {
        e.preventDefault();
        drawer.focus();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      const inside = drawer.contains(active);
      if (e.shiftKey) {
        if (!inside || active === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (!inside || active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelado = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      /* Se lee `.current` en la limpieza a propósito: si el botón se ha
         desmontado (de móvil a escritorio) vale null y no se enfoca nada; una
         copia tomada al entrar enfocaría un nodo ya fuera del documento. */
      // eslint-disable-next-line react-hooks/exhaustive-deps
      menuButtonRef.current?.focus();
    };
  }, [mobileOpen]);

  // Bloqueo de scroll con el cajón abierto. `data-drawer-open` en <body> oculta
  // el banner de cookies y BackToTop.
  //
  // `overflow: hidden` no basta: Safari en iPhone lo ignora para el gesto
  // táctil. Se saca el body del flujo con `position: fixed` y se compensa con
  // `top: -Ypx` para conservar la posición, que se restaura al cerrar.
  // `behavior: "instant"` porque `html` tiene `scroll-behavior: smooth`.
  useEffect(() => {
    if (!mobileOpen) return;
    const body = document.body;
    const y = window.scrollY;
    const prev = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    };
    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${y}px`;
    body.style.width = "100%";
    body.dataset.drawerOpen = "true";
    return () => {
      body.style.overflow = prev.overflow;
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      delete body.dataset.drawerOpen;
      window.scrollTo({ top: y, behavior: "instant" });
    };
  }, [mobileOpen]);

  // Cierra cajón y megamenú al cambiar de ruta; `hovered` también se limpia
  // para que el realce no quede encallado bajo el elemento pulsado.
  useEffect(() => {
    setMobileOpen(false);
    setMegaOpen(false);
    setHovered(null);
    ocultaFoco();
  }, [pathname]);

  const productItems = PRODUCT_ITEMS;
  const drawerLinks = DRAWER_LINKS;

  /** ¿Esta ruta (o una subruta suya) es la página actual? Se quita el prefijo
   * `/en` porque los enlaces del menú se escriben sin él (lo añade `LocaleLink`). */
  const rutaActual = sinPrefijoEn(pathname);
  const isActive = (href: string) =>
    rutaActual === href || rutaActual.startsWith(href + "/");

  /** Regla de acento persistente que marca la ruta actual. */
  const activeBar = (
    <span
      aria-hidden
      className="absolute -bottom-[6px] left-2 right-2 h-[1.5px]"
      style={{ background: "rgb(var(--accent-base))" }}
    />
  );

  const navLink = (href: string, label: string) => {
    const active = isActive(href);
    return (
      <div
        key={href}
        className="group relative"
        onMouseEnter={(e) => {
          setHovered(href);
          mueveFoco(e.currentTarget, active, 12);
        }}
      >
        <Link
          href={href}
          aria-current={active ? "page" : undefined}
          onFocus={(e) => {
            setHovered(href);
            if (e.currentTarget.parentElement) mueveFoco(e.currentTarget.parentElement, active, 12);
          }}
          /* `whitespace-nowrap`: un rótulo («Prop firms») a dos líneas rompe la
             altura de la fila. Si no cabe, debe pasar al cajón lateral. */
          className="relative z-10 block whitespace-nowrap rounded-[4px] px-3 py-[9px] text-sm transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]"
          style={{ color: active || hovered === href ? "var(--ink)" : "var(--ink-2)" }}
        >
          {label}
        </Link>
        {active && activeBar}
      </div>
    );
  };

  /* Producto también cubre los recursos, que están en su menú. */
  const productActive = ["/features", "/herramientas", "/glosario", "/test", "/faq"].some(
    (r) => rutaActual === r || rutaActual.startsWith(r + "/"),
  );

  return (
    <>
      <header data-navbar-root className="fixed inset-x-0 top-0 z-50">
      <nav
        aria-label={es ? "Principal" : "Main"}
        className="tj-barra relative flex w-full items-center"
        data-cristal={scrolled ? "true" : "false"}
        style={{ height: ALTURA_BARRA }}
      >
        {/* Rejilla `auto · minmax(0,1fr) · auto` en escritorio (marca, navegación,
            utilidades): las laterales piden lo que miden y la navegación se
            centra en el hueco restante, así que nada se pisa. Con `1fr` el
            mínimo `auto` impedía encoger las laterales y el centro desbordaba.
            En móvil son DOS columnas: la zona central va con `display:none` y
            no ocupa celda, y con tres el botón de menú caería en la central.
            El tope de ancho de la barra lo da `.tj-container`, no la mancha
            de lectura de 1.080 px. */}
        <div className="tj-container grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 min-[1120px]:grid-cols-[auto_minmax(0,1fr)_auto]">
          {/* Marca. `min-h-[44px]` da el suelo táctil en móvil. */}
          <Link
            href="/"
            className="flex min-h-[44px] min-w-0 items-center gap-2.5 justify-self-start rounded-[4px] outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]"
            style={{ color: "var(--ink)" }}
            aria-label={t("appName")}
          >
            <BrandMark />
            <span
              className="truncate"
              style={{ fontSize: 17, fontWeight: 650, letterSpacing: "-0.02em" }}
            >
              {t("appName")}
            </span>
          </Link>

          {/* Navegación centrada: Producto (megamenú) y enlaces directos. */}
          <div
            className="relative hidden items-center gap-0.5 justify-self-center min-[1120px]:flex"
            onMouseLeave={() => {
              setHovered(null);
              ocultaFoco();
            }}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                ocultaFoco();
                // El foco sale de toda la zona de navegación: cierra el panel
                // (vía teclado; Escape y pointerdown ya cubren las demás).
                setMegaOpen(false);
              }
            }}
          >
            <span ref={focoRef} aria-hidden className="tj-nav-foco" />
            <div
              ref={megaWrapRef}
              className="group relative"
              onMouseEnter={(e) => {
                setHovered("product");
                mueveFoco(e.currentTarget, productActive, 15);
                megaEnter();
              }}
              onMouseLeave={megaLeave}
            >
              <button
                type="button"
                id="navbar-producto-trigger"
                ref={megaButtonRef}
                /* No se abre en `pointerdown`: el menú ya se abre al pasar el
                   ratón (`megaEnter`). Ver `megaClick`. */
                onClick={megaClick}
                onFocus={() => {
                  setHovered("product");
                  if (megaWrapRef.current) mueveFoco(megaWrapRef.current, productActive, 15);
                }}
                /* Desplegable de enlaces, no `role="menu"`: ese rol promete un
                   teclado que una navegación no tiene y cambia el modo de
                   lectura en NVDA/JAWS. */
                aria-expanded={megaOpen}
                aria-controls={megaOpen ? "navbar-producto-panel" : undefined}
                className="relative z-10 inline-flex cursor-pointer items-center gap-1.5 rounded-[4px] border-0 bg-transparent px-[15px] py-[9px] text-sm outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]"
                style={{
                  color:
                    megaOpen || productActive || hovered === "product"
                      ? "var(--ink)"
                      : "var(--ink-2)",
                  fontFamily: "inherit",
                }}
              >
                {es ? "Producto" : "Product"}
                <svg
                  width="9"
                  height="9"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden
                  style={{
                    transition: "transform 0.28s var(--ease-suave)",
                    transform: megaOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                >
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {productActive && activeBar}

              {/* Se monta y desmonta (no `visibility`) para no quedar en el
                  árbol de accesibilidad cerrado. Solo la entrada se anima
                  (`.tj-cae`). */}
              {megaOpen && (
                  <div
                    id="navbar-producto-panel"
                    /* Flechas, Inicio y Fin recorren el menú; el recorrido da la
                       vuelta al llegar al final. */
                    onKeyDown={(e) => {
                      const teclas = ["ArrowDown", "ArrowUp", "Home", "End"];
                      if (!teclas.includes(e.key)) return;
                      const opciones = Array.from(
                        e.currentTarget.querySelectorAll<HTMLElement>(
                          'a[href], button:not([disabled])',
                        ),
                      ).filter((el) => el.offsetParent !== null);
                      if (opciones.length === 0) return;
                      e.preventDefault();
                      const actual = opciones.indexOf(
                        document.activeElement as HTMLElement,
                      );
                      let siguiente: number;
                      if (e.key === "Home") siguiente = 0;
                      else if (e.key === "End") siguiente = opciones.length - 1;
                      else if (e.key === "ArrowDown")
                        siguiente = actual < 0 ? 0 : (actual + 1) % opciones.length;
                      else
                        siguiente =
                          actual <= 0 ? opciones.length - 1 : actual - 1;
                      opciones[siguiente]?.focus();
                    }}
                    // Cristal: la página se ve difuminada detrás. `position` en línea porque
                    // una regla posterior de globals.css pisaría la utilidad `absolute`.
                    className="tj-cae tj-cristal tj-cristal--denso tj-cristal--menu absolute left-1/2 w-[640px] max-w-[calc(100vw-3rem)] origin-top p-0"
                    style={{
                      position: "absolute",
                      top: "calc(100% + 14px)",
                      translate: "-50% 0",
                      contain: "layout",
                      willChange: "transform, opacity",
                    }}
                  >
                    {(() => {
                      const fila = (item: (typeof productItems)[number]) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMegaOpen(false)}
                          className="group flex gap-[11px] rounded-[4px] px-2.5 py-[9px] outline-none transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--ink)_5%,transparent)] focus-visible:bg-[color-mix(in_srgb,var(--ink)_5%,transparent)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]"
                          style={{ color: "var(--ink)" }}
                          /* Sin precarga manual: `Link` ya precarga con el prefijo
                             de despliegue y el idioma. */
                        >
                          <span>
                            <span className="block text-[14px] font-semibold">
                              {es ? item.labelEs : item.labelEn}
                            </span>
                            <span
                              className="mt-0.5 block text-[13px] leading-[1.4]"
                              style={{ color: "var(--ink-2)" }}
                            >
                              {es ? item.descEs : item.descEn}
                            </span>
                          </span>
                        </Link>
                      );
                      return (
                        <>
                          <div className="relative grid grid-cols-2 divide-x divide-[var(--line)] p-2">
                            <div className="pr-2">
                              <p className="eyebrow m-0 px-2.5 pb-1.5 pt-1">
                                {es ? "Producto" : "Product"}
                              </p>
                              {productItems.filter((i) => i.grupo === "producto").map(fila)}
                            </div>
                            <div className="pl-2">
                              <p className="eyebrow m-0 px-2.5 pb-1.5 pt-1">
                                {es ? "Recursos" : "Resources"}
                              </p>
                              {productItems.filter((i) => i.grupo === "recursos").map(fila)}
                            </div>
                          </div>
                          <div className="flex items-center justify-between border-t border-[var(--line)] px-4 py-2.5">
                            <span className="tnum text-[12px] text-tertiary">
                              {es
                                ? "Todo el producto, en una vista"
                                : "The whole product, in one view"}
                            </span>
                            <Link
                              href="/demo"
                              onClick={() => setMegaOpen(false)}
                              className="group inline-flex items-center gap-1.5 text-[13px] font-semibold outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]"
                              style={{ color: "rgb(var(--accent-base))" }}
                            >
                              {es ? "Abrir la demo" : "Open the demo"}
                            </Link>
                          </div>
                        </>
                      );
                    })()}
                  </div>
              )}
            </div>

            {/* Sin «Demo» (es el botón de la derecha) ni «Recursos» (vive en
                el menú Producto). */}
            {navLink("/pricing", es ? "Precios" : "Pricing")}
            {navLink("/traders/manual", es ? "Manual" : "Manual")}
            {navLink("/traders/prop-firms", "Prop firms")}
            {navLink("/beta", es ? "Acceso anticipado" : "Early access")}
          </div>

          {/* Utilidades: tema, idioma, CTA y hamburguesa. En móvil tema, idioma
              y CTA se ocultan aquí y viven en el cajón a ≥44 px. */}
          <div className="flex flex-none items-center gap-2 justify-self-end">
            <div className="hidden min-[1120px]:flex min-[1120px]:items-center min-[1120px]:gap-2">
            <IconButton
              onClick={toggleTheme}
              label={es ? "Cambiar tema" : "Toggle theme"}
              extraProps={{ "data-theme-toggle": true }}
            >
              {/* `key={theme}` reemplaza el nodo al cambiar de tema y el nuevo
                  entra con su animación CSS (cruce corto de opacidad). */}
              <span
                key={theme}
                className="tj-cruza grid place-items-center"
                style={{ width: 15, height: 15 }}
              >
                {theme === "dark" ? <SunIcon /> : <MoonIcon />}
              </span>
            </IconButton>

            <LanguagePicker />

            <Link
              href="/demo"
              className="hidden flex-none items-center gap-[7px] whitespace-nowrap rounded-[4px] text-sm font-semibold outline-none transition-colors duration-150 hover:bg-[rgb(var(--accent-hover))] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] sm:inline-flex"
              style={{
                height: 38,
                padding: "0 18px",
                background: "rgb(var(--accent-base))",
                color: "rgb(var(--accent-ink))",
              }}
            >
              {es ? "Ver la demo" : "See the demo"}
            </Link>
            </div>{/* /hidden min-[1120px]:flex — utilidades de escritorio */}

            <button
              ref={menuButtonRef}
              onClick={() => {
                /* El `requestAnimationFrame` separa montaje y apertura en dos
                   fotogramas; si no, el cajón nace ya visible y no hay
                   transición. */
                if (!cajonMontado) {
                  setCajonMontado(true);
                  requestAnimationFrame(() => setMobileOpen(true));
                  return;
                }
                setMobileOpen((o) => !o);
              }}
              className="grid h-11 w-11 place-items-center rounded-[4px] text-[var(--ink-2)] outline-none transition-colors duration-200 hover:bg-[rgb(var(--divider)/0.05)] hover:text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] min-[1120px]:hidden"
              aria-label={mobileOpen ? (es ? "Cerrar menú" : "Close menu") : (es ? "Abrir menú" : "Open menu")}
              aria-expanded={mobileOpen}
              aria-haspopup="dialog"
              aria-controls="mobile-nav-drawer"
            >
              {mobileOpen ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              )}
            </button>
          </div>
        </div>

      </nav>

      {/* Cajón móvil: se queda montado con la visibilidad conmutada para
          animar también la salida. `inert` lo saca del árbol de
          accesibilidad (foco, lectura y clics) mientras está cerrado. */}
      <>
        {cajonMontado && (
          <>
            <div
              onClick={() => setMobileOpen(false)}
              data-visible={mobileOpen ? "true" : "false"}
              className="tj-velo fixed inset-0 z-[55] bg-black/60 min-[1120px]:hidden"
              aria-hidden="true"
            />
            <aside
              ref={drawerRef}
              id="mobile-nav-drawer"
              role="dialog"
              aria-modal="true"
              aria-label={es ? "Menú de navegación" : "Navigation menu"}
              tabIndex={-1}
              data-visible={mobileOpen ? "true" : "false"}
              inert={!mobileOpen}
              // Opaco (`tj-paper-dense`) para que no compitan textos con la
              // página. `position: fixed` en línea porque `.tj-paper` declara
              // `position: relative` más tarde en la cascada y pisaría la
              // utilidad `fixed` (igual que en CookieConsent.tsx).
              className="tj-cajon tj-paper tj-paper-dense safe-top fixed top-0 right-0 bottom-0 z-[60] flex w-[300px] max-w-[84vw] flex-col border-l border-[rgb(var(--divider)/0.1)] outline-none min-[1120px]:hidden"
              style={{ position: "fixed" }}
            >
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--line)] px-5">
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-[44px] items-center gap-2.5 rounded-[4px] outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]"
                  aria-label={t("appName")}
                >
                  <BrandMark />
                  <span className="text-[17px] font-semibold tracking-[-0.02em] text-[var(--ink)]">
                    {t("appName")}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="grid h-11 w-11 place-items-center rounded-[4px] text-[var(--ink-2)] outline-none transition-colors hover:bg-[rgb(var(--divider)/0.05)] hover:text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]"
                  aria-label={es ? "Cerrar menú" : "Close menu"}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* `tj-cajon-lista` insinúa que hay más contenido bajo la botonera
                  fija cuando la lista no cabe. */}
              <nav className="tj-cajon-lista flex flex-1 flex-col overflow-y-auto px-3 py-4" aria-label={es ? "Secciones" : "Sections"}>
                {DRAWER_GRUPOS.map((grupo, gi) => (
                  <div key={grupo.id}>
                    {gi > 0 && (
                      <div
                        aria-hidden
                        className="mx-3 mt-3 mb-1 h-px"
                        style={{ background: "rgb(var(--divider) / 0.08)" }}
                      />
                    )}
                    <span
                      className={`block px-3 pb-1.5 text-[12px] font-semibold ${gi === 0 ? "" : "pt-2.5"}`}
                      style={{ color: "var(--ink-3)" }}
                    >
                      {es ? grupo.es : grupo.en}
                    </span>
                    {drawerLinks
                      .filter((l) => l.grupo === grupo.id)
                      .map((l) => {
                        const active = isActive(l.href);
                        return (
                          <Link
                            key={l.href}
                            href={l.href}
                            onClick={() => setMobileOpen(false)}
                            aria-current={active ? "page" : undefined}
                            className={`group relative flex min-h-[44px] items-center gap-3 rounded-[4px] py-2 pr-3 pl-3 text-sm outline-none transition-[background-color,color] duration-150 ease-[var(--ease-suave)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] ${
                              active
                                ? "bg-[rgb(var(--divider)/0.06)] font-medium text-[var(--ink)]"
                                : "text-[var(--ink-2)] hover:bg-[rgb(var(--divider)/0.04)] hover:text-[var(--ink)]"
                            }`}
                          >
                            {active && (
                              <span
                                aria-hidden
                                className="absolute top-1.5 bottom-1.5 left-0 w-[2px]"
                                style={{ background: "rgb(var(--accent-base))" }}
                              />
                            )}
                            <span className="flex-1">{es ? l.labelEs : l.labelEn}</span>
                          </Link>
                        );
                      })}
                  </div>
                ))}

                {/* Idioma y tema dentro del cajón (la barra queda tapada por el
                    velo). Van a h-11 (44 px) por el suelo táctil; la raya
                    separa navegación de preferencias. */}
                <div
                  aria-hidden
                  className="mx-3 mt-4 h-px"
                  style={{ background: "rgb(var(--divider) / 0.08)" }}
                />
                <span
                  className="px-3 pb-2 pt-4 text-[12px] font-semibold"
                  style={{ color: "var(--ink-3)" }}
                >
                  {es ? "Preferencias" : "Preferences"}
                </span>
                <div className="flex items-center gap-2 px-3 pb-1">
                  <LanguagePicker size="md" />
                  <button
                    type="button"
                    onClick={toggleTheme}
                    aria-label={es ? "Cambiar tema" : "Toggle theme"}
                    title={es ? "Cambiar tema" : "Toggle theme"}
                    data-theme-toggle
                    className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[4px] border-0 bg-transparent px-2.5 text-[12px] font-semibold tracking-wide text-[var(--ink-2)] outline-none transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--ink)_6%,transparent)] hover:text-[var(--ink)] focus-visible:border-[rgb(var(--divider)/0.24)] focus-visible:bg-[color-mix(in_srgb,var(--ink)_6%,transparent)] focus-visible:text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]"
                  >
                    <span
                      key={theme}
                      className="tj-cruza grid place-items-center"
                      style={{ width: 15, height: 15 }}
                    >
                      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
                    </span>
                    <span>{theme === "dark" ? (es ? "Claro" : "Light") : (es ? "Oscuro" : "Dark")}</span>
                  </button>
                </div>
              </nav>

              {/* Botonera fija al fondo; `safe-bottom` deja sitio a la barra de
                 inicio de iOS. */}
              <div className="safe-bottom shrink-0 border-t border-[var(--line)] px-4 pt-4">
                <div className="flex flex-col gap-2 pb-4">
                  <Link
                    href="/demo"
                    onClick={() => setMobileOpen(false)}
                    className="flex h-12 w-full items-center justify-center gap-1.5 rounded-[4px] text-sm font-semibold outline-none transition-colors duration-150 hover:bg-[rgb(var(--accent-hover))] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
                    style={{
                      background: "rgb(var(--accent-base))",
                      color: "rgb(var(--accent-ink))",
                    }}
                  >
                    {lang === "es" ? "Ver la demo" : "See the demo"}
                  </Link>
                </div>
              </div>
            </aside>
          </>
        )}
      </>
    </header>
    </>
  );
}

/** Botón cuadrado de 36 px del clúster derecho; hover y foco comparten estilo. */
function IconButton({
  onClick,
  label,
  children,
  className = "",
  extraProps = {},
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  className?: string;
  extraProps?: Record<string, unknown>;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`grid flex-none cursor-pointer place-items-center rounded-[4px] border-0 bg-transparent text-[var(--ink-2)] outline-none transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--ink)_6%,transparent)] hover:text-[var(--ink)] focus-visible:border-[rgb(var(--divider)/0.24)] focus-visible:bg-[color-mix(in_srgb,var(--ink)_6%,transparent)] focus-visible:text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] ${className}`}
      style={{ width: 36, height: 36 }}
      {...extraProps}
    >
      {children}
    </button>
  );
}

/**
 * Selector de idioma. La lista sale de LANGUAGES (añadir un idioma es añadir
 * una línea) y cada entrada se muestra en su propia lengua.
 *
 * Accesibilidad: desplegable con `aria-expanded`/`aria-controls` y un grupo de
 * botones con `aria-pressed` y el `lang` de cada idioma. No es un `listbox`
 * porque no tiene navegación con flechas. Escape o clic fuera cierran.
 */
const LANGUAGES: { code: Lang; code2: string; native: string }[] = [
  { code: "es", code2: "ES", native: "Español" },
  { code: "en", code2: "EN", native: "English" },
];

function LanguagePicker({ size = "sm" }: { size?: "sm" | "md" }) {
  const { lang, setLang } = useLang();
  const es = lang === "es";
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  // `size` solo cambia la altura: "sm" (36 px) en la barra, "md" (44 px) en el
  // cajón móvil.
  const sizeCls = size === "md" ? "h-11" : "h-9";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!popRef.current?.contains(t) && !btnRef.current?.contains(t)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  const actual = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  return (
    <div className="relative flex-none">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        aria-label={es ? "Cambiar idioma" : "Change language"}
        title={es ? "Cambiar idioma" : "Change language"}
        className={`inline-flex ${sizeCls} cursor-pointer items-center gap-1.5 rounded-[4px] border-0 bg-transparent px-2.5 text-[12px] font-semibold tracking-wide text-[var(--ink-2)] outline-none transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--ink)_6%,transparent)] hover:text-[var(--ink)] focus-visible:border-[rgb(var(--divider)/0.24)] focus-visible:bg-[color-mix(in_srgb,var(--ink)_6%,transparent)] focus-visible:text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]`}
      >
        <GlobeIcon />
        <span className="tnum">{actual.code2}</span>
        <svg
          width="8"
          height="8"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden
          style={{
            transition: "transform 0.18s var(--ease-suave)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
          <div
            ref={popRef}
            id={panelId}
            data-panel-idiomas=""
            role="group"
            aria-label={es ? "Idiomas" : "Languages"}
            // Mismo material que el menú «Producto».
            className="tj-cae tj-cristal tj-cristal--denso tj-cristal--menu absolute right-0 z-50 min-w-[168px] rounded-[6px] p-1"
            style={{ position: "absolute", top: "calc(100% + 8px)" }}
          >
            {LANGUAGES.map((l) => {
              const activo = l.code === lang;
              return (
                <button
                  key={l.code}
                  type="button"
                  lang={l.code}
                  aria-pressed={activo}
                  onClick={() => {
                    setLang(l.code);
                    setOpen(false);
                    btnRef.current?.focus();
                  }}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-[4px] border-0 bg-transparent px-2.5 py-2 text-left outline-none transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--ink)_6%,transparent)] focus-visible:bg-[color-mix(in_srgb,var(--ink)_6%,transparent)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]"
                  style={{ fontFamily: "inherit" }}
                >
                  <span
                    className="tnum w-6 shrink-0 text-[12px] font-semibold tracking-wide"
                    style={{ color: activo ? "rgb(var(--accent-base))" : "var(--ink-3)" }}
                  >
                    {l.code2}
                  </span>
                  <span
                    className="flex-1 text-[14px]"
                    style={{ color: activo ? "var(--ink)" : "var(--ink-2)" }}
                  >
                    {l.native}
                  </span>
                  {/* Un check y no un fondo: el fondo ya lo usa el hover. */}
                  {activo && (
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
                      <path
                        d="M3.5 8.5l3 3 6-7"
                        stroke="rgb(var(--accent-base))"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
      )}
    </div>
  );
}

function GlobeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 8h12M8 2c1.7 1.8 2.6 3.9 2.6 6S9.7 12.2 8 14C6.3 12.2 5.4 10.1 5.4 8S6.3 3.8 8 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}

/** BrandMark — el glifo de la marca, sin placa. */
function BrandMark() {
  return <BrandGlyph size={26} className="shrink-0" />;
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type=\"hidden\"])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
  "audio[controls]",
  "video[controls]",
  "details > summary:first-of-type",
].join(",");

function getFocusables(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((el) => {
    const rects = el.getClientRects();
    if (rects.length === 0) return false;
    const { width, height } = rects[0];
    return width > 0 && height > 0;
  });
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 1.5v1.5M8 13v1.5M1.5 8h1.5M13 8h1.5M3.4 3.4l1 1M11.6 11.6l1 1M3.4 12.6l1-1M11.6 4.4l1-1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M13 9.2A5 5 0 0 1 6.8 3 5 5 0 1 0 13 9.2z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  );
}
