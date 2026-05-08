"use client"

import { useMemo, useState } from "react"
import {
  Box,
  Chip,
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
              </TableRow>
            ))}
            {!filteredUsers.length ? (
              <TableRow>
                <TableCell colSpan={5}>
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
