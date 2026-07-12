import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_de.dart';
import 'app_localizations_el.dart';
import 'app_localizations_en.dart';
import 'app_localizations_es.dart';
import 'app_localizations_fr.dart';
import 'app_localizations_zh.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('de'),
    Locale('el'),
    Locale('en'),
    Locale('es'),
    Locale('fr'),
    Locale('zh'),
    Locale.fromSubtags(languageCode: 'zh', scriptCode: 'Hans'),
  ];

  /// No description provided for @appTitle.
  ///
  /// In en, this message translates to:
  /// **'The Inner Council'**
  String get appTitle;

  /// No description provided for @startReflection.
  ///
  /// In en, this message translates to:
  /// **'Start Your First Reflection'**
  String get startReflection;

  /// No description provided for @signIn.
  ///
  /// In en, this message translates to:
  /// **'Sign in'**
  String get signIn;

  /// No description provided for @createAccount.
  ///
  /// In en, this message translates to:
  /// **'Create account'**
  String get createAccount;

  /// No description provided for @useExistingAccount.
  ///
  /// In en, this message translates to:
  /// **'Use existing account'**
  String get useExistingAccount;

  /// No description provided for @nameLabel.
  ///
  /// In en, this message translates to:
  /// **'Name'**
  String get nameLabel;

  /// No description provided for @emailLabel.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get emailLabel;

  /// No description provided for @passwordLabel.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get passwordLabel;

  /// No description provided for @landingEyebrow.
  ///
  /// In en, this message translates to:
  /// **'AI-powered identity reflection'**
  String get landingEyebrow;

  /// No description provided for @landingNotJournal.
  ///
  /// In en, this message translates to:
  /// **'This is not a journal.'**
  String get landingNotJournal;

  /// No description provided for @landingMeetYourself.
  ///
  /// In en, this message translates to:
  /// **'This is where you meet yourself.'**
  String get landingMeetYourself;

  /// No description provided for @landingBody.
  ///
  /// In en, this message translates to:
  /// **'You do not need more advice. You need to see clearly. The Inner Council reveals what you already know, but have not faced.'**
  String get landingBody;

  /// No description provided for @tabJournal.
  ///
  /// In en, this message translates to:
  /// **'Journal'**
  String get tabJournal;

  /// No description provided for @tabSaved.
  ///
  /// In en, this message translates to:
  /// **'Saved'**
  String get tabSaved;

  /// No description provided for @tabPatterns.
  ///
  /// In en, this message translates to:
  /// **'Patterns'**
  String get tabPatterns;

  /// No description provided for @tabGuide.
  ///
  /// In en, this message translates to:
  /// **'Guide'**
  String get tabGuide;

  /// No description provided for @tabSettings.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get tabSettings;

  /// No description provided for @welcome.
  ///
  /// In en, this message translates to:
  /// **'Welcome'**
  String get welcome;

  /// No description provided for @welcomeName.
  ///
  /// In en, this message translates to:
  /// **'Welcome, {name}'**
  String welcomeName(String name);

  /// No description provided for @journalTitle.
  ///
  /// In en, this message translates to:
  /// **'What is present today?'**
  String get journalTitle;

  /// No description provided for @journalHelper.
  ///
  /// In en, this message translates to:
  /// **'Write one honest entry. The council will reflect patterns, tensions, and one grounded next step.'**
  String get journalHelper;

  /// No description provided for @journalPlaceholder.
  ///
  /// In en, this message translates to:
  /// **'Write what is present — emotions, observations, tensions. No structure required…'**
  String get journalPlaceholder;

  /// No description provided for @settingsTitle.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get settingsTitle;

  /// No description provided for @accountFallback.
  ///
  /// In en, this message translates to:
  /// **'Account'**
  String get accountFallback;

  /// No description provided for @privacyBody.
  ///
  /// In en, this message translates to:
  /// **'Your journal entries stay private to this account and are used for reflection, safety checks, voice features, and pattern memory when enabled.'**
  String get privacyBody;

  /// No description provided for @languageTitle.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get languageTitle;

  /// No description provided for @languageSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Controls app language and the language used for new AI reflections.'**
  String get languageSubtitle;

  /// No description provided for @patternMemory.
  ///
  /// In en, this message translates to:
  /// **'Pattern memory'**
  String get patternMemory;

  /// No description provided for @patternMemorySubtitle.
  ///
  /// In en, this message translates to:
  /// **'Allow recurring signals to appear over time.'**
  String get patternMemorySubtitle;

  /// No description provided for @landingProblemEyebrow.
  ///
  /// In en, this message translates to:
  /// **'The problem'**
  String get landingProblemEyebrow;

  /// No description provided for @landingProblemTitle.
  ///
  /// In en, this message translates to:
  /// **'You are not stuck. You are not seeing clearly.'**
  String get landingProblemTitle;

  /// No description provided for @landingProblemBody.
  ///
  /// In en, this message translates to:
  /// **'You have thought about it, analyzed it, replayed it, and still something in you hesitates.'**
  String get landingProblemBody;

  /// No description provided for @landingCouncilEyebrow.
  ///
  /// In en, this message translates to:
  /// **'How it works'**
  String get landingCouncilEyebrow;

  /// No description provided for @landingCouncilTitle.
  ///
  /// In en, this message translates to:
  /// **'Meet Your Inner Council'**
  String get landingCouncilTitle;

  /// No description provided for @landingCouncilBody.
  ///
  /// In en, this message translates to:
  /// **'You write what is on your mind. Four inner lenses reflect what is moving beneath the surface.'**
  String get landingCouncilBody;

  /// No description provided for @protectorRole.
  ///
  /// In en, this message translates to:
  /// **'The Protector'**
  String get protectorRole;

  /// No description provided for @protectorRoleBody.
  ///
  /// In en, this message translates to:
  /// **'Shows where fear is holding you back.'**
  String get protectorRoleBody;

  /// No description provided for @conditionedSelfRole.
  ///
  /// In en, this message translates to:
  /// **'The Conditioned Self'**
  String get conditionedSelfRole;

  /// No description provided for @conditionedSelfRoleBody.
  ///
  /// In en, this message translates to:
  /// **'Reveals patterns you did not question.'**
  String get conditionedSelfRoleBody;

  /// No description provided for @visionaryRole.
  ///
  /// In en, this message translates to:
  /// **'The Visionary'**
  String get visionaryRole;

  /// No description provided for @visionaryRoleBody.
  ///
  /// In en, this message translates to:
  /// **'Shows who you are becoming.'**
  String get visionaryRoleBody;

  /// No description provided for @truthSelfRole.
  ///
  /// In en, this message translates to:
  /// **'The Truth Self'**
  String get truthSelfRole;

  /// No description provided for @truthSelfRoleBody.
  ///
  /// In en, this message translates to:
  /// **'Cuts through illusion.'**
  String get truthSelfRoleBody;

  /// No description provided for @landingExperienceEyebrow.
  ///
  /// In en, this message translates to:
  /// **'The experience'**
  String get landingExperienceEyebrow;

  /// No description provided for @landingExperienceTitle.
  ///
  /// In en, this message translates to:
  /// **'Write. See. Face. Choose. Become.'**
  String get landingExperienceTitle;

  /// No description provided for @landingExperienceBody.
  ///
  /// In en, this message translates to:
  /// **'Every session moves through a simple path: no noise, no overwhelm, just one clearer next step.'**
  String get landingExperienceBody;

  /// No description provided for @landingDifferentEyebrow.
  ///
  /// In en, this message translates to:
  /// **'Different by design'**
  String get landingDifferentEyebrow;

  /// No description provided for @landingDifferentTitle.
  ///
  /// In en, this message translates to:
  /// **'Not another place to talk in circles.'**
  String get landingDifferentTitle;

  /// No description provided for @landingDifferentBody.
  ///
  /// In en, this message translates to:
  /// **'This is an identity reflection system, a decision clarity engine, and a mirror for becoming.'**
  String get landingDifferentBody;

  /// No description provided for @landingFinalCta.
  ///
  /// In en, this message translates to:
  /// **'Begin Your First Reflection'**
  String get landingFinalCta;

  /// No description provided for @landingBack.
  ///
  /// In en, this message translates to:
  /// **'Landing'**
  String get landingBack;

  /// No description provided for @continueLabel.
  ///
  /// In en, this message translates to:
  /// **'Continue'**
  String get continueLabel;

  /// No description provided for @tabHome.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get tabHome;

  /// No description provided for @entries.
  ///
  /// In en, this message translates to:
  /// **'Entries'**
  String get entries;

  /// No description provided for @guideStage.
  ///
  /// In en, this message translates to:
  /// **'Guide stage'**
  String get guideStage;

  /// No description provided for @noSavedTitle.
  ///
  /// In en, this message translates to:
  /// **'No saved reflections yet'**
  String get noSavedTitle;

  /// No description provided for @today.
  ///
  /// In en, this message translates to:
  /// **'Today'**
  String get today;

  /// No description provided for @askCouncil.
  ///
  /// In en, this message translates to:
  /// **'Ask the Council'**
  String get askCouncil;

  /// No description provided for @reflecting.
  ///
  /// In en, this message translates to:
  /// **'Reflecting...'**
  String get reflecting;

  /// No description provided for @wordCount.
  ///
  /// In en, this message translates to:
  /// **'{count} words'**
  String wordCount(int count);

  /// No description provided for @nothingSavedTitle.
  ///
  /// In en, this message translates to:
  /// **'Nothing saved yet'**
  String get nothingSavedTitle;

  /// No description provided for @savedReflectionTitle.
  ///
  /// In en, this message translates to:
  /// **'Saved reflection'**
  String get savedReflectionTitle;

  /// No description provided for @feedbackSaved.
  ///
  /// In en, this message translates to:
  /// **'Feedback saved'**
  String get feedbackSaved;

  /// No description provided for @feedbackNeeded.
  ///
  /// In en, this message translates to:
  /// **'Feedback needed'**
  String get feedbackNeeded;

  /// No description provided for @gateSaved.
  ///
  /// In en, this message translates to:
  /// **'Gate saved'**
  String get gateSaved;

  /// No description provided for @gateOpen.
  ///
  /// In en, this message translates to:
  /// **'Gate open'**
  String get gateOpen;

  /// No description provided for @helpful.
  ///
  /// In en, this message translates to:
  /// **'Helpful'**
  String get helpful;

  /// No description provided for @notAccurate.
  ///
  /// In en, this message translates to:
  /// **'Not accurate'**
  String get notAccurate;

  /// No description provided for @tooIntense.
  ///
  /// In en, this message translates to:
  /// **'Too intense'**
  String get tooIntense;

  /// No description provided for @unclear.
  ///
  /// In en, this message translates to:
  /// **'Unclear'**
  String get unclear;

  /// No description provided for @unsupportedSource.
  ///
  /// In en, this message translates to:
  /// **'Unsupported source'**
  String get unsupportedSource;

  /// No description provided for @saving.
  ///
  /// In en, this message translates to:
  /// **'Saving...'**
  String get saving;

  /// No description provided for @saveFeedback.
  ///
  /// In en, this message translates to:
  /// **'Save feedback'**
  String get saveFeedback;

  /// No description provided for @patternsTitle.
  ///
  /// In en, this message translates to:
  /// **'Patterns'**
  String get patternsTitle;

  /// No description provided for @patternsEmptyTitle.
  ///
  /// In en, this message translates to:
  /// **'Patterns emerge over time'**
  String get patternsEmptyTitle;

  /// No description provided for @yourGuide.
  ///
  /// In en, this message translates to:
  /// **'Your guide'**
  String get yourGuide;

  /// No description provided for @tone.
  ///
  /// In en, this message translates to:
  /// **'Tone'**
  String get tone;

  /// No description provided for @intensity.
  ///
  /// In en, this message translates to:
  /// **'Intensity'**
  String get intensity;

  /// No description provided for @trait.
  ///
  /// In en, this message translates to:
  /// **'Trait'**
  String get trait;

  /// No description provided for @retry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get retry;

  /// No description provided for @guideResponse.
  ///
  /// In en, this message translates to:
  /// **'Guide Response'**
  String get guideResponse;

  /// No description provided for @oneGroundedStep.
  ///
  /// In en, this message translates to:
  /// **'One grounded step'**
  String get oneGroundedStep;

  /// No description provided for @sourceGrounding.
  ///
  /// In en, this message translates to:
  /// **'Source grounding'**
  String get sourceGrounding;

  /// No description provided for @signOut.
  ///
  /// In en, this message translates to:
  /// **'Sign out'**
  String get signOut;

  /// No description provided for @grounding.
  ///
  /// In en, this message translates to:
  /// **'Grounding'**
  String get grounding;

  /// No description provided for @recentReflections.
  ///
  /// In en, this message translates to:
  /// **'Recent reflections'**
  String get recentReflections;

  /// No description provided for @firstEntryBody.
  ///
  /// In en, this message translates to:
  /// **'Write your first entry to begin building your practice.'**
  String get firstEntryBody;

  /// No description provided for @savedReflections.
  ///
  /// In en, this message translates to:
  /// **'Saved reflections'**
  String get savedReflections;

  /// No description provided for @patternsSubtitle.
  ///
  /// In en, this message translates to:
  /// **'Signals, not diagnoses. Patterns appear only after they recur.'**
  String get patternsSubtitle;

  /// No description provided for @savedReflectionFallback.
  ///
  /// In en, this message translates to:
  /// **'Saved reflection'**
  String get savedReflectionFallback;

  /// No description provided for @thresholdLabel.
  ///
  /// In en, this message translates to:
  /// **'Threshold · Month {month}, Day {day}'**
  String thresholdLabel(int month, int day);

  /// No description provided for @noThresholdPrompt.
  ///
  /// In en, this message translates to:
  /// **'No Threshold prompt is published for today. Write what is present without forcing a structure.'**
  String get noThresholdPrompt;

  /// No description provided for @thresholdPurposeTheme.
  ///
  /// In en, this message translates to:
  /// **'PURPOSE'**
  String get thresholdPurposeTheme;

  /// No description provided for @thresholdPurposeQuote.
  ///
  /// In en, this message translates to:
  /// **'The soul whispers before destiny speaks.'**
  String get thresholdPurposeQuote;

  /// No description provided for @thresholdPurposeFrameOfThought.
  ///
  /// In en, this message translates to:
  /// **'Purpose rarely arrives as a command. It often begins as a quiet invitation.'**
  String get thresholdPurposeFrameOfThought;

  /// No description provided for @thresholdPurposeSocraticQuestion.
  ///
  /// In en, this message translates to:
  /// **'What invitation have you been ignoring?'**
  String get thresholdPurposeSocraticQuestion;

  /// No description provided for @thresholdPurposeGiftTheme.
  ///
  /// In en, this message translates to:
  /// **'PURPOSE'**
  String get thresholdPurposeGiftTheme;

  /// No description provided for @thresholdPurposeGiftQuote.
  ///
  /// In en, this message translates to:
  /// **'Every gift carries responsibility.'**
  String get thresholdPurposeGiftQuote;

  /// No description provided for @thresholdPurposeGiftFrameOfThought.
  ///
  /// In en, this message translates to:
  /// **'Awareness of a gift invites its expression.'**
  String get thresholdPurposeGiftFrameOfThought;

  /// No description provided for @thresholdPurposeGiftSocraticQuestion.
  ///
  /// In en, this message translates to:
  /// **'What gift are you not fully using?'**
  String get thresholdPurposeGiftSocraticQuestion;

  /// No description provided for @continueWithGoogle.
  ///
  /// In en, this message translates to:
  /// **'Continue with Google'**
  String get continueWithGoogle;

  /// No description provided for @continueWithApple.
  ///
  /// In en, this message translates to:
  /// **'Continue with Apple'**
  String get continueWithApple;

  /// No description provided for @googleNoIdToken.
  ///
  /// In en, this message translates to:
  /// **'Google did not return an identity token.'**
  String get googleNoIdToken;

  /// No description provided for @appleNoIdToken.
  ///
  /// In en, this message translates to:
  /// **'Apple did not return an identity token.'**
  String get appleNoIdToken;

  /// No description provided for @verifyPasskeyTitle.
  ///
  /// In en, this message translates to:
  /// **'Verify your passkey'**
  String get verifyPasskeyTitle;

  /// No description provided for @verifyPasskeyBody.
  ///
  /// In en, this message translates to:
  /// **'This account is protected with phishing-resistant MFA. Use your YubiKey or device passkey to finish signing in.'**
  String get verifyPasskeyBody;

  /// No description provided for @usePasskey.
  ///
  /// In en, this message translates to:
  /// **'Use passkey'**
  String get usePasskey;

  /// No description provided for @backToSignIn.
  ///
  /// In en, this message translates to:
  /// **'Back to sign in'**
  String get backToSignIn;

  /// No description provided for @sessionStatus.
  ///
  /// In en, this message translates to:
  /// **'Session status'**
  String get sessionStatus;

  /// No description provided for @noteSaved.
  ///
  /// In en, this message translates to:
  /// **'note saved'**
  String get noteSaved;

  /// No description provided for @feedbackLabel.
  ///
  /// In en, this message translates to:
  /// **'Feedback'**
  String get feedbackLabel;

  /// No description provided for @optionalFeedbackNote.
  ///
  /// In en, this message translates to:
  /// **'Optional feedback note'**
  String get optionalFeedbackNote;

  /// No description provided for @embodimentPrompt.
  ///
  /// In en, this message translates to:
  /// **'One small shift I can live today'**
  String get embodimentPrompt;

  /// No description provided for @saveEmbodimentGate.
  ///
  /// In en, this message translates to:
  /// **'Save embodiment gate'**
  String get saveEmbodimentGate;

  /// No description provided for @feedbackSavedMessage.
  ///
  /// In en, this message translates to:
  /// **'Feedback saved.'**
  String get feedbackSavedMessage;

  /// No description provided for @embodimentSavedMessage.
  ///
  /// In en, this message translates to:
  /// **'Embodiment gate saved.'**
  String get embodimentSavedMessage;

  /// No description provided for @patternsEmptyBody.
  ///
  /// In en, this message translates to:
  /// **'Keep writing. Recurring signals will appear here.'**
  String get patternsEmptyBody;

  /// No description provided for @theFiveStages.
  ///
  /// In en, this message translates to:
  /// **'The five stages'**
  String get theFiveStages;

  /// No description provided for @locked.
  ///
  /// In en, this message translates to:
  /// **'Locked'**
  String get locked;

  /// No description provided for @confidencePercent.
  ///
  /// In en, this message translates to:
  /// **'Confidence {confidence}%'**
  String confidencePercent(int confidence);

  /// No description provided for @hide.
  ///
  /// In en, this message translates to:
  /// **'Hide'**
  String get hide;

  /// No description provided for @restore.
  ///
  /// In en, this message translates to:
  /// **'Restore'**
  String get restore;

  /// No description provided for @councilReflection.
  ///
  /// In en, this message translates to:
  /// **'Council Reflection'**
  String get councilReflection;

  /// No description provided for @brandName.
  ///
  /// In en, this message translates to:
  /// **'Supraconscious'**
  String get brandName;

  /// No description provided for @tagline.
  ///
  /// In en, this message translates to:
  /// **'Write. See clearly. Choose consciously.'**
  String get tagline;

  /// No description provided for @apiLabel.
  ///
  /// In en, this message translates to:
  /// **'API: {apiBaseUrl}'**
  String apiLabel(String apiBaseUrl);

  /// No description provided for @cosmicEyeSemanticLabel.
  ///
  /// In en, this message translates to:
  /// **'Cosmic eye artwork'**
  String get cosmicEyeSemanticLabel;

  /// No description provided for @feedbackTypeLabel.
  ///
  /// In en, this message translates to:
  /// **'{label}'**
  String feedbackTypeLabel(String label);
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) => <String>[
    'de',
    'el',
    'en',
    'es',
    'fr',
    'zh',
  ].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when language+script codes are specified.
  switch (locale.languageCode) {
    case 'zh':
      {
        switch (locale.scriptCode) {
          case 'Hans':
            return AppLocalizationsZhHans();
        }
        break;
      }
  }

  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'de':
      return AppLocalizationsDe();
    case 'el':
      return AppLocalizationsEl();
    case 'en':
      return AppLocalizationsEn();
    case 'es':
      return AppLocalizationsEs();
    case 'fr':
      return AppLocalizationsFr();
    case 'zh':
      return AppLocalizationsZh();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
