// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Spanish Castilian (`es`).
class AppLocalizationsEs extends AppLocalizations {
  AppLocalizationsEs([String locale = 'es']) : super(locale);

  @override
  String get appTitle => 'El Consejo Interior';

  @override
  String get startReflection => 'Iniciar tu primera reflexión';

  @override
  String get signIn => 'Iniciar sesión';

  @override
  String get createAccount => 'Crear cuenta';

  @override
  String get useExistingAccount => 'Usar cuenta existente';

  @override
  String get landingEyebrow => 'Reflexión de identidad con IA';

  @override
  String get landingNotJournal => 'Esto no es un diario.';

  @override
  String get landingMeetYourself => 'Aquí es donde te encuentras contigo.';

  @override
  String get landingBody =>
      'No necesitas más consejos. Necesitas ver con claridad. El Consejo Interior revela lo que ya sabes, pero aún no has enfrentado.';

  @override
  String get tabJournal => 'Diario';

  @override
  String get tabSaved => 'Guardadas';

  @override
  String get tabPatterns => 'Patrones';

  @override
  String get tabGuide => 'Guía';

  @override
  String get tabSettings => 'Ajustes';

  @override
  String get welcome => 'Bienvenido';

  @override
  String welcomeName(String name) {
    return 'Bienvenido, $name';
  }

  @override
  String get journalTitle => '¿Qué está presente hoy?';

  @override
  String get journalHelper =>
      'Escribe una entrada honesta. El consejo reflejará patrones, tensiones y un próximo paso enraizado.';

  @override
  String get journalPlaceholder =>
      'Escribe lo que está presente: emociones, observaciones, tensiones. No se requiere estructura…';

  @override
  String get settingsTitle => 'Ajustes';

  @override
  String get accountFallback => 'Cuenta';

  @override
  String get privacyBody =>
      'Tus entradas permanecen privadas en esta cuenta y se usan para reflexión, seguridad, voz y memoria de patrones cuando está activada.';

  @override
  String get languageTitle => 'Idioma';

  @override
  String get languageSubtitle =>
      'Controla el idioma de la app y el idioma usado para nuevas reflexiones de IA.';

  @override
  String get patternMemory => 'Memoria de patrones';

  @override
  String get patternMemorySubtitle =>
      'Permitir que señales recurrentes aparezcan con el tiempo.';
}
