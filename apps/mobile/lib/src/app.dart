import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:passkeys/authenticator.dart';
import 'package:passkeys/types.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';

import '../l10n/app_localizations.dart';
import 'local_language_controller.dart';
import 'mobile_api.dart';
import 'session_controller.dart';

enum _AuthMode { login, register }

class InnerCouncilMobileApp extends ConsumerWidget {
  const InnerCouncilMobileApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionControllerProvider).valueOrNull;
    final localLanguage = ref.watch(localLanguageControllerProvider);
    final localeLanguageCode = localLanguage.hasExplicitPreference
        ? localLanguage.code
        : session?.authenticated == true
        ? session!.language.current
        : localLanguage.code;
    return MaterialApp(
      key: ValueKey(localeLanguageCode),
      onGenerateTitle: (context) => AppLocalizations.of(context).appTitle,
      debugShowCheckedModeBanner: false,
      builder: (context, child) => MediaQuery.withClampedTextScaling(
        maxScaleFactor: 2,
        child: child ?? const SizedBox.shrink(),
      ),
      locale: _localeFromLanguageCode(localeLanguageCode),
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFFC87432),
          onPrimary: Color(0xFFFFF8EF),
          secondary: Color(0xFF8F91E8),
          onSecondary: Color(0xFF050914),
          surface: Color(0xFF121321),
          onSurface: Color(0xFFF4EBDD),
          error: Color(0xFFC85C54),
          onError: Color(0xFFFFF7EE),
          outline: Color(0xFF5A5360),
        ),
        scaffoldBackgroundColor: const Color(0xFF050914),
        fontFamily: 'System',
        inputDecorationTheme: const InputDecorationTheme(
          filled: true,
          fillColor: Color(0xFF090E1B),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.all(Radius.circular(16)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.all(Radius.circular(16)),
            borderSide: BorderSide(color: Color(0xFF8CA0FF), width: 2),
          ),
        ),
        cardTheme: const CardThemeData(
          color: Color(0xFF121321),
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.all(Radius.circular(18)),
            side: BorderSide(color: Color(0x335A5360)),
          ),
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF090E1B),
          foregroundColor: Color(0xFFF4EBDD),
          elevation: 0,
        ),
        navigationBarTheme: const NavigationBarThemeData(
          backgroundColor: Color(0xFF090E1B),
          indicatorColor: Color(0x338F91E8),
          height: 72,
          labelBehavior: NavigationDestinationLabelBehavior.onlyShowSelected,
        ),
        filledButtonTheme: const FilledButtonThemeData(
          style: ButtonStyle(
            minimumSize: WidgetStatePropertyAll(Size(48, 48)),
            shape: WidgetStatePropertyAll(StadiumBorder()),
          ),
        ),
        outlinedButtonTheme: const OutlinedButtonThemeData(
          style: ButtonStyle(
            minimumSize: WidgetStatePropertyAll(Size(48, 48)),
            shape: WidgetStatePropertyAll(StadiumBorder()),
          ),
        ),
      ),
      home: const MobileRoot(),
    );
  }
}

Locale _localeFromLanguageCode(String languageCode) {
  final normalized = languageCode.replaceAll('_', '-');
  if (normalized == 'zh-Hans' || normalized == 'zh' || normalized == 'zh-CN') {
    return const Locale.fromSubtags(languageCode: 'zh', scriptCode: 'Hans');
  }

  return Locale(normalized.split('-').first);
}

class MobileRoot extends ConsumerStatefulWidget {
  const MobileRoot({super.key});

  @override
  ConsumerState<MobileRoot> createState() => _MobileRootState();
}

class _MobileRootState extends ConsumerState<MobileRoot> {
  _AuthMode? _authMode;

  @override
  Widget build(BuildContext context) {
    final session = ref.watch(sessionControllerProvider);
    return session.when(
      loading: () => const _FoundationFrame(
        child: Center(child: CircularProgressIndicator()),
      ),
      error: (error, _) => AuthScreen(
        initialRegister: _authMode == _AuthMode.register,
        language: MobileLanguageState(
          current: ref.read(localLanguageControllerProvider).code,
          supported: fallbackSupportedLanguages,
        ),
        error: error.toString(),
        onBack: _showLanding,
      ),
      data: (value) {
        if (value.isUnauthenticated) {
          final mode = _authMode;
          if (mode == null) {
            return LandingScreen(
              language: value.language,
              onCreateAccount: () => _showAuth(_AuthMode.register),
              onSignIn: () => _showAuth(_AuthMode.login),
            );
          }
          return AuthScreen(
            initialRegister: mode == _AuthMode.register,
            language: value.language,
            onBack: _showLanding,
          );
        }
        if (value.needsMfa) {
          return const PasskeyMfaScreen();
        }
        if (value.needsOnboarding) {
          return ConsentScreen(consent: value.consent);
        }
        return ProductShell(session: value);
      },
    );
  }

  void _showAuth(_AuthMode mode) {
    setState(() => _authMode = mode);
  }

  void _showLanding() {
    setState(() => _authMode = null);
  }
}

class LandingScreen extends StatelessWidget {
  const LandingScreen({
    required this.language,
    required this.onCreateAccount,
    required this.onSignIn,
    super.key,
  });

  final MobileLanguageState language;
  final VoidCallback onCreateAccount;
  final VoidCallback onSignIn;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return _FoundationFrame(
      maxWidth: 720,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Align(
            alignment: Alignment.centerRight,
            child: _LanguageSelector(language: language, compact: true),
          ),
          const SizedBox(height: 56),
          const _LandingHero(),
          const SizedBox(height: 28),
          FilledButton(
            onPressed: onCreateAccount,
            child: Text(l10n.startReflection),
          ),
          const SizedBox(height: 10),
          OutlinedButton(onPressed: onSignIn, child: Text(l10n.signIn)),
          const SizedBox(height: 36),
          _LandingSection(
            eyebrow: l10n.landingProblemEyebrow,
            title: l10n.landingProblemTitle,
            body: l10n.landingProblemBody,
          ),
          _LandingSection(
            eyebrow: l10n.landingCouncilEyebrow,
            title: l10n.landingCouncilTitle,
            body: l10n.landingCouncilBody,
          ),
          const _DimensionGrid(),
          _LandingSection(
            eyebrow: l10n.landingExperienceEyebrow,
            title: l10n.landingExperienceTitle,
            body: l10n.landingExperienceBody,
          ),
          _LandingSection(
            eyebrow: l10n.landingDifferentEyebrow,
            title: l10n.landingDifferentTitle,
            body: l10n.landingDifferentBody,
          ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: onCreateAccount,
            child: Text(l10n.landingFinalCta),
          ),
          const SizedBox(height: 16),
          _EnvironmentPill(apiBaseUrl: apiBaseUrl),
        ],
      ),
    );
  }
}

class _LandingHero extends StatelessWidget {
  const _LandingHero();

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          l10n.landingEyebrow,
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
            color: const Color(0xFFD6C493),
            letterSpacing: 1.1,
          ),
        ),
        const SizedBox(height: 14),
        FittedBox(
          fit: BoxFit.scaleDown,
          alignment: Alignment.centerLeft,
          child: MediaQuery.withClampedTextScaling(
            maxScaleFactor: 1.1,
            child: Text(
              l10n.appTitle,
              maxLines: 1,
              softWrap: false,
              style: Theme.of(context).textTheme.displayMedium?.copyWith(
                color: const Color(0xFFFFF8EA),
                fontWeight: FontWeight.w500,
                height: 0.96,
              ),
            ),
          ),
        ),
        const SizedBox(height: 22),
        Text(
          l10n.landingNotJournal,
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
            color: const Color(0xFFFFF8EA),
            height: 1.05,
          ),
        ),
        Text(
          l10n.landingMeetYourself,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            color: const Color(0xFFE9D9B7),
            fontStyle: FontStyle.italic,
          ),
        ),
        const SizedBox(height: 18),
        Text(
          l10n.landingBody,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
            color: const Color(0xDFFFF8EA),
            height: 1.55,
          ),
        ),
      ],
    );
  }
}

