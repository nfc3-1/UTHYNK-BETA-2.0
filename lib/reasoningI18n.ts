import type { Challenge } from "@/lib/challenges";

export type Language = "en" | "es" | "fr";

export const languageOptions: Array<{ label: string; value: Language }> = [
  { label: "English", value: "en" },
  { label: "Español", value: "es" },
  { label: "Français", value: "fr" },
];

export const uiCopy = {
  en: {
    adaptiveLanguage: "Language",
    analysisTab: "Analysis",
    categories: "Categories",
    categoryTab: "Categories",
    chooseThinkingLens: "Choose a Thinking Lens",
    claim: "Claim",
    claimEvaluation: "Reasoning Lab",
    contradictionAnalysis: "Follow-up analysis",
    contradictionPrompt: "Follow-up question",
    continueWithUthynk: "Continue with UThynk",
    counterargument: "Counterargument",
    didYouKnow: "Did You Know?",
    emotionalRigidity: "Emotional rigidity",
    emotionalRigidityTooltip: "How resistant your reasoning is to new information.",
    evidence: "Evidence",
    evidenceEmpty: "Support the claim with examples, data, or observation.",
    evidenceStrength: "Evidence strength",
    evidenceStrengthTooltip: "How much your answer is supported by examples, facts, or observable details.",
    growthEdge: "Growth edge",
    evolvingInsight: "Evolving insight",
    flagged: "Flagged",
    holdToTalk: "Hold To Talk",
    home: "Home",
    identity: "Identity",
    identityProgression: "Identity progression",
    liveConversation: "Live UThynk Conversation",
    liveReasoning: "UThynk reasoning live",
    loadingSession: "Loading UThynk Session",
    logicArguments: "Logic Arguments",
    logicQuality: "Logic quality",
    logicQualityTooltip: "How consistently your reasoning follows from your evidence.",
    manipulationTactics: "Manipulation tactics",
    manipulationTacticsTooltip: "Signals that pressure, urgency, status, or incentives may be shaping the argument.",
    insightsTab: "Insights",
    insightXp: "Insight XP",
    improved: "You improved",
    lensEthics: "Ethics",
    lensHistory: "History",
    lensIncentives: "Incentives",
    lensLogic: "Logic",
    lensStrategy: "Strategy",
    lensDescriptionEthics: "Looks at fairness and values.",
    lensDescriptionHistory: "Looks at patterns from the past.",
    lensDescriptionIncentives: "Looks at motivations and hidden interests.",
    lensDescriptionLogic: "Checks whether the argument makes sense.",
    lensDescriptionStrategy: "Looks at long-term consequences.",
    placeholder: "Make a claim, add evidence, test an assumption, or respond by voice.",
    priorContradiction: "Prior contradiction",
    primaryMode: "Primary mode",
    progress: "Progress",
    progression: "Progression",
    questionType: "Question type",
    rank: "Rank",
    reasoningTimeline: "Thinking Timeline",
    recursiveFollowUp: "Recursive follow-up",
    reasoningStepOne: "Your position",
    reasoningStepTwo: "What backs it up?",
    reasoningStepThree: "Strongest challenge",
    reasoningStepFour: "Hidden assumptions",
    restoredHistory: "Restoring your cognitive history...",
    rewardPattern: "New pattern detected",
    scanning: "Scanning",
    send: "Send to UThynk",
    sending: "UThynk is reasoning...",
    sessionContinuity: "Session continuity",
    sessionTurns: "reasoning turns in this thread. Current pressure:",
    biasWatch: "Bias watch",
    currentSession: "Current session",
    evidenceTest: "Evidence test",
    incentiveMap: "Incentive map",
    intensity: "Intensity",
    lens: "Lens",
    liveSignals: "Live signals",
    patternTest: "Pattern test",
    style: "Style",
    thinkingProfile: "Thinking profile",
    tradeoffMove: "Tradeoff move",
    valueConflict: "Value conflict",
    stateClaim: "State the position you want UThynk to evaluate.",
    streak: "Streak",
    streakDays: "days",
    strongestOpposingCase: "Strongest opposing case",
    trait: "Trait",
    userLabel: "You",
    welcome:
      "Welcome back. I remember your previous reasoning patterns. Let's continue sharpening your thinking.",
  },
  es: {
    adaptiveLanguage: "Idioma",
    analysisTab: "Analisis",
    categories: "Categorías",
    categoryTab: "Categorias",
    chooseThinkingLens: "Elige un lente de pensamiento",
    claim: "Afirmación",
    claimEvaluation: "Laboratorio de razonamiento",
    contradictionAnalysis: "Analisis de seguimiento",
    contradictionPrompt: "Pregunta de seguimiento",
    continueWithUthynk: "Continúa con UThynk",
    counterargument: "Contraargumento",
    didYouKnow: "¿Sabías que?",
    emotionalRigidity: "Rigidez emocional",
    emotionalRigidityTooltip: "Que tan resistente es tu razonamiento a informacion nueva.",
    evidence: "Evidencia",
    evidenceEmpty: "Apoya la afirmación con ejemplos, datos u observación.",
    evidenceStrength: "Fuerza de la evidencia",
    evidenceStrengthTooltip: "Cuanto se apoya tu respuesta en ejemplos, hechos o detalles observables.",
    growthEdge: "Area de crecimiento",
    evolvingInsight: "Idea en evolución",
    flagged: "Detectado",
    holdToTalk: "Mantén para hablar",
    home: "Inicio",
    identity: "Identidad",
    identityProgression: "Progresión de identidad",
    liveConversation: "Conversación UThynk en vivo",
    liveReasoning: "Razonamiento UThynk en vivo",
    loadingSession: "Cargando sesión UThynk",
    logicArguments: "Argumentos lógicos",
    logicQuality: "Calidad lógica",
    logicQualityTooltip: "Que tan consistentemente tu razonamiento se sigue de tu evidencia.",
    manipulationTactics: "Tácticas de manipulación",
    manipulationTacticsTooltip: "Senales de que presion, urgencia, estatus o incentivos pueden estar moldeando el argumento.",
    insightsTab: "Ideas",
    insightXp: "XP de insight",
    improved: "Mejoraste",
    lensEthics: "Etica",
    lensHistory: "Historia",
    lensIncentives: "Incentivos",
    lensLogic: "Logica",
    lensStrategy: "Estrategia",
    lensDescriptionEthics: "Observa la justicia y los valores.",
    lensDescriptionHistory: "Busca patrones del pasado.",
    lensDescriptionIncentives: "Observa motivaciones e intereses ocultos.",
    lensDescriptionLogic: "Revisa si el argumento tiene sentido.",
    lensDescriptionStrategy: "Observa consecuencias a largo plazo.",
    placeholder: "Haz una afirmación, añade evidencia, prueba una suposición o responde con voz.",
    priorContradiction: "Contradicción previa",
    primaryMode: "Modo principal",
    progress: "Progreso",
    progression: "Progresión",
    questionType: "Tipo de pregunta",
    rank: "Rango",
    reasoningTimeline: "Linea de pensamiento",
    recursiveFollowUp: "Seguimiento recursivo",
    reasoningStepOne: "Tu posicion",
    reasoningStepTwo: "Que la respalda?",
    reasoningStepThree: "Desafio mas fuerte",
    reasoningStepFour: "Suposiciones ocultas",
    restoredHistory: "Restaurando tu historial cognitivo...",
    rewardPattern: "Nuevo patron detectado",
    scanning: "Analizando",
    send: "Enviar a UThynk",
    sending: "UThynk está razonando...",
    sessionContinuity: "Continuidad de sesión",
    sessionTurns: "turnos de razonamiento en este hilo. Presión actual:",
    biasWatch: "Sesgo a vigilar",
    currentSession: "Sesion actual",
    evidenceTest: "Prueba de evidencia",
    incentiveMap: "Mapa de incentivos",
    intensity: "Intensidad",
    lens: "Lente",
    liveSignals: "Senales en vivo",
    patternTest: "Prueba de patrones",
    style: "Estilo",
    thinkingProfile: "Perfil de pensamiento",
    tradeoffMove: "Movimiento de intercambio",
    valueConflict: "Conflicto de valores",
    stateClaim: "Indica la posición que quieres que UThynk evalúe.",
    streak: "Racha",
    streakDays: "días",
    strongestOpposingCase: "Caso opuesto más fuerte",
    trait: "Rasgo",
    userLabel: "Tú",
    welcome:
      "Bienvenido de nuevo. Recuerdo tus patrones de razonamiento previos. Sigamos afinando tu pensamiento.",
  },
  fr: {
    adaptiveLanguage: "Langue",
    analysisTab: "Analyse",
    categories: "Catégories",
    categoryTab: "Categories",
    chooseThinkingLens: "Choisis une lentille de pensee",
    claim: "Thèse",
    claimEvaluation: "Laboratoire de raisonnement",
    contradictionAnalysis: "Analyse de suivi",
    contradictionPrompt: "Question de suivi",
    continueWithUthynk: "Continuer avec UThynk",
    counterargument: "Contre-argument",
    didYouKnow: "Le saviez-vous ?",
    emotionalRigidity: "Rigidité émotionnelle",
    emotionalRigidityTooltip: "A quel point ton raisonnement resiste aux informations nouvelles.",
    evidence: "Preuves",
    evidenceEmpty: "Appuie la thèse avec des exemples, des données ou une observation.",
    evidenceStrength: "Force des preuves",
    evidenceStrengthTooltip: "A quel point ta reponse s'appuie sur des exemples, des faits ou des details observables.",
    growthEdge: "Axe de progression",
    evolvingInsight: "Idée en évolution",
    flagged: "Signalé",
    holdToTalk: "Maintenir pour parler",
    home: "Accueil",
    identity: "Identité",
    identityProgression: "Progression de l'identité",
    liveConversation: "Conversation UThynk en direct",
    liveReasoning: "Raisonnement UThynk en direct",
    loadingSession: "Chargement de la session UThynk",
    logicArguments: "Arguments logiques",
    logicQuality: "Qualité logique",
    logicQualityTooltip: "La coherence entre ton raisonnement et les preuves que tu fournis.",
    manipulationTactics: "Tactiques de manipulation",
    manipulationTacticsTooltip: "Signaux montrant que pression, urgence, statut ou incitations peuvent influencer l'argument.",
    insightsTab: "Idees",
    insightXp: "XP d'insight",
    improved: "Tu as ameliore",
    lensEthics: "Ethique",
    lensHistory: "Histoire",
    lensIncentives: "Incitations",
    lensLogic: "Logique",
    lensStrategy: "Strategie",
    lensDescriptionEthics: "Regarde l'equite et les valeurs.",
    lensDescriptionHistory: "Regarde les modeles du passe.",
    lensDescriptionIncentives: "Regarde les motivations et les interets caches.",
    lensDescriptionLogic: "Verifie si l'argument a du sens.",
    lensDescriptionStrategy: "Regarde les consequences a long terme.",
    placeholder: "Formule une thèse, ajoute des preuves, teste une hypothèse ou réponds à la voix.",
    priorContradiction: "Contradiction précédente",
    primaryMode: "Mode principal",
    progress: "Progrès",
    progression: "Progression",
    questionType: "Type de question",
    rank: "Rang",
    reasoningTimeline: "Chronologie de pensee",
    recursiveFollowUp: "Relance récursive",
    reasoningStepOne: "Ta position",
    reasoningStepTwo: "Ce qui l'appuie",
    reasoningStepThree: "Defi le plus fort",
    reasoningStepFour: "Hypotheses cachees",
    restoredHistory: "Restauration de ton historique cognitif...",
    rewardPattern: "Nouveau schema detecte",
    scanning: "Analyse",
    send: "Envoyer à UThynk",
    sending: "UThynk raisonne...",
    sessionContinuity: "Continuité de session",
    sessionTurns: "tours de raisonnement dans ce fil. Pression actuelle :",
    biasWatch: "Biais a surveiller",
    currentSession: "Session actuelle",
    evidenceTest: "Test de preuves",
    incentiveMap: "Carte des incitations",
    intensity: "Intensite",
    lens: "Lentille",
    liveSignals: "Signaux en direct",
    patternTest: "Test de schemas",
    style: "Style",
    thinkingProfile: "Profil de pensee",
    tradeoffMove: "Compromis strategique",
    valueConflict: "Conflit de valeurs",
    stateClaim: "Indique la position que tu veux qu'UThynk évalue.",
    streak: "Série",
    streakDays: "jours",
    strongestOpposingCase: "Meilleur argument opposé",
    trait: "Trait",
    userLabel: "Toi",
    welcome:
      "Bon retour. Je me souviens de tes schémas de raisonnement précédents. Continuons à affiner ta pensée.",
  },
} satisfies Record<Language, Record<string, string>>;

