import 'dart:async';
import 'dart:convert';
import 'dart:ui';

import 'package:http/http.dart' as http;

class MobileApiException implements Exception {
  MobileApiException(this.message, this.statusCode);

  final String message;
  final int statusCode;

  @override
  String toString() => message;
}

class InnerCouncilApiClient {
  InnerCouncilApiClient({required this.baseUrl, http.Client? httpClient})
    : _httpClient = httpClient ?? http.Client();

  final String baseUrl;
  final http.Client _httpClient;
  final Map<String, String> _cookies = {};

  Future<MobileSession> getSession() async {
    final json = await _send('GET', '/api/mobile/session');
    return MobileSession.fromJson(json);
  }

  Future<MobileSession> login({
    required String email,
    required String password,
    String? preferredLanguage,
  }) async {
    final json = await _send(
      'POST',
      '/api/mobile/auth/login',
      body: {
        'email': email,
        'password': password,
        'preferredLanguage': preferredLanguage ?? _currentLanguageCode(),
      },
    );
    return MobileSession.fromJson(json);
  }

  Future<MobileSession> register({
    required String name,
    required String email,
    required String password,
    String? preferredLanguage,
  }) async {
    final json = await _send(
      'POST',
      '/api/mobile/auth/register',
      body: {
        'name': name,
        'email': email,
        'password': password,
        'preferredLanguage': preferredLanguage ?? _currentLanguageCode(),
      },
    );
    return MobileSession.fromJson(json);
  }

  Future<MobileSession> loginWithOAuth({
    required String provider,
    required String idToken,
    String? preferredLanguage,
  }) async {
    final json = await _send(
      'POST',
      '/api/mobile/auth/oauth',
      body: {
        'provider': provider,
        'idToken': idToken,
        'preferredLanguage': preferredLanguage ?? _currentLanguageCode(),
      },
    );
    return MobileSession.fromJson(json);
  }

  Future<MobilePasskeyChallenge> startPasskeyMfa() async {
    final json = await _send(
      'POST',
      '/api/auth/passkeys/authenticate/options',
    );
    return MobilePasskeyChallenge.fromJson(json);
  }

  Future<MobileSession> completePasskeyMfa({
    required String challengeToken,
    required Map<String, dynamic> response,
  }) async {
    await _send(
      'POST',
      '/api/auth/passkeys/authenticate/verify',
      body: {'challengeToken': challengeToken, 'response': response},
    );
    return getSession();
  }

  Future<MobileSession> acceptConsent({
    required bool patternMemoryGranted,
  }) async {
    final json = await _send(
      'POST',
      '/api/mobile/onboarding/consent',
      body: {'patternMemoryGranted': patternMemoryGranted},
    );
    return MobileSession.fromJson(json);
  }

  Future<MobileSession> updateReflectionPreferences({
    required bool patternMemoryEnabled,
  }) async {
    final json = await _send(
      'PATCH',
      '/api/mobile/settings/reflection-preferences',
      body: {'patternMemoryEnabled': patternMemoryEnabled},
    );
    return MobileSession.fromJson(json);
  }

  Future<MobileSession> updateLanguagePreference({
    required String preferredLanguage,
  }) async {
    final json = await _send(
      'PATCH',
      '/api/mobile/settings/language',
      body: {'preferredLanguage': preferredLanguage},
    );
    return MobileSession.fromJson(json);
  }

  Future<MobileDashboard> getDashboard() async {
    final json = await _send('GET', '/api/mobile/dashboard');
    return MobileDashboard.fromJson(
      json['dashboard'] as Map<String, dynamic>? ?? const {},
    );
  }

  Future<List<MobileSavedSessionSummary>> getSavedSessions() async {
    final json = await _send('GET', '/api/mobile/saved-sessions');
    final sessions = json['sessions'];
    return sessions is List
        ? sessions
              .whereType<Map<String, dynamic>>()
              .map(MobileSavedSessionSummary.fromJson)
              .toList()
        : const [];
  }

  Future<MobileSavedSessionDetail> getSavedSession(String sessionId) async {
    final json = await _send('GET', '/api/mobile/saved-sessions/$sessionId');
    return MobileSavedSessionDetail.fromJson(
      json['session'] as Map<String, dynamic>? ?? const {},
    );
  }

