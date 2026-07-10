import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'mobile_api.dart';
import 'session_controller.dart';

enum _AuthMode { login, register }

class InnerCouncilMobileApp extends StatelessWidget {
  const InnerCouncilMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'The Inner Council',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF82D7C4),
          brightness: Brightness.dark,
        ),
        scaffoldBackgroundColor: const Color(0xFF151021),
        fontFamily: 'System',
        inputDecorationTheme: const InputDecorationTheme(
          border: OutlineInputBorder(),
        ),
      ),
      home: const MobileRoot(),
    );
  }
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
        error: error.toString(),
        onBack: _showLanding,
      ),
      data: (value) {
        if (value.isUnauthenticated) {
          final mode = _authMode;
          if (mode == null) {
            return LandingScreen(
              onCreateAccount: () => _showAuth(_AuthMode.register),
              onSignIn: () => _showAuth(_AuthMode.login),
            );
          }
          return AuthScreen(
            initialRegister: mode == _AuthMode.register,
            onBack: _showLanding,
          );
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
    required this.onCreateAccount,
    required this.onSignIn,
    super.key,
  });

  final VoidCallback onCreateAccount;
  final VoidCallback onSignIn;

  @override
  Widget build(BuildContext context) {
    return _FoundationFrame(
      maxWidth: 720,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const SizedBox(height: 56),
          const _LandingHero(),
          const SizedBox(height: 28),
          FilledButton(
            onPressed: onCreateAccount,
            child: const Text('Start Your First Reflection'),
          ),
          const SizedBox(height: 10),
          OutlinedButton(onPressed: onSignIn, child: const Text('Sign in')),
          const SizedBox(height: 36),
          const _LandingSection(
            eyebrow: 'The problem',
            title: 'You are not stuck. You are not seeing clearly.',
            body:
                'You have thought about it, analyzed it, replayed it, and still something in you hesitates.',
          ),
          const _LandingSection(
            eyebrow: 'How it works',
            title: 'Meet Your Inner Council',
            body:
                'You write what is on your mind. Four inner lenses reflect what is moving beneath the surface.',
          ),
          const _CouncilRoleGrid(),
          const _LandingSection(
            eyebrow: 'The experience',
            title: 'Write. See. Face. Choose. Become.',
            body:
                'Every session moves through a simple path: no noise, no overwhelm, just one clearer next step.',
          ),
          const _LandingSection(
            eyebrow: 'Different by design',
            title: 'Not another place to talk in circles.',
            body:
                'This is an identity reflection system, a decision clarity engine, and a mirror for becoming.',
          ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: onCreateAccount,
            child: const Text('Begin Your First Reflection'),
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'AI-powered identity reflection',
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
            color: const Color(0xFFD6C493),
            letterSpacing: 1.1,
          ),
        ),
        const SizedBox(height: 14),
        Text(
          'The Inner Council',
          style: Theme.of(context).textTheme.displayMedium?.copyWith(
            color: const Color(0xFFFFF8EA),
            fontWeight: FontWeight.w500,
            height: 0.96,
          ),
        ),
        const SizedBox(height: 22),
        Text(
          'This is not a journal.',
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
            color: const Color(0xFFFFF8EA),
            height: 1.05,
          ),
        ),
        Text(
          'This is where you meet yourself.',
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
            color: const Color(0xFFE9D9B7),
            fontStyle: FontStyle.italic,
          ),
        ),
        const SizedBox(height: 18),
        Text(
          'You do not need more advice. You need to see clearly. The Inner Council reveals what you already know, but have not faced.',
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

class _CouncilRoleGrid extends StatelessWidget {
  const _CouncilRoleGrid();

  static const _roles = [
    ('The Protector', 'Shows where fear is holding you back.'),
    ('The Conditioned Self', 'Reveals patterns you did not question.'),
    ('The Visionary', 'Shows who you are becoming.'),
    ('The Truth Self', 'Cuts through illusion.'),
  ];

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 28),
      child: Wrap(
        spacing: 10,
        runSpacing: 10,
        children: [
          for (final role in _roles)
            SizedBox(
              width: 320,
              child: _InfoCard(title: role.$1, body: role.$2),
            ),
        ],
      ),
    );
  }
}

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({
    required this.initialRegister,
    this.error,
    this.onBack,
    super.key,
  });

  final bool initialRegister;
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
    return _FoundationFrame(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Align(
            alignment: Alignment.centerLeft,
            child: TextButton.icon(
              onPressed: widget.onBack,
              icon: const Icon(Icons.arrow_back),
              label: const Text('Landing'),
            ),
          ),
          const SizedBox(height: 34),
          const _BrandHeader(),
          const SizedBox(height: 28),
          if (_register)
            TextField(
              controller: _name,
              textInputAction: TextInputAction.next,
              decoration: const InputDecoration(labelText: 'Name'),
            ),
          if (_register) const SizedBox(height: 12),
          TextField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            decoration: const InputDecoration(labelText: 'Email'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _password,
            obscureText: true,
            decoration: const InputDecoration(labelText: 'Password'),
          ),
          if (widget.error != null) ...[
            const SizedBox(height: 12),
            Text(
              widget.error!,
              style: TextStyle(color: Theme.of(context).colorScheme.error),
            ),
          ],
          const SizedBox(height: 20),
          FilledButton(
            onPressed: _submit,
            child: Text(_register ? 'Create account' : 'Sign in'),
          ),
          TextButton(
            onPressed: () => setState(() => _register = !_register),
            child: Text(_register ? 'Use existing account' : 'Create account'),
          ),
          const SizedBox(height: 40),
          _EnvironmentPill(apiBaseUrl: apiBaseUrl),
        ],
      ),
    );
  }

  void _submit() {
    final controller = ref.read(sessionControllerProvider.notifier);
    if (_register) {
      controller.register(_name.text, _email.text, _password.text);
    } else {
      controller.login(_email.text, _password.text);
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
            child: const Text('Continue'),
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
    final tabs = [
      DashboardTab(session: widget.session),
      const JournalTab(),
      const SavedSessionsTab(),
      const PatternsTab(),
      SettingsTab(session: widget.session),
    ];
    return Scaffold(
      appBar: AppBar(
        title: const Text('The Inner Council'),
        actions: [
          IconButton(
            tooltip: 'Sign out',
            onPressed: () =>
                ref.read(sessionControllerProvider.notifier).logout(),
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: SafeArea(child: tabs[_index]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (value) => setState(() => _index = value),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.edit_note_outlined),
            selectedIcon: Icon(Icons.edit_note),
            label: 'Journal',
          ),
          NavigationDestination(
            icon: Icon(Icons.history_outlined),
            selectedIcon: Icon(Icons.history),
            label: 'Saved',
          ),
          NavigationDestination(
            icon: Icon(Icons.insights_outlined),
            selectedIcon: Icon(Icons.insights),
            label: 'Patterns',
          ),
          NavigationDestination(
            icon: Icon(Icons.tune_outlined),
            selectedIcon: Icon(Icons.tune),
            label: 'Settings',
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
    final dashboard = ref.watch(dashboardProvider);
    return _AsyncList(
      value: dashboard,
      onRefresh: () => ref.invalidate(dashboardProvider),
      builder: (data) => [
        Text(
          data.greetingName?.isNotEmpty == true
              ? 'Welcome, ${data.greetingName}'
              : 'Welcome',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 16),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            _StatCard(label: 'Entries', value: '${data.entryCount}'),
            _StatCard(label: 'Patterns', value: '${data.activePatternCount}'),
            _StatCard(label: 'Guide stage', value: '${data.avatarStage}'),
          ],
        ),
        const SizedBox(height: 24),
        Text(
          'Recent reflections',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 12),
        if (data.recentSessions.isEmpty)
          const _InfoCard(
            title: 'No saved reflections yet',
            body: 'Write your first entry to begin building your practice.',
          )
        else
          for (final item in data.recentSessions)
            _SessionSummaryCard(session: item),
      ],
    );
  }
}

class JournalTab extends ConsumerStatefulWidget {
  const JournalTab({super.key});

  @override
  ConsumerState<JournalTab> createState() => _JournalTabState();
}

class _JournalTabState extends ConsumerState<JournalTab> {
  final _journal = TextEditingController();
  JournalAnalyzeResult? _result;
  String? _error;
  bool _submitting = false;

  @override
  void dispose() {
    _journal.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text(
          'New reflection',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _journal,
          minLines: 8,
          maxLines: 14,
          textInputAction: TextInputAction.newline,
          decoration: const InputDecoration(
            labelText: 'Reflection',
            alignLabelWithHint: true,
          ),
        ),
        const SizedBox(height: 16),
        FilledButton.icon(
          onPressed: _submitting ? null : _submitJournal,
          icon: const Icon(Icons.auto_awesome),
          label: Text(_submitting ? 'Reflecting...' : 'Ask the Council'),
        ),
        if (_error != null) ...[
          const SizedBox(height: 12),
          Text(
            _error!,
            style: TextStyle(color: Theme.of(context).colorScheme.error),
          ),
        ],
        if (_result != null) ...[
          const SizedBox(height: 24),
          _CouncilResultCard(result: _result!),
        ],
      ],
    );
  }

  Future<void> _submitJournal() async {
    final text = _journal.text.trim();
    if (text.isEmpty) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final result = await ref.read(apiClientProvider).analyzeJournal(text);
      ref.invalidate(dashboardProvider);
      ref.invalidate(savedSessionsProvider);
      ref.invalidate(patternsProvider);
      setState(() => _result = result);
    } catch (error) {
      setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }
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
          'Saved reflections',
          style: Theme.of(context).textTheme.headlineSmall,
        ),
        const SizedBox(height: 16),
        if (items.isEmpty)
          const _InfoCard(
            title: 'Nothing saved yet',
            body: 'Your council reflections will appear here after you write.',
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

class SavedSessionDetailScreen extends ConsumerWidget {
  const SavedSessionDetailScreen({required this.sessionId, super.key});

  final String sessionId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Saved reflection')),
      body: FutureBuilder<MobileSavedSessionDetail>(
        future: ref.read(apiClientProvider).getSavedSession(sessionId),
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return _ErrorState(message: snapshot.error.toString());
          }
          final session = snapshot.requireData;
          return ListView(
            padding: const EdgeInsets.all(24),
            children: [
              Text(
                'Journal entry',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 10),
              Text(session.journalText),
              const SizedBox(height: 24),
              if (session.synthesis != null)
                _InfoCard(
                  title: session.synthesis!.integratorQuestion,
                  body: session.synthesis!.integrationStep,
                ),
              const SizedBox(height: 12),
              for (final message in session.messages)
                _InfoCard(
                  title: message.displayName,
                  body: message.abstained ? 'Abstained.' : message.content,
                ),
            ],
          );
        },
      ),
    );
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
        Text('Patterns', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 8),
        Text(
          'Signals, not diagnoses. Patterns appear only after they recur.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 16),
        if (items.isEmpty)
          const _InfoCard(
            title: 'Patterns emerge over time',
            body: 'Keep writing. Recurring signals will appear here.',
          )
        else
          for (final pattern in items) _PatternCard(pattern: pattern),
      ],
    );
  }
}

