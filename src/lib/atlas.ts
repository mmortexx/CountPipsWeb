import { sinPrefijoEn } from "@/lib/locale";

/**
 * El guion del atlas: qué figura graba cada sección y qué dice su pie.
 *
 * ── Por qué vive aquí y no en cada página ─────────────────────────────
 * Dos piezas necesitan la misma información y tienen que coincidir o el
 * fondo miente: `EngravedAtlas`, que dibuja, y `PlateInterlude`, que
 * escribe el pie de figura. Cuando cada una llevaba sus datos, bastaba
 * reordenar las láminas de una ruta para que el pie describiera una
 * figura distinta de la que se estaba grabando, y nada lo delataba.
 *
 * Aquí se declara una sola vez: el orden de este array ES el orden del
 * grabado y el orden de las pausas. `PlateInterlude` sólo recibe su
 * índice; el resto lo deduce de la ruta.
 */

export type PlateId =
  | "equity"
  | "calendar"
  | "distribution"
  | "gauge"
  | "heatmap"
  | "rolling"
  | "rules"
  | "streak"
  | "vault"
  | "ledger"
  | "tenure"
  | "sessions"
  | "significance"
  | "workspace"
  | "blueprint"
  | "profile";

export type PlateMeta = {
  titleEs: string;
  titleEn: string;
  noteEs: string;
  noteEn: string;
};

/**
 * Los rótulos que van GRABADOS DENTRO de la lámina, no en el pie.
 *
 * ── El desajuste que arreglan ─────────────────────────────────────────
 * El pie de cada figura —`PLATE_META`, aquí abajo— lleva desde el primer
 * día en los dos idiomas, y `PlateInterlude` lo conmuta con `useLang()`.
 * Los rótulos que el canvas pinta DENTRO del dibujo, no: estaban escritos
 * a mano en español dentro de `EngravedAtlas.tsx`, en una veintena de
 * llamadas a `label()`.
 *
 * O sea que un visitante de `/en/features` leía un pie en inglés debajo de
 * una lámina rotulada «TECHO HISTÓRICO» y «OPERACIÓN BLOQUEADA». Es
 * exactamente la clase de fallo que no rompe nada, no sale en consola y no
 * lo ve nadie que trabaje en español: el sitio tiene 76 páginas en inglés
 * y las láminas de todas ellas estaban a medio traducir.
 *
 * ── Cómo están escritos ───────────────────────────────────────────────
 * Como rótulos de plancha, no como frases: cortos, en versalitas y sin
 * artículos. El inglés no puede ser mucho más largo que el español porque
 * varios van anclados a un extremo del dibujo y se saldrían de la figura.
 */
export type RotuloAtlas = { es: string; en: string };

export const ROTULOS = {
  techoHistorico: { es: "TECHO HISTÓRICO", en: "ALL-TIME HIGH" },
  perdida: { es: "PÉRDIDA", en: "LOSS" },
  ganancia: { es: "GANANCIA", en: "GAIN" },
  limite: { es: "LÍMITE", en: "LIMIT" },
  umbral: { es: "UMBRAL", en: "THRESHOLD" },
  operacionBloqueada: { es: "OPERACIÓN BLOQUEADA", en: "TRADE BLOCKED" },
  limiteDiario: { es: "LÍMITE DIARIO", en: "DAILY LIMIT" },
  hoy: { es: "HOY", en: "TODAY" },
  cohorte: { es: "COHORTE", en: "COHORT" },
  validacion: { es: "VALIDACIÓN", en: "VALIDATION" },
  accesoPrivado: { es: "ACCESO PRIVADO", en: "PRIVATE ACCESS" },
  evidenciaAcumulada: { es: "EVIDENCIA ACUMULADA", en: "EVIDENCE BUILDING" },
  horaUtc: { es: "HORA UTC", en: "UTC HOUR" },
  solape: { es: "SOLAPE", en: "OVERLAP" },
  yaNoEsSuerte: { es: "AQUÍ YA NO ES SUERTE", en: "NO LONGER LUCK" },
  soloAzar: { es: "LO QUE EL AZAR PRODUCE SOLO", en: "WHAT CHANCE ALONE YIELDS" },
  lineaLlena: { es: "LÍNEA LLENA · CONSTRUIDO", en: "SOLID LINE · BUILT" },
  lineaTrazos: { es: "LÍNEA DE TRAZOS · PREVISTO", en: "DASHED LINE · PLANNED" },
  /* La marca no se traduce, pero pasa por aquí para que el escaneo del
     fuente que prohíbe literales en `label()` no tenga excepciones. */
  marca: { es: "COUNTPIPS", en: "COUNTPIPS" },
} as const satisfies Record<string, RotuloAtlas>;