  Future<List<MobilePattern>> getPatterns() async {
    final json = await _send('GET', '/api/mobile/patterns');
    final patterns = json['patterns'];
    return patterns is List
        ? patterns
              .whereType<Map<String, dynamic>>()
              .map(MobilePattern.fromJson)
              .toList()
        : const [];
  }

  Future<MobileGuide> getGuide() async {
    final json = await _send('GET', '/api/mobile/guide');
    return MobileGuide.fromJson(
      json['guide'] as Map<String, dynamic>? ?? const {},
    );
  }

  Future<MobileJournalPrompt> getJournalPrompt() async {
    final json = await _send('GET', '/api/mobile/journal/prompt');
    return MobileJournalPrompt.fromJson(json);
  }

  Future<void> submitPatternFeedback({
    required String patternMemoryId,
    required String feedbackType,
  }) async {
    await _send(
      'POST',
      '/api/mobile/patterns',
      body: {'patternMemoryId': patternMemoryId, 'feedbackType': feedbackType},
    );
  }

  Future<void> logout() async {
    await _send('POST', '/api/mobile/auth/logout');
    _cookies.clear();
  }

  Future<JournalAnalyzeResult> analyzeJournal(String text) async {
    final json = await _send(
      'POST',
      '/api/journal/analyze',
      body: {'text': text, 'inputMode': 'text'},
    );
    return JournalAnalyzeResult.fromJson(json);
  }

  Future<Map<String, dynamic>> submitFeedback({
    required String councilSessionId,
    required String feedbackType,
    String? note,
  }) {
    return _send(
      'POST',
      '/api/council/feedback',
      body: {
        'councilSessionId': councilSessionId,
        'feedbackType': feedbackType,
        if (note != null && note.trim().isNotEmpty) 'note': note.trim(),
      },
    );
  }

  Future<Map<String, dynamic>> saveEmbodiment({
    required String councilSessionId,
    required String text,
  }) {
    return _send(
      'POST',
      '/api/council/embodiment',
      body: {'councilSessionId': councilSessionId, 'text': text},
    );
  }

  Future<Map<String, dynamic>> _send(
    String method,
    String path, {
    Map<String, dynamic>? body,
  }) async {
    final uri = Uri.parse(baseUrl).resolve(path);
    final request = http.Request(method, uri)
      ..headers['Accept'] = 'application/json';
    request.headers['Accept-Language'] = _currentLanguageCode();

    if (_cookies.isNotEmpty) {
      request.headers['Cookie'] = _cookies.entries
          .map((entry) => '${entry.key}=${entry.value}')
          .join('; ');
    }

    if (body != null) {
      request.headers['Content-Type'] = 'application/json';
      request.body = jsonEncode(body);
    }

    late http.Response response;
    try {
      final streamed = await _httpClient
          .send(request)
          .timeout(const Duration(seconds: 30));
      response = await http.Response.fromStream(streamed);
      _storeCookies(response.headers['set-cookie']);
    } on TimeoutException {
      throw MobileApiException(
        'Could not reach the backend at $baseUrl. Start the web app and try again.',
        0,
      );
    } on http.ClientException catch (error) {
      throw MobileApiException(
        'Could not reach the backend at $baseUrl. Start the web app and check the mobile preview URL. ${error.message}',
        0,
      );
    }

    final decoded = response.body.isEmpty
        ? <String, dynamic>{}
        : jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode < 200 || response.statusCode >= 300) {
      final error = decoded['error'];
      throw MobileApiException(
        error is String ? error : 'Request failed.',
        response.statusCode,
      );
    }

    return decoded;
  }

  void _storeCookies(String? header) {
    if (header == null || header.isEmpty) return;
    for (final part in header.split(',')) {
      final cookie = part.split(';').first.trim();
      final separator = cookie.indexOf('=');
      if (separator <= 0) continue;
      _cookies[cookie.substring(0, separator)] = cookie.substring(
        separator + 1,
      );
    }
  }

  String _currentLanguageCode() {
    final locale = PlatformDispatcher.instance.locale;
    final code = locale.languageCode.toLowerCase();
    final script = locale.scriptCode?.toLowerCase();
    final country = locale.countryCode?.toLowerCase();

    if (code == 'zh' &&
        (script == null ||
            script == 'hans' ||
            country == 'cn' ||
            country == 'sg')) {
      return 'zh-Hans';
    }

    return const {'en', 'es', 'el', 'fr', 'de'}.contains(code) ? code : 'en';
  }
}

