"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { adaptChallengeForAge, ageBandLabel, normalizeAgeBand } from "@/lib/ageAdaptivePrompts";
import { challenges, getChallengeById, type Challenge } from "@/lib/challenges";
import { createTelemetryEvent, trackEvent } from "@/lib/telemetry";
import {
  cognitionFeedByLanguage,
  languageOptions,
  localizeChallenge,
  localizeText,
  type Language,
  uiCopy,
} from "@/lib/reasoningI18n";
import { slugifyCategory } from "@/lib/questionBank";

const initialFeedback = {
  score: 72,
  xp: 45,
  trait: "Tactical Thinking",
  analysis:
    "A strong answer should protect your reputation without reacting emotionally or escalating too early.",
  contrarian:
    "What if your first instinct creates a second problem while a calmer response builds leverage?",
  followUp:
    "What specific next step protects your position without overreacting?",
  strengths: ["strategic restraint", "long-term awareness"],
  verifier: {
    behavioral: {
      adaptability: 70,
      emotionalControl: 72,
      evidence: 68,
      incentives: 66,
    },
    score: 72,
    signals: {
      incentives: false,
    },
  },
  weaknesses: ["needs incentive analysis", "clarify the next step"],
};

const WELCOME_MESSAGE = "__uthynk_welcome__";

const categoryLinks = Array.from(
  new Set(challenges.map((challenge) => challenge.category))
);

const rankThresholds = [
  { rank: "Observer", xp: 0 },
  { rank: "Analyst", xp: 500 },
  { rank: "Strategist", xp: 1500 },
  { rank: "Architect", xp: 3500 },
  { rank: "Philosopher", xp: 6000 },
  { rank: "Master of Thought", xp: 10000 },
];

const thinkingLenses = [
  { id: "logic", labelKey: "lensLogic", descriptionKey: "lensDescriptionLogic" },
  { id: "incentives", labelKey: "lensIncentives", descriptionKey: "lensDescriptionIncentives" },
  { id: "ethics", labelKey: "lensEthics", descriptionKey: "lensDescriptionEthics" },
  { id: "history", labelKey: "lensHistory", descriptionKey: "lensDescriptionHistory" },
  { id: "strategy", labelKey: "lensStrategy", descriptionKey: "lensDescriptionStrategy" },
] as const;

const onboardingCopy = {
  en: {
    title: "How to use UThynk",
    intro:
      "UThynk is a reasoning workout. Answer the prompt, test one new perspective, then finish with a quick reflection.",
    steps: [
      {
        title: "Choose a thinking lens",
        text: "Logic checks whether the argument makes sense. Incentives looks at motivations and hidden interests. Ethics looks at fairness and values. History looks at patterns from the past. Strategy looks at long-term consequences.",
      },
      {
        title: "Answer and rate confidence",
        text: "Write a few clear sentences, then rate how confident you are. UThynk uses that to see whether your thinking moves after the challenge.",
      },
      {
        title: "Consider one new perspective",
        text: "UThynk should show an angle you may not have considered, then ask one follow-up before the final reflection.",
      },
      {
        title: "Complete the workout",
        text: "Finish the reflection, earn XP, save progress, and keep building your thinking profile across sessions.",
      },
    ],
    close: "Start thinking",
    reopen: "How to use",
  },
  es: {
    title: "Como usar UThynk",
    intro:
      "UThynk es un entrenamiento de razonamiento. Responde la pregunta, prueba una nueva perspectiva y termina con una reflexion breve.",
    steps: [
      {
        title: "Elige un enfoque",
        text: "Logica revisa si el argumento tiene sentido. Incentivos mira motivaciones ocultas. Etica mira valores. Historia mira patrones. Estrategia mira consecuencias a largo plazo.",
      },
      {
        title: "Responde y mide tu confianza",
        text: "Escribe unas frases claras y califica que tan seguro estas. UThynk usa eso para ver si tu pensamiento cambia despues del reto.",
      },
      {
        title: "Considera una nueva perspectiva",
        text: "UThynk debe mostrar un angulo que quizas no habias considerado y luego hacer una pregunta de seguimiento antes de la reflexion final.",
      },
      {
        title: "Completa el entrenamiento",
        text: "Termina la reflexion, gana XP, guarda tu progreso y sigue construyendo tu perfil de pensamiento entre sesiones.",
      },
    ],
    close: "Empezar",
    reopen: "Como usar",
  },
  fr: {
    title: "Comment utiliser UThynk",
    intro:
      "UThynk est un exercice de raisonnement. Reponds au prompt, teste une nouvelle perspective, puis termine par une courte reflexion.",
    steps: [
      {
        title: "Choisis une lentille",
        text: "Logique verifie si l'argument tient. Incitations regarde les motivations cachees. Ethique regarde les valeurs. Histoire regarde les schemas. Strategie regarde les consequences a long terme.",
      },
      {
        title: "Reponds et note ta confiance",
        text: "Ecris quelques phrases claires, puis note ton niveau de confiance. UThynk s'en sert pour voir si ta pensee evolue apres le defi.",
      },
      {
        title: "Considere une nouvelle perspective",
        text: "UThynk doit montrer un angle que tu n'avais peut-etre pas considere, puis poser une question de suivi avant la reflexion finale.",
      },
      {
        title: "Termine l'exercice",
        text: "Finis la reflexion, gagne de l'XP, sauvegarde ta progression et continue a construire ton profil de pensee entre les sessions.",
      },
    ],
    close: "Commencer",
    reopen: "Mode d'emploi",
  },
} satisfies Record<Language, {
  title: string;
  intro: string;
  steps: Array<{ title: string; text: string }>;
  close: string;
  reopen: string;
}>;

const thinkingToolCopy = {
  en: {
    section: "Thinking Tools",
    followUp: "Follow-Up",
    lab: "Lab",
    timeline: "Timeline",
    position: "Your position",
    support: "What backs it up?",
    assumptions: "Hidden assumptions",
  },
  es: {
    section: "Herramientas de pensamiento",
    followUp: "Seguimiento",
    lab: "Laboratorio",
    timeline: "Línea",
    position: "Tu posición",
    support: "Qué la respalda",
    assumptions: "Supuestos ocultos",
  },
  fr: {
    section: "Outils de pensée",
    followUp: "Suivi",
    lab: "Labo",
    timeline: "Parcours",
    position: "Ta position",
    support: "Ce qui l'appuie",
    assumptions: "Hypothèses cachées",
  },
} satisfies Record<Language, {
  section: string;
  followUp: string;
  lab: string;
  timeline: string;
  position: string;
  support: string;
  assumptions: string;
}>;

