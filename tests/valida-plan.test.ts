import { describe, expect, it } from "vitest";
import { LIMITES } from "../src/lib/trading/limites";
import {
  excedeApalancamiento,
  mensajeFalloRegistro,
  revisaRegistro,
  rrPlanificado,
  TOPE_APALANCAMIENTO,
  validaPlan,
  validaRegistro,
  type FalloRegistro,
} from "../src/lib/trading/validaPlan";

/**
 * `validaPlan` exige, además de tres precios positivos y distintos, que el
 * objetivo quede al lado contrario de la entrada que el stop: un corto con
 * stop y objetivo por encima de la entrada no es una operación posible.
 */
describe("validaPlan", () => {
  it("rechaza el objetivo que cae al mismo lado que el stop (el caso que colaba)", () => {
    const r = validaPlan(100, 105, 110);
    expect(r.valido).toBe(false);
    expect(r.motivo).toBe("lado");
  });

  it("acepta un corto correcto: stop arriba, objetivo abajo", () => {
    const r = validaPlan(100, 105, 90);
    expect(r.valido).toBe(true);
    expect(r.motivo).toBeNull();
  });

  it("acepta un largo correcto: stop abajo, objetivo arriba", () => {
    const r = validaPlan(100, 95, 115);
    expect(r.valido).toBe(true);
    expect(r.motivo).toBeNull();
  });

  it("rechaza un largo con el objetivo también por debajo de la entrada", () => {
    const r = validaPlan(100, 95, 85);
    expect(r.valido).toBe(false);
    expect(r.motivo).toBe("lado");
  });

  it("rechaza campos no positivos o no finitos antes de mirar el lado", () => {
    for (const [e, s, o] of [
      [0, 95, 115],
      [-100, 95, 115],
      [100, 0, 115],
      [100, 95, 0],
      [NaN, 95, 115],
      [100, Infinity, 115],
    ] as [number, number, number][]) {
      const r = validaPlan(e, s, o);
      expect(r.valido).toBe(false);
      expect(r.motivo).toBe("campos");
    }
  });

  it("rechaza cuando dos de los tres coinciden", () => {
    expect(validaPlan(100, 100, 110).valido).toBe(false);
    expect(validaPlan(100, 95, 100).valido).toBe(false);
    expect(validaPlan(100, 95, 95).valido).toBe(false);
  });
});

describe("rrPlanificado", () => {
  it("mide el objetivo en múltiplos del riesgo, en el sentido de la dirección", () => {
    expect(rrPlanificado("long", 100, 98, 106)).toBe(3);
    expect(rrPlanificado("short", 100, 102, 94)).toBe(3);
  });

  it("sale en negativo si el objetivo queda del lado contrario al favorable", () => {
    expect(rrPlanificado("long", 100, 98, 96)).toBe(-2);
    expect(rrPlanificado("short", 100, 102, 104)).toBe(-2);
  });

  it("sin objetivo o sin riesgo, 0", () => {
    expect(rrPlanificado("long", 100, 98, 0)).toBe(0);
    expect(rrPlanificado("long", 100, 98, Number.NaN)).toBe(0);
    expect(rrPlanificado("long", 100, 100, 106)).toBe(0);
  });
});

describe("excedeApalancamiento", () => {
  it("un stop a un céntimo en acciones (100×) avisa", () => {
    // 10.000 $ al 1 %: 100 $ / 0,01 $ = 10.000 acciones a 100 $ = 1.000.000 $.
    expect(excedeApalancamiento("equities", 1_000_000 / 10_000)).toBe(true);
  });

  it("dentro del tope de cada mercado no avisa, y justo en el tope tampoco", () => {
    expect(excedeApalancamiento("equities", 2)).toBe(false);
    expect(excedeApalancamiento("forex", 25)).toBe(false);
    expect(excedeApalancamiento("futures", 15)).toBe(false);
    for (const [m, tope] of Object.entries(TOPE_APALANCAMIENTO)) {
      expect(excedeApalancamiento(m as keyof typeof TOPE_APALANCAMIENTO, tope), m).toBe(false);
    }
  });

  it("lo que es normal en divisas avisa en acciones", () => {
    expect(excedeApalancamiento("forex", 20)).toBe(false);
    expect(excedeApalancamiento("equities", 20)).toBe(true);
  });

  it("sin cifra válida no avisa", () => {
    expect(excedeApalancamiento("equities", Number.NaN)).toBe(false);
    expect(excedeApalancamiento("equities", Number.POSITIVE_INFINITY)).toBe(false);
  });
});

