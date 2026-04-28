"use client"

import Link from "next/link"
import { useActionState } from "react"
import { Loader2 } from "lucide-react"
import type { AuthActionState } from "@/lib/auth/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type AuthFormProps = {
  mode: "login" | "register"
  action: (state: AuthActionState, formData: FormData) => Promise<AuthActionState>
}

export function AuthForm({ mode, action }: AuthFormProps) {
  const [state, formAction, isPending] = useActionState(action, {})
  const isRegister = mode === "register"

  return (
    <form action={formAction} className="w-full max-w-sm space-y-4 rounded-lg border bg-card p-6 shadow-sm">
      <div>
        <h1 className="text-xl font-semibold tracking-normal">{isRegister ? "Create Account" : "Account Login"}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          {isRegister ? "Start with email and password. The first account becomes admin." : "Sign in with your Inner Avatar account."}
        </p>
      </div>

      {isRegister ? (
        <label className="block space-y-2 text-sm">
          <span>Name</span>
          <Input name="name" autoComplete="name" required />
        </label>
      ) : null}

      <label className="block space-y-2 text-sm">
        <span>Email</span>
        <Input name="email" type="email" autoComplete="email" required />
      </label>

      <label className="block space-y-2 text-sm">
        <span>Password</span>
        <Input
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          minLength={isRegister ? 8 : undefined}
          required
        />
      </label>

      {state.error ? <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" className="w-full gap-2" disabled={isPending}>
        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {isRegister ? "Create Account" : "Sign In"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {isRegister ? "Already have an account?" : "Need an account?"}{" "}
        <Link href={isRegister ? "/login" : "/register"} className="font-medium text-foreground underline-offset-4 hover:underline">
          {isRegister ? "Sign in" : "Register"}
        </Link>
      </p>
    </form>
  )
}