const pageText = {
  en: {
    active: "Active",
    adaptiveThinkingLabel: "Adaptive thinking:",
    adaptiveThinkingText: "you adjust your reasoning when new evidence appears.",
    advancedThinkingTools: "Advanced Thinking Tools",
    categoryHelper: "Choose a category to load a new active challenge.",
    confidenceAnswerQuestion: "How confident are you in your answer?",
    confidenceCheck: "Confidence Check",
    confidenceNow: "Confidence Now",
    confidenceNowQuestion: "How confident are you now?",
    continueReflection: "Continue to Reflection",
    createFreeProfile: "Create a free beta profile to continue.",
    createProfile: "Create Profile",
    daily: "Daily",
    dailyThinkingWorkout: "Daily Thinking Workout",
    dailyWorkout: "Daily workout",
    feedbackNav: "Feedback",
    finalReflection: "Final Reflection",
    followUpAnswer: "Follow-up answer",
    followUpInstruction: "Take a moment to explore this angle in your own words before reflecting.",
    followUpPlaceholder: "My answer to the follow-up is...",
    followUpQuestion: "Follow-up Question",
    freeGateText: "You used your 3 free UThynk challenges. Sign up to save memory, streaks, traits, and future sessions.",
    freeLeft: "free left",
    genericTraitExplanation: "This is the thinking habit UThynk is helping you strengthen.",
    giveFeedback: "Give Feedback",
    helpShapeBeta: "Help shape UThynk beta",
    independentVerification: "Independent Verification",
    later: "Later",
    lessons: "Lessons",
    liveSignalMetrics: "Metrics",
    liveSignalPatterns: "Patterns",
    moreInsightsUnlock: "More insights unlock after you complete the workout.",
    nextStage: "Next stage",
    nextStageStart: "Next stage: start a new challenge",
    no: "No",
    notAnsweredYet: "Not answered yet.",
    openCategoryQuestions: "Open {category} questions",
    perspectiveImpactQuestion: "Did this conversation help you see a perspective you hadn't considered?",
    perspectiveImpactText: "UThynk is measuring whether the conversation changed how you see the problem, not whether you agreed.",
    perspectiveLabel: "Perspective you may not have considered",
    perspectivePlaceholder: "The perspective I hadn't considered was...",
    plainFeedbackDefault: "Good direction. Now make the reasoning sharper by naming the strongest example and the strongest objection.",
    plainFeedbackEvidence: "I like where you're going, but I'm missing proof. What's the strongest example that supports your point?",
    plainFeedbackIncentive: "I like where you're going, but I'm missing motives. Who benefits if your answer is right?",
    plainFeedbackNext: "Good start. Now make it practical: what is the next step your reasoning points toward?",
    preparingFollowUp: "UThynk is preparing your follow-up...",
    profileNav: "Profile",
    progressTitle: "Reasoning Challenge Progress",
    quickFeedback: "Quick Feedback",
    reflectionOptional: "optional",
    reward: "Reward",
    signIn: "Sign in",
    softLaunchSurvey: "Soft Launch Survey",
    softLaunchSurveyText: "After a few conversations, tell us what was valuable, confusing, and whether UThynk showed you a perspective you had not considered.",
    somewhat: "Somewhat",
    stageAnswer: "Current stage: Answer",
    stageComplete: "Current stage: Complete",
    stageFollowUp: "Current stage: Follow-up",
    stagePreparing: "Current stage: Preparing follow-up",
    stageReflection: "Current stage: Reflection",
    startNextChallenge: "Start Next Challenge",
    stepWord: "Step",
    stepAnswer: "Answer",
    stepComplete: "Complete",
    stepFollowUp: "Follow-up",
    stepReflection: "Reflection",
    switch: "Switch",
    thinkDifferentlyQuestion: "Did this make you think differently?",
    todaysInsight: "Today's Insight",
    traitGrowthAvailable: "Trait growth available",
    traitImproved: "Trait improved",
    viewAllLessonCategories: "View all lesson categories",
    welcomeNew: "Welcome to UThynk. Start with one response and I will help you look at the problem from a sharper angle.",
    welcomeReturning: "Welcome back. I remember your previous reasoning patterns. Let's continue sharpening your thinking.",
    whyUthynkSaidThis: "Why UThynk said this",
    whyUseText: "Improve decisions, spot weak arguments, and track how your thinking evolves.",
    whyUseUthynk: "Why use UThynk?",
    workoutComplete: "Reasoning workout complete",
    yes: "Yes",
  },
  es: {
    active: "Activo",
    adaptiveThinkingLabel: "Pensamiento adaptable:",
    adaptiveThinkingText: "ajustas tu razonamiento cuando aparece nueva evidencia.",
    advancedThinkingTools: "Herramientas avanzadas de pensamiento",
    categoryHelper: "Elige una categoria para cargar un nuevo reto activo.",
    confidenceAnswerQuestion: "Que tan seguro estas de tu respuesta?",
    confidenceCheck: "Revision de confianza",
    confidenceNow: "Confianza ahora",
    confidenceNowQuestion: "Que tan seguro estas ahora?",
    continueReflection: "Continuar a la reflexion",
    createFreeProfile: "Crea un perfil beta gratuito para continuar.",
    createProfile: "Crear perfil",
    daily: "Diario",
    dailyThinkingWorkout: "Entrenamiento diario de pensamiento",
    dailyWorkout: "Entrenamiento diario",
    feedbackNav: "Comentarios",
    finalReflection: "Reflexion final",
    followUpAnswer: "Respuesta de seguimiento",
    followUpInstruction: "Toma un momento para explorar este angulo con tus propias palabras antes de reflexionar.",
    followUpPlaceholder: "Mi respuesta al seguimiento es...",
    followUpQuestion: "Pregunta de seguimiento",
    freeGateText: "Usaste tus 3 retos gratuitos de UThynk. Registrate para guardar memoria, rachas, rasgos y sesiones futuras.",
    freeLeft: "gratis restantes",
    genericTraitExplanation: "Este es el habito de pensamiento que UThynk te esta ayudando a fortalecer.",
    giveFeedback: "Dar comentarios",
    helpShapeBeta: "Ayuda a moldear la beta de UThynk",
    independentVerification: "Verificacion independiente",
    later: "Despues",
    lessons: "Lecciones",
    liveSignalMetrics: "Metricas",
    liveSignalPatterns: "Patrones",
    moreInsightsUnlock: "Mas ideas se desbloquean cuando completes el entrenamiento.",
    nextStage: "Siguiente etapa",
    nextStageStart: "Siguiente etapa: iniciar un nuevo reto",
    no: "No",
    notAnsweredYet: "Aun no respondido.",
    openCategoryQuestions: "Abrir preguntas de {category}",
    perspectiveImpactQuestion: "Esta conversacion te ayudo a ver una perspectiva que no habias considerado?",
    perspectiveImpactText: "UThynk mide si la conversacion cambio como ves el problema, no si estuviste de acuerdo.",
    perspectiveLabel: "Perspectiva que quizas no habias considerado",
    perspectivePlaceholder: "La perspectiva que no habia considerado fue...",
    plainFeedbackDefault: "Vas en buena direccion. Ahora afina el razonamiento nombrando el ejemplo mas fuerte y la objecion mas fuerte.",
    plainFeedbackEvidence: "Me gusta hacia donde vas, pero falta prueba. Cual es el ejemplo mas fuerte que apoya tu punto?",
    plainFeedbackIncentive: "Me gusta hacia donde vas, pero faltan los motivos. Quien gana si tu respuesta es correcta?",
    plainFeedbackNext: "Buen comienzo. Ahora hazlo practico: cual es el siguiente paso que apunta tu razonamiento?",
    preparingFollowUp: "UThynk esta preparando tu seguimiento...",
    profileNav: "Perfil",
    progressTitle: "Progreso del reto de razonamiento",
    quickFeedback: "Comentario rapido",
    reflectionOptional: "opcional",
    reward: "Recompensa",
    signIn: "Iniciar sesion",
    softLaunchSurvey: "Encuesta beta",
    softLaunchSurveyText: "Despues de algunas conversaciones, dinos que fue valioso, confuso y si UThynk te mostro una perspectiva que no habias considerado.",
    somewhat: "Algo",
    stageAnswer: "Etapa actual: Respuesta",
    stageComplete: "Etapa actual: Completo",
    stageFollowUp: "Etapa actual: Seguimiento",
    stagePreparing: "Etapa actual: preparando seguimiento",
    stageReflection: "Etapa actual: Reflexion",
    startNextChallenge: "Iniciar siguiente reto",
    stepWord: "Paso",
    stepAnswer: "Respuesta",
    stepComplete: "Completo",
    stepFollowUp: "Seguimiento",
    stepReflection: "Reflexion",
    switch: "Cambiar",
    thinkDifferentlyQuestion: "Esto te hizo pensar de forma diferente?",
    todaysInsight: "Idea de hoy",
    traitGrowthAvailable: "Crecimiento de rasgo disponible",
    traitImproved: "Rasgo mejorado",
    viewAllLessonCategories: "Ver todas las categorias de lecciones",
    welcomeNew: "Bienvenido a UThynk. Empieza con una respuesta y te ayudare a mirar el problema desde un angulo mas claro.",
    welcomeReturning: "Bienvenido de nuevo. Recuerdo tus patrones de razonamiento previos. Sigamos afinando tu pensamiento.",
    whyUthynkSaidThis: "Por que UThynk dijo esto",
    whyUseText: "Mejora decisiones, detecta argumentos debiles y sigue como evoluciona tu pensamiento.",
    whyUseUthynk: "Por que usar UThynk?",
    workoutComplete: "Entrenamiento de razonamiento completo",
    yes: "Si",
  },
  fr: {
    active: "Actif",
    adaptiveThinkingLabel: "Pensee adaptative :",
    adaptiveThinkingText: "tu ajustes ton raisonnement quand de nouvelles preuves apparaissent.",
    advancedThinkingTools: "Outils de pensee avances",
    categoryHelper: "Choisis une categorie pour charger un nouveau defi actif.",
    confidenceAnswerQuestion: "A quel point es-tu sur de ta reponse ?",
    confidenceCheck: "Verification de confiance",
    confidenceNow: "Confiance maintenant",
    confidenceNowQuestion: "A quel point es-tu sur maintenant ?",
    continueReflection: "Continuer vers la reflexion",
    createFreeProfile: "Cree un profil beta gratuit pour continuer.",
    createProfile: "Creer un profil",
    daily: "Quotidien",
    dailyThinkingWorkout: "Exercice quotidien de pensee",
    dailyWorkout: "Exercice quotidien",
    feedbackNav: "Avis",
    finalReflection: "Reflexion finale",
    followUpAnswer: "Reponse de suivi",
    followUpInstruction: "Prends un moment pour explorer cet angle avec tes propres mots avant de reflechir.",
    followUpPlaceholder: "Ma reponse au suivi est...",
    followUpQuestion: "Question de suivi",
    freeGateText: "Tu as utilise tes 3 defis UThynk gratuits. Inscris-toi pour enregistrer memoire, series, traits et futures sessions.",
    freeLeft: "gratuits restants",
    genericTraitExplanation: "C'est l'habitude de pensee qu'UThynk t'aide a renforcer.",
    giveFeedback: "Donner un avis",
    helpShapeBeta: "Aide a faconner la beta UThynk",
    independentVerification: "Verification independante",
    later: "Plus tard",
    lessons: "Lecons",
    liveSignalMetrics: "Mesures",
    liveSignalPatterns: "Schemas",
    moreInsightsUnlock: "Plus d'idees se debloquent quand tu termines l'exercice.",
    nextStage: "Prochaine etape",
    nextStageStart: "Prochaine etape : commencer un nouveau defi",
    no: "Non",
    notAnsweredYet: "Pas encore repondu.",
    openCategoryQuestions: "Ouvrir les questions {category}",
    perspectiveImpactQuestion: "Cette conversation t'a-t-elle aide a voir une perspective que tu n'avais pas consideree ?",
    perspectiveImpactText: "UThynk mesure si la conversation a change ta facon de voir le probleme, pas si tu etais d'accord.",
    perspectiveLabel: "Perspective que tu n'avais peut-etre pas consideree",
    perspectivePlaceholder: "La perspective que je n'avais pas consideree etait...",
    plainFeedbackDefault: "Bonne direction. Maintenant rends le raisonnement plus net en nommant le meilleur exemple et la meilleure objection.",
    plainFeedbackEvidence: "J'aime la direction, mais il manque une preuve. Quel est le meilleur exemple qui soutient ton point ?",
    plainFeedbackIncentive: "J'aime la direction, mais il manque les motivations. Qui gagne si ta reponse est juste ?",
    plainFeedbackNext: "Bon debut. Maintenant rends-le pratique : quelle prochaine etape ton raisonnement indique-t-il ?",
    preparingFollowUp: "UThynk prepare ton suivi...",
    profileNav: "Profil",
    progressTitle: "Progression du defi de raisonnement",
    quickFeedback: "Avis rapide",
    reflectionOptional: "facultatif",
    reward: "Recompense",
    signIn: "Connexion",
    softLaunchSurvey: "Sondage beta",
    softLaunchSurveyText: "Apres quelques conversations, dis-nous ce qui etait utile, confus, et si UThynk t'a montre une perspective que tu n'avais pas consideree.",
    somewhat: "Un peu",
    stageAnswer: "Etape actuelle : Reponse",
    stageComplete: "Etape actuelle : Termine",
    stageFollowUp: "Etape actuelle : Suivi",
    stagePreparing: "Etape actuelle : preparation du suivi",
    stageReflection: "Etape actuelle : Reflexion",
    startNextChallenge: "Commencer le defi suivant",
    stepWord: "Etape",
    stepAnswer: "Reponse",
    stepComplete: "Termine",
    stepFollowUp: "Suivi",
    stepReflection: "Reflexion",
    switch: "Changer",
    thinkDifferentlyQuestion: "Cela t'a-t-il fait penser differemment ?",
    todaysInsight: "Idee du jour",
    traitGrowthAvailable: "Progression de trait disponible",
    traitImproved: "Trait ameliore",
    viewAllLessonCategories: "Voir toutes les categories de lecons",
    welcomeNew: "Bienvenue sur UThynk. Commence par une reponse et je t'aiderai a regarder le probleme sous un angle plus net.",
    welcomeReturning: "Bon retour. Je me souviens de tes schemas de raisonnement precedents. Continuons a affiner ta pensee.",
    whyUthynkSaidThis: "Pourquoi UThynk a dit cela",
    whyUseText: "Ameliore tes decisions, repere les arguments faibles et suis l'evolution de ta pensee.",
    whyUseUthynk: "Pourquoi utiliser UThynk ?",
    workoutComplete: "Exercice de raisonnement termine",
    yes: "Oui",
  },
} satisfies Record<Language, Record<string, string>>;

