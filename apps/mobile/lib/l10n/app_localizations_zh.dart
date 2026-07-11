// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Chinese (`zh`).
class AppLocalizationsZh extends AppLocalizations {
  AppLocalizationsZh([String locale = 'zh']) : super(locale);

  @override
  String get appTitle => '内在议会';

  @override
  String get startReflection => '开始第一次反思';

  @override
  String get signIn => '登录';

  @override
  String get createAccount => '创建账户';

  @override
  String get useExistingAccount => '使用现有账户';

  @override
  String get landingEyebrow => '由 AI 驱动的身份反思';

  @override
  String get landingNotJournal => '这不是一本日记。';

  @override
  String get landingMeetYourself => '这是你与自己相遇的地方。';

  @override
  String get landingBody => '你不需要更多建议。你需要看清楚。内在议会会揭示你已经知道、却尚未面对的东西。';

  @override
  String get tabJournal => '日记';

  @override
  String get tabSaved => '已保存';

  @override
  String get tabPatterns => '模式';

  @override
  String get tabGuide => '指南';

  @override
  String get tabSettings => '设置';

  @override
  String get welcome => '欢迎';

  @override
  String welcomeName(String name) {
    return '欢迎，$name';
  }

  @override
  String get journalTitle => '今天有什么正在呈现？';

  @override
  String get journalHelper => '写下一条诚实的记录。议会会映照模式、张力和一个扎实的下一步。';

  @override
  String get journalPlaceholder => '写下当下存在的东西：情绪、观察、张力。不需要结构……';

  @override
  String get settingsTitle => '设置';

  @override
  String get accountFallback => '账户';

  @override
  String get privacyBody => '你的日记条目仅对该账户私密，并会在启用时用于反思、安全检查、语音功能和模式记忆。';

  @override
  String get languageTitle => '语言';

  @override
  String get languageSubtitle => '控制应用语言，以及新的 AI 反思所使用的语言。';

  @override
  String get patternMemory => '模式记忆';

  @override
  String get patternMemorySubtitle => '允许随着时间显示重复出现的信号。';
}

/// The translations for Chinese, using the Han script (`zh_Hans`).
class AppLocalizationsZhHans extends AppLocalizationsZh {
  AppLocalizationsZhHans() : super('zh_Hans');

  @override
  String get appTitle => '内在议会';

  @override
  String get startReflection => '开始第一次反思';

  @override
  String get signIn => '登录';

  @override
  String get createAccount => '创建账户';

  @override
  String get useExistingAccount => '使用现有账户';

  @override
  String get landingEyebrow => '由 AI 驱动的身份反思';

  @override
  String get landingNotJournal => '这不是一本日记。';

  @override
  String get landingMeetYourself => '这是你与自己相遇的地方。';

  @override
  String get landingBody => '你不需要更多建议。你需要看清楚。内在议会会揭示你已经知道、却尚未面对的东西。';

  @override
  String get tabJournal => '日记';

  @override
  String get tabSaved => '已保存';

  @override
  String get tabPatterns => '模式';

  @override
  String get tabGuide => '指南';

  @override
  String get tabSettings => '设置';

  @override
  String get welcome => '欢迎';

  @override
  String welcomeName(String name) {
    return '欢迎，$name';
  }

  @override
  String get journalTitle => '今天有什么正在呈现？';

  @override
  String get journalHelper => '写下一条诚实的记录。议会会映照模式、张力和一个扎实的下一步。';

  @override
  String get journalPlaceholder => '写下当下存在的东西：情绪、观察、张力。不需要结构……';

  @override
  String get settingsTitle => '设置';

  @override
  String get accountFallback => '账户';

  @override
  String get privacyBody => '你的日记条目仅对该账户私密，并会在启用时用于反思、安全检查、语音功能和模式记忆。';

  @override
  String get languageTitle => '语言';

  @override
  String get languageSubtitle => '控制应用语言，以及新的 AI 反思所使用的语言。';

  @override
  String get patternMemory => '模式记忆';

  @override
  String get patternMemorySubtitle => '允许随着时间显示重复出现的信号。';
}
