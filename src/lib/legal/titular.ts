/**
 * Datos del responsable del sitio, en un solo lugar: las cuatro páginas
 * legales los leen de aquí para no contradecirse.
 *
 * Los cuatro primeros son los que la ley pide publicar: el RGPD (art. 13) en
 * la política de privacidad, porque la web ya recoge correos, y la LSSI
 * (art. 10) en el aviso legal. Vacíos a propósito hasta que el titular los
 * dé: un dato fiscal inventado es peor que su ausencia.
 * `tests/titular-legal.test.ts` no deja publicar con alguno vacío o mal
 * formado.
 */

export type DatosTitular = {
  /** Nombre y apellidos, o razón social si es una empresa. */
  nombreFiscal: string;
  /** NIF, NIE o CIF. */
  nif: string;
  /** Domicilio a efectos de notificaciones (vale uno profesional). */
  domicilio: string;
  /** Correo público para consultas y para ejercer los derechos de privacidad. */
  correo: string;
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
  correo: "",
  nombreComercial: "CountPips",
  jurisdiccion: "España",
  jurisdiccionEn: "Spain",
};

/** Campos que la ley obliga a publicar; ninguno puede quedar vacío. */
export const CAMPOS_OBLIGATORIOS = ["nombreFiscal", "nif", "domicilio", "correo"] as const;

/** Fecha de la última revisión de los textos legales; va a mano y se actualiza al revisarlos. */
export const LEGAL_ACTUALIZADO = "2026-10-10";
