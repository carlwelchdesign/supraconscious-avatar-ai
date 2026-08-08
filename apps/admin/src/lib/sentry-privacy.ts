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

export const SENTRY_PRIVACY_OPTIONS = {
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: { request: false, response: false },
    httpBodies: [],
    urlQueryParams: false,
    graphQL: { document: false, variables: false },
    genAI: { inputs: false, outputs: false },
    databaseQueryData: false,
    stackFrameVariables: false,
    frameContextLines: 0,
  },
  enableLogs: false,
  maxBreadcrumbs: 0,
  replaysOnErrorSampleRate: 0,
  replaysSessionSampleRate: 0,
  sendDefaultPii: false,
  tracesSampleRate: 0,
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
      url: stripQueryAndFragment(event.request.url),
    }
  }

  return event
}

function stripQueryAndFragment(url: string | undefined) {
  if (!url) return undefined
  return url.split(/[?#]/, 1)[0]
}
