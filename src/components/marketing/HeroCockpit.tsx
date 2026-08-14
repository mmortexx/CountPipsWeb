"use client";

import { useState, useEffect, useMemo } from "react";
import { useLang } from "@/lib/i18n";
import { ShieldCheck, AlertOctagon, Terminal, Activity, Database, CheckCircle2, Lock } from "lucide-react";

interface TapePrint {
  id: string;
  time: string;
  symbol: string;
  side: "BUY" | "SELL";
  price: string;
  size: string;
  r: string;
  status: "nominal" | "target" | "breakeven";
}

const INITIAL_PRINTS: TapePrint[] = [
  { id: "1", time: "11:42:04.102", symbol: "NQ", side: "BUY", price: "18,422.50", size: "2 cts", r: "+2.40 R", status: "target" },
  { id: "2", time: "11:41:48.880", symbol: "ES", side: "SELL", price: "5,024.75", size: "3 cts", r: "+1.85 R", status: "nominal" },
  { id: "3", time: "11:40:12.315", symbol: "GC", side: "BUY", price: "2,384.20", size: "1 ct", r: "+0.00 R", status: "breakeven" },
  { id: "4", time: "11:38:50.040", symbol: "EURUSD", side: "SELL", price: "1.0845", size: "2.5 lots", r: "+2.10 R", status: "target" },
];

