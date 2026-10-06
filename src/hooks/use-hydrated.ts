import * as React from "react"

/**
 * `false` durante el render del servidor y la primera pasada de hidratación;
 * `true` en cuanto React ya controla el DOM en el cliente.
 *
 * Evita ofrecer acciones que dependen de JS antes de que JS pueda
 * interceptarlas: los formularios de contacto y boletín no tienen `action`, y
 * un submit nativo previo a la hidratación recarga la página y pierde el
 * mensaje; su botón queda deshabilitado hasta que esto devuelve `true`.
 *
 * Usa `useSyncExternalStore` y no `useState` + `useEffect`, que la regla
 * `react-hooks/set-state-in-effect` del repo rechaza.
 */

/** El valor nunca cambia tras hidratar, así que no hay a qué suscribirse. */
const subscribe = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

export function useHydrated(): boolean {
  return React.useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot)
}