describe("validaRegistro (registro rápido de la demo)", () => {
  const REGISTRO = { entrada: 1.1, stop: 1.09, salida: 1.12, cantidad: 2 };
  const BUENO = { ...REGISTRO, direccion: "long" } as const;

  it("acepta un registro correcto tal cual", () => {
    expect(validaRegistro(BUENO)).toEqual(REGISTRO);
  });

  it("sin salida cierra en la entrada", () => {
    expect(validaRegistro({ ...BUENO, salida: Number.NaN })?.salida).toBe(BUENO.entrada);
  });

  it.each([0, -1.1])("una salida de %s se rechaza", (salida) => {
    expect(validaRegistro({ ...BUENO, salida })).toBeNull();
  });

  it.each([0, -3, Number.NaN])("una cantidad de %s se rechaza en vez de cambiarse por 1", (cantidad) => {
    expect(validaRegistro({ ...BUENO, cantidad })).toBeNull();
  });

  it.each([
    { entrada: 0 },
    { stop: -1 },
    { stop: BUENO.entrada },
    { entrada: Number.NaN },
  ])("entrada y stop siguen siendo obligatorios: %o", (cambio) => {
    expect(validaRegistro({ ...BUENO, ...cambio })).toBeNull();
  });

  describe("el stop y el objetivo van del lado que marca la dirección", () => {
    const CORTO = { ...BUENO, direccion: "short", stop: 1.11, salida: 1.08 } as const;

    it("un corto con el stop por debajo de la entrada se rechaza; con el stop por encima, pasa", () => {
      expect(validaRegistro({ ...BUENO, direccion: "short" })).toBeNull();
      expect(validaRegistro(CORTO)).toEqual({ ...REGISTRO, stop: 1.11, salida: 1.08 });
    });

    it("un largo con el stop por encima de la entrada se rechaza", () => {
      expect(validaRegistro({ ...BUENO, stop: 1.11 })).toBeNull();
    });

    it("con objetivo: debe quedar del lado favorable y se devuelve", () => {
      expect(validaRegistro({ ...BUENO, objetivo: 1.13 })?.objetivo).toBe(1.13);
      expect(validaRegistro({ ...BUENO, objetivo: 1.08 })).toBeNull();
      expect(validaRegistro({ ...CORTO, objetivo: 1.07 })?.objetivo).toBe(1.07);
      expect(validaRegistro({ ...CORTO, objetivo: 1.13 })).toBeNull();
    });

    it("un objetivo igual a la entrada, negativo o por encima del tope se rechaza", () => {
      expect(validaRegistro({ ...BUENO, objetivo: BUENO.entrada })).toBeNull();
      expect(validaRegistro({ ...BUENO, objetivo: -1 })).toBeNull();
      expect(validaRegistro({ ...BUENO, objetivo: LIMITES.precio.max + 1 })).toBeNull();
    });

    it("sin objetivo (ausente o ilegible) no se exige ni se devuelve", () => {
      expect(validaRegistro(BUENO)?.objetivo).toBeUndefined();
      expect(validaRegistro({ ...BUENO, objetivo: Number.NaN })?.objetivo).toBeUndefined();
    });
  });

  describe("el resultado tampoco pasa del tope, aunque cada cifra esté dentro del suyo", () => {
    const max = LIMITES.precio.max;
    const EURUSD = { direccion: "long", entrada: 1.1, stop: 1.09, salida: max, cantidad: max, multiplicador: 100_000 } as const;

    it("EURUSD con salida y cantidad en su máximo daría ≈1e19 de P&L: se rechaza", () => {
      expect(validaRegistro(EURUSD)).toBeNull();
    });

    it("el riesgo (distancia al stop × cantidad × multiplicador) también cuenta", () => {
      expect(validaRegistro({ ...EURUSD, stop: 1, salida: 1.1 })).toBeNull();
    });

    it("la frontera: el P&L en el tope pasa y un céntimo de precio más no", () => {
      const tope = LIMITES.resultadoRegistro.max;
      const base = { direccion: "long", entrada: 100, stop: 99, cantidad: 1000, multiplicador: 1 } as const;
      const salidaEnElTope = 100 + tope / (base.cantidad * base.multiplicador);
      expect(validaRegistro({ ...base, salida: salidaEnElTope })).not.toBeNull();
      expect(validaRegistro({ ...base, salida: salidaEnElTope + 0.01 })).toBeNull();
    });

    it("una pérdida enorme se rechaza igual que una ganancia", () => {
      expect(validaRegistro({ ...EURUSD, salida: 0.0001 + 1e-3, cantidad: max })).toBeNull();
    });

    it("sin multiplicador cuenta 1 y un registro normal pasa", () => {
      expect(validaRegistro(BUENO)).toEqual(REGISTRO);
      expect(validaRegistro({ ...BUENO, multiplicador: 100_000 })).toEqual(REGISTRO);
    });
  });
});

