/**
 * Los datos del responsable del sitio, en UN solo lugar.
 *
 * Las cuatro páginas legales los leen de aquí. Escribirlos a mano en cada
 * una garantizaría que algún día dejen de coincidir, y cuatro documentos
 * legales que se contradicen entre sí son peores que ninguno.
 *
 * ── LO QUE FALTA, Y HASTA CUÁNDO SE PUEDE ESPERAR ─────────────────────
 * `NOMBRE_FISCAL`, `NIF` y `DOMICILIO` están vacíos a propósito: no me los
 * puedo inventar, y un dato fiscal falso en un aviso legal es peor que la
 * ausencia del dato.
 *
 * Mientras la web solo informa y recoge correos para una lista de espera,
 * las páginas se publican sin ellos y lo dicen abiertamente en pantalla.
 * En cuanto haya venta —que es actividad económica— la ley de servicios de
 * la sociedad de la información obliga a identificar al prestador con
 * nombre, identificación fiscal y domicilio. Rellenar esto es, por tanto,
 * requisito para abrir la pasarela de pago, no para publicar el sitio.
 *
 * Las páginas detectan solas si un campo está vacío y muestran un aviso en
 * su lugar; no hay que tocar nada más que este archivo.
 */

export type DatosTitular = {
  /** Nombre o razón social de quien presta el servicio. */
  nombreFiscal: string;
  /** NIF / CIF. */
  nif: string;
  /** Domicilio a efectos de notificaciones. */
  domicilio: string;
  /** Nombre comercial del producto. Este sí lo sabemos. */
  nombreComercial: string;
  /** Jurisdicción cuyos tribunales conocen de los conflictos. */
  jurisdiccion: string;
  /** La misma jurisdicción, nombrada en inglés. */
  jurisdiccionEn: string;
};

export const TITULAR: DatosTitular = {
  nombreFiscal: "",
  nif: "",
  domicilio: "",
  nombreComercial: "CountPips",
  jurisdiccion: "España",
  jurisdiccionEn: "Spain",
};

/** `true` cuando faltan datos obligatorios para poder vender. */
export const titularIncompleto =
  !TITULAR.nombreFiscal.trim() || !TITULAR.nif.trim() || !TITULAR.domicilio.trim();

/**
 * Fecha de la última revisión de los textos legales.
 *
 * Va a mano y no con la fecha del sistema: un documento legal que cambia
 * de fecha en cada compilación, sin que su contenido cambie, no informa de
 * nada. Se actualiza cuando se revise el texto.
 */
export const LEGAL_ACTUALIZADO = "2026-09-24";
