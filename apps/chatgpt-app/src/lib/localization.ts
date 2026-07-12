import { readSupportedLanguageFromHeader, resolveSupportedLanguage, type SupportedLanguage } from "@inner-avatar/types/language"

type ChatGptMessages = {
  rateLimit: string
  authRequired: string
  toolNotFound: string
  internalServerError: string
  toolExecutionFailed: string
  tools: Record<string, string>
}

const messages = {
  en: {
    rateLimit: "Too many requests from this IP, please try again later.",
    authRequired: "Authentication required",
    toolNotFound: "Tool not found",
    internalServerError: "Internal server error",
    toolExecutionFailed: "Tool execution failed",
    tools: {
      create_journal_entry: "Creates a journal entry for the authenticated user.",
      analyze_journal_entry: "Analyzes a journal entry for emotional signals, language patterns, contradictions, and safety flags.",
      generate_avatar_reflection: "Generates a short Supraconscious guide reflection for a journal entry.",
      generate_personalized_prompt: "Generates a symbolic but grounded journaling prompt based on the user's entry and detected pattern.",
      run_inner_council_reflection: "Runs the same Supraconscious Inner Council reflection flow used by the web journal, including safety handling, council voices, Integrator question, and source provenance.",
      get_recent_patterns: "Returns recent non-sensitive pattern summaries for the authenticated user.",
      save_reflection_session: "Saves the journal entry, analysis, guide response, and generated prompt as one reflection session.",
    },
  },
  es: {
    rateLimit: "Demasiadas solicitudes desde esta IP. Inténtalo de nuevo más tarde.",
    authRequired: "Autenticación requerida",
    toolNotFound: "Herramienta no encontrada",
    internalServerError: "Error interno del servidor",
    toolExecutionFailed: "La herramienta no pudo completarse",
    tools: {
      create_journal_entry: "Crea una entrada de diario para el usuario autenticado.",
      analyze_journal_entry: "Analiza una entrada de diario para detectar señales emocionales, patrones de lenguaje, contradicciones y alertas de seguridad.",
      generate_avatar_reflection: "Genera una breve reflexión del guía Supraconscious para una entrada de diario.",
      generate_personalized_prompt: "Genera un prompt simbólico pero grounded basado en la entrada del usuario y el patrón detectado.",
      run_inner_council_reflection: "Ejecuta el flujo de reflexión del Consejo Interior usado por el diario web, con seguridad, voces del consejo, pregunta integradora y procedencia de fuentes.",
      get_recent_patterns: "Devuelve resúmenes recientes no sensibles de patrones del usuario autenticado.",
      save_reflection_session: "Guarda la entrada, análisis, respuesta del guía y prompt generado como una sesión de reflexión.",
    },
  },
  el: {
    rateLimit: "Πάρα πολλά αιτήματα από αυτήν την IP. Δοκίμασε ξανά αργότερα.",
    authRequired: "Απαιτείται έλεγχος ταυτότητας",
    toolNotFound: "Το εργαλείο δεν βρέθηκε",
    internalServerError: "Εσωτερικό σφάλμα διακομιστή",
    toolExecutionFailed: "Η εκτέλεση του εργαλείου απέτυχε",
    tools: {
      create_journal_entry: "Δημιουργεί καταχώριση ημερολογίου για τον συνδεδεμένο χρήστη.",
      analyze_journal_entry: "Αναλύει μια καταχώριση για συναισθηματικά σήματα, γλωσσικά μοτίβα, αντιφάσεις και δείκτες ασφάλειας.",
      generate_avatar_reflection: "Δημιουργεί σύντομη αντανάκλαση οδηγού Supraconscious για μια καταχώριση.",
      generate_personalized_prompt: "Δημιουργεί συμβολικό αλλά grounded prompt με βάση την καταχώριση και το εντοπισμένο μοτίβο.",
      run_inner_council_reflection: "Εκτελεί τη ροή αντανάκλασης Εσωτερικού Συμβουλίου του web journal, με ασφάλεια, φωνές συμβουλίου, ερώτηση Integrator και προέλευση πηγών.",
      get_recent_patterns: "Επιστρέφει πρόσφατες μη ευαίσθητες περιλήψεις μοτίβων για τον συνδεδεμένο χρήστη.",
      save_reflection_session: "Αποθηκεύει καταχώριση, ανάλυση, απόκριση οδηγού και generated prompt ως μία συνεδρία.",
    },
  },
  fr: {
    rateLimit: "Trop de requêtes depuis cette IP. Réessayez plus tard.",
    authRequired: "Authentification requise",
    toolNotFound: "Outil introuvable",
    internalServerError: "Erreur interne du serveur",
    toolExecutionFailed: "L’exécution de l’outil a échoué",
    tools: {
      create_journal_entry: "Crée une entrée de journal pour l’utilisateur authentifié.",
      analyze_journal_entry: "Analyse une entrée de journal pour les signaux émotionnels, les modèles de langage, les contradictions et les alertes de sécurité.",
      generate_avatar_reflection: "Génère une courte réflexion du guide Supraconscious pour une entrée de journal.",
      generate_personalized_prompt: "Génère un prompt symbolique mais ancré à partir de l’entrée de l’utilisateur et du schéma détecté.",
      run_inner_council_reflection: "Exécute le flux de réflexion du Conseil intérieur utilisé par le journal web, avec sécurité, voix du conseil, question Integrator et provenance des sources.",
      get_recent_patterns: "Renvoie des résumés récents non sensibles des schémas de l’utilisateur authentifié.",
      save_reflection_session: "Enregistre l’entrée, l’analyse, la réponse du guide et le prompt généré comme une session de réflexion.",
    },
  },
  de: {
    rateLimit: "Zu viele Anfragen von dieser IP. Bitte später erneut versuchen.",
    authRequired: "Authentifizierung erforderlich",
    toolNotFound: "Tool nicht gefunden",
    internalServerError: "Interner Serverfehler",
    toolExecutionFailed: "Tool-Ausführung fehlgeschlagen",
    tools: {
      create_journal_entry: "Erstellt einen Journaleintrag für den authentifizierten Nutzer.",
      analyze_journal_entry: "Analysiert einen Journaleintrag auf emotionale Signale, Sprachmuster, Widersprüche und Sicherheitsmarker.",
      generate_avatar_reflection: "Erzeugt eine kurze Supraconscious-Guide-Reflexion für einen Journaleintrag.",
      generate_personalized_prompt: "Erzeugt einen symbolischen, aber geerdeten Journal-Prompt aus Eintrag und erkanntem Muster.",
      run_inner_council_reflection: "Führt denselben Inner-Council-Reflexionsfluss wie das Web-Journal aus, inklusive Sicherheit, Council-Stimmen, Integrator-Frage und Quellenherkunft.",
      get_recent_patterns: "Gibt aktuelle nicht sensible Musterzusammenfassungen für den authentifizierten Nutzer zurück.",
      save_reflection_session: "Speichert Eintrag, Analyse, Guide-Antwort und generierten Prompt als eine Reflexionssitzung.",
    },
  },
  "zh-Hans": {
    rateLimit: "此 IP 请求过多。请稍后再试。",
    authRequired: "需要身份验证",
    toolNotFound: "未找到工具",
    internalServerError: "服务器内部错误",
    toolExecutionFailed: "工具执行失败",
    tools: {
      create_journal_entry: "为已认证用户创建日记条目。",
      analyze_journal_entry: "分析日记条目中的情绪信号、语言模式、矛盾和安全标记。",
      generate_avatar_reflection: "为日记条目生成简短的 Supraconscious 指南反思。",
      generate_personalized_prompt: "根据用户条目和检测到的模式生成有象征性但有根据的写作提示。",
      run_inner_council_reflection: "运行与网页日记相同的内在议会反思流程，包括安全处理、议会声音、Integrator 问题和来源溯源。",
      get_recent_patterns: "返回已认证用户近期的非敏感模式摘要。",
      save_reflection_session: "将日记条目、分析、指南回应和生成提示保存为一个反思会话。",
    },
  },
} satisfies Record<SupportedLanguage, ChatGptMessages>

export function readRequestLanguageHeader(header: string | string[] | undefined) {
  return readSupportedLanguageFromHeader(Array.isArray(header) ? header.join(",") : header ?? null)
}

export function chatGptMessages(language: unknown) {
  return messages[resolveSupportedLanguage(language)]
}

