import 'dart:async';
import 'dart:convert';

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
  }) async {
    final json = await _send(
      'POST',
      '/api/mobile/auth/login',
      body: {'email': email, 'password': password},
    );
    return MobileSession.fromJson(json);
  }

  Future<MobileSession> register({
    required String name,
    required String email,
    required String password,
  }) async {
    final json = await _send(
      'POST',
      '/api/mobile/auth/register',
      body: {'name': name, 'email': email, 'password': password},
    );
    return MobileSession.fromJson(json);
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

    if (_cookies.isNotEmpty) {
      request.headers['Cookie'] = _cookies.entries
          .map((entry) => '${entry.key}=${entry.value}')
          .join('; ');
    }

    if (body != null) {
      request.headers['Content-Type'] = 'application/json';
      request.body = jsonEncode(body);
    }

    final streamed = await _httpClient
        .send(request)
        .timeout(const Duration(seconds: 30));
    final response = await http.Response.fromStream(streamed);
    _storeCookies(response.headers['set-cookie']);

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
}

class MobileSession {
  const MobileSession({
    required this.authenticated,
    required this.status,
    required this.user,
    required this.consent,
  });

  final bool authenticated;
  final String status;
  final MobileUser? user;
  final MobileConsent consent;

  bool get isUnauthenticated => status == 'unauthenticated';
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
      consent: MobileConsent.fromJson(
        json['consent'] as Map<String, dynamic>? ?? const {},
      ),
    );
  }
}

class MobileUser {
  const MobileUser({
    required this.email,
    required this.name,
    required this.patternMemoryEnabled,
  });

  final String email;
  final String? name;
  final bool patternMemoryEnabled;

  factory MobileUser.fromJson(Map<String, dynamic> json) {
    return MobileUser(
      email: json['email'] as String? ?? '',
      name: json['name'] as String?,
      patternMemoryEnabled: json['patternMemoryEnabled'] == true,
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
  });

  final String summary;
  final String integrationStep;
  final String integratorQuestion;
  final String? councilSessionId;

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
    );
  }
}
