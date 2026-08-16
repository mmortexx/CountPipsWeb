"use client";

import { useEffect, useRef } from "react";
import {
  clamp01,
  easeOut,
  phase,
  pencil,
  graphite,
  engraveLine,
  handRect,
  label,
  plateChrome,
  rnd,
  type Ctx,
  type Pt,
} from "./EngravedAtlas";

/**
 * Grabado404 — la lámina de la página que no existe.
 *
 * ── POR QUÉ SUSTITUYE A LAS VELAS Y A LA CONSTELACIÓN ──────────────────
 * La 404 dibujaba su fondo con `MarketBackground` (velas desplazándose) y
 * `ParticleField` (la red de puntos enlazados de toda landing fintech).
 * Son los dos fondos genéricos del sector —el propio comentario de
 * ParticleField lo decía—, y el resto del sitio los había retirado ya por
 * escrito: el estilo clásico de papel entintado no admite un candelario
 * incandescente ni una constelación flotando. Una página que se sale del
 * atlas (su ruta no tiene láminas asignadas) no tiene por qué salirse del
 * IDIOMA del atlas.
 *
 * ── LA FIGURA ──────────────────────────────────────────────────────────
 * «El folio que no está»: una página de libro mayor cuyos renglones se
 * cortan a media escritura, y una lente que amplía el punto exacto donde
 * debería estar el asiento siguiente y no encuentra nada. Es el mismo
 * recurso del detalle ampliado de la lámina I —el círculo con sus líneas
 * guía—, aplicado a un hueco: la lente no agranda un drawdown, agrana
 * papel en blanco. El mensaje es el del copy de la página («esta página
 * se detuvo»), dicho con el vocabulario de grabado del fondo del sitio.
 *
 * ── EL MOTOR, MÍNIMO PERO COMPLETO ─────────────────────────────────────
 * No hace falta el motor de scroll del atlas: esta página es una sola
 * pantalla. Sí hacen falta sus disciplinas, y están todas:
 *
 *  · Se graba SOLO al montar (el gesto del arranque del atlas: se entra
 *    viendo dibujar) y el bucle se PARA al converger. Parado, coste cero.
 *  · `prefers-reduced-motion`: la figura entera, de una vez.
 *  · dpr con techo de 1,5, medida fraccional por `getBoundingClientRect`,
 *    `ResizeObserver` sobre el lienzo y repintado síncrono al redimensionar.
 *  · Tema en caliente: la tinta se relee al cambiar `data-theme`/
 *    `data-palette`, y se redibuja la figura ya terminada.
 *  · Determinismo total: el temblor sale de `jitter`/`rnd` con semilla,
 *    nunca de `Math.random` — la SSR y el cliente pintan lo mismo.
 *
 * Se importa con `next/dynamic` desde `NotFoundClient`: comparte módulo
 * con `EngravedAtlas` (sus primitivas), y ese trozo no debe entrar al
 * paquete del layout que sirven las 155 páginas que sí existen.
 */

/** Cuánto dura el grabado. Como la intro del atlas: lo bastante lento
 *  para verlo dibujar, lo bastante rápido para estar antes de que se lea
 *  el titular de la página. */
const DURACION_MS = 4200;

