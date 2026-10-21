/**
 * Interruptor de los atajos globales de una sola tecla (`?`, `T`, `L`, `g` +
 * letra). WCAG 2.1.4 pide poder apagarlos: quien dicta por voz o roza el
 * teclado cambia de idioma sin querer. Se recuerda solo lo apagado; leer o
 * guardar nunca lanza, y sin almacenamiento la elección vale para la visita.
 */
const CLAVE_ATAJOS = "tj-atajos";
let enEstaVisita: boolean | null = null;

export function atajosEncendidos(): boolean {
  if (enEstaVisita !== null) return enEstaVisita;
  try {
    return localStorage.getItem(CLAVE_ATAJOS) !== "no";
  } catch {
    return true;
  }
}

export function fijarAtajos(encendidos: boolean) {
  enEstaVisita = encendidos;
  try {
    if (encendidos) localStorage.removeItem(CLAVE_ATAJOS);
    else localStorage.setItem(CLAVE_ATAJOS, "no");
  } catch {
    /* Almacenamiento bloqueado: queda `enEstaVisita`. */
  }
}
