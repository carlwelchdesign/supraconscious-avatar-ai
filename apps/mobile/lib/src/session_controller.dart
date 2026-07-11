import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'mobile_api.dart';

const _configuredApiBaseUrl = String.fromEnvironment(
  'INNER_COUNCIL_API_BASE_URL',
  defaultValue: '',
);

String get apiBaseUrl {
  if (_configuredApiBaseUrl.isNotEmpty) return _configuredApiBaseUrl;
  if (Platform.isAndroid) return 'http://10.0.2.2:3000';
  return 'http://localhost:3000';
}

final apiClientProvider = Provider<InnerCouncilApiClient>((ref) {
  return InnerCouncilApiClient(baseUrl: apiBaseUrl);
});

final sessionControllerProvider =
    StateNotifierProvider<SessionController, AsyncValue<MobileSession>>((ref) {
      return SessionController(ref.watch(apiClientProvider))..load();
    });

final dashboardProvider = FutureProvider<MobileDashboard>((ref) {
  return ref.watch(apiClientProvider).getDashboard();
});

final savedSessionsProvider = FutureProvider<List<MobileSavedSessionSummary>>((
  ref,
) {
  return ref.watch(apiClientProvider).getSavedSessions();
});

final patternsProvider = FutureProvider<List<MobilePattern>>((ref) {
  return ref.watch(apiClientProvider).getPatterns();
});

final guideProvider = FutureProvider<MobileGuide>((ref) {
  return ref.watch(apiClientProvider).getGuide();
});

final journalPromptProvider = FutureProvider<MobileJournalPrompt>((ref) {
  return ref.watch(apiClientProvider).getJournalPrompt();
});

class SessionController extends StateNotifier<AsyncValue<MobileSession>> {
  SessionController(this._apiClient) : super(const AsyncValue.loading());

  final InnerCouncilApiClient _apiClient;

  Future<void> load() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(_apiClient.getSession);
  }

  Future<void> login(String email, String password) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => _apiClient.login(email: email, password: password),
    );
  }

  Future<void> register(String name, String email, String password) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => _apiClient.register(name: name, email: email, password: password),
    );
  }

  Future<void> acceptConsent({required bool patternMemoryGranted}) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () =>
          _apiClient.acceptConsent(patternMemoryGranted: patternMemoryGranted),
    );
  }

  Future<void> updateReflectionPreferences({
    required bool patternMemoryEnabled,
  }) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(
      () => _apiClient.updateReflectionPreferences(
        patternMemoryEnabled: patternMemoryEnabled,
      ),
    );
  }

  Future<void> logout() async {
    await _apiClient.logout();
    await load();
  }
}
