import * as React from "react"

import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // La selección de texto pinta el acento de fondo, así que la letra
        // seleccionada tiene que ir en la tinta que el sistema reserva para
        // escribir SOBRE el acento. En blanco fijo, seleccionar el correo en
        // el tema claro lo dejaba ilegible mientras estaba seleccionado.
        "file:text-foreground placeholder:text-muted-foreground selection:bg-[rgb(var(--accent-base))] selection:text-[rgb(var(--accent-ink))] border-input flex h-9 w-full min-w-0 rounded-[2px] border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        className
      )}
      {...props}
    />
  )
}

export { Input }