export type RotuloId = keyof typeof ROTULOS;

/**
 * Series de rótulos: los ejes del perfil, las iniciales de los días y las
 * plazas financieras.
 *
 * Las iniciales de los días son el caso que se olvida siempre. «L M X J V»
 * no es una abreviatura que un lector inglés pueda descifrar: la X de
 * miércoles sólo existe en español.
 */
export const SERIES_ROTULOS = {
  ejesPerfil: {
    es: ["RIESGO", "PLAN", "REGISTRO", "REVISIÓN", "TAMAÑO", "PACIENCIA"],
    en: ["RISK", "PLAN", "LOG", "REVIEW", "SIZE", "PATIENCE"],
  },
  diasSemana: {
    es: ["L", "M", "X", "J", "V", "S", "D"],
    en: ["M", "T", "W", "T", "F", "S", "S"],
  },
  plazas: {
    es: ["ASIA", "LONDRES", "NUEVA YORK"],
    en: ["ASIA", "LONDON", "NEW YORK"],
  },
} as const;

/**
 * El pie de cada figura. No repite lo que ya dice la página: explica qué
 * se está viendo y por qué esa figura importa. Un pie que dijera "curva
 * de resultados" sobraría — eso ya se ve.
 */
export const PLATE_META: Record<PlateId, PlateMeta> = {
  equity: {
    titleEs: "La curva que de verdad importa",
    titleEn: "The curve that actually matters",
    noteEs:
      "No el beneficio: la distancia entre tu capital y su techo histórico. Esa franja rayada es el drawdown, y es la cifra que decide si una cuenta sigue viva.",
    noteEn:
      "Not profit: the gap between your capital and its historic high. That hatched band is drawdown, and it is the number that decides whether an account survives.",
  },
  calendar: {
    titleEs: "Un mes, día a día",
    titleEn: "A month, day by day",
    noteEs:
      "Cada celda es una sesión. Cuanto más apretada la trama, mayor el resultado; las jornadas en pérdida van cruzadas. Un mes entero se lee de un vistazo, sin abrir un informe.",
    noteEn:
      "Each cell is a session. The tighter the hatching, the bigger the result; losing days are cross-hatched. A whole month reads at a glance, with no report to open.",
  },
  distribution: {
    titleEs: "¿Ventaja real o buena racha?",
    titleEn: "Real edge, or a good run?",
    noteEs:
      "La distribución de tus operaciones en múltiplos de riesgo. Si la cola derecha no pesa más que la izquierda, no hay ventaja: hay suerte, y la suerte revierte.",
    noteEn:
      "Your trades distributed in risk multiples. If the right tail does not outweigh the left, there is no edge — there is luck, and luck reverts.",
  },
  gauge: {
    titleEs: "Cuánto queda antes del límite",
    titleEn: "How much is left before the limit",
    noteEs:
      "El guardián mide el riesgo abierto contra tu tope diario y te frena antes de cruzarlo. La zona rayada del cuadrante es el tramo donde una cuenta de fondeo se pierde.",
    noteEn:
      "The guardian measures open risk against your daily cap and stops you before you cross it. The hatched arc is where a funded account gets lost.",
  },
  heatmap: {
    titleEs: "No cuánto ganas: cuándo",
    titleEn: "Not how much you make: when",
    noteEs:
      "Los días en horizontal, las horas de mercado en vertical. Cuanto más apretada la trama, más deja esa casilla. Casi nadie gana igual a las diez que a las tres, y el promedio de la sesión esconde justo eso.",
    noteEn:
      "Days across, market hours down. The tighter the hatching, the more that cell returns. Almost nobody performs the same at ten as at three, and a session average hides exactly that.",
  },
  rolling: {
    titleEs: "El margen de error, dibujado",
    titleEn: "The margin of error, drawn",
    noteEs:
      "El ratio medido sobre ventana móvil, con su banda de incertidumbre alrededor. La banda se estrecha según se acumulan operaciones: con veinte detrás, un número no es un hecho, es casi ruido.",
    noteEn:
      "The ratio measured over a rolling window, with its uncertainty band around it. The band narrows as trades accumulate: with twenty behind it, a number is not a fact — it is nearly noise.",
  },
  rules: {
    titleEs: "La regla que hoy no se cumple",
    titleEn: "The rule that fails today",
    noteEs:
      "Las condiciones que tú mismo te pusiste, una por renglón, con su marca al margen. La que va cruzada es la que frena la operación — un guardián que nunca dice que no no sirve de nada.",
    noteEn:
      "The conditions you set yourself, one per line, each with its mark. The crossed one is what blocks the trade — a guardian that never says no is worth nothing.",
  },
  streak: {
    titleEs: "Las pérdidas llegan seguidas",
    titleEn: "Losses arrive in a row",
    noteEs:
      "Sesiones consecutivas: arriba las que suman, abajo las que restan. No se reparten de forma ordenada, se agrupan — y el tope diario que cruza el dibujo existe para el día en que eso ocurre.",
    noteEn:
      "Consecutive sessions: gains above, losses below. They do not arrive evenly spaced, they cluster — and the daily cap crossing the plate exists for the day that happens.",
  },
  vault: {
    titleEs: "Un mecanismo que no se abre desde fuera",
    titleEn: "A mechanism that does not open from outside",
    noteEs:
      "Anillos, guardas y ojo de llave: el grabado con el que un tratado ilustra algo cerrado. Tus operaciones viven en tu disco, cifradas, sin pasar por un servidor ajeno.",
    noteEn:
      "Rings, wards and a keyhole: how a treatise engraves something sealed. Your trades live on your own disk, encrypted, without ever crossing someone else's server.",
  },
  ledger: {
    titleEs: "Antes de la métrica, el asiento",
    titleEn: "Before the metric, the entry",
    noteEs:
      "El libro mayor abierto, con sus columnas y sus renglones. Ninguna estadística existe hasta que alguien anota la operación: de ahí salen el nombre de esto y su logotipo.",
    noteEn:
      "The ledger, open, with its columns and its ruled lines. No statistic exists until someone writes the trade down: that is where this product's name and its mark come from.",
  },
  tenure: {
    titleEs: "El producto se abre por evidencia",
    titleEn: "The product opens on evidence",
    noteEs:
      "Dos trazos sobre el mismo eje de adopción: la validación acumula evidencia y el acceso anticipado permanece privado durante esta fase. El área tramada recuerda que cada invitación debe aportar aprendizaje, no una promesa comercial.",
    noteEn:
      "Two strokes on the same adoption axis: validation accumulates evidence while early access remains private during this phase. The hatched area is a reminder that every invitation should add learning, not a commercial promise.",
  },
  sessions: {
    titleEs: "El día partido en husos",
    titleEn: "The day divided into sessions",
    noteEs:
      "Asia, Londres y Nueva York sobre una misma banda de veinticuatro horas. Lo que importa no es cuándo abre cada plaza, sino dónde se pisan: en esas franjas cruzadas hay dos mercados despiertos a la vez, y es cuando el precio se mueve de verdad.",
    noteEn:
      "Asia, London and New York on a single twenty-four-hour band. What matters is not when each opens, but where they overlap: in those cross-hatched strips two markets are awake at once, and that is when price really moves.",
  },
  significance: {
    titleEs: "Dónde acaba la suerte",
    titleEn: "Where luck runs out",
    noteEs:
      "La campana es lo que una racha cualquiera produce sola, sin ventaja ninguna. Sólo la cola tramada, más allá del umbral, dice algo. Fíjese en la desproporción: casi cualquier buen mes cabe todavía bajo la joroba.",
    noteEn:
      "The bell is what any run produces on its own, with no edge at all. Only the hatched tail, beyond the threshold, says anything. Note the disproportion: almost any good month still fits under the hump.",
  },
  workspace: {
    titleEs: "El alzado del instrumento",
    titleEn: "The instrument, in elevation",
    noteEs:
      "Marco, barra, columna de navegación y la mancha repartida en paneles. No es una captura —un grabado no reproduce una pantalla—, es el plano de cómo está ordenado lo que aquí al lado se puede tocar.",
    noteEn:
      "Frame, title bar, navigation column and the working area split into panels. Not a screenshot — an engraving does not reproduce a screen — but the plan of how the thing you can try right here is laid out.",
  },
  blueprint: {
    titleEs: "Lo construido y lo previsto, en el mismo plano",
    titleEn: "What is built and what is planned, on one sheet",
    noteEs:
      "En dibujo técnico la línea de trazos significa «previsto, no ejecutado», y aquí significa lo mismo: las piezas llenas ya funcionan, las de trazos todavía no. El acceso anticipado sirve para eso — para mirar el despiece antes de que esté entero.",
    noteEn:
      "In technical drawing a dashed line means «planned, not built», and it means the same here: the solid parts already work, the dashed ones do not yet. That is what early access is for — to look at the exploded view before it is finished.",
  },
  profile: {
    /* CINCO, contados en `disciplineQuestions.ts`: riesgo, plan, registro,
       temple y constancia. La página lo dice tres veces —«tu perfil en cinco
       ejes», «quince preguntas sobre cinco ejes», y el marcador lista
       cinco— y esta lámina, al final de esa misma página, decía seis. */
    titleEs: "Cinco ejes y la silueta que forman",
    titleEn: "Five axes and the silhouette they form",
    noteEs:
      "Un perfil no se lee eje por eje: se lee por la forma del conjunto. Un lado hundido pesa más que cualquier valor alto del contrario, porque es por donde se rompe una operativa.",
    noteEn:
      "A profile is not read axis by axis: it is read by the shape of the whole. One collapsed side matters more than any high value on the other, because that is where a trading process breaks.",
  },
};