class _LandingSection extends StatelessWidget {
  const _LandingSection({
    required this.eyebrow,
    required this.title,
    required this.body,
  });

  final String eyebrow;
  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 28),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            eyebrow.toUpperCase(),
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: const Color(0xFFD6C493),
              letterSpacing: 1.4,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            title,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              color: const Color(0xFFFFF8EA),
              height: 1.08,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            body,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
              color: const Color(0xCFFFF8EA),
              height: 1.55,
            ),
          ),
        ],
      ),
    );
  }
}

class _DimensionGrid extends StatelessWidget {
  const _DimensionGrid();

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final dimensions = [
      (l10n.protectorRole, l10n.protectorRoleBody),
      (l10n.conditionedSelfRole, l10n.conditionedSelfRoleBody),
      (l10n.visionaryRole, l10n.visionaryRoleBody),
      (l10n.truthSelfRole, l10n.truthSelfRoleBody),
      (l10n.geniusRole, l10n.geniusRoleBody),
      (l10n.supraconsciousRole, l10n.supraconsciousRoleBody),
      (l10n.embodimentRole, l10n.embodimentRoleBody),
    ];

    return Padding(
      padding: const EdgeInsets.only(bottom: 28),
      child: Wrap(
        spacing: 10,
        runSpacing: 10,
        children: [
          for (final dimension in dimensions)
            SizedBox(
              width: 320,
              child: _InfoCard(title: dimension.$1, body: dimension.$2),
            ),
        ],
      ),
    );
  }
}

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({
    required this.initialRegister,
    required this.language,
    this.error,
    this.onBack,
    super.key,
  });

  final bool initialRegister;
  final MobileLanguageState language;
  final String? error;
  final VoidCallback? onBack;

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  late bool _register;
  bool _socialPending = false;
  String? _socialError;
  static Future<void>? _googleInit;

  @override
  void initState() {
    super.initState();
    _register = widget.initialRegister;
  }

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return _FoundationFrame(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton.icon(
              onPressed: widget.onBack,
              icon: const Icon(Icons.arrow_back),
              label: Text(l10n.landingBack),
            ),
          ),
          Align(
            alignment: Alignment.centerRight,
            child: _LanguageSelector(language: widget.language, compact: true),
          ),
          const SizedBox(height: 34),
          const _BrandHeader(),
          const SizedBox(height: 28),
          if (_register)
            TextField(
              controller: _name,
              textInputAction: TextInputAction.next,
              decoration: InputDecoration(labelText: l10n.nameLabel),
            ),
          if (_register) const SizedBox(height: 12),
          TextField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            decoration: InputDecoration(labelText: l10n.emailLabel),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _password,
            obscureText: true,
            decoration: InputDecoration(labelText: l10n.passwordLabel),
          ),
          if (widget.error != null) ...[
            const SizedBox(height: 12),
            Text(
              widget.error!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ],
          if (_socialError != null) ...[
            const SizedBox(height: 12),
            Text(
              _socialError!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ],
          const SizedBox(height: 20),
          OutlinedButton.icon(
            onPressed: _socialPending ? null : _loginWithGoogle,
            icon: const Icon(Icons.g_mobiledata),
            label: Text(l10n.continueWithGoogle),
          ),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            onPressed: _socialPending ? null : _loginWithApple,
            icon: const Icon(Icons.apple),
            label: Text(l10n.continueWithApple),
          ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: _submit,
            child: Text(_register ? l10n.createAccount : l10n.signIn),
          ),
          TextButton(
            onPressed: () => setState(() => _register = !_register),
            child: Text(
              _register ? l10n.useExistingAccount : l10n.createAccount,
            ),
          ),
          const SizedBox(height: 40),
          _EnvironmentPill(apiBaseUrl: apiBaseUrl),
        ],
      ),
    );
  }

  void _submit() {
    final controller = ref.read(sessionControllerProvider.notifier);
    final preferredLanguage = ref.read(localLanguageControllerProvider).code;
    if (_register) {
      controller.register(
        _name.text.trim(),
        _email.text.trim(),
        _password.text,
        preferredLanguage: preferredLanguage,
      );
    } else {
      controller.login(
        _email.text.trim(),
        _password.text,
        preferredLanguage: preferredLanguage,
      );
    }
  }

  Future<void> _loginWithGoogle() async {
    final l10n = AppLocalizations.of(context);
    await _runSocialLogin(() async {
      _googleInit ??= GoogleSignIn.instance.initialize();
      await _googleInit;
      final account = await GoogleSignIn.instance.authenticate();
      final idToken = account.authentication.idToken;
      if (idToken == null || idToken.isEmpty) {
        throw StateError(l10n.googleNoIdToken);
      }
      await ref
          .read(sessionControllerProvider.notifier)
          .loginWithOAuth(
            provider: 'google',
            idToken: idToken,
            preferredLanguage: ref.read(localLanguageControllerProvider).code,
          );
    });
  }

  Future<void> _loginWithApple() async {
    final l10n = AppLocalizations.of(context);
    await _runSocialLogin(() async {
      final credential = await SignInWithApple.getAppleIDCredential(
        scopes: [
          AppleIDAuthorizationScopes.email,
          AppleIDAuthorizationScopes.fullName,
        ],
      );
      final idToken = credential.identityToken;
      if (idToken == null || idToken.isEmpty) {
        throw StateError(l10n.appleNoIdToken);
      }
      await ref
          .read(sessionControllerProvider.notifier)
          .loginWithOAuth(
            provider: 'apple',
            idToken: idToken,
            preferredLanguage: ref.read(localLanguageControllerProvider).code,
          );
    });
  }

  Future<void> _runSocialLogin(Future<void> Function() action) async {
    setState(() {
      _socialPending = true;
      _socialError = null;
    });
    try {
      await action();
    } catch (error) {
      setState(() => _socialError = error.toString());
    } finally {
      if (mounted) setState(() => _socialPending = false);
    }
  }
}

class PasskeyMfaScreen extends ConsumerStatefulWidget {
  const PasskeyMfaScreen({super.key});

  @override
  ConsumerState<PasskeyMfaScreen> createState() => _PasskeyMfaScreenState();
}

class _PasskeyMfaScreenState extends ConsumerState<PasskeyMfaScreen> {
  bool _verifying = false;
  String? _error;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return _FoundationFrame(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 88),
          const Icon(Icons.security, size: 64, color: Color(0xFF82D7C4)),
          const SizedBox(height: 24),
          Text(
            l10n.verifyPasskeyTitle,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 12),
          Text(
            l10n.verifyPasskeyBody,
            textAlign: TextAlign.center,
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          if (_error != null) ...[
            const SizedBox(height: 16),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ],
          const SizedBox(height: 24),
          FilledButton.icon(
            onPressed: _verifying ? null : _verify,
            icon: _verifying
                ? const SizedBox(
                    height: 16,
                    width: 16,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Icon(Icons.key),
            label: Text(l10n.usePasskey),
          ),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () =>
                ref.read(sessionControllerProvider.notifier).load(),
            child: Text(l10n.backToSignIn),
          ),
        ],
      ),
    );
  }

  Future<void> _verify() async {
    setState(() {
      _verifying = true;
      _error = null;
    });
    try {
      final api = ref.read(apiClientProvider);
      final challenge = await api.startPasskeyMfa();
      final authenticator = PasskeyAuthenticator();
      final response = await authenticator.authenticate(
        AuthenticateRequestType.fromJson(challenge.options),
      );
      await ref
          .read(sessionControllerProvider.notifier)
          .completePasskeyMfa(
            challengeToken: challenge.challengeToken,
            response: response.toJson(),
          );
    } catch (_) {
      setState(() => _error = AppLocalizations.of(context).saveError);
    } finally {
      if (mounted) setState(() => _verifying = false);
    }
  }
}

