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

  testWidgets('journal tab shows prompt guidance when ready', (tester) async {
    await tester.pumpWidget(_testApp(_FakeApiClient(_ready())));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Journal'));
    await tester.pumpAndSettle();

    expect(find.text('What is present today?'), findsOneWidget);
    expect(
      find.text(
        'Write one honest entry. The council will reflect patterns, tensions, and one grounded next step.',
      ),
      findsOneWidget,
    );
    expect(find.text('Threshold · Month 7, Day 10'), findsOneWidget);
    expect(find.text('What are you not letting yourself say?'), findsOneWidget);
  });

  testWidgets('journal tab works when prompt is unavailable', (tester) async {
    await tester.pumpWidget(
      _testApp(_FakeApiClient(_ready(), prompt: _emptyJournalPrompt())),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Journal'));
    await tester.pumpAndSettle();

    expect(find.text('What is present today?'), findsOneWidget);
    expect(
      find.text(
        'No Threshold prompt is published for today. Write what is present without forcing a structure.',
      ),
      findsOneWidget,
    );
  });

  test('journal analyze result parses council synthesis fallback', () {
    final result = JournalAnalyzeResult.fromJson({
      'analysis': {'summary': 'A repeated pattern is visible.'},
      'avatarResponse': {
        'mirror': 'You already know.',
        'integrationStep': 'Fallback step',
      },
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
    expect(result.mirror, 'You already know.');
  });

  test(
    'saved session detail parses reflection, feedback, embodiment, and sources',
    () {
      final session = MobileSavedSessionDetail.fromJson({
        'id': 'session-1',
        'sourceMode': 'rag',
        'journalEntry': {'text': 'Full entry'},
        'avatarResponse': {
          'openingLine': 'Start',
          'mirror': 'Mirror',
          'patternName': 'Pattern',
          'contradiction': 'Contradiction',
          'socraticQuestion': 'Question?',
          'integrationStep': 'Step',
          'closingLine': 'Close',
        },
        'messages': [
          {
            'displayName': 'The Protector',
            'content': 'Careful.',
            'abstained': false,
          },
        ],
        'synthesis': {
          'integratorQuestion': 'What is true?',
          'integrationStep': 'Pause.',
        },
        'feedback': [
          {'id': 'feedback-1', 'feedbackType': 'helpful', 'hasNote': true},
        ],
        'embodimentGateResponses': [
          {'id': 'gate-1', 'text': 'One small shift.'},
        ],
        'sourceGrounding': {
          'mode': 'rag',
          'message': 'Used approved source grounding.',
          'selectedSources': [
            {
              'id': 'source-1',
              'title': 'Approved source',
              'rank': 1,
              'displayExcerpt': 'Short excerpt',
              'matchedTerms': ['clarity'],
            },
          ],
        },
      });

      expect(session.id, 'session-1');
      expect(session.avatarResponse?.mirror, 'Mirror');
      expect(session.messages.single.displayName, 'The Protector');
      expect(session.feedback.single.hasNote, true);
      expect(session.embodimentGateResponses.single.text, 'One small shift.');
      expect(
        session.sourceGrounding.selectedSources.single.title,
        'Approved source',
      );
    },
  );

  test('mobile guide parses current stage timeline', () {
    final guide = MobileGuide.fromJson({
      'currentStage': 2,
      'avatarTone': 'balanced',
      'intensityLevel': 3,
      'stages': [
        {
          'stage': 1,
          'name': 'Echo',
          'description': 'Reflects language.',
          'trait': 'Listening',
          'currentLabel': 'Current',
          'completedLabel': 'Complete',
          'state': 'complete',
        },
        {
          'stage': 2,
          'name': 'Witness',
          'description': 'Notices signals.',
          'trait': 'Noticing',
          'currentLabel': 'Current',
          'completedLabel': 'Complete',
          'state': 'current',
        },
      ],
    });

    expect(guide.currentStage, 2);
    expect(guide.stages.last.name, 'Witness');
    expect(guide.stages.last.state, 'current');
  });

  test('mobile journal prompt parses threshold prompt', () {
    final prompt = MobileJournalPrompt.fromJson({
      'todayLabel': 'Friday, July 10',
      'prompt': {
        'month': 7,
        'day': 10,
        'theme': 'Clarity',
        'quote': 'A short approved quote.',
        'frameOfThought': 'Notice what is present.',
        'socraticQuestion': 'What are you not letting yourself say?',
      },
    });

    expect(prompt.todayLabel, 'Friday, July 10');
    expect(prompt.prompt?.theme, 'Clarity');
    expect(
      prompt.prompt?.socraticQuestion,
      'What are you not letting yourself say?',
    );
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
  _FakeApiClient(this._session, {MobileJournalPrompt? prompt})
    : _prompt = prompt ?? _journalPrompt(),
      super(baseUrl: 'http://localhost:3000');

  final MobileSession _session;
  final MobileJournalPrompt _prompt;

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

  @override
  Future<MobileGuide> getGuide() async => const MobileGuide(
    currentStage: 1,
    avatarTone: 'balanced',
    intensityLevel: 3,
    stages: [
      MobileGuideStage(
        stage: 1,
        name: 'Echo',
        description: 'Reflects your language back with care.',
        trait: 'Listening',
        currentLabel: 'Current',
        completedLabel: 'Complete',
        state: 'current',
      ),
    ],
  );

  @override
  Future<MobileJournalPrompt> getJournalPrompt() async => _prompt;
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
      avatarTone: 'balanced',
      intensityLevel: 3,
      currentLevel: 1,
      avatarStage: 1,
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
      avatarTone: 'balanced',
      intensityLevel: 3,
      currentLevel: 1,
      avatarStage: 1,
    ),
    consent: MobileConsent(
      version: '2026-06-01',
      hasRequiredConsents: true,
      items: [],
    ),
  );
}

MobileJournalPrompt _journalPrompt() {
  return const MobileJournalPrompt(
    todayLabel: 'Friday, July 10',
    prompt: MobileThresholdPrompt(
      month: 7,
      day: 10,
      theme: 'Clarity',
      quote: 'A short approved quote.',
      frameOfThought: 'Notice what is present before solving it.',
      socraticQuestion: 'What are you not letting yourself say?',
    ),
  );
}

MobileJournalPrompt _emptyJournalPrompt() {
  return const MobileJournalPrompt(todayLabel: 'Friday, July 10', prompt: null);
}
