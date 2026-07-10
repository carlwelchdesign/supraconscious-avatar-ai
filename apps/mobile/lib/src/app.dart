import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'mobile_api.dart';
import 'session_controller.dart';

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
          seedColor: const Color(0xFF7ECDBA),
          brightness: Brightness.dark,
        ),
        scaffoldBackgroundColor: const Color(0xFF151021),
        fontFamily: 'System',
      ),
      home: const MobileRoot(),
    );
  }
}

class MobileRoot extends ConsumerWidget {
  const MobileRoot({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final session = ref.watch(sessionControllerProvider);
    return session.when(
      loading: () => const _FoundationFrame(
        child: Center(child: CircularProgressIndicator()),
      ),
      error: (error, _) => AuthScreen(error: error.toString()),
      data: (value) {
        if (value.isUnauthenticated) return const AuthScreen();
        if (value.needsOnboarding) {
          return ConsentScreen(consent: value.consent);
        }
        return DashboardScreen(session: value);
      },
    );
  }
}

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({this.error, super.key});

  final String? error;

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _register = false;

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
          const SizedBox(height: 80),
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
            onPressed: () {
              final controller = ref.read(sessionControllerProvider.notifier);
              if (_register) {
                controller.register(_name.text, _email.text, _password.text);
              } else {
                controller.login(_email.text, _password.text);
              }
            },
            child: Text(_register ? 'Create Account' : 'Sign in'),
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

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({required this.session, super.key});

  final MobileSession session;

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
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
    final user = widget.session.user;
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
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            Text(
              user?.name?.isNotEmpty == true
                  ? 'Welcome, ${user!.name}'
                  : 'Welcome',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _journal,
              minLines: 7,
              maxLines: 12,
              textInputAction: TextInputAction.newline,
              decoration: const InputDecoration(
                labelText: 'Reflection',
                alignLabelWithHint: true,
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _submitting ? null : _submitJournal,
              child: Text(_submitting ? 'Reflecting...' : 'Ask the Council'),
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
              Text(
                'Council Reflection',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 12),
              Text(_result!.summary),
              if (_result!.integratorQuestion.isNotEmpty) ...[
                const SizedBox(height: 16),
                Text(
                  _result!.integratorQuestion,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ],
              if (_result!.integrationStep.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(_result!.integrationStep),
              ],
            ],
          ],
        ),
      ),
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
      setState(() => _result = result);
    } catch (error) {
      setState(() => _error = error.toString());
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }
}

class _FoundationFrame extends StatelessWidget {
  const _FoundationFrame({required this.child});

  final Widget child;

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
                    constraints: BoxConstraints(maxWidth: isTablet ? 760 : 430),
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
