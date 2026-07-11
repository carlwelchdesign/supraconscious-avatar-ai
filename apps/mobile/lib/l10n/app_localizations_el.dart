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
}
