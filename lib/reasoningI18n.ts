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
    contradictionAnalysis: "Contradiction analysis",
    contradictionPrompt: "Contradiction prompt",
    continueWithUthynk: "Continue with UThynk",
    counterargument: "Counterargument",
    didYouKnow: "Did You Know?",
    emotionalRigidity: "Emotional rigidity",
    emotionalRigidityTooltip: "How resistant your reasoning is to new information.",
    evidence: "Evidence",
    evidenceEmpty: "Support the claim with examples, data, or observation.",
    evidenceStrength: "Evidence strength",
    evidenceStrengthTooltip: "How much your answer is supported by examples, facts, or observable details.",
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
    placeholder: "Make a claim, add evidence, test an assumption, or respond by voice.",
    priorContradiction: "Prior contradiction",
    progress: "Progress",
    progression: "Progression",
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
    contradictionAnalysis: "Análisis de contradicción",
    contradictionPrompt: "Pregunta de contradicción",
    continueWithUthynk: "Continúa con UThynk",
    counterargument: "Contraargumento",
    didYouKnow: "¿Sabías que?",
    emotionalRigidity: "Rigidez emocional",
    emotionalRigidityTooltip: "Que tan resistente es tu razonamiento a informacion nueva.",
    evidence: "Evidencia",
    evidenceEmpty: "Apoya la afirmación con ejemplos, datos u observación.",
    evidenceStrength: "Fuerza de la evidencia",
    evidenceStrengthTooltip: "Cuanto se apoya tu respuesta en ejemplos, hechos o detalles observables.",
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
    placeholder: "Haz una afirmación, añade evidencia, prueba una suposición o responde con voz.",
    priorContradiction: "Contradicción previa",
    progress: "Progreso",
    progression: "Progresión",
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
    contradictionAnalysis: "Analyse de contradiction",
    contradictionPrompt: "Question de contradiction",
    continueWithUthynk: "Continuer avec UThynk",
    counterargument: "Contre-argument",
    didYouKnow: "Le saviez-vous ?",
    emotionalRigidity: "Rigidité émotionnelle",
    emotionalRigidityTooltip: "A quel point ton raisonnement resiste aux informations nouvelles.",
    evidence: "Preuves",
    evidenceEmpty: "Appuie la thèse avec des exemples, des données ou une observation.",
    evidenceStrength: "Force des preuves",
    evidenceStrengthTooltip: "A quel point ta reponse s'appuie sur des exemples, des faits ou des details observables.",
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
    placeholder: "Formule une thèse, ajoute des preuves, teste une hypothèse ou réponds à la voix.",
    priorContradiction: "Contradiction précédente",
    progress: "Progrès",
    progression: "Progression",
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
    "Work & Ambition": "Trabajo y ambicion",
    "Financial Judgment": "Juicio financiero",
    "Media Literacy": "Lectura de medios",
    "Logic & Debate": "Logica y debate",
    "People & Leadership": "Personas y liderazgo",
    "Strategic Thinking": "Pensamiento estrategico",
    "Philosophy of History": "Filosofia de la historia",
    "Worldview & Cultures": "Cosmovisiones y culturas",
    "Ethics & Values": "Etica y valores",
    "Creative Thinking": "Pensamiento creativo",
    "Literature & Wisdom": "Literatura y sabiduria",
    "Science & Evidence": "Ciencia y evidencia",
    "Technology & AI": "Tecnologia e IA",
    "Health & Habits": "Salud y habitos",
    "Civic Thinking": "Pensamiento civico",
    "Personal Identity": "Identidad personal",
    Epistemology: "Conocimiento y evidencia",
  },
  fr: {
    "Work & Ambition": "Travail et ambition",
    "Financial Judgment": "Jugement financier",
    "Media Literacy": "Lecture des medias",
    "Logic & Debate": "Logique et debat",
    "People & Leadership": "Relations et leadership",
    "Strategic Thinking": "Pensee strategique",
    "Philosophy of History": "Philosophie de l'histoire",
    "Worldview & Cultures": "Visions du monde et cultures",
    "Ethics & Values": "Ethique et valeurs",
    "Creative Thinking": "Pensee creative",
    "Literature & Wisdom": "Litterature et sagesse",
    "Science & Evidence": "Science et preuves",
    "Technology & AI": "Technologie et IA",
    "Health & Habits": "Sante et habitudes",
    "Civic Thinking": "Pensee civique",
    "Personal Identity": "Identite personnelle",
    Epistemology: "Connaissance et preuves",
  },
};

