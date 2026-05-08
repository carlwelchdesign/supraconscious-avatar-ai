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

type SubscriptionRow = {
  id: string
  userEmail: string
  userName: string | null
  plan: string
  status: string
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  currentPeriodEnd: string | null
}

export function SubscriptionsTable({ subscriptions }: { subscriptions: SubscriptionRow[] }) {
  const [query, setQuery] = useState("")
  const normalizedQuery = query.trim().toLowerCase()

  const filteredSubscriptions = useMemo(() => {
    if (!normalizedQuery) return subscriptions

    return subscriptions.filter((subscription) =>
      [
        subscription.userEmail,
        subscription.userName ?? "",
        subscription.plan,
        subscription.status,
        subscription.stripeCustomerId ?? "",
        subscription.stripeSubscriptionId ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [normalizedQuery, subscriptions])

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" component="h1">
          Subscriptions
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75 }}>
          Stripe subscription state synced from checkout and webhook events.
        </Typography>
      </Box>

      <Paper variant="outlined" sx={{ p: 2 }}>
        <TextField
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          label="Search subscriptions"
          placeholder="Search by email, plan, status, Stripe ID..."
          fullWidth
        />
      </Paper>

      <TableContainer component={Paper} variant="outlined">
        <Table aria-label="Subscriptions table">
          <TableHead>
            <TableRow>
              <TableCell>User</TableCell>
              <TableCell>Plan</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Stripe Customer</TableCell>
              <TableCell>Renews / Ends</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredSubscriptions.map((subscription) => (
              <TableRow key={subscription.id} hover>
                <TableCell>
                  <Typography sx={{ fontWeight: 650 }}>
                    {subscription.userName || subscription.userEmail}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {subscription.userEmail}
                  </Typography>
                </TableCell>
                <TableCell>{subscription.plan}</TableCell>
                <TableCell>
                  <Chip
                    label={subscription.status}
                    size="small"
                    color={subscription.status === "active" ? "primary" : "default"}
                    variant={subscription.status === "active" ? "filled" : "outlined"}
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {subscription.stripeCustomerId ?? "No Stripe customer"}
                  </Typography>
                </TableCell>
                <TableCell>
                  {subscription.currentPeriodEnd
                    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
            {!filteredSubscriptions.length ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
                    No subscriptions match that search.
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
