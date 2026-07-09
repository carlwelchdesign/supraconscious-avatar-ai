import 'package:flutter/material.dart';

void main() {
  runApp(const InnerCouncilMobileApp());
}

class InnerCouncilMobileApp extends StatelessWidget {
  const InnerCouncilMobileApp({super.key});

  static const apiBaseUrl = String.fromEnvironment(
    'INNER_COUNCIL_API_BASE_URL',
    defaultValue: 'http://localhost:3000',
  );

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
      home: const MobileFoundationScreen(apiBaseUrl: apiBaseUrl),
    );
  }
}

class MobileFoundationScreen extends StatelessWidget {
  const MobileFoundationScreen({required this.apiBaseUrl, super.key});

  final String apiBaseUrl;

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
                    child: Padding(
                      padding: EdgeInsets.symmetric(
                        horizontal: isTablet ? 48 : 24,
                        vertical: 28,
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            'Supraconscious',
                            style: Theme.of(context).textTheme.labelLarge
                                ?.copyWith(
                                  color: const Color(0xFFD6C493),
                                  letterSpacing: 1.2,
                                ),
                          ),
                          const Spacer(),
                          Text(
                            'The Inner Council',
                            style: Theme.of(context).textTheme.displayMedium
                                ?.copyWith(
                                  color: const Color(0xFFFFF8EA),
                                  fontWeight: FontWeight.w500,
                                  height: 0.98,
                                ),
                          ),
                          const SizedBox(height: 18),
                          Text(
                            'Write. See clearly. Choose consciously.',
                            style: Theme.of(context).textTheme.titleLarge
                                ?.copyWith(
                                  color: const Color(0xFFE9D9B7),
                                  height: 1.24,
                                ),
                          ),
                          const SizedBox(height: 22),
                          Text(
                            'This mobile foundation is ready for the next step: connect auth, onboarding, journal submission, council results, feedback, and saved sessions to the existing backend.',
                            style: Theme.of(context).textTheme.bodyLarge
                                ?.copyWith(
                                  color: const Color(0xD9FFF8EA),
                                  height: 1.45,
                                ),
                          ),
                          const SizedBox(height: 28),
                          FilledButton(
                            onPressed: () {},
                            style: FilledButton.styleFrom(
                              minimumSize: const Size.fromHeight(52),
                              backgroundColor: const Color(0xFFFFF8EA),
                              foregroundColor: const Color(0xFF151021),
                              textStyle: const TextStyle(
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            child: const Text('Start Your First Reflection'),
                          ),
                          const SizedBox(height: 12),
                          OutlinedButton(
                            onPressed: () {},
                            style: OutlinedButton.styleFrom(
                              minimumSize: const Size.fromHeight(52),
                              foregroundColor: const Color(0xFFFFF8EA),
                              side: const BorderSide(color: Color(0x80FFF8EA)),
                            ),
                            child: const Text('Sign in'),
                          ),
                          const SizedBox(height: 20),
                          _EnvironmentPill(apiBaseUrl: apiBaseUrl),
                        ],
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
