import 'dart:convert';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:inner_council_mobile/l10n/app_localizations.dart';
import 'package:inner_council_mobile/src/local_language_controller.dart';

const expectedProductLocaleTags = {'de', 'el', 'en', 'es', 'fr', 'zh-Hans'};

const expectedCatalogLocaleTags = {
  'de',
  'el',
  'en',
  'es',
  'fr',
  'zh',
  'zh-Hans',
};

const arbFilesByLocale = {
  'de': 'app_de.arb',
  'el': 'app_el.arb',
  'en': 'app_en.arb',
  'es': 'app_es.arb',
  'fr': 'app_fr.arb',
  'zh': 'app_zh.arb',
  'zh-Hans': 'app_zh_Hans.arb',
};

void main() {
  test('every supported locale has a complete non-empty ARB catalog', () {
    final template = _readArb('app_en.arb');
    final templateKeys = _messageKeys(template);

    expect(arbFilesByLocale.keys, unorderedEquals(expectedCatalogLocaleTags));

    for (final entry in arbFilesByLocale.entries) {
      final catalog = _readArb(entry.value);
      final catalogKeys = _messageKeys(catalog);

      expect(
        catalogKeys,
        unorderedEquals(templateKeys),
        reason: '${entry.key} must match the English message contract',
      );
      for (final key in templateKeys) {
        expect(catalog[key], isA<String>(), reason: '${entry.key}.$key');
        expect(
          (catalog[key] as String).trim(),
          isNotEmpty,
          reason: '${entry.key}.$key must not be blank',
        );
      }
    }
  });

  test('Flutter keeps its Chinese fallback separate from product locales', () {
    final generatedLocales = AppLocalizations.supportedLocales
        .map((locale) => locale.toLanguageTag())
        .toSet();
    final selectorLocales = fallbackSupportedLanguages
        .map((language) => language.code)
        .toSet();

    expect(generatedLocales, unorderedEquals(expectedCatalogLocaleTags));
    expect(selectorLocales, unorderedEquals(expectedProductLocaleTags));
    expect(resolveMobileLanguageCode('de-DE'), 'de');
    expect(resolveMobileLanguageCode('el_GR'), 'el');
    expect(resolveMobileLanguageCode('fr-CA'), 'fr');
    expect(resolveMobileLanguageCode('zh_CN'), 'zh-Hans');
    expect(resolveMobileLanguageCode('zh-SG'), 'zh-Hans');
    expect(resolveMobileLanguageCode('unsupported'), 'en');
  });

  test(
    'Android declares every product locale for per-app language settings',
    () {
      final manifest = File(
        'android/app/src/main/AndroidManifest.xml',
      ).readAsStringSync();
      final localeConfig = File(
        'android/app/src/main/res/xml/locales_config.xml',
      ).readAsStringSync();
      final declaredLocales = RegExp(
        r'<locale android:name="([^"]+)"\s*/>',
      ).allMatches(localeConfig).map((match) => match.group(1)!).toSet();

      expect(manifest, contains('android:localeConfig="@xml/locales_config"'));
      expect(declaredLocales, unorderedEquals(expectedProductLocaleTags));
    },
  );

  test('iOS declares every Flutter locale in bundle and project metadata', () {
    final infoPlist = File('ios/Runner/Info.plist').readAsStringSync();
    final project = File(
      'ios/Runner.xcodeproj/project.pbxproj',
    ).readAsStringSync();
    final localizationArray = RegExp(
      r'<key>CFBundleLocalizations</key>\s*<array>(.*?)</array>',
      dotAll: true,
    ).firstMatch(infoPlist);
    final bundleLocales = RegExp(r'<string>([^<]+)</string>')
        .allMatches(localizationArray?.group(1) ?? '')
        .map((match) => match.group(1)!)
        .toSet();
    final knownRegionsBlock = RegExp(
      r'knownRegions = \((.*?)\);',
      dotAll: true,
    ).firstMatch(project);
    final knownRegions = (knownRegionsBlock?.group(1) ?? '')
        .split(',')
        .map((value) => value.trim().replaceAll('"', ''))
        .where((value) => value.isNotEmpty && value != 'Base')
        .toSet();

    expect(localizationArray, isNotNull);
    expect(bundleLocales, unorderedEquals(expectedProductLocaleTags));
    expect(knownRegions, unorderedEquals(expectedProductLocaleTags));
  });
}

Map<String, dynamic> _readArb(String fileName) {
  return jsonDecode(File('lib/l10n/$fileName').readAsStringSync())
      as Map<String, dynamic>;
}

Set<String> _messageKeys(Map<String, dynamic> catalog) {
  return catalog.keys.where((key) => !key.startsWith('@')).toSet();
}
