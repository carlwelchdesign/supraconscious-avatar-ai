// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Modern Greek (`el`).
class AppLocalizationsEl extends AppLocalizations {
  AppLocalizationsEl([String locale = 'el']) : super(locale);

  @override
  String get appTitle => 'Το Εσωτερικό Συμβούλιο';

  @override
  String get startReflection => 'Ξεκίνα την πρώτη σου αντανάκλαση';

  @override
  String get signIn => 'Σύνδεση';

  @override
  String get createAccount => 'Δημιουργία λογαριασμού';

  @override
  String get useExistingAccount => 'Χρήση υπάρχοντος λογαριασμού';

  @override
  String get nameLabel => 'Όνομα';

  @override
  String get emailLabel => 'Email';

  @override
  String get passwordLabel => 'Κωδικός πρόσβασης';

  @override
  String get landingEyebrow => 'Αντανάκλαση ταυτότητας με AI';

  @override
  String get landingNotJournal => 'Αυτό δεν είναι ημερολόγιο.';

  @override
  String get landingMeetYourself => 'Εδώ συναντάς τον εαυτό σου.';

  @override
  String get landingBody =>
      'Δεν χρειάζεσαι περισσότερες συμβουλές. Χρειάζεται να δεις καθαρά. Το Εσωτερικό Συμβούλιο αποκαλύπτει αυτό που ήδη ξέρεις, αλλά δεν έχεις αντιμετωπίσει.';

  @override
  String get tabJournal => 'Ημερολόγιο';

  @override
  String get tabSaved => 'Αποθηκευμένα';

  @override
  String get tabPatterns => 'Μοτίβα';

  @override
  String get tabGuide => 'Οδηγός';

  @override
  String get tabSettings => 'Ρυθμίσεις';

  @override
  String get welcome => 'Καλώς ήρθες';

  @override
  String welcomeName(String name) {
    return 'Καλώς ήρθες, $name';
  }

  @override
  String get journalTitle => 'Τι είναι παρόν σήμερα;';

  @override
  String get journalHelper =>
      'Γράψε μία ειλικρινή καταχώρηση. Το συμβούλιο θα αντανακλάσει μοτίβα, εντάσεις και ένα γειωμένο επόμενο βήμα.';

  @override
  String get journalPlaceholder =>
      'Γράψε ό,τι είναι παρόν — συναισθήματα, παρατηρήσεις, εντάσεις. Δεν χρειάζεται δομή…';

  @override
  String get settingsTitle => 'Ρυθμίσεις';

  @override
  String get accountFallback => 'Λογαριασμός';

  @override
  String get privacyBody =>
      'Οι καταχωρήσεις σου μένουν ιδιωτικές σε αυτόν τον λογαριασμό και χρησιμοποιούνται για αντανάκλαση, ελέγχους ασφάλειας, φωνή και μνήμη μοτίβων όταν είναι ενεργή.';

  @override
  String get languageTitle => 'Γλώσσα';

  @override
  String get languageSubtitle =>
      'Ελέγχει τη γλώσσα της εφαρμογής και τη γλώσσα για νέες αντανακλάσεις AI.';

  @override
  String get patternMemory => 'Μνήμη μοτίβων';

  @override
  String get patternMemorySubtitle =>
      'Επίτρεψε σε επαναλαμβανόμενα σήματα να εμφανίζονται με τον χρόνο.';

  @override
  String get landingProblemEyebrow => 'Το πρόβλημα';

  @override
  String get landingProblemTitle => 'Δεν έχεις κολλήσει. Δεν βλέπεις καθαρά.';

  @override
  String get landingProblemBody =>
      'Το σκέφτηκες, το ανέλυσες, το ξαναέπαιξες, και κάτι μέσα σου ακόμη διστάζει.';

  @override
  String get landingCouncilEyebrow => 'Πώς λειτουργεί';

  @override
  String get landingCouncilTitle => 'Γνώρισε το Inner Council σου';

  @override
  String get landingCouncilBody =>
      'Γράφεις ό,τι έχεις στο μυαλό σου. Τέσσερις εσωτερικοί φακοί αντανακλούν τι κινείται κάτω από την επιφάνεια.';

  @override
  String get protectorRole => 'Ο Προστάτης';

  @override
  String get protectorRoleBody => 'Δείχνει πού ο φόβος σε κρατά πίσω.';

  @override
  String get conditionedSelfRole => 'Ο Προγραμματισμένος Εαυτός';

  @override
  String get conditionedSelfRoleBody =>
      'Αποκαλύπτει μοτίβα που δεν είχες αμφισβητήσει.';

  @override
  String get visionaryRole => 'Ο Οραματιστής';

  @override
  String get visionaryRoleBody => 'Δείχνει ποιος γίνεσαι.';

  @override
  String get truthSelfRole => 'Ο Αληθινός Εαυτός';

  @override
  String get truthSelfRoleBody => 'Διαπερνά την ψευδαίσθηση.';

  @override
  String get landingExperienceEyebrow => 'Η εμπειρία';

