"use client"

import { useActionState } from "react"
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

export function AdminLoginForm() {
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
            <Stack spacing={1}>
              <Typography variant="h5" component="h1">
                Admin Login
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Sign in with an account that has admin or super_admin access.
              </Typography>
            </Stack>

            <TextField
              name="email"
              label="Email"
              type="email"
              autoComplete="email"
              required
              fullWidth
            />
            <TextField
              name="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              required
              fullWidth
            />

            {state.error ? <Alert severity="error">{state.error}</Alert> : null}

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isPending}
              startIcon={isPending ? <CircularProgress color="inherit" size={18} /> : null}
              fullWidth
            >
              Sign In
            </Button>
          </Stack>
        </Box>
      </CardContent>
    </Card>
  )
}
