/**
 * Plazas de mercado con los mismos horarios LOCALES que la app de escritorio
 * (CountPips.Core/Domain/TradingSession.cs): cada ventana se evalúa en la zona
 * real de la plaza, con cambio de hora, y solo de lunes a viernes en su día local.
 */
export type Plaza = {
  id: "sydney" | "tokyo" | "london" | "newyork";
  es: string;
  en: string;
  tz: string;
  abre: number;
  cierra: number;
};

export const PLAZAS: readonly Plaza[] = [
  { id: "sydney", es: "Sídney", en: "Sydney", tz: "Australia/Sydney", abre: 7 * 60, cierra: 17 * 60 },
  { id: "tokyo", es: "Tokio", en: "Tokyo", tz: "Asia/Tokyo", abre: 8 * 60, cierra: 17 * 60 },
  { id: "london", es: "Londres", en: "London", tz: "Europe/London", abre: 8 * 60, cierra: 16 * 60 + 30 },
  { id: "newyork", es: "Nueva York", en: "New York", tz: "America/New_York", abre: 9 * 60 + 30, cierra: 16 * 60 },
];

const formatos = new Map<string, Intl.DateTimeFormat>();

function formato(tz: string): Intl.DateTimeFormat {
  let f = formatos.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hourCycle: "h23",
      weekday: "short",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
    formatos.set(tz, f);
  }
  return f;
}

/** Hora local de una zona: minutos desde medianoche, día de la semana (0 = domingo) y desfase en minutos. */
export function horaLocal(tz: string, fecha: Date): { minuto: number; dia: number; desfase: number } {
  const partes = formato(tz).formatToParts(fecha);
  const v = (t: string) => partes.find((p) => p.type === t)?.value ?? "0";
  const h = Number(v("hour")) % 24;
  const m = Number(v("minute"));
  const comoUtc = Date.UTC(Number(v("year")), Number(v("month")) - 1, Number(v("day")), h, m);
  const base = Math.floor(fecha.getTime() / 60_000) * 60_000;
  const dias = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return { minuto: h * 60 + m, dia: dias.indexOf(v("weekday")), desfase: Math.round((comoUtc - base) / 60_000) };
}

export function estaAbierta(p: Plaza, fecha: Date): boolean {
  const { minuto, dia } = horaLocal(p.tz, fecha);
  return dia >= 1 && dia <= 5 && minuto >= p.abre && minuto < p.cierra;
}

/** Ventana de hoy expresada en minutos UTC (puede cruzar la medianoche). */
export function ventanaUtc(p: Plaza, fecha: Date): { desde: number; hasta: number } {
  const { desfase } = horaLocal(p.tz, fecha);
  const norm = (x: number) => ((x % 1440) + 1440) % 1440;
  return { desde: norm(p.abre - desfase), hasta: norm(p.cierra - desfase) };
}

/** Avance 0–100 de la sesión abierta. */
export function avance(p: Plaza, fecha: Date): number {
  const { minuto } = horaLocal(p.tz, fecha);
  return Math.max(0, Math.min(100, ((minuto - p.abre) / (p.cierra - p.abre)) * 100));
}

/** Primera plaza cerrada que abre después de `fecha` y los minutos que faltan (busca hasta 4 días). */
export function proximaApertura(fecha: Date): { plaza: Plaza; minutos: number } | null {
  const inicio = Math.floor(fecha.getTime() / 60_000);
  const cerradas = PLAZAS.filter((p) => !estaAbierta(p, fecha));
  for (let paso = 5; paso <= 4 * 1440; paso += 5) {
    const t = new Date((inicio + paso) * 60_000);
    for (const p of cerradas) {
      if (estaAbierta(p, t)) {
        let exacto = paso;
        while (exacto > paso - 5 && estaAbierta(p, new Date((inicio + exacto - 1) * 60_000))) exacto--;
        return { plaza: p, minutos: exacto };
      }
    }
  }
  return null;
}