function getProgressionState(xp: number) {
  const currentIndex = rankThresholds.findLastIndex((item) => xp >= item.xp);
  const current = rankThresholds[Math.max(0, currentIndex)];
  const next = rankThresholds[Math.min(rankThresholds.length - 1, currentIndex + 1)];

  if (!next || current.rank === next.rank) {
    return { percent: 100, value: `${xp} XP` };
  }

  const earnedInRank = xp - current.xp;
  const neededForRank = next.xp - current.xp;
  const percent = Math.max(4, Math.min(100, Math.round((earnedInRank / neededForRank) * 100)));

  return { percent, value: `${xp} XP` };
}

function getTraitExplanation(_trait: string, fallback: string) {
  return fallback;
}

function ReasoningExperience({
  language,
}: {
  language: Language;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialChallenge = useMemo(() => {
    const requestedId = searchParams.get("id");

    if (requestedId) {
      return getChallengeById(requestedId);
    }

    if (typeof window === "undefined") {
      return getChallengeById();
    }

    const seenIds = JSON.parse(
      localStorage.getItem("uthynk-seen-challenge-ids") || "[]"
    ) as string[];
    const freshPool = challenges.filter((item) => !seenIds.includes(item.id));
    const pool = freshPool.length ? freshPool : challenges;

    return pool[Math.floor(Math.random() * pool.length)] || getChallengeById();
  }, [searchParams]);
  const [challenge, setChallenge] = useState<Challenge>(initialChallenge);

  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState("");
  const [difficulty, setDifficulty] = useState(challenge.difficulty);
  const [pressure, setPressure] = useState("Moderate");
  const [profile, setProfile] = useState<any>(null);
  const [rightTab, setRightTab] = useState<"categories" | "insights" | "analysis">("insights");
  const [thinkingToolTab, setThinkingToolTab] = useState<"followUp" | "lab" | "timeline">("followUp");
  const [leftSignalTab, setLeftSignalTab] = useState<"patterns" | "metrics">("patterns");
  const [thinkingLens, setThinkingLens] = useState<(typeof thinkingLenses)[number]["id"]>("logic");
  const [evaluatedClaim, setEvaluatedClaim] = useState("");
  const [workoutStage, setWorkoutStage] = useState<"answer" | "challenge" | "followUp" | "reflection" | "complete">("answer");
  const [followUpResponse, setFollowUpResponse] = useState("");
  const [reflection, setReflection] = useState("");
  const [confidenceBefore, setConfidenceBefore] = useState(7);
  const [confidenceAfter, setConfidenceAfter] = useState(7);
  const [perspectiveImpact, setPerspectiveImpact] = useState("");
  const [standoutPerspective, setStandoutPerspective] = useState("");
  const [completionFeedback, setCompletionFeedback] = useState("");
  const [showSoftLaunchSurvey, setShowSoftLaunchSurvey] = useState(false);
  const [latestReward, setLatestReward] = useState<any>(null);
  const [feedback, setFeedback] = useState({
    ...initialFeedback,
    trait: challenge.trait,
  });
  const [freePassUsed, setFreePassUsed] = useState(0);
  const [conversation, setConversation] = useState<any[]>([
    {
      role: "uthynk",
      content: WELCOME_MESSAGE,
    },
  ]);
  const copy = uiCopy[language];
  const text = pageText[language];
  const toolsCopy = thinkingToolCopy[language];
  const isDailyWorkout = searchParams.get("source") === "daily";
  const ageBand = normalizeAgeBand(profile?.age_band);
  const ageAdjustedChallenge = adaptChallengeForAge(challenge, ageBand);
  const visibleChallenge = localizeChallenge(ageAdjustedChallenge, language);
  const visibleFeedback = {
    ...feedback,
    analysis: localizeText(feedback.analysis, language),
    contrarian: localizeText(feedback.contrarian, language),
    followUp: localizeText(feedback.followUp, language),
    trait: localizeText(feedback.trait, language),
    strengths: feedback.strengths.map((item) => localizeText(item, language)),
    weaknesses: feedback.weaknesses.map((item) => localizeText(item, language)),
  };
  const visibleCategoryLinks = categoryLinks.map((category) => {
    const matchingChallenge = challenges.find((item) => item.category === category);

    return {
      category,
      href: `/lessons/${slugifyCategory(category)}`,
      label: matchingChallenge
        ? localizeChallenge(matchingChallenge, language).category
        : category,
    };
  });
  const visibleDifficulty = localizeText(difficulty, language);
  const visiblePressure = localizeText(pressure, language);
  const progressionState = getProgressionState(profile?.xp || 0);
  const evidenceDelta = Math.max(
    1,
    Math.round(((feedback.verifier?.behavioral?.evidence || feedback.score || 70) - 62) / 8)
  );
  const topWeakness = visibleFeedback.weaknesses[0]?.toLowerCase() || "";
  const hasPriorThinkingHistory = Boolean(
    profile?.id &&
      ((profile?.xp || 0) > 0 ||
        (profile?.streak || 0) > 0 ||
        (profile?.completed_challenges || 0) > 0)
  );
  const plainFeedback =
    topWeakness.includes("incentive")
      ? text.plainFeedbackIncentive
      : topWeakness.includes("evidence") || topWeakness.includes("proof")
        ? text.plainFeedbackEvidence
        : topWeakness.includes("next")
          ? text.plainFeedbackNext
      : text.plainFeedbackDefault;

  const recognitionRef = useRef<any>(null);
  const workoutStageRef = useRef(workoutStage);
  const conversationIdRef = useRef<string>("");
  const sessionIdRef = useRef<string>("");

  useEffect(() => {
    workoutStageRef.current = workoutStage;
  }, [workoutStage]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedProfile = localStorage.getItem("uthynk-profile");
    const parsedProfile = storedProfile ? JSON.parse(storedProfile) : null;
    setProfile(parsedProfile);
    setFreePassUsed(Number(localStorage.getItem("uthynk-free-pass-used") || "0"));
    trackEvent(
      createTelemetryEvent("reasoning_arrived", parsedProfile?.id, {
        challengeId: challenge.id,
        category: challenge.category,
      })
    );
    const today = new Date().toISOString().slice(0, 10);
    const lastVisit = localStorage.getItem("uthynk-last-visit-date");

    if (lastVisit && lastVisit !== today) {
      trackEvent(
        createTelemetryEvent("returned_next_day", parsedProfile?.id, {
          lastVisit,
          returnedAt: today,
        })
      );
    }

    localStorage.setItem("uthynk-last-visit-date", today);

    conversationIdRef.current =
      conversationIdRef.current ||
      localStorage.getItem("uthynk-conversation-id") ||
      crypto.randomUUID();
    sessionIdRef.current = crypto.randomUUID();
    localStorage.setItem("uthynk-conversation-id", conversationIdRef.current);
    localStorage.setItem(
      "uthynk-seen-challenge-ids",
      JSON.stringify(
        Array.from(
          new Set([
            ...JSON.parse(localStorage.getItem("uthynk-seen-challenge-ids") || "[]"),
            challenge.id,
          ])
        )
      )
    );

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language === "es" ? "es-US" : language === "fr" ? "fr-FR" : "en-US";

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0]?.transcript || '')
        .join(' ');

      if (workoutStageRef.current === "followUp") {
        setFollowUpResponse(transcript);
      } else if (workoutStageRef.current === "reflection") {
        setReflection(transcript);
      } else {
        setResponse(transcript);
      }
    };

    recognitionRef.current = recognition;
  }, [challenge.id, language]);

  function selectNextChallenge(currentChallenge: Challenge, score: number) {
    const preferredDifficulty =
      score >= 88 ? "strategic" : score >= 76 ? "critical" : score >= 62 ? "practical" : "everyday";
    const seenIds =
      typeof window === "undefined"
        ? []
        : (JSON.parse(localStorage.getItem("uthynk-seen-challenge-ids") || "[]") as string[]);
    const categoryPool = challenges.filter(
      (item) =>
        item.id !== currentChallenge.id &&
        item.category === currentChallenge.category &&
        !seenIds.includes(item.id)
    );
    const difficultyPool = challenges.filter(
      (item) =>
        item.id !== currentChallenge.id &&
        item.difficulty === preferredDifficulty &&
        !seenIds.includes(item.id)
    );
    const freshPool = challenges.filter(
      (item) => item.id !== currentChallenge.id && !seenIds.includes(item.id)
    );
    const fallbackPool = challenges.filter((item) => item.id !== currentChallenge.id);
    const pool = categoryPool.length
      ? categoryPool
      : difficultyPool.length
        ? difficultyPool
        : freshPool.length
          ? freshPool
          : fallbackPool;
    const seed = Date.now() + score + currentChallenge.id.length;

    return pool[seed % pool.length] || currentChallenge;
  }

  function selectCategory(category: string) {
    const seenIds =
      typeof window === "undefined"
        ? []
        : (JSON.parse(localStorage.getItem("uthynk-seen-challenge-ids") || "[]") as string[]);
    const categoryPool = challenges.filter(
      (item) => item.category === category && !seenIds.includes(item.id)
    );
    const fallbackPool = challenges.filter((item) => item.category === category);
    const pool = categoryPool.length ? categoryPool : fallbackPool;
    const nextChallenge = pool[(Date.now() + category.length) % pool.length];

    if (!nextChallenge) return;

    setChallenge(nextChallenge);
    setDifficulty(nextChallenge.difficulty);
    setPressure(
      nextChallenge.difficulty === "strategic" || nextChallenge.difficulty === "critical"
        ? "High"
        : nextChallenge.difficulty === "everyday"
          ? "Low"
          : "Moderate"
    );
    setResponse("");
    setFollowUpResponse("");
    setReflection("");
    setConfidenceAfter(confidenceBefore);
    setPerspectiveImpact("");
    setStandoutPerspective("");
    setCompletionFeedback("");
    setShowSoftLaunchSurvey(false);
    setEvaluatedClaim("");
    setLatestReward(null);
    setWorkoutStage("answer");
    setStreamingText("");
    setError("");
    trackEvent(
      createTelemetryEvent("selected_category", profile?.id, {
        category,
        challengeId: nextChallenge.id,
        source: "reasoning_right_rail",
      })
    );

    if (typeof window !== "undefined") {
      const nextSeen = Array.from(new Set([...seenIds, nextChallenge.id]));
      localStorage.setItem("uthynk-seen-challenge-ids", JSON.stringify(nextSeen));
      const currentPath = window.location.pathname === "/" ? "/" : "/reasoning";
      window.history.replaceState(null, "", `${currentPath}?id=${nextChallenge.id}`);
    }
  }

  function startVoiceInput() {
    recognitionRef.current?.start();
  }

  function stopVoiceInput() {
    recognitionRef.current?.stop();
  }

  function startNextWorkout() {
    const nextChallenge = selectNextChallenge(challenge, feedback.score || visibleFeedback.score || 70);

    setChallenge(nextChallenge);
    setDifficulty(nextChallenge.difficulty);
    setPressure(
      nextChallenge.difficulty === "strategic" || nextChallenge.difficulty === "critical"
        ? "High"
        : nextChallenge.difficulty === "everyday"
          ? "Low"
          : "Moderate"
    );
    setResponse("");
    setFollowUpResponse("");
    setReflection("");
    setConfidenceAfter(confidenceBefore);
    setPerspectiveImpact("");
    setStandoutPerspective("");
    setCompletionFeedback("");
    setShowSoftLaunchSurvey(false);
    setEvaluatedClaim("");
    setLatestReward(null);
    setWorkoutStage("answer");
    setStreamingText("");
    setError("");

    trackEvent(
      createTelemetryEvent("started_next_workout", profile?.id, {
        challengeId: nextChallenge.id,
        category: nextChallenge.category,
        difficulty: nextChallenge.difficulty,
      })
    );

    if (typeof window !== "undefined") {
      const seenIds = JSON.parse(
        localStorage.getItem("uthynk-seen-challenge-ids") || "[]"
      ) as string[];
      localStorage.setItem(
        "uthynk-seen-challenge-ids",
        JSON.stringify(Array.from(new Set([...seenIds, nextChallenge.id])))
      );
      const currentPath = window.location.pathname === "/" ? "/" : "/reasoning";
      window.history.replaceState(null, "", `${currentPath}?id=${nextChallenge.id}`);
    }
  }

  function completeWorkout() {
    if (!perspectiveImpact) return;

    const confidenceChange = confidenceAfter - confidenceBefore;
    const completedCount =
      typeof window === "undefined"
        ? 0
        : Number(localStorage.getItem("uthynk-completed-workouts") || "0") + 1;

    setWorkoutStage("complete");

    if (typeof window !== "undefined") {
      const surveyDismissed = localStorage.getItem("uthynk-soft-launch-survey-dismissed") === "true";

      localStorage.setItem("uthynk-completed-workouts", String(completedCount));
      if (completedCount >= 3 && !surveyDismissed) {
        fetch("/api/survey")
          .then((response) => response.json())
          .then((payload) => {
            if (!payload.eligible) return;

            setShowSoftLaunchSurvey(true);
            localStorage.setItem("uthynk-soft-launch-survey-dismissed", "true");
            fetch("/api/survey", {
              body: JSON.stringify({
                action: "prompted",
                createdAt: new Date().toISOString(),
              }),
              headers: { "Content-Type": "application/json" },
              method: "POST",
            }).catch(() => null);
          })
          .catch(() => {
            setShowSoftLaunchSurvey(true);
            localStorage.setItem("uthynk-soft-launch-survey-dismissed", "true");
          });
      }
    }

    trackEvent(
      createTelemetryEvent("completed_workout_reflection", profile?.id, {
        category: challenge.category,
        challengeId: challenge.id,
        confidenceAfter,
        confidenceBefore,
        confidenceChange,
        perspectiveImpact,
        reflectionLength: reflection.length,
        score: feedback.score,
        standoutPerspectiveLength: standoutPerspective.length,
      })
    );
  }

  function continueToReflection() {
    if (!followUpResponse.trim()) return;

    setConversation((prev) => [
      ...prev,
      {
        role: "user",
        content: followUpResponse,
      },
    ]);
    setWorkoutStage("reflection");
    trackEvent(
      createTelemetryEvent("submitted_follow_up_response", profile?.id, {
        category: challenge.category,
        challengeId: challenge.id,
        responseLength: followUpResponse.length,
      })
    );
  }

  async function analyzeReasoning() {
    try {
      setLoading(true);
      setError("");
      setStreamingText("");
      setWorkoutStage("challenge");
      let activeProfile: any = null;

      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("uthynk-profile");
        activeProfile = stored ? JSON.parse(stored) : null;
        const used = Number(localStorage.getItem("uthynk-free-pass-used") || "0");

        if (!activeProfile?.id && used >= 3) {
          router.push("/login?reason=free-pass");
          return;
        }
      }

      setConversation((prev) => [
        ...prev,
        {
          role: "user",
          content: response,
        },
      ]);
      trackEvent(
        createTelemetryEvent("submitted_answer", activeProfile?.id, {
          category: challenge.category,
          challengeId: challenge.id,
          confidenceBefore,
          language,
          responseLength: response.length,
          thinkingLens,
        })
      );

      const res = await fetch("/api/reasoning", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          challengeId: challenge.id,
          ageBand,
          category: challenge.category,
          challenge: `${visibleChallenge.prompt}\nThinking lens: ${thinkingLens}`,
          language,
          response,
          conversationId: conversationIdRef.current,
          sessionId: sessionIdRef.current,
          thinkingLens,
          userId: activeProfile?.id,
          stream: true,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.code === "auth_required") {
          router.push("/login?reason=free-pass");
          return;
        }
        setError(data.error || "Reasoning analysis failed.");
        setWorkoutStage("answer");
        return;
      }

      if (!res.body) {
        setError("Reasoning stream did not start.");
        setWorkoutStage("answer");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let data: any = null;

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
          const eventType = event
            .split("\n")
            .find((line) => line.startsWith("event:"))
            ?.replace("event:", "")
            .trim();
          const eventData = event
            .split("\n")
            .find((line) => line.startsWith("data:"))
            ?.replace("data:", "")
            .trim();

          if (!eventData) continue;

          const payload = JSON.parse(eventData);

          if (eventType === "token") {
            setStreamingText((prev) => prev + payload.token);
          }

          if (eventType === "final") {
            data = payload;
          }

          if (eventType === "error") {
            setError(payload.error || "Reasoning stream failed.");
          }
        }
      }

      if (!data) {
        setError("Reasoning analysis ended without final feedback.");
        setWorkoutStage("answer");
        return;
      }

      setEvaluatedClaim(response);
      trackEvent(
        createTelemetryEvent("completed_reasoning_loop", activeProfile?.id, {
          category: challenge.category,
          challengeId: challenge.id,
          freePassUser: !activeProfile?.id,
          score: data.score,
          xp: data.xp,
        })
      );
      if (!activeProfile?.id && typeof window !== "undefined") {
        const nextFreePassUsed = Math.min(
          3,
          Number(localStorage.getItem("uthynk-free-pass-used") || "0") + 1
        );
        localStorage.setItem("uthynk-free-pass-used", String(nextFreePassUsed));
        document.cookie = `uthynk-free-pass-used=${nextFreePassUsed}; path=/; max-age=2592000; SameSite=Lax`;
        setFreePassUsed(nextFreePassUsed);
      }
      setFeedback({ ...data, trait: data.trait || challenge.trait });
      setLatestReward({
        evidenceDelta: Math.max(
          1,
          Math.round(((data.verifier?.behavioral?.evidence || data.score || 70) - 62) / 8)
        ),
        pattern: data.trait || challenge.trait,
        xp: data.xp || 8,
      });

      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("uthynk-profile");
        const profile = stored ? JSON.parse(stored) : {};
        const today = new Date().toISOString().slice(0, 10);
        const lastCompleted = localStorage.getItem("uthynk-last-completed-date");
        const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
        const localStreak =
          lastCompleted === today
            ? profile.streak || 0
            : lastCompleted === yesterday
              ? (profile.streak || 0) + 1
              : 1;
        const nextProfile = {
          ...profile,
          xp: data.progression?.xp ?? (profile.xp || 0) + (data.xp || 0),
          streak: data.progression?.streak ?? localStreak,
          rank: data.progression?.rank ?? profile.rank,
          reasoning_score:
            data.progression?.reasoningScore ?? data.score ?? profile.reasoning_score,
          primary_trait:
            data.progression?.evolvedTrait?.traitName ||
            data.trait ||
            profile.primary_trait,
        };

        localStorage.setItem("uthynk-profile", JSON.stringify(nextProfile));
        setProfile(nextProfile);
        localStorage.setItem("uthynk-last-completed-date", today);
        document.cookie = `uthynk-profile=${encodeURIComponent(
          JSON.stringify(nextProfile)
        )}; path=/; max-age=2592000; SameSite=Lax`;
      }

      const uthynkMessage = `${data.analysis}\n\n${text.perspectiveLabel}: ${data.contrarian}\n\n${text.followUpQuestion}: ${data.followUp}`;

      setConversation((prev) => [
        ...prev,
        {
          role: "uthynk",
          content: uthynkMessage,
        },
      ]);

      if (data.score >= 88) {
        setDifficulty('strategic');
        setPressure('High');
      } else if (data.score >= 76) {
        setDifficulty('critical');
        setPressure('High');
      } else if (data.score >= 62) {
        setDifficulty('practical');
        setPressure('Moderate');
      } else {
        setDifficulty('everyday');
        setPressure('Low');
      }

      setResponse("");
      setFollowUpResponse("");
      setWorkoutStage("followUp");
      trackEvent(
        createTelemetryEvent("received_challenge", activeProfile?.id, {
          challengeId: challenge.id,
          category: challenge.category,
          difficulty,
          followUpLength: data.followUp?.length || 0,
        })
      );
    } catch {
      setError("Unable to analyze reasoning right now.");
      setWorkoutStage("answer");
    } finally {
      setLoading(false);
    }
  }

  const timeline = [
    {
      title: copy.sessionContinuity,
      text: `${conversation.length} ${copy.sessionTurns} ${visiblePressure}.`,
    },
    {
      title: copy.priorContradiction,
      text: visibleFeedback.contrarian,
    },
    {
      title: copy.evolvingInsight,
      text: visibleFeedback.analysis,
    },
    {
      title: copy.recursiveFollowUp,
      text: visibleFeedback.followUp,
    },
  ];
  const primaryIdentity = localizeText(profile?.primary_trait, language) || visibleFeedback.trait;
  const traitExplanation = getTraitExplanation(primaryIdentity, text.genericTraitExplanation);
  const secondaryMode = visibleFeedback.strengths[0] || "Strategic restraint";
  const growthEdge = visibleFeedback.weaknesses[0] || "Evidence strength";
  const biasWatch =
    feedback.verifier?.signals?.incentives
      ? "Incentive blind spot"
      : (100 - (feedback.verifier?.behavioral?.emotionalControl || 50)) > 35
        ? "Emotional rigidity"
        : "Overconfidence";
  const selectedLens =
    thinkingLenses.find((lens) => lens.id === thinkingLens) || thinkingLenses[0];
  const activeLens = selectedLens.labelKey;
  const activeLensDescription = copy[selectedLens.descriptionKey];
  const questionType =
    thinkingLens === "incentives"
      ? copy.incentiveMap
      : thinkingLens === "ethics"
        ? copy.valueConflict
        : thinkingLens === "history"
          ? copy.patternTest
          : thinkingLens === "strategy"
            ? copy.tradeoffMove
            : copy.evidenceTest;
  const workoutSteps = [
    { id: "answer", label: text.stepAnswer },
    { id: "followUp", label: text.stepFollowUp },
    { id: "reflection", label: text.stepReflection },
    { id: "complete", label: text.stepComplete },
  ] as const;
  const confidenceScale = Array.from({ length: 10 }, (_, index) => index + 1);
  const perspectiveOptions = [text.yes, text.somewhat, text.no];
  const displayedWorkoutStage = workoutStage === "challenge" ? "followUp" : workoutStage;
  const workoutStageIndex = workoutSteps.findIndex((step) => step.id === displayedWorkoutStage);
  const nextWorkoutStep =
    workoutSteps[Math.min(workoutSteps.length - 1, Math.max(0, workoutStageIndex + 1))];
  const hasCompletedWorkout = workoutStage === "complete";
  const hasStartedFeedback = Boolean(evaluatedClaim);
  const expectedReward = latestReward?.xp || 20;
  const todaysInsight = cognitionFeedByLanguage[language][0];

  return (
    <section className="uthynkReasoningLayout">
      <aside className="uthynkSidePanel uthynkLeftPanel">
        <section className="leftRailSection identitySummaryCard">
          <div className="panelLabel">{copy.identity}</div>
          <strong className="identityRank">{localizeText(profile?.rank || "Observer", language)}</strong>
          <div className="identityMetaGrid">
            <div>
              <span>{copy.streak}</span>
              <strong>{profile?.streak || 0} {copy.streakDays}</strong>
            </div>
            <div>
              <span>XP</span>
              <strong>{progressionState.value}</strong>
            </div>
          </div>
          <div>
            <span>{copy.trait}</span>
            <strong>{primaryIdentity}</strong>
          </div>
          <p className="traitExplanation">{traitExplanation}</p>
          <div className="progressBar" aria-label={copy.identityProgression}>
            <div
              className="progressFill uthynkProgressFill"
              style={{ width: `${progressionState.percent}%` }}
            />
          </div>
        </section>

        <section className="leftRailSection whyUthynkCard">
          <div className="panelLabel">{text.whyUseUthynk}</div>
          <p>{text.whyUseText}</p>
          <p><strong>{text.adaptiveThinkingLabel}</strong> {text.adaptiveThinkingText}</p>
        </section>

        <details className="leftRailDetails" open={hasCompletedWorkout}>
          <summary>{copy.thinkingProfile}</summary>
          <section className="leftRailSection profileSignalCard">
          <div className="panelLabel">{copy.thinkingProfile}</div>
          <div className="profileRows">
            <div><span>{copy.primaryMode}</span><strong>{primaryIdentity}</strong></div>
            <div><span>{copy.style}</span><strong>{localizeText(secondaryMode, language)}</strong></div>
            <div><span>{copy.growthEdge}</span><strong>{localizeText(growthEdge, language)}</strong></div>
            <div><span>{copy.biasWatch}</span><strong>{localizeText(biasWatch, language)}</strong></div>
          </div>
          </section>
        </details>

        <details className="leftRailDetails" open={hasCompletedWorkout}>
          <summary>{copy.currentSession}</summary>
          <section className="leftRailSection sessionSignalCard">
          <div className="panelLabel">{copy.currentSession}</div>
          <div className="profileRows">
            <div><span>{copy.lens}</span><strong>{copy[activeLens]}</strong></div>
            <div><span>{copy.progress}</span><strong>{visibleDifficulty}</strong></div>
            <div><span>{copy.intensity}</span><strong>{visiblePressure}</strong></div>
            <div><span>{copy.questionType}</span><strong>{questionType}</strong></div>
          </div>
          </section>
        </details>

        <details className="leftRailDetails" open={hasCompletedWorkout}>
          <summary>{copy.liveSignals}</summary>
          <section className="leftRailSection leftSignalPanel">
          <div className="leftSignalHeader">
            <div className="panelLabel">{copy.liveSignals}</div>
            <div className="leftSignalTabs" role="tablist" aria-label="Live reasoning signals">
              {[
                { id: "patterns", label: text.liveSignalPatterns },
                { id: "metrics", label: text.liveSignalMetrics },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={leftSignalTab === tab.id}
                  className={leftSignalTab === tab.id ? "active" : ""}
                  onClick={() => setLeftSignalTab(tab.id as "patterns" | "metrics")}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {leftSignalTab === "patterns" ? (
            <div className="traitList compactTraitList">
              {visibleFeedback.strengths.map((item) => (
                <span key={item}>{item}</span>
              ))}
              {visibleFeedback.weaknesses.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          ) : null}

          {leftSignalTab === "metrics" ? (
            <div className="compactMetricGrid">
              <div>
                <span title={copy.logicQualityTooltip}>{copy.logicQuality}</span>
                <strong>{visibleFeedback.score}</strong>
              </div>
              <div>
                <span title={copy.evidenceStrengthTooltip}>{copy.evidenceStrength}</span>
                <strong>{feedback.verifier?.behavioral?.evidence || visibleFeedback.score}</strong>
              </div>
              <div>
                <span title={copy.emotionalRigidityTooltip}>{copy.emotionalRigidity}</span>
                <strong>{100 - (feedback.verifier?.behavioral?.emotionalControl || 50)}</strong>
              </div>
              <div>
                <span title={copy.manipulationTacticsTooltip}>{copy.manipulationTactics}</span>
                <strong>{feedback.verifier?.signals?.incentives ? copy.flagged : copy.scanning}</strong>
              </div>
            </div>
          ) : null}
          </section>
        </details>
      </aside>

      <main className="uthynkConversationPanel">
        <div className="conversationHeader">
          <div>
            <div className="panelLabel">{copy.liveConversation}</div>
            {isDailyWorkout ? <div className="dailyWorkoutBadge">{text.dailyThinkingWorkout}</div> : null}
            <h1>{visibleChallenge.prompt}</h1>
          </div>
          <div className="threadMeta">
            <span>{visibleChallenge.category}</span>
            <span>{visibleDifficulty}</span>
            <span>{visiblePressure}</span>
            {ageBand !== "18_plus" ? <span>{ageBandLabel(ageBand)}</span> : null}
            {isDailyWorkout ? <span>{text.dailyWorkout}</span> : null}
            {!profile?.id ? <span>{Math.max(0, 3 - freePassUsed)} {text.freeLeft}</span> : null}
          </div>
        </div>

        <section className="workoutProgressPanel" aria-label="Reasoning workout progress">
          <div className="workoutProgressHeader">
            <div>
              <span>{text.progressTitle}</span>
              <strong>
                {workoutStage === "answer"
                  ? text.stageAnswer
                  : workoutStage === "challenge"
                    ? text.stagePreparing
                    : workoutStage === "followUp"
                      ? text.stageFollowUp
                    : workoutStage === "reflection"
                      ? text.stageReflection
                      : text.stageComplete}
              </strong>
              <small>
                {hasCompletedWorkout ? text.nextStageStart : `${text.nextStage}: ${nextWorkoutStep.label}`}
              </small>
            </div>
            <div className="progressRewardBadge">
              <span>{text.reward}</span>
              <strong>+{expectedReward} XP</strong>
              <small>{latestReward ? text.traitImproved : text.traitGrowthAvailable}</small>
            </div>
          </div>
          <div className="workoutStepRail">
            {workoutSteps.map((step, index) => (
              <div
                className={
                  index < workoutStageIndex
                    ? "workoutStep complete"
                    : index === workoutStageIndex
                      ? "workoutStep active"
                      : "workoutStep"
                }
                key={step.id}
              >
                <span>{index < 3 ? index + 1 : "OK"}</span>
                <strong>{step.label}</strong>
              </div>
            ))}
          </div>
        </section>

        <details className="advancedThinkingDetails">
          <summary>{text.advancedThinkingTools}</summary>

          <section className="thinkingLensPanel">
            <div className="panelLabel">{copy.chooseThinkingLens}</div>
            <div className="thinkingLensOptions" role="radiogroup" aria-label={copy.chooseThinkingLens}>
              {thinkingLenses.map((lens) => (
                <button
                  key={lens.id}
                  type="button"
                  role="radio"
                  aria-checked={thinkingLens === lens.id}
                  className={thinkingLens === lens.id ? "active" : ""}
                  onClick={() => setThinkingLens(lens.id)}
                >
                  {copy[lens.labelKey]}
                </button>
              ))}
            </div>
            <p className="thinkingLensDescription">{activeLensDescription}</p>
          </section>

          <section className="thinkingToolsPanel">
            <div className="thinkingToolsHeader">
              <div className="panelLabel">{toolsCopy.section}</div>
              <div className="thinkingToolTabs" role="tablist" aria-label={toolsCopy.section}>
                {[
                  { id: "followUp", label: toolsCopy.followUp },
                  { id: "lab", label: toolsCopy.lab },
                  { id: "timeline", label: toolsCopy.timeline },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={thinkingToolTab === tab.id}
                    className={thinkingToolTab === tab.id ? "active" : ""}
                    onClick={() =>
                      setThinkingToolTab(tab.id as "followUp" | "lab" | "timeline")
                    }
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {thinkingToolTab === "followUp" ? (
              <article className="thinkingToolPane">
                <span>{copy.recursiveFollowUp}</span>
                <p>{visibleFeedback.followUp}</p>
              </article>
            ) : null}

            {thinkingToolTab === "lab" ? (
              <div className="reasoningSteps compactReasoningSteps">
                <article>
                  <span>{text.stepWord} 1</span>
                  <strong>{toolsCopy.position}</strong>
                  <p>{evaluatedClaim || response || copy.stateClaim}</p>
                </article>
                <article>
                  <span>{text.stepWord} 2</span>
                  <strong>{toolsCopy.support}</strong>
                  <p>{visibleFeedback.strengths.join(", ") || copy.evidenceEmpty}</p>
                </article>
                <article>
                  <span>{text.stepWord} 3</span>
                  <strong>{toolsCopy.followUp}</strong>
                  <p>{visibleFeedback.followUp}</p>
                </article>
                <article>
                  <span>{text.stepWord} 4</span>
                  <strong>{toolsCopy.assumptions}</strong>
                  <p>{visibleFeedback.weaknesses.join(", ") || visibleFeedback.analysis}</p>
                </article>
              </div>
            ) : null}

            {thinkingToolTab === "timeline" ? (
              <div className="timelineRail thinkingTimelineRail">
                {timeline.map((item) => (
                  <article key={item.title}>
                    <strong>{item.title}</strong>
                    <p>{item.text}</p>
                  </article>
                ))}
              </div>
            ) : null}
          </section>
        </details>

        {workoutStage === "followUp" ? (
          <section className="finalReflectionPanel followUpResponsePanel">
            <div className="panelLabel">{text.followUpQuestion}</div>
            <article className="perspectiveNudge">
              <span>{text.perspectiveLabel}</span>
              <p>{visibleFeedback.contrarian}</p>
            </article>
            <h2>{visibleFeedback.followUp}</h2>
            <p>{text.followUpInstruction}</p>
            <textarea
              className="textarea responseBox conversationInput"
              value={followUpResponse}
              onChange={(e) => setFollowUpResponse(e.target.value)}
              placeholder={text.followUpPlaceholder}
            />
          </section>
        ) : workoutStage === "reflection" || workoutStage === "complete" ? (
          <section className="finalReflectionPanel">
            <div className="panelLabel">{text.finalReflection}</div>
            <h2>{text.perspectiveImpactQuestion}</h2>
            <p>{text.perspectiveImpactText}</p>
            <div className="perspectiveChoiceGrid" role="radiogroup" aria-label="Perspective impact">
              {perspectiveOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  role="radio"
                  aria-checked={perspectiveImpact === option}
                  className={perspectiveImpact === option ? "active" : ""}
                  disabled={workoutStage === "complete"}
                  onClick={() => setPerspectiveImpact(option)}
                >
                  {option}
                </button>
              ))}
            </div>
            <label className="responseLabel compactResponseLabel" htmlFor="standout-perspective">
              {text.perspectiveLabel} <span>({text.reflectionOptional})</span>
            </label>
            <textarea
              id="standout-perspective"
              className="textarea responseBox conversationInput"
              value={standoutPerspective}
              disabled={workoutStage === "complete"}
              onChange={(e) => {
                setStandoutPerspective(e.target.value);
                setReflection(e.target.value);
              }}
              placeholder={text.perspectivePlaceholder}
            />
            <section className="confidenceCheckPanel compactConfidencePanel" aria-label="Confidence after conversation">
              <div>
                <span>{text.confidenceNow}</span>
                <strong>{text.confidenceNowQuestion}</strong>
              </div>
              <div className="confidenceScale" role="radiogroup" aria-label="Confidence after conversation">
                {confidenceScale.map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={confidenceAfter === value}
                    className={confidenceAfter === value ? "active" : ""}
                    disabled={workoutStage === "complete"}
                    onClick={() => setConfidenceAfter(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </section>
          </section>
        ) : (
          <>
            <label className="responseLabel" htmlFor="response">
              {copy.continueWithUthynk}
            </label>

            <textarea
              id="response"
              className="textarea responseBox conversationInput"
              value={response}
              disabled={workoutStage === "challenge"}
              onChange={(e) => setResponse(e.target.value)}
              placeholder={workoutStage === "challenge" ? text.preparingFollowUp : copy.placeholder}
            />

            {response.trim() && workoutStage !== "challenge" ? (
              <section className="confidenceCheckPanel" aria-label="Confidence before UThynk response">
                <div>
                  <span>{text.confidenceCheck}</span>
                  <strong>{text.confidenceAnswerQuestion}</strong>
                </div>
                <div className="confidenceScale" role="radiogroup" aria-label="Confidence before UThynk response">
                  {confidenceScale.map((value) => (
                    <button
                      key={value}
                      type="button"
                      role="radio"
                      aria-checked={confidenceBefore === value}
                      className={confidenceBefore === value ? "active" : ""}
                      onClick={() => {
                        setConfidenceBefore(value);
                        setConfidenceAfter(value);
                      }}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        )}

        {error ? <p className="panelNote">{error}</p> : null}
        {!profile?.id && freePassUsed >= 3 ? (
          <div className="freePassGate">
            <strong>{text.createFreeProfile}</strong>
            <span>{text.freeGateText}</span>
            <Link className="btn btnPrimary" href="/login?reason=free-pass">
              {text.createProfile}
            </Link>
          </div>
        ) : null}

        {workoutStage === "followUp" ? (
          <div className="reasoningActions">
            <button
              className="btn btnPrimary"
              type="button"
              disabled={!followUpResponse.trim()}
              onClick={continueToReflection}
            >
              {text.continueReflection}
            </button>
            <button
              className="btn"
              type="button"
              onMouseDown={startVoiceInput}
              onMouseUp={stopVoiceInput}
              onTouchStart={startVoiceInput}
              onTouchEnd={stopVoiceInput}
            >
              {copy.holdToTalk}
            </button>
          </div>
        ) : workoutStage === "reflection" ? (
          <div className="reasoningActions">
            <button
              className="btn btnPrimary"
              type="button"
              disabled={!perspectiveImpact}
              onClick={completeWorkout}
            >
              {text.stepComplete}
            </button>
            <button
              className="btn"
              type="button"
              onMouseDown={startVoiceInput}
              onMouseUp={stopVoiceInput}
              onTouchStart={startVoiceInput}
              onTouchEnd={stopVoiceInput}
            >
              {copy.holdToTalk}
            </button>
          </div>
        ) : workoutStage === "complete" ? (
          <>
            <div className="completionActions">
              <div>
                <span>{text.workoutComplete}</span>
                <strong>{localizeText(feedback.trait, language) || primaryIdentity}</strong>
              </div>
              <button className="btn btnPrimary" type="button" onClick={startNextWorkout}>
                {text.startNextChallenge}
              </button>
            </div>

            <section className="completionFeedbackPanel" aria-label="Completion feedback">
              <div>
                <span>{text.quickFeedback}</span>
                <strong>{text.thinkDifferentlyQuestion}</strong>
              </div>
              <div className="completionFeedbackChoices" role="radiogroup" aria-label="Did this make you think differently?">
                {[
                  { label: text.yes, value: "Yes" },
                  { label: text.somewhat, value: "Somewhat" },
                  { label: text.no, value: "No" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={completionFeedback === option.value}
                    className={completionFeedback === option.value ? "active" : ""}
                    onClick={() => {
                      setCompletionFeedback(option.value);
                      trackEvent(
                        createTelemetryEvent("completed_thinking_difference_feedback", profile?.id, {
                          answer: option.value,
                          category: challenge.category,
                          challengeId: challenge.id,
                          confidenceAfter,
                          confidenceBefore,
                        })
                      );
                    }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            {showSoftLaunchSurvey ? (
              <section className="softLaunchSurveyPanel">
                <div>
                  <span>{text.softLaunchSurvey}</span>
                  <strong>{text.helpShapeBeta}</strong>
                  <p>{text.softLaunchSurveyText}</p>
                </div>
                <div className="surveyActionRow">
                  <Link className="btn btnPrimary" href="/feedback">
                    {text.giveFeedback}
                  </Link>
                  <button
                    className="btn"
                    type="button"
                    onClick={() => {
                      localStorage.setItem("uthynk-soft-launch-survey-dismissed", "true");
                      setShowSoftLaunchSurvey(false);
                      fetch("/api/survey", {
                        body: JSON.stringify({
                          action: "dismissed",
                          createdAt: new Date().toISOString(),
                        }),
                        headers: { "Content-Type": "application/json" },
                        method: "POST",
                      }).catch(() => null);
                    }}
                  >
                    {text.later}
                  </button>
                </div>
              </section>
            ) : null}
          </>
        ) : (
          <div className="reasoningActions">
            <button
              className="btn btnPrimary"
              type="button"
              disabled={loading || workoutStage === "challenge" || !response.trim() || (!profile?.id && freePassUsed >= 3)}
              onClick={analyzeReasoning}
            >
              {loading ? copy.sending : copy.send}
            </button>

            <button
              className="btn"
              type="button"
              onMouseDown={startVoiceInput}
              onMouseUp={stopVoiceInput}
              onTouchStart={startVoiceInput}
              onTouchEnd={stopVoiceInput}
            >
              {copy.holdToTalk}
            </button>
          </div>
        )}

        {latestReward ? (
          <section className="growthReward" aria-live="polite">
            <div>
              <span>+{latestReward.xp} {copy.insightXp}</span>
              <strong>{copy.rewardPattern}: {localizeText(latestReward.pattern, language)}</strong>
            </div>
            <p>{copy.improved}: {copy.evidenceStrength} +{latestReward.evidenceDelta}</p>
          </section>
        ) : null}

        {evaluatedClaim ? (
          <section className="uthynkLayeredResponse" aria-live="polite">
            <div className="plainResponseLayer">
              <span>UThynk</span>
              <p>{plainFeedback}</p>
            </div>

            <div className="thinkingLabelLayer">
              <span>{copy.evidenceStrength} +{evidenceDelta}</span>
              <span>{copy.rewardPattern}: {visibleFeedback.trait || text.independentVerification}</span>
              {visibleFeedback.strengths.slice(0, 2).map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>

            <details className="advancedExplanationLayer">
              <summary>{text.whyUthynkSaidThis}</summary>
              <div>
                <p>{visibleFeedback.analysis}</p>
                <p><strong>{copy.recursiveFollowUp}:</strong> {visibleFeedback.followUp}</p>
              </div>
            </details>
          </section>
        ) : null}

        <div className="conversationThread" aria-live="polite">
          {conversation.map((item, index) => (
            <div
              key={`${item.role}-${index}`}
              className={`messageBubble ${item.role === "user" ? "userBubble" : "uthynkBubble"}`}
            >
              <span>{item.role === "user" ? copy.userLabel : "UThynk"}</span>
              <p>
                {item.content === WELCOME_MESSAGE
                  ? hasPriorThinkingHistory
                    ? text.welcomeReturning
                    : text.welcomeNew
                  : localizeText(item.content, language) || item.content}
              </p>
            </div>
          ))}

          {streamingText ? (
            <div className="messageBubble uthynkBubble liveBubble">
              <span>{copy.liveReasoning}</span>
              <p>{streamingText}</p>
            </div>
          ) : null}
        </div>

      </main>

      <aside className="uthynkSidePanel uthynkRightPanel">
        {!hasCompletedWorkout ? (
          <section className="todaysInsightCard">
            <div className="panelLabel">{text.todaysInsight}</div>
            <strong>{todaysInsight.title}</strong>
            <p>{todaysInsight.text}</p>
            <small>{text.moreInsightsUnlock}</small>
          </section>
        ) : null}

        {hasCompletedWorkout ? (
          <div className="rightRailTabs" role="tablist" aria-label="UThynk side panel">
            {[
              { id: "categories", label: copy.categoryTab },
              { id: "insights", label: copy.insightsTab },
              { id: "analysis", label: copy.analysisTab },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                className={rightTab === tab.id ? "active" : ""}
                aria-selected={rightTab === tab.id}
                onClick={() => setRightTab(tab.id as "categories" | "insights" | "analysis")}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : null}

        {hasCompletedWorkout && rightTab === "categories" ? (
          <section>
            <div className="panelLabel">{copy.categories}</div>
            <p className="categoryHelper">{text.categoryHelper}</p>
            <div className="categoryPills">
              {visibleCategoryLinks.map((item) => (
                <button
                  className={challenge.category === item.category ? "active" : ""}
                  key={item.category}
                  aria-pressed={challenge.category === item.category}
                  onClick={() => selectCategory(item.category)}
                  type="button"
                >
                  <span>{item.label}</span>
                  <small>{challenge.category === item.category ? text.active : text.switch}</small>
                </button>
              ))}
            </div>
            <Link className="categoryLessonsLink" href={`/lessons/${slugifyCategory(challenge.category)}`}>
              {text.openCategoryQuestions.replace("{category}", visibleChallenge.category)}
            </Link>
            <Link className="categoryLessonsLink secondary" href="/lessons">
              {text.viewAllLessonCategories}
            </Link>
          </section>
        ) : null}

        {hasCompletedWorkout && rightTab === "insights" ? (
          <section>
            <div className="panelLabel">{copy.didYouKnow}</div>
            <div className="cognitionFeed">
              {cognitionFeedByLanguage[language].map((item) => (
                <article key={item.title}>
                  <strong>{item.title}</strong>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {hasCompletedWorkout && rightTab === "analysis" ? (
          <section>
            <div className="panelLabel">{copy.claimEvaluation}</div>
            <div className="logicGrid sideAnalysisGrid">
              <div><span>{copy.claim}</span><p>{evaluatedClaim || response || copy.stateClaim}</p></div>
              <div><span>{copy.recursiveFollowUp}</span><p>{visibleFeedback.followUp}</p></div>
              <div><span>{text.followUpAnswer}</span><p>{followUpResponse || text.notAnsweredYet}</p></div>
            </div>
          </section>
        ) : null}

      </aside>
    </section>
  );
}

export default function ReasoningPage() {
  const [language, setLanguage] = useState<Language>("en");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const copy = uiCopy[language];
  const helpCopy = onboardingCopy[language];

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storedLanguage = localStorage.getItem("uthynk-language");

    if (storedLanguage === "en" || storedLanguage === "es" || storedLanguage === "fr") {
      setLanguage(storedLanguage);
    }

    if (localStorage.getItem("uthynk-onboarding-dismissed") !== "true") {
      setShowOnboarding(true);
    }
  }, []);

  function changeLanguage(nextLanguage: Language) {
    setLanguage(nextLanguage);

    if (typeof window !== "undefined") {
      localStorage.setItem("uthynk-language", nextLanguage);
    }
  }

  function closeOnboarding() {
    setShowOnboarding(false);

    if (typeof window !== "undefined") {
      localStorage.setItem("uthynk-onboarding-dismissed", "true");
    }
  }

  return (
    <main className="appShell reasoningShell">
      <header className="appTop card">
        <Link href="/" className="appBrandText">
          <img src="/brand/uthynk-wing-mark.svg" alt="" className="appBrandLogo" />
          <span className="brandCopy">
            <strong>UThynk</strong>
            <small>Better thinking. <em>Better decisions.</em></small>
          </span>
        </Link>

        <div className="topControls">
          <nav className="appNav" aria-label="Reasoning navigation">
            <Link href="/">{copy.home}</Link>
            <Link href="/daily">{pageText[language].daily}</Link>
            <Link href="/lessons">{pageText[language].lessons}</Link>
            <Link href="/profile">{pageText[language].profileNav}</Link>
            <Link href="/feedback">{pageText[language].feedbackNav}</Link>
            <Link href="/login?mode=login&force=1">{pageText[language].signIn}</Link>
          </nav>

          <button
            className="helpButton"
            type="button"
            onClick={() => setShowOnboarding(true)}
          >
            {helpCopy.reopen}
          </button>

          <label className="languageSelectLabel topLanguageSelect">
            <span>{copy.adaptiveLanguage}</span>
            <select
              aria-label={copy.adaptiveLanguage}
              className="languageSelect"
              value={language}
              onChange={(event) => changeLanguage(event.target.value as Language)}
            >
              {languageOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <Suspense
        fallback={
          <section className="card reasoningMain" style={{ marginTop: 18 }}>
            <div className="panelLabel">{copy.loadingSession}</div>
            <p className="panelNote">{copy.restoredHistory}</p>
          </section>
        }
      >
        <ReasoningExperience language={language} />
      </Suspense>

      {showOnboarding ? (
        <div className="onboardingOverlay" role="presentation">
          <section
            className="onboardingModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="uthynk-onboarding-title"
          >
            <div className="onboardingHero">
              <div>
                <span className="panelLabel">UThynk</span>
                <h2 id="uthynk-onboarding-title">{helpCopy.title}</h2>
                <p>{helpCopy.intro}</p>
              </div>
              <button
                className="modalCloseButton"
                type="button"
                aria-label="Close"
                onClick={closeOnboarding}
              >
                ×
              </button>
            </div>

            <div className="onboardingSteps">
              {helpCopy.steps.map((step, index) => (
                <article key={step.title}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{step.title}</strong>
                  <p>{step.text}</p>
                </article>
              ))}
            </div>

            <div className="onboardingFooter">
              <button className="btn btnPrimary" type="button" onClick={closeOnboarding}>
                {helpCopy.close}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
