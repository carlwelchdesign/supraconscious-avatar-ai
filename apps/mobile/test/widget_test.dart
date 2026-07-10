import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
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
    expect(find.text('This is not a journal.'), findsOneWidget);
    expect(find.text('Start Your First Reflection'), findsOneWidget);
    expect(find.text('Sign in'), findsOneWidget);
    expect(find.text('API: http://localhost:3000'), findsOneWidget);
  });

  testWidgets('landing create account opens register form', (tester) async {
    await tester.pumpWidget(_testApp(_FakeApiClient(_unauthenticated())));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Start Your First Reflection').first);
    await tester.pumpAndSettle();

    expect(find.text('Name'), findsOneWidget);
    expect(find.text('Create account'), findsOneWidget);
    expect(find.text('Use existing account'), findsOneWidget);
  });

  testWidgets('landing sign in opens login form', (tester) async {
    await tester.pumpWidget(_testApp(_FakeApiClient(_unauthenticated())));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Sign in'));
    await tester.pumpAndSettle();

    expect(find.text('Email'), findsOneWidget);
    expect(find.text('Password'), findsOneWidget);
    expect(find.text('Sign in'), findsOneWidget);
  });

  testWidgets('bootstrap shows consent gate when onboarding is required', (
    tester,
  ) async {
    await tester.pumpWidget(_testApp(_FakeApiClient(_onboardingRequired())));
    await tester.pumpAndSettle();

    expect(find.text('Continue'), findsOneWidget);
    expect(find.byType(CheckboxListTile), findsNWidgets(4));
  });

  testWidgets('bootstrap shows product shell when session is ready', (
    tester,
  ) async {
    await tester.pumpWidget(_testApp(_FakeApiClient(_ready())));
    await tester.pumpAndSettle();

    expect(find.text('Welcome, Carl'), findsOneWidget);
    expect(find.text('Entries'), findsOneWidget);
    expect(find.text('Journal'), findsOneWidget);
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

  test('default API base URL is available to the app shell', () {
    expect(apiBaseUrl, isNotEmpty);
  });

  test(
    'mobile API client reports backend connection failures clearly',
    () async {
      final client = InnerCouncilApiClient(
        baseUrl: 'http://127.0.0.1:1',
        httpClient: _FailingHttpClient(),
      );

      await expectLater(
        client.getSession(),
        throwsA(
          isA<MobileApiException>().having(
            (error) => error.message,
            'message',
            contains('Could not reach the backend at http://127.0.0.1:1'),
          ),
        ),
      );
    },
  );
}

class _FailingHttpClient extends http.BaseClient {
  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) {
    throw http.ClientException('Connection refused', request.url);
  }
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

  @override
  Future<MobileDashboard> getDashboard() async => const MobileDashboard(
    greetingName: 'Carl',
    currentLevel: 1,
    avatarStage: 1,
    patternMemoryEnabled: true,
    entryCount: 2,
    activePatternCount: 1,
    recentSessions: [],
  );

  @override
  Future<List<MobileSavedSessionSummary>> getSavedSessions() async => const [];

  @override
  Future<List<MobilePattern>> getPatterns() async => const [];
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
