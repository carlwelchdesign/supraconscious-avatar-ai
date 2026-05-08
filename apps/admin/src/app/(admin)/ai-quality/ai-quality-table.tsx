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

type AiQualityRow = {
  id: string
  patternName: string | null
  createdAt: string
  journalEntryId: string
  userEmail: string
}

export function AiQualityTable({ responses }: { responses: AiQualityRow[] }) {
  const [query, setQuery] = useState("")
  const normalizedQuery = query.trim().toLowerCase()

  const filteredResponses = useMemo(() => {
    if (!normalizedQuery) return responses

    return responses.filter((response) =>
      [
        response.patternName ?? "No pattern named",
        response.userEmail,
        response.journalEntryId,
        response.id,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [normalizedQuery, responses])

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1">
          AI Output Quality
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75 }}>
          Metadata-only review. Raw journal content is not shown here.
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <TextField
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          label="Search AI outputs"
          placeholder="Search by pattern, email, journal ID..."
          fullWidth
        />
      </Paper>

      <TableContainer component={Paper} variant="outlined">
        <Table aria-label="AI output quality table">
          <TableHead>
            <TableRow>
              <TableCell>Pattern</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Journal Entry</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredResponses.map((response) => (
              <TableRow key={response.id} hover>
                <TableCell>
                  <Chip
                    label={response.patternName ?? "No pattern named"}
                    size="small"
                    variant={response.patternName ? "filled" : "outlined"}
                    color={response.patternName ? "primary" : "default"}
                  />
                </TableCell>
                <TableCell>{response.userEmail}</TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {response.journalEntryId}
                  </Typography>
                </TableCell>
                <TableCell>{new Date(response.createdAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
            {!filteredResponses.length ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                    No AI outputs match that search.
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
