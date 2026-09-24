/**
 * Las quince preguntas del test de disciplina.
 *
 * ── Por qué viven en un fichero aparte, y no dentro de DisciplineScore.tsx ──
 * Estaban ahí, y funcionaba mientras solo las consumía ese componente.
 * Dejó de funcionar el día que `/test` necesitó las mismas preguntas para
 * construir el dato estructurado `Quiz` de Google: `DisciplineScore.tsx`
 * lleva `"use client"`, y un componente de servidor no puede importar un
 * valor plano — un array, un tipo— desde un módulo de cliente. En el
 * servidor, ese módulo se sustituye por un sustituto que solo sabe hacer
 * de componente; `QUESTIONS.map` deja de ser una función y la
 * compilación entera falla.
 *
 * La solución no es evitar que el servidor importe los datos: es que los
 * datos no vivan en un módulo de cliente. Aquí no hay `"use client"`, así
 * que tanto `DisciplineScore` (que los pinta) como `app/test/page.tsx`
 * (que construye el `Quiz` a partir de ellos) los importan sin problema.
 * Es el mismo patrón que ya usan el glosario y las herramientas: los
 * datos en `src/lib/`, la presentación en `src/components/`.
 */

export type DimId = "riesgo" | "plan" | "registro" | "temple" | "constancia";

export type Q = {
  dim: DimId;
  /* 1 a 3. Cuánto revela esta pregunta sobre el eje. */
  weight: number;
  qEs: string;
  qEn: string;
  /* Siempre de peor a mejor conducta: 0 puntos la primera, 3 la última. */
  options: { es: string; en: string }[];
};

