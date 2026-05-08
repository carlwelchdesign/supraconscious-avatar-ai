import { redirect } from "next/navigation"
import { Box } from "@mui/material"
import { getCurrentUser } from "@inner-avatar/auth/session"
import { AdminLoginForm } from "@/components/admin-login-form"

export default async function LoginPage() {
  const user = await getCurrentUser("admin")
  if (user && (user.role === "admin" || user.role === "super_admin")) redirect("/")

  return (
    <Box
      component="main"
      sx={{
        alignItems: "center",
        display: "flex",
        minHeight: "100vh",
        justifyContent: "center",
        px: 2,
      }}
    >
      <AdminLoginForm />
    </Box>
  )
}
