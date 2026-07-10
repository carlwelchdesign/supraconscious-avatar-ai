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
      const GuideTab(),
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
            icon: Icon(Icons.auto_awesome_outlined),
            selectedIcon: Icon(Icons.auto_awesome),
            label: 'Guide',
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

  @override
  void initState() {
    super.initState();
    _future = _load();
  }

  Future<MobileSavedSessionDetail> _load() {
    return ref.read(apiClientProvider).getSavedSession(widget.sessionId);
  }

  void _refresh() {
    setState(() => _future = _load());
    ref.invalidate(savedSessionsProvider);
    ref.invalidate(dashboardProvider);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Saved reflection')),
      body: FutureBuilder<MobileSavedSessionDetail>(
        future: _future,
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
              if (session.avatarResponse != null)
                _AvatarResponseCard(response: session.avatarResponse!),
              if (session.avatarResponse != null) const SizedBox(height: 12),
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
              _SourceGroundingCard(sourceGrounding: session.sourceGrounding),
              _FeedbackEmbodimentSection(session: session, onSaved: _refresh),
            ],
          );
        },
      ),
    );
  }
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
              'Council reflection',
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
              'Source grounding',
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
    return Card(
      margin: const EdgeInsets.only(top: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Session status',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              '${widget.session.feedback.isNotEmpty ? "Feedback saved" : "Feedback needed"} · ${widget.session.embodimentGateResponses.isNotEmpty ? "Gate saved" : "Gate open"}',
            ),
            if (widget.session.feedback.isNotEmpty) ...[
              const SizedBox(height: 8),
              for (final feedback in widget.session.feedback)
                Text(
                  '${_formatFeedbackType(feedback.feedbackType)}${feedback.hasNote ? " · note saved" : ""}',
                ),
            ],
            const SizedBox(height: 16),
            DropdownButtonFormField<String>(
              initialValue: _feedbackType,
              decoration: const InputDecoration(labelText: 'Feedback'),
              items: const [
                DropdownMenuItem(value: 'helpful', child: Text('Helpful')),
                DropdownMenuItem(
                  value: 'not_accurate',
                  child: Text('Not accurate'),
                ),
                DropdownMenuItem(
                  value: 'too_intense',
                  child: Text('Too intense'),
                ),
                DropdownMenuItem(value: 'unclear', child: Text('Unclear')),
                DropdownMenuItem(
                  value: 'unsupported_source',
                  child: Text('Unsupported source'),
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
              decoration: const InputDecoration(
                labelText: 'Optional feedback note',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 12),
            FilledButton(
              onPressed: _savingFeedback ? null : _saveFeedback,
              child: Text(_savingFeedback ? 'Saving...' : 'Save feedback'),
            ),
            const SizedBox(height: 18),
            TextField(
              controller: _embodiment,
              minLines: 2,
              maxLines: 4,
              decoration: const InputDecoration(
                labelText: 'One small shift I can live today',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: _savingEmbodiment ? null : _saveEmbodiment,
              child: Text(
                _savingEmbodiment ? 'Saving...' : 'Save embodiment gate',
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
      _message = 'Feedback saved.';
      widget.onSaved();
    } catch (error) {
      _message = error.toString();
    } finally {
      if (mounted) setState(() => _savingFeedback = false);
    }
  }

  Future<void> _saveEmbodiment() async {
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
      _message = 'Embodiment gate saved.';
      widget.onSaved();
    } catch (error) {
      _message = error.toString();
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

class GuideTab extends ConsumerWidget {
  const GuideTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final guide = ref.watch(guideProvider);
    return _AsyncList(
      value: guide,
      onRefresh: () => ref.invalidate(guideProvider),
      builder: (data) {
        final current = _currentGuideStage(data);
        return [
          Text('Your guide', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          if (current != null)
            _InfoCard(
              title: '${current.name} · Stage ${data.currentStage} of 5',
              body: current.description,
            ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _StatCard(label: 'Tone', value: data.avatarTone),
              _StatCard(label: 'Intensity', value: '${data.intensityLevel}/5'),
              if (current != null)
                _StatCard(label: 'Trait', value: current.trait),
            ],
          ),
          const SizedBox(height: 24),
          Text(
            'The five stages',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 12),
          for (final stage in data.stages)
            Card(
              margin: const EdgeInsets.only(bottom: 10),
              child: ListTile(
                leading: CircleAvatar(child: Text('${stage.stage}')),
                title: Text(stage.name),
                subtitle: Text(stage.description),
                trailing: Chip(
                  label: Text(
                    stage.state == 'current'
                        ? stage.currentLabel
                        : stage.state == 'complete'
                        ? stage.completedLabel
                        : 'Locked',
                  ),
                ),
              ),
            ),
        ];
      },
    );
  }
}

MobileGuideStage? _currentGuideStage(MobileGuide guide) {
  for (final stage in guide.stages) {
    if (stage.stage == guide.currentStage) return stage;
  }
  return null;
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

String _formatFeedbackType(String feedbackType) {
  return feedbackType
      .split('_')
      .map(
        (part) => part.isEmpty
            ? part
            : '${part[0].toUpperCase()}${part.substring(1)}',
      )
      .join(' ');
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
