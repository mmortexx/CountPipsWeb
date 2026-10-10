/**
 * ============================================================
 *  ADMISIÓN DE BETA — endpoint temporal para Google Sheets
 * ============================================================
 *
 * Este archivo NO forma parte de la web. Es el trozo que vive en tu
 * cuenta de Google y guarda cada solicitud cualificada en una hoja. La
 * selección se hace por perfil y cohorte; no se muestran puestos en cola.
 *
 * ------------------------------------------------------------
 *  CÓMO INSTALARLO (una sola vez, ~5 minutos)
 * ------------------------------------------------------------
 *
 *  1. Entra en https://sheets.google.com y crea una hoja nueva.
 *     Ponle el nombre que quieras, por ejemplo "Lista de espera".
 *
 *  2. En el menú de la hoja: Extensiones → Apps Script.
 *     Se abre un editor con un archivo `Código.gs` que trae dentro
 *     algo como `function myFunction() {}`.
 *
 *  3. BORRA todo lo que haya en ese editor y pega TODO el contenido
 *     de este archivo en su lugar. Guarda (el icono del disquete).
 *
 *  4. Arriba a la derecha: botón azul "Implementar" → "Nueva
 *     implementación".
 *       · Pulsa el engranaje junto a "Seleccionar tipo" y elige
 *         "Aplicación web".
 *       · "Ejecutar como":        Yo (tu correo)
 *       · "Quién tiene acceso":   Cualquier usuario
 *       · Pulsa "Implementar".
 *
 *  5. Google te pedirá permiso la primera vez. Acepta. Si aparece un
 *     aviso de "Google no ha verificado esta aplicación", pulsa
 *     "Configuración avanzada" → "Ir a (nombre del proyecto)". Es tu
 *     propio script; el aviso sale porque no está publicado en su
 *     tienda.
 *
 *  6. Al terminar te da una "URL de la aplicación web", que acaba en
 *     /exec. CÓPIALA: es lo único que necesita la web.
 *
 *       · En tu ordenador, para probar en local: pégala en el archivo
 *         `.env.local` de la web, en la línea
 *         NEXT_PUBLIC_WAITLIST_URL=
 *
 *       · Para la web publicada: GitHub → el repositorio →
 *         Settings → Secrets and variables → Actions →
 *         "New repository secret" → Name: WAITLIST_URL,
 *         Secret: la URL. El siguiente despliegue ya la usa.
 *         (BETA_API_URL es para el Worker; si existe, gana él y
 *         la hoja no recibe nada.)
 *
 *  7. COMPROBACIÓN: abre la URL en el navegador tal cual. Debe
 *     responder algo como {"ok":true,"count":0}. Si responde eso, está
 *     bien puesto.
 *
 *  Si algún día cambias este script, hay que volver a "Implementar" →
 *  "Gestionar implementaciones" → editar (el lápiz) → Versión: "Nueva
 *  versión" → "Implementar", o la web seguirá hablando con la versión
 *  antigua. La URL no cambia al hacerlo.
 *
 * ------------------------------------------------------------
 *  QUÉ HACE
 * ------------------------------------------------------------
 *
 *  SOLICITUDES (POST)
 *  · Añade una fila por aplicación: perfil, experiencia, mercados, método
 *    de journal, objetivo, nota opcional, idioma y trazabilidad UTM.
 *  · Si el email YA estaba, no lo duplica ni devuelve una posición.
 *  · Descarta lo que llegue con el campo trampa relleno (bots).
 *  · Usa un candado (LockService): dos altas simultáneas ya no pueden
 *    pisarse la fila ni repartir el mismo puesto a dos personas.
 *
 *  SEGURIDAD
 *  · Honeypot, deduplicación, bloqueo transaccional, origen permitido y
 *    límite por email. Turnstile se valida si configuras su secreto.
 *
 *  Sobre CORS, que es lo que suele romper esto: la web envía el cuerpo
 *  como `text/plain` a propósito. Con `application/json` el navegador
 *  manda antes una petición OPTIONS de comprobación, y Apps Script no
 *  sabe responderla — la petición se bloquearía. Con `text/plain` el
 *  navegador la considera "simple", no hay comprobación previa, y la
 *  respuesta sí se puede leer. Poder leerla es imprescindible: sin eso
 *  la web no sabría si el alta se guardó y tendría que fingir que sí.
 */

