import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGE_DETAILS, resolveSupportedLanguage, type SupportedLanguage } from "@inner-avatar/types/language"

export type ResponseLanguage = SupportedLanguage

export function resolveResponseLanguage(value: unknown): ResponseLanguage {
  return resolveSupportedLanguage(value)
}

export function languageInstruction(language: unknown) {
  const resolved = resolveResponseLanguage(language)
  const name = SUPPORTED_LANGUAGE_DETAILS[resolved]?.aiLanguageName ?? SUPPORTED_LANGUAGE_DETAILS[DEFAULT_LANGUAGE].aiLanguageName
  return `Write every user-facing string in ${name}. Keep JSON keys, enum values, role ids, source ids, citations, and validation fields unchanged. If the journal entry is in a different language, respond in ${name} unless safety requires quoting a very short excerpt from the user's own words.`
}

export const LOCAL_AI_COPY: Record<ResponseLanguage, {
  patternFallback: string
  groundingPattern: string
  safety: {
    highUserMessage: string
    highRecommendedAction: string
    mediumUserMessage: string
    mediumRecommendedAction: string
    noneUserMessage: string
    noneRecommendedAction: string
  }
  avatar: {
    openingLine: string
    mirror: string
    contradiction: string
    socraticQuestion: string
    integrationStep: string
    closingLine: string
  }
  prompt: {
    title: string
    context: string
    materialsAndPreparation: string
    execution: string
    integration: string
    targetPattern: string
  }
  analysis: {
    pressure: string
    fatigue: string
    concern: string
    reliefOrClarity: string
    pressureRole: string
    summary: (pattern: string) => string
  }
  council: {
    protector: string
    conditionedSelf: (pattern: string) => string
    visionary: string
    truthSelfFallback: string
    safetyCoreTension: string
    safetyContradiction: string
    safetyQuiet: string
    safetyAbstainReason: string
    guideName: string
    pauseHere: string
    supportQuestion: string
    groundingStep: string
    groundingClose: string
    openingLine: string
    integratorQuestion: string
    integrationStep: string
    closingLine: string
    contradiction: (desire: string, behavior: string) => string
    contradictionFallback: string
  }
}> = {
  en: {
    patternFallback: "a familiar pattern",
    groundingPattern: "Grounding",
    safety: {
      highUserMessage: "This sounds urgent enough to pause reflection and connect with immediate support. If you may be in danger, contact emergency services or a crisis line now.",
      highRecommendedAction: "Use crisis-oriented support and avoid normal reflective prompting.",
      mediumUserMessage: "This entry carries distress. Stay with orientation before interpretation.",
      mediumRecommendedAction: "Use grounding language and keep the prompt simple.",
      noneUserMessage: "No acute safety concern detected.",
      noneRecommendedAction: "Continue normal reflective flow.",
    },
    avatar: {
      openingLine: "Something in this repeats.",
      mirror: "You describe responsibility, but the shape also carries exhaustion.",
      contradiction: "Part of you wants relief while another part protects the role that keeps you needed.",
      socraticQuestion: "What would become possible if one thing did not have to be carried by you today?",
      integrationStep: "Write one sentence beginning with: I am allowed to not carry...",
      closingLine: "Keep the answer small enough to practice.",
    },
    prompt: {
      title: "The Weight You Can Set Down",
      context: "Some responsibilities become familiar because they arrive before choice.",
      materialsAndPreparation: "Choose one small object near you and place it on a steady surface.",
      execution: "Write the name of one responsibility you usually accept without pausing. Move the object a few inches away and leave it there for one minute.",
      integration: "What changes when responsibility is noticed before it is accepted?",
      targetPattern: "self-protection",
    },
    analysis: {
      pressure: "pressure",
      fatigue: "fatigue",
      concern: "concern",
      reliefOrClarity: "Relief or clarity",
      pressureRole: "Continuing the role that creates pressure",
      summary: (pattern) => `A repeated pattern around ${pattern.toLowerCase()} may be present, with language that suggests pressure and emerging self-awareness.`,
    },
    council: {
      protector: "A protective part may be trying to prevent risk by keeping the familiar pattern in place.",
      conditionedSelf: (pattern) => `The pattern named ${pattern} may be an old role asking to be noticed before it repeats.`,
      visionary: "Something in the entry appears to want more choice, even if the next move is small.",
      truthSelfFallback: "The clearest truth may be the difference between what is wanted and what is being repeated.",
      safetyCoreTension: "Safety must come before interpretation.",
      safetyContradiction: "This moment asks for support rather than symbolic reflection.",
      safetyQuiet: "This voice is quiet while grounding and real support come first.",
      safetyAbstainReason: "Safety grounding flow is active.",
      guideName: "Supraconscious Guide",
      pauseHere: "Pause here.",
      supportQuestion: "Can you name one place of support available to you right now?",
      groundingStep: "Name five things you can see. Write one sentence about where you are right now.",
      groundingClose: "Do not solve everything in this moment.",
      openingLine: "The Council is not here to decide for you.",
      integratorQuestion: "What becomes clear when each part is allowed to speak, but none of them is allowed to rule?",
      integrationStep: "Write one small shift you can carry today without forcing a complete transformation.",
      closingLine: "Cross the Gate only with what is small enough to live.",
      contradiction: (desire, behavior) => `You name ${desire}, while another movement repeats ${behavior}.`,
      contradictionFallback: "A part of you may be asking to be seen before the next choice is made.",
    },
  },
  es: {
    patternFallback: "un patrón familiar",
    groundingPattern: "Enraizamiento",
    safety: {
      highUserMessage: "Esto suena lo bastante urgente como para pausar la reflexión y buscar apoyo inmediato. Si puedes estar en peligro, contacta con emergencias o una línea de crisis ahora.",
      highRecommendedAction: "Usar apoyo orientado a crisis y evitar la reflexión normal.",
      mediumUserMessage: "Esta entrada trae malestar. Quédate con la orientación antes que con la interpretación.",
      mediumRecommendedAction: "Usar lenguaje de enraizamiento y mantener la indicación simple.",
      noneUserMessage: "No se detectó una preocupación aguda de seguridad.",
      noneRecommendedAction: "Continuar el flujo reflexivo normal.",
    },
    avatar: {
      openingLine: "Algo en esto se repite.",
      mirror: "Nombras responsabilidad, pero la forma también trae agotamiento.",
      contradiction: "Una parte quiere alivio mientras otra protege el rol que te mantiene necesario.",
      socraticQuestion: "¿Qué sería posible si hoy una cosa no tuviera que ser cargada por ti?",
      integrationStep: "Escribe una frase que empiece con: Tengo permiso para no cargar...",
      closingLine: "Mantén la respuesta lo bastante pequeña para practicarla.",
    },
    prompt: {
      title: "El peso que puedes soltar",
      context: "Algunas responsabilidades se vuelven familiares porque llegan antes que la elección.",
      materialsAndPreparation: "Elige un objeto pequeño cercano y ponlo sobre una superficie estable.",
      execution: "Escribe el nombre de una responsabilidad que sueles aceptar sin pausar. Mueve el objeto unos centímetros y déjalo allí un minuto.",
      integration: "¿Qué cambia cuando la responsabilidad se nota antes de aceptarla?",
      targetPattern: "autoprotección",
    },
    analysis: {
      pressure: "presión",
      fatigue: "cansancio",
      concern: "preocupación",
      reliefOrClarity: "Alivio o claridad",
      pressureRole: "Continuar el rol que crea presión",
      summary: (pattern) => `Puede estar presente un patrón repetido alrededor de ${pattern.toLowerCase()}, con lenguaje que sugiere presión y autoconciencia emergente.`,
    },
    council: {
      protector: "Una parte protectora puede estar intentando evitar riesgo manteniendo el patrón familiar.",
      conditionedSelf: (pattern) => `El patrón llamado ${pattern} puede ser un rol antiguo que pide ser visto antes de repetirse.`,
      visionary: "Algo en la entrada parece querer más elección, aunque el próximo movimiento sea pequeño.",
      truthSelfFallback: "La verdad más clara puede estar entre lo que se quiere y lo que se repite.",
      safetyCoreTension: "La seguridad debe venir antes de la interpretación.",
      safetyContradiction: "Este momento pide apoyo en lugar de reflexión simbólica.",
      safetyQuiet: "Esta voz se queda en silencio mientras primero llegan el enraizamiento y el apoyo real.",
      safetyAbstainReason: "El flujo de enraizamiento de seguridad está activo.",
      guideName: "Guía Supraconsciente",
      pauseHere: "Pausa aquí.",
      supportQuestion: "¿Puedes nombrar un lugar de apoyo disponible para ti ahora mismo?",
      groundingStep: "Nombra cinco cosas que puedas ver. Escribe una frase sobre dónde estás ahora mismo.",
      groundingClose: "No resuelvas todo en este momento.",
      openingLine: "El Consejo no está aquí para decidir por ti.",
      integratorQuestion: "¿Qué se vuelve claro cuando cada parte puede hablar, pero ninguna gobierna?",
      integrationStep: "Escribe un pequeño cambio que puedas llevar hoy sin forzar una transformación completa.",
      closingLine: "Cruza la Puerta solo con algo lo bastante pequeño para vivirlo.",
      contradiction: (desire, behavior) => `Nombras ${desire}, mientras otro movimiento repite ${behavior}.`,
      contradictionFallback: "Una parte de ti puede estar pidiendo ser vista antes de la próxima elección.",
    },
  },
  el: {
    patternFallback: "ένα γνώριμο μοτίβο",
    groundingPattern: "Γείωση",
    safety: {
      highUserMessage: "Αυτό ακούγεται αρκετά επείγον ώστε να σταματήσει η αντανάκλαση και να συνδεθείς με άμεση υποστήριξη. Αν μπορεί να κινδυνεύεις, επικοινώνησε τώρα με υπηρεσίες έκτακτης ανάγκης ή γραμμή κρίσης.",
      highRecommendedAction: "Χρήση υποστήριξης κρίσης και αποφυγή κανονικής αναστοχαστικής καθοδήγησης.",
      mediumUserMessage: "Αυτή η καταχώρηση φέρει δυσφορία. Μείνε στον προσανατολισμό πριν από την ερμηνεία.",
      mediumRecommendedAction: "Χρήση γειωμένης γλώσσας και απλής καθοδήγησης.",
      noneUserMessage: "Δεν εντοπίστηκε άμεση ανησυχία ασφάλειας.",
      noneRecommendedAction: "Συνέχισε την κανονική αναστοχαστική ροή.",
    },
    avatar: {
      openingLine: "Κάτι εδώ επαναλαμβάνεται.",
      mirror: "Περιγράφεις ευθύνη, αλλά το σχήμα κουβαλά και εξάντληση.",
      contradiction: "Ένα μέρος σου θέλει ανακούφιση ενώ ένα άλλο προστατεύει τον ρόλο που σε κρατά αναγκαίο.",
      socraticQuestion: "Τι θα γινόταν δυνατό αν ένα πράγμα δεν χρειαζόταν να το κουβαλήσεις σήμερα;",
      integrationStep: "Γράψε μία πρόταση που αρχίζει με: Μου επιτρέπεται να μην κουβαλώ...",
      closingLine: "Κράτησε την απάντηση αρκετά μικρή για να την εξασκήσεις.",
    },
    prompt: {
      title: "Το βάρος που μπορείς να αφήσεις",
      context: "Μερικές ευθύνες γίνονται γνώριμες επειδή φτάνουν πριν από την επιλογή.",
      materialsAndPreparation: "Διάλεξε ένα μικρό αντικείμενο κοντά σου και βάλε το σε μια σταθερή επιφάνεια.",
      execution: "Γράψε το όνομα μιας ευθύνης που συνήθως δέχεσαι χωρίς παύση. Μετακίνησε το αντικείμενο λίγο και άφησέ το εκεί για ένα λεπτό.",
      integration: "Τι αλλάζει όταν η ευθύνη γίνεται αντιληπτή πριν γίνει αποδεκτή;",
      targetPattern: "αυτοπροστασία",
    },
    analysis: {
      pressure: "πίεση",
      fatigue: "κόπωση",
      concern: "ανησυχία",
      reliefOrClarity: "Ανακούφιση ή καθαρότητα",
      pressureRole: "Συνέχιση του ρόλου που δημιουργεί πίεση",
      summary: (pattern) => `Μπορεί να υπάρχει ένα επαναλαμβανόμενο μοτίβο γύρω από ${pattern.toLowerCase()}, με γλώσσα που δείχνει πίεση και αναδυόμενη αυτοεπίγνωση.`,
    },
    council: {
      protector: "Ένα προστατευτικό μέρος μπορεί να προσπαθεί να αποτρέψει τον κίνδυνο κρατώντας το γνώριμο μοτίβο στη θέση του.",
      conditionedSelf: (pattern) => `Το μοτίβο ${pattern} μπορεί να είναι ένας παλιός ρόλος που ζητά να γίνει αντιληπτός πριν επαναληφθεί.`,
      visionary: "Κάτι στην καταχώρηση φαίνεται να θέλει περισσότερη επιλογή, ακόμη κι αν η επόμενη κίνηση είναι μικρή.",
      truthSelfFallback: "Η πιο καθαρή αλήθεια μπορεί να είναι η διαφορά ανάμεσα σε αυτό που θέλεις και σε αυτό που επαναλαμβάνεται.",
      safetyCoreTension: "Η ασφάλεια πρέπει να προηγείται της ερμηνείας.",
      safetyContradiction: "Αυτή η στιγμή ζητά υποστήριξη αντί για συμβολική αντανάκλαση.",
      safetyQuiet: "Αυτή η φωνή μένει ήσυχη όσο προηγούνται η γείωση και η πραγματική υποστήριξη.",
      safetyAbstainReason: "Η ροή γείωσης ασφάλειας είναι ενεργή.",
      guideName: "Υπερσυνειδητός Οδηγός",
      pauseHere: "Σταμάτα εδώ.",
      supportQuestion: "Μπορείς να ονομάσεις ένα μέρος υποστήριξης διαθέσιμο σε εσένα τώρα;",
      groundingStep: "Ονόμασε πέντε πράγματα που βλέπεις. Γράψε μία πρόταση για το πού βρίσκεσαι τώρα.",
      groundingClose: "Μη λύσεις τα πάντα αυτή τη στιγμή.",
      openingLine: "Το Συμβούλιο δεν είναι εδώ για να αποφασίσει για εσένα.",
      integratorQuestion: "Τι γίνεται καθαρό όταν κάθε μέρος επιτρέπεται να μιλήσει, αλλά κανένα δεν κυβερνά;",
      integrationStep: "Γράψε μία μικρή μετατόπιση που μπορείς να κρατήσεις σήμερα χωρίς να πιέσεις πλήρη μεταμόρφωση.",
      closingLine: "Πέρνα την Πύλη μόνο με κάτι αρκετά μικρό για να το ζήσεις.",
      contradiction: (desire, behavior) => `Ονομάζεις ${desire}, ενώ μια άλλη κίνηση επαναλαμβάνει ${behavior}.`,
      contradictionFallback: "Ένα μέρος σου μπορεί να ζητά να φανεί πριν από την επόμενη επιλογή.",
    },
  },
  fr: {
    patternFallback: "un schéma familier",
    groundingPattern: "Ancrage",
    safety: {
      highUserMessage: "Cela semble assez urgent pour mettre la réflexion en pause et chercher un soutien immédiat. Si tu peux être en danger, contacte les urgences ou une ligne de crise maintenant.",
      highRecommendedAction: "Utiliser un soutien orienté crise et éviter la réflexion normale.",
      mediumUserMessage: "Cette entrée porte de la détresse. Reste dans l'orientation avant l'interprétation.",
      mediumRecommendedAction: "Utiliser un langage d'ancrage et garder la consigne simple.",
      noneUserMessage: "Aucune préoccupation de sécurité aiguë détectée.",
      noneRecommendedAction: "Continuer le flux réflexif normal.",
    },
    avatar: {
      openingLine: "Quelque chose ici se répète.",
      mirror: "Tu décris de la responsabilité, mais cette forme porte aussi de l'épuisement.",
      contradiction: "Une part de toi veut du soulagement tandis qu'une autre protège le rôle qui te rend nécessaire.",
      socraticQuestion: "Qu'est-ce qui deviendrait possible si une chose n'avait pas à être portée par toi aujourd'hui ?",
      integrationStep: "Écris une phrase qui commence par : J'ai le droit de ne pas porter...",
      closingLine: "Garde la réponse assez petite pour la pratiquer.",
    },
    prompt: {
      title: "Le poids que tu peux déposer",
      context: "Certaines responsabilités deviennent familières parce qu'elles arrivent avant le choix.",
      materialsAndPreparation: "Choisis un petit objet près de toi et pose-le sur une surface stable.",
      execution: "Écris le nom d'une responsabilité que tu acceptes souvent sans pause. Déplace l'objet de quelques centimètres et laisse-le là une minute.",
      integration: "Qu'est-ce qui change quand la responsabilité est remarquée avant d'être acceptée ?",
      targetPattern: "autoprotection",
    },
    analysis: {
      pressure: "pression",
      fatigue: "fatigue",
      concern: "préoccupation",
      reliefOrClarity: "Soulagement ou clarté",
      pressureRole: "Continuer le rôle qui crée de la pression",
      summary: (pattern) => `Un schéma répété autour de ${pattern.toLowerCase()} peut être présent, avec un langage qui suggère de la pression et une conscience de soi émergente.`,
    },
    council: {
      protector: "Une part protectrice essaie peut-être d'éviter le risque en gardant le schéma familier en place.",
      conditionedSelf: (pattern) => `Le schéma nommé ${pattern} peut être un ancien rôle qui demande à être remarqué avant de se répéter.`,
      visionary: "Quelque chose dans l'entrée semble vouloir plus de choix, même si le prochain mouvement est petit.",
      truthSelfFallback: "La vérité la plus claire peut être la différence entre ce qui est désiré et ce qui se répète.",
      safetyCoreTension: "La sécurité doit passer avant l'interprétation.",
      safetyContradiction: "Ce moment demande du soutien plutôt qu'une réflexion symbolique.",
      safetyQuiet: "Cette voix reste silencieuse pendant que l'ancrage et le soutien réel passent d'abord.",
      safetyAbstainReason: "Le flux d'ancrage de sécurité est actif.",
      guideName: "Guide Supraconscient",
      pauseHere: "Pause ici.",
      supportQuestion: "Peux-tu nommer un lieu de soutien disponible pour toi maintenant ?",
      groundingStep: "Nomme cinq choses que tu peux voir. Écris une phrase sur l'endroit où tu es maintenant.",
      groundingClose: "Ne résous pas tout dans ce moment.",
      openingLine: "Le Conseil n'est pas là pour décider à ta place.",
      integratorQuestion: "Qu'est-ce qui devient clair quand chaque part peut parler, mais qu'aucune ne gouverne ?",
      integrationStep: "Écris un petit changement que tu peux porter aujourd'hui sans forcer une transformation complète.",
      closingLine: "Ne franchis la Porte qu'avec ce qui est assez petit pour être vécu.",
      contradiction: (desire, behavior) => `Tu nommes ${desire}, tandis qu'un autre mouvement répète ${behavior}.`,
      contradictionFallback: "Une part de toi demande peut-être à être vue avant le prochain choix.",
    },
  },
  de: {
    patternFallback: "ein vertrautes Muster",
    groundingPattern: "Erdung",
    safety: {
      highUserMessage: "Das klingt dringend genug, um die Reflexion zu pausieren und sofortige Unterstützung zu suchen. Wenn du in Gefahr sein könntest, kontaktiere jetzt den Notdienst oder eine Krisenstelle.",
      highRecommendedAction: "Krisenorientierte Unterstützung nutzen und normale Reflexionsimpulse vermeiden.",
      mediumUserMessage: "Dieser Eintrag trägt Belastung. Bleib bei Orientierung, bevor du interpretierst.",
      mediumRecommendedAction: "Erdende Sprache nutzen und den Impuls einfach halten.",
      noneUserMessage: "Keine akute Sicherheitsbedenken erkannt.",
      noneRecommendedAction: "Normalen Reflexionsfluss fortsetzen.",
    },
    avatar: {
      openingLine: "Etwas daran wiederholt sich.",
      mirror: "Du beschreibst Verantwortung, aber die Form trägt auch Erschöpfung.",
      contradiction: "Ein Teil von dir will Erleichterung, während ein anderer die Rolle schützt, die dich gebraucht hält.",
      socraticQuestion: "Was würde möglich, wenn eine Sache heute nicht von dir getragen werden müsste?",
      integrationStep: "Schreibe einen Satz, der beginnt mit: Ich darf nicht tragen...",
      closingLine: "Halte die Antwort klein genug, um sie zu üben.",
    },
    prompt: {
      title: "Das Gewicht, das du ablegen kannst",
      context: "Manche Verantwortungen werden vertraut, weil sie vor der Wahl auftauchen.",
      materialsAndPreparation: "Wähle einen kleinen Gegenstand in deiner Nähe und lege ihn auf eine stabile Oberfläche.",
      execution: "Schreibe den Namen einer Verantwortung auf, die du oft ohne Pause annimmst. Bewege den Gegenstand ein paar Zentimeter weg und lass ihn eine Minute dort.",
      integration: "Was verändert sich, wenn Verantwortung bemerkt wird, bevor sie angenommen wird?",
      targetPattern: "Selbstschutz",
    },
    analysis: {
      pressure: "Druck",
      fatigue: "Müdigkeit",
      concern: "Sorge",
      reliefOrClarity: "Erleichterung oder Klarheit",
      pressureRole: "Die Rolle fortsetzen, die Druck erzeugt",
      summary: (pattern) => `Ein wiederkehrendes Muster rund um ${pattern.toLowerCase()} kann vorhanden sein, mit Sprache, die Druck und entstehende Selbsterkenntnis zeigt.`,
    },
    council: {
      protector: "Ein schützender Teil versucht vielleicht, Risiko zu vermeiden, indem er das vertraute Muster festhält.",
      conditionedSelf: (pattern) => `Das Muster ${pattern} kann eine alte Rolle sein, die bemerkt werden will, bevor sie sich wiederholt.`,
      visionary: "Etwas im Eintrag scheint mehr Wahl zu wollen, auch wenn der nächste Schritt klein ist.",
      truthSelfFallback: "Die klarste Wahrheit kann im Unterschied zwischen dem Gewünschten und dem Wiederholten liegen.",
      safetyCoreTension: "Sicherheit muss vor Interpretation kommen.",
      safetyContradiction: "Dieser Moment bittet um Unterstützung statt symbolischer Reflexion.",
      safetyQuiet: "Diese Stimme bleibt still, während Erdung und echte Unterstützung zuerst kommen.",
      safetyAbstainReason: "Der Sicherheits-Erdungsfluss ist aktiv.",
      guideName: "Suprakonszienter Guide",
      pauseHere: "Halte hier inne.",
      supportQuestion: "Kannst du einen Ort der Unterstützung nennen, der dir jetzt zur Verfügung steht?",
      groundingStep: "Nenne fünf Dinge, die du sehen kannst. Schreibe einen Satz darüber, wo du gerade bist.",
      groundingClose: "Löse nicht alles in diesem Moment.",
      openingLine: "Der Rat ist nicht hier, um für dich zu entscheiden.",
      integratorQuestion: "Was wird klar, wenn jeder Teil sprechen darf, aber keiner herrschen darf?",
      integrationStep: "Schreibe eine kleine Veränderung auf, die du heute tragen kannst, ohne eine vollständige Transformation zu erzwingen.",
      closingLine: "Durchquere das Tor nur mit dem, was klein genug ist, um gelebt zu werden.",
      contradiction: (desire, behavior) => `Du nennst ${desire}, während eine andere Bewegung ${behavior} wiederholt.`,
      contradictionFallback: "Ein Teil von dir möchte vielleicht gesehen werden, bevor die nächste Wahl getroffen wird.",
    },
  },
  "zh-Hans": {
    patternFallback: "一个熟悉的模式",
    groundingPattern: "安定",
    safety: {
      highUserMessage: "这听起来足够紧急，需要先暂停反思并联系即时支持。如果你可能处于危险中，请现在联系紧急服务或危机热线。",
      highRecommendedAction: "使用危机支持，避免正常的反思提示。",
      mediumUserMessage: "这篇记录带有痛苦感。先回到当下定位，再进行解释。",
      mediumRecommendedAction: "使用安定语言，并保持提示简单。",
      noneUserMessage: "未检测到急性安全风险。",
      noneRecommendedAction: "继续正常的反思流程。",
    },
    avatar: {
      openingLine: "这里有某种东西在重复。",
      mirror: "你描述的是责任，但其中也带着疲惫。",
      contradiction: "你的一部分想要松一口气，另一部分却在保护那个让你被需要的角色。",
      socraticQuestion: "如果今天有一件事不必由你来背负，会变得可能的是什么？",
      integrationStep: "写一句以这句话开头的话：我被允许不再背负……",
      closingLine: "让答案小到足以练习。",
    },
    prompt: {
      title: "你可以放下的重量",
      context: "有些责任之所以熟悉，是因为它们在选择之前就已经出现。",
      materialsAndPreparation: "选择身边一个小物件，把它放在稳定的表面上。",
      execution: "写下一个你通常会不假思索接受的责任。把那个物件移开几厘米，并让它在那里停留一分钟。",
      integration: "当责任先被看见、再被接受时，会有什么改变？",
      targetPattern: "自我保护",
    },
    analysis: {
      pressure: "压力",
      fatigue: "疲惫",
      concern: "担忧",
      reliefOrClarity: "缓解或清晰",
      pressureRole: "继续那个制造压力的角色",
      summary: (pattern) => `围绕${pattern.toLowerCase()}可能存在一个重复模式，语言中带有压力和正在浮现的自我觉察。`,
    },
    council: {
      protector: "一个保护性的部分可能正试图通过维持熟悉模式来避免风险。",
      conditionedSelf: (pattern) => `名为${pattern}的模式可能是一个旧角色，正在请求在重复之前被看见。`,
      visionary: "这篇记录里似乎有某个部分想要更多选择，即使下一步很小。",
      truthSelfFallback: "最清楚的真相可能在想要的东西与正在重复的东西之间。",
      safetyCoreTension: "安全必须先于解释。",
      safetyContradiction: "这一刻需要的是支持，而不是象征性反思。",
      safetyQuiet: "在安定和真实支持优先到来时，这个声音先保持安静。",
      safetyAbstainReason: "安全安定流程已启动。",
      guideName: "Supraconscious 向导",
      pauseHere: "先停在这里。",
      supportQuestion: "你能说出此刻可以获得的一个支持来源吗？",
      groundingStep: "说出你能看见的五样东西。写一句话描述你现在在哪里。",
      groundingClose: "不要在这一刻解决所有事情。",
      openingLine: "议会不是来替你做决定的。",
      integratorQuestion: "当每个部分都被允许说话、但没有任何一个部分被允许掌控时，什么会变得清楚？",
      integrationStep: "写下今天可以带走的一个小转变，不需要强迫完整转化。",
      closingLine: "只带着小到足以实践的东西穿过这道门。",
      contradiction: (desire, behavior) => `你说出的是${desire}，同时另一个动作在重复${behavior}。`,
      contradictionFallback: "在下一次选择之前，你的某个部分也许正在请求被看见。",
    },
  },
}

export function localAiCopy(language: unknown) {
  return LOCAL_AI_COPY[resolveResponseLanguage(language)]
}