export const QUESTIONS: Q[] = [
  /* ── RIESGO ──────────────────────────────────────────────────────── */
  {
    dim: "riesgo",
    weight: 3,
    qEs: "Antes de abrir una operación, ¿sabes cuánto dinero pierdes si sale mal?",
    qEn: "Before opening a trade, do you know how much money you lose if it goes wrong?",
    options: [
      { es: "No lo calculo", en: "I don't work it out" },
      { es: "Una idea aproximada", en: "A rough idea" },
      { es: "Sí, en porcentaje de la cuenta", en: "Yes, as a % of the account" },
      { es: "Sí, la cifra exacta en dinero", en: "Yes, the exact figure in money" },
    ],
  },
  {
    dim: "riesgo",
    weight: 3,
    qEs: "Cuando una operación va en contra, ¿mueves el stop para darle margen?",
    qEn: "When a trade goes against you, do you move the stop to give it room?",
    options: [
      { es: "Sí, casi siempre", en: "Yes, almost always" },
      { es: "A veces, si creo en la idea", en: "Sometimes, if I believe in the idea" },
      { es: "Casi nunca", en: "Almost never" },
      { es: "Nunca. Donde lo puse, se queda", en: "Never. Where I put it, it stays" },
    ],
  },
  {
    dim: "riesgo",
    weight: 2,
    qEs: "¿Tienes un límite de pérdida diaria que te haga parar?",
    qEn: "Do you have a daily loss limit that makes you stop?",
    options: [
      { es: "No", en: "No" },
      { es: "Lo tengo, pero me lo salto", en: "I have one, but I break it" },
      { es: "Sí, y casi siempre lo respeto", en: "Yes, and I mostly respect it" },
      { es: "Sí, y cierro la plataforma al tocarlo", en: "Yes, and I close the platform when hit" },
    ],
  },

  /* ── PLAN ────────────────────────────────────────────────────────── */
  {
    dim: "plan",
    weight: 3,
    qEs: "¿Defines entrada, stop y objetivo antes de entrar?",
    qEn: "Do you define entry, stop and target before entering?",
    options: [
      { es: "Lo decido sobre la marcha", en: "I decide on the fly" },
      { es: "La entrada sí, el resto después", en: "Entry yes, the rest later" },
      { es: "Casi siempre los tres", en: "Almost always all three" },
      { es: "Siempre, y por escrito", en: "Always, and written down" },
    ],
  },
  {
    dim: "plan",
    weight: 2,
    qEs: "¿Tienes tus situaciones de entrada escritas con reglas concretas?",
    qEn: "Do you have your setups written down with concrete rules?",
    options: [
      { es: "No, las llevo en la cabeza", en: "No, they're in my head" },
      { es: "Apuntes sueltos", en: "Loose notes" },
      { es: "Sí, documentadas", en: "Yes, documented" },
      { es: "Sí, y mido cuánto rinde cada una", en: "Yes, and I measure how each performs" },
    ],
  },
  {
    dim: "plan",
    weight: 2,
    qEs: "¿Entras en operaciones que no encajan en ninguna de tus reglas?",
    qEn: "Do you take trades that fit none of your rules?",
    options: [
      { es: "A menudo, si lo veo claro", en: "Often, if it looks clear" },
      { es: "Alguna vez a la semana", en: "A few times a week" },
      { es: "Rara vez", en: "Rarely" },
      { es: "No. Si no encaja, no existe", en: "No. If it doesn't fit, it doesn't exist" },
    ],
  },

  /* ── REGISTRO ────────────────────────────────────────────────────── */
  {
    dim: "registro",
    weight: 2,
    qEs: "¿Anotas tus operaciones con el motivo de cada una?",
    qEn: "Do you log your trades with the reason for each?",
    options: [
      { es: "No anoto nada", en: "I log nothing" },
      { es: "Solo el resultado", en: "Only the result" },
      { es: "Sí, con el motivo", en: "Yes, with the reason" },
      { es: "Sí, con motivo, estado y captura", en: "Yes, with reason, state and screenshot" },
    ],
  },
  {
    dim: "registro",
    weight: 3,
    qEs: "¿Sabes cuánto ganas de media por operación, medido?",
    qEn: "Do you know your measured average result per trade?",
    options: [
      { es: "Ni idea", en: "No idea" },
      { es: "Sé si voy ganando o perdiendo", en: "I know if I'm up or down" },
      { es: "Sé mi porcentaje de aciertos", en: "I know my win rate" },
      { es: "Sé mi expectancy y mi R medio", en: "I know my expectancy and average R" },
    ],
  },
  {
    dim: "registro",
    weight: 2,
    qEs: "¿Cada cuánto revisas tus datos?",
    qEn: "How often do you review your data?",
    options: [
      { es: "Nunca", en: "Never" },
      { es: "Cuando algo va mal", en: "When something goes wrong" },
      { es: "De vez en cuando", en: "Now and then" },
      { es: "Un día fijo, todas las semanas", en: "A fixed day, every week" },
    ],
  },

  /* ── TEMPLE ──────────────────────────────────────────────────────── */
  {
    dim: "temple",
    weight: 3,
    qEs: "Después de una pérdida grande, ¿aumentas el tamaño para recuperarla?",
    qEn: "After a big loss, do you increase size to win it back?",
    options: [
      { es: "Sí, quiero recuperar ya", en: "Yes, I want it back now" },
      { es: "A veces se me va la mano", en: "Sometimes I overdo it" },
      { es: "No, mantengo el tamaño", en: "No, I keep the size" },
      { es: "No, lo reduzco hasta recomponerme", en: "No, I cut it until I'm steady" },
    ],
  },
  {
    dim: "temple",
    weight: 2,
    qEs: "¿Cierras ganadoras antes de tiempo por miedo a que se den la vuelta?",
    qEn: "Do you close winners early for fear they'll turn?",
    options: [
      { es: "Casi siempre", en: "Almost always" },
      { es: "Bastante a menudo", en: "Fairly often" },
      { es: "Alguna vez", en: "Occasionally" },
      { es: "No, dejo correr hasta mi objetivo", en: "No, I let it run to my target" },
    ],
  },
  {
    dim: "temple",
    weight: 2,
    qEs: "¿Operas cansado, enfadado o con prisa?",
    qEn: "Do you trade tired, angry or in a hurry?",
    options: [
      { es: "Sí, opero igual", en: "Yes, I trade anyway" },
      { es: "A veces, sin pensarlo", en: "Sometimes, without thinking" },
      { es: "Rara vez", en: "Rarely" },
      { es: "No. Si no estoy bien, no abro nada", en: "No. If I'm not right, I open nothing" },
    ],
  },

  /* ── CONSTANCIA ──────────────────────────────────────────────────── */
  {
    dim: "constancia",
    weight: 2,
    qEs: "¿Cuánto llevas operando con el mismo método, sin cambiarlo?",
    qEn: "How long have you traded the same method without changing it?",
    options: [
      { es: "Cambio cada pocas semanas", en: "I change every few weeks" },
      { es: "Un mes o dos", en: "A month or two" },
      { es: "Tres a seis meses", en: "Three to six months" },
      { es: "Más de seis meses", en: "More than six months" },
    ],
  },
  {
    dim: "constancia",
    weight: 2,
    qEs: "En las últimas diez sesiones, ¿cuántas seguiste tu plan entero?",
    qEn: "Of your last ten sessions, how many did you follow your plan in full?",
    options: [
      { es: "Menos de tres", en: "Fewer than three" },
      { es: "Entre tres y cinco", en: "Three to five" },
      { es: "Entre seis y ocho", en: "Six to eight" },
      { es: "Nueve o diez", en: "Nine or ten" },
    ],
  },
  {
    dim: "constancia",
    weight: 1,
    qEs: "¿Repasas tus errores anteriores antes de empezar la sesión?",
    qEn: "Do you review your past mistakes before starting the session?",
    options: [
      { es: "Nunca", en: "Never" },
      { es: "Casi nunca", en: "Almost never" },
      { es: "A veces", en: "Sometimes" },
      { es: "Sí, forma parte de mi rutina", en: "Yes, it's part of my routine" },
    ],
  },
];
