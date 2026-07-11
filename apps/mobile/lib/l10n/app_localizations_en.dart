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
  String get nameLabel => 'Name';

  @override
  String get emailLabel => 'Email';

  @override
  String get passwordLabel => 'Password';

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

  @override
  String get landingProblemEyebrow => 'The problem';

  @override
  String get landingProblemTitle =>
      'You are not stuck. You are not seeing clearly.';

  @override
  String get landingProblemBody =>
      'You have thought about it, analyzed it, replayed it, and still something in you hesitates.';

  @override
  String get landingCouncilEyebrow => 'How it works';

  @override
  String get landingCouncilTitle => 'Meet Your Inner Council';

  @override
  String get landingCouncilBody =>
      'You write what is on your mind. Four inner lenses reflect what is moving beneath the surface.';

  @override
  String get protectorRole => 'The Protector';

  @override
  String get protectorRoleBody => 'Shows where fear is holding you back.';

  @override
  String get conditionedSelfRole => 'The Conditioned Self';

  @override
  String get conditionedSelfRoleBody =>
      'Reveals patterns you did not question.';

  @override
  String get visionaryRole => 'The Visionary';

  @override
  String get visionaryRoleBody => 'Shows who you are becoming.';

  @override
  String get truthSelfRole => 'The Truth Self';

  @override
  String get truthSelfRoleBody => 'Cuts through illusion.';

  @override
  String get landingExperienceEyebrow => 'The experience';

  @override
  String get landingExperienceTitle => 'Write. See. Face. Choose. Become.';

  @override
  String get landingExperienceBody =>
      'Every session moves through a simple path: no noise, no overwhelm, just one clearer next step.';

  @override
  String get landingDifferentEyebrow => 'Different by design';

  @override
  String get landingDifferentTitle => 'Not another place to talk in circles.';

  @override
  String get landingDifferentBody =>
      'This is an identity reflection system, a decision clarity engine, and a mirror for becoming.';

  @override
  String get landingFinalCta => 'Begin Your First Reflection';

  @override
  String get landingBack => 'Landing';

  @override
  String get continueLabel => 'Continue';

  @override
  String get tabHome => 'Home';

  @override
  String get entries => 'Entries';

  @override
  String get guideStage => 'Guide stage';

  @override
  String get noSavedTitle => 'No saved reflections yet';

  @override
  String get today => 'Today';

  @override
  String get askCouncil => 'Ask the Council';

  @override
  String get reflecting => 'Reflecting...';

  @override
  String wordCount(int count) {
    return '$count words';
  }

  @override
  String get nothingSavedTitle => 'Nothing saved yet';

  @override
  String get savedReflectionTitle => 'Saved reflection';

  @override
  String get feedbackSaved => 'Feedback saved';

  @override
  String get feedbackNeeded => 'Feedback needed';

  @override
  String get gateSaved => 'Gate saved';

  @override
  String get gateOpen => 'Gate open';

  @override
  String get helpful => 'Helpful';

  @override
  String get notAccurate => 'Not accurate';

  @override
  String get tooIntense => 'Too intense';

  @override
  String get unclear => 'Unclear';

  @override
  String get unsupportedSource => 'Unsupported source';

  @override
  String get saving => 'Saving...';

  @override
  String get saveFeedback => 'Save feedback';

  @override
  String get patternsTitle => 'Patterns';

  @override
  String get patternsEmptyTitle => 'Patterns emerge over time';

  @override
  String get yourGuide => 'Your guide';

  @override
  String get tone => 'Tone';

  @override
  String get intensity => 'Intensity';

  @override
  String get trait => 'Trait';

  @override
  String get retry => 'Retry';

  @override
  String get guideResponse => 'Guide Response';

  @override
  String get oneGroundedStep => 'One grounded step';

  @override
  String get sourceGrounding => 'Source grounding';

  @override
  String get signOut => 'Sign out';

  @override
  String get grounding => 'Grounding';

  @override
  String get recentReflections => 'Recent reflections';

  @override
  String get firstEntryBody =>
      'Write your first entry to begin building your practice.';

  @override
  String get savedReflections => 'Saved reflections';

  @override
  String get patternsSubtitle =>
      'Signals, not diagnoses. Patterns appear only after they recur.';

  @override
  String get savedReflectionFallback => 'Saved reflection';

  @override
  String thresholdLabel(int month, int day) {
    return 'Threshold · Month $month, Day $day';
  }

  @override
  String get noThresholdPrompt =>
      'No Threshold prompt is published for today. Write what is present without forcing a structure.';

  @override
  String get thresholdPurposeTheme => 'PURPOSE';

  @override
  String get thresholdPurposeQuote =>
      'The soul whispers before destiny speaks.';

  @override
  String get thresholdPurposeFrameOfThought =>
      'Purpose rarely arrives as a command. It often begins as a quiet invitation.';

  @override
  String get thresholdPurposeSocraticQuestion =>
      'What invitation have you been ignoring?';
}