  @override
  String get landingExperienceTitle =>
      'Γράψε. Δες. Αντιμετώπισε. Διάλεξε. Γίνε.';

  @override
  String get landingExperienceBody =>
      'Κάθε συνεδρία ακολουθεί απλή διαδρομή: χωρίς θόρυβο, χωρίς υπερφόρτωση, μόνο ένα πιο καθαρό επόμενο βήμα.';

  @override
  String get landingDifferentEyebrow => 'Διαφορετικό από σχεδιασμό';

  @override
  String get landingDifferentTitle =>
      'Όχι άλλο ένα μέρος για κύκλους συζήτησης.';

  @override
  String get landingDifferentBody =>
      'Είναι σύστημα στοχασμού ταυτότητας, μηχανή καθαρότητας αποφάσεων και καθρέφτης του γίγνεσθαι.';

  @override
  String get landingFinalCta => 'Ξεκίνα τον πρώτο στοχασμό';

  @override
  String get landingBack => 'Αρχική';

  @override
  String get continueLabel => 'Συνέχεια';

  @override
  String get tabHome => 'Αρχική';

  @override
  String get entries => 'Εγγραφές';

  @override
  String get guideStage => 'Στάδιο οδηγού';

  @override
  String get noSavedTitle => 'Δεν υπάρχουν αποθηκευμένοι στοχασμοί ακόμα';

  @override
  String get today => 'Σήμερα';

  @override
  String get askCouncil => 'Ρώτησε το Συμβούλιο';

  @override
  String get reflecting => 'Στοχασμός...';

  @override
  String wordCount(int count) {
    return '$count λέξεις';
  }

  @override
  String get nothingSavedTitle => 'Δεν έχει αποθηκευτεί τίποτα ακόμα';

  @override
  String get savedReflectionTitle => 'Αποθηκευμένος στοχασμός';

  @override
  String get feedbackSaved => 'Σχόλια αποθηκεύτηκαν';

  @override
  String get feedbackNeeded => 'Χρειάζονται σχόλια';

  @override
  String get gateSaved => 'Πύλη αποθηκεύτηκε';

  @override
  String get gateOpen => 'Πύλη ανοιχτή';

  @override
  String get helpful => 'Χρήσιμο';

  @override
  String get notAccurate => 'Όχι ακριβές';

  @override
  String get tooIntense => 'Πολύ έντονο';

  @override
  String get unclear => 'Ασαφές';

  @override
  String get unsupportedSource => 'Αστήρικτη πηγή';

  @override
  String get saving => 'Αποθήκευση...';

  @override
  String get saveFeedback => 'Αποθήκευση σχολίων';

  @override
  String get patternsTitle => 'Μοτίβα';

  @override
  String get patternsEmptyTitle => 'Τα μοτίβα αναδύονται με τον χρόνο';

  @override
  String get yourGuide => 'Ο οδηγός σου';

  @override
  String get tone => 'Τόνος';

  @override
  String get intensity => 'Ένταση';

  @override
  String get trait => 'Χαρακτηριστικό';

  @override
  String get retry => 'Δοκιμή ξανά';

  @override
  String get guideResponse => 'Απάντηση οδηγού';

  @override
  String get oneGroundedStep => 'Ένα γειωμένο βήμα';

  @override
  String get sourceGrounding => 'Γείωση πηγών';

  @override
  String get signOut => 'Αποσύνδεση';

  @override
  String get grounding => 'Γείωση';

  @override
  String get recentReflections => 'Πρόσφατοι στοχασμοί';

  @override
  String get firstEntryBody =>
      'Γράψε την πρώτη σου εγγραφή για να ξεκινήσεις την πρακτική σου.';

  @override
  String get savedReflections => 'Αποθηκευμένοι στοχασμοί';

  @override
  String get patternsSubtitle =>
      'Σήματα, όχι διαγνώσεις. Τα μοτίβα εμφανίζονται μόνο όταν επαναλαμβάνονται.';

  @override
  String get savedReflectionFallback => 'Αποθηκευμένος στοχασμός';

  @override
  String thresholdLabel(int month, int day) {
    return 'Κατώφλι · Μήνας $month, Ημέρα $day';
  }

  @override
  String get noThresholdPrompt =>
      'Δεν έχει δημοσιευτεί prompt Κατωφλίου για σήμερα. Γράψε ό,τι είναι παρόν χωρίς να πιέζεις για δομή.';

  @override
  String get thresholdPurposeTheme => 'ΣΚΟΠΟΣ';

  @override
  String get thresholdPurposeQuote =>
      'Η ψυχή ψιθυρίζει πριν μιλήσει το πεπρωμένο.';

  @override
  String get thresholdPurposeFrameOfThought =>
      'Ο σκοπός σπάνια έρχεται ως εντολή. Συχνά αρχίζει ως μια ήσυχη πρόσκληση.';

  @override
  String get thresholdPurposeSocraticQuestion => 'Ποια πρόσκληση αγνοείς;';
}
