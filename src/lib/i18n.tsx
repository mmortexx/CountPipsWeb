"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { sinPrefijoEn } from "@/lib/locale";

export type Lang = "es" | "en";

export const STR = {
  // ---- Brand / global ----
  appName: { es: "CountPips", en: "CountPips" },
  tagline: { es: "Tu operativa, medida.", en: "Your trading, measured." },
  heroLead: {
    es: "El diario de trading profesional, nativo de Windows. Métricas institucionales, disciplina que te frena antes de la tontería y tus datos 100 % en tu máquina.",
    en: "The professional trading journal, native to Windows. Institutional metrics, discipline that stops you before the dumb trade, and your data 100 % on your machine.",
  },
  ctaPrimary: { es: "Probar la demo", en: "Try the demo" },
  ctaSecondary: { es: "Ver precios", en: "See pricing" },
  buyNow: { es: "Solicitar acceso anticipado", en: "Request early access" },

  // ---- Nav ----
  navProduct: { es: "Producto", en: "Product" },
  navDemo: { es: "Demo", en: "Demo" },
  navFeatures: { es: "Características", en: "Features" },
  navPricing: { es: "Precios", en: "Pricing" },
  navFaq: { es: "FAQ", en: "FAQ" },
  navShortcuts: {
    es: "Atajos de teclado (?)",
    en: "Keyboard shortcuts (?)",
  },

  // ---- Positioning strip ----
  posNative: { es: "Nativa de Windows", en: "Native to Windows" },
  posLocal: { es: "100 % local", en: "100 % local" },
  posOnce: { es: "Demo interactiva", en: "Interactive demo" },
  posBilingual: { es: "ES + EN nativo", en: "Native ES + EN" },

  // ---- Demo ----
  demoTitle: { es: "Demo en vivo", en: "Live demo" },
  demoSubtitle: {
    es: "No es un vídeo ni una galería: es el recorrido esencial de CountPips, recreado para que puedas juzgarlo antes de instalar nada.",
    en: "Not a video or a gallery: it is CountPips' essential workflow, recreated so you can judge it before installing anything.",
  },
  demoOpenFull: { es: "Abrir en pantalla completa", en: "Open full screen" },
  demoCloseFull: { es: "Cerrar", en: "Close" },
  // Windows 11 caption-button aria-labels (title bar Min/Max/Close).
  winMinimize: { es: "Minimizar", en: "Minimize" },
  winMaximize: { es: "Maximizar", en: "Maximize" },
  winRestore: { es: "Restaurar", en: "Restore" },
  winClose: { es: "Cerrar", en: "Close" },
  localFirst: { es: "Local-first", en: "Local-first" },
  demoAccount: { es: "DEMO · 10.000 $", en: "DEMO · $10,000" },
  autoSaved: {
    es: "Guardado automático en tu equipo",
    en: "Auto-saved on your machine",
  },
  demoSampleData: {
    es: "Datos de muestra · No es trading real",
    en: "Sample data · Not real trading",
  },
  demoShare: { es: "Compartir", en: "Share" },
  demoShareCopied: { es: "✓ Copiado", en: "✓ Copied" },
  demoReset: { es: "Reiniciar", en: "Reset" },
  demoResetDone: { es: "✓ Reiniciado", en: "✓ Reset" },
  // Keyboard-hint label rendered in the demo status bar (desktop only).
  demoKeyHint: { es: "⌨ 1–6", en: "⌨ 1–6" },

  // ---- App nav (demo) ----
  pageDashboard: { es: "Resumen", en: "Dashboard" },
  pageTrades: { es: "Operaciones", en: "Trades" },
  pageAnalytics: { es: "Analítica", en: "Analytics" },
  pageJournal: { es: "Diario", en: "Journal" },
  pagePlaybook: { es: "Playbook", en: "Playbook" },
  // R25-1a: 3 missing tabs from the real app's NavigationView
  // (MainWindow.xaml L205-214) — Experimentos, Fiscal, Negocio.
  pageExperiments: { es: "Experimentos", en: "Experiments" },
  pageFiscal: { es: "Fiscal", en: "Fiscal" },
  pageBusiness: { es: "Negocio", en: "Business" },
  pageSettings: { es: "Ajustes", en: "Settings" },

  // ---- Title bar (demo) — matches the real app's TitleBar_* strings
  // (Strings/{es-ES,en-GB}/Resources.resw L11-12). The LED's aria-label /
  // tooltip is "Local-first · sin nube" — slightly longer than the
  // visible "Local-first" text, mirrors the native WinUI tooltip.
  titleLocalFirstLed: {
    es: "Local-first · sin nube",
    en: "Local-first · no cloud",
  },

  // ---- Dashboard ----
  captureHeadline: { es: "¿Qué has operado hoy?", en: "What did you trade today?" },
  captureEyebrow: { es: "Registro", en: "Capture" },
  long: { es: "Long", en: "Long" },
  short: { es: "Short", en: "Short" },
  dropScreens: {
    es: "Arrastra aquí las capturas del gráfico",
    en: "Drag chart screenshots here",
  },
  notePlaceholder: {
    es: "Describe la operación en una línea…",
    en: "Describe the trade in one line…",
  },
  instrument: { es: "Instrumento", en: "Instrument" },
  setup: { es: "Setup", en: "Setup" },
  exit: { es: "Salida", en: "Exit" },
  quantity: { es: "Cantidad", en: "Quantity" },
  rr: { es: "RR", en: "RR" },
  calcMethod: { es: "Método de cálculo", en: "Calculation method" },
  riskPercent: { es: "Riesgo %", en: "Risk %" },
  fixedUsd: { es: "USD fijo", en: "Fixed USD" },
  forexLots: { es: "Lotes forex", en: "Forex lots" },
  futuresContracts: { es: "Contratos futuros", en: "Futures contracts" },
  entryStop: { es: "Entrada + stop", en: "Entry + stop" },
  registerTrade: { es: "Registrar operación", en: "Log trade" },
  saveDraft: { es: "Guardar borrador", en: "Save draft" },
  tradeRegistered: { es: "Operación registrada", en: "Trade logged" },
  tradeRegisteredDesc: {
    es: "Guardada localmente — aparece arriba del todo en Operaciones.",
    en: "Saved locally — shows at the top of Trades.",
  },
  tradeRegisterError: {
    es: "Faltan campos obligatorios",
    en: "Required fields missing",
  },
  tradeRegisterErrorDesc: {
    es: "Instrumento, setup, dirección, entrada y stop son obligatorios.",
    en: "Instrument, setup, direction, entry and stop are required.",
  },
  tradeDeleted: { es: "Operación eliminada", en: "Trade deleted" },
  deleteTrade: { es: "Eliminar operación", en: "Delete trade" },
  deleteConfirm: { es: "¿Eliminar?", en: "Delete?" },
  cancelDelete: { es: "No", en: "No" },
  confirmDelete: { es: "Sí", en: "Yes" },
  customTradeBadge: { es: "Tuya", en: "Yours" },
  sampleResetToast: {
    es: "Datos reiniciados a la muestra",
    en: "Data reset to sample",
  },
  sampleResetDesc: {
    es: "Tus operaciones personalizadas se han borrado.",
    en: "Your custom trades have been cleared.",
  },
  sessionCount: {
    es: (n: number) => `${n} registradas esta sesión`,
    en: (n: number) => `${n} logged this session`,
  },
  riskUsd: { es: "Riesgo en $", en: "Risk in $" },
  riskEur: { es: "Riesgo en €", en: "Risk in €" },

  // ---- Performance ----
  performanceTitle: {
    es: "Rendimiento — Cómo va tu operativa",
    en: "Performance — How your trading is going",
  },
  pnlTotal: { es: "P&L total", en: "Total P&L" },
  winRate: { es: "Win rate", en: "Win rate" },
  expectancy: { es: "Expectancy", en: "Expectancy" },
  profitFactor: { es: "Profit factor", en: "Profit factor" },
  currentDd: { es: "DD actual", en: "Current DD" },
  streak: { es: "Racha", en: "Streak" },
  discipline: { es: "Disciplina", en: "Discipline" },
  performance: { es: "Rendimiento", en: "Performance" },
  balance: { es: "Balance", en: "Balance" },

  // ---- Trades table ----
  tradesEyebrow: { es: "Registro", en: "Capture" },
  tradesTitle: { es: "Operaciones", en: "Trades" },
  tradesCount: {
    es: (n: number) => `${n} operaciones`,
    en: (n: number) => `${n} trades`,
  },
  searchPlaceholder: {
    es: "Buscar por instrumento, setup o nota…",
    en: "Search by instrument, setup or note…",
  },
  colInstrument: { es: "Instrumento", en: "Instrument" },
  colSetup: { es: "Setup", en: "Setup" },
  colDuration: { es: "Duración", en: "Duration" },
  colClosed: { es: "Cierre", en: "Closed" },
  colNetPnl: { es: "P&L neto", en: "Net P&L" },
  colR: { es: "R", en: "R" },
  // Literal de la app (Trades_SummaryEyebrow): la franja de KPIs de
  // Operaciones mide LO QUE ESTÁ A LA VISTA tras filtrar, no "el filtro".
  summary: { es: "Lo que hay en pantalla", en: "What is on screen" },
  selectTrade: { es: "Seleccionar operación", en: "Select trade" },
  selectAll: { es: "Seleccionar todas las visibles", en: "Select all visible" },

  // ---- Trade detail ----
  execution: { es: "Ejecución", en: "Execution" },
  plan: { es: "Plan", en: "Plan" },
  context: { es: "Contexto", en: "Context" },
  entry: { es: "Entrada", en: "Entry" },
  grossPnl: { es: "P&L bruto", en: "Gross P&L" },
  fees: { es: "Comisiones", en: "Fees" },
  initialStop: { es: "Stop inicial", en: "Initial stop" },
  target: { es: "Objetivo", en: "Target" },
  plannedRr: { es: "RR planeado", en: "Planned RR" },
  screenshots: { es: "Capturas", en: "Screenshots" },
  review: { es: "Revisión", en: "Review" },
  entryNote: { es: "Nota de entrada", en: "Entry note" },
  manageNote: { es: "Nota de gestión", en: "Management note" },
  closeNote: { es: "Nota de cierre", en: "Close note" },
  followedPlan: { es: "¿Cumpliste tu plan?", en: "Did you follow your plan?" },
  yes: { es: "Sí", en: "Yes" },
  partial: { es: "Parcial", en: "Partial" },
  no: { es: "No", en: "No" },
  saveChanges: { es: "Guardar cambios", en: "Save changes" },
  back: { es: "Volver", en: "Back" },

  // ---- Analytics ----
  analyticsEyebrow: { es: "Análisis", en: "Analysis" },
  analyticsTitle: { es: "Analítica", en: "Analytics" },
  analyticsDesc: {
    es: "Métricas, distribuciones, mapas de calor y comparativas. La barra de filtros omnipresente recalcula toda la app.",
    en: "Metrics, distributions, heatmaps and comparisons. The omnipresent filter bar recalculates the whole app.",
  },
  operations: { es: "Operaciones", en: "Trades" },
  winnersVsLosers: { es: "Ganadoras vs perdedoras", en: "Winners vs losers" },
  riskQuality: { es: "Riesgo y calidad", en: "Risk and quality" },
  avgWin: { es: "Media ganadora", en: "Avg win" },
  avgLoss: { es: "Media perdedora", en: "Avg loss" },
  payoff: { es: "Payoff", en: "Payoff" },
  largestWin: { es: "Mayor ganancia", en: "Largest win" },
  largestLoss: { es: "Mayor pérdida", en: "Largest loss" },
  expectancyR: { es: "Expectancy R", en: "Expectancy R" },
  maxDrawdown: { es: "Max drawdown", en: "Max drawdown" },
  maxDrawdownPct: { es: "Max drawdown %", en: "Max drawdown %" },
  sharpe: { es: "Sharpe", en: "Sharpe" },
  sortino: { es: "Sortino", en: "Sortino" },
  calmar: { es: "Calmar", en: "Calmar" },
  recoveryFactor: { es: "Recovery factor", en: "Recovery factor" },
  sampleShort: {
    es: "Muestra corta: ratios poco fiables",
    en: "Short sample: unreliable ratios",
  },
  rDistribution: { es: "Distribución de R-múltiplos", en: "R-multiple distribution" },
  pnlDistribution: { es: "Distribución de P&L", en: "P&L distribution" },
  durationDistribution: { es: "Distribución de duración", en: "Duration distribution" },
  rOverTime: { es: "R-múltiplo en el tiempo", en: "R-multiple over time" },
  pnlByWeekday: { es: "P&L por día de la semana", en: "P&L by weekday" },
  pnlByMonth: { es: "P&L por mes", en: "P&L by month" },
  heatmapTitle: { es: "Rentabilidad por día y hora", en: "Return by day and hour" },
  setupsByExpectancy: { es: "Setups por expectancy", en: "Setups by expectancy" },
  instrumentsByExpectancy: {
    es: "Instrumentos por expectancy",
    en: "Instruments by expectancy",
  },
  all: { es: "Todos", en: "All" },
  direction: { es: "Dirección", en: "Direction" },
  compliance: { es: "Cumplimiento", en: "Compliance" },
  complied: { es: "Cumplió", en: "Followed" },
  notComplied: { es: "No cumplió", en: "Not followed" },
  clearFilters: { es: "Limpiar filtros", en: "Clear filters" },

  // ---- Journal ----
  journalEyebrow: { es: "Reflexión", en: "Reflection" },
  journalTitle: { es: "Diario", en: "Journal" },
  ritualTitle: {
    es: "Ritual del día — Antes y después de operar",
    en: "Daily ritual — Before and after trading",
  },
  preMarket: { es: "Pre-mercado", en: "Pre-market" },
  postMarket: { es: "Post-mercado", en: "Post-market" },
  dayScore: { es: "Nota del día", en: "Day score" },
  freeNote: { es: "Nota libre del día", en: "Free note of the day" },
  disciplineReport: { es: "Disciplina", en: "Discipline" },
  compliancePct: { es: "Cumplimiento", en: "Compliance" },
  costOfIndiscipline: {
    es: "Coste de indisciplina",
    en: "Cost of indiscipline",
  },
  expInPlan: { es: "Expectancy en plan", en: "Expectancy in plan" },
  expOutPlan: { es: "Expectancy fuera de plan", en: "Expectancy out of plan" },
  review2: { es: "Revisión", en: "Review" },
  weekly: { es: "Semanal", en: "Weekly" },
  monthly: { es: "Mensual", en: "Monthly" },
  history: { es: "Historial", en: "History" },

  // ---- Playbook ----
  playbookEyebrow: { es: "Biblioteca", en: "Library" },
  playbookTitle: { es: "Playbook", en: "Playbook" },
  playbookDesc: {
    es: "Tus setups con estadísticas en vivo. El playbook deja de ser un PDF muerto: cada ficha muestra expectancy, win rate y muestra.",
    en: "Your setups with live statistics. The playbook stops being a dead PDF: each card shows expectancy, win rate and sample size.",
  },
  newSetup: { es: "Nueva ficha", en: "New setup" },
  sample: { es: "Muestra", en: "Sample" },
  noTradesYet: { es: "Sin operaciones aún", en: "No trades yet" },
  rules: { es: "Reglas", en: "Rules" },

  // ---- Settings ----
  settingsEyebrow: { es: "Preferencias", en: "Preferences" },
  settingsTitle: { es: "Ajustes", en: "Settings" },
  language: { es: "Idioma", en: "Language" },
  appearance: { es: "Apariencia", en: "Appearance" },
  light: { es: "Claro", en: "Light" },
  dark: { es: "Oscuro", en: "Dark" },
  accentColor: { es: "Color de acento", en: "Accent color" },
  sampleData: { es: "Datos de ejemplo", en: "Sample data" },
  loadSample: { es: "Cargar datos de ejemplo", en: "Load sample data" },
  downloadData: { es: "Descargar datos", en: "Download data" },
  dataDownloaded: { es: "✓ Descargado", en: "✓ Downloaded" },
  about: { es: "Acerca de", en: "About" },
  aboutHelp: {
    es: "App nativa de Windows · datos 100 % locales · ES + EN",
    en: "Native Windows app · 100 % local data · ES + EN",
  },

  // ---- Accent palette names ----
  // Tras el rediseño solo hay una paleta (verde). Las claves quedan para
  // no romper referencias pero ya no se renderizan en la UI.
  palGold: { es: "Verde", en: "Green" },
  palEmerald: { es: "Verde", en: "Green" },
  palOnyx: { es: "Verde", en: "Green" },
  palAurora: { es: "Verde", en: "Green" },
  palSilk: { es: "Verde", en: "Green" },

  // ---- Features (marketing) ----
  featuresEyebrow: { es: "Por qué es distinto", en: "Why it's different" },
  /* «journal» en la versión española: el sitio llama DIARIO a esto mismo
     en su propia descripción («el diario de trading profesional») y en el
     menú de la demo (`journalTitle`). Dos nombres para el producto en la
     misma página no es bilingüismo, es descuido. En inglés se queda
     «journal», que es su nombre allí. */
  featuresTitle: {
    es: "No es otro diario con las mismas 30 métricas.",
    en: "Not another journal with the same 30 metrics.",
  },
  featuresLead: {
    es: "Es la única app que te enseña lo que TU comportamiento te cuesta en dinero — y vive en tu ordenador, no en la nube de nadie.",
    en: "It's the only app that shows you what YOUR behavior costs in money — and lives on your computer, not in anyone's cloud.",
  },

  // ---- Pricing ----
  pricingEyebrow: { es: "Precios de lanzamiento", en: "Launch pricing" },
  pricingTitle: {
    es: "Compra cuando estés listo.",
    en: "Buy when you are ready.",
  },
  pricingLead: {
    es: "Dos niveles claros para dos formas de operar. Prueba la demo, compara el alcance y solicita acceso anticipado si quieres entrar antes de la apertura comercial.",
    en: "Two clear tiers for two ways of trading. Try the demo, compare the scope and request early access if you want in before commercial launch.",
  },
  core: { es: "Core", en: "Core" },
  pro: { es: "Pro", en: "Pro" },
  mostPopular: { es: "Más popular", en: "Most popular" },
  perOnce: { es: "una vez", en: "once" },

  // ---- FAQ ----
  faqEyebrow: { es: "Dudas frecuentes", en: "Common questions" },
  faqTitle: { es: "Preguntas frecuentes", en: "Frequently asked questions" },

  // ---- Footer / misc ----
  rights: { es: "Todos los derechos reservados.", en: "All rights reserved." },
  madeFor: {
    es: "Hecho para el trader manual serio.",
    en: "Made for the serious manual trader.",
  },

  // ---- Accessibility ----
  // Skip-to-content link — first focusable element on every page. Visually
  // hidden until focused, then surfaces as an accent pill at the top-left
  // of the viewport so keyboard users can bypass the navbar + footer and
  // jump straight into the main content (a11y best practice).
  skipToContent: { es: "Saltar al contenido", en: "Skip to content" },
} as const;

