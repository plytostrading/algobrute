"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--background)",
          "--normal-border": "var(--border)",
          "--normal-text": "var(--foreground)",
          "--success-bg": "var(--background)",
          "--success-border": "var(--border)",
          "--success-text": "var(--foreground)",
          "--error-bg": "var(--background)",
          "--error-border": "var(--border)",
          "--error-text": "var(--foreground)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
