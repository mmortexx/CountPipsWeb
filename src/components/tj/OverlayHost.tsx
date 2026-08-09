"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { OPEN_SHORTCUTS_HELP } from "@/lib/overlays";

/**
 * OverlayHost — el portero de las dos ventanas que casi nadie abre.
 *
 * ── El problema que resuelve ──────────────────────────────────────────
 * `CommandPalette` y `ShortcutsHelp` estaban montados en el layout, o
 * sea, en las nueve rutas del sitio. Entre las dos arrastran `cmdk`, el
 * árbol de `framer-motion` y unas 900 líneas de código propio, y las dos
 * empiezan CERRADAS: no pintan un solo píxel hasta que alguien pulsa ⌘K
 * o `?`. Cada visitante descargaba, parseaba y ejecutaba todo eso para
 * mirar una landing — y la inmensa mayoría no pulsa ninguna de las dos
 * teclas jamás.
 *
 * ── Por qué no bastaba con `next/dynamic` a secas ─────────────────────
 * Diferir el módulo no sirve de nada si el propio módulo es quien
 * escucha la tecla que lo despierta: para enterarse de que has pulsado
 * ⌘K tendría que estar ya cargado, que es justo lo que se quería evitar.
 * Ese era el nudo. Se deshace separando las dos responsabilidades: la
 * ESCUCHA se queda aquí, en un listener de teclado que no importa nada;
 * la INTERFAZ se va a un `import()` que solo se resuelve cuando el atajo
 * llega de verdad. Por eso los dos overlays pasaron a ser controlados —
 * quien manda sobre su `open` es este componente, no ellos.
 *
 * ── Qué paga cada visitante ───────────────────────────────────────────
 * De entrada: este archivo. Al pulsar ⌘K por primera vez: la descarga
 * del panel, que en una conexión normal cabe en el tiempo de la propia
 * animación de apertura. A partir de ahí queda montado y las siguientes
 * aperturas son instantáneas.
 *
 * `prefetchOverlays` se encarga de que ni esa primera vez se note: en
 * cuanto el navegador queda ocioso tras la carga, los dos módulos se
 * piden en segundo plano y con prioridad baja. Cuando el usuario pulse,
 * lo normal es que ya estén en caché.
 */

const CommandPalette = dynamic(
  () => import("@/components/tj/CommandPalette").then((m) => m.CommandPalette),
  { ssr: false }
);

const ShortcutsHelp = dynamic(
  () => import("@/components/tj/ShortcutsHelp").then((m) => m.ShortcutsHelp),
  { ssr: false }
);

/**
 * Precarga al PRIMER GESTO, no en cuanto el navegador queda ocioso.
 *
 * ── Por qué cambió ────────────────────────────────────────────────────
 * Antes se pedían los dos overlays con `requestIdleCallback`, unos
 * segundos después de cargar. Suena inocuo —prioridad baja, hilo libre—
 * pero medido son 74 KB de `cmdk` descargados en TODAS las páginas,
 * incluidas las cuatro legales, donde el visitante llega a leer un texto
 * y marcharse. Nadie abre la paleta de comandos en una política de
 * privacidad.
 *
 * El primer gesto —mover el puntero, tocar la pantalla, pulsar una
 * tecla— separa bien los dos casos: quien va a usar un atajo de teclado
 * ya ha interactuado con la página mucho antes de pulsarlo, así que
 * sigue encontrando el panel en caché; y quien entra, lee y cierra no
 * descarga nada. El coste para el primero es nulo y el ahorro para el
 * segundo es completo.
 *
 * `once: true` en los tres oyentes y una bandera: basta con el primero
 * que llegue.
 */
function prefetchOverlays() {
  if (typeof window === "undefined") return;
  let pedido = false;
  const load = () => {
    if (pedido) return;
    pedido = true;
    quitar();
    import("@/components/tj/CommandPalette");
    import("@/components/tj/ShortcutsHelp");
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

  const openCmd = useCallback((next: boolean) => {
    setCmdMounted(true);
    setCmdOpen(next);
  }, []);

  const openHelp = useCallback((next: boolean) => {
    setHelpMounted(true);
    setHelpOpen(next);
  }, []);

  /* ---- El desmontaje lo decide el anfitrión --------------------------
     Cerrar un overlay tiene que quitarlo del DOM, y aquí no se puede
     delegar eso en la animación de salida.

     El motivo es un fallo real que costó encontrar: con `AnimatePresence`
     envolviendo un `{open && …}`, el estado llegaba correctamente a
     `open === false` —comprobado leyendo el árbol de React en el
     navegador— pero el nodo se quedaba en pantalla, porque la salida no
     se completaba nunca. Y no era un problema estético: mientras el
     panel siga en el DOM, `GlobalShortcuts` lo detecta y da por hecho
     que hay un overlay delante, así que desactiva `?`, `t`, `l` y toda
     la navegación con `g`. Un cierre que no terminaba dejaba el teclado
     del sitio entero inservible hasta recargar.

     Así que el cierre no depende de que la animación avise: se concede
     el tiempo del fundido y después se arranca el componente del árbol,
     pase lo que pase. Remontarlo más tarde es barato — el módulo ya está
     descargado y no vuelve a pedirse a la red. */
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
    prefetchOverlays();

    // ⌘K / ⌃K — mismo contrato que tenía la paleta cuando el listener
    // vivía dentro de ella: alterna, y se adelanta al buscador nativo
    // del navegador con preventDefault.
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCmdMounted(true);
        setCmdOpen((o) => !o);
      }
    };

    // `?` no se escucha aquí: lo hace `GlobalShortcuts`, que es quien
    // sabe descartar la pulsación si venía de un campo de texto o si ya
    // hay otro overlay delante. Aquí sólo se recoge su aviso.
    const onHelp = () => {
      setHelpMounted(true);
      setHelpOpen(true);
    };

    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_SHORTCUTS_HELP, onHelp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_SHORTCUTS_HELP, onHelp);
    };
  }, []);

  return (
    <>
      {cmdMounted && <CommandPalette open={cmdOpen} onOpenChange={openCmd} />}
      {helpMounted && <ShortcutsHelp open={helpOpen} onOpenChange={openHelp} />}
    </>
  );
}
