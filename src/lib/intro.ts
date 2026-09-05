/**
 * La cortina de primera visita, como estado compartido.
 *
 * `IntroSequence` la levanta; el atlas del fondo (`EngravedAtlas`) espera a
 * que se levante para empezar su grabado de bienvenida. Antes el grabado
 * arrancaba al montar el lienzo, y como el loader tapa la pantalla durante
 * el primer segundo largo, media lámina ya estaba dibujada cuando el
 * visitante llegaba a verla: el gesto que justifica el atlas ocurría
 * detrás de un telón.
 *
 * Es un módulo y no un evento a secas porque el atlas se carga en diferido
 * y puede montar DESPUÉS de que la cortina se haya ido; con sólo un evento
 * se lo perdería y no arrancaría nunca.
 */
const EVENTO = "tj:cortina-levantada";
let levantada = false;

export function cortinaLevantada(): boolean {
  return levantada;
}

/** Idempotente: la segunda llamada no vuelve a avisar a nadie. */
export function levantarCortina(): void {
  if (levantada) return;
  levantada = true;
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(EVENTO));
}

/** Llama a `fn` cuando la cortina se levante — ya mismo si ya lo está. */
export function alLevantarCortina(fn: () => void): () => void {
  if (levantada) {
    fn();
    return () => {};
  }
  const h = () => {
    window.removeEventListener(EVENTO, h);
    fn();
  };
  window.addEventListener(EVENTO, h);
  return () => window.removeEventListener(EVENTO, h);
}
