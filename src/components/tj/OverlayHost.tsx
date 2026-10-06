"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { OPEN_GLOSSARY, OPEN_SHORTCUTS_HELP } from "@/lib/overlays";

/**
 * Monta bajo demanda las ventanas globales (`ShortcutsHelp` y `GlossaryModal`):
 * su JavaScript no se descarga hasta que alguien las pide con un atajo o con
 * `openGlossary` / `openShortcutsHelp` (`@/lib/overlays`).
 */

const ShortcutsHelp = dynamic(
  () => import("@/components/tj/ShortcutsHelp").then((m) => m.ShortcutsHelp),
  { ssr: false }
);

const GlossaryModal = dynamic(
  () => import("@/components/tj/GlossaryModal").then((m) => m.GlossaryModal),
  { ssr: false }
);

// Margen para la animación de salida antes de quitar el overlay del árbol
// (el fundido dura 180 ms).
const EXIT_MS = 260;

export function OverlayHost() {
  const [helpMounted, setHelpMounted] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [glossaryMounted, setGlossaryMounted] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  const openHelp = useCallback((next: boolean) => {
    setHelpMounted(true);
    setHelpOpen(next);
  }, []);

  // Sin disparador propio, Radix deja el foco en `<body>` al cerrar: se recuerda
  // dónde estaba y se devuelve tras el repintado que suelta la trampa de foco.
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

    // ⌘G / ⌃G abre el glosario, salvo al escribir en un campo.
    const onKey = (e: KeyboardEvent) => {
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
