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
  String get nameLabel => 'Nombre';

  @override
  String get emailLabel => 'Correo electrónico';

  @override
  String get passwordLabel => 'Contraseña';

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
  String get tabSaved => 'Guard.';

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

  @override
  String get landingProblemEyebrow => 'El problema';

  @override
  String get landingProblemTitle =>
      'No estás bloqueado. No estás viendo con claridad.';

  @override
  String get landingProblemBody =>
      'Lo pensaste, lo analizaste, lo repetiste, y aun así algo en ti duda.';

  @override
  String get landingCouncilEyebrow => 'Cómo funciona';

  @override
  String get landingCouncilTitle => 'Conoce tu Inner Council';

  @override
  String get landingCouncilBody =>
      'Escribes lo que tienes en mente. Cuatro lentes internos reflejan lo que se mueve bajo la superficie.';

  @override
  String get protectorRole => 'El Protector';

  @override
  String get protectorRoleBody => 'Muestra dónde el miedo te está frenando.';

  @override
  String get conditionedSelfRole => 'El Yo Condicionado';

  @override
  String get conditionedSelfRoleBody =>
      'Revela patrones que no habías cuestionado.';

  @override
  String get visionaryRole => 'El Visionario';

  @override
  String get visionaryRoleBody => 'Muestra en quién te estás convirtiendo.';

  @override
  String get truthSelfRole => 'El Yo Verdadero';

  @override
  String get truthSelfRoleBody => 'Atraviesa la ilusión.';

  @override
  String get landingExperienceEyebrow => 'La experiencia';

  @override
  String get landingExperienceTitle =>
      'Escribe. Ve. Enfrenta. Elige. Conviértete.';

  @override
  String get landingExperienceBody =>
      'Cada sesión sigue un camino simple: sin ruido, sin saturación, solo un siguiente paso más claro.';

  @override
  String get landingDifferentEyebrow => 'Diferente por diseño';

  @override
  String get landingDifferentTitle =>
      'No es otro lugar para hablar en círculos.';

  @override
  String get landingDifferentBody =>
      'Es un sistema de reflexión de identidad, un motor de claridad para decisiones y un espejo para devenir.';

  @override
  String get landingFinalCta => 'Comienza tu primera reflexión';

  @override
  String get landingBack => 'Inicio';

  @override
  String get continueLabel => 'Continuar';

  @override
  String get tabHome => 'Inicio';

  @override
  String get entries => 'Entradas';

  @override
  String get guideStage => 'Etapa del guía';

  @override
  String get noSavedTitle => 'Aún no hay reflexiones guardadas';

  @override
  String get today => 'Hoy';

  @override
  String get askCouncil => 'Preguntar al Consejo';

  @override
  String get reflecting => 'Reflexionando...';

  @override
  String wordCount(int count) {
    return '$count palabras';
  }

  @override
  String get nothingSavedTitle => 'Aún no hay nada guardado';

  @override
  String get savedReflectionTitle => 'Reflexión guardada';

  @override
  String get feedbackSaved => 'Comentarios guardados';

  @override
  String get feedbackNeeded => 'Comentarios necesarios';

  @override
  String get gateSaved => 'Puerta guardada';

  @override
  String get gateOpen => 'Puerta abierta';

  @override
  String get helpful => 'Útil';

  @override
  String get notAccurate => 'No es preciso';

  @override
  String get tooIntense => 'Demasiado intenso';

  @override
  String get unclear => 'Poco claro';

  @override
  String get unsupportedSource => 'Fuente sin apoyo';

  @override
  String get saving => 'Guardando...';

  @override
  String get saveFeedback => 'Guardar comentarios';

  @override
  String get patternsTitle => 'Patrones';

  @override
  String get patternsEmptyTitle => 'Los patrones emergen con el tiempo';

  @override
  String get yourGuide => 'Tu guía';

  @override
  String get tone => 'Tono';

  @override
  String get intensity => 'Intensidad';

  @override
  String get trait => 'Rasgo';

  @override
  String get retry => 'Reintentar';

  @override
  String get guideResponse => 'Respuesta del guía';

  @override
  String get oneGroundedStep => 'Un paso concreto';

  @override
  String get sourceGrounding => 'Fundamentación de fuentes';

  @override
  String get signOut => 'Cerrar sesión';

  @override
  String get grounding => 'Grounding';

  @override
  String get recentReflections => 'Reflexiones recientes';

  @override
  String get firstEntryBody =>
      'Escribe tu primera entrada para empezar a construir tu práctica.';

  @override
  String get savedReflections => 'Reflexiones guardadas';

  @override
  String get patternsSubtitle =>
      'Señales, no diagnósticos. Los patrones aparecen solo cuando se repiten.';

  @override
  String get savedReflectionFallback => 'Reflexión guardada';

  @override
  String thresholdLabel(int month, int day) {
    return 'Umbral · Mes $month, día $day';
  }

  @override
  String get noThresholdPrompt =>
      'No hay un prompt de Umbral publicado para hoy. Escribe lo que está presente sin forzar una estructura.';

  @override
  String get thresholdPurposeTheme => 'PROPÓSITO';

  @override
  String get thresholdPurposeQuote =>
      'El alma susurra antes de que hable el destino.';

  @override
  String get thresholdPurposeFrameOfThought =>
      'El propósito rara vez llega como una orden. A menudo comienza como una invitación silenciosa.';

  @override
  String get thresholdPurposeSocraticQuestion =>
      '¿Qué invitación has estado ignorando?';

  @override
  String get continueWithGoogle => 'Continuar con Google';

  @override
  String get continueWithApple => 'Continuar con Apple';

  @override
  String get googleNoIdToken => 'Google no devolvió un token de identidad.';

  @override
  String get appleNoIdToken => 'Apple no devolvió un token de identidad.';

  @override
  String get verifyPasskeyTitle => 'Verifica tu llave de acceso';

  @override
  String get verifyPasskeyBody =>
      'Esta cuenta está protegida con MFA resistente al phishing. Usa tu YubiKey o la llave de acceso del dispositivo para terminar de iniciar sesión.';

  @override
  String get usePasskey => 'Usar llave de acceso';

  @override
  String get backToSignIn => 'Volver a iniciar sesión';

  @override
  String get sessionStatus => 'Estado de la sesión';

  @override
  String get noteSaved => 'nota guardada';

  @override
  String get feedbackLabel => 'Comentarios';

  @override
  String get optionalFeedbackNote => 'Nota opcional de comentarios';

  @override
  String get embodimentPrompt => 'Un pequeño cambio que puedo vivir hoy';

  @override
  String get saveEmbodimentGate => 'Guardar puerta de encarnación';

  @override
  String get feedbackSavedMessage => 'Comentarios guardados.';

  @override
  String get embodimentSavedMessage => 'Puerta de encarnación guardada.';

  @override
  String get patternsEmptyBody =>
      'Sigue escribiendo. Las señales recurrentes aparecerán aquí.';

  @override
  String get theFiveStages => 'Las cinco etapas';

  @override
  String get locked => 'Bloqueada';

  @override
  String confidencePercent(int confidence) {
    return 'Confianza $confidence%';
  }

  @override
  String get hide => 'Ocultar';

  @override
  String get restore => 'Restaurar';

  @override
  String get councilReflection => 'Reflexión del consejo';

  @override
  String get brandName => 'Supraconscious';

  @override
  String get tagline => 'Escribe. Ve con claridad. Elige conscientemente.';

  @override
  String apiLabel(String apiBaseUrl) {
    return 'API: $apiBaseUrl';
  }

  @override
  String get cosmicEyeSemanticLabel => 'Arte de ojo cósmico';

  @override
  String feedbackTypeLabel(String label) {
    return '$label';
  }
}