function dibujarFolio(ctx: Ctx, w: number, h: number, t: number, es: boolean): void {
  plateChrome(ctx, w, h, t);

  const m = Math.min(w, h) * 0.055;
  /* La página del registro, descentrada a la izquierda para que la lente
     respire a la derecha: el contenido real de la página (el 404, el
     buscador) vive centrado, y así la mancha del dibujo no coincide con
     la del texto. */
  const pw = Math.min(w * 0.46, 620);
  const ph = Math.min(h * 0.52, 560);
  const x0 = m + w * 0.12;
  const y0 = (h - ph) / 2 + h * 0.02;

  /* La hoja. */
  const fp = phase(t, 0.04, 0.3);
  handRect(ctx, x0, y0, pw, ph, fp, 1.15, 0.44, 41, 5);

  /* Cabecera: filete doble y su rótulo de columna. */
  const hp = phase(t, 0.16, 0.24);
  engraveLine(ctx, [[x0 + 18, y0 + 34], [x0 + pw - 18, y0 + 34]], hp, 0.8, 0.38, 43);
  engraveLine(ctx, [[x0 + 18, y0 + 38], [x0 + pw - 18, y0 + 38]], hp, 0.45, 0.24, 45);
  label(ctx, es ? "REGISTRO DE OPERACIONES" : "TRADE REGISTER", x0 + 18, y0 + 20, 9.5, 0.42, hp);

  /* Los renglones: se escriben y se DETIENEN. Las once primeras líneas
     llenas; a partir de ahí, cada una más corta que la anterior, y las
     últimas ni llegan a empezar. El corte no es decorativo: es el sujeto
     de la lámina. */
  const rows = 16;
  const top = y0 + 58;
  const paso = Math.min((ph - 82) / rows, 30);
  const corteDesde = 11;
  for (let i = 0; i < rows; i++) {
    const p = phase(t, 0.22 + i * 0.028, 0.2);
    if (p <= 0.01) continue;
    const y = top + i * paso + paso * 0.62;
    /* Hasta el renglón 10, renglones de escritura; después, cada vez más
       cortos — la mano que se queda sin registro. */
    let frac = 0.62 + rnd(i + 51) * 0.3;
    if (i >= corteDesde) {
      const k = (i - corteDesde) / (rows - 1 - corteDesde);
      frac *= Math.max(0, 1 - k * 1.35);
      if (frac <= 0.03) continue;
    }
    const largo = (pw - 36) * frac;
    engraveLine(
      ctx,
      [[x0 + 18, y], [x0 + 18 + largo, y]],
      p,
      0.55,
      i >= corteDesde ? 0.4 : 0.3,
      i + 47
    );
    /* La fecha al margen: tres cifras cortas, también desapareciendo. */
    if (i < corteDesde + 1) {
      engraveLine(ctx, [[x0 + pw - 16 - rnd(i + 61) * 26, y], [x0 + pw - 16, y]], p, 0.5, 0.26, i + 63);
    }
  }

  /* ---- LA LENTE: amplía el punto donde el registro se corta ---------- */
  const lp = phase(t, 0.52, 0.32);
  if (lp > 0.01) {
    const yCorte = top + corteDesde * paso + paso * 0.62;
    const ox = x0 + 18 + (pw - 36) * 0.5;
    const R = Math.min(w, h) * 0.13;
    const dx = Math.min(w - m - R - 14, x0 + pw + R * 1.15);
    const dy = Math.max(m + R + 14, yCorte - R * 0.4);

    /* Líneas guía desde el corte hasta la circunferencia. */
    for (const s of [-1, 1] as const) {
      const a = Math.atan2(dy - yCorte, dx - ox) + s * 0.4;
      engraveLine(
        ctx,
        [
          [ox + Math.cos(a) * 7, yCorte + Math.sin(a) * 7],
          [dx - Math.cos(a) * R, dy - Math.sin(a) * R],
        ],
        lp,
        0.5,
        0.24,
        71 + s
      );
    }

    /* Doble filete de la lente. */
    const circle = (r: number): Pt[] => {
      const o: Pt[] = [];
      for (let i = 0; i <= 64; i++) {
        const a = (i / 64) * Math.PI * 2;
        o.push([dx + Math.cos(a) * r, dy + Math.sin(a) * r]);
      }
      return o;
    };
    engraveLine(ctx, circle(R), lp, 1.1, 0.4, 81);
    engraveLine(ctx, circle(R + 4), lp, 0.5, 0.2, 83);

    /* Dentro, el papel en blanco: la retícula tenue del folio y dos
       motas de grafito. Nada más. La lente de la lámina I agrandaba el
       peor drawdown; esta agranda la ausencia. */
    ctx.save();
    ctx.beginPath();
    ctx.arc(dx, dy, R - 1, 0, Math.PI * 2);
    ctx.clip();
    const gp = clamp01((lp - 0.35) / 0.65);
    ctx.save();
    ctx.globalAlpha *= 0.12 * gp;
    ctx.lineWidth = 0.4;
    ctx.beginPath();
    for (let i = -4; i <= 4; i++) {
      const yy = dy + i * (R / 3.2);
      ctx.moveTo(dx - R, yy);
      ctx.lineTo(dx + R, yy);
    }
    ctx.stroke();
    ctx.restore();
    graphite(ctx, dx - R, dy - R, R * 2, R * 2, 24, 0.24, gp, 85);
    ctx.restore();

    /* El veredicto, rotulado como los de las láminas de reglas. */
    label(ctx, es ? "SIN ASIENTO" : "NO ENTRY", dx, dy + R + 16, 10, 0.5, phase(t, 0.78, 0.2), "center");
  }

  /* El aspa de cierre sobre el corte: lo que una contabilidad honesta
     pone donde debería haber un dato y no lo hay. Dos trazos, nada más. */
  const xp = phase(t, 0.68, 0.24);
  if (xp > 0.01) {
    const yCorte = top + (corteDesde - 1) * paso + paso * 0.62;
    const cxp = x0 + 18 + (pw - 36) * 0.78;
    const s = 5.5;
    pencil(
      ctx,
      [
        [cxp - s, yCorte - s],
        [cxp + s, yCorte + s],
      ],
      xp,
      0.9,
      0.5,
      91,
      2
    );
    pencil(
      ctx,
      [
        [cxp + s, yCorte - s],
        [cxp - s, yCorte + s],
      ],
      xp,
      0.9,
      0.5,
      93,
      2
    );
  }
}

