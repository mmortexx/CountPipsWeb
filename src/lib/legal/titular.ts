/**
 * Datos del responsable del sitio, en un solo lugar: las cuatro páginas
 * legales los leen de aquí para no contradecirse.
 *
 * `nombreFiscal`, `nif` y `domicilio` están vacíos a propósito: un dato fiscal
 * falso es peor que su ausencia. Mientras la web solo informa, las páginas lo
 * dicen en pantalla (detectan solas el campo vacío). Rellenarlos es requisito
 * de la ley de servicios de la sociedad de la información para abrir la
 * venta, no para publicar el sitio.
 */

export type DatosTitular = {
  /** Nombre o razón social de quien presta el servicio. */
  nombreFiscal: string;
  /** NIF / CIF. */
  nif: string;
  /** Domicilio a efectos de notificaciones. */
  domicilio: string;
  /** Nombre comercial del producto. */
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

/** Fecha de la última revisión de los textos legales; va a mano y se actualiza al revisarlos. */
export const LEGAL_ACTUALIZADO = "2026-09-26";