class ConsentScreen extends ConsumerStatefulWidget {
  const ConsentScreen({required this.consent, super.key});

  final MobileConsent consent;

  @override
  ConsumerState<ConsentScreen> createState() => _ConsentScreenState();
}

class _ConsentScreenState extends ConsumerState<ConsentScreen> {
  bool _patternMemoryGranted = false;

  @override
  Widget build(BuildContext context) {
    return _FoundationFrame(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 80),
          const _BrandHeader(),
          const SizedBox(height: 20),
          for (final item in widget.consent.items)
            CheckboxListTile(
              value:
                  item.required ||
                  (item.type == 'pattern_memory'
                      ? _patternMemoryGranted
                      : item.granted),
              onChanged: item.required
                  ? null
                  : (value) {
                      setState(() => _patternMemoryGranted = value ?? false);
                    },
              title: Text(item.label),
              controlAffinity: ListTileControlAffinity.leading,
              contentPadding: EdgeInsets.zero,
            ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: () {
              ref
                  .read(sessionControllerProvider.notifier)
                  .acceptConsent(patternMemoryGranted: _patternMemoryGranted);
            },
            child: Text(AppLocalizations.of(context).continueLabel),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }
}

class ProductShell extends ConsumerStatefulWidget {
  const ProductShell({required this.session, super.key});

  final MobileSession session;

  @override
  ConsumerState<ProductShell> createState() => _ProductShellState();
}

class _ProductShellState extends ConsumerState<ProductShell> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final tabs = [
      DashboardTab(session: widget.session),
      JournalTab(session: widget.session),
      const SavedSessionsTab(),
      const PatternsTab(),
      const GuideTab(),
      SettingsTab(session: widget.session),
    ];
    return Scaffold(
      appBar: AppBar(
        title: Text(
          l10n.appTitle.toUpperCase(),
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w500,
            letterSpacing: 3.2,
          ),
        ),
        actions: [
          IconButton(
            tooltip: l10n.signOut,
            onPressed: () =>
                ref.read(sessionControllerProvider.notifier).logout(),
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: Stack(
        fit: StackFit.expand,
        children: [
          const ColoredBox(color: Color(0xFF050914)),
          Positioned.fill(
            child: Opacity(
              opacity: 0.58,
              child: Image.asset(
                'assets/images/mineral-boundary-v3-portrait.png',
                fit: BoxFit.cover,
                alignment: Alignment.centerLeft,
                excludeFromSemantics: true,
              ),
            ),
          ),
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
                colors: [Color(0xB3050914), Color(0xF2050914)],
              ),
            ),
          ),
          SafeArea(child: tabs[_index]),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (value) => setState(() => _index = value),
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.dashboard_outlined),
            selectedIcon: const Icon(Icons.dashboard),
            label: l10n.tabHome,
          ),
          NavigationDestination(
            icon: const Icon(Icons.edit_note_outlined),
            selectedIcon: const Icon(Icons.edit_note),
            label: l10n.tabJournal,
          ),
          NavigationDestination(
            icon: const Icon(Icons.history_outlined),
            selectedIcon: const Icon(Icons.history),
            label: l10n.tabSaved,
          ),
          NavigationDestination(
            icon: const Icon(Icons.insights_outlined),
            selectedIcon: const Icon(Icons.insights),
            label: l10n.tabPatterns,
          ),
          NavigationDestination(
            icon: const Icon(Icons.auto_awesome_outlined),
            selectedIcon: const Icon(Icons.auto_awesome),
            label: l10n.tabGuide,
          ),
          NavigationDestination(
            icon: const Icon(Icons.tune_outlined),
            selectedIcon: const Icon(Icons.tune),
            label: l10n.tabSettings,
          ),
        ],
      ),
    );
  }
}

class DashboardTab extends ConsumerWidget {
  const DashboardTab({required this.session, super.key});

  final MobileSession session;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final dashboard = ref.watch(dashboardProvider);
    return _AsyncList(
      value: dashboard,
      onRefresh: () => ref.invalidate(dashboardProvider),
      builder: (data) => [
        Text(
          data.greetingName?.isNotEmpty == true
              ? l10n.welcomeName(data.greetingName!)
              : l10n.welcome,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            _StatCard(label: l10n.entries, value: '${data.entryCount}'),
            _StatCard(
              label: l10n.tabPatterns,
              value: '${data.activePatternCount}',
            ),
          ],
        ),
        const SizedBox(height: 24),
        Text(
          l10n.recentReflections,
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 12),
        if (data.recentSessions.isEmpty)
          _InfoCard(title: l10n.noSavedTitle, body: l10n.firstEntryBody)
        else
          for (final item in data.recentSessions)
            _SessionSummaryCard(session: item),
      ],
    );
  }
}

class JournalTab extends ConsumerStatefulWidget {
  const JournalTab({required this.session, super.key});

  final MobileSession session;

  @override
  ConsumerState<JournalTab> createState() => _JournalTabState();
}

class _JournalTabState extends ConsumerState<JournalTab> {
  final _journal = TextEditingController();
  JournalAnalyzeResult? _result;
  String? _error;
  bool _submitting = false;
  bool _gentlerHandling = false;
  bool _livingField = true;
  bool _draftSaving = false;
  String? _draftId;
  String? _draftStatus;
  Timer? _draftTimer;

  @override
  void initState() {
    super.initState();
    _gentlerHandling = (widget.session.user?.intensityLevel ?? 3) <= 2;
  }