class MobileSession {
  const MobileSession({
    required this.authenticated,
    required this.status,
    required this.user,
    required this.language,
    required this.consent,
  });

  final bool authenticated;
  final String status;
  final MobileUser? user;
  final MobileLanguageState language;
  final MobileConsent consent;

  bool get isUnauthenticated => status == 'unauthenticated';
  bool get needsMfa => status == 'mfa_required';
  bool get needsOnboarding => status == 'onboarding_required';
  bool get isReady => status == 'ready';

  factory MobileSession.fromJson(Map<String, dynamic> json) {
    final userJson = json['user'];
    return MobileSession(
      authenticated: json['authenticated'] == true,
      status: json['status'] as String? ?? 'unauthenticated',
      user: userJson is Map<String, dynamic>
          ? MobileUser.fromJson(userJson)
          : null,
      language: MobileLanguageState.fromJson(
        json['language'] as Map<String, dynamic>? ?? const {},
      ),
      consent: MobileConsent.fromJson(
        json['consent'] as Map<String, dynamic>? ?? const {},
      ),
    );
  }
}

class MobilePasskeyChallenge {
  const MobilePasskeyChallenge({
    required this.challengeToken,
    required this.options,
  });

  final String challengeToken;
  final Map<String, dynamic> options;

  factory MobilePasskeyChallenge.fromJson(Map<String, dynamic> json) {
    return MobilePasskeyChallenge(
      challengeToken: json['challengeToken'] as String? ?? '',
      options: json['options'] as Map<String, dynamic>? ?? const {},
    );
  }
}

class MobileUser {
  const MobileUser({
    required this.email,
    required this.name,
    required this.patternMemoryEnabled,
    required this.avatarTone,
    required this.intensityLevel,
    required this.currentLevel,
    required this.avatarStage,
    required this.preferredLanguage,
  });

  final String email;
  final String? name;
  final bool patternMemoryEnabled;
  final String avatarTone;
  final int intensityLevel;
  final int currentLevel;
  final int avatarStage;
  final String preferredLanguage;

  factory MobileUser.fromJson(Map<String, dynamic> json) {
    return MobileUser(
      email: json['email'] as String? ?? '',
      name: json['name'] as String?,
      patternMemoryEnabled: json['patternMemoryEnabled'] == true,
      avatarTone: json['avatarTone'] as String? ?? 'balanced',
      intensityLevel: json['intensityLevel'] as int? ?? 3,
      currentLevel: json['currentLevel'] as int? ?? 1,
      avatarStage: json['avatarStage'] as int? ?? 1,
      preferredLanguage: json['preferredLanguage'] as String? ?? 'en',
    );
  }
}

class MobileLanguageState {
  const MobileLanguageState({
    required this.current,
    required this.supported,
  });

  final String current;
  final List<MobileSupportedLanguage> supported;

  factory MobileLanguageState.fromJson(Map<String, dynamic> json) {
    final supported = json['supported'];
    return MobileLanguageState(
      current: json['current'] as String? ?? 'en',
      supported: supported is List
          ? supported
                .whereType<Map<String, dynamic>>()
                .map(MobileSupportedLanguage.fromJson)
                .toList()
          : const [
              MobileSupportedLanguage(
                code: 'en',
                label: 'English',
                nativeLabel: 'English',
                flag: '🇺🇸',
              ),
            ],
    );
  }
}

class MobileSupportedLanguage {
  const MobileSupportedLanguage({
    required this.code,
    required this.label,
    required this.nativeLabel,
    required this.flag,
  });

  final String code;
  final String label;
  final String nativeLabel;
  final String flag;

  factory MobileSupportedLanguage.fromJson(Map<String, dynamic> json) {
    return MobileSupportedLanguage(
      code: json['code'] as String? ?? 'en',
      label: json['label'] as String? ?? 'English',
      nativeLabel: json['nativeLabel'] as String? ?? 'English',
      flag: json['flag'] as String? ?? '🌐',
    );
  }
}

