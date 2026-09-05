import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:inner_council_mobile/src/app.dart';
import 'package:inner_council_mobile/src/mobile_api.dart';
import 'package:inner_council_mobile/src/session_controller.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  late GoldenFileComparator previousGoldenFileComparator;

  setUpAll(() {
    previousGoldenFileComparator = goldenFileComparator;
    goldenFileComparator = _TolerantGoldenFileComparator(
      Uri.parse('test/widget_test.dart'),
      precisionTolerance: 0.02,
    );
  });

  tearDownAll(() {
    goldenFileComparator = previousGoldenFileComparator;
  });

  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  testWidgets('Observatory landing remains composed at 390px', (tester) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(_testApp(_FakeApiClient(_unauthenticated())));
    await _loadObservatoryAsset(tester);
    await tester.pumpAndSettle();

    await expectLater(
      find.byType(MaterialApp),
      matchesGoldenFile('goldens/observatory-landing-390.png'),
    );
  });

  testWidgets('authenticated Observatory shell remains composed at 390px', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(_testApp(_FakeApiClient(_ready())));
    await _loadObservatoryAsset(tester);
    await tester.pumpAndSettle();

    await expectLater(
      find.byType(MaterialApp),
      matchesGoldenFile('goldens/observatory-shell-390.png'),
    );
  });

  testWidgets('bootstrap shows auth entry points when unauthenticated', (
    tester,
  ) async {
    await tester.pumpWidget(_testApp(_FakeApiClient(_unauthenticated())));
    await tester.pumpAndSettle();

    expect(find.text('Supraconscious'), findsWidgets);
    expect(find.text('Bring what’s been on your mind.'), findsOneWidget);
    expect(find.text('Begin your first reflection'), findsOneWidget);
    expect(find.text('Sign in'), findsOneWidget);
    expect(find.text('API: http://localhost:3000'), findsOneWidget);
  });

  testWidgets('landing language selector updates localized copy', (
    tester,
  ) async {
    await tester.pumpWidget(_testApp(_FakeApiClient(_unauthenticated())));
    await tester.pumpAndSettle();

    await tester.tap(find.text('🇺🇸'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Ελληνικά').last);
    await tester.pumpAndSettle();

    expect(find.text('Supraconscious'), findsWidgets);
    expect(find.text('Έλα με ό,τι σε απασχολεί.'), findsOneWidget);
    expect(find.text('Αντίληψη'), findsOneWidget);
    expect(find.text('Ιδιοφυΐα'), findsOneWidget);
    expect(find.text('Το Εσωτερικό Συμβούλιο'), findsNothing);
  });

  testWidgets('landing create account opens register form', (tester) async {
    await tester.pumpWidget(_testApp(_FakeApiClient(_unauthenticated())));
    await tester.pumpAndSettle();

    final createAccountButton = find.text('Begin your first reflection').first;
    await tester.ensureVisible(createAccountButton);
    await tester.tap(createAccountButton);
    await tester.pumpAndSettle();

    expect(find.text('Name'), findsOneWidget);
    expect(find.text('Create account'), findsOneWidget);
    expect(find.text('Use existing account'), findsOneWidget);
  });

  testWidgets('landing sign in opens login form', (tester) async {
    await tester.pumpWidget(_testApp(_FakeApiClient(_unauthenticated())));
    await tester.pumpAndSettle();

    final signIn = find.text('Sign in');
    await tester.ensureVisible(signIn);
    await tester.tap(signIn);
    await tester.pumpAndSettle();

    expect(find.text('Email'), findsOneWidget);
    expect(find.text('Password'), findsOneWidget);
    expect(find.text('Sign in'), findsOneWidget);
  });

  testWidgets('auth screen follows selected landing language', (tester) async {
    await tester.pumpWidget(_testApp(_FakeApiClient(_unauthenticated())));
    await tester.pumpAndSettle();

    await tester.tap(find.text('🇺🇸'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Español').last);
    await tester.pumpAndSettle();
    final signIn = find.text('Iniciar sesión');
    await tester.ensureVisible(signIn);
    await tester.tap(signIn);
    await tester.pumpAndSettle();

    expect(find.text('Supraconscious'), findsWidgets);
    expect(
      find.text('Escribe. Ve con claridad. Elige conscientemente.'),
      findsOneWidget,
    );
    expect(find.text('Correo electrónico'), findsOneWidget);
    expect(find.text('El Consejo Interior'), findsNothing);
  });

  testWidgets('journal tab follows selected auth language after login', (
    tester,
  ) async {
    await tester.pumpWidget(
      _testApp(
        _FakeApiClient(
          _unauthenticated(),
          prompt: _purposeJournalPrompt(),
          loginSession: _ready(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('🇺🇸'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Español').last);
    await tester.pumpAndSettle();
    final signIn = find.text('Iniciar sesión');
    await tester.ensureVisible(signIn);
    await tester.tap(signIn);
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField).at(0), 'carl@example.com');
    await tester.enterText(find.byType(TextField).at(1), 'password');
    final submitButton = find.widgetWithText(FilledButton, 'Iniciar sesión');
    await tester.ensureVisible(submitButton);
    await tester.tap(submitButton);
    await tester.pumpAndSettle();

    await tester.tap(find.text('Diario'));
    await tester.pumpAndSettle();

    expect(find.text('¿A qué te gustaría dar espacio hoy?'), findsOneWidget);
    expect(find.text('Mirror · Mes 7, día 11'), findsOneWidget);
    expect(
      find.text('El alma susurra antes de que hable el destino.'),
      findsOneWidget,
    );
    expect(find.text('The soul whispers before destiny speaks.'), findsNothing);
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
    await _loadObservatoryAsset(tester);
    await tester.pumpAndSettle();

    expect(find.text('Welcome, Carl'), findsOneWidget);
    expect(find.text('Entries'), findsOneWidget);
    expect(find.text('Journal'), findsOneWidget);
  });

  testWidgets('journal tab shows prompt guidance when ready', (tester) async {
    await tester.pumpWidget(_testApp(_FakeApiClient(_ready())));
    await tester.pumpAndSettle();

    await tester.tap(find.byIcon(Icons.edit_note_outlined));
    await tester.pumpAndSettle();

    expect(
      find.text('What would you like to make room for today?'),
      findsOneWidget,
    );
    expect(
      find.text(
        'Write whatever feels present. The Guide may reflect patterns, tensions, and one possible next step.',
      ),
      findsOneWidget,
    );
    expect(find.text('Mirror · Month 7, Day 10'), findsOneWidget);
    expect(find.text('What are you not letting yourself say?'), findsOneWidget);
  });

  testWidgets('journal editor leads preferences at 390px', (tester) async {
    await tester.binding.setSurfaceSize(const Size(390, 844));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    await tester.pumpWidget(_testApp(_FakeApiClient(_ready())));
    await _loadObservatoryAsset(tester);
    await tester.pumpAndSettle();
    await tester.tap(find.byIcon(Icons.edit_note_outlined));
    await tester.pumpAndSettle();

    final editor = tester.getRect(find.byType(TextField).last);
    expect(editor.top, lessThan(844));
    expect(find.text('Gentler handling'), findsNothing);
    await expectLater(
      find.byType(MaterialApp),
      matchesGoldenFile('goldens/observatory-journal-390.png'),
    );
  });

  testWidgets('journal tab works when prompt is unavailable', (tester) async {
    await tester.pumpWidget(
      _testApp(_FakeApiClient(_ready(), prompt: _emptyJournalPrompt())),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Journal'));
    await tester.pumpAndSettle();

    expect(
      find.text('What would you like to make room for today?'),
      findsOneWidget,
    );
    expect(
      find.text(
        'No Mirror prompt is published for today. Write what is present without forcing a structure.',
      ),
      findsOneWidget,
    );
  });

  testWidgets('journal prompt card localizes known Mirror prompt', (
    tester,
  ) async {
    await tester.pumpWidget(
      _testApp(
        _FakeApiClient(_readySpanish(), prompt: _purposeJournalPrompt()),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Diario'));
    await tester.pumpAndSettle();

    expect(find.text('Mirror · Mes 7, día 11'), findsOneWidget);
    expect(
      find.text('El alma susurra antes de que hable el destino.'),
      findsOneWidget,
    );
    expect(find.text('PROPÓSITO'), findsOneWidget);
    expect(find.text('PURPOSE'), findsNothing);
  });

  testWidgets('journal prompt card localizes gift responsibility prompt', (
    tester,
  ) async {
    await tester.pumpWidget(
      _testApp(
        _FakeApiClient(_readySpanish(), prompt: _purposeGiftJournalPrompt()),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Diario'));
    await tester.pumpAndSettle();

    expect(find.text('Mirror · Mes 7, día 12'), findsOneWidget);
    expect(find.text('Todo don conlleva responsabilidad.'), findsOneWidget);
    expect(
      find.text('La conciencia de un don invita a expresarlo.'),
      findsOneWidget,
    );
    expect(find.text('¿Qué don no estás usando plenamente?'), findsOneWidget);
    expect(find.text('Every gift carries responsibility.'), findsNothing);
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
        'reflectionSession': {
          'id': 'reflection-1',
          'dimensions': [
            {
              'id': 'dimension-1',
              'dimension': 'fear',
              'observationText': 'You may be protecting belonging.',
              'tentativeInterpretation': 'A boundary may feel risky.',
            },
          ],
          'corrections': [
            {
              'id': 'correction-1',
              'dimension': 'fear',
              'correctionType': 'correct',
              'note': 'I am protecting recovery time.',
            },
          ],
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
      expect(session.reflectionSession?.dimensions.single.dimension, 'fear');
      expect(
        session.reflectionSession?.corrections.single.note,
        'I am protecting recovery time.',
      );
      expect(session.messages.single.displayName, 'The Protector');
      expect(session.feedback.single.hasNote, true);
      expect(session.embodimentGateResponses.single.text, 'One small shift.');
      expect(
        session.sourceGrounding.selectedSources.single.title,
        'Approved source',
      );
    },
  );

  test('mobile guide parses constant Guide dimensions', () {
    final guide = MobileGuide.fromJson({
      'name': 'Supraconscious Guide',
      'persona': 'constant',
      'progressionOwner': 'user',
      'avatarTone': 'balanced',
      'intensityLevel': 3,
      'frameworkName': 'The Seven Dimensions of the Supraconscious',
      'dimensions': [
        {
          'key': 'perception',
          'name': 'Perception',
          'question': 'What am I noticing?',
          'distinction': 'Concrete present noticing.',
        },
      ],
    });

    expect(guide.name, 'Supraconscious Guide');
    expect(guide.persona, 'constant');
    expect(guide.dimensions.single.name, 'Perception');
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
        'translationKey': 'purpose',
      },
    });

    expect(prompt.todayLabel, 'Friday, July 10');
    expect(prompt.prompt?.theme, 'Clarity');
    expect(prompt.prompt?.translationKey, 'purpose');
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

/// Allows small cross-platform rasterization differences while still failing
/// meaningful composition drift. The golden tests are also paired with
/// semantic and geometry assertions in this suite.
class _TolerantGoldenFileComparator extends LocalFileComparator {
  _TolerantGoldenFileComparator(
    super.testFile, {
    required double precisionTolerance,
  }) : assert(
         0 <= precisionTolerance && precisionTolerance <= 1,
         'precisionTolerance must be between 0 and 1',
       ),
       _precisionTolerance = precisionTolerance;

  final double _precisionTolerance;

  @override
  Future<bool> compare(Uint8List imageBytes, Uri golden) async {
    final result = await GoldenFileComparator.compareLists(
      imageBytes,
      await getGoldenBytes(golden),
    );
    final passed = result.passed || result.diffPercent <= _precisionTolerance;
    final diffPercent = result.diffPercent;
    result.dispose();

    if (!passed) {
      throw TestFailure(
        'Golden "$golden" differed by ${(diffPercent * 100).toStringAsFixed(2)}%, '
        'above the ${(_precisionTolerance * 100).toStringAsFixed(2)}% cross-platform tolerance.',
      );
    }
    return true;
  }
}

Future<void> _loadObservatoryAsset(WidgetTester tester) async {
  final context = tester.element(find.byType(MaterialApp));
  await tester.runAsync(
    () => precacheImage(
      const AssetImage('assets/images/mineral-boundary-v3-portrait.png'),
      context,
    ),
  );
  await tester.pump();
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
  _FakeApiClient(
    this._session, {
    MobileJournalPrompt? prompt,
    this._loginSession,
  }) : _prompt = prompt ?? _journalPrompt(),
       super(baseUrl: 'http://localhost:3000');

  final MobileSession _session;
  final MobileJournalPrompt _prompt;
  final MobileSession? _loginSession;

  @override
  Future<MobileSession> getSession() async => _session;

  @override
  Future<MobileSession> login({
    required String email,
    required String password,
    String? preferredLanguage,
  }) async {
    final session = _loginSession ?? _session;
    return session.copyWithLanguage(preferredLanguage);
  }

  @override
  Future<MobileSession> register({
    required String name,
    required String email,
    required String password,
    String? preferredLanguage,
  }) async {
    final session = _loginSession ?? _session;
    return session.copyWithLanguage(preferredLanguage);
  }

  @override
  Future<MobileDashboard> getDashboard() async => const MobileDashboard(
    greetingName: 'Carl',
    currentLevel: 1,
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
    name: 'Supraconscious Guide',
    persona: 'constant',
    progressionOwner: 'user',
    avatarTone: 'balanced',
    intensityLevel: 3,
    frameworkName: 'The Seven Dimensions of the Supraconscious',
    dimensions: [
      MobileGuideDimension(
        key: 'perception',
        name: 'Perception',
        question: 'What am I noticing?',
        distinction: 'Concrete present noticing.',
      ),
    ],
  );

  @override
  Future<MobileJournalPrompt> getJournalPrompt() async => _prompt;

  @override
  Future<MobileSession> updateLanguagePreference({
    required String preferredLanguage,
  }) async => _session;
}

extension on MobileSession {
  MobileSession copyWithLanguage(String? preferredLanguage) {
    final selectedLanguage = preferredLanguage ?? language.current;
    return MobileSession(
      authenticated: authenticated,
      status: status,
      user: user == null
          ? null
          : MobileUser(
              email: user!.email,
              name: user!.name,
              patternMemoryEnabled: user!.patternMemoryEnabled,
              avatarTone: user!.avatarTone,
              intensityLevel: user!.intensityLevel,
              currentLevel: user!.currentLevel,
              preferredLanguage: selectedLanguage,
            ),
      language: MobileLanguageState(
        current: selectedLanguage,
        supported: language.supported,
      ),
      consent: consent,
    );
  }
}

const _languageState = MobileLanguageState(
  current: 'en',
  supported: [
    MobileSupportedLanguage(
      code: 'en',
      label: 'English',
      nativeLabel: 'English',
      flag: '🇺🇸',
    ),
    MobileSupportedLanguage(
      code: 'es',
      label: 'Spanish',
      nativeLabel: 'Español',
      flag: '🇪🇸',
    ),
    MobileSupportedLanguage(
      code: 'el',
      label: 'Greek',
      nativeLabel: 'Ελληνικά',
      flag: '🇬🇷',
    ),
  ],
);

MobileSession _unauthenticated() {
  return const MobileSession(
    authenticated: false,
    status: 'unauthenticated',
    user: null,
    language: _languageState,
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
      preferredLanguage: 'en',
    ),
    language: _languageState,
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
      preferredLanguage: 'en',
    ),
    language: _languageState,
    consent: MobileConsent(
      version: '2026-06-01',
      hasRequiredConsents: true,
      items: [],
    ),
  );
}

MobileSession _readySpanish() {
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
      preferredLanguage: 'es',
    ),
    language: MobileLanguageState(
      current: 'es',
      supported: [
        MobileSupportedLanguage(
          code: 'en',
          label: 'English',
          nativeLabel: 'English',
          flag: '🇺🇸',
        ),
        MobileSupportedLanguage(
          code: 'es',
          label: 'Spanish',
          nativeLabel: 'Español',
          flag: '🇪🇸',
        ),
      ],
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
      translationKey: null,
    ),
  );
}

MobileJournalPrompt _emptyJournalPrompt() {
  return const MobileJournalPrompt(todayLabel: 'Friday, July 10', prompt: null);
}

MobileJournalPrompt _purposeJournalPrompt() {
  return const MobileJournalPrompt(
    todayLabel: 'Saturday, July 11',
    prompt: MobileThresholdPrompt(
      month: 7,
      day: 11,
      theme: 'PURPOSE',
      quote: 'The soul whispers before destiny speaks.',
      frameOfThought:
          'Purpose rarely arrives as a command. It often begins as a quiet invitation.',
      socraticQuestion: 'What invitation have you been ignoring?',
      translationKey: 'purpose',
    ),
  );
}

MobileJournalPrompt _purposeGiftJournalPrompt() {
  return const MobileJournalPrompt(
    todayLabel: 'Sunday, July 12',
    prompt: MobileThresholdPrompt(
      month: 7,
      day: 12,
      theme: 'PURPOSE',
      quote: 'Every gift carries responsibility.',
      frameOfThought: 'Awareness of a gift invites its expression.',
      socraticQuestion: 'What gift are you not fully using?',
      translationKey: 'purposeGiftResponsibility',
    ),
  );
}
