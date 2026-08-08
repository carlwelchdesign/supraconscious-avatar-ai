# Sentry error monitoring

Sentry error monitoring is installed for the web app, admin app, ChatGPT/Express service, and Flutter client. It is disabled when the relevant DSN is blank, so local development and CI do not transmit events by default.

## Privacy boundary

This product handles private journal and reflection data. The checked-in configuration therefore keeps the following collection disabled:

- inferred user information and default PII;
- cookies, request/response headers, query parameters, and HTTP bodies;
- generative-AI inputs and outputs;
- database query values and stack-frame local variables;
- breadcrumbs, logs, session replay, screenshots, view hierarchy, and performance traces.

The final event hook also removes user, extra, breadcrumb, context, standalone-message, and request-payload data, retaining only the HTTP method and URL path when a request is present. Exception values are replaced with a generic label while their type and stack location remain available for diagnosis. Do not attach journal text, reflection output, prompt content, access tokens, email addresses, or raw identifiers through manual Sentry calls.

This engineering control does not replace the legal/privacy review required before broader pilot use. Sentry project settings should also disable IP-address storage and restrict project access to the minimum required operators.

## Activation

Create separate Sentry projects for each runtime surface, then configure only the corresponding deployment:

| Surface | Runtime DSN |
| --- | --- |
| Web server | `SENTRY_WEB_DSN` |
| Web browser | `NEXT_PUBLIC_SENTRY_WEB_DSN` |
| Admin server | `SENTRY_ADMIN_DSN` |
| Admin browser | `NEXT_PUBLIC_SENTRY_ADMIN_DSN` |
| ChatGPT/Express | `SENTRY_CHATGPT_DSN` |
| Flutter | `SENTRY_MOBILE_DSN` passed with `--dart-define` |

Sentry DSNs are routing identifiers, but they should still be managed through deployment configuration instead of committed values. Server and browser variables may point to the same surface-specific project.

Set `SENTRY_ENVIRONMENT` and `SENTRY_RELEASE` on server runtimes. Next.js browser builds use the matching `NEXT_PUBLIC_SENTRY_ENVIRONMENT` and `NEXT_PUBLIC_SENTRY_RELEASE` values. Flutter uses `--dart-define=SENTRY_ENVIRONMENT=...` and `--dart-define=SENTRY_RELEASE=...`.

For readable Next.js stack traces, configure `SENTRY_ORG`, the relevant `SENTRY_WEB_PROJECT` or `SENTRY_ADMIN_PROJECT`, and the build-only `SENTRY_AUTH_TOKEN`. Source-map upload is disabled when the auth token is absent. Never expose the auth token through a `NEXT_PUBLIC_*` variable.

Example mobile run:

```sh
flutter run \
  --dart-define=SENTRY_MOBILE_DSN="$SENTRY_MOBILE_DSN" \
  --dart-define=SENTRY_ENVIRONMENT=staging \
  --dart-define=SENTRY_RELEASE="inner-avatar-mobile@1.0.0+1"
```

## Verification

Run `yarn test:sentry` to enforce the cross-app privacy contract. The normal web, admin, ChatGPT, Flutter, typecheck, lint, build, and CI jobs verify the framework integrations. A real event-delivery smoke test requires deployment-owned DSNs and should use a synthetic exception containing no private user content.