class MobileConsent {
  const MobileConsent({
    required this.version,
    required this.hasRequiredConsents,
    required this.items,
  });

  final String version;
  final bool hasRequiredConsents;
  final List<MobileConsentItem> items;

  factory MobileConsent.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'];
    return MobileConsent(
      version: json['version'] as String? ?? '',
      hasRequiredConsents: json['hasRequiredConsents'] == true,
      items: rawItems is List
          ? rawItems
                .whereType<Map<String, dynamic>>()
                .map(MobileConsentItem.fromJson)
                .toList()
          : const [],
    );
  }
}

class MobileConsentItem {
  const MobileConsentItem({
    required this.type,
    required this.label,
    required this.required,
    required this.granted,
  });

  final String type;
  final String label;
  final bool required;
  final bool granted;

  factory MobileConsentItem.fromJson(Map<String, dynamic> json) {
    return MobileConsentItem(
      type: json['type'] as String? ?? '',
      label: json['label'] as String? ?? '',
      required: json['required'] == true,
      granted: json['granted'] == true,
    );
  }
}

class JournalAnalyzeResult {
  const JournalAnalyzeResult({
    required this.summary,
    required this.integrationStep,
    required this.integratorQuestion,
    required this.councilSessionId,
    required this.openingLine,
    required this.mirror,
    required this.patternName,
    required this.contradiction,
    required this.closingLine,
  });

  final String summary;
  final String integrationStep;
  final String integratorQuestion;
  final String? councilSessionId;
  final String openingLine;
  final String mirror;
  final String patternName;
  final String contradiction;
  final String closingLine;

  factory JournalAnalyzeResult.fromJson(Map<String, dynamic> json) {
    final analysis = json['analysis'];
    final response = json['avatarResponse'];
    final session = json['councilSession'];
    final synthesis = session is Map<String, dynamic>
        ? session['synthesis']
        : null;
    return JournalAnalyzeResult(
      summary: analysis is Map<String, dynamic>
          ? analysis['summary'] as String? ?? ''
          : '',
      integrationStep: synthesis is Map<String, dynamic>
          ? synthesis['integrationStep'] as String? ?? ''
          : response is Map<String, dynamic>
          ? response['integrationStep'] as String? ?? ''
          : '',
      integratorQuestion: synthesis is Map<String, dynamic>
          ? synthesis['integratorQuestion'] as String? ?? ''
          : response is Map<String, dynamic>
          ? response['socraticQuestion'] as String? ?? ''
          : '',
      councilSessionId: session is Map<String, dynamic>
          ? session['id'] as String?
          : null,
      openingLine: response is Map<String, dynamic>
          ? response['openingLine'] as String? ?? ''
          : '',
      mirror: response is Map<String, dynamic>
          ? response['mirror'] as String? ?? ''
          : '',
      patternName: response is Map<String, dynamic>
          ? response['patternName'] as String? ?? ''
          : '',
      contradiction: response is Map<String, dynamic>
          ? response['contradiction'] as String? ?? ''
          : '',
      closingLine: response is Map<String, dynamic>
          ? response['closingLine'] as String? ?? ''
          : '',
    );
  }
}

class MobileDashboard {
  const MobileDashboard({
    required this.greetingName,
    required this.currentLevel,
    required this.avatarStage,
    required this.patternMemoryEnabled,
    required this.entryCount,
    required this.activePatternCount,
    required this.recentSessions,
  });

  final String? greetingName;
  final int currentLevel;
  final int avatarStage;
  final bool patternMemoryEnabled;
  final int entryCount;
  final int activePatternCount;
  final List<MobileSavedSessionSummary> recentSessions;

  factory MobileDashboard.fromJson(Map<String, dynamic> json) {
    final sessions = json['recentSessions'];
    return MobileDashboard(
      greetingName: json['greetingName'] as String?,
      currentLevel: json['currentLevel'] as int? ?? 1,
      avatarStage: json['avatarStage'] as int? ?? 1,
      patternMemoryEnabled: json['patternMemoryEnabled'] == true,
      entryCount: json['entryCount'] as int? ?? 0,
      activePatternCount: json['activePatternCount'] as int? ?? 0,
      recentSessions: sessions is List
          ? sessions
                .whereType<Map<String, dynamic>>()
                .map(MobileSavedSessionSummary.fromJson)
                .toList()
          : const [],
    );
  }
}