describe("revisaRegistro: qué campo falla y por qué (la primera regla que falla)", () => {
  const BUENO = { direccion: "long", entrada: 1.1, stop: 1.09, salida: 1.12, cantidad: 2 } as const;
  const max = LIMITES.precio.max;

  it("un registro correcto devuelve lo mismo que validaRegistro y ningún fallo", () => {
    expect(revisaRegistro(BUENO)).toEqual({ registro: validaRegistro(BUENO), fallo: null });
  });

  it.each<[string, Partial<Parameters<typeof revisaRegistro>[0]>, FalloRegistro]>([
    ["entrada vacía", { entrada: Number.NaN }, { campo: "entrada", motivo: "numero" }],
    ["entrada infinita", { entrada: Number.POSITIVE_INFINITY }, { campo: "entrada", motivo: "numero" }],
    ["entrada cero", { entrada: 0 }, { campo: "entrada", motivo: "positivo" }],
    ["entrada negativa", { entrada: -1 }, { campo: "entrada", motivo: "positivo" }],
    ["entrada en el tope más uno", { entrada: max + 1 }, { campo: "entrada", motivo: "maximo" }],
    ["stop vacío", { stop: Number.NaN }, { campo: "stop", motivo: "numero" }],
    ["stop cero", { stop: 0 }, { campo: "stop", motivo: "positivo" }],
    ["stop sobre el tope", { stop: max + 1 }, { campo: "stop", motivo: "maximo" }],
    ["stop igual a la entrada", { stop: 1.1 }, { campo: "stop", motivo: "igual" }],
    ["stop por encima en un largo", { stop: 1.11 }, { campo: "stop", motivo: "lado" }],
    ["stop por debajo en un corto", { direccion: "short" }, { campo: "stop", motivo: "lado" }],
    ["objetivo por debajo en un largo", { objetivo: 1.08 }, { campo: "objetivo", motivo: "lado" }],
    ["objetivo igual a la entrada", { objetivo: 1.1 }, { campo: "objetivo", motivo: "igual" }],
    ["objetivo igual al stop", { objetivo: 1.09 }, { campo: "objetivo", motivo: "lado" }],
    ["objetivo cero", { objetivo: 0 }, { campo: "objetivo", motivo: "positivo" }],
    ["objetivo negativo", { objetivo: -1 }, { campo: "objetivo", motivo: "positivo" }],
    ["objetivo sobre el tope", { objetivo: max + 1 }, { campo: "objetivo", motivo: "maximo" }],
    ["salida cero", { salida: 0 }, { campo: "salida", motivo: "positivo" }],
    ["salida sobre el tope", { salida: max + 1 }, { campo: "salida", motivo: "maximo" }],
    ["cantidad vacía", { cantidad: Number.NaN }, { campo: "cantidad", motivo: "numero" }],
    ["cantidad cero", { cantidad: 0 }, { campo: "cantidad", motivo: "positivo" }],
    ["cantidad negativa", { cantidad: -3 }, { campo: "cantidad", motivo: "positivo" }],
    ["cantidad en el tope más uno", { cantidad: LIMITES.cantidad.max + 1 }, { campo: "cantidad", motivo: "maximo" }],
    ["resultado sobre el tope con cada cifra dentro del suyo", { entrada: 1.1, stop: 1.09, salida: max, cantidad: max, multiplicador: 100_000 }, { campo: "cantidad", motivo: "resultado" }],
  ])("%s", (_nombre, cambio, esperado) => {
    const r = revisaRegistro({ ...BUENO, ...cambio });
    expect(r.registro).toBeNull();
    expect(r.fallo).toEqual(esperado);
    expect(validaRegistro({ ...BUENO, ...cambio })).toBeNull();
  });

  it("sin objetivo ni salida legibles no es un fallo: el objetivo es opcional y sin salida se cierra en la entrada", () => {
    expect(revisaRegistro({ ...BUENO, objetivo: Number.NaN, salida: Number.NaN }).fallo).toBeNull();
  });

  it("con varios fallos a la vez gana el primero en el orden entrada, stop, objetivo, salida, cantidad", () => {
    const todo = { ...BUENO, entrada: Number.NaN, stop: 0, objetivo: -1, salida: 0, cantidad: 0 };
    expect(revisaRegistro(todo).fallo?.campo).toBe("entrada");
    expect(revisaRegistro({ ...todo, entrada: 1.1 }).fallo?.campo).toBe("stop");
    expect(revisaRegistro({ ...todo, entrada: 1.1, stop: 1.09 }).fallo?.campo).toBe("objetivo");
    expect(revisaRegistro({ ...todo, entrada: 1.1, stop: 1.09, objetivo: 1.2 }).fallo?.campo).toBe("salida");
    expect(revisaRegistro({ ...todo, entrada: 1.1, stop: 1.09, objetivo: 1.2, salida: 1.12 }).fallo?.campo).toBe("cantidad");
  });
});

