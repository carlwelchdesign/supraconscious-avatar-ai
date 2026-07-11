// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for German (`de`).
class AppLocalizationsDe extends AppLocalizations {
  AppLocalizationsDe([String locale = 'de']) : super(locale);

  @override
  String get appTitle => 'Der Innere Rat';

  @override
  String get startReflection => 'Starte deine erste Reflexion';

  @override
  String get signIn => 'Anmelden';

  @override
  String get createAccount => 'Konto erstellen';

  @override
  String get useExistingAccount => 'Bestehendes Konto nutzen';

  @override
  String get landingEyebrow => 'KI-gestützte Identitätsreflexion';

  @override
  String get landingNotJournal => 'Das ist kein Journal.';

  @override
  String get landingMeetYourself => 'Hier begegnest du dir selbst.';

  @override
  String get landingBody =>
      'Du brauchst nicht mehr Ratschläge. Du musst klar sehen. Der Innere Rat zeigt, was du bereits weißt, aber noch nicht angeschaut hast.';

  @override
  String get tabJournal => 'Journal';

  @override
  String get tabSaved => 'Gespeichert';

  @override
  String get tabPatterns => 'Muster';

  @override
  String get tabGuide => 'Guide';

  @override
  String get tabSettings => 'Einstellungen';

  @override
  String get welcome => 'Willkommen';

  @override
  String welcomeName(String name) {
    return 'Willkommen, $name';
  }

  @override
  String get journalTitle => 'Was ist heute präsent?';

  @override
  String get journalHelper =>
      'Schreibe einen ehrlichen Eintrag. Der Rat spiegelt Muster, Spannungen und einen geerdeten nächsten Schritt.';

  @override
  String get journalPlaceholder =>
      'Schreibe, was präsent ist — Emotionen, Beobachtungen, Spannungen. Keine Struktur nötig…';

  @override
  String get settingsTitle => 'Einstellungen';

  @override
  String get accountFallback => 'Konto';

  @override
  String get privacyBody =>
      'Deine Journaleinträge bleiben in diesem Konto privat und werden für Reflexion, Sicherheitschecks, Sprachfunktionen und Mustergedächtnis verwendet, wenn es aktiviert ist.';

  @override
  String get languageTitle => 'Sprache';

  @override
  String get languageSubtitle =>
      'Steuert die App-Sprache und die Sprache neuer KI-Reflexionen.';

  @override
  String get patternMemory => 'Mustergedächtnis';

  @override
  String get patternMemorySubtitle =>
      'Wiederkehrende Signale dürfen mit der Zeit sichtbar werden.';
}