  @override
  void dispose() {
    _draftTimer?.cancel();
    _journal.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final prompt = ref.watch(journalPromptProvider);
    final wordCount = _wordCount(_journal.text);
    final needsMoreContext =
        _journal.text.trim().isNotEmpty && _journal.text.trim().length < 20;

    return Stack(
      children: [
        Positioned.fill(child: _MobileLivingField(enabled: _livingField)),
        ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text(
              l10n.journalTitle,
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              l10n.journalHelper,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 16),
            prompt.when(
              loading: () => const LinearProgressIndicator(),
              error: (_, _) => const SizedBox.shrink(),
              data: (value) => _JournalPromptCard(prompt: value),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _journal,
              onChanged: _handleJournalChanged,
              minLines: 8,
              maxLines: 14,
              textInputAction: TextInputAction.newline,
              decoration: InputDecoration(
                labelText: l10n.tabJournal,
                hintText: l10n.journalPlaceholder,
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '${l10n.wordCount(wordCount)} · ${_draftSaving ? l10n.draftSaving : (_draftStatus ?? l10n.privacyBody)}',
              style: Theme.of(context).textTheme.bodySmall,
            ),
            if (needsMoreContext) ...[
              const SizedBox(height: 8),
              Text(
                l10n.journalHelper,
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: _submitting ? null : _submitJournal,
              icon: const Icon(Icons.auto_awesome),
              label: Text(_submitting ? l10n.reflecting : l10n.askCouncil),
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              Text(
                _error!,
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            ],
            const SizedBox(height: 20),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    _LanguageSelector(language: widget.session.language),
                    const SizedBox(height: 8),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      value: _gentlerHandling,
                      title: Text(l10n.gentlerHandling),
                      subtitle: Text(l10n.gentlerHandlingSubtitle),
                      onChanged: (value) =>
                          setState(() => _gentlerHandling = value),
                    ),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      value: widget.session.user?.patternMemoryEnabled == true,
                      title: Text(l10n.patternMemory),
                      subtitle: Text(l10n.patternMemorySubtitle),
                      onChanged: (value) {
                        ref
                            .read(sessionControllerProvider.notifier)
                            .updateReflectionPreferences(
                              patternMemoryEnabled: value,
                            );
                        ref.invalidate(patternsProvider);
                        ref.invalidate(dashboardProvider);
                      },
                    ),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      value: _livingField,
                      title: Text(l10n.livingField),
                      subtitle: Text(l10n.livingFieldSubtitle),
                      onChanged: (value) =>
                          setState(() => _livingField = value),
                    ),
                  ],
                ),
              ),
            ),
            if (_result != null) ...[
              const SizedBox(height: 24),
              _CouncilResultCard(result: _result!),
            ],
          ],
        ),
      ],
    );
  }

  void _handleJournalChanged(String value) {
    setState(() {
      _draftStatus = null;
      _error = null;
    });
    _draftTimer?.cancel();
    if (value.trim().isEmpty) return;
    _draftTimer = Timer(const Duration(milliseconds: 900), _saveDraft);
  }

  Future<void> _saveDraft() async {
    final text = _journal.text.trim();
    if (text.isEmpty || _draftSaving) return;
    setState(() => _draftSaving = true);
    try {
      final draftId = await ref
          .read(apiClientProvider)
          .saveJournalDraft(text, draftId: _draftId);
      if (!mounted) return;
      setState(() {
        _draftId = draftId;
        _draftSaving = false;
        _draftStatus = AppLocalizations.of(context).draftSaved;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _draftSaving = false;
        _error = AppLocalizations.of(context).saveError;
      });
    }
  }

  Future<void> _submitJournal() async {
    final text = _journal.text.trim();
    if (text.isEmpty) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final result = await ref
          .read(apiClientProvider)
          .analyzeJournal(text, gentlerHandling: _gentlerHandling);
      final draftId = _draftId;
      if (draftId != null) {
        await ref.read(apiClientProvider).deleteJournalDraft(draftId);
        _draftId = null;
      }
      ref.invalidate(dashboardProvider);
      ref.invalidate(savedSessionsProvider);
      ref.invalidate(patternsProvider);
      setState(() => _result = result);
    } catch (_) {
      setState(() => _error = AppLocalizations.of(context).saveError);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }
}

class _JournalPromptCard extends StatelessWidget {
  const _JournalPromptCard({required this.prompt});

  final MobileJournalPrompt prompt;

  @override
  Widget build(BuildContext context) {
    final threshold = prompt.prompt;
    final l10n = AppLocalizations.of(context);
    if (threshold == null) {
      return _InfoCard(
        title: prompt.todayLabel.isEmpty ? l10n.today : prompt.todayLabel,
        body: l10n.noThresholdPrompt,
      );
    }
    final localizedThreshold = _localizedThresholdPrompt(l10n, threshold);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    l10n.thresholdLabel(threshold.month, threshold.day),
                    style: Theme.of(context).textTheme.labelLarge,
                  ),
                ),
                Text(localizedThreshold.theme),
              ],
            ),
            if (localizedThreshold.quote?.isNotEmpty == true) ...[
              const SizedBox(height: 12),
              Text(
                localizedThreshold.quote!,
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ],
            const SizedBox(height: 12),
            Text(localizedThreshold.frameOfThought),
            const SizedBox(height: 12),
            Text(
              localizedThreshold.socraticQuestion,
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ],
        ),
      ),
    );
  }
}

class _MobileLivingField extends StatefulWidget {
  const _MobileLivingField({required this.enabled});

  final bool enabled;

  @override
  State<_MobileLivingField> createState() => _MobileLivingFieldState();
}

class _MobileLivingFieldState extends State<_MobileLivingField>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 24),
    );
    final runningInWidgetTest = WidgetsBinding.instance.runtimeType
        .toString()
        .contains('TestWidgetsFlutterBinding');
    if (!runningInWidgetTest) _controller.repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    if (!widget.enabled) return const SizedBox.shrink();
    if (reduceMotion) {
      return const IgnorePointer(
        child: CustomPaint(painter: _LivingFieldPainter(phase: 0)),
      );
    }
    return IgnorePointer(
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) =>
            CustomPaint(painter: _LivingFieldPainter(phase: _controller.value)),
      ),
    );
  }
}

class _LivingFieldPainter extends CustomPainter {
  const _LivingFieldPainter({required this.phase});

  final double phase;

  @override
  void paint(Canvas canvas, Size size) {
    final tau = math.pi * 2;
    for (var index = 0; index < 28; index += 1) {
      final seedX = ((index * 47) % 101) / 101;
      final seedY = ((index * 71) % 103) / 103;
      final current = phase * tau + index * 0.67;
      final x = (seedX * size.width + math.sin(current) * 9) % size.width;
      final y =
          (seedY * size.height + math.cos(current * 0.72) * 13) % size.height;
      final breath = (math.sin(current * 0.45) + 1) / 2;
      final paint = Paint()
        ..color = Color.lerp(
          const Color(0x1A8CA0FF),
          const Color(0x26D98436),
          breath,
        )!;
      canvas.drawCircle(Offset(x, y), 0.7 + breath * 1.1, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _LivingFieldPainter oldDelegate) =>
      oldDelegate.phase != phase;
}

MobileThresholdPrompt _localizedThresholdPrompt(
  AppLocalizations l10n,
  MobileThresholdPrompt threshold,
) {
  final translationKey = _thresholdTranslationKey(threshold);

  if (translationKey == 'purposeGiftResponsibility') {
    return MobileThresholdPrompt(
      month: threshold.month,
      day: threshold.day,
      theme: l10n.thresholdPurposeGiftTheme,
      quote: l10n.thresholdPurposeGiftQuote,
      frameOfThought: l10n.thresholdPurposeGiftFrameOfThought,
      socraticQuestion: l10n.thresholdPurposeGiftSocraticQuestion,
      translationKey: translationKey,
    );
  }

  if (translationKey != 'purpose') return threshold;

  return MobileThresholdPrompt(
    month: threshold.month,
    day: threshold.day,
    theme: l10n.thresholdPurposeTheme,
    quote: l10n.thresholdPurposeQuote,
    frameOfThought: l10n.thresholdPurposeFrameOfThought,
    socraticQuestion: l10n.thresholdPurposeSocraticQuestion,
    translationKey: threshold.translationKey,
  );
}

String? _thresholdTranslationKey(MobileThresholdPrompt threshold) {
  if (threshold.translationKey case final translationKey?) {
    return translationKey;
  }

  final quote = threshold.quote?.trim().toLowerCase();
  final frame = threshold.frameOfThought.trim().toLowerCase();
  final question = threshold.socraticQuestion.trim().toLowerCase();

  if (quote == 'every gift carries responsibility.' ||
      frame == 'awareness of a gift invites its expression.' ||
      question == 'what gift are you not fully using?') {
    return 'purposeGiftResponsibility';
  }

  if (quote == 'the soul whispers before destiny speaks.' ||
      frame ==
          'purpose rarely arrives as a command. it often begins as a quiet invitation.' ||
      question == 'what invitation have you been ignoring?') {
    return 'purpose';
  }

  return null;
}

class SavedSessionsTab extends ConsumerWidget {
  const SavedSessionsTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessions = ref.watch(savedSessionsProvider);
    return _AsyncList(
      value: sessions,
      onRefresh: () => ref.invalidate(savedSessionsProvider),
      builder: (items) => [
        Text(
          AppLocalizations.of(context).savedReflections,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 16),
        if (items.isEmpty)
          _InfoCard(
            title: AppLocalizations.of(context).nothingSavedTitle,
            body: AppLocalizations.of(context).noSavedTitle,
          )
        else
          for (final item in items)
            _SessionSummaryCard(
              session: item,
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) =>
                        SavedSessionDetailScreen(sessionId: item.id),
                  ),
                );
              },
            ),
      ],
    );
  }
}

