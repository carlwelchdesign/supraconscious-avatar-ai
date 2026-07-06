const LONG_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
})

const JOURNAL_TODAY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  weekday: "long",
  month: "long",
  day: "numeric",
})

const MONTH_DAY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "long",
  day: "numeric",
  year: "numeric",
})

const SHORT_MONTH_DAY_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
  day: "numeric",
})

const SHORT_MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  month: "short",
})

const DAY_OF_MONTH_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  day: "numeric",
})

const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  dateStyle: "medium",
  timeStyle: "short",
})

export function formatWebLongDate(value: string | Date | null | undefined) {
  if (!value) return "-"
  return LONG_DATE_FORMATTER.format(new Date(value))
}

export function formatWebJournalToday(value: string | Date | null | undefined) {
  if (!value) return "-"
  return JOURNAL_TODAY_FORMATTER.format(new Date(value))
}

export function formatWebMonthDay(value: string | Date | null | undefined) {
  if (!value) return "-"
  return MONTH_DAY_FORMATTER.format(new Date(value))
}

export function formatWebShortMonthDay(value: string | Date | null | undefined) {
  if (!value) return "-"
  return SHORT_MONTH_DAY_FORMATTER.format(new Date(value))
}

export function formatWebShortMonth(value: string | Date | null | undefined) {
  if (!value) return "-"
  return SHORT_MONTH_FORMATTER.format(new Date(value))
}

export function formatWebDayOfMonth(value: string | Date | null | undefined) {
  if (!value) return "-"
  return DAY_OF_MONTH_FORMATTER.format(new Date(value))
}

export function formatWebDateTime(value: string | Date | null | undefined) {
  if (!value) return "-"
  return DATE_TIME_FORMATTER.format(new Date(value))
}