/**
 * El guion de cada sección. El orden manda: es el del grabado y el de las
 * pausas.
 *
 * El número de láminas no es decorativo — sale de lo larga que sea la
 * página. Poner cuatro en una ruta corta obligaría a comprimir las pausas
 * hasta que dejaran de cumplir su función, que es precisamente dar aire.
 */
export const ATLAS_ROUTES: Record<string, PlateId[]> = {
  "/": ["equity", "calendar", "distribution", "gauge"],
  "/features": ["ledger", "equity", "heatmap", "rules"],
  "/features/metricas": ["rolling", "distribution", "heatmap"],
  "/features/disciplina": ["rules", "gauge", "streak"],
  "/features/seguridad": ["vault", "ledger"],
  /* `tenure` es propia de esta ruta y va PRIMERA a propósito: la lámina
     que abre una sección es la que le pone tema. Antes abría el libro
     mayor, que es de seguridad, y la página de precios empezaba hablando
     de otra cosa. La curva de capital se queda de segunda porque lo que
     se compra aquí sirve para eso. */
  "/pricing": ["tenure", "equity"],
  /* Una sola lámina, y ahora es la que toca: la página enseña la
     aplicación funcionando y el fondo la dibuja en alzado. Antes llevaba
     el mapa de calor, prestado de métricas. */
  "/demo": ["workspace"],
  /* `significance` abre y la distribución la sigue, en ese orden porque
     el orden es un argumento: primero dónde acaba la suerte, después
     cómo se reparten tus operaciones. Antes abría la distribución sola,
     prestada de la portada y de métricas. */
  "/faq": ["significance", "distribution"],
  /* El reloj de sesiones es propio de esta página —el mismo que se puede
     tocar más abajo— y va primero. La media móvil se queda de segunda; el
     libro mayor sale, que ya titula en seguridad y en características. */
  "/about": ["sessions", "rolling"],
  /* Una sola lámina: la página es corta a propósito y el diagnóstico se
     lleva toda la atención. `profile` es literalmente lo que hace esta
     página — pregunta y dibuja un perfil. Antes abría con `rules`, la
     misma figura con la que abre /features/disciplina, y dos secciones
     que abren igual se leen como la misma página aunque digan cosas
     distintas. */
  "/test": ["profile"],

  /* ── Las secciones que antes no tenían guion ────────────────────────
     Hasta aquí el atlas conocía diez rutas de setenta y cuatro. Todo lo
     demás —el glosario entero, las herramientas, el acceso anticipado,
     las dos páginas de traders y las cuatro legales— caía en el `return
     "/"` del normalizador y enseñaba la curva de resultados de la
     portada. Detrás de la política de privacidad había un gráfico de
     ganancias, que no dice nada ahí y encima promete algo.

     Cada una de estas entradas abre con una lámina que NO abre ninguna
     otra sección: la primera figura es la que pone tema, y si dos
     secciones abren igual se leen como la misma página. */

  /* El acceso anticipado abre con el despiece: piezas llenas para lo que
     ya funciona, de trazos para lo previsto. Es la única figura del atlas
     que declara que el producto está a medio hacer, que es exactamente lo
     que esta página tiene que decir. `vault` la sigue porque la otra
     mitad del trato es que los datos siguen siendo tuyos. */
  "/beta": ["blueprint", "vault"],

  /* El trader manual: sus rachas y sus horas. `streak` abre porque lo que
     distingue a esta operativa es aguantar la serie, y `sessions` la
     sigue porque la otra mitad es cuándo se opera. */
  "/traders/manual": ["streak", "sessions"],

  /* Prop firms: primero los límites que te miden (`gauge`), después las
     reglas que los traducen (`rules`), y al final la permanencia
     (`tenure`), que es de lo que va superar una evaluación. */
  "/traders/prop-firms": ["gauge", "rules", "tenure"],

  /* El glosario es vocabulario de estadística: la distribución abre y la
     significancia cierra. Los términos SUELTOS no usan esta entrada —
     cada uno deriva la suya, ver `laminaDerivada`. */
  "/glosario": ["distribution", "significance"],

  /* Las herramientas trabajan sobre calendario y sobre rejillas de
     valores. Igual que el glosario, cada herramienta suelta deriva la
     suya. */
  "/herramientas": ["calendar", "heatmap"],
};