class SavedSessionDetailScreen extends ConsumerStatefulWidget {
  const SavedSessionDetailScreen({required this.sessionId, super.key});

  final String sessionId;

  @override
  ConsumerState<SavedSessionDetailScreen> createState() =>
      _SavedSessionDetailScreenState();
}

class _SavedSessionDetailScreenState
    extends ConsumerState<SavedSessionDetailScreen> {
  late Future<MobileSavedSessionDetail> _future;
  final _scrollController = ScrollController();
  final _correctionKey = GlobalKey();
  final _actionKey = GlobalKey();

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<MobileSavedSessionDetail> _load() {
    return ref.read(apiClientProvider).getSavedSession(widget.sessionId);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _refresh() {
    setState(() => _future = _load());
    ref.invalidate(savedSessionsProvider);
    ref.invalidate(dashboardProvider);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(AppLocalizations.of(context).savedReflectionTitle),
      ),
      bottomNavigationBar: SafeArea(
        top: false,
        child: DecoratedBox(
          decoration: const BoxDecoration(
            color: Color(0xFF080C18),
            border: Border(top: BorderSide(color: Color(0xFF34303B))),
          ),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _scrollTo(_correctionKey),
                    child: Text(AppLocalizations.of(context).correctThis),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: FilledButton(
                    onPressed: () => _scrollTo(_actionKey),
                    child: Text(
                      AppLocalizations.of(context).reviewCarryForward,
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
      body: Stack(
        fit: StackFit.expand,
        children: [
          const ColoredBox(color: Color(0xFF050914)),
          Positioned.fill(
            child: Opacity(
              opacity: 0.46,
              child: Image.asset(
                'assets/images/mineral-boundary-v3-portrait.png',
                fit: BoxFit.cover,
                alignment: Alignment.centerLeft,
                excludeFromSemantics: true,
              ),
            ),
          ),
          FutureBuilder<MobileSavedSessionDetail>(
            future: _future,
            builder: (context, snapshot) {
              if (snapshot.connectionState != ConnectionState.done) {
                return const Center(child: CircularProgressIndicator());
              }
              if (snapshot.hasError) {
                return _ErrorState(
                  message: AppLocalizations.of(context).loadError,
                  onRetry: _refresh,
                );
              }
              final session = snapshot.requireData;
              return ListView(
                controller: _scrollController,
                padding: const EdgeInsets.fromLTRB(24, 28, 24, 112),
                children: [
                  Text(
                    AppLocalizations.of(context).reflectionToConsider,
                    style: Theme.of(context).textTheme.headlineMedium,
                  ),
                  const SizedBox(height: 12),
                  Container(
                    width: 52,
                    height: 2,
                    color: const Color(0xFFD98436),
                  ),
                  const SizedBox(height: 24),
                  _ObservatoryEvidenceCard(
                    eyebrow: AppLocalizations.of(context).journalTitle,
                    body: session.journalText,
                    memberAuthored: true,
                  ),
                  const SizedBox(height: 24),
                  if (session.avatarResponse != null)
                    _AvatarResponseCard(response: session.avatarResponse!),
                  if (session.avatarResponse != null)
                    const SizedBox(height: 12),
                  if (session.synthesis != null)
                    _InfoCard(
                      title: session.synthesis!.integratorQuestion,
                      body: session.synthesis!.integrationStep,
                    ),
                  const SizedBox(height: 12),
                  if (session.reflectionSession?.dimensions.isNotEmpty ==
                      true) ...[
                    const SizedBox(height: 16),
                    for (final (index, dimension)
                        in session.reflectionSession!.dimensions.indexed)
                      _MobileDimensionFacet(
                        key: index == 0 ? _correctionKey : null,
                        reflectionSessionId: session.reflectionSession!.id,
                        dimension: dimension,
                        correction: _latestCorrectionFor(
                          session.reflectionSession!.corrections,
                          dimension.dimension,
                        ),
                        onSaved: _refresh,
                      ),
                  ] else if (session.messages.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    for (final message in session.messages)
                      _ObservatoryFacetCard(
                        title: message.displayName,
                        body: message.abstained
                            ? AppLocalizations.of(context).grounding
                            : message.content,
                      ),
                  ],
                  _SourceGroundingCard(
                    sourceGrounding: session.sourceGrounding,
                  ),
                  _FeedbackEmbodimentSection(
                    key: _actionKey,
                    session: session,
                    onSaved: _refresh,
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  void _scrollTo(GlobalKey key) {
    final targetContext = key.currentContext;
    if (targetContext == null) return;
    Scrollable.ensureVisible(
      targetContext,
      duration: const Duration(milliseconds: 360),
      curve: Curves.easeOutCubic,
      alignment: 0.08,
    );
  }
}

class _ObservatoryEvidenceCard extends StatelessWidget {
  const _ObservatoryEvidenceCard({
    required this.eyebrow,
    required this.body,
    this.memberAuthored = false,
  });

  final String eyebrow;
  final String body;
  final bool memberAuthored;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xE80B1020),
        border: Border.all(
          color: memberAuthored
              ? const Color(0xFFB96F34)
              : const Color(0xFF34303B),
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            eyebrow.toUpperCase(),
            style: Theme.of(context).textTheme.labelSmall?.copyWith(
              color: const Color(0xFFD98436),
              letterSpacing: 1.5,
            ),
          ),
          const SizedBox(height: 12),
          Text(body, style: Theme.of(context).textTheme.bodyLarge),
        ],
      ),
    );
  }
}

class _ObservatoryFacetCard extends StatelessWidget {
  const _ObservatoryFacetCard({required this.title, required this.body});

  final String title;
  final String body;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.fromLTRB(18, 16, 18, 16),
      decoration: const BoxDecoration(
        color: Color(0xE8101424),
        border: Border(
          left: BorderSide(color: Color(0xFFD98436), width: 2),
          top: BorderSide(color: Color(0xFF34303B)),
          right: BorderSide(color: Color(0xFF34303B)),
          bottom: BorderSide(color: Color(0xFF34303B)),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Text(body),
        ],
      ),
    );
  }
}

class _MobileDimensionFacet extends ConsumerStatefulWidget {
  const _MobileDimensionFacet({
    required this.reflectionSessionId,
    required this.dimension,
    required this.onSaved,
    this.correction,
    super.key,
  });

  final String reflectionSessionId;
  final MobileDimensionReflection dimension;
  final MobileReflectionCorrection? correction;
  final VoidCallback onSaved;

  @override
  ConsumerState<_MobileDimensionFacet> createState() =>
      _MobileDimensionFacetState();
}

class _MobileDimensionFacetState extends ConsumerState<_MobileDimensionFacet> {
  final _controller = TextEditingController();
  bool _editing = false;
  bool _saving = false;
  String? _message;

  @override
  void initState() {
    super.initState();
    _controller.text = widget.correction?.note ?? '';
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final correction = widget.correction;
    final body =
        [
              widget.dimension.observationText,
              widget.dimension.tentativeInterpretation,
            ]
            .whereType<String>()
            .where((value) => value.trim().isNotEmpty)
            .join('\n\n');

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.fromLTRB(18, 16, 18, 16),
      decoration: const BoxDecoration(
        color: Color(0xE8101424),
        border: Border(
          left: BorderSide(color: Color(0xFFD98436), width: 2),
          top: BorderSide(color: Color(0xFF34303B)),
          right: BorderSide(color: Color(0xFF34303B)),
          bottom: BorderSide(color: Color(0xFF34303B)),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            _dimensionLabel(l10n, widget.dimension.dimension),
            style: Theme.of(context).textTheme.titleMedium,
          ),
          if (body.isNotEmpty) ...[const SizedBox(height: 8), Text(body)],
          if (correction?.correctionType == 'correct' &&
              correction?.note?.isNotEmpty == true) ...[
            const SizedBox(height: 14),
            Text(
              l10n.memberCorrection,
              style: Theme.of(
                context,
              ).textTheme.labelMedium?.copyWith(color: const Color(0xFFD98436)),
            ),
            const SizedBox(height: 6),
            Text(correction!.note!),
          ],
          const SizedBox(height: 14),
          if (correction != null)
            OutlinedButton.icon(
              onPressed: _saving ? null : () => _restore(correction.id),
              icon: const Icon(Icons.restore, size: 18),
              label: Text(l10n.restore),
            )
          else ...[
            Row(
              children: [
                Expanded(
                  child: FilledButton(
                    onPressed: _saving
                        ? null
                        : () => setState(() => _editing = true),
                    child: Text(l10n.correctThis),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton(
                    onPressed: _saving ? null : () => _save('suppress'),
                    child: Text(l10n.doesNotFit),
                  ),
                ),
              ],
            ),
            if (_editing) ...[
              const SizedBox(height: 14),
              TextField(
                controller: _controller,
                onChanged: (_) => setState(() {}),
                minLines: 3,
                maxLines: 5,
                maxLength: 500,
                decoration: InputDecoration(
                  labelText: l10n.correctionPrompt,
                  alignLabelWithHint: true,
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: FilledButton(
                      onPressed: _saving || _controller.text.trim().isEmpty
                          ? null
                          : () => _save('correct'),
                      child: Text(l10n.saveCorrection),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _saving
                          ? null
                          : () => setState(() => _editing = false),
                      child: Text(l10n.cancel),
                    ),
                  ),
                ],
              ),
            ],
          ],
          if (_message != null) ...[
            const SizedBox(height: 10),
            Text(_message!, semanticsLabel: _message),
          ],
        ],
      ),
    );
  }

  Future<void> _save(String correctionType) async {
    final l10n = AppLocalizations.of(context);
    setState(() {
      _saving = true;
      _message = null;
    });
    try {
      await ref
          .read(apiClientProvider)
          .saveReflectionCorrection(
            reflectionSessionId: widget.reflectionSessionId,
            dimension: widget.dimension.dimension,
            correctionType: correctionType,
            note: correctionType == 'correct' ? _controller.text : null,
          );
      if (!mounted) return;
      setState(() {
        _saving = false;
        _editing = false;
        _message = l10n.correctionSaved;
      });
      widget.onSaved();
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _saving = false;
        _message = l10n.correctionError;
      });
    }
  }

  Future<void> _restore(String correctionId) async {
    final l10n = AppLocalizations.of(context);
    setState(() {
      _saving = true;
      _message = null;
    });
    try {
      await ref
          .read(apiClientProvider)
          .restoreReflectionCorrection(correctionId);
      if (!mounted) return;
      setState(() {
        _saving = false;
        _message = l10n.correctionSaved;
      });
      widget.onSaved();
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _saving = false;
        _message = l10n.correctionError;
      });
    }
  }
}