class MobileSavedSessionSummary {
  const MobileSavedSessionSummary({
    required this.id,
    required this.status,
    required this.sourceMode,
    required this.createdAt,
    required this.journalEntry,
    required this.synthesis,
    required this.hasFeedback,
    required this.hasEmbodiment,
  });

  final String id;
  final String status;
  final String sourceMode;
  final String createdAt;
  final MobileJournalEntrySummary journalEntry;
  final MobileSessionSynthesis? synthesis;
  final bool hasFeedback;
  final bool hasEmbodiment;

  factory MobileSavedSessionSummary.fromJson(Map<String, dynamic> json) {
    return MobileSavedSessionSummary(
      id: json['id'] as String? ?? '',
      status: json['status'] as String? ?? '',
      sourceMode: json['sourceMode'] as String? ?? '',
      createdAt: json['createdAt'] as String? ?? '',
      journalEntry: MobileJournalEntrySummary.fromJson(
        json['journalEntry'] as Map<String, dynamic>? ?? const {},
      ),
      synthesis: json['synthesis'] is Map<String, dynamic>
          ? MobileSessionSynthesis.fromJson(
              json['synthesis'] as Map<String, dynamic>,
            )
          : null,
      hasFeedback: json['hasFeedback'] == true,
      hasEmbodiment: json['hasEmbodiment'] == true,
    );
  }
}

class MobileJournalEntrySummary {
  const MobileJournalEntrySummary({
    required this.id,
    required this.excerpt,
    required this.inputMode,
    required this.createdAt,
  });

  final String id;
  final String excerpt;
  final String inputMode;
  final String createdAt;

  factory MobileJournalEntrySummary.fromJson(Map<String, dynamic> json) {
    return MobileJournalEntrySummary(
      id: json['id'] as String? ?? '',
      excerpt: json['excerpt'] as String? ?? '',
      inputMode: json['inputMode'] as String? ?? 'text',
      createdAt: json['createdAt'] as String? ?? '',
    );
  }
}

class MobileSessionSynthesis {
  const MobileSessionSynthesis({
    required this.integratorQuestion,
    required this.integrationStep,
  });

  final String integratorQuestion;
  final String integrationStep;

  factory MobileSessionSynthesis.fromJson(Map<String, dynamic> json) {
    return MobileSessionSynthesis(
      integratorQuestion: json['integratorQuestion'] as String? ?? '',
      integrationStep: json['integrationStep'] as String? ?? '',
    );
  }
}

class MobileSavedSessionDetail {
  const MobileSavedSessionDetail({
    required this.id,
    required this.sourceMode,
    required this.journalText,
    required this.avatarResponse,
    required this.messages,
    required this.synthesis,
    required this.feedback,
    required this.embodimentGateResponses,
    required this.sourceGrounding,
  });

  final String id;
  final String sourceMode;
  final String journalText;
  final MobileAvatarResponse? avatarResponse;
  final List<MobileCouncilMessage> messages;
  final MobileSessionSynthesis? synthesis;
  final List<MobileFeedbackSummary> feedback;
  final List<MobileEmbodimentResponse> embodimentGateResponses;
  final MobileSourceGrounding sourceGrounding;

  factory MobileSavedSessionDetail.fromJson(Map<String, dynamic> json) {
    final journalEntry = json['journalEntry'];
    final messages = json['messages'];
    final feedback = json['feedback'];
    final embodiment = json['embodimentGateResponses'];
    return MobileSavedSessionDetail(
      id: json['id'] as String? ?? '',
      sourceMode: json['sourceMode'] as String? ?? 'none',
      journalText: journalEntry is Map<String, dynamic>
          ? journalEntry['text'] as String? ?? ''
          : '',
      avatarResponse: json['avatarResponse'] is Map<String, dynamic>
          ? MobileAvatarResponse.fromJson(
              json['avatarResponse'] as Map<String, dynamic>,
            )
          : null,
      messages: messages is List
          ? messages
                .whereType<Map<String, dynamic>>()
                .map(MobileCouncilMessage.fromJson)
                .toList()
          : const [],
      synthesis: json['synthesis'] is Map<String, dynamic>
          ? MobileSessionSynthesis.fromJson(
              json['synthesis'] as Map<String, dynamic>,
            )
          : null,
      feedback: feedback is List
          ? feedback
                .whereType<Map<String, dynamic>>()
                .map(MobileFeedbackSummary.fromJson)
                .toList()
          : const [],
      embodimentGateResponses: embodiment is List
          ? embodiment
                .whereType<Map<String, dynamic>>()
                .map(MobileEmbodimentResponse.fromJson)
                .toList()
          : const [],
      sourceGrounding: MobileSourceGrounding.fromJson(
        json['sourceGrounding'] as Map<String, dynamic>? ?? const {},
      ),
    );
  }
}

