"use client";

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { Link } from "@/components/tj/LocaleLink";
import { usePathname } from "next/navigation";
import { useLang, type Lang } from "@/lib/i18n";
import { sinPrefijoEn } from "@/lib/locale";
import { useTheme } from "@/lib/theme";
import { BrandGlyph } from "@/components/tj/BrandGlyph";
import { ANIO_PUBLICACION } from "@/lib/publicacion";
import { useAtajoPaleta } from "@/hooks/use-tecla-mando";

/**
 * Navbar — barra edge-to-edge con material de papel translúcido (e-reader).
 *
 * T3b — la barra y el drawer adoptan `.tj-paper` / `.tj-paper-dense`
 * (papel cálido translúcido: 72%/86% surface, blur 10px + saturate
 * 140%, grano de papel SVG, catch-light inset). Reemplaza al cristal
 * acrílico frío anterior. El megamenú añade `.tj-paper-glow` para un
 * halo champagne tenue en el borde superior. Al hacer scroll la barra
 * gana sombra, pero NO cambia de altura (ver `ALTURA_BARRA`) ni pasa a
 * opaca: el papel sigue dejando intuir el atlas animado del hero, que
 * es justo lo que pide el producto.
 *
 * R28 — reescritura de la barra. Los tres problemas estructurales que
 * arrastraba la versión anterior y que esta corrige:
 *
 *  1. MAQUETA ARBITRARIA. Antes: cinco hijos en un `justify-between`
 *     con dos separadores hairline intercalados. El espacio sobrante se
 *     repartía entre huecos sin jerarquía, así que la navegación no
 *     quedaba centrada ni anclada a nada — solo "en algún punto" entre
 *     la marca y el clúster. Ahora: rejilla de tres zonas
 *     `[1fr_auto_1fr]`, con la navegación ópticamente centrada en la
 *     página pase lo que pase con el ancho de la marca o del clúster.
 *     Los separadores sobran (la rejilla ya estructura) y se retiran.
 *
 *  2. HOVER EN JAVASCRIPT, TECLADO SIN FEEDBACK. Antes cada enlace
 *     llevaba `onMouseEnter`/`onMouseLeave` mutando `el.style` a mano.
 *     Eso (a) salta de golpe en vez de interpolar, (b) deja el estado
 *     pegado si el puntero sale durante una navegación y (c) —el fallo
 *     serio— NO se dispara con foco de teclado, así que quien tabula no
 *     veía absolutamente nada. Ahora el realce y el foco se declaran en
 *     CSS con `hover:` / `focus-visible:`, de modo que ratón y teclado
 *     reciben exactamente el mismo trato.
 *
 *  3. INDICADOR ACTIVO REDUNDANTE. Antes la ruta activa se marcaba a la
 *     vez con fondo Y con barra inferior. Ahora el fondo es exclusivo
 *     del hover/foco (transitorio) y la regla de acento es exclusiva de
 *     "dónde estás" (persistente). Dos señales, dos significados.
 *
 *  4. R28-b — VUELTA DE TUERCA INSTITUCIONAL. Una versión intermedia
 *     usaba una píldora compartida con `layoutId` que VIAJABA entre
 *     elementos con muelle. Resolvía la accesibilidad, pero el gesto es
 *     de "SaaS premium" y la web se posiciona como mesa institucional:
 *     ahí el realce se enciende, no se desliza. Retirada. En la misma
 *     línea: radios de 4 px (el radio de control real de la app) en vez
 *     de `rounded-full`, CTA sin sheen ni sombra de color, megamenú sin
 *     muelle ni escalonado, y el cambio de tema sin voltereta.
 *
 * Además: al hacer scroll la barra gana sombra y filo —nunca altura,
 * ver `ALTURA_BARRA`—, y una hairline de acento en el borde inferior
 * traza el progreso de lectura de la página — coherente con un producto
 * que va de medir.
 *
 * El material se diseñó para leerse sobre el ojo WebGL del fondo en
 * AMBOS temas: en oscuro `--surface` (#141618) aporta el scrim; en
 * claro `--surface` (#fbfaf7) aporta la base translúcida que aísla el
 * cromatismo del iris sin competir con él. T3b cambia el cristal
 * acrílico por papel cálido translúcido — mismo `--surface`, mismo
 * aislamiento, pero con fibra de papel (grano SVG) y catch-light de
 * lámina en vez de reflejo frío de cristal.
 *
 * El drawer móvil (focus-trap, scroll-lock, Escape, cierre por ruta) se
 * conserva íntegro — es maquinaria a11y probada y no se toca.
 *
 * El reloj arranca en "--:--:--" en servidor y en el primer render de
 * cliente, y solo tickea dentro de un efecto: la hidratación nunca ve
 * horas distintas (cero mismatch).
 */
/* ── LA BARRA MIDE LO MISMO SIEMPRE ────────────────────────────────────
   68 px, con scroll y sin él. Antes se condensaba a 56 al bajar diez
   píxeles, y esa condensación no es gratis:

     · MUEVE LA MAQUETA MIENTRAS SE LEE. La barra es `fixed`, así que no
       empuja al contenido, pero sí desplaza doce píxeles hacia arriba
       todo lo que ella misma contiene —marca, navegación, CTA— justo en
       el instante en que el ojo va a por un enlace. En un marco que no
       es contenido, ese movimiento no informa de nada.
     · DESCUADRA EL DESTINO DE LOS ANCLAJES. `scroll-padding-top` es una
       constante (5rem) y las secciones traen su `scroll-mt-*` fijo,
       pero el obstáculo que esas holguras esquivan medía 68 o 56 según
       el momento. Con una altura fija, la holgura declarada vuelve a
       corresponderse con el obstáculo real.

   Se conserva lo que SÍ cambia al desplazar y no mueve un píxel: la
   sombra y el filo ganan profundidad, que es la señal de «hay
   contenido pasando por debajo». La altura es el marco; la sombra, la
   relación con lo que hay detrás. Lo vigila `tests/barra-fija.test.ts`. */
const ALTURA_BARRA = 68;