String _dimensionLabel(AppLocalizations l10n, String value) {
  return switch (value.toLowerCase()) {
    'perception' => l10n.protectorRole,
    'story' => l10n.conditionedSelfRole,
    'fear' => l10n.visionaryRole,
    'ego' => l10n.truthSelfRole,
    'genius' => l10n.geniusRole,
    'supraconscious' => l10n.supraconsciousRole,
    'embodiment' => l10n.embodimentRole,
    _ => value,
  };
}

MobileReflectionCorrection? _latestCorrectionFor(
  List<MobileReflectionCorrection> corrections,
  String dimension,
) {
  for (final correction in corrections.reversed) {
    if (correction.dimension == dimension) return correction;
  }
  return null;
}

class _AvatarResponseCard extends StatelessWidget {
  const _AvatarResponseCard({required this.response});

  final MobileAvatarResponse response;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              AppLocalizations.of(context).guideResponse,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            if (response.openingLine.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(response.openingLine),
            ],
            if (response.mirror.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(
                response.mirror,
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ],
            if (response.patternName.isNotEmpty) ...[
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerLeft,
                child: Chip(label: Text(response.patternName)),
              ),
            ],
            if (response.contradiction.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(response.contradiction),
            ],
            if (response.socraticQuestion.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(
                response.socraticQuestion,
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ],
            if (response.integrationStep.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(response.integrationStep),
            ],
            if (response.closingLine.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(response.closingLine),
            ],
          ],
        ),
      ),
    );
  }
}

class _SourceGroundingCard extends StatelessWidget {
  const _SourceGroundingCard({required this.sourceGrounding});

  final MobileSourceGrounding sourceGrounding;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(top: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              AppLocalizations.of(context).sourceGrounding,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(sourceGrounding.message),
            if (sourceGrounding.selectedSources.isNotEmpty) ...[
              const SizedBox(height: 12),
              for (final source in sourceGrounding.selectedSources)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        source.title,
                        style: Theme.of(context).textTheme.labelLarge,
                      ),
                      if (source.displayExcerpt?.isNotEmpty == true)
                        Text(source.displayExcerpt!),
                    ],
                  ),
                ),
            ],
          ],
        ),
      ),
    );
  }
}

class _FeedbackEmbodimentSection extends ConsumerStatefulWidget {
  const _FeedbackEmbodimentSection({
    required this.session,
    required this.onSaved,
    super.key,
  });

  final MobileSavedSessionDetail session;
  final VoidCallback onSaved;

  @override
  ConsumerState<_FeedbackEmbodimentSection> createState() =>
      _FeedbackEmbodimentSectionState();
}