class _PatternCard extends ConsumerWidget {
  const _PatternCard({required this.pattern});

  final MobilePattern pattern;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final confidence = (pattern.confidence * 100).round();
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
            Text('Confidence $confidence%'),
            if (pattern.examples.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(pattern.examples.first),
            ],
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _PatternAction(pattern.id, 'helpful', 'Helpful'),
                _PatternAction(pattern.id, 'not_accurate', 'Not accurate'),
                _PatternAction(pattern.id, 'too_intense', 'Too intense'),
                _PatternAction(
                  pattern.id,
                  pattern.active ? 'suppress' : 'restore',
                  pattern.active ? 'Hide' : 'Restore',
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
    final user = session.user;
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Text('Settings', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 16),
        _InfoCard(
          title: user?.email ?? 'Account',
          body:
              'Your journal entries stay private to this account and are used for reflection, safety checks, voice features, and pattern memory when enabled.',
        ),
        const SizedBox(height: 12),
        SwitchListTile(
          value: user?.patternMemoryEnabled == true,
          title: const Text('Pattern memory'),
          subtitle: const Text('Allow recurring signals to appear over time.'),
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
      error: (error, _) =>
          _ErrorState(message: error.toString(), onRetry: onRefresh),
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
              OutlinedButton(onPressed: onRetry, child: const Text('Retry')),
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
          question?.isNotEmpty == true ? question! : 'Saved reflection',
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
              'Council Reflection',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 12),
            Text(result.summary),
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
          ],
        ),
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  const _InfoCard({required this.title, required this.body});

  final String title;
  final String body;

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
          Image.asset(
            'assets/images/echo-eye-cosmos.png',
            fit: BoxFit.cover,
            semanticLabel: 'Cosmic eye artwork',
          ),
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  Color(0xDD151021),
                  Color(0xBB151021),
                  Color(0xF2151021),
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
          'Supraconscious',
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
            color: const Color(0xFFD6C493),
            letterSpacing: 1.2,
          ),
        ),
        const SizedBox(height: 10),
        Text(
          'The Inner Council',
          style: Theme.of(context).textTheme.displayMedium?.copyWith(
            color: const Color(0xFFFFF8EA),
            fontWeight: FontWeight.w500,
            height: 0.98,
          ),
        ),
        const SizedBox(height: 18),
        Text(
          'Write. See clearly. Choose consciously.',
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
          'API: $apiBaseUrl',
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
