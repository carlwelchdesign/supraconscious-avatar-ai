"use client"

import { useFormStatus } from "react-dom"
import { Button, type ButtonProps } from "@mui/material"

type MuiSubmitButtonProps = ButtonProps & {
  pendingLabel?: string
}

export function MuiSubmitButton({ children, pendingLabel = "Saving...", disabled, ...props }: MuiSubmitButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button {...props} type="submit" disabled={disabled || pending}>
      {pending ? pendingLabel : children}
    </Button>
  )
}