/** Nombre de la pestaña donde se escriben las altas. Se crea sola. */
var HOJA = "Inscripciones";

/** Cabeceras de la tabla. Se escriben solas la primera vez. */
var CABECERAS = [
  "Fecha", "Email", "Perfil", "Experiencia", "Mercados", "Journal actual",
  "Objetivo", "Notas", "Idioma", "Comunicaciones", "Origen", "UTM source",
  "UTM medium", "UTM campaign"
];

/** Segundos que se guarda el total en caché antes de volver a contar. */
var CACHE_SEGUNDOS = 30;

/** Clave con la que se guarda el total en la caché del script. */
var CACHE_CLAVE = "waitlist_total";

/** Configura TURNSTILE_SECRET en las propiedades del proyecto para activarlo. */
var TURNSTILE_SECRET = PropertiesService.getScriptProperties().getProperty("TURNSTILE_SECRET") || "";
var RATE_LIMIT_SECONDS = 60;
var ORIGENES_PERMITIDOS = [
  "https://mmortexx.github.io",
  "https://countpips.com",
  "https://www.countpips.com",
  "http://localhost:3000",
];

/* ============================================================
   ALTAS
   ============================================================ */

function doPost(e) {
  var candado = LockService.getScriptLock();
  try {
    var datos = JSON.parse(e.postData.contents);

    // Campo trampa: invisible para personas, tentador para bots.
    // Si llega con contenido, respondemos "ok" sin guardar nada — así
    // el bot no aprende que ha sido detectado.
    if (datos.botcheck) {
      return responder(e, { ok: true, duplicate: false });
    }

    if (datos.origin && ORIGENES_PERMITIDOS.indexOf(String(datos.origin)) === -1) {
      return responder(e, { ok: false, error: "origen_no_autorizado" });
    }

    if (TURNSTILE_SECRET && !verificarTurnstile(String(datos.turnstileToken || ""))) {
      return responder(e, { ok: false, error: "anti_bot" });
    }

    var email = String(datos.email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return responder(e, { ok: false, error: "email_invalido" });
    }

    var cache = CacheService.getScriptCache();
    var rateKey = "beta_rate_" + Utilities.base64EncodeWebSafe(email).slice(0, 80);
    if (cache.get(rateKey)) {
      return responder(e, { ok: false, error: "demasiadas_petitions" });
    }
    cache.put(rateKey, "1", RATE_LIMIT_SECONDS);

    // Sin candado, dos altas a la vez leen el mismo `getLastRow()` y
    // una sobrescribe a la otra. 20 s es de sobra para una escritura;
    // si no se consigue, es mejor devolver un fallo honesto que
    // arriesgarse a perder el alta en silencio.
    if (!candado.tryLock(20000)) {
      return responder(e, { ok: false, error: "ocupado" });
    }

    var hoja = obtenerHoja();
    var totalPrevio = Math.max(hoja.getLastRow() - 1, 0);

    // ¿Ya estaba? Devolvemos su puesto en vez de crear un duplicado.
    if (totalPrevio > 0) {
      var columnaEmail = hoja.getRange(2, 2, totalPrevio, 1).getValues();
      for (var i = 0; i < columnaEmail.length; i++) {
        if (String(columnaEmail[i][0]).trim().toLowerCase() === email) {
          return responder(e, {
            ok: true,
            duplicate: true,
          });
        }
      }
    }

    hoja.appendRow([
      new Date(),
      email,
      String(datos.profile || "").slice(0, 20),
      String(datos.experience || "").slice(0, 20),
      String(datos.markets || "").slice(0, 120),
      String(datos.workflow || "").slice(0, 30),
      String(datos.goal || "").slice(0, 30),
      String(datos.notes || "").slice(0, 800),
      String(datos.lang || "").slice(0, 8),
      datos.marketingConsent === true ? "sí" : "no",
      String(datos.source || "").slice(0, 200),
      String(datos.utmSource || "").slice(0, 100),
      String(datos.utmMedium || "").slice(0, 100),
      String(datos.utmCampaign || "").slice(0, 100),
    ]);

    var total = hoja.getLastRow() - 1; // Fila 1 son las cabeceras.
    guardarEnCache(total);

    return responder(e, { ok: true, duplicate: false });
  } catch (err) {
    return responder(e, { ok: false, error: String(err) });
  } finally {
    // `releaseLock` sobre un candado no adquirido no hace nada, así que
    // es seguro llamarlo siempre.
    candado.releaseLock();
  }
}

