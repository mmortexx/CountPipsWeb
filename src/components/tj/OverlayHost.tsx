"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { OPEN_GLOSSARY, OPEN_SHORTCUTS_HELP } from "@/lib/overlays";

/**
 * OverlayHost — el portero de las ventanas de overlay globales.
 *
 * ── El problema que resuelve ──────────────────────────────────────────
 * `ShortcutsHelp` y `GlossaryModal` estaban montados en el layout o en
 * componentes sueltos. Al centralizarlos aquí bajo demanda, ningún
 * overlay descarga su JavaScript hasta que alguien lo pide: atajo, o un
 * disparador que llama a `openGlossary` / `openShortcutsHelp`.
 *
 * Antes se precargaban en el primer gesto (mover el ratón, tocar la
 * pantalla): cualquier visita a un aviso legal pagaba unos 71 KB de
 * ventanas que casi nunca se abren. Ahora se piden al abrirlas.
 */


const ShortcutsHelp = dynamic(
  () => import("@/components/tj/ShortcutsHelp").then((m) => m.ShortcutsHelp),
  { ssr: false }
);

const GlossaryModal = dynamic(
  () => import("@/components/tj/GlossaryModal").then((m) => m.GlossaryModal),
  { ssr: false }
);

/* Margen que se le da a la animación de salida antes de arrancar el
   overlay del árbol. Cubre los 180 ms que dura el fundido más un
   respiro. */
const EXIT_MS = 260;

export function OverlayHost() {
  // `mounted` decide si el overlay existe en el árbol de React.
  const [helpMounted, setHelpMounted] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [glossaryMounted, setGlossaryMounted] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  const openHelp = useCallback((next: boolean) => {
    setHelpMounted(true);
    setHelpOpen(next);
  }, []);

  /* Sin disparador propio (atajo o evento), Radix no sabe adónde devolver
     el foco al cerrar y lo deja en `<body>`: el siguiente Tab arrancaba
     desde el final del documento. Se recuerda dónde estaba y se le
     devuelve, después del repintado que suelta la trampa de foco. */
  const anclaGlosario = useRef<HTMLElement | null>(null);
  const glosarioAbiertoRef = useRef(false);

  const openGlossaryModal = useCallback((next: boolean) => {
    glosarioAbiertoRef.current = next;
    setGlossaryMounted(true);
    setGlossaryOpen(next);
    if (!next) {
      const ancla = anclaGlosario.current;
      anclaGlosario.current = null;
      if (ancla) requestAnimationFrame(() => ancla.isConnected && ancla.focus());
    }
  }, []);

  useEffect(() => {
    if (helpOpen || !helpMounted) return;
    const t = window.setTimeout(() => setHelpMounted(false), EXIT_MS);
    return () => window.clearTimeout(t);
  }, [helpOpen, helpMounted]);

  useEffect(() => {
    if (glossaryOpen || !glossaryMounted) return;
    const t = window.setTimeout(() => setGlossaryMounted(false), EXIT_MS);
    return () => window.clearTimeout(t);
  }, [glossaryOpen, glossaryMounted]);

  useEffect(() => {
    const recuerdaFoco = () => {
      const a = document.activeElement as HTMLElement | null;
      if (a && a !== document.body && !a.closest('[role="dialog"]')) anclaGlosario.current = a;
    };

    // ⌘G / ⌃G — glosario
    const onKey = (e: KeyboardEvent) => {
      // Si el usuario escribe en un campo de texto, no interceptar Ctrl+G si es búsqueda u otro
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT" ||
          target.isContentEditable
        ) {
          return;
        }
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "g") {
        e.preventDefault();
        if (!glosarioAbiertoRef.current) recuerdaFoco();
        openGlossaryModal(!glosarioAbiertoRef.current);
      }
    };

    const onHelp = () => {
      setHelpMounted(true);
      setHelpOpen(true);
    };

    const onGlossary = (e: Event) => {
      const ancla = (e as CustomEvent<{ ancla: HTMLElement | null } | null>).detail?.ancla;
      if (ancla) anclaGlosario.current = ancla;
      else recuerdaFoco();
      openGlossaryModal(true);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_SHORTCUTS_HELP, onHelp);
    window.addEventListener(OPEN_GLOSSARY, onGlossary);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_SHORTCUTS_HELP, onHelp);
      window.removeEventListener(OPEN_GLOSSARY, onGlossary);
    };
  }, [openGlossaryModal]);

  return (
    <>
      {helpMounted && <ShortcutsHelp open={helpOpen} onOpenChange={openHelp} />}
      {glossaryMounted && (
        <GlossaryModal
          trigger={false}
          open={glossaryOpen}
          onOpenChange={openGlossaryModal}
        />
      )}
    </>
  );
}
