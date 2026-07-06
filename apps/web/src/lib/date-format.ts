const DEFAULT_APP_TIME_ZONE = "America/Los_Angeles"

const LONG_DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
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

export type AppCalendarDate = {
  year: number
  month: number
  day: number
  label: string
  timeZone: string
}

export function resolveAppTimeZone(value = process.env.APP_TIME_ZONE) {
  const timeZone = value?.trim() || DEFAULT_APP_TIME_ZONE
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date())
    return timeZone
  } catch {
    return DEFAULT_APP_TIME_ZONE
  }
}

export function getAppCalendarDate(value: string | Date = new Date(), timeZone = resolveAppTimeZone()): AppCalendarDate {
  const date = new Date(value)
  const labelFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
  })
  const partsFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  })
  const parts = Object.fromEntries(partsFormatter.formatToParts(date).map((part) => [part.type, part.value]))

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    label: labelFormatter.format(date),
    timeZone,
  }
}

export function getAppHour(value: string | Date = new Date(), timeZone = resolveAppTimeZone()) {
  const date = new Date(value)
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    hour12: false,
  })
  const hour = Number(formatter.formatToParts(date).find((part) => part.type === "hour")?.value)
  return hour === 24 ? 0 : hour
}

export function formatWebLongDate(value: string | Date | null | undefined) {
  if (!value) return "-"
  return LONG_DATE_FORMATTER.format(new Date(value))
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
