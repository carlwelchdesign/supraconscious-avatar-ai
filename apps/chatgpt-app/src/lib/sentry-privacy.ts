type SanitizableSentryEvent = {
  breadcrumbs?: unknown
  contexts?: unknown
  exception?: {
    values?: Array<{
      value?: string
    }>
  }
  extra?: unknown
  logentry?: unknown
  message?: unknown
  request?: {
    method?: string
    url?: string
  }
  user?: unknown
}

export function scrubSentryEvent<T extends SanitizableSentryEvent>(event: T): T {
  event.user = undefined
  event.extra = undefined
  event.breadcrumbs = undefined
  event.contexts = undefined
  event.logentry = undefined
  event.message = undefined

  for (const exception of event.exception?.values ?? []) {
    exception.value = "Application error"
  }

  if (event.request) {
    event.request = {
      method: event.request.method,
      url: event.request.url?.split(/[?#]/, 1)[0],
    }
  }

  return event
}