class _FeedbackEmbodimentSectionState
    extends ConsumerState<_FeedbackEmbodimentSection> {
  final _feedbackNote = TextEditingController();
  final _embodiment = TextEditingController();
  String _feedbackType = 'helpful';
  String? _message;
  bool _savingFeedback = false;
  bool _savingEmbodiment = false;

  @override
  void dispose() {
    _feedbackNote.dispose();
    _embodiment.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Card(
      margin: const EdgeInsets.only(top: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              l10n.sessionStatus,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              '${widget.session.feedback.isNotEmpty ? l10n.feedbackSaved : l10n.feedbackNeeded} · ${widget.session.embodimentGateResponses.isNotEmpty ? l10n.gateSaved : l10n.gateOpen}',
            ),
            if (widget.session.feedback.isNotEmpty) ...[
              const SizedBox(height: 8),
              for (final feedback in widget.session.feedback)
                Text(
                  '${_formatFeedbackType(context, feedback.feedbackType)}${feedback.hasNote ? " · ${l10n.noteSaved}" : ""}',
                ),
            ],
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: _feedbackType,
              decoration: InputDecoration(labelText: l10n.feedbackLabel),
              items: [
                DropdownMenuItem(value: 'helpful', child: Text(l10n.helpful)),
                DropdownMenuItem(
                  value: 'not_accurate',
                  child: Text(l10n.notAccurate),
                ),
                DropdownMenuItem(
                  value: 'too_intense',
                  child: Text(l10n.tooIntense),
                ),
                DropdownMenuItem(value: 'unclear', child: Text(l10n.unclear)),
                DropdownMenuItem(
                  value: 'unsupported_source',
                  child: Text(l10n.unsupportedSource),
                ),
              ],
              onChanged: (value) {
                if (value != null) setState(() => _feedbackType = value);
              },
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _feedbackNote,
              minLines: 2,
              maxLines: 4,
              decoration: InputDecoration(
                labelText: l10n.optionalFeedbackNote,
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 12),
            FilledButton(
              onPressed: _savingFeedback ? null : _saveFeedback,
              child: Text(_savingFeedback ? l10n.saving : l10n.saveFeedback),
            ),
            const SizedBox(height: 18),
            TextField(
              controller: _embodiment,
              minLines: 2,
              maxLines: 4,
              decoration: InputDecoration(
                labelText: l10n.embodimentPrompt,
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: _savingEmbodiment ? null : _saveEmbodiment,
              child: Text(
                _savingEmbodiment ? l10n.saving : l10n.saveEmbodimentGate,
              ),
            ),
            if (_message != null) ...[
              const SizedBox(height: 10),
              Text(_message!),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _saveFeedback() async {
    final l10n = AppLocalizations.of(context);
    final savedMessage = l10n.feedbackSavedMessage;
    final errorMessage = l10n.saveError;
    setState(() {
      _savingFeedback = true;
      _message = null;
    });
    try {
      await ref
          .read(apiClientProvider)
          .submitFeedback(
            councilSessionId: widget.session.id,
            feedbackType: _feedbackType,
            note: _feedbackNote.text,
          );
      _feedbackNote.clear();
      _message = savedMessage;
      widget.onSaved();
    } catch (_) {
      _message = errorMessage;
    } finally {
      if (mounted) setState(() => _savingFeedback = false);
    }
  }

  Future<void> _saveEmbodiment() async {
    final l10n = AppLocalizations.of(context);
    final savedMessage = l10n.embodimentSavedMessage;
    final errorMessage = l10n.saveError;
    final text = _embodiment.text.trim();
    if (text.isEmpty) return;
    setState(() {
      _savingEmbodiment = true;
      _message = null;
    });
    try {
      await ref
          .read(apiClientProvider)
          .saveEmbodiment(councilSessionId: widget.session.id, text: text);
      _embodiment.clear();
      _message = savedMessage;
      widget.onSaved();
    } catch (_) {
      _message = errorMessage;
    } finally {
      if (mounted) setState(() => _savingEmbodiment = false);
    }
  }
}

class PatternsTab extends ConsumerWidget {
  const PatternsTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final patterns = ref.watch(patternsProvider);
    return _AsyncList(
      value: patterns,
      onRefresh: () => ref.invalidate(patternsProvider),
      builder: (items) => [
        Text(
          AppLocalizations.of(context).patternsTitle,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 8),
        Text(
          AppLocalizations.of(context).patternsSubtitle,
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 16),
        if (items.isEmpty)
          _InfoCard(
            title: AppLocalizations.of(context).patternsEmptyTitle,
            body: AppLocalizations.of(context).patternsEmptyBody,
          )
        else
          for (final pattern in items) _PatternCard(pattern: pattern),
      ],
    );
  }
}

class GuideTab extends ConsumerWidget {
  const GuideTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final guide = ref.watch(guideProvider);
    return _AsyncList(
      value: guide,
      onRefresh: () => ref.invalidate(guideProvider),
      builder: (data) {
        return [
          Text(
            AppLocalizations.of(context).yourGuide,
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          const SizedBox(height: 8),
          _InfoCard(
            title: data.name,
            body:
                'The Guide remains constant while your capacity to perceive and choose develops.',
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _StatCard(
                label: AppLocalizations.of(context).tone,
                value: data.avatarTone,
              ),
              _StatCard(
                label: AppLocalizations.of(context).intensity,
                value: '${data.intensityLevel}/5',
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text(
            data.frameworkName,
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          for (final dimension in data.dimensions)
            Card(
              margin: const EdgeInsets.only(bottom: 10),
              child: ListTile(
                leading: const CircleAvatar(
                  child: Icon(Icons.visibility_outlined),
                ),
                title: Text(dimension.name),
                subtitle: Text(
                  '${dimension.question}\n${dimension.distinction}',
                ),
              ),
            ),
        ];
      },
    );
  }
}

class _PatternCard extends ConsumerWidget {
  const _PatternCard({required this.pattern});

  final MobilePattern pattern;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    pattern.patternLabel,
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                ),
                Chip(label: Text('${pattern.evidenceCount}x')),
              ],
            ),
            const SizedBox(height: 8),
            if (pattern.examples.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(pattern.examples.first),
            ],
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _PatternAction(
                  pattern.id,
                  'helpful',
                  AppLocalizations.of(context).helpful,
                ),
                _PatternAction(
                  pattern.id,
                  'not_accurate',
                  AppLocalizations.of(context).notAccurate,
                ),
                _PatternAction(
                  pattern.id,
                  'too_intense',
                  AppLocalizations.of(context).tooIntense,
                ),
                _PatternAction(
                  pattern.id,
                  pattern.active ? 'suppress' : 'restore',
                  pattern.active
                      ? AppLocalizations.of(context).hide
                      : AppLocalizations.of(context).restore,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _PatternAction extends ConsumerWidget {
  const _PatternAction(this.patternId, this.feedbackType, this.label);

  final String patternId;
  final String feedbackType;
  final String label;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return OutlinedButton(
      onPressed: () async {
        await ref
            .read(apiClientProvider)
            .submitPatternFeedback(
              patternMemoryId: patternId,
              feedbackType: feedbackType,
            );
        ref.invalidate(patternsProvider);
        ref.invalidate(dashboardProvider);
      },
      child: Text(label),
    );
  }
}

class SettingsTab extends ConsumerWidget {
  const SettingsTab({required this.session, super.key});

  final MobileSession session;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final user = session.user;
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text(
          l10n.settingsTitle,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 16),
        _InfoCard(
          title: user?.email ?? l10n.accountFallback,
          body: l10n.privacyBody,
        ),
        const SizedBox(height: 12),
        _InfoCard(
          title: l10n.languageTitle,
          body: l10n.languageSubtitle,
          child: Padding(
            padding: const EdgeInsets.only(top: 12),
            child: _LanguageSelector(language: session.language),
          ),
        ),
        const SizedBox(height: 12),
        SwitchListTile(
          value: user?.patternMemoryEnabled == true,
          title: Text(l10n.patternMemory),
          subtitle: Text(l10n.patternMemorySubtitle),
          onChanged: (value) {
            ref
                .read(sessionControllerProvider.notifier)
                .updateReflectionPreferences(patternMemoryEnabled: value);
            ref.invalidate(patternsProvider);
            ref.invalidate(dashboardProvider);
          },
        ),
      ],
    );
  }
}

class _LanguageSelector extends ConsumerWidget {
  const _LanguageSelector({required this.language, this.compact = false});

  final MobileLanguageState language;
  final bool compact;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final localLanguage = ref.watch(localLanguageControllerProvider);
    final current = localLanguage.hasExplicitPreference
        ? localLanguage.code
        : language.current;
    final supported = language.supported.isEmpty
        ? fallbackSupportedLanguages
        : language.supported;
    final selected = supported.firstWhere(
      (item) => item.code == current,
      orElse: () => fallbackSupportedLanguages.first,
    );

    return DropdownButtonHideUnderline(
      child: DecoratedBox(
        decoration: BoxDecoration(
          color: compact ? const Color(0x1AFFFFFF) : const Color(0x0DFFFFFF),
          border: Border.all(color: const Color(0x22FFFFFF)),
          borderRadius: BorderRadius.circular(compact ? 999 : 16),
        ),
        child: Padding(
          padding: EdgeInsets.symmetric(
            horizontal: compact ? 12 : 14,
            vertical: compact ? 2 : 4,
          ),
          child: ConstrainedBox(
            constraints: BoxConstraints(minWidth: compact ? 156 : 0),
            child: DropdownButton<String>(
              value: selected.code,
              isExpanded: compact,
              borderRadius: BorderRadius.circular(16),
              dropdownColor: const Color(0xFF211A30),
              iconEnabledColor: const Color(0xFFE9D9B7),
              style: Theme.of(
                context,
              ).textTheme.bodyMedium?.copyWith(color: const Color(0xFFFFF8EA)),
              selectedItemBuilder: (context) => supported
                  .map(
                    (item) => Row(
                      mainAxisSize: compact
                          ? MainAxisSize.max
                          : MainAxisSize.min,
                      children: [
                        Text(item.flag, style: const TextStyle(fontSize: 18)),
                        const SizedBox(width: 8),
                        Flexible(
                          child: Text(
                            item.nativeLabel,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  )
                  .toList(),
              items: supported
                  .map(
                    (item) => DropdownMenuItem(
                      value: item.code,
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(item.flag, style: const TextStyle(fontSize: 18)),
                          const SizedBox(width: 10),
                          Flexible(child: Text(item.nativeLabel)),
                        ],
                      ),
                    ),
                  )
                  .toList(),
              onChanged: (value) async {
                if (value == null) return;
                await ref
                    .read(localLanguageControllerProvider.notifier)
                    .setLanguage(value);
                final session = ref.read(sessionControllerProvider).valueOrNull;
                if (session?.authenticated == true) {
                  await ref
                      .read(sessionControllerProvider.notifier)
                      .updateLanguagePreference(value);
                }
              },
            ),
          ),
        ),
      ),
    );
  }
}

class _AsyncList<T> extends StatelessWidget {
  const _AsyncList({
    required this.value,
    required this.builder,
    required this.onRefresh,
  });

  final AsyncValue<T> value;
  final List<Widget> Function(T value) builder;
  final VoidCallback onRefresh;

  @override
  Widget build(BuildContext context) {
    return value.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => _ErrorState(
        message: AppLocalizations.of(context).loadError,
        onRetry: onRefresh,
      ),
      data: (data) => RefreshIndicator(
        onRefresh: () async => onRefresh(),
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: builder(data),
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, this.onRetry});

  final String message;
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(message, textAlign: TextAlign.center),
            if (onRetry != null) ...[
              const SizedBox(height: 12),
              OutlinedButton(
                onPressed: onRetry,
                child: Text(AppLocalizations.of(context).retry),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 104,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: Theme.of(context).textTheme.labelMedium),
              const SizedBox(height: 8),
              Text(value, style: Theme.of(context).textTheme.headlineSmall),
            ],
          ),
        ),
      ),
    );
  }
}