export const cognitionFeedByLanguage = {
  en: [
    {
      title: "Manipulation pattern",
      text: "Urgency narrows attention. When a prompt demands speed, ask who benefits from you skipping verification.",
    },
    {
      title: "Strategic insight",
      text: "A strong move preserves options. If an answer commits early, test the reversible path first.",
    },
    {
      title: "Historical contradiction",
      text: "Many confident public narratives survive by hiding inconvenient timelines. Sequence the facts before judging motive.",
    },
    {
      title: "Bias example",
      text: "Availability bias makes the vivid example feel typical. Ask for the base rate before trusting the story.",
    },
    {
      title: "Probability prompt",
      text: "Replace certainty with odds: what would make this 30%, 60%, or 90% likely?",
    },
  ],
  es: [
    {
      title: "Patrón de manipulación",
      text: "La urgencia estrecha la atención. Cuando una pregunta exige rapidez, pregunta quién gana si omites la verificación.",
    },
    {
      title: "Insight estratégico",
      text: "Una buena jugada preserva opciones. Si una respuesta se compromete demasiado pronto, prueba primero el camino reversible.",
    },
    {
      title: "Contradicción histórica",
      text: "Muchas narrativas públicas sobreviven ocultando líneas de tiempo incómodas. Ordena los hechos antes de juzgar motivos.",
    },
    {
      title: "Ejemplo de sesgo",
      text: "El sesgo de disponibilidad hace que el ejemplo vívido parezca típico. Pide la tasa base antes de confiar en la historia.",
    },
    {
      title: "Pregunta probabilística",
      text: "Cambia certeza por probabilidades: ¿qué haría que esto fuera 30%, 60% o 90% probable?",
    },
  ],
  fr: [
    {
      title: "Schéma de manipulation",
      text: "L'urgence rétrécit l'attention. Quand une question exige de la vitesse, demande qui profite du fait que tu sautes la vérification.",
    },
    {
      title: "Idée stratégique",
      text: "Un bon mouvement préserve les options. Si une réponse s'engage trop tôt, teste d'abord le chemin réversible.",
    },
    {
      title: "Contradiction historique",
      text: "Beaucoup de récits publics confiants survivent en cachant des chronologies gênantes. Ordonne les faits avant de juger le motif.",
    },
    {
      title: "Exemple de biais",
      text: "Le biais de disponibilité rend l'exemple frappant plus représentatif qu'il ne l'est. Demande le taux de base avant de croire l'histoire.",
    },
    {
      title: "Question probabiliste",
      text: "Remplace la certitude par des probabilités : qu'est-ce qui rendrait cela probable à 30 %, 60 % ou 90 % ?",
    },
  ],
} satisfies Record<Language, Array<{ title: string; text: string }>>;

