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
  String get nameLabel => 'Nom';

  @override
  String get emailLabel => 'E-mail';

  @override
  String get passwordLabel => 'Mot de passe';

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

  @override
  String get landingProblemEyebrow => 'Le problème';

  @override
  String get landingProblemTitle =>
      'You are not stuck. You are not seeing clearly.';

  @override
  String get landingProblemBody =>
      'You have thought about it, analyzed it, replayed it, and still something in you hesitates.';

  @override
  String get landingCouncilEyebrow => 'Fonctionnement';

  @override
  String get landingCouncilTitle => 'Meet Your Inner Council';

  @override
  String get landingCouncilBody =>
      'You write what is on your mind. Four inner lenses reflect what is moving beneath the surface.';

  @override
  String get protectorRole => 'Le Protecteur';

  @override
  String get protectorRoleBody => 'Montre où la peur te retient.';

  @override
  String get conditionedSelfRole => 'Le Moi Conditionné';

  @override
  String get conditionedSelfRoleBody =>
      'Révèle les schémas que tu n\'avais pas remis en question.';

  @override
  String get visionaryRole => 'Le Visionnaire';

  @override
  String get visionaryRoleBody => 'Montre qui tu es en train de devenir.';

  @override
  String get truthSelfRole => 'Le Moi Véritable';

  @override
  String get truthSelfRoleBody => 'Traverse l\'illusion.';

  @override
  String get landingExperienceEyebrow => 'L’expérience';

  @override
  String get landingExperienceTitle => 'Write. See. Face. Choose. Become.';

  @override
  String get landingExperienceBody =>
      'Every session moves through a simple path: no noise, no overwhelm, just one clearer next step.';

  @override
  String get landingDifferentEyebrow => 'Différent par conception';

  @override
  String get landingDifferentTitle => 'Not another place to talk in circles.';

  @override
  String get landingDifferentBody =>
      'This is an identity reflection system, a decision clarity engine, and a mirror for becoming.';

  @override
  String get landingFinalCta => 'Commencer ta première réflexion';

  @override
  String get landingBack => 'Accueil';

  @override
  String get continueLabel => 'Continuer';

  @override
  String get tabHome => 'Accueil';

  @override
  String get entries => 'Entrées';

  @override
  String get guideStage => 'Étape du guide';

  @override
  String get noSavedTitle => 'Aucune réflexion enregistrée pour le moment';

  @override
  String get today => 'Aujourd’hui';

  @override
  String get askCouncil => 'Demander au Conseil';

  @override
  String get reflecting => 'Réflexion...';

  @override
  String wordCount(int count) {
    return '$count mots';
  }

  @override
  String get nothingSavedTitle => 'Rien d’enregistré pour le moment';

  @override
  String get savedReflectionTitle => 'Réflexion enregistrée';

  @override
  String get feedbackSaved => 'Commentaires enregistrés';

  @override
  String get feedbackNeeded => 'Commentaires nécessaires';

  @override
  String get gateSaved => 'Porte enregistrée';

  @override
  String get gateOpen => 'Porte ouverte';

  @override
  String get helpful => 'Utile';

  @override
  String get notAccurate => 'Pas exact';

  @override
  String get tooIntense => 'Trop intense';

  @override
  String get unclear => 'Pas clair';

  @override
  String get unsupportedSource => 'Source non étayée';

  @override
  String get saving => 'Enregistrement...';

  @override
  String get saveFeedback => 'Enregistrer les commentaires';

  @override
  String get patternsTitle => 'Motifs';

  @override
  String get patternsEmptyTitle => 'Les motifs émergent avec le temps';

  @override
  String get yourGuide => 'Ton guide';

  @override
  String get tone => 'Ton';

  @override
  String get intensity => 'Intensité';

  @override
  String get trait => 'Trait';

  @override
  String get retry => 'Réessayer';

  @override
  String get guideResponse => 'Réponse du guide';

  @override
  String get oneGroundedStep => 'Une étape concrète';

  @override
  String get sourceGrounding => 'Ancrage des sources';

  @override
  String get signOut => 'Se déconnecter';

  @override
  String get grounding => 'Ancrage';

  @override
  String get recentReflections => 'Réflexions récentes';

  @override
  String get firstEntryBody =>
      'Écris ta première entrée pour commencer ta pratique.';

  @override
  String get savedReflections => 'Réflexions enregistrées';

  @override
  String get patternsSubtitle =>
      'Des signaux, pas des diagnostics. Les motifs apparaissent seulement lorsqu’ils reviennent.';

  @override
  String get savedReflectionFallback => 'Réflexion enregistrée';

  @override
  String thresholdLabel(int month, int day) {
    return 'Seuil · Mois $month, jour $day';
  }

  @override
  String get noThresholdPrompt =>
      'Aucun prompt Seuil n’est publié pour aujourd’hui. Écris ce qui est présent sans forcer de structure.';

  @override
  String get thresholdPurposeTheme => 'BUT';

  @override
  String get thresholdPurposeQuote =>
      'L’âme murmure avant que le destin ne parle.';

  @override
  String get thresholdPurposeFrameOfThought =>
      'Le but arrive rarement comme un ordre. Il commence souvent comme une invitation silencieuse.';

  @override
  String get thresholdPurposeSocraticQuestion =>
      'Quelle invitation as-tu ignorée ?';
}
