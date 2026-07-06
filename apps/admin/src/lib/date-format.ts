const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  year: "numeric",
  month: "short",
  day: "numeric",
})

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  year: "numeric",
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZoneName: "short",
})

export function formatAdminDate(value: string | Date | null | undefined) {
  if (!value) return "-"
  return DATE_FORMATTER.format(new Date(value))
}

export function formatAdminDateTime(value: string | Date | null | undefined) {
  if (!value) return "-"
  return DATE_TIME_FORMATTER.format(new Date(value))
}
