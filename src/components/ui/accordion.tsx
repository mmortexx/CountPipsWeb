"use client"

import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Accordion({
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("border-b last:border-b-0", className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-[4px] py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50 [&[data-state=open]>svg]:rotate-180",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    /* ── `forceMount`: LA RESPUESTA TIENE QUE ESTAR EN LA PÁGINA ─────
       Radix desmonta el contenido plegado, así que de las trece preguntas
       de `/faq` solo la abierta existía en el DOM. Las otras doce estaban
       declaradas en el `FAQPage` de datos estructurados y no aparecían por
       ninguna parte del documento — comprobado en el HTML construido:
       «BitLocker» salía en el JSON-LD y cero veces en el cuerpo.

       Eso es exactamente lo que Google llama dato estructurado que no
       coincide con lo que se ve, y el propio código lo advertía por
       escrito en `pricing/page.tsx` mientras lo incumplía por el lado del
       componente. De paso, `/faq` era de las páginas con menos texto
       indexable del sitio: su contenido no estaba.

       Con `forceMount` el contenido siempre está montado y lo que cambia
       es su visibilidad — `visibility: hidden` mientras está plegado, que
       Google acepta y los lectores de pantalla saben interpretar.

       El pliegue lo hace `.tj-pliegue` (globals.css), no la animación de
       Radix: con `forceMount` Radix mide la altura después de pintar y no
       vuelve a pintar, así que abría y cerraba de golpe, sin un solo
       fotograma intermedio. */
    <AccordionPrimitive.Content
      forceMount
      data-slot="accordion-content"
      className="text-sm"
      {...props}
    >
      <div className="tj-pliegue">
        <div>
          <div className={cn("pt-0 pb-4", className)}>{children}</div>
        </div>
      </div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
