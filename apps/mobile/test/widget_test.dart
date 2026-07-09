import 'package:flutter_test/flutter_test.dart';
import 'package:inner_council_mobile/main.dart';

void main() {
  testWidgets('mobile foundation renders primary reflection entry points', (
    tester,
  ) async {
    await tester.pumpWidget(const InnerCouncilMobileApp());

    expect(find.text('The Inner Council'), findsOneWidget);
    expect(
      find.text('Write. See clearly. Choose consciously.'),
      findsOneWidget,
    );
    expect(find.text('Start Your First Reflection'), findsOneWidget);
    expect(find.text('Sign in'), findsOneWidget);
    expect(find.text('API: http://localhost:3000'), findsOneWidget);
  });
}
