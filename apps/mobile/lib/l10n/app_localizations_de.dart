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
  String get nameLabel => 'Name';

  @override
  String get emailLabel => 'E-Mail';

  @override
  String get passwordLabel => 'Passwort';

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

  @override
  String get landingProblemEyebrow => 'Das Problem';

  @override
  String get landingProblemTitle =>
      'Du steckst nicht fest. Du siehst noch nicht klar.';

  @override
  String get landingProblemBody =>
      'Du hast darüber nachgedacht, es analysiert, es wiederholt, und doch zögert etwas in dir.';

  @override
  String get landingCouncilEyebrow => 'So funktioniert es';

  @override
  String get landingCouncilTitle => 'Lerne deinen Inneren Rat kennen';

  @override
  String get landingCouncilBody =>
      'Du schreibst, was dich beschäftigt. Vier innere Perspektiven spiegeln, was sich unter der Oberfläche bewegt.';

  @override
  String get protectorRole => 'Der Beschützer';

  @override
  String get protectorRoleBody => 'Zeigt, wo Angst dich zurückhält.';

  @override
  String get conditionedSelfRole => 'Das konditionierte Selbst';

  @override
  String get conditionedSelfRoleBody =>
      'Zeigt Muster, die du nicht hinterfragt hast.';

  @override
  String get visionaryRole => 'Der Visionär';

  @override
  String get visionaryRoleBody => 'Zeigt, wer du wirst.';

  @override
  String get truthSelfRole => 'Das wahre Selbst';

  @override
  String get truthSelfRoleBody => 'Durchdringt die Illusion.';

  @override
  String get landingExperienceEyebrow => 'Die Erfahrung';

  @override
  String get landingExperienceTitle =>
      'Schreiben. Sehen. Begegnen. Wählen. Werden.';

  @override
  String get landingExperienceBody =>
      'Jede Sitzung folgt einem einfachen Weg: kein Lärm, keine Überforderung, nur ein klarerer nächster Schritt.';

  @override
  String get landingDifferentEyebrow => 'Anders gestaltet';

  @override
  String get landingDifferentTitle =>
      'Nicht noch ein Ort, um dich im Kreis zu drehen.';

  @override
  String get landingDifferentBody =>
      'Dies ist ein System für Identitätsreflexion, Klarheit in Entscheidungen und ein Spiegel für dein Werden.';

  @override
  String get landingFinalCta => 'Erste Reflexion beginnen';

  @override
  String get landingBack => 'Start';

  @override
  String get continueLabel => 'Weiter';

  @override
  String get tabHome => 'Home';

  @override
  String get entries => 'Einträge';

  @override
  String get guideStage => 'Guide-Stufe';

  @override
  String get noSavedTitle => 'Noch keine gespeicherten Reflexionen';

  @override
  String get today => 'Heute';

  @override
  String get askCouncil => 'Den Rat fragen';

  @override
  String get reflecting => 'Reflexion...';

  @override
  String wordCount(int count) {
    return '$count Wörter';
  }

  @override
  String get nothingSavedTitle => 'Noch nichts gespeichert';

  @override
  String get savedReflectionTitle => 'Gespeicherte Reflexion';

  @override
  String get feedbackSaved => 'Feedback gespeichert';

  @override
  String get feedbackNeeded => 'Feedback erforderlich';

  @override
  String get gateSaved => 'Tor gespeichert';

  @override
  String get gateOpen => 'Tor offen';

  @override
  String get helpful => 'Hilfreich';

  @override
  String get notAccurate => 'Nicht treffend';

  @override
  String get tooIntense => 'Zu intensiv';

  @override
  String get unclear => 'Unklar';

  @override
  String get unsupportedSource => 'Nicht gestützte Quelle';

  @override
  String get saving => 'Speichern...';

  @override
  String get saveFeedback => 'Feedback speichern';

  @override
  String get patternsTitle => 'Muster';

  @override
  String get patternsEmptyTitle => 'Muster entstehen mit der Zeit';

  @override
  String get yourGuide => 'Dein Guide';

  @override
  String get tone => 'Ton';

  @override
  String get intensity => 'Intensität';

  @override
  String get trait => 'Eigenschaft';

  @override
  String get retry => 'Erneut versuchen';

  @override
  String get guideResponse => 'Antwort des Guides';

  @override
  String get oneGroundedStep => 'Ein geerdeter Schritt';

  @override
  String get sourceGrounding => 'Quellenverankerung';

  @override
  String get signOut => 'Abmelden';

  @override
  String get grounding => 'Erdung';

  @override
  String get recentReflections => 'Aktuelle Reflexionen';

  @override
  String get firstEntryBody =>
      'Schreibe deinen ersten Eintrag, um deine Praxis aufzubauen.';

  @override
  String get savedReflections => 'Gespeicherte Reflexionen';

  @override
  String get patternsSubtitle =>
      'Signale, keine Diagnosen. Muster erscheinen erst, wenn sie wiederkehren.';

  @override
  String get savedReflectionFallback => 'Gespeicherte Reflexion';

  @override
  String thresholdLabel(int month, int day) {
    return 'Schwelle · Monat $month, Tag $day';
  }

  @override
  String get noThresholdPrompt =>
      'Für heute ist kein Schwellen-Impuls veröffentlicht. Schreibe, was präsent ist, ohne eine Struktur zu erzwingen.';

  @override
  String get thresholdPurposeTheme => 'SINN';

  @override
  String get thresholdPurposeQuote =>
      'Die Seele flüstert, bevor das Schicksal spricht.';

  @override
  String get thresholdPurposeFrameOfThought =>
      'Sinn kommt selten als Befehl. Oft beginnt er als leise Einladung.';

  @override
  String get thresholdPurposeSocraticQuestion =>
      'Welche Einladung hast du ignoriert?';

  @override
  String get thresholdPurposeGiftTheme => 'SINN';

  @override
  String get thresholdPurposeGiftQuote => 'Jede Gabe trägt Verantwortung.';

  @override
  String get thresholdPurposeGiftFrameOfThought =>
      'Das Bewusstsein für eine Gabe lädt dazu ein, sie auszudrücken.';

  @override
  String get thresholdPurposeGiftSocraticQuestion =>
      'Welche Gabe nutzt du nicht vollständig?';

  @override
  String get continueWithGoogle => 'Mit Google fortfahren';

  @override
  String get continueWithApple => 'Mit Apple fortfahren';

  @override
  String get googleNoIdToken =>
      'Google hat kein Identitätstoken zurückgegeben.';

  @override
  String get appleNoIdToken => 'Apple hat kein Identitätstoken zurückgegeben.';

  @override
  String get verifyPasskeyTitle => 'Passkey bestätigen';

  @override
  String get verifyPasskeyBody =>
      'Dieses Konto ist mit phishing-resistenter MFA geschützt. Verwende deinen YubiKey oder den Geräte-Passkey, um die Anmeldung abzuschließen.';

  @override
  String get usePasskey => 'Passkey verwenden';

  @override
  String get backToSignIn => 'Zurück zur Anmeldung';

  @override
  String get sessionStatus => 'Sitzungsstatus';

  @override
  String get noteSaved => 'Notiz gespeichert';

  @override
  String get feedbackLabel => 'Feedback';

  @override
  String get optionalFeedbackNote => 'Optionale Feedback-Notiz';

  @override
  String get embodimentPrompt =>
      'Eine kleine Veränderung, die ich heute leben kann';

  @override
  String get saveEmbodimentGate => 'Verkörperungs-Gate speichern';

  @override
  String get feedbackSavedMessage => 'Feedback gespeichert.';

  @override
  String get embodimentSavedMessage => 'Verkörperungs-Gate gespeichert.';

  @override
  String get patternsEmptyBody =>
      'Schreib weiter. Wiederkehrende Signale erscheinen hier.';

  @override
  String get theFiveStages => 'Die fünf Stufen';

  @override
  String get locked => 'Gesperrt';

  @override
  String confidencePercent(int confidence) {
    return 'Vertrauen $confidence %';
  }

  @override
  String get hide => 'Ausblenden';

  @override
  String get restore => 'Wiederherstellen';

  @override
  String get councilReflection => 'Ratsreflexion';

  @override
  String get brandName => 'Supraconscious';

  @override
  String get tagline => 'Schreiben. Klar sehen. Bewusst wählen.';

  @override
  String apiLabel(String apiBaseUrl) {
    return 'API: $apiBaseUrl';
  }

  @override
  String get cosmicEyeSemanticLabel => 'Kosmisches Augenmotiv';

  @override
  String feedbackTypeLabel(String label) {
    return '$label';
  }
}