describe("mensajeFalloRegistro: la frase de cada fallo, en los dos idiomas", () => {
  const frase = (fallo: FalloRegistro, direccion: "long" | "short", lang: "es" | "en") => mensajeFalloRegistro(fallo, direccion, lang);

  it("el stop y el objetivo dicen de qué lado de la entrada van según la dirección", () => {
    expect(frase({ campo: "stop", motivo: "lado" }, "long", "es")).toBe("En largo va por debajo de la entrada.");
    expect(frase({ campo: "stop", motivo: "lado" }, "short", "es")).toBe("En corto va por encima de la entrada.");
    expect(frase({ campo: "objetivo", motivo: "lado" }, "long", "es")).toBe("En largo va por encima de la entrada.");
    expect(frase({ campo: "objetivo", motivo: "lado" }, "short", "en")).toBe("For a short it goes below the entry.");
    expect(frase({ campo: "stop", motivo: "lado" }, "long", "en")).toBe("For a long it goes below the entry.");
  });

  it("los topes llevan la cifra de LIMITES con el separador de cada idioma", () => {
    expect(frase({ campo: "entrada", motivo: "maximo" }, "long", "es")).toBe("No puede pasar de 10.000.000.");
    expect(frase({ campo: "cantidad", motivo: "maximo" }, "long", "en")).toBe("Can’t be above 10,000,000.");
    expect(frase({ campo: "cantidad", motivo: "resultado" }, "long", "es")).toBe("Con esta cantidad, el resultado o el riesgo pasarían de 1.000.000.000 $.");
    expect(frase({ campo: "cantidad", motivo: "resultado" }, "long", "en")).toBe("With this quantity, the result or the risk would exceed $1,000,000,000.");
  });

  it("cada combinación tiene frase propia y distinta en español y en inglés", () => {
    const campos = ["entrada", "stop", "objetivo", "salida", "cantidad"] as const;
    const motivos = ["numero", "positivo", "maximo", "igual", "lado", "resultado"] as const;
    for (const campo of campos) {
      for (const motivo of motivos) {
        const es = frase({ campo, motivo }, "long", "es");
        const en = frase({ campo, motivo }, "long", "en");
        expect(es, `${campo}/${motivo} es`).not.toBe("");
        expect(en, `${campo}/${motivo} en`).not.toBe("");
        expect(es, `${campo}/${motivo}`).not.toBe(en);
      }
    }
  });
});
