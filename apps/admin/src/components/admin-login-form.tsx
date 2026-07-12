"use client"

import { useActionState } from "react"
import { useTranslations } from "next-intl"
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material"
import { adminLoginAction, type AuthActionState } from "@inner-avatar/auth/actions"
import { TurnstileWidget } from "./turnstile-widget"

export function AdminLoginForm() {
  const t = useTranslations()
  const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(
    adminLoginAction,
    {},
  )

  return (
    <Card
      component="section"
      variant="outlined"
      sx={{
        width: "100%",
        maxWidth: 420,
        borderColor: "divider",
        boxShadow: "0 18px 60px rgba(43, 27, 53, 0.08)",
      }}
    >
      <CardContent sx={{ p: 4 }}>
        <Box component="form" action={formAction}>
          <Stack spacing={3}>
            <Box sx={{ display: "none" }} aria-hidden="true">
              <label>
                {t("website")}
                <input name="website" type="text" tabIndex={-1} autoComplete="off" />
              </label>
            </Box>
            <Stack spacing={1}>
              <Typography variant="h5" component="h1">
                {t("loginTitle")}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("loginSubtitle")}
              </Typography>
            </Stack>

            <TextField
              name="email"
              label={t("email")}
              type="email"
              autoComplete="email"
              required
              fullWidth
            />
            <TextField
              name="password"
              label={t("password")}
              type="password"
              autoComplete="current-password"
              required
              fullWidth
            />

            {state.error ? <Alert severity="error">{state.error}</Alert> : null}

            <TurnstileWidget />

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isPending}
              startIcon={isPending ? <CircularProgress color="inherit" size={18} /> : null}
              fullWidth
            >
              {t("signIn")}
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  )
}