/* ============================================================
   CONTADOR
   ============================================================ */

/**
 * Abrir la URL en el navegador devuelve el total. Sirve a la vez de
 * comprobación de que la implementación está viva y de fuente del
 * contador en vivo de la web.
 */
function doGet(e) {
  try {
    return responder(e, { ok: true, count: contarInscritos() });
  } catch (err) {
    return responder(e, { ok: false, error: String(err) });
  }
}

function contarInscritos() {
  var cache = CacheService.getScriptCache();
  var guardado = cache.get(CACHE_CLAVE);
  if (guardado !== null) {
    var n = parseInt(guardado, 10);
    if (!isNaN(n)) return n;
  }
  var total = Math.max(obtenerHoja().getLastRow() - 1, 0);
  guardarEnCache(total);
  return total;
}

function guardarEnCache(total) {
  try {
    CacheService.getScriptCache().put(
      CACHE_CLAVE,
      String(total),
      CACHE_SEGUNDOS
    );
  } catch (err) {
    // La caché es un lujo, no un requisito: si falla, se cuenta a mano.
  }
}

/** Valida el token de Turnstile en servidor cuando se ha configurado el secreto. */
function verificarTurnstile(token) {
  if (!token) return false;
  try {
    var respuesta = UrlFetchApp.fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "post",
      payload: { secret: TURNSTILE_SECRET, response: token },
      muteHttpExceptions: true,
    });
    var datos = JSON.parse(respuesta.getContentText() || "{}");
    return datos.success === true;
  } catch (err) {
    return false;
  }
}

/* ============================================================
   AUXILIARES
   ============================================================ */

function obtenerHoja() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = libro.getSheetByName(HOJA);
  if (!hoja) {
    hoja = libro.insertSheet(HOJA);
  }
  if (hoja.getLastRow() === 0) {
    hoja.appendRow(CABECERAS);
    hoja.setFrozenRows(1);
  }
  return hoja;
}

/**
 * Devuelve JSON normal o, si la petición trae `?callback=nombre`, el
 * mismo JSON envuelto en una llamada a esa función (JSONP).
 *
 * El nombre se filtra a identificadores de JavaScript (letras, dígitos,
 * `_`, `$` y puntos) antes de escribirlo en la respuesta. Sin ese
 * filtro, cualquiera podría meter código arbitrario en el parámetro y
 * hacer que este script se lo sirviera a un tercero.
 */
function responder(e, objeto) {
  var cuerpo = JSON.stringify(objeto);
  var callback = e && e.parameter ? String(e.parameter.callback || "") : "";

  if (callback && /^[A-Za-z_$][A-Za-z0-9_$.]{0,63}$/.test(callback)) {
    return ContentService.createTextOutput(
      callback + "(" + cuerpo + ");"
    ).setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService.createTextOutput(cuerpo).setMimeType(
    ContentService.MimeType.JSON
  );
}