const categoryCopy: Partial<Record<Language, Record<string, string>>> = {
  es: {
    "Logic & Critical Thinking": "Logica y pensamiento critico",
    Epistemology: "Conocimiento y evidencia",
    "Ethics & Moral Reasoning": "Etica y razonamiento moral",
    "Strategic Thinking": "Pensamiento estrategico",
    "Street Lessons": "Lecciones practicas",
    "Financial Judgment": "Juicio financiero",
    "Leadership & Influence": "Liderazgo e influencia",
    "Media & Information Literacy": "Alfabetizacion mediatica",
    "Science & Evidence": "Ciencia y evidencia",
    "History & Civilization": "Historia y civilizacion",
    "Technology & AI": "Tecnologia e IA",
    "Creativity & Innovation": "Creatividad e innovacion",
    "Work, Purpose & Ambition": "Trabajo, proposito y ambicion",
    "Identity & Human Behavior": "Identidad y comportamiento humano",
    "Literature & Timeless Wisdom": "Literatura y sabiduria atemporal",
  },
  fr: {
    "Logic & Critical Thinking": "Logique et pensee critique",
    Epistemology: "Connaissance et preuves",
    "Ethics & Moral Reasoning": "Ethique et raisonnement moral",
    "Strategic Thinking": "Pensee strategique",
    "Street Lessons": "Lecons de terrain",
    "Financial Judgment": "Jugement financier",
    "Leadership & Influence": "Leadership et influence",
    "Media & Information Literacy": "Education aux medias",
    "Science & Evidence": "Science et preuves",
    "History & Civilization": "Histoire et civilisation",
    "Technology & AI": "Technologie et IA",
    "Creativity & Innovation": "Creativite et innovation",
    "Work, Purpose & Ambition": "Travail, sens et ambition",
    "Identity & Human Behavior": "Identite et comportement humain",
    "Literature & Timeless Wisdom": "Litterature et sagesse intemporelle",
  },
};