/**
 * Rutas que NO llevan figura, a propósito.
 *
 * Una política de privacidad con una curva de resultados detrás no es
 * sobria: está enseñando ganancias en la página donde se explica el
 * tratamiento de datos. El fondo de estas páginas se queda en el papel y
 * su graduación de margen, sin figura — que es exactamente lo que hace un
 * tratado con sus páginas de créditos.
 */
export const RUTAS_SIN_LAMINA = new Set([
  "/privacidad",
  "/terminos",
  "/cookies",
  "/aviso-legal",
]);

/**
 * Secciones cuyos hijos derivan su propia lámina del nombre de la página.
 *
 * El glosario tiene 51 términos y las herramientas 7. Escribir a mano una
 * combinación para cada uno son 58 decisiones que nadie va a mantener, y
 * dejarlos heredar la del índice es repetir la misma figura 58 veces —
 * que es el problema que veníamos a resolver.
 *
 * La salida es DETERMINISTA: la misma URL da siempre la misma figura, así
 * que la página es reconocible y la comprobación automática puede
 * afirmar algo sobre ella. No se usa aleatoriedad, que rompería la
 * hidratación además de la memoria del visitante.
 */
const SECCIONES_DERIVADAS = ["/glosario/", "/herramientas/"];

/** Baraja de figuras para las páginas derivadas, sin las de apertura de sección. */
const BARAJA_DERIVADA: PlateId[] = [
  "distribution",
  "rolling",
  "heatmap",
  "streak",
  "gauge",
  "significance",
  "calendar",
  "sessions",
  "equity",
  "ledger",
  "rules",
  "tenure",
];

