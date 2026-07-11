// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'The Inner Council';

  @override
  String get startReflection => 'Start Your First Reflection';

  @override
  String get signIn => 'Sign in';

  @override
  String get createAccount => 'Create account';

  @override
  String get useExistingAccount => 'Use existing account';

  @override
  String get landingEyebrow => 'AI-powered identity reflection';

  @override
  String get landingNotJournal => 'This is not a journal.';

  @override
  String get landingMeetYourself => 'This is where you meet yourself.';

  @override
  String get landingBody =>
      'You do not need more advice. You need to see clearly. The Inner Council reveals what you already know, but have not faced.';

  @override
  String get tabJournal => 'Journal';

  @override
  String get tabSaved => 'Saved';

  @override
  String get tabPatterns => 'Patterns';

  @override
  String get tabGuide => 'Guide';

  @override
  String get tabSettings => 'Settings';

  @override
  String get welcome => 'Welcome';

  @override
  String welcomeName(String name) {
    return 'Welcome, $name';
  }

  @override
  String get journalTitle => 'What is present today?';

  @override
  String get journalHelper =>
      'Write one honest entry. The council will reflect patterns, tensions, and one grounded next step.';

  @override
  String get journalPlaceholder =>
      'Write what is present — emotions, observations, tensions. No structure required…';

  @override
  String get settingsTitle => 'Settings';

  @override
  String get accountFallback => 'Account';

  @override
  String get privacyBody =>
      'Your journal entries stay private to this account and are used for reflection, safety checks, voice features, and pattern memory when enabled.';

  @override
  String get languageTitle => 'Language';

  @override
  String get languageSubtitle =>
      'Controls app language and the language used for new AI reflections.';

  @override
  String get patternMemory => 'Pattern memory';

  @override
  String get patternMemorySubtitle =>
      'Allow recurring signals to appear over time.';
}