const localizedQuestionPools: Partial<Record<Language, Record<string, string[]>>> = {
  es: {
    "Work & Ambition": [
      "Un estudiante parece ocupado todo el dia, pero evita la tarea mas importante. Que deberia cambiar primero?",
      "Una persona quiere avanzar rapido en su carrera. Que habilidad le daria mas ventaja que solo trabajar mas horas?",
      "Un equipo premia a quien habla mas, no a quien aporta mejor trabajo. Como se puede hacer visible la competencia real?",
    ],
    "Financial Judgment": [
      "Un amigo quiere invertir porque todos en redes estan emocionados. Que pregunta haria mas lento y fuerte su juicio?",
      "Una compra parece barata por mes, pero cara en total. Que costos faltan antes de decidir?",
      "Una oportunidad promete mucha ganancia y poco riesgo. Que evidencia te haria confiar menos o mas?",
    ],
    "Media Literacy": [
      "Un video viral empieza a mitad de una discusion. Que contexto faltante podria cambiar la historia?",
      "Un titular te enoja antes de leer. Que deberias verificar antes de compartirlo?",
      "Un creador cuenta una historia emocional y luego vende un producto. Que incentivo debes notar?",
    ],
    "Logic & Debate": [
      "Alguien usa un ejemplo dramatico como si probara una regla general. Que pregunta debilita ese salto?",
      "En un debate, alguien ataca a la persona en vez del argumento. Como vuelves a la afirmacion central?",
      "Tu posicion tiene una buena objecion en contra. Como la explicarias con justicia antes de responder?",
    ],
    "People & Leadership": [
      "Un lider permite que la persona mas talentosa rompa reglas. Que mensaje recibe el equipo?",
      "Un amigo se disculpa, pero no cambia su conducta. Que deberias observar despues?",
      "Un grupo premia confianza mas que preparacion. Que errores aparecen con el tiempo?",
    ],
    "Strategic Thinking": [
      "Puedes ganar una discusion hoy o proteger una relacion importante. Que tradeoff deberia guiarte?",
      "Una empresa acepta ganancia rapida pero debilita su reputacion. Cuando conviene rechazar el beneficio?",
      "Que movimiento parece lento ahora, pero podria darte una posicion mas fuerte despues?",
    ],
    "Philosophy of History": [
      "Dos libros explican la caida de un imperio de formas distintas. Que evidencia compararias primero?",
      "Un monumento celebra una victoria. Que costos o voces podria estar ocultando esa memoria?",
      "Como contarian la misma guerra un soldado, un comerciante y una familia comun?",
    ],
    "Worldview & Cultures": [
      "Una costumbre parece extrana desde afuera. Que deberias aprender antes de juzgarla?",
      "Dos familias definen el exito de formas opuestas. Como pueden tener sentido ambas?",
      "Cuando el respeto cultural se convierte en excusa para ignorar un dano real?",
    ],
    "Ethics & Values": [
      "Una regla ayuda a la mayoria, pero perjudica a una persona en un caso raro. Deberia doblarse la regla?",
      "Un amigo pide que mientas para protegerlo de consecuencias. Que valor esta en prueba?",
      "Una promesa se vuelve danina de cumplir. Cuando seria correcto romperla?",
    ],
    "Creative Thinking": [
      "Un artista no puede usar color. Que otros recursos podrian hacer fuerte la obra?",
      "Un proyecto tiene una restriccion molesta. Como podria convertirse en ventaja creativa?",
      "Una historia es demasiado predecible. Que expectativa deberias invertir?",
    ],
    "Literature & Wisdom": [
      "En Macbeth, la ambicion se vuelve destructiva. Que senal muestra que una meta ya esta controlando a la persona?",
      "En Frankenstein, alguien crea algo poderoso y evita responsabilidad. Donde ves ese patron hoy?",
      "Que personaje confunde orgullo con fuerza, y que le cuesta esa confusion?",
    ],
    "Science & Evidence": [
      "Un estudio dice que dos cosas estan relacionadas. Que demostraria que una causa la otra?",
      "Una grafica parece dramatica por la escala. Como cambia eso tu reaccion?",
      "Un experimento funciona una vez. Que probaria repetirlo?",
    ],
    "Technology & AI": [
      "Un estudiante usa IA para escribir. Que ayuda es util y que aprendizaje podria perderse?",
      "Un algoritmo decide entrevistas de trabajo. A quien podria perjudicar injustamente?",
      "Una aplicacion optimiza atencion, no bienestar. Que conducta entrenara?",
    ],
    "Health & Habits": [
      "Una persona quiere dormir mejor, pero deja el telefono junto a la cama. Que senal del ambiente falla?",
      "Alguien empieza un plan muy duro y abandona en una semana. Que version pequena podria durar?",
      "Un habito funciona en semanas tranquilas, pero falla bajo presion. Que debe incluir el plan?",
    ],
    "Civic Thinking": [
      "Una ciudad quiere mas camaras de seguridad. Que intercambio entre seguridad y privacidad debe debatirse?",
      "Una politica ayuda a muchas personas un poco, pero perjudica mucho a unas pocas. Como deberia evaluarse?",
      "Como juzgarias la misma regla si tu grupo preferido perdiera poder?",
    ],
    "Personal Identity": [
      "Alguien dice 'asi soy yo' despues de hacer dano. Cuando la identidad se vuelve excusa?",
      "Una persona protege una etiqueta aunque ya no le ayuda. Que esta intentando conservar?",
      "Que seguiria siendo verdad sobre ti si una opinion importante cambiara?",
    ],
    Epistemology: [
      "Un amigo dice que algo es verdad porque todos lo repiten. Que revisarias primero?",
      "Una publicacion segura no muestra fuentes. Que la haria digna de confianza?",
      "Que opinion actual deberias tratar como incierta en vez de cerrada?",
    ],
  },
  fr: {
    "Work & Ambition": [
      "Un eleve semble occupe toute la journee, mais evite la tache la plus importante. Que devrait-il changer d'abord?",
      "Une personne veut progresser vite dans sa carriere. Quelle competence donnerait plus d'avantage que travailler plus d'heures?",
      "Une equipe recompense celui qui parle le plus, pas celui qui apporte le meilleur travail. Comment rendre la competence visible?",
    ],
    "Financial Judgment": [
      "Un ami veut investir parce que tout le monde est excite en ligne. Quelle question ralentirait et renforcerait son jugement?",
      "Un achat semble abordable par mois, mais cher au total. Quels couts manquent avant de decider?",
      "Une opportunite promet beaucoup de gain et peu de risque. Quelle preuve te ferait plus ou moins confiance?",
    ],
    "Media Literacy": [
      "Une video virale commence au milieu d'une dispute. Quel contexte manquant pourrait changer l'histoire?",
      "Un titre te met en colere avant la lecture. Que verifier avant de le partager?",
      "Un createur raconte une histoire emotionnelle puis vend un produit. Quelle incitation faut-il remarquer?",
    ],
    "Logic & Debate": [
      "Quelqu'un utilise un exemple dramatique comme preuve d'une regle generale. Quelle question affaiblit ce saut?",
      "Dans un debat, quelqu'un attaque la personne au lieu de l'argument. Comment revenir a l'affirmation centrale?",
      "Ta position a une objection solide. Comment l'expliquer justement avant de repondre?",
    ],
    "People & Leadership": [
      "Un leader laisse la personne la plus talentueuse enfreindre les regles. Quel message recoit l'equipe?",
      "Un ami s'excuse, mais ne change rien. Que faudrait-il observer ensuite?",
      "Un groupe recompense la confiance plus que la preparation. Quelles erreurs apparaissent avec le temps?",
    ],
    "Strategic Thinking": [
      "Tu peux gagner une dispute aujourd'hui ou proteger une relation importante. Quel compromis devrait te guider?",
      "Une entreprise accepte un profit rapide mais affaiblit sa reputation. Quand faut-il refuser le gain?",
      "Quel mouvement semble lent maintenant, mais pourrait donner une position plus forte plus tard?",
    ],
    "Philosophy of History": [
      "Deux livres expliquent la chute d'un empire differemment. Quelle preuve comparerais-tu d'abord?",
      "Un monument celebre une victoire. Quels couts ou quelles voix cette memoire pourrait-elle cacher?",
      "Comment un soldat, un marchand et une famille ordinaire raconteraient-ils la meme guerre?",
    ],
    "Worldview & Cultures": [
      "Une coutume semble etrange de l'exterieur. Que faudrait-il apprendre avant de la juger?",
      "Deux familles definissent le succes de facons opposees. Comment les deux peuvent-elles etre raisonnables?",
      "Quand le respect culturel devient-il une excuse pour ignorer un vrai tort?",
    ],
    "Ethics & Values": [
      "Une regle aide la majorite, mais nuit a une personne dans un cas rare. La regle devrait-elle plier?",
      "Un ami te demande de mentir pour eviter les consequences. Quelle valeur est mise a l'epreuve?",
      "Une promesse devient nuisible a tenir. Quand serait-il juste de la rompre?",
    ],
    "Creative Thinking": [
      "Un artiste ne peut pas utiliser la couleur. Quels autres outils pourraient rendre l'oeuvre forte?",
      "Un projet a une contrainte genante. Comment pourrait-elle devenir un avantage creatif?",
      "Une histoire est trop previsible. Quelle attente faudrait-il renverser?",
    ],
    "Literature & Wisdom": [
      "Dans Macbeth, l'ambition devient destructrice. Quel signe montre qu'un objectif controle deja la personne?",
      "Dans Frankenstein, quelqu'un cree quelque chose de puissant puis evite la responsabilite. Ou vois-tu ce schema aujourd'hui?",
      "Quel personnage confond l'orgueil avec la force, et que lui coute cette confusion?",
    ],
    "Science & Evidence": [
      "Une etude dit que deux choses sont liees. Qu'est-ce qui montrerait que l'une cause l'autre?",
      "Un graphique semble dramatique a cause de son echelle. Comment cela change-t-il ta reaction?",
      "Une experience marche une fois. Que prouverait sa repetition?",
    ],
    "Technology & AI": [
      "Un eleve utilise l'IA pour ecrire. Quelle aide est utile, et quel apprentissage pourrait etre perdu?",
      "Un algorithme choisit les entretiens d'embauche. Qui pourrait-il blesser injustement?",
      "Une application optimise l'attention, pas le bien-etre. Quel comportement va-t-elle entrainer?",
    ],
    "Health & Habits": [
      "Une personne veut mieux dormir, mais garde son telephone pres du lit. Quel signal de l'environnement pose probleme?",
      "Quelqu'un commence un plan tres dur et abandonne en une semaine. Quelle petite version pourrait durer?",
      "Une habitude marche pendant les semaines calmes, mais echoue sous pression. Que doit inclure le plan?",
    ],
    "Civic Thinking": [
      "Une ville veut plus de cameras de securite. Quel compromis entre securite et vie privee faut-il debattre?",
      "Une politique aide beaucoup de gens un peu, mais nuit fortement a quelques-uns. Comment l'evaluer?",
      "Comment jugerais-tu la meme regle si ton groupe prefere perdait le pouvoir?",
    ],
    "Personal Identity": [
      "Quelqu'un dit 'c'est juste comme ca que je suis' apres avoir blesse quelqu'un. Quand l'identite devient-elle une excuse?",
      "Une personne protege une etiquette meme si elle ne l'aide plus. Que cherche-t-elle a conserver?",
      "Qu'est-ce qui resterait vrai sur toi si une opinion importante changeait?",
    ],
    Epistemology: [
      "Un ami dit qu'une chose est vraie parce que tout le monde la repete. Que verifierais-tu d'abord?",
      "Une publication tres sure d'elle ne montre aucune source. Qu'est-ce qui la rendrait digne de confiance?",
      "Quelle opinion actuelle devrais-tu traiter comme incertaine plutot que definitive?",
    ],
  },
};

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
  en: {},
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
    "starter": "inicial",
    "intermediate": "intermedio",
    "advanced": "avanzado",
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
    "starter": "débutant",
    "intermediate": "intermédiaire",
    "advanced": "avancé",
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

export function localizeText(value: string | undefined, language: Language) {
  if (!value) return "";

  return phraseCopy[language][value] || value;
}