const localizedQuestionPools: Partial<Record<Language, Record<string, string[]>>> = {};

const challengeCopy: Record<string, Partial<Record<Language, Partial<Challenge>>>> = {
  "work-credit": {
    es: {
      category: "Estrategia laboral",
      title: "Crédito tomado",
      prompt: "Un compañero se atribuye tu trabajo frente a los líderes. ¿Qué haces después?",
      trait: "Pensamiento táctico",
    },
    fr: {
      category: "Stratégie au travail",
      title: "Crédit volé",
      prompt: "Un collègue s'attribue ton travail devant la direction. Que fais-tu ensuite ?",
      trait: "Pensée tactique",
    },
  },
  "luxury-car": {
    es: {
      category: "Juicio financiero",
      title: "Compra de lujo",
      prompt:
        "Quieres financiar un auto de lujo porque se siente como una recompensa por tu esfuerzo. ¿Qué razonamiento debe guiar la decisión?",
      trait: "Costo de oportunidad",
    },
    fr: {
      category: "Jugement financier",
      title: "Achat de luxe",
      prompt:
        "Tu veux financer une voiture de luxe parce que cela ressemble à une récompense pour ton travail. Quel raisonnement doit guider la décision ?",
      trait: "Coût d'opportunité",
    },
  },
  "viral-headline": {
    es: {
      category: "Manipulación mediática",
      title: "Titular emocional",
      prompt:
        "Un titular viral te enoja antes de leer el artículo. ¿Cómo evalúas si te están manipulando?",
      trait: "Detección de sesgos",
    },
    fr: {
      category: "Manipulation médiatique",
      title: "Titre émotionnel",
      prompt:
        "Un titre viral te met en colère avant même que tu lises l'article. Comment évalues-tu si l'on te manipule ?",
      trait: "Détection des biais",
    },
  },
  "logic-pressure": {
    es: {
      category: "Lógica bajo presión",
      title: "Trampa de decisión rápida",
      prompt:
        "Te presionan para tomar una decisión rápida con información incompleta. ¿Cómo desaceleras tu pensamiento sin perder la oportunidad?",
      trait: "Disciplina decisional",
    },
    fr: {
      category: "Logique sous pression",
      title: "Piège de décision rapide",
      prompt:
        "On te pousse à prendre une décision rapide avec des informations incomplètes. Comment ralentis-tu ta pensée sans manquer l'occasion ?",
      trait: "Discipline décisionnelle",
    },
  },
  "friend-conflict": {
    es: {
      category: "Inteligencia social",
      title: "Control del conflicto",
      prompt:
        "Un amigo te falta el respeto en público. ¿Cómo respondes sin perder autocontrol ni estatus?",
      trait: "Control emocional",
    },
    fr: {
      category: "Intelligence sociale",
      title: "Maîtrise du conflit",
      prompt:
        "Un ami te manque de respect en public. Comment réponds-tu sans perdre ton contrôle ni ton statut ?",
      trait: "Maîtrise émotionnelle",
    },
  },
  "business-risk": {
    es: {
      category: "Pensamiento estratégico",
      title: "Intercambio de riesgo",
      prompt:
        "Tienes una oportunidad profesional arriesgada con más potencial, pero menos seguridad. ¿Qué factores deben guiar la decisión?",
      trait: "Juicio estratégico",
    },
    fr: {
      category: "Pensée stratégique",
      title: "Arbitrage du risque",
      prompt:
        "Tu as une occasion de carrière risquée avec plus de potentiel, mais moins de sécurité. Quels facteurs doivent guider la décision ?",
      trait: "Jugement stratégique",
    },
  },
  "history-narrative": {
    es: {
      category: "Filosofía de la historia",
      title: "Narrativas opuestas",
      prompt:
        "Dos personas explican el mismo hecho histórico de formas totalmente distintas. ¿Cómo evalúas qué narrativa es más fuerte?",
      trait: "Razonamiento histórico",
    },
    fr: {
      category: "Philosophie de l'histoire",
      title: "Récits opposés",
      prompt:
        "Deux personnes expliquent le même événement historique de façons complètement différentes. Comment évalues-tu quel récit est le plus solide ?",
      trait: "Raisonnement historique",
    },
  },
  "worldview-disagreement": {
    es: {
      category: "Cosmovisiones y culturas",
      title: "Desacuerdo inteligente",
      prompt:
        "Alguien de otra cultura llega a una conclusión con la que no estás de acuerdo. ¿Cómo pruebas si tus propias suposiciones limitan tu juicio?",
      trait: "Toma de perspectiva",
    },
    fr: {
      category: "Visions du monde et cultures",
      title: "Désaccord intelligent",
      prompt:
        "Quelqu'un d'une autre culture arrive à une conclusion avec laquelle tu es fortement en désaccord. Comment testes-tu si tes propres hypothèses limitent ton jugement ?",
      trait: "Prise de perspective",
    },
  },
  "applied-ethics-tradeoff": {
    es: {
      category: "Ética aplicada",
      title: "Intercambio difícil",
      prompt:
        "Una decisión ayuda a un grupo pero perjudica a otro. ¿Cómo razonas el intercambio sin depender solo de la emoción?",
      trait: "Razonamiento moral",
    },
    fr: {
      category: "Éthique appliquée",
      title: "Arbitrage difficile",
      prompt:
        "Une décision aide un groupe mais en blesse un autre. Comment raisonnes-tu cet arbitrage sans t'appuyer seulement sur l'émotion ?",
      trait: "Raisonnement moral",
    },
  },
  "creative-reframe": {
    es: {
      category: "Pensamiento creativo",
      title: "Reencuadre del problema",
      prompt:
        "Estás bloqueado en un problema y toda solución obvia falló. ¿Cómo reencuadras el problema para encontrar un mejor camino?",
      trait: "Reencuadre",
    },
    fr: {
      category: "Pensée créative",
      title: "Recadrage du problème",
      prompt:
        "Tu es bloqué sur un problème et toutes les solutions évidentes ont échoué. Comment recadres-tu le problème pour trouver une meilleure voie ?",
      trait: "Recadrage",
    },
  },
  "street-incentives": {
    es: {
      category: "Lecciones prácticas",
      title: "Incentivos ocultos",
      prompt:
        "Alguien te da un consejo que suena útil, pero puede beneficiarle más a esa persona que a ti. ¿Cómo evalúas sus incentivos?",
      trait: "Conciencia de incentivos",
    },
    fr: {
      category: "Leçons de terrain",
      title: "Incitations cachées",
      prompt:
        "Quelqu'un te donne un conseil qui semble utile, mais qui pourrait lui profiter plus qu'à toi. Comment évalues-tu ses incitations ?",
      trait: "Conscience des incitations",
    },
  },
  "literature-character": {
    es: {
      category: "Literatura y sabiduría",
      title: "Juicio de personaje",
      prompt:
        "Un personaje toma una decisión destructiva creyendo que tiene razón. ¿Cómo analizas la falla en su razonamiento?",
      trait: "Reconocimiento de patrones de sabiduría",
    },
    fr: {
      category: "Littérature et sagesse",
      title: "Jugement du personnage",
      prompt:
        "Un personnage fait un choix destructeur tout en pensant avoir raison. Comment analyses-tu la faille dans son raisonnement ?",
      trait: "Reconnaissance des schémas de sagesse",
    },
  },
};