const PRODUCT_ITEMS: {
  href: string;
  labelEs: string;
  labelEn: string;
  descEs: string;
  descEn: string;
  grupo: "producto" | "laboratorio";
  icon: React.ReactNode;
}[] = [
  {
    href: "/features",
    labelEs: "Características",
    labelEn: "Features",
    descEs: "Vista general del producto",
    descEn: "Product overview",
    grupo: "producto",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect x="2" y="2" width="5" height="5" rx="1" fill="currentColor" />
        <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
        <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
        <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  },
  {
    href: "/features/metricas",
    labelEs: "Métricas",
    labelEn: "Metrics",
    descEs: "Sharpe, profit factor, expectancy",
    descEn: "Sharpe, profit factor, expectancy",
    grupo: "producto",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M2 13V7M6 13V3M10 13V9M14 13V5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/features/disciplina",
    labelEs: "Disciplina",
    labelEn: "Discipline",
    descEs: "El Guardián frena antes del error",
    descEn: "The Guardian brakes before the error",
    grupo: "producto",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M8 1.6 2.9 3.8v3.5c0 3.1 2.2 5.5 5.1 6.5 2.9-1 5.1-3.4 5.1-6.5V3.8L8 1.6Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/features/seguridad",
    labelEs: "Seguridad",
    labelEn: "Security",
    descEs: "Local-first, sin nube ni cuentas",
    descEn: "Local-first, no cloud, no accounts",
    grupo: "producto",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect x="2.5" y="6.5" width="11" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M5 6.5V4.5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/test",
    labelEs: "Test de disciplina",
    labelEn: "Discipline test",
    descEs: "Mídete en cinco ejes, sin email",
    descEn: "Measure yourself across five axes, no email",
    grupo: "laboratorio",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M8 14.5A6.5 6.5 0 1 1 8 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M8 8l4-3.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="8" cy="8" r="1.4" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "/herramientas",
    labelEs: "Herramientas",
    labelEn: "Tools",
    descEs: "Siete calculadoras, gratis y sin registro",
    descEn: "Seven calculators, free and with no sign-up",
    grupo: "laboratorio",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M10.4 2.3a3.4 3.4 0 0 0-4 4.4L2.6 10.5a1.3 1.3 0 0 0 1.8 1.8l3.8-3.8a3.4 3.4 0 0 0 4.4-4l-2 2-1.6-1.6 2-1.6Z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/glosario",
    labelEs: "Glosario",
    labelEn: "Glossary",
    descEs: "51 términos explicados sin rodeos",
    descEn: "51 terms explained without waffle",
    grupo: "laboratorio",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M3 2.6h6.2a2 2 0 0 1 2 2v8.8H5a2 2 0 0 1-2-2V2.6Z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <path d="M5.4 5.6h3.6M5.4 8h3.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
];

const DRAWER_GRUPOS: {
  id: "producto" | "operativa" | "laboratorio" | "empresa";
  es: string;
  en: string;
}[] = [
  { id: "producto", es: "Producto", en: "Product" },
  { id: "operativa", es: "Operativa", en: "Trading" },
  { id: "laboratorio", es: "Laboratorio", en: "Lab" },
  { id: "empresa", es: "Empresa", en: "Company" },
];

const DRAWER_LINKS: {
  href: string;
  labelEs: string;
  labelEn: string;
  grupo: (typeof DRAWER_GRUPOS)[number]["id"];
  icon: React.ReactNode;
}[] = [
  {
    href: "/features",
    labelEs: "Características",
    labelEn: "Features",
    grupo: "producto",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect x="2" y="2" width="5" height="5" rx="1" fill="currentColor" />
        <rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
        <rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
        <rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  },
  {
    href: "/demo",
    labelEs: "Demo",
    labelEn: "Demo",
    grupo: "producto",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M6.5 6.5v3l2.8-1.5-2.8-1.5Z" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "/traders/manual",
    labelEs: "Operativa manual",
    labelEn: "Manual trading",
    grupo: "operativa",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M3 13V5.5L8 3l5 2.5V13" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <path d="M8 7.5v5.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/traders/prop-firms",
    labelEs: "Prop firms",
    labelEn: "Prop firms",
    grupo: "operativa",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
        <rect x="2.5" y="3.5" width="11" height="9" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
        <path d="M2.5 6.5h11M6 9.5h4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/beta",
    labelEs: "Acceso anticipado",
    labelEn: "Early access",
    grupo: "operativa",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M3.5 12.5 8 3.5l4.5 9H3.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: "/about",
    labelEs: "Acerca de",
    labelEn: "About",
    grupo: "empresa",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 7v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="8" cy="5" r="0.85" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "/test",
    labelEs: "Test de disciplina",
    labelEn: "Discipline test",
    grupo: "laboratorio",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path d="M8 14.5A6.5 6.5 0 1 1 8 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <path d="M8 8l4-3.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="8" cy="8" r="1.4" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "/herramientas",
    labelEs: "Herramientas",
    labelEn: "Tools",
    grupo: "laboratorio",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M10.4 2.3a3.4 3.4 0 0 0-4 4.4L2.6 10.5a1.3 1.3 0 0 0 1.8 1.8l3.8-3.8a3.4 3.4 0 0 0 4.4-4l-2 2-1.6-1.6 2-1.6Z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/glosario",
    labelEs: "Glosario",
    labelEn: "Glossary",
    grupo: "laboratorio",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
        <path
          d="M3 2.6h6.2a2 2 0 0 1 2 2v8.8H5a2 2 0 0 1-2-2V2.6Z"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <path d="M5.4 5.6h3.6M5.4 8h3.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: "/faq",
    labelEs: "FAQ",
    labelEn: "FAQ",
    grupo: "laboratorio",
    icon: (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden>
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
        <path d="M6.3 6.4c.1-1 .9-1.6 1.9-1.6 1.1 0 1.8.6 1.8 1.4 0 .7-.4 1-1 1.3-.6.3-.8.5-.8 1.1v.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        <circle cx="8" cy="11.3" r="0.85" fill="currentColor" />
      </svg>
    ),
  },
];

export function Navbar() {
  const { t, lang } = useLang();
  const es = lang === "es";
  const { theme, toggleTheme } = useTheme();
  // «Ctrl+K» o «⌘K» según el teclado de quien mira. Ver `useAtajoPaleta`.
  const atajo = useAtajoPaleta();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  /* El cajón no existe hasta que alguien lo abre por primera vez, y a
     partir de ahí se queda montado para siempre.

     Las dos mitades importan. Si se montara desde el principio, sus
     ~24 KB de menú viajarían en el HTML de las 155 páginas: medido,
     3,7 MB de más en el sitio entero para un panel que la mayoría de
     visitantes no abre nunca. Y si se desmontara al cerrarlo, no habría
     animación de salida — y ésta se ve, porque son 300 px deslizándose
     en la pantalla donde más se usa.

     Montar en la primera apertura y no soltar da las dos cosas: cero
     peso hasta que hace falta, y salida animada desde el primer cierre. */
  const [cajonMontado, setCajonMontado] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  /** Elemento de navegación bajo el puntero/foco — mueve la píldora. */
  const [hovered, setHovered] = useState<string | null>(null);
  const megaCloseTimer = useRef<number | null>(null);

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const megaButtonRef = useRef<HTMLButtonElement>(null);
  /** El disparador y su panel: lo que cuenta como «dentro» del menú. */
  const megaWrapRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Megamenú: hover con retardo de cierre + Escape. El retardo evita
  // que el panel se cierre al cruzar el hueco entre botón y panel.
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

  /* ── EL CLIC EN «PRODUCTO» CERRABA EL MENÚ QUE EL RATÓN ACABABA DE ABRIR
     El disparador se abría al pasar por encima y el clic ALTERNABA el
     estado. Con un ratón esas dos cosas ocurren siempre seguidas: mueves
     el cursor hasta «Producto» —el panel se abre—, haces clic porque
     tiene una punta de flecha y parece un desplegable, y el clic lo
     cierra. Y no se vuelve a abrir mientras no saques el cursor y
     vuelvas a entrar, porque el hover ya no dispara nada estando quieto.
     Comprobado en el sitio compilado: abrir por hover, pulsar, panel
     fuera.

     Quien usa el ratón no puede llegar al menú de Producto haciendo lo
     más natural del mundo, que es pulsarlo.

     La regla pasa a depender de cómo se activó:
       · Con el puntero encima, el clic sólo puede ABRIR. Cerrar es
         apartarse o pulsar Escape, que es lo que ya hace cualquiera con
         un menú que se abre al pasar por encima.
       · Con el teclado (`detail === 0`: ni ratón ni dedo) sigue
         alternando, que ahí sí es el gesto correcto — no hay hover que
         lo haya abierto antes.

     Y como en táctil no hay «apartarse», se añade el cierre al tocar
     fuera. Sin él, este cambio dejaría el panel clavado en una tableta
     ancha: el menú existe por encima de 1.120 px y las hay. */
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
        // Devuelve el foco al disparador "Producto" para que quien usa
        // teclado conserve su sitio en el orden de tabulación.
        megaButtonRef.current?.focus();
      }
    };
    /* `pointerdown` y no `click`: si se esperara al clic, el elemento que
       hay debajo ya habría recibido el suyo con el panel todavía
       abierto. En captura, para que llegue aunque algo más lo detenga. */
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

  // Focus trap del drawer móvil (maquinaria a11y intacta).
  useEffect(() => {
    if (!mobileOpen) return;
    const raf = requestAnimationFrame(() => {
      const drawer = drawerRef.current;
      if (!drawer) return;
      const focusables = getFocusables(drawer);
      const target = focusables[0] ?? drawer;
      target.focus();
    });
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
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      /* La regla `exhaustive-deps` avisa de leer `.current` en la limpieza y
         propone copiarlo a una variable al entrar en el efecto. Aquí eso
         sería PEOR: lo que se quiere es devolver el foco al botón que hay
         cuando el cajón se cierra. Si entre medias el botón se ha
         desmontado —al pasar de móvil a escritorio— `current` vale null y
         no se enfoca nada, que es lo correcto; con la copia intentaríamos
         enfocar un nodo que ya no está en el documento y el foco caería al
         `<body>`, mandando al lector de pantalla al principio de la página. */
      // eslint-disable-next-line react-hooks/exhaustive-deps
      menuButtonRef.current?.focus();
    };
  }, [mobileOpen]);

  // Scroll-lock del body con el drawer abierto. También marca
  // `data-drawer-open` en <body> para que el banner de cookies y el
  // botón BackToTop se OCULTEN mientras el drawer está abierto — antes
  // el cookie sheet se veía difuminado a través del backdrop y leía
  // como "compitiendo" con el menú.
  //
  // `overflow: hidden` a secas NO basta, y justo falla donde este menú
  // vive: Safari en iPhone lo ignora para el gesto táctil. El síntoma es
  // el clásico —abres el menú, deslizas el dedo, y la página de debajo
  // se desplaza por detrás del panel; al cerrar apareces en otro punto
  // de la página, sin haber tocado nada del contenido.
  //
  // Lo que sí lo frena es sacar el body del flujo con `position: fixed`.
  // Eso tiene un precio que hay que pagar a mano: un body fijo pierde su
  // desplazamiento y la página saltaría al principio. Por eso se anota
  // la altura antes de fijar, se compensa con `top: -Ypx` para que se
  // siga viendo exactamente lo mismo, y se restaura al cerrar.
  //
  // El `behavior: "instant"` del regreso no es un adorno: `html` lleva
  // `scroll-behavior: smooth`, así que sin él la vuelta se animaría y
  // cerrar el menú se vería como un viaje por la página entera.
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

  // Cerrar drawer y megamenú al cambiar de ruta. `hovered` también se
  // limpia: si no, la píldora se quedaba encallada bajo el elemento que
  // acabas de pulsar cuando el puntero ya no está encima.
  useEffect(() => {
    setMobileOpen(false);
    setMegaOpen(false);
    setHovered(null);
  }, [pathname]);

  const productItems = PRODUCT_ITEMS;
  const drawerLinks = DRAWER_LINKS;

  /** ¿Esta ruta (o una subruta suya) es la página actual?
   *
   * `sinPrefijoEn` antes de comparar: en inglés, `pathname` viene como
   * `/en/pricing`, pero los enlaces de este menú siguen escritos como
   * `/pricing` a secas —es `LocaleLink` quien añade el prefijo al
   * navegar, no antes—. Sin este descuento, ningún elemento del menú se
   * habría marcado nunca como activo mientras se navegaba en inglés. */
  const rutaActual = sinPrefijoEn(pathname);
  const isActive = (href: string) =>
    rutaActual === href || rutaActual.startsWith(href + "/");

  /**
   * Realce compartido. Una línea inferior fina que crece desde el centro
   * al pasar el puntero o al recibir foco de teclado. Sustituye a la
   * píldora de fondo de versiones previas: un trazo es más sobrio que un
   * relleno y, sobre todo, NO compite con la regla de acento persistente
   * que marca la ruta activa — dos señales, dos soportes distintos.
   *
   * La animación vive en CSS (`group-hover` / `group-focus-within`), no en
   * el estado `hovered`: así el trazo se interpola al entrar Y al salir,
   * algo que la versión condicional (`hovered === key && …`) no podía
   * hacer porque el nodo desaparecía de golpe al desmontar.
   *
   * Se suprime cuando el enlace está activo: ahí manda la barra de
   * acento y sumarle un segundo trazo a 6 px de distancia habría sido
   * ruido visual, no refinamiento.
   */
  const hoverUnderline = (active: boolean) => (
    <span
      aria-hidden
      className={`pointer-events-none absolute bottom-[6px] left-[15px] right-[15px] h-px origin-center scale-x-0 transition-transform duration-200 ease-[var(--ease-suave)] ${
        active ? "" : "group-hover:scale-x-100 group-focus-within:scale-x-100"
      }`}
      style={{ background: "color-mix(in srgb, var(--ink) 22%, transparent)" }}
    />
  );

  /** Regla de acento persistente que marca la ruta actual. */
  const activeBar = (
    <span
      aria-hidden
      className="absolute -bottom-[6px] left-2 right-2 h-[2px]"
      style={{ background: "rgb(var(--accent-base))" }}
    />
  );

  const navLink = (href: string, label: string) => {
    const active = isActive(href);
    return (
      <div
        key={href}
        className="group relative"
        onMouseEnter={() => setHovered(href)}
      >
        {hoverUnderline(active)}
        <Link
          href={href}
          aria-current={active ? "page" : undefined}
          onFocus={() => setHovered(href)}
          /* `whitespace-nowrap`: un rótulo de navegación no se parte
             nunca. Sin esto, «Prop firms» se rompía en dos renglones en
             cuanto la barra se estrechaba, y una entrada de menú a dos
             líneas rompe la altura de toda la fila y se lee como un
             fallo de maqueta. Si algún día no cabe, lo que debe pasar es
             que la barra pase al menú lateral — no que las palabras se
             partan. */
          className="relative z-10 block whitespace-nowrap rounded-[2px] px-3 py-[9px] text-sm transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]"
          style={{ color: active || hovered === href ? "var(--ink)" : "var(--ink-2)" }}
        >
          {label}
        </Link>
        {active && activeBar}
      </div>
    );
  };

  const productActive = rutaActual.startsWith("/features");

  /* Aquí, dentro del JSX, vivía un <style> con alcance de componente que
     neutralizaba las transiciones del navbar bajo prefers-reduced-motion.
     Se ha retirado por dos motivos, y los dos estaban escritos en su
     propio comentario:

       - Se justificaba diciendo que framer-motion respetaría la
         preferencia para sus propias transiciones. Este componente ya no
         usa framer-motion.
       - Y lo que hacía ya lo hace globals.css con su selector universal y
         su !important, para el sitio entero: era un subconjunto exacto,
         veinte líneas repetidas que había que acordarse de mantener a la
         vez que el original. */
  return (
    <>
      <header data-navbar-root className="fixed inset-x-0 top-0 z-50">
      <nav
        aria-label={es ? "Principal" : "Main"}
        // T3b — papel cálido translúcido. `tj-paper` aporta el material
        // (backdrop-blur 10px + saturate 140%, grano de papel SVG,
        // catch-light inset); `tj-paper-dense` sube la opacidad de 72%
        // a 86% (82% en claro) para que el texto del navbar siga siendo
        // legible AA sobre el hero animado sin renunciar a la fibra de
        // papel. Se retira el `background`/`backdropFilter` inline
        // previo: ahora manda el material. Al desplazar sólo cambian la
        // sombra y el filo —la altura es fija, ver `ALTURA_BARRA`— y la
        // barra tampoco pasa a opaca: el atlas sigue intuyéndose a
        // través del papel. `will-change: backdrop-filter` y
        // `translateZ(0)` vienen heredados de `.tj-paper`
        // (globals.css).
        className="tj-paper tj-paper-dense relative flex w-full items-center border-b px-5 md:px-8"
        style={{
          height: ALTURA_BARRA,
          borderColor: "rgb(var(--divider) / 0.1)",
          boxShadow: scrolled
            ? "inset 0 1px 0 rgb(var(--divider) / 0.16), 0 14px 40px -16px rgb(0 0 0 / 0.55)"
            : "inset 0 1px 0 rgb(var(--divider) / 0.14), 0 6px 20px -12px rgb(0 0 0 / 0.4)",
          transition:
            "box-shadow 0.3s var(--ease-suave), border-color 0.3s var(--ease-suave)",
        }}
      >
        {/* Rejilla de tres zonas: la navegación queda ópticamente
            centrada en la página con independencia de lo que midan la
            marca (izquierda) y el clúster de utilidades (derecha).

            DOS columnas en móvil y tres a partir de `md`, y el motivo es
            de fondo: la zona central se oculta en móvil con `hidden`, es
            decir `display:none`, y un hijo así NO ocupa su celda — sale
            de la rejilla por completo. Con tres columnas declaradas y
            solo dos hijos visibles, el botón de menú heredaba la celda
            del centro y aparecía en mitad de la barra, con 178 px de
            hueco a su derecha, en vez de pegado al borde.

            No se arregla dándole al botón una alineación propia: la
            celda equivocada seguiría siendo la del centro. Se arregla
            declarando la rejilla que de verdad hay en cada tamaño. */}
        {/* ── LOS LADOS TOMAN LO SUYO; EL CENTRO, EL RESTO ──────────────
            La rejilla era `1fr auto 1fr`, buscando que la navegación
            quedara ópticamente centrada en la página con independencia
            de lo que midieran la marca y el clúster de utilidades. El
            problema es que en CSS `1fr` significa `minmax(auto, 1fr)`, y
            ese mínimo `auto` es el ANCHO DEL CONTENIDO: las laterales se
            niegan a encogerse, así que cuando la ventana estrecha la que
            se queda sin sitio es la del centro. Y como va con
            `justify-self-center`, su contenido desborda por los DOS
            lados y se monta encima de los vecinos.

            Se veía a 1.267 px: la caja de «CountPips» terminaba en 212 y
            la de «Producto» empezaba en 199 — trece píxeles por debajo,
            los dos textos pegados, sin el hueco que sí respetaban los
            demás enlaces entre sí.

            `auto · minmax(0,1fr) · auto` invierte el reparto: marca y
            utilidades piden lo que miden, y la navegación se lleva lo
            que sobra y se centra DENTRO de ese hueco. Deja de estar
            centrada respecto a la página entera —que era lo que no cabía
            a la vez que todo lo demás— y pasa a estar centrada respecto
            al espacio disponible, que es lo que sí se sostiene a
            cualquier ancho. Ningún elemento pisa a otro y el `gap-4`
            vuelve a cumplirse en las dos junturas. */}
        {/* ── LA BARRA PEDÍA 1.100 px DENTRO DE 1.080 ───────────────────
            Medido a 1.440: marca 137 + navegación 489 + utilidades 442 +
            dos canales de 16 = 1.100 px de contenido dentro de un tope de
            1.080. Veinte de más, todos los días, en TODOS los anchos por
            encima de 1.280 — el tope es fijo, así que ensanchar la
            ventana no daba ni un píxel.

            Con esa cuenta, la zona central —que va centrada— se salía
            diez píxeles por cada lado y dejaba la marca a SEIS del primer
            enlace, cuando el canal declarado son dieciséis. Nadie lo
            había visto porque seis sigue siendo positivo: los dos textos
            no llegaban a tocarse. Bastó con que la etiqueta del atajo
            pasara de «⌘K» a «Ctrl+K» —veintidós píxeles más, y son los
            correctos en un teclado de Windows— para que el saldo se
            volviera negativo y la comprobación de humo cazara el solape
            en las diecinueve rutas de escritorio.

            El arreglo no es raspar píxeles del contenido: es que 1.080 es
            la MANCHA DE LECTURA y esta barra no es texto que se lee, es
            el marco de la página. Se le da su propio tope de 1.180, que
            deja 80 px de holgura real y sigue muy dentro de los 1.376
            disponibles a 1.440. Por debajo de 1.180 no cambia nada,
            porque manda el ancho de la ventana. */}
        <div className="mx-auto grid w-full max-w-[1180px] grid-cols-[minmax(0,1fr)_auto] items-center gap-4 min-[1120px]:grid-cols-[auto_minmax(0,1fr)_auto]">
          {/* ZONA 1 — Marca. min-h-[44px] garantiza el suelo táctil en
              móvil (el glifo + texto solos medían 32 px). */}
          <Link
            href="/"
            className="flex min-h-[44px] min-w-0 items-center gap-[11px] justify-self-start rounded-[2px] px-1 outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]"
            style={{ color: "var(--ink)" }}
            aria-label={t("appName")}
          >
            <BrandMark />
            <span
              className="truncate font-serif"
              style={{ fontSize: 19, fontWeight: 500, letterSpacing: "-0.01em" }}
            >
              {t("appName")}
            </span>
          </Link>

          {/* ZONA 2 — Navegación centrada: Producto (megamenú) · Demo · Precios */}
          <div
            className="hidden items-center gap-0.5 justify-self-center min-[1120px]:flex"
            onMouseLeave={() => setHovered(null)}
          >
            <div
              ref={megaWrapRef}
              className="group relative"
              onMouseEnter={() => {
                setHovered("product");
                megaEnter();
              }}
              onMouseLeave={megaLeave}
            >
              {hoverUnderline(productActive)}
              <button
                type="button"
                id="navbar-producto-trigger"
                ref={megaButtonRef}
                /* NO se abre en `pointerdown`, y conviene dejar escrito
                   por qué, porque la regla general dice lo contrario.
                   «Los menús deben abrirse en la pulsación y no en el
                   clic» vale para menús que se abren PULSANDO: ahí el
                   `click` no llega hasta que sueltas, y ese retardo se
                   nota. Este menú no es de esos — se abre solo al pasar
                   el ratón por encima (`megaEnter`), así que cuando el
                   dedo baja ya está abierto.
                   Y por eso el clic tampoco puede alternar el estado a
                   secas: cerraba el panel que el hover acababa de abrir.
                   El porqué completo, en `megaClick`. */
                onClick={megaClick}
                onFocus={() => setHovered("product")}
                aria-expanded={megaOpen}
                aria-haspopup="menu"
                className="relative z-10 inline-flex cursor-pointer items-center gap-1.5 rounded-[2px] border-0 bg-transparent px-[15px] py-[9px] text-sm outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]"
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

              {/* El panel se monta y se desmonta de verdad, en vez de
                  conmutar `visibility`: así no queda en el árbol de
                  accesibilidad estando cerrado. La entrada la anima el
                  CSS (`.tj-cae`); la salida no se anima, y es
                  deliberado — un menú se cierra en cuanto eliges, y
                  coreografiar su marcha no compensaba arrastrar una
                  biblioteca de animación a las 155 páginas del sitio. */}
              {megaOpen && (
                  <div
                    role="menu"
                    aria-labelledby="navbar-producto-trigger"
                    /* Navegación con flechas. Un menú abierto tiene que
                       poder recorrerse con ↑ y ↓ — es lo que espera
                       cualquiera que use el teclado, y su ausencia es de
                       las cosas que hacen que un menú se sienta a medio
                       hacer aunque por fuera esté bien dibujado.
                       Antes solo se podía tabular, que recorre la página
                       entera en vez de quedarse dentro del menú.
                       Inicio/Fin saltan a los extremos, y el recorrido
                       da la vuelta al llegar al final: en una lista
                       corta, toparse con un tope es peor que ciclar. */
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
                    // T3b — el panel flota como una hoja de papel cálido
                    // translúcida (72% surface, blur 10px, grano SVG) con
                    // un halo champagne muy tenue en el borde superior
                    // (.tj-paper-glow ::before). Más translúcido que el
                    // navbar a propósito: aquí el texto es grande y el
                    // contraste AA se preserva incluso a 72%. Se retira
                    // el background/backdropFilter inline (mandaba el
                    // 96% opaco previo) para que el material luzca.
                    //
                    // P8 — `position: "absolute"` inline es NO NEGOCIABLE.
                    // `.tj-paper` en globals.css declara `position: relative`
                    // (linea 3298) para que su `::before` (.tj-paper-glow)
                    // y sus inset box-shadows se anclen al propio elemento.
                    // Esa regla tiene la misma especificidad que la utilidad
                    // `absolute` de Tailwind, pero cae MÁS TARDE en el
                    // cascade (globals.css se importa después de
                    // @tailwindcss), así que la hereda y el panel acaba
                    // renderizándose en flujo normal — ocupando el espacio
                    // debajo del botón en vez de flotar. El panel medía
                    // y=-18..123 (solapando el navbar 0..56) en lugar de
                    // y=70..211 (flotando debajo). Inline style gana a
                    // cualquier regla externa sin `!important`, así que
                    // este es el fix mínimo y estable: ni tocar globals.css
                    // ni añadir `!absolute` (que rompería el patrón si
                    // Tailwind v4 cambiara el modificador).
                    /* `tj-paper-dense` —el papel OPACO— y no `tj-paper` a
                       secas: este panel se abre sobre los titulares de la
                       portada, que son de los elementos más grandes y
                       contrastados del sitio, y a través del papel
                       corriente se leían enteros por debajo de sus
                       entradas. Un menú se pone delante de la página; si
                       la deja ver, las dos compiten por el mismo sitio. */
                    className="tj-cae tj-paper tj-paper-dense tj-paper-glow absolute left-1/2 w-[640px] max-w-[calc(100vw-3rem)] origin-top rounded-[2px] border p-0"
                    style={{
                      position: "absolute",
                      top: "calc(100% + 14px)",
                      translate: "-50% 0",
                      borderColor: "rgb(var(--divider) / 0.14)",
                      boxShadow:
                        "0 1px 2px rgb(0 0 0 / 0.5), 0 20px 48px -15px rgb(0 0 0 / 0.65)",
                      contain: "layout paint",
                      willChange: "transform, opacity",
                    }}
                  >
                    {/* Punta que ancla el panel a su disparador */}
                    <span
                      aria-hidden
                      className="absolute left-1/2 -top-[6px] h-[11px] w-[11px] -translate-x-1/2 rotate-45 rounded-[2px] border-l border-t"
                      style={{
                        borderColor: "rgb(var(--divider) / 0.14)",
                        background: "var(--paper-dense)",
                      }}
                    />
                    {(() => {
                      const fila = (item: (typeof productItems)[number]) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          role="menuitem"
                          onClick={() => setMegaOpen(false)}
                          className="group flex gap-[11px] rounded-[2px] px-2.5 py-[9px] outline-none transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--ink)_5%,transparent)] focus-visible:bg-[color-mix(in_srgb,var(--ink)_5%,transparent)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]"
                          style={{ color: "var(--ink)" }}
                          onMouseEnter={() => {
                            const id = "prefetch-" + item.href.replace(/[^a-z0-9]/gi, "-");
                            if (!document.getElementById(id)) {
                              const link = document.createElement("link");
                              link.id = id;
                              link.rel = "prefetch";
                              link.href = item.href;
                              link.as = "document";
                              document.head.appendChild(link);
                            }
                          }}
                        >
                          <span
                            className="grid flex-none place-items-center rounded-[2px]"
                            style={{
                              width: 28,
                              height: 28,
                              color: "rgb(var(--accent-base))",
                            }}
                          >
                            {item.icon}
                          </span>
                          <span>
                            <span className="block text-[13px] font-semibold">
                              {es ? item.labelEs : item.labelEn}
                            </span>
                            <span
                              className="mt-0.5 block text-[11.5px] leading-[1.4]"
                              style={{ color: "var(--ink-2)" }}
                            >
                              {es ? item.descEs : item.descEn}
                            </span>
                          </span>
                        </Link>
                      );
                      return (
                        <>
                          <div className="relative grid grid-cols-2 divide-x divide-[rgb(var(--divider)/0.10)] p-2">
                            <div className="pr-2">
                              <p className="tnum px-2.5 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-tertiary">
                                {es ? "Producto" : "Product"}
                              </p>
                              {productItems.filter((i) => i.grupo === "producto").map(fila)}
                            </div>
                            <div className="pl-2">
                              <p className="tnum px-2.5 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-tertiary">
                                {es ? "Laboratorio" : "Lab"}
                              </p>
                              {productItems.filter((i) => i.grupo === "laboratorio").map(fila)}
                            </div>
                          </div>
                          <div className="flex items-center justify-between border-t border-[rgb(var(--divider)/0.10)] px-4 py-2.5">
                            <span className="tnum text-[11px] text-tertiary">
                              {es
                                ? `${atajo} · buscar cualquier sección`
                                : `${atajo} · search any section`}
                            </span>
                            <Link
                              href="/demo"
                              role="menuitem"
                              onClick={() => setMegaOpen(false)}
                              className="tnum text-[11.5px] font-semibold outline-none hover:underline focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]"
                              style={{ color: "rgb(var(--accent-base))" }}
                            >
                              {es ? "Abrir la demo →" : "Open the demo →"}
                            </Link>
                          </div>
                        </>
                      );
                    })()}
                  </div>
              )}
            </div>

            {navLink("/demo", "Demo")}
            {navLink("/traders/manual", es ? "Manual" : "Manual")}
            {navLink("/traders/prop-firms", "Prop firms")}
            {navLink("/beta", es ? "Acceso" : "Access")}
            {navLink("/faq", es ? "Recursos" : "Resources")}
          </div>

          {/* ZONA 3 — Utilidades: tema · idioma · CTA · hamburguesa.
              En móvil (<768px) el tema/idioma/⌘K/CTA se OCULTAN aquí
              porque están duplicados dentro del drawer a ≥44 px (ver
              "Preferencias" más abajo). Antes mostraban a 36 px en la barra
              superior móvil, por debajo del mínimo táctil de 44 px — el
              usuario los veía "mal posicionados". Ahora la barra móvil sólo
              lleva logo + hamburguesa, ambos limpios.

              AQUÍ HUBO UN RELOJ UTC. Se retira por decisión del fundador:
              una barra de navegación es para navegar, y la hora no lleva
              a ninguna parte. Además era el único elemento del sitio que
              se repintaba una vez por segundo. Quien necesite la hora de
              las sesiones tiene la herramienta que existe para eso, el
              reloj de sesiones de mercado, con sus solapes. */}
          <div className="flex flex-none items-center gap-2 justify-self-end">
            <div className="hidden min-[1120px]:flex min-[1120px]:items-center min-[1120px]:gap-2">
            <IconButton
              onClick={toggleTheme}
              label={es ? "Cambiar tema" : "Toggle theme"}
              extraProps={{ "data-theme-toggle": true }}
            >
              {/* Cruce corto entre sol y luna, solo opacidad: la voltereta
                  con rotación y escala era un gesto de juguete en una
                  barra que debe leerse como instrumental. `mode="wait"`
                  evita que se solapen; `initial={false}` evita el
                  destello al montar. */}
              {/* `key={theme}` hace que React reemplace el nodo al
                  cambiar de tema, y el nodo nuevo entra con su propia
                  animación CSS. Es lo mismo que hacía `AnimatePresence`
                  con `mode="wait"`, sin biblioteca: en un cruce de
                  120 ms sólo se percibe la aparición. */}
              <span
                key={theme}
                className="tj-cruza grid place-items-center"
                style={{ width: 15, height: 15 }}
              >
                {theme === "dark" ? <SunIcon /> : <MoonIcon />}
              </span>
            </IconButton>

            {/* Aquí vivió un conmutador de estilo (Terminal / Clásico).
                Retirado al fijar el clásico como estilo único: una
                identidad no se elige desde un menú. */}

            <LanguagePicker />

            {/* Disparador de la paleta ⌘K. Oculto en móvil: ahí la
                navegación vive en el drawer y un campo de búsqueda
                compite con el gesto natural de scroll. En escritorio sí
                merece la pena: descubre una funcionalidad (la paleta)
                que de otro modo solo conocería quien pulsa ⌘K.

                El clic sintetiza un keydown ⌘K en window: OverlayHost
                ya escucha ese evento y monta la paleta bajo demanda
                (con import() diferido). Reutilizar el atajo evita
                acoplar este botón al layout y preserva la carga
                diferida. */}
            <button
              type="button"
              onClick={() => {
                if (typeof window === "undefined") return;
                window.dispatchEvent(
                  new KeyboardEvent("keydown", {
                    key: "k",
                    metaKey: true,
                    ctrlKey: true,
                    bubbles: true,
                  }),
                );
              }}
              aria-label={
                es ? `Buscar o navegar (${atajo})` : `Search or navigate (${atajo})`
              }
              title={es ? `Buscar o navegar (${atajo})` : `Search or navigate (${atajo})`}
              className="hidden h-9 cursor-pointer items-center gap-1.5 rounded-[2px] border border-[rgb(var(--divider)/0.14)] bg-transparent px-2.5 text-[var(--ink-3)] outline-none transition-colors duration-150 hover:border-[rgb(var(--divider)/0.24)] hover:bg-[color-mix(in_srgb,var(--ink)_6%,transparent)] hover:text-[var(--ink-2)] focus-visible:border-[rgb(var(--divider)/0.24)] focus-visible:bg-[color-mix(in_srgb,var(--ink)_6%,transparent)] focus-visible:text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] md:inline-flex"
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {/* «Ctrl+K» en Windows y «⌘K» en un Mac: la tecla que de
                  verdad tiene delante quien lee. Ver `useTeclaMando`. */}
              <span className="hidden text-[11px] font-medium tracking-wide lg:inline">
                {atajo}
              </span>
            </button>

            {/* CTA — rectángulo de 4 px, sin sheen ni sombra de color.
                El único realce es un cambio de tono, declarado igual
                para ratón y teclado. */}
            <Link
              href="/demo"
              className="hidden flex-none items-center gap-[7px] whitespace-nowrap rounded-[2px] text-sm font-semibold outline-none transition-colors duration-150 hover:bg-[rgb(var(--accent-hover))] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] sm:inline-flex"
              style={{
                height: 38,
                padding: "0 18px",
                background: "rgb(var(--accent-base))",
                color: "rgb(var(--accent-ink))",
              }}
            >
              {es ? "Ver la demo" : "See the demo"}
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M3 8h9M8 4l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            </div>{/* /hidden min-[1120px]:flex — utilidades de escritorio */}

            <button
              ref={menuButtonRef}
              onClick={() => {
                /* Montar y abrir en el mismo gesto. React aplica los dos
                   estados en el mismo render, así que el cajón nace ya
                   con `data-visible` puesto y no habría transición: el
                   `requestAnimationFrame` separa el montaje de la
                   apertura en dos fotogramas, que es lo que necesita el
                   navegador para interpolar entre los dos estados. */
                if (!cajonMontado) {
                  setCajonMontado(true);
                  requestAnimationFrame(() => setMobileOpen(true));
                  return;
                }
                setMobileOpen((o) => !o);
              }}
              className="grid h-11 w-11 place-items-center rounded-[2px] text-[var(--ink-2)] outline-none transition-colors duration-200 hover:bg-[rgb(var(--divider)/0.05)] hover:text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] min-[1120px]:hidden"
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

        {/* Aquí había una hairline de acento que se iba rellenando con el
            progreso de lectura. Retirada por decisión del dueño: no
            quiere ninguna barra que se rellene en la cabecera. La barra
            es una barra de navegación, no un indicador. */}
      </nav>

      {/* ── Cajón móvil ────────────────────────────────────────────────
          Éste SÍ se queda montado con la visibilidad conmutada, al
          revés que el megamenú y el desplegable de idioma. El motivo es
          que aquí la salida se ve: el cajón ocupa 300 px de ancho y se
          desliza; si desapareciera de golpe al cerrarlo, el gesto se
          rompería en la mitad más visible del sitio, que es el móvil.

          Estar montado y oculto tiene un precio de accesibilidad —un
          diálogo permanente en el árbol— y se paga con `inert`, que lo
          saca por completo mientras está cerrado: ni foco, ni lectura,
          ni clics. Es más limpio que el `tabIndex={-1}` de antes, que
          sólo cubría el propio contenedor y dejaba enfocables los
          enlaces de dentro.

          La maquinaria de accesibilidad (bloqueo de scroll, trampa de
          foco, cierre con Escape) queda intacta. */}
      <>
        {cajonMontado && (
          <>
            <div
              onClick={() => setMobileOpen(false)}
              data-visible={mobileOpen ? "true" : "false"}
              className="tj-velo fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm backdrop-saturate-150 min-[1120px]:hidden"
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
              // El cajón es una hoja de papel cálido que se desliza sobre
              // el contenido. OPACA (`tj-paper-dense`): se abre encima de
              // la página entera en la pantalla más estrecha, que es
              // justo donde menos sitio hay para que dos textos se
              // disputen los mismos píxeles. Detrás va además el velo
              // oscuro del backdrop, así que no se pierde la sensación de
              // capa. `safe-top` y el `border-l` se conservan; el footer
              // hereda `safe-bottom` en su contenedor interno.
              //
              // P8 — `style={{ position: "fixed" }}` inline. `.tj-paper`
              // en globals.css (línea 3298) declara `position: relative`
              // para anclar su `::before`/`::after`/inset shadows al
              // propio elemento; misma especificidad que la utilidad
              // `fixed` de Tailwind pero más tarde en el cascade → la
              // hereda. Sin este override el drawer acababa en flujo
              // normal (x=0, y=68, h=652, izquierda del viewport) en
              // vez de fijado a la derecha (top:0 right:0 bottom:0,
              // altura completa). Mismo patrón que CookieConsent.tsx
              // (línea 138) usa para el mismo conflicto. Inline style
              // gana a cualquier regla externa sin `!important`.
              className="tj-cajon tj-paper tj-paper-dense safe-top fixed top-0 right-0 bottom-0 z-[60] flex w-[300px] max-w-[84vw] flex-col border-l border-[rgb(var(--divider)/0.1)] outline-none min-[1120px]:hidden"
              style={{ position: "fixed" }}
            >
              <div className="flex h-16 shrink-0 items-center justify-between border-b border-[rgb(var(--divider)/0.06)] px-5">
                <Link
                  href="/"
                  onClick={() => setMobileOpen(false)}
                  // P8 — `min-h-[44px]` iguala el suelo táctil del botón
                  // "Cerrar" contiguo (también h-11). Antes la marca medía
                  // 32 px (solo el glifo), por debajo del mínimo móvil.
                  className="flex min-h-[44px] items-center gap-2.5 rounded-[2px] outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]"
                  aria-label={t("appName")}
                >
                  <BrandMark />
                  <span className="font-serif text-[17px] font-medium tracking-tight text-[var(--ink)]">
                    {t("appName")}
                  </span>
                </Link>
                {/* Close — área de toque de 44 px (especificación móvil).
                    El icono se queda a 16 px para no gritar; lo que crece
                    es la zona pulsable, no el glifo. */}
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="grid h-11 w-11 place-items-center rounded-[2px] text-[var(--ink-2)] outline-none transition-colors hover:bg-[rgb(var(--divider)/0.05)] hover:text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]"
                  aria-label={es ? "Cerrar menú" : "Close menu"}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>

              {/* `tj-cajon-lista` añade la pista de que hay más abajo.
                  Medido en 390x844: la lista pide 744 px y dispone de
                  592, o sea 152 px de secciones —«Empresa» entera— que
                  quedaban ocultas bajo la botonera fija sin nada que lo
                  insinuara. El corte caía justo en un epígrafe, que es
                  el peor sitio: parece el final de la lista. */}
              <nav className="tj-cajon-lista flex flex-1 flex-col overflow-y-auto px-3 py-4" aria-label={es ? "Secciones" : "Sections"}>
                {/* Etiqueta de sección — la navegación es la pieza
                    principal del drawer; un pequeño sobretexto la
                    enmarca y da aire al primer enlace. */}
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
                      className={`block px-3 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] ${gi === 0 ? "" : "pt-2.5"}`}
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
                            className={`group relative flex min-h-[44px] items-center gap-3 rounded-[2px] py-2 pr-3 pl-3 text-sm outline-none transition-[background-color,transform,color] duration-150 ease-[var(--ease-menu-in)] hover:translate-x-1 focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] ${
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
                            <span
                              className="grid h-7 w-7 flex-none place-items-center rounded-[2px]"
                              style={{
                                background: active
                                  ? "rgb(var(--accent-base) / 0.12)"
                                  : "rgb(var(--divider) / 0.06)",
                                color: active
                                  ? "rgb(var(--accent-base))"
                                  : "var(--ink-3)",
                              }}
                            >
                              {l.icon}
                            </span>
                            <span className="flex-1">{es ? l.labelEs : l.labelEn}</span>
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 16 16"
                              fill="none"
                              aria-hidden
                              className="opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
                              style={{ color: "var(--ink-3)" }}
                            >
                              <path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </Link>
                        );
                      })}
                  </div>
                ))}

                {/* Utilidades dentro del drawer: idioma y tema. En móvil
                    la barra superior queda cubierta por el backdrop en
                    cuanto el drawer se abre, así que estas dos acciones
                    quedarían inaccesibles sin esta fila.

                    Ambos controles suben a h-11 (44 px): el suelo táctil
                    ≥44 px rige dentro del drawer, donde sí se toca. En la
                    barra superior se mantiene h-9 porque ahí comparte
                    fila con el resto del clúster y la entrada es por
                    puntero. La diferencia la marca `size="md"` del
                    LanguagePicker y la clase directa en el botón de tema.

                    La hairline superior separa dos grupos funcionales
                    (navegación vs. preferencias) sin añadir peso: las
                    filas de navegación ya se separan por hover bg y
                    redondeado; una raya entre CADA fila sería ruido, una
                    raya entre GRUPOS es estructura. */}
                <div
                  aria-hidden
                  className="mx-3 mt-4 h-px"
                  style={{ background: "rgb(var(--divider) / 0.08)" }}
                />
                <span
                  className="px-3 pb-2 pt-4 text-[10.5px] font-semibold uppercase tracking-[0.14em]"
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
                    className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[2px] border bg-transparent px-2.5 text-[11px] font-semibold tracking-wide text-[var(--ink-2)] outline-none transition-colors duration-150 border-[rgb(var(--divider)/0.14)] hover:border-[rgb(var(--divider)/0.24)] hover:bg-[color-mix(in_srgb,var(--ink)_6%,transparent)] hover:text-[var(--ink)] focus-visible:border-[rgb(var(--divider)/0.24)] focus-visible:bg-[color-mix(in_srgb,var(--ink)_6%,transparent)] focus-visible:text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]"
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

              {/* Footer del drawer — CTAs + marca + copyright.
                 El `safe-bottom` añade el inset de la home indicator en
                 iOS; en escritorio resuelve a 0. El bloque flota sobre
                 un borde superior hairline que separa la navegación
                 (scrollable) de la conversión (fija al fondo). */}
              <div className="safe-bottom shrink-0 border-t border-[rgb(var(--divider)/0.06)] px-4 pt-4">
                <div className="flex flex-col gap-2">
                  {/* CTA secundario — lleva a precios después de la demo.
                      Ghost, sin relleno de acento, para no competir con el
                      recorrido principal. */}
                  <Link
                    href="/pricing"
                    onClick={() => setMobileOpen(false)}
                    className="flex h-11 w-full items-center justify-center gap-1.5 rounded-[2px] border border-[rgb(var(--divider)/0.18)] text-sm font-semibold outline-none transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--ink)_5%,transparent)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
                    style={{ color: "var(--ink)" }}
                  >
                    {es ? "Ver precios" : "See pricing"}
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M5 3l5 5-5 5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                  {/* CTA primario — la demo es el primer paso del recorrido:
                      rectángulo de 4 px, sin sheen ni sombra de acento. */}
                  <Link
                    href="/demo"
                    onClick={() => setMobileOpen(false)}
                    className="flex h-12 w-full items-center justify-center gap-1.5 rounded-[2px] text-sm font-semibold outline-none transition-colors duration-150 hover:bg-[rgb(var(--accent-hover))] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)]"
                    style={{
                      background: "rgb(var(--accent-base))",
                      color: "rgb(var(--accent-ink))",
                    }}
                  >
                    {lang === "es" ? "Ver la demo" : "See the demo"}
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="M3 8h9M8 4l4 4-4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>

                {/* Marca + copyright. Mismo glifo y nombre que la barra
                    superior — el pie del drawer reafirma dónde se está. */}
                <div className="mt-4 flex items-center gap-2 border-t border-[rgb(var(--divider)/0.06)] pt-3">
                  <BrandMark />
                  <div className="flex min-w-0 flex-col leading-tight">
                    <span className="font-serif text-[12.5px] font-medium text-[var(--ink)]">
                      {t("appName")}
                    </span>
                    <span
                      className="tnum text-[10.5px]"
                      style={{ color: "var(--ink-3)" }}
                    >
                      {/* El año lo fija la compilación, no el reloj del
                          visitante: ver `@/lib/publicacion`. */}
                      © {ANIO_PUBLICACION} {t("appName")}. {t("rights")}
                    </span>
                  </div>
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

/**
 * IconButton — botón circular de 38 px del clúster derecho.
 *
 * Existe para que el hover y el FOCO compartan exactamente la misma
 * declaración. En la versión anterior cada botón repetía a mano un par
 * `onMouseEnter`/`onMouseLeave` de ocho líneas que solo respondía al
 * ratón: con teclado no pasaba nada. Al declararlo en CSS, `hover:` y
 * `focus-visible:` reciben idéntico tratamiento sin duplicar nada.
 */
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
      className={`grid flex-none cursor-pointer place-items-center rounded-[2px] border bg-transparent text-[var(--ink-2)] outline-none transition-colors duration-150 border-[rgb(var(--divider)/0.14)] hover:border-[rgb(var(--divider)/0.24)] hover:bg-[color-mix(in_srgb,var(--ink)_6%,transparent)] hover:text-[var(--ink)] focus-visible:border-[rgb(var(--divider)/0.24)] focus-visible:bg-[color-mix(in_srgb,var(--ink)_6%,transparent)] focus-visible:text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)] ${className}`}
      style={{ width: 36, height: 36 }}
      {...extraProps}
    >
      {children}
    </button>
  );
}

/**
 * LanguagePicker — selector de idioma.
 *
 * Sustituye al interruptor "ES · EN" que vivía en un botón de 36 px. Ese
 * patrón tenía dos problemas: apretaba dos códigos y un separador en un
 * cuadrado diminuto (ilegible y pobre), y sobre todo NO ESCALA — un
 * interruptor solo sirve para dos opciones, así que en cuanto se añada
 * un tercer idioma hay que tirarlo y rehacerlo.
 *
 * Esto es un desplegable de verdad: la lista sale de LANGUAGES, y añadir
 * un idioma es AÑADIR UNA LÍNEA a ese array. Cada entrada muestra el
 * código y el nombre en su propia lengua (Español, no "Spanish"), que es
 * como se hace bien: quien busca su idioma lo reconoce aunque no
 * entienda el idioma actual de la página.
 *
 * Accesibilidad: `aria-haspopup="listbox"` + `aria-expanded`, cada
 * opción con `role="option"` y `aria-selected`, Escape cierra y devuelve
 * el foco al disparador, y el clic fuera cierra.
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
  // `size` sólo controla la altura del disparador: "sm" (h-9, 36 px) para
  // el clúster de escritorio donde comparte fila con otros cuadrados de
  // 36 px; "md" (h-11, 44 px) para el drawer móvil, donde rige el suelo
  // táctil ≥44 px. El resto del estilo (borde, hover, focus-visible, tipo)
  // se comparte íntegro — una sola declaración para dos tamaños.
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
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={es ? "Cambiar idioma" : "Change language"}
        title={es ? "Cambiar idioma" : "Change language"}
        className={`inline-flex ${sizeCls} cursor-pointer items-center gap-1.5 rounded-[2px] border bg-transparent px-2.5 text-[11px] font-semibold tracking-wide text-[var(--ink-2)] outline-none transition-colors duration-150 border-[rgb(var(--divider)/0.14)] hover:border-[rgb(var(--divider)/0.24)] hover:bg-[color-mix(in_srgb,var(--ink)_6%,transparent)] hover:text-[var(--ink)] focus-visible:border-[rgb(var(--divider)/0.24)] focus-visible:bg-[color-mix(in_srgb,var(--ink)_6%,transparent)] focus-visible:text-[var(--ink)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]`}
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

      {/* Sin animación de salida: un desplegable de dos entradas se
          cierra en cuanto eliges, y coreografiar su marcha no aporta
          nada que compense meter una biblioteca de animación en las 155
          páginas del sitio. La entrada sí se anima (`.tj-cae`). */}
      {open && (
          <div
            ref={popRef}
            role="listbox"
            aria-label={es ? "Idiomas" : "Languages"}
            className="tj-cae absolute right-0 z-50 min-w-[168px] rounded-[2px] border p-1"
            style={{
              top: "calc(100% + 8px)",
              borderColor: "rgb(var(--divider) / 0.14)",
              background: "color-mix(in srgb, var(--surface) 97%, transparent)",
              backdropFilter: "blur(24px) saturate(1.4)",
              WebkitBackdropFilter: "blur(24px) saturate(1.4)",
              boxShadow: "0 1px 2px rgb(0 0 0 / 0.5), 0 30px 60px -24px rgb(0 0 0 / 0.7)",
            }}
          >
            {LANGUAGES.map((l) => {
              const activo = l.code === lang;
              return (
                <button
                  key={l.code}
                  type="button"
                  role="option"
                  aria-selected={activo}
                  onClick={() => {
                    setLang(l.code);
                    setOpen(false);
                    btnRef.current?.focus();
                  }}
                  className="flex w-full cursor-pointer items-center gap-2.5 rounded-[2px] border-0 bg-transparent px-2.5 py-2 text-left outline-none transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--ink)_6%,transparent)] focus-visible:bg-[color-mix(in_srgb,var(--ink)_6%,transparent)] focus-visible:ring-2 focus-visible:ring-[rgb(var(--accent-base)/0.55)]"
                  style={{ fontFamily: "inherit" }}
                >
                  <span
                    className="tnum w-6 shrink-0 text-[11px] font-semibold tracking-wide"
                    style={{ color: activo ? "rgb(var(--accent-base))" : "var(--ink-3)" }}
                  >
                    {l.code2}
                  </span>
                  <span
                    className="flex-1 text-[13px]"
                    style={{ color: activo ? "var(--ink)" : "var(--ink-2)" }}
                  >
                    {l.native}
                  </span>
                  {/* Marca del idioma activo. Un check, no un color de
                      fondo: el fondo ya lo usa el estado de hover y dos
                      señales distintas no deben compartir soporte. */}
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

/**
 * BrandMark — el logotipo sobre un cuadrado de vidrio (32 px, blur +
 * hairline + inset highlight).
 *
 * Aquí ponía que «el logotipo real es el ojo» y que el trío de velas no
 * existía en la aplicación. Es exactamente al revés: el icono de la
 * aplicación es un cuaderno de piel CON tres velas japonesas en la tapa
 * —`CountPips.App/Assets/app-logo.png`—, y sobre aquella descripción
 * equivocada se retiró el motivo bueno. Ahora `BrandGlyph` dibuja el
 * logotipo de verdad; ver su cabecera.
 *
 * La placa de vidrio se conserva — es el material de la web y hace de
 * equivalente a la placa sobre la que va el icono en el escritorio.
 *
 * El glifo sube de 17 a 22 px dentro de la placa: el trazo anterior era
 * una silueta abierta que necesitaba aire alrededor, y éste es un icono
 * macizo que a 17 px flotaba perdido en el centro de un cuadrado de 32.
 * La placa no cambia de tamaño, así que la barra no se mueve.
 */
function BrandMark() {
  return (
    <span
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-[2px] border"
      style={{
        width: 32,
        height: 32,
        borderColor: "rgb(var(--divider) / 0.13)",
        background: "color-mix(in srgb, var(--surface) 66%, transparent)",
        WebkitBackdropFilter: "blur(18px) saturate(1.4)",
        backdropFilter: "blur(18px) saturate(1.4)",
        boxShadow: "inset 0 1px 0 rgb(255 255 255 / 0.06)",
      }}
    >
      <BrandGlyph size={22} />
    </span>
  );
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