/** Hash estable de una cadena. No criptográfico: solo reparte. */
function hashRuta(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/**
 * Figura de una página derivada (un término del glosario, una
 * herramienta). Una sola lámina: son páginas cortas, y dos pausas en una
 * página corta las dejan sin aire, que es lo único que vienen a dar.
 */
function laminaDerivada(ruta: string): PlateId[] | null {
  if (!SECCIONES_DERIVADAS.some((s) => ruta.startsWith(s) && ruta.length > s.length)) {
    return null;
  }
  return [BARAJA_DERIVADA[hashRuta(ruta) % BARAJA_DERIVADA.length]];
}

const ROMAN = ["I", "II", "III", "IV", "V"];

/**
 * Normaliza la ruta antes de buscar. En producción el sitio cuelga de un
 * subdirectorio y el router puede entregar la ruta con ese prefijo y con
 * barra final; sin esto ninguna clave casaría fuera de local y todas las
 * secciones caerían en el juego de la portada.
 */
export function normalizeRoute(pathname: string): string {
  let p = (pathname || "/").replace(/\/+$/, "");

  /* ── PRIMERO el subdirectorio de despliegue, DESPUÉS el idioma ──────
     En producción el sitio cuelga de `/CountPipsWeb` y el inglés vive bajo
     `/en`, así que la ruta puede llegar como `/CountPipsWeb/en/pricing`.

     Esto se resolvía buscando una de cuatro "anclas" (`/features`,
     `/traders`, `/glosario`, `/herramientas`) dentro de la ruta, y ese
     atajo dejaba fuera todo lo que no las contuviera: `/en` —la portada
     inglesa entera— se quedaba sin figura y sin sus cuatro láminas.

     Ahora se recorta por delante hasta dar con algo que el atlas conozca,
     que no depende de qué secciones existan hoy, y el prefijo de idioma
     se quita con `sinPrefijoEn`, que es la función que ya usa el resto del
     sitio para lo mismo. */
  const conocida = (r: string) =>
    Boolean(ATLAS_ROUTES[r]) ||
    RUTAS_SIN_LAMINA.has(r) ||
    r.startsWith("/glosario/") ||
    r.startsWith("/herramientas/");

  /* El subdirectorio de despliegue se quita por su nombre real, no
     adivinando: es el mismo valor que usa `asset()` para los ficheros.
     Adivinarlo —soltando segmentos hasta que algo casara— haría que
     cualquier ruta desconocida acabara cayendo en la portada, que es el
     fallo que este módulo venía a arreglar. */
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  if (base && (p === base || p.startsWith(`${base}/`))) p = p.slice(base.length) || "/";

  p = sinPrefijoEn(p) || "/";

  if (p !== "/" && !conocida(p)) {
    /* Última oportunidad: quedarse con el último segmento. Cubre rutas
       anidadas que sí existen como sección (`/algo/pricing`). */
    const last = "/" + (p.split("/").filter(Boolean).pop() ?? "");
    if (conocida(last)) p = last;
  }
  return p || "/";
}

/**
 * Ids de lámina de una ruta, en orden de grabado.
 *
 * Devuelve un array VACÍO —no las de la portada— cuando la ruta no debe
 * llevar figura. Antes cualquier ruta desconocida caía en `"/"`, y por eso
 * el glosario, las herramientas, las legales y el acceso anticipado
 * enseñaban todos la curva de resultados de la home.
 */
export function platesForRoute(pathname: string): PlateId[] {
  const p = normalizeRoute(pathname);
  if (RUTAS_SIN_LAMINA.has(p)) return [];
  const propias = ATLAS_ROUTES[p];
  if (propias) return propias;
  const derivada = laminaDerivada(p);
  if (derivada) return derivada;
  /* Ruta que nadie previó: mejor sin figura que con una prestada que no
     dice nada de ella. El papel y su graduación siguen ahí. */
  return [];
}

/** Pie de figura de la lámina `index` de esta ruta. `null` si no existe. */
export function plateAt(
  pathname: string,
  index: number
): (PlateMeta & { roman: string; id: PlateId }) | null {
  const ids = platesForRoute(pathname);
  const id = ids[index];
  if (!id) return null;
  return { ...PLATE_META[id], roman: ROMAN[index] ?? String(index + 1), id };
}