const phraseCopy = {
  en: {
    "everyday": "Everyday Thinking",
    "practical": "Practical Reasoning",
    "critical": "Critical Thinking",
    "strategic": "Strategic Thinking",
  },
  es: {
    "A strong answer should protect your reputation without reacting emotionally or escalating too early.":
      "Una respuesta fuerte debe proteger tu reputación sin reaccionar emocionalmente ni escalar demasiado pronto.",
    "What if your first instinct creates a second problem while a calmer response builds leverage?":
      "¿Y si tu primer instinto crea un segundo problema, mientras una respuesta más calmada genera ventaja?",
    "What specific next step protects your position without overreacting?":
      "¿Qué siguiente paso concreto protege tu posición sin sobrerreaccionar?",
    "What would a careful opponent say is missing from your reasoning?":
      "¿Qué diría un oponente cuidadoso que falta en tu razonamiento?",
    "strategic restraint": "restricción estratégica",
    "long-term awareness": "conciencia de largo plazo",
    "needs incentive analysis": "necesita análisis de incentivos",
    "clarify the next step": "aclara el siguiente paso",
    "Observer": "Observador",
    "Moderate": "Moderada",
    "High": "Alta",
    "Low": "Baja",
    "everyday": "Pensamiento cotidiano",
    "practical": "Razonamiento practico",
    "critical": "Pensamiento critico",
    "strategic": "Pensamiento estrategico",
  },
  fr: {
    "A strong answer should protect your reputation without reacting emotionally or escalating too early.":
      "Une réponse solide doit protéger ta réputation sans réagir émotionnellement ni escalader trop tôt.",
    "What if your first instinct creates a second problem while a calmer response builds leverage?":
      "Et si ton premier instinct créait un second problème, alors qu'une réponse plus calme construit du levier ?",
    "What specific next step protects your position without overreacting?":
      "Quelle prochaine étape concrète protège ta position sans surréagir ?",
    "What would a careful opponent say is missing from your reasoning?":
      "Qu'est-ce qu'un opposant attentif dirait qu'il manque dans ton raisonnement ?",
    "strategic restraint": "retenue stratégique",
    "long-term awareness": "conscience à long terme",
    "needs incentive analysis": "nécessite une analyse des incitations",
    "clarify the next step": "clarifie la prochaine étape",
    "Observer": "Observateur",
    "Moderate": "Modérée",
    "High": "Élevée",
    "Low": "Faible",
    "everyday": "Pensee quotidienne",
    "practical": "Raisonnement pratique",
    "critical": "Pensee critique",
    "strategic": "Pensee strategique",
  },
} satisfies Record<Language, Record<string, string>>;

