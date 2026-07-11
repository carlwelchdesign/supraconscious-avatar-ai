import 'dart:ui';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'mobile_api.dart';

const _languagePreferenceKey = 'inner_council_language';

const fallbackSupportedLanguages = [
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
  MobileSupportedLanguage(
    code: 'fr',
    label: 'French',
    nativeLabel: 'Français',
    flag: '🇫🇷',
  ),
  MobileSupportedLanguage(
    code: 'de',
    label: 'German',
    nativeLabel: 'Deutsch',
    flag: '🇩🇪',
  ),
  MobileSupportedLanguage(
    code: 'zh-Hans',
    label: 'Chinese (Simplified)',
    nativeLabel: '简体中文',
    flag: '🇨🇳',
  ),
];

class LocalLanguagePreference {
  const LocalLanguagePreference({
    required this.code,
    required this.hasExplicitPreference,
  });

  final String code;
  final bool hasExplicitPreference;
}

final localLanguageControllerProvider =
    StateNotifierProvider<LocalLanguageController, LocalLanguagePreference>(
      (ref) => LocalLanguageController()..load(),
    );

class LocalLanguageController extends StateNotifier<LocalLanguagePreference> {
  LocalLanguageController()
    : super(
        LocalLanguagePreference(
          code: resolveMobileLanguageCode(
            PlatformDispatcher.instance.locale.toLanguageTag(),
          ),
          hasExplicitPreference: false,
        ),
      );

  Future<void> load() async {
    final prefs = await SharedPreferences.getInstance();
    final stored = prefs.getString(_languagePreferenceKey);
    if (stored == null) return;
    state = LocalLanguagePreference(
      code: resolveMobileLanguageCode(stored),
      hasExplicitPreference: true,
    );
  }

  Future<void> setLanguage(String code) async {
    final resolved = resolveMobileLanguageCode(code);
    state = LocalLanguagePreference(
      code: resolved,
      hasExplicitPreference: true,
    );
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_languagePreferenceKey, resolved);
  }
}

String resolveMobileLanguageCode(String? value) {
  final normalized = (value ?? '').trim().replaceAll('_', '-').toLowerCase();
  if (normalized == 'zh' ||
      normalized == 'zh-hans' ||
      normalized == 'zh-cn' ||
      normalized == 'zh-sg') {
    return 'zh-Hans';
  }

  final primary = normalized.split('-').first;
  return const {'en', 'es', 'el', 'fr', 'de'}.contains(primary)
      ? primary
      : 'en';
}