class _SessionSummaryCard extends StatelessWidget {
  const _SessionSummaryCard({required this.session, this.onTap});

  final MobileSavedSessionSummary session;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final question = session.synthesis?.integratorQuestion;
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        onTap: onTap,
        title: Text(
          question?.isNotEmpty == true
              ? question!
              : AppLocalizations.of(context).savedReflectionFallback,
        ),
        subtitle: Text(session.journalEntry.excerpt),
        trailing: onTap == null ? null : const Icon(Icons.chevron_right),
      ),
    );
  }
}

class _CouncilResultCard extends StatelessWidget {
  const _CouncilResultCard({required this.result});

  final JournalAnalyzeResult result;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              AppLocalizations.of(context).councilReflection,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            Text(result.summary),
            if (result.openingLine.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(result.openingLine),
            ],
            if (result.mirror.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(
                result.mirror,
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ],
            if (result.patternName.isNotEmpty) ...[
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerLeft,
                child: Chip(label: Text(result.patternName)),
              ),
            ],
            if (result.contradiction.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(result.contradiction),
            ],
            if (result.integratorQuestion.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text(
                result.integratorQuestion,
                style: Theme.of(context).textTheme.titleMedium,
              ),
            ],
            if (result.integrationStep.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(result.integrationStep),
            ],
            if (result.closingLine.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(result.closingLine),
            ],
          ],
        ),
      ),
    );
  }
}

String _formatFeedbackType(BuildContext context, String feedbackType) {
  final l10n = AppLocalizations.of(context);
  return switch (feedbackType) {
    'helpful' => l10n.helpful,
    'not_accurate' => l10n.notAccurate,
    'too_intense' => l10n.tooIntense,
    'unclear' => l10n.unclear,
    'unsupported_source' => l10n.unsupportedSource,
    _ => l10n.feedbackTypeLabel(feedbackType),
  };
}

int _wordCount(String value) {
  final trimmed = value.trim();
  if (trimmed.isEmpty) return 0;
  return trimmed.split(RegExp(r'\s+')).length;
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.title, required this.body, this.child});

  final String title;
  final String body;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(body),
            ?child,
          ],
        ),
      ),
    );
  }
}

class _FoundationFrame extends StatelessWidget {
  const _FoundationFrame({required this.child, this.maxWidth = 430});

  final Widget child;
  final double maxWidth;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        fit: StackFit.expand,
        children: [
          const ColoredBox(color: Color(0xFF050914)),
          Positioned.fill(
            child: Opacity(
              opacity: 0.7,
              child: Image.asset(
                'assets/images/mineral-boundary-v3-portrait.png',
                fit: BoxFit.cover,
                alignment: Alignment.centerLeft,
                excludeFromSemantics: true,
              ),
            ),
          ),
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0x66050914),
                  Color(0xCC050914),
                  Color(0xF7050914),
                ],
              ),
            ),
          ),
          SafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) {
                final isTablet = constraints.maxWidth >= 700;
                return Center(
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      maxWidth: isTablet ? maxWidth : 430,
                    ),
                    child: SingleChildScrollView(
                      padding: EdgeInsets.symmetric(
                        horizontal: isTablet ? 48 : 24,
                        vertical: 28,
                      ),
                      child: ConstrainedBox(
                        constraints: BoxConstraints(
                          minHeight: (constraints.maxHeight - 56).clamp(
                            0,
                            double.infinity,
                          ),
                        ),
                        child: child,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _BrandHeader extends StatelessWidget {
  const _BrandHeader();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          AppLocalizations.of(context).brandName,
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
            color: const Color(0xFFD6C493),
            letterSpacing: 1.2,
          ),
        ),
        const SizedBox(height: 10),
        Text(
          AppLocalizations.of(context).appTitle,
          style: Theme.of(context).textTheme.displayMedium?.copyWith(
            color: const Color(0xFFFFF8EA),
            fontWeight: FontWeight.w500,
            height: 0.98,
          ),
        ),
        const SizedBox(height: 18),
        Text(
          AppLocalizations.of(context).tagline,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            color: const Color(0xFFE9D9B7),
            height: 1.24,
          ),
        ),
      ],
    );
  }
}

class _EnvironmentPill extends StatelessWidget {
  const _EnvironmentPill({required this.apiBaseUrl});

  final String apiBaseUrl;

  @override
  Widget build(BuildContext context) {
    return DecoratedBox(
      decoration: BoxDecoration(
        color: const Color(0x33151021),
        border: Border.all(color: const Color(0x33FFF8EA)),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        child: Text(
          AppLocalizations.of(context).apiLabel(apiBaseUrl),
          overflow: TextOverflow.ellipsis,
          textAlign: TextAlign.center,
          style: Theme.of(
            context,
          ).textTheme.bodySmall?.copyWith(color: const Color(0xBFFFF8EA)),
        ),
      ),
    );
  }
}
