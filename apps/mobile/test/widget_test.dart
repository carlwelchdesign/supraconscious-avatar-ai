import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:inner_council_mobile/src/app.dart';
import 'package:inner_council_mobile/src/mobile_api.dart';
import 'package:inner_council_mobile/src/session_controller.dart';

void main() {
  testWidgets('bootstrap shows auth entry points when unauthenticated', (
    tester,
  ) async {
    await tester.pumpWidget(_testApp(_FakeApiClient(_unauthenticated())));
    await tester.pumpAndSettle();

    expect(find.text('The Inner Council'), findsOneWidget);
    expect(
      find.text('Write. See clearly. Choose consciously.'),
      findsOneWidget,
    );
    expect(find.text('Sign in'), findsOneWidget);
    expect(find.text('Create account'), findsOneWidget);
    expect(find.text('API: http://localhost:3000'), findsOneWidget);
  });

  testWidgets('bootstrap shows consent gate when onboarding is required', (
    tester,
  ) async {
    await tester.pumpWidget(_testApp(_FakeApiClient(_onboardingRequired())));
    await tester.pumpAndSettle();

    expect(find.text('Continue'), findsOneWidget);
    expect(find.byType(CheckboxListTile), findsNWidgets(4));
  });

  testWidgets('bootstrap shows journal path when session is ready', (
    tester,
  ) async {
    await tester.pumpWidget(_testApp(_FakeApiClient(_ready())));
    await tester.pumpAndSettle();

    expect(find.text('Welcome, Carl'), findsOneWidget);
    expect(find.text('Reflection'), findsOneWidget);
    expect(find.text('Ask the Council'), findsOneWidget);
  });

  test('journal analyze result parses council synthesis fallback', () {
    final result = JournalAnalyzeResult.fromJson({
      'analysis': {'summary': 'A repeated pattern is visible.'},
      'avatarResponse': {'integrationStep': 'Fallback step'},
      'councilSession': {
        'id': 'session-1',
        'synthesis': {
          'integratorQuestion': 'What choice is available?',
          'integrationStep': 'Take one breath.',
        },
      },
    });

    expect(result.summary, 'A repeated pattern is visible.');
    expect(result.councilSessionId, 'session-1');
    expect(result.integratorQuestion, 'What choice is available?');
    expect(result.integrationStep, 'Take one breath.');
  });
}

Widget _testApp(InnerCouncilApiClient client) {
  return ProviderScope(
    overrides: [apiClientProvider.overrideWithValue(client)],
    child: const InnerCouncilMobileApp(),
  );
}

class _FakeApiClient extends InnerCouncilApiClient {
  _FakeApiClient(this._session) : super(baseUrl: 'http://localhost:3000');

  final MobileSession _session;

  @override
  Future<MobileSession> getSession() async => _session;
}

MobileSession _unauthenticated() {
  return const MobileSession(
    authenticated: false,
    status: 'unauthenticated',
    user: null,
    consent: MobileConsent(
      version: '2026-06-01',
      hasRequiredConsents: false,
      items: [],
    ),
  );
}

MobileSession _onboardingRequired() {
  return const MobileSession(
    authenticated: true,
    status: 'onboarding_required',
    user: MobileUser(
      email: 'carl@example.com',
      name: 'Carl',
      patternMemoryEnabled: false,
    ),
    consent: MobileConsent(
      version: '2026-06-01',
      hasRequiredConsents: false,
      items: [
        MobileConsentItem(
          type: 'pilot_participation',
          label: 'Pilot terms',
          required: true,
          granted: false,
        ),
        MobileConsentItem(
          type: 'ai_processing',
          label: 'AI processing',
          required: true,
          granted: false,
        ),
        MobileConsentItem(
          type: 'safety_limits',
          label: 'Safety limits',
          required: true,
          granted: false,
        ),
        MobileConsentItem(
          type: 'pattern_memory',
          label: 'Pattern memory',
          required: false,
          granted: false,
        ),
      ],
    ),
  );
}

MobileSession _ready() {
  return const MobileSession(
    authenticated: true,
    status: 'ready',
    user: MobileUser(
      email: 'carl@example.com',
      name: 'Carl',
      patternMemoryEnabled: true,
    ),
    consent: MobileConsent(
      version: '2026-06-01',
      hasRequiredConsents: true,
      items: [],
    ),
  );
}