export function localizeChallenge(challenge: Challenge, language: Language): Challenge {
  const directCopy = challengeCopy[challenge.id]?.[language];

  if (directCopy) {
    return {
      ...challenge,
      ...directCopy,
    };
  }

  if (language !== "en") {
    const pool = localizedQuestionPools[language]?.[challenge.category];
    const questionNumber = Number(challenge.id.match(/-(\d+)$/)?.[1] || "1");
    const prompt = pool?.[(Math.max(1, questionNumber) - 1) % pool.length];
    const category = categoryCopy[language]?.[challenge.category] || challenge.category;

    if (prompt) {
      return {
        ...challenge,
        category,
        prompt,
        title: prompt.split("?")[0].slice(0, 48),
      };
    }
  }

  return {
    ...challenge,
    category: categoryCopy[language]?.[challenge.category] || challenge.category,
  };
}

export function localizeCategory(category: string, language: Language) {
  return categoryCopy[language]?.[category] || category;
}

export function localizeQuestion(
  category: string,
  index: number,
  fallbackQuestion: string,
  language: Language
) {
  if (language === "en") return fallbackQuestion;

  const pool = localizedQuestionPools[language]?.[category];

  return pool?.[index % pool.length] || fallbackQuestion;
}

export function localizeText(value: string | undefined, language: Language) {
  if (!value) return "";

  return phraseCopy[language][value] || value;
}
