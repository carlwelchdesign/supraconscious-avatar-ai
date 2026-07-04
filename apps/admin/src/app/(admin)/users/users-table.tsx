"use client"

import { useMemo, useState } from "react"
import {
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
import { resetUserPasswordAction } from "./actions"

type UserRow = {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: string
  journalEntryCount: number
  sessionCount: number
}

export function UsersTable({ users }: { users: UserRow[] }) {
  const [query, setQuery] = useState("")
  const normalizedQuery = query.trim().toLowerCase()

  const filteredUsers = useMemo(() => {
    if (!normalizedQuery) return users

    return users.filter((user) =>
      [
        user.name ?? "",
        user.email,
        user.role,
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
                      slotProps={{ htmlInput: { minLength: 8 } }}
                    />
                    <TextField
                      name="reason"
                      size="small"
                      label="Reason"
                      placeholder="Founder login setup"
                      slotProps={{ htmlInput: { minLength: 10 } }}
                    />
                    <Button type="submit" variant="outlined" size="small">
                      Reset password
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      Existing sessions are revoked. The password is not stored in audit logs.
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {!filteredUsers.length ? (
              <TableRow>
                <TableCell colSpan={6}>
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
