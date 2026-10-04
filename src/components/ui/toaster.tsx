"use client"

import { useToast } from "@/hooks/use-toast"
import { useLang } from "@/lib/i18n"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"

export function Toaster() {
  const { toasts } = useToast()
  const { lang } = useLang()
  const es = lang === "es"

  return (
    <ToastProvider label={es ? "Aviso" : "Notification"}>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose aria-label={es ? "Cerrar aviso" : "Dismiss"} />
          </Toast>
        )
      })}
      <ToastViewport label={es ? "Avisos ({hotkey})" : "Notifications ({hotkey})"} />
    </ToastProvider>
  )
}