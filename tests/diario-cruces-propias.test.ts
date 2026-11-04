import { describe, expect, it } from "vitest";
import { TRADES, type Trade } from "@/lib/trading/data";
import { crucesDelDiario, notaMediaDelDia } from "@/components/demo/pages/JournalPage";

/** Registrada desde el formulario: el visitante no ha dicho cómo estaba ese día (`demoStore`, `dayScore: 0`). */
const propia: Trade = { ...TRADES[0], id: 1770000000000, netPnl: 5000, rMultiple: 5, compliance: "yes", dayScore: 0 };

describe("Diario: una operación sin nota del día no entra en los cruces de estado", () => {
  const sin = crucesDelDiario(TRADES);
  const con = crucesDelDiario([...TRADES, propia]);

  it("una ganancia de 5.000 $ sin nota no mueve «mental bajo», «físico bajo» ni «sueño corto»", () => {
    expect(con.mental.bajo).toBe(sin.mental.bajo);
    expect(con.fisico.bajo).toBe(sin.fisico.bajo);
    expect(con.sueno.bajo).toBe(sin.sueno.bajo);
    expect(con.mental.n).toBe(sin.mental.n);
  });

  it("sí cuenta en el cruce del plan, que no depende de la nota", () => {
    expect(con.plan.con).not.toBe(sin.plan.con);
  });

  it("la nota media del día ignora las operaciones sin nota y sin ninguna no inventa un cero", () => {
    expect(notaMediaDelDia([{ dayScore: 4 }, { dayScore: 0 }, { dayScore: 2 }])).toBe(3);
    expect(notaMediaDelDia([{ dayScore: 0 }])).toBeNull();
  });
});
