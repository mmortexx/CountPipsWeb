"use client";

import { useEffect, useRef, useState } from "react";

/**
 * EL RESULTADO DE UNA HERRAMIENTA, DICHO EN VOZ ALTA
 *
 * Las cinco herramientas del sitio recalculan mientras se teclea, y quien
 * no ve la pantalla no se enteraba de nada: medido en las cinco, al tocar
 * una entrada cambiaban entre 6 y 19 líneas de texto y ninguna de ellas
 * estaba dentro de una región que el lector de pantalla anunciara. La
 * calculadora de riesgo avisaba del error de validación —`role="alert"`—
 * pero no del número, que es lo que se ha ido a buscar.
 *
 * Esto NO se arregla poniendo `aria-live` sobre el panel de resultados.
 * Dos motivos, y los dos convierten la ayuda en un estorbo:
 *
 *  · El panel entero son doce líneas. Anunciarlas cada vez que cambia un
 *    dígito es ruido, no información. Aquí se anuncia UNA frase, la que
 *    resume lo que se ha venido a saber.
 *  · React vuelve a pintar en cada pulsación, así que un `aria-live`
 *    directo dispara un anuncio por tecla: escribir «1500» son cuatro
 *    lecturas, tres de ellas de cifras que nadie quiso. Por eso el texto
 *    se publica con retardo y el reloj se reinicia en cada cambio: solo
 *    se dice el valor que ha quedado quieto.
 *
 * Y no dice nada al cargar la página. Un `role="status"` que nace con
 * texto dentro lo leen algunos lectores nada más entrar, encima del
 * titular, y el visitante no ha hecho nada todavía.
 *
 * `role="status"` ya implica `aria-live="polite"`; se declaran los dos
 * porque hay lectores que solo atienden a uno.
 */
export function ResultadoAnunciado({
  texto,
  retardo = 700,
}: {
  /** Una frase. Lo que diría alguien al mirar el resultado por encima. */
  texto: string;
  /** Milisegundos que el valor tiene que quedarse quieto antes de decirlo. */
  retardo?: number;
}) {
  const [anunciado, setAnunciado] = useState("");
  const primero = useRef(true);

  useEffect(() => {
    if (primero.current) {
      primero.current = false;
      return;
    }
    const t = setTimeout(() => setAnunciado(texto), retardo);
    return () => clearTimeout(t);
  }, [texto, retardo]);

  return (
    <p role="status" aria-live="polite" className="sr-only">
      {anunciado}
    </p>
  );
}
