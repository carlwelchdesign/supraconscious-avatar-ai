"use client"

import { useMemo, useState } from "react"
import {
  Alert,
  Box,
  Chip,
  Button,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material"
import { resetUserPasswordAction, updateEmailVerificationAction } from "./actions"

type UserRow = {
  id: string
  email: string
  name: string | null
  role: string
  emailVerified: boolean
  createdAt: string
  journalEntryCount: number
  sessionCount: number
  founderParticipantRole: string | null
  founderParticipantStatus: string | null
}

const STATUS_MESSAGES: Record<string, { severity: "success" | "warning" | "error"; message: string }> = {
  password_reset: { severity: "success", message: "Temporary password saved and existing sessions revoked." },
  password_invalid: { severity: "error", message: "Password reset needs a valid temporary password and a reason of at least 10 characters." },
  password_failed: { severity: "error", message: "Password reset did not complete. Try again or check the logs." },
  user_missing: { severity: "error", message: "That user is no longer available." },
  email_verified: { severity: "success", message: "User email marked verified." },
  email_unverified: { severity: "warning", message: "User email marked unverified." },
  email_invalid: { severity: "error", message: "Email verification update needs a valid user and reason." },
}

export function UsersTable({ users, status }: { users: UserRow[]; status?: string }) {
  const [query, setQuery] = useState("")
  const normalizedQuery = query.trim().toLowerCase()
  const statusMessage = status ? STATUS_MESSAGES[status] : null

  const filteredUsers = useMemo(() => {
    if (!normalizedQuery) return users

    return users.filter((user) =>
      [
        user.name ?? "",
        user.email,
        user.role,
        user.founderParticipantRole ?? "",
        user.founderParticipantStatus ?? "",
        user.id,
        String(user.journalEntryCount),
        String(user.sessionCount),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [normalizedQuery, users])

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1">
          Users
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75 }}>
          Search accounts by name, email, role, ID, entry count, or session count.
        </Typography>
      </Box>

      {statusMessage ? (
        <Alert severity={statusMessage.severity}>
          {statusMessage.message}
        </Alert>
      ) : null}

      <Paper variant="outlined" sx={{ p: 2 }}>
        <TextField
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          label="Search users"
          placeholder="Search by email, role, name..."
          fullWidth
        />
      </Paper>

      <TableContainer component={Paper} variant="outlined">
        <Table aria-label="Users table">
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Founder</TableCell>
              <TableCell>Email</TableCell>
              <TableCell align="right">Entries</TableCell>
              <TableCell align="right">Sessions</TableCell>
              <TableCell>Created</TableCell>
              <TableCell>Super-admin action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id} hover>
                <TableCell>
                  <Typography sx={{ fontWeight: 650 }}>{user.name || user.email}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {user.email}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.role}
                    color={user.role === "super_admin" ? "secondary" : user.role === "admin" ? "primary" : "default"}
                    size="small"
                    variant={user.role === "user" ? "outlined" : "filled"}
                  />
                </TableCell>
                <TableCell>
                  {user.founderParticipantRole ? (
                    <Box sx={{ display: "grid", justifyItems: "start", gap: 0.5 }}>
                      <Chip
                        label={user.founderParticipantRole.replaceAll("_", " ")}
                        color={user.founderParticipantStatus === "active" ? "success" : "default"}
                        size="small"
                        variant={user.founderParticipantStatus === "active" ? "filled" : "outlined"}
                      />
                      {user.founderParticipantStatus !== "active" ? (
                        <Typography variant="caption" color="text.secondary">
                          {user.founderParticipantStatus}
                        </Typography>
                      ) : null}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      -
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={user.emailVerified ? "verified" : "unverified"}
                    color={user.emailVerified ? "success" : "default"}
                    size="small"
                    variant={user.emailVerified ? "filled" : "outlined"}
                  />
                </TableCell>
                <TableCell align="right">{user.journalEntryCount}</TableCell>
                <TableCell align="right">{user.sessionCount}</TableCell>
                <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Box component="form" action={resetUserPasswordAction} sx={{ display: "grid", gap: 1, minWidth: 240 }}>
                    <input type="hidden" name="userId" value={user.id} />
                    <TextField
                      name="temporaryPassword"
                      type="password"
                      size="small"
                      label="Temporary password"
                      autoComplete="new-password"
                      required
                      slotProps={{ htmlInput: { minLength: 8 } }}
                    />
                    <TextField
                      name="reason"
                      size="small"
                      label="Reason"
                      placeholder="Founder login setup"
                      required
                      slotProps={{ htmlInput: { minLength: 10 } }}
                    />
                    <Button type="submit" variant="outlined" size="small">
                      Reset password
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      Existing sessions are revoked. The password is not stored in audit logs.
                    </Typography>
                  </Box>
                  <Box component="form" action={updateEmailVerificationAction} sx={{ display: "grid", gap: 1, minWidth: 240, mt: 2 }}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input type="hidden" name="emailVerified" value={user.emailVerified ? "false" : "true"} />
                    <TextField
                      name="reason"
                      size="small"
                      label="Verification reason"
                      placeholder="Founder email confirmed"
                      required
                      slotProps={{ htmlInput: { minLength: 10 } }}
                    />
                    <Button type="submit" variant="outlined" size="small" color={user.emailVerified ? "warning" : "success"}>
                      {user.emailVerified ? "Mark unverified" : "Mark verified"}
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      Manual verification is audited. No verification email is sent.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {!filteredUsers.length ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                    No users match that search.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  )
}