export function Grabado404() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const es = document.documentElement.lang !== "en";

    let w = 0;
    let h = 0;
    let cssDpr = 0;
    let ink = "#1a1714";
    let raf = 0;
    let visible = true;
    let terminado = false;
    let progreso = 0;
    const t0 = performance.now();

    const pintar = (p: number) => {
      ctx.setTransform(cssDpr, 0, 0, cssDpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = ink;
      ctx.fillStyle = ink;
      dibujarFolio(ctx, w, h, p, es);
    };

    const leerTinta = () => {
      const antes = ink;
      ink =
        getComputedStyle(document.documentElement).getPropertyValue("--ink").trim() ||
        "#1a1714";
      if (ink !== antes) pintar(terminado ? 1 : progreso);
    };

    const medir = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      if (r.width === w && r.height === h && dpr === cssDpr) return;
      w = r.width;
      h = r.height;
      cssDpr = dpr;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      /* Repintado síncrono: el bitmap nunca llega vacío a pantalla
         (misma lección que el resize del atlas). */
      pintar(terminado ? 1 : progreso);
    };

    const frame = (now: number) => {
      if (!visible) {
        raf = 0;
        return;
      }
      const p = easeOut(clamp01((now - t0) / DURACION_MS));
      progreso = p;
      pintar(p);
      if (p >= 1) {
        /* Convergido: el bucle se PARA. Sólo la visibilidad o un cambio
           de tamaño/tinta lo vuelven a despertar, y ya terminado. */
        terminado = true;
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    const despertar = () => {
      if (raf || terminado) return;
      raf = requestAnimationFrame(frame);
    };

    leerTinta();
    medir();

    if (reduce) {
      terminado = true;
      progreso = 1;
      pintar(1);
    } else {
      raf = requestAnimationFrame(frame);
    }

    let primeraObs = true;
    const ro = new ResizeObserver(() => {
      if (primeraObs) {
        primeraObs = false;
        return;
      }
      medir();
      despertar();
    });
    ro.observe(canvas);

    const onVis = () => {
      visible = !document.hidden;
      if (visible) despertar();
    };
    document.addEventListener("visibilitychange", onVis);

    const obs = new MutationObserver(leerTinta);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "data-palette"],
    });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      obs.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="absolute inset-0 h-full w-full"
      style={{ opacity: 0.9 }}
    />
  );
}