export function HeroCockpit() {
  const { lang } = useLang();
  const es = lang === "es";

  const [activeTab, setActiveTab] = useState<"tape" | "guardian" | "engine">("tape");
  const [prints, setPrints] = useState<TapePrint[]>(INITIAL_PRINTS);
  const [guardianTriggered, setGuardianTriggered] = useState(false);
  const [simulatedCount, setSimulatedCount] = useState(0);

  // Streaming simulated institutional executions
  useEffect(() => {
    const interval = setInterval(() => {
      const symbols = ["NQ", "ES", "GC", "CL", "EURUSD", "MNQ", "MES"];
      const sym = symbols[Math.floor(Math.random() * symbols.length)];
      const isBuy = Math.random() > 0.45;
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}.${String(now.getMilliseconds()).padStart(3, "0")}`;
      
      const rVal = (Math.random() * 2.8 + 0.2).toFixed(2);
      const isTarget = parseFloat(rVal) > 2.0;

      const newPrint: TapePrint = {
        id: Math.random().toString(),
        time: timeStr,
        symbol: sym,
        side: isBuy ? "BUY" : "SELL",
        price: sym === "NQ" ? "18,4" + Math.floor(Math.random() * 80 + 10) + ".50" : (sym === "ES" ? "5,0" + Math.floor(Math.random() * 50 + 10) + ".25" : "2,38" + Math.floor(Math.random() * 9 + 1) + ".0"),
        size: sym.startsWith("M") ? "5 cts" : (sym === "EURUSD" ? "2.0 lots" : "2 cts"),
        r: `+${rVal} R`,
        status: isTarget ? "target" : "nominal",
      };

      setPrints((prev) => [newPrint, ...prev.slice(0, 5)]);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const triggerViolationSimulation = () => {
    setGuardianTriggered(true);
    setActiveTab("guardian");
    setSimulatedCount((c) => c + 1);
  };

  const triggerCompliantSimulation = () => {
    setGuardianTriggered(false);
    setActiveTab("guardian");
    setSimulatedCount((c) => c + 1);
  };

  return (
    <div
      data-seq
      className="mt-10 w-full overflow-hidden rounded-[4px] border bg-[color-mix(in_oklab,var(--surface-2)_75%,transparent)] shadow-2xl backdrop-blur-md transition-all duration-300"
      style={{
        borderColor: "rgb(var(--divider) / 0.18)",
      }}
    >
      {/* Cockpit Window Titlebar */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5"
        style={{
          borderColor: "rgb(var(--divider) / 0.12)",
          background: "color-mix(in oklab, var(--surface-1) 85%, transparent)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full bg-[rgb(var(--pnl-neg)/0.7)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[rgb(var(--sig-amber)/0.7)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[rgb(var(--pnl-pos)/0.7)]" />
          </div>
          <span className="text-[11px] font-mono tracking-wider text-tertiary">
            COUNTPIPS_TERMINAL · WINUI3 CORE ENGINE
          </span>
        </div>

        {/* Cockpit Tab Switcher */}
        <div className="flex items-center gap-1 rounded-[3px] bg-[rgb(var(--divider)/0.06)] p-0.5 border border-[rgb(var(--divider)/0.1)]">
          <button
            type="button"
            onClick={() => setActiveTab("tape")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider rounded-[2px] transition-colors ${
              activeTab === "tape"
                ? "bg-[rgb(var(--accent-base))] text-[rgb(var(--accent-ink))] font-semibold shadow-sm"
                : "text-tertiary hover:text-primary"
            }`}
          >
            <Activity size={12} />
            <span>{es ? "Flujo de Ejecución" : "Execution Tape"}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("guardian")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider rounded-[2px] transition-colors ${
              activeTab === "guardian"
                ? "bg-[rgb(var(--accent-base))] text-[rgb(var(--accent-ink))] font-semibold shadow-sm"
                : "text-tertiary hover:text-primary"
            }`}
          >
            <ShieldCheck size={12} />
            <span>{es ? "Guardián de Riesgo" : "Risk Guardian"}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("engine")}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider rounded-[2px] transition-colors ${
              activeTab === "engine"
                ? "bg-[rgb(var(--accent-base))] text-[rgb(var(--accent-ink))] font-semibold shadow-sm"
                : "text-tertiary hover:text-primary"
            }`}
          >
            <Database size={12} />
            <span>{es ? "Motor Local SQLite" : "Local SQLite"}</span>
          </button>
        </div>
      </div>

      {/* Cockpit Tab Contents */}
      <div className="p-4 sm:p-5">
        {activeTab === "tape" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2 text-[10.5px] font-mono uppercase tracking-widest text-tertiary" style={{ borderColor: "rgb(var(--divider)/0.1)" }}>
              <span>{es ? "HORA UTC · INSTRUMENTO" : "TIME UTC · ASSET"}</span>
              <span className="hidden sm:inline">{es ? "PRECIO & TAMAÑO" : "PRICE & SIZE"}</span>
              <span>{es ? "RESULTADO & CONFORMIDAD" : "RESULT & COMPLIANCE"}</span>
            </div>

            <div className="space-y-1.5 font-mono text-xs">
              {prints.map((p, idx) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between rounded-[2px] px-3 py-2 border transition-all ${
                    idx === 0
                      ? "border-[rgb(var(--accent-base)/0.4)] bg-[rgb(var(--accent-base)/0.08)]"
                      : "border-[rgb(var(--divider)/0.06)] bg-[rgb(var(--divider)/0.02)]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] text-tertiary">{p.time}</span>
                    <span className="font-bold text-primary">{p.symbol}</span>
                    <span
                      className={`text-[9.5px] px-1.5 py-0.2 rounded font-semibold ${
                        p.side === "BUY"
                          ? "bg-[rgb(var(--pnl-pos)/0.15)] text-[rgb(var(--pnl-pos))]"
                          : "bg-[rgb(var(--pnl-neg)/0.15)] text-[rgb(var(--pnl-neg))]"
                      }`}
                    >
                      {p.side}
                    </span>
                  </div>

                  <div className="hidden sm:flex items-center gap-3 text-secondary">
                    <span>{p.price}</span>
                    <span className="text-[10px] text-tertiary">({p.size})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[rgb(var(--pnl-pos))]">{p.r}</span>
                    <span className="inline-flex items-center gap-1 text-[9.5px] text-[rgb(var(--pnl-pos))] bg-[rgb(var(--pnl-pos)/0.1)] px-1.5 py-0.5 rounded">
                      <CheckCircle2 size={10} />
                      <span className="hidden xs:inline">{es ? "PLAN OK" : "PLAN OK"}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] font-mono text-tertiary">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[rgb(var(--pnl-pos))] animate-pulse" />
                {es ? "Tape en vivo · Sincronización continua de ejecuciones" : "Live Tape · Continuous execution stream"}
              </span>
              <span>{es ? "Muestreo institucional 100% determinista" : "100% deterministic institutional sample"}</span>
            </div>
          </div>
        )}

        {activeTab === "guardian" && (
          <div className="space-y-4">
            <div
              className={`rounded-[3px] border p-4 transition-colors ${
                guardianTriggered
                  ? "border-[rgb(var(--pnl-neg)/0.4)] bg-[rgb(var(--pnl-neg)/0.08)] text-[rgb(var(--pnl-neg))]"
                  : "border-[rgb(var(--pnl-pos)/0.4)] bg-[rgb(var(--pnl-pos)/0.08)] text-[rgb(var(--pnl-pos))]"
              }`}
            >
              <div className="flex items-start gap-3">
                {guardianTriggered ? (
                  <AlertOctagon className="mt-0.5 shrink-0 text-[rgb(var(--pnl-neg))]" size={20} />
                ) : (
                  <ShieldCheck className="mt-0.5 shrink-0 text-[rgb(var(--pnl-pos))]" size={20} />
                )}
                <div>
                  <div className="text-sm font-bold font-mono uppercase tracking-wider">
                    {guardianTriggered
                      ? (es ? "BLOQUEO ACTIVO · RIESGO EXCESIVO DETECTADO" : "LOCK ACTIVE · EXCESSIVE RISK DETECTED")
                      : (es ? "ESTADO NOMINAL · RIESGO Y REGLAS CONFORMES" : "NOMINAL STATUS · RISK & RULES COMPLIANT")}
                  </div>
                  <p className="mt-1 text-xs text-secondary leading-relaxed">
                    {guardianTriggered
                      ? (es
                          ? "Intento de entrada: 4 contratos NQ (Riesgo: 2.8% de cuenta). Límite institucional configurado: 1.0% max por operación. El Guardián bloquea la ejecución para preservar la cuenta."
                          : "Entry attempt: 4 NQ contracts (Risk: 2.8% of account). Institutional limit configured: 1.0% max per trade. Guardian hard-blocks execution to preserve account.")
                      : (es
                          ? "Entrada: 1 contrato ES con Stop Loss a 4.5 puntos (Riesgo: 0.45% de cuenta). Todos los parámetros están dentro de las reglas operativas y drawdown diario."
                          : "Entry: 1 ES contract with Stop Loss at 4.5 points (Risk: 0.45% of account). All parameters are well within operational rules and daily drawdown.")}
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive Simulation Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-tertiary mr-1">
                {es ? "Comprobar respuesta:" : "Test response:"}
              </span>
              <button
                type="button"
                onClick={triggerViolationSimulation}
                className={`h-8 px-3 rounded-[2px] text-xs font-mono font-medium border transition-colors ${
                  guardianTriggered
                    ? "border-[rgb(var(--pnl-neg))] bg-[rgb(var(--pnl-neg))] text-white font-bold"
                    : "border-[rgb(var(--divider)/0.2)] bg-[rgb(var(--divider)/0.04)] text-secondary hover:text-primary"
                }`}
              >
                {es ? "Simular Riesgo Excesivo (2.8%)" : "Simulate Over-risking (2.8%)"}
              </button>
              <button
                type="button"
                onClick={triggerCompliantSimulation}
                className={`h-8 px-3 rounded-[2px] text-xs font-mono font-medium border transition-colors ${
                  !guardianTriggered
                    ? "border-[rgb(var(--pnl-pos))] bg-[rgb(var(--pnl-pos))] text-black font-bold"
                    : "border-[rgb(var(--divider)/0.2)] bg-[rgb(var(--divider)/0.04)] text-secondary hover:text-primary"
                }`}
              >
                {es ? "Simular Operación Disciplinada (0.5%)" : "Simulate Compliant Trade (0.5%)"}
              </button>
            </div>
          </div>
        )}

        {activeTab === "engine" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-[2px] border border-[rgb(var(--divider)/0.1)] bg-[rgb(var(--divider)/0.03)] space-y-1.5">
              <div className="text-[10px] uppercase tracking-wider text-tertiary">
                {es ? "MOTOR DE PERSISTENCIA" : "PERSISTENCE ENGINE"}
              </div>
              <div className="text-primary font-bold text-sm">SQLite Local Database (WAL mode)</div>
              <div className="text-secondary text-[11px]">
                {es ? "Escrituras atómicas en < 0.2ms. Cero dependencias de servidores remotos." : "Atomic writes in < 0.2ms. Zero remote server dependency."}
              </div>
            </div>

            <div className="p-3 rounded-[2px] border border-[rgb(var(--divider)/0.1)] bg-[rgb(var(--divider)/0.03)] space-y-1.5">
              <div className="text-[10px] uppercase tracking-wider text-tertiary">
                {es ? "PRIVACIDAD Y TELEMETRÍA" : "PRIVACY & TELEMETRY"}
              </div>
              <div className="text-primary font-bold text-sm">0 bytes Cloud Export</div>
              <div className="text-secondary text-[11px]">
                {es ? "Tu historial, setups y estadísticas no salen jamás de tu disco duro." : "Your trade history, setups and stats never leave your disk."}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
