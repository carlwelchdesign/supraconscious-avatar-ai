import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sentry_flutter/sentry_flutter.dart';

import 'src/app.dart';

Future<void> main() async {
  const dsn = String.fromEnvironment('SENTRY_MOBILE_DSN');
  const app = ProviderScope(child: InnerCouncilMobileApp());

  if (dsn.trim().isEmpty) {
    runApp(app);
    return;
  }

  await SentryFlutter.init((options) {
    options
      ..dsn = dsn
      ..environment = const String.fromEnvironment('SENTRY_ENVIRONMENT')
      ..release = const String.fromEnvironment('SENTRY_RELEASE')
      ..sendDefaultPii = false
      ..tracesSampleRate = 0
      ..enableAutoPerformanceTracing = false
      ..enableUserInteractionTracing = false
      ..enableLogs = false
      ..maxBreadcrumbs = 0
      ..attachScreenshot = false
      ..beforeSend = (event, hint) {
        event.user = null;
        event.request = null;
        event.breadcrumbs = null;
        event.contexts.clear();
        event.message = null;
        for (final exception in event.exceptions ?? const <SentryException>[]) {
          exception.value = 'Application error';
        }
        // ignore: deprecated_member_use
        event.extra = null;
        return event;
      };
    // Keep native view structure out of error events.
    // ignore: experimental_member_use
    options.attachViewHierarchy = false;
  }, appRunner: () => runApp(app));
}