export type StrKey = keyof typeof STR;

export function t(key: StrKey, lang: Lang): string {
  const v = STR[key] as { es: string; en: string };
  return v[lang];
}

export function tf(key: StrKey, lang: Lang, n: number): string {
  const v = STR[key] as unknown as {
    es: (n: number) => string;
    en: (n: number) => string;
  };
  return v[lang](n);
}

interface LangCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (key: StrKey) => string;
  tf: (key: StrKey, n: number) => string;
}

const Ctx = createContext<LangCtx | null>(null);

/** `/en` o `/en/lo-que-sea` → inglés. Cualquier otra cosa → español. */
function langDeRuta(pathname: string): Lang {
  return pathname === "/en" || pathname.startsWith("/en/") ? "en" : "es";
}

/**
 * LanguageProvider — el idioma ya NO es un interruptor en memoria, es la
 * dirección.
 *
 * ── Qué cambió, y por qué ─────────────────────────────────────────────
 * Antes `lang` era un `useState("es")`: cambiar de idioma mutaba una
 * variable sin tocar la URL, así que Google veía siempre la misma
 * dirección con el mismo contenido —español—, y una recarga o un enlace
 * compartido volvían a caer en español aunque el visitante hubiera
 * elegido inglés. Es justo el motivo por el que el inglés, pese a estar
 * escrito entero, no existía para ningún buscador.
 *
 * Ahora `lang` se DEDUCE de `usePathname()`: estar en `/en/pricing` es lo
 * que hace que la página se lea en inglés, y estar en `/pricing` es lo
 * que hace que se lea en español. `setLang`/`toggle` ya no cambian un
 * estado — NAVEGAN a la dirección equivalente en el otro idioma. El
 * selector de idioma de la barra no tuvo que tocarse: sigue llamando a
 * los mismos `setLang`/`toggle` de siempre, sólo que ahora hacen otra
 * cosa por dentro.
 *
 * Al derivarse del pathname en cada render —no de un estado que se fija
 * después en un efecto— no hay parpadeo: el primer pintado ya sabe en
 * qué idioma está, tanto al compilar como al hidratarse.
 *
 * Se conservan el `search` y el `hash` al cambiar de idioma: cambiar
 * de idioma en `/faq?q=stop+loss` lleva a `/en/faq?q=stop+loss`, no a la
 * FAQ inglesa en blanco.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const lang = langDeRuta(pathname);

  // Mantiene sincronizado el `lang` del documento para lectores de
  // pantalla y buscadores. El script embebido en `layout.tsx` ya fija el
  // valor correcto ANTES del primer pintado (mismo patrón que el tema);
  // este efecto es el respaldo para cuando el idioma cambia sin recargar
  // —caso que hoy no ocurre, porque cambiar de idioma navega a otra
  // página, pero cubre cualquier futuro cambio de cliente sin recarga—.
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
  }, [lang]);

  const irA = useCallback(
    (destino: Lang) => {
      if (destino === lang) return;
      const base = sinPrefijoEn(pathname);
      const sufijo =
        typeof window !== "undefined" ? window.location.search + window.location.hash : "";
      const ruta = destino === "en" ? (base === "/" ? "/en" : `/en${base}`) : base;
      router.push(`${ruta}${sufijo}`);
    },
    [lang, pathname, router]
  );

  const value = useMemo<LangCtx>(
    () => ({
      lang,
      setLang: irA,
      toggle: () => irA(lang === "es" ? "en" : "es"),
      t: (key: StrKey) => t(key, lang),
      tf: (key: StrKey, n: number) => tf(key, lang, n),
    }),
    [lang, irA]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useLang must be used within LanguageProvider");
  return c;
}