class MobileAvatarResponse {
  const MobileAvatarResponse({
    required this.openingLine,
    required this.mirror,
    required this.patternName,
    required this.contradiction,
    required this.socraticQuestion,
    required this.integrationStep,
    required this.closingLine,
  });

  final String openingLine;
  final String mirror;
  final String patternName;
  final String contradiction;
  final String socraticQuestion;
  final String integrationStep;
  final String closingLine;

  factory MobileAvatarResponse.fromJson(Map<String, dynamic> json) {
    return MobileAvatarResponse(
      openingLine: json['openingLine'] as String? ?? '',
      mirror: json['mirror'] as String? ?? '',
      patternName: json['patternName'] as String? ?? '',
      contradiction: json['contradiction'] as String? ?? '',
      socraticQuestion: json['socraticQuestion'] as String? ?? '',
      integrationStep: json['integrationStep'] as String? ?? '',
      closingLine: json['closingLine'] as String? ?? '',
    );
  }
}

class MobileCouncilMessage {
  const MobileCouncilMessage({
    required this.displayName,
    required this.content,
    required this.abstained,
  });

  final String displayName;
  final String content;
  final bool abstained;

  factory MobileCouncilMessage.fromJson(Map<String, dynamic> json) {
    return MobileCouncilMessage(
      displayName: json['displayName'] as String? ?? '',
      content: json['content'] as String? ?? '',
      abstained: json['abstained'] == true,
    );
  }
}

class MobileFeedbackSummary {
  const MobileFeedbackSummary({
    required this.id,
    required this.feedbackType,
    required this.hasNote,
  });

  final String id;
  final String feedbackType;
  final bool hasNote;

  factory MobileFeedbackSummary.fromJson(Map<String, dynamic> json) {
    return MobileFeedbackSummary(
      id: json['id'] as String? ?? '',
      feedbackType: json['feedbackType'] as String? ?? '',
      hasNote: json['hasNote'] == true,
    );
  }
}

class MobileEmbodimentResponse {
  const MobileEmbodimentResponse({required this.id, required this.text});

  final String id;
  final String text;

  factory MobileEmbodimentResponse.fromJson(Map<String, dynamic> json) {
    return MobileEmbodimentResponse(
      id: json['id'] as String? ?? '',
      text: json['text'] as String? ?? '',
    );
  }
}

class MobileSourceGrounding {
  const MobileSourceGrounding({
    required this.mode,
    required this.message,
    required this.selectedSources,
  });

  final String mode;
  final String message;
  final List<MobileSourceSummary> selectedSources;

  factory MobileSourceGrounding.fromJson(Map<String, dynamic> json) {
    final sources = json['selectedSources'];
    return MobileSourceGrounding(
      mode: json['mode'] as String? ?? 'none',
      message: json['message'] as String? ?? '',
      selectedSources: sources is List
          ? sources
                .whereType<Map<String, dynamic>>()
                .map(MobileSourceSummary.fromJson)
                .toList()
          : const [],
    );
  }
}

class MobileSourceSummary {
  const MobileSourceSummary({
    required this.id,
    required this.title,
    required this.rank,
    required this.displayExcerpt,
    required this.matchedTerms,
  });

  final String id;
  final String title;
  final int rank;
  final String? displayExcerpt;
  final List<String> matchedTerms;

