// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for French (`fr`).
class AppLocalizationsFr extends AppLocalizations {
  AppLocalizationsFr([String locale = 'fr']) : super(locale);

  @override
  String get appTitle => 'Le Conseil Intérieur';

  @override
  String get startReflection => 'Commencer ta première réflexion';

  @override
  String get signIn => 'Se connecter';

  @override
  String get createAccount => 'Créer un compte';

  @override
  String get useExistingAccount => 'Utiliser un compte existant';

  @override
  String get landingEyebrow => 'Réflexion identitaire avec l\'IA';

  @override
  String get landingNotJournal => 'Ce n\'est pas un journal.';

  @override
  String get landingMeetYourself => 'C\'est ici que tu te rencontres.';

  @override
  String get landingBody =>
      'Tu n\'as pas besoin de plus de conseils. Tu as besoin de voir clairement. Le Conseil Intérieur révèle ce que tu sais déjà, mais que tu n\'as pas encore affronté.';

  @override
  String get tabJournal => 'Journal';

  @override
  String get tabSaved => 'Enregistrées';

  @override
  String get tabPatterns => 'Schémas';

  @override
  String get tabGuide => 'Guide';

  @override
  String get tabSettings => 'Réglages';

  @override
  String get welcome => 'Bienvenue';

  @override
  String welcomeName(String name) {
    return 'Bienvenue, $name';
  }

  @override
  String get journalTitle => 'Qu\'est-ce qui est présent aujourd\'hui ?';

  @override
  String get journalHelper =>
      'Écris une entrée honnête. Le conseil reflétera les schémas, les tensions et un prochain pas ancré.';

  @override
  String get journalPlaceholder =>
      'Écris ce qui est présent — émotions, observations, tensions. Aucune structure requise…';

  @override
  String get settingsTitle => 'Réglages';

  @override
  String get accountFallback => 'Compte';

  @override
  String get privacyBody =>
      'Tes entrées restent privées sur ce compte et sont utilisées pour la réflexion, la sécurité, les fonctions vocales et la mémoire des schémas quand elle est activée.';

  @override
  String get languageTitle => 'Langue';

  @override
  String get languageSubtitle =>
      'Contrôle la langue de l\'app et celle utilisée pour les nouvelles réflexions IA.';

  @override
  String get patternMemory => 'Mémoire des schémas';

  @override
  String get patternMemorySubtitle =>
      'Autoriser les signaux récurrents à apparaître avec le temps.';
}
