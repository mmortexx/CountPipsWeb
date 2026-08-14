"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { OPEN_GLOSSARY, OPEN_SHORTCUTS_HELP } from "@/lib/overlays";

/**
 * OverlayHost — el portero de las tres ventanas de overlay globales.
 *
 * ── El problema que resuelve ──────────────────────────────────────────
 * `CommandPalette`, `ShortcutsHelp` y `GlossaryModal` estaban montados en
 * el layout o componentes sueltos. Al centralizarlos aquí bajo demanda,
 * ningún overlay descarga su JavaScript hasta el primer gesto o atajo.
 */

const CommandPalette = dynamic(
  () => import("@/components/tj/CommandPalette").then((m) => m.CommandPalette),
  { ssr: false }
);

const ShortcutsHelp = dynamic(
  () => import("@/components/tj/ShortcutsHelp").then((m) => m.ShortcutsHelp),
  { ssr: false }
);

const GlossaryModal = dynamic(
  () => import("@/components/tj/GlossaryModal").then((m) => m.GlossaryModal),
  { ssr: false }
);

function prefetchOverlays() {
  if (typeof window === "undefined") return;
  let pedido = false;
  const load = () => {
    if (pedido) return;
    pedido = true;
    quitar();
    import("@/components/tj/CommandPalette");
    import("@/components/tj/ShortcutsHelp");
    import("@/components/tj/GlossaryModal");
  };
  const opts = { passive: true, once: true } as const;
  const quitar = () => {
    window.removeEventListener("pointermove", load);
    window.removeEventListener("touchstart", load);
    window.removeEventListener("keydown", load);
  };
  window.addEventListener("pointermove", load, opts);
  window.addEventListener("touchstart", load, opts);
  window.addEventListener("keydown", load, { once: true });
}

/* Margen que se le da a la animación de salida antes de arrancar el
   overlay del árbol. Cubre los 180 ms que dura el fundido más un
   respiro. */
const EXIT_MS = 260;

export function OverlayHost() {
  // `mounted` decide si el overlay existe en el árbol de React.
  const [cmdMounted, setCmdMounted] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [helpMounted, setHelpMounted] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [glossaryMounted, setGlossaryMounted] = useState(false);
  const [glossaryOpen, setGlossaryOpen] = useState(false);

  const openCmd = useCallback((next: boolean) => {
    setCmdMounted(true);
    setCmdOpen(next);
  }, []);

  const openHelp = useCallback((next: boolean) => {
    setHelpMounted(true);
    setHelpOpen(next);
  }, []);

  const openGlossaryModal = useCallback((next: boolean) => {
    setGlossaryMounted(true);
    setGlossaryOpen(next);
  }, []);

  useEffect(() => {
    if (cmdOpen || !cmdMounted) return;
    const t = window.setTimeout(() => setCmdMounted(false), EXIT_MS);
    return () => window.clearTimeout(t);
  }, [cmdOpen, cmdMounted]);

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
    prefetchOverlays();

    // ⌘K / ⌃K — paleta de comandos
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

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdMounted(true);
        setCmdOpen((o) => !o);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "g") {
        e.preventDefault();
        setGlossaryMounted(true);
        setGlossaryOpen((o) => !o);
      }
    };

    const onHelp = () => {
      setHelpMounted(true);
      setHelpOpen(true);
    };

    const onGlossary = () => {
      setGlossaryMounted(true);
      setGlossaryOpen(true);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_SHORTCUTS_HELP, onHelp);
    window.addEventListener(OPEN_GLOSSARY, onGlossary);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_SHORTCUTS_HELP, onHelp);
      window.removeEventListener(OPEN_GLOSSARY, onGlossary);
    };
  }, []);

  return (
    <>
      {cmdMounted && <CommandPalette open={cmdOpen} onOpenChange={openCmd} />}
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
