// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appTitle => 'Supraconscious';

  @override
  String get startReflection => 'Begin your first reflection';

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
  String get landingEyebrow => 'A quieter place for honest reflection';

  @override
  String get landingNotJournal => 'Bring what’s been on your mind.';

  @override
  String get landingMeetYourself => 'Meet it with a little more space.';

  @override
  String get landingBody =>
      'Write in your own words. Your Guide offers a thoughtful reflection through the dimensions that may fit the moment. You decide what fits—and what you want to carry forward.';

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
  String get welcome => 'Welcome back';

  @override
  String welcomeName(String name) {
    return 'Welcome, $name';
  }

  @override
  String get journalTitle => 'What would you like to make room for today?';

  @override
  String get journalHelper =>
      'Write whatever feels present. The Guide may reflect patterns, tensions, and one possible next step.';

  @override
  String get journalPlaceholder =>
      'Begin anywhere—an emotion, an observation, a question, or a tension. No structure is required…';

  @override
  String get settingsTitle => 'Settings';

  @override
  String get accountFallback => 'Account';

  @override
  String get privacyBody =>
      'Your entries are stored with your account and used for reflections and safety checks. AI providers may process text or audio needed for features you choose. Pattern memory stores recurring signals only when enabled.';

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
  String get gentlerHandling => 'Gentler handling';

  @override
  String get gentlerHandlingSubtitle =>
      'The Guide will respond with extra care and a slower pace.';

  @override
  String get livingField => 'Living field';

  @override
  String get livingFieldSubtitle =>
      'Ambient motion only, never an emotion reading.';

  @override
  String get draftSaving => 'Saving draft…';

  @override
  String get draftSaved => 'Draft saved privately';

  @override
  String get landingProblemEyebrow => 'When thoughts keep circling';

  @override
  String get landingProblemTitle =>
      'Sometimes you know something matters. You just cannot see it all at once.';

  @override
  String get landingProblemBody =>
      'You may have thought it through, talked it over, or replayed it more than once—and still feel unsure where to begin.';

  @override
  String get landingCouncilEyebrow => 'How it works';

  @override
  String get landingCouncilTitle => 'Seven ways to look with care';

  @override
  String get landingCouncilBody =>
      'You begin in the Mirror with your own words. The Guide may bring forward the dimensions that fit this moment, in different combinations and depths. Each is an equally valid facet; interpretation and choice stay with you.';

  @override
  String get protectorRole => 'Perception';

  @override
  String get protectorRoleBody => 'What am I noticing?';

  @override
  String get conditionedSelfRole => 'Story';

  @override
  String get conditionedSelfRoleBody => 'What meaning have I created?';

  @override
  String get visionaryRole => 'Fear';

  @override
  String get visionaryRoleBody => 'What am I protecting?';

  @override
  String get truthSelfRole => 'Ego';

  @override
  String get truthSelfRoleBody => 'Which identity is responding?';

  @override
  String get geniusRole => 'Genius';

  @override
  String get geniusRoleBody => 'What higher possibility is available?';

  @override
  String get supraconsciousRole => 'Supraconscious';

  @override
  String get supraconsciousRoleBody => 'What conscious choice is now possible?';

  @override
  String get embodimentRole => 'Embodiment';

  @override
  String get embodimentRoleBody => 'How will I live that choice?';

  @override
  String get landingExperienceEyebrow => 'The practice';

  @override
  String get landingExperienceTitle => 'Write. See. Face. Choose. Become.';

  @override
  String get landingExperienceBody =>
      'Write what is here. Keep what resonates, correct what does not, and choose one small next step—or simply pause.';

  @override
  String get landingDifferentEyebrow => 'You remain at the center';

  @override
  String get landingDifferentTitle =>
      'Reflection that leaves room for your own knowing.';

  @override
  String get landingDifferentBody =>
      'A guided self-inquiry practice that offers several ways to view one moment—and a reflection you can question, correct, or leave.';

  @override
  String get landingFinalCta => 'Begin a reflection';

  @override
  String get landingBack => 'Landing';

  @override
  String get continueLabel => 'Continue';

  @override
  String get tabHome => 'Home';

  @override
  String get entries => 'Entries';

  @override
  String get guideStage => 'Guide model';

  @override
  String get noSavedTitle => 'No saved reflections yet';

  @override
  String get today => 'Today';

  @override
  String get askCouncil => 'Enter the Mirror';

  @override
  String get reflecting => 'Preparing your reflection…';

  @override
  String wordCount(int count) {
    return '$count words';
  }

  @override
  String get nothingSavedTitle => 'Nothing saved yet';

  @override
  String get savedReflectionTitle => 'Saved reflection';

  @override
  String get reflectionToConsider => 'A reflection to consider';

  @override
  String get reviewCarryForward => 'Review and carry forward';

  @override
  String get correctThis => 'Correct this';

  @override
  String get doesNotFit => 'Doesn’t fit';

  @override
  String get correctionPrompt => 'How would you correct this observation?';

  @override
  String get saveCorrection => 'Save correction';

  @override
  String get cancel => 'Cancel';

  @override
  String get memberCorrection => 'Your correction';

  @override
  String get correctionSaved => 'Your correction was saved.';

  @override
  String get correctionError =>
      'That correction could not be saved. Try again.';

  @override
  String get saveError =>
      'That could not be saved. Check your connection and try again.';

  @override
  String get feedbackSaved => 'Feedback saved';

  @override
  String get feedbackNeeded => 'Feedback needed';

  @override
  String get gateSaved => 'Choice saved';

  @override
  String get gateOpen => 'Choice available';

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
  String get loadError => 'This reflection could not be loaded. Try again.';

  @override
  String get guideResponse => 'Guide reflection';

  @override
  String get oneGroundedStep => 'One step to consider';

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
      'Your first reflection begins with your own words. No structure is required.';

  @override
  String get savedReflections => 'Saved reflections';

  @override
  String get patternsSubtitle =>
      'Signals, not diagnoses. Patterns appear only after they recur.';

  @override
  String get savedReflectionFallback => 'Saved reflection';

  @override
  String thresholdLabel(int month, int day) {
    return 'Mirror · Month $month, Day $day';
  }

  @override
  String get noThresholdPrompt =>
      'No Mirror prompt is published for today. Write what is present without forcing a structure.';

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

  @override
  String get thresholdPurposeGiftTheme => 'PURPOSE';

  @override
  String get thresholdPurposeGiftQuote => 'Every gift carries responsibility.';

  @override
  String get thresholdPurposeGiftFrameOfThought =>
      'Awareness of a gift invites its expression.';

  @override
  String get thresholdPurposeGiftSocraticQuestion =>
      'What gift are you not fully using?';

  @override
  String get continueWithGoogle => 'Continue with Google';

  @override
  String get continueWithApple => 'Continue with Apple';

  @override
  String get googleNoIdToken => 'Google did not return an identity token.';

  @override
  String get appleNoIdToken => 'Apple did not return an identity token.';

  @override
  String get verifyPasskeyTitle => 'Verify your passkey';

  @override
  String get verifyPasskeyBody =>
      'This account uses a passkey for an additional security check. Use your YubiKey or device passkey to finish signing in.';

  @override
  String get usePasskey => 'Use passkey';

  @override
  String get backToSignIn => 'Back to sign in';

  @override
  String get sessionStatus => 'Session status';

  @override
  String get noteSaved => 'note saved';

  @override
  String get feedbackLabel => 'Feedback';

  @override
  String get optionalFeedbackNote => 'Optional feedback note';

  @override
  String get embodimentPrompt => 'One small shift I can live today';

  @override
  String get saveEmbodimentGate => 'Save this choice';

  @override
  String get feedbackSavedMessage => 'Feedback saved.';

  @override
  String get embodimentSavedMessage => 'Your choice is saved.';

  @override
  String get patternsEmptyBody =>
      'When recurring signals appear across several entries, you’ll find them here.';

  @override
  String get theFiveStages => 'The Seven Dimensions of the Supraconscious';

  @override
  String get locked => 'Locked';

  @override
  String confidencePercent(int confidence) {
    return 'Confidence $confidence%';
  }

  @override
  String get hide => 'Hide';

  @override
  String get restore => 'Restore';

  @override
  String get councilReflection => 'Supraconscious Reflection';

  @override
  String get brandName => 'Supraconscious';

  @override
  String get tagline => 'Write. See clearly. Choose consciously.';

  @override
  String apiLabel(String apiBaseUrl) {
    return 'API: $apiBaseUrl';
  }

  @override
  String feedbackTypeLabel(String label) {
    return '$label';
  }
}