  factory MobileSourceSummary.fromJson(Map<String, dynamic> json) {
    final terms = json['matchedTerms'];
    return MobileSourceSummary(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? 'Approved source',
      rank: json['rank'] as int? ?? 0,
      displayExcerpt: json['displayExcerpt'] as String?,
      matchedTerms: terms is List
          ? terms.map((term) => '$term').toList()
          : const [],
    );
  }
}

class MobilePattern {
  const MobilePattern({
    required this.id,
    required this.patternLabel,
    required this.evidenceCount,
    required this.confidence,
    required this.examples,
    required this.lastSeenAt,
    required this.active,
  });

  final String id;
  final String patternLabel;
  final int evidenceCount;
  final double confidence;
  final List<String> examples;
  final String lastSeenAt;
  final bool active;

  factory MobilePattern.fromJson(Map<String, dynamic> json) {
    final examples = json['examples'];
    return MobilePattern(
      id: json['id'] as String? ?? '',
      patternLabel: json['patternLabel'] as String? ?? '',
      evidenceCount: json['evidenceCount'] as int? ?? 0,
      confidence: (json['confidence'] as num?)?.toDouble() ?? 0,
      examples: examples is List
          ? examples.map((item) => '$item').toList()
          : const [],
      lastSeenAt: json['lastSeenAt'] as String? ?? '',
      active: json['active'] == true,
    );
  }
}

class MobileGuide {
  const MobileGuide({
    required this.currentStage,
    required this.avatarTone,
    required this.intensityLevel,
    required this.stages,
  });

  final int currentStage;
  final String avatarTone;
  final int intensityLevel;
  final List<MobileGuideStage> stages;

  factory MobileGuide.fromJson(Map<String, dynamic> json) {
    final stages = json['stages'];
    return MobileGuide(
      currentStage: json['currentStage'] as int? ?? 1,
      avatarTone: json['avatarTone'] as String? ?? 'balanced',
      intensityLevel: json['intensityLevel'] as int? ?? 3,
      stages: stages is List
          ? stages
                .whereType<Map<String, dynamic>>()
                .map(MobileGuideStage.fromJson)
                .toList()
          : const [],
    );
  }
}

class MobileGuideStage {
  const MobileGuideStage({
    required this.stage,
    required this.name,
    required this.description,
    required this.trait,
    required this.currentLabel,
    required this.completedLabel,
    required this.state,
  });

  final int stage;
  final String name;
  final String description;
  final String trait;
  final String currentLabel;
  final String completedLabel;
  final String state;

  factory MobileGuideStage.fromJson(Map<String, dynamic> json) {
    return MobileGuideStage(
      stage: json['stage'] as int? ?? 1,
      name: json['name'] as String? ?? '',
      description: json['description'] as String? ?? '',
      trait: json['trait'] as String? ?? '',
      currentLabel: json['currentLabel'] as String? ?? 'Current',
      completedLabel: json['completedLabel'] as String? ?? 'Complete',
      state: json['state'] as String? ?? 'locked',
    );
  }
}

class MobileJournalPrompt {
  const MobileJournalPrompt({required this.todayLabel, required this.prompt});

  final String todayLabel;
  final MobileThresholdPrompt? prompt;

  factory MobileJournalPrompt.fromJson(Map<String, dynamic> json) {
    final promptJson = json['prompt'];
    return MobileJournalPrompt(
      todayLabel: json['todayLabel'] as String? ?? '',
      prompt: promptJson is Map<String, dynamic>
          ? MobileThresholdPrompt.fromJson(promptJson)
          : null,
    );
  }
}

class MobileThresholdPrompt {
  const MobileThresholdPrompt({
    required this.month,
    required this.day,
    required this.theme,
    required this.quote,
    required this.frameOfThought,
    required this.socraticQuestion,
  });

  final int month;
  final int day;
  final String theme;
  final String? quote;
  final String frameOfThought;
  final String socraticQuestion;

  factory MobileThresholdPrompt.fromJson(Map<String, dynamic> json) {
    return MobileThresholdPrompt(
      month: json['month'] as int? ?? 0,
      day: json['day'] as int? ?? 0,
      theme: json['theme'] as String? ?? '',
      quote: json['quote'] as String?,
      frameOfThought: json['frameOfThought'] as String? ?? '',
      socraticQuestion: json['socraticQuestion'] as String? ?? '',
    );
  }
}
