import { localizeText, type Language } from '@/lib/reasoningI18n';
const labels: Record<string, [string, string]> = {
  'Average Reasoning': ['Promedio de razonamiento', 'Moyenne de raisonnement'], 'Growth Trend': ['Tendencia de crecimiento', 'Tendance de progression'],
  'Active': ['Activo', 'Actif'], 'Starting': ['Comenzando', 'Début'], 'Traits': ['Rasgos', 'Traits'],
  'high-intensity': ['alta intensidad', 'haute intensité'], 'supportive': ['de apoyo', 'bienveillant'],
  'day streak': ['días seguidos', 'jours consécutifs'], 'score': ['puntuación', 'score'], 'Overview': ['Resumen', 'Vue d’ensemble'],
  'Current identity': ['Identidad actual', 'Identité actuelle'], 'Completed': ['Completados', 'Terminés'],
  'gentle': ['suave', 'doux'], 'balanced': ['equilibrado', 'équilibré'], 'strong': ['intenso', 'intense'],
  'Thinking Snapshot': ['Resumen de pensamiento', 'Bilan de réflexion'],
  'Thinking Identity': ['Identidad de pensamiento', 'Identité de réflexion'],
  'UThynk Thinking Snapshot': ['Resumen de pensamiento UThynk', 'Bilan de réflexion UThynk'],
  'Logic': ['Lógica', 'Logique'], 'Strategy': ['Estrategia', 'Stratégie'], 'Evidence': ['Evidencia', 'Preuves'],
  'Current trait': ['Rasgo actual', 'Trait actuel'], 'Rank': ['Rango', 'Rang'],
  'Share': ['Compartir', 'Partager'], 'Copy': ['Copiar', 'Copier'], 'Download': ['Descargar', 'Télécharger'],
  'Snapshot copied': ['Resumen copiado', 'Bilan copié'], 'Snapshot ready to share': ['Resumen listo para compartir', 'Bilan prêt à partager'],
  'Snapshot downloaded': ['Resumen descargado', 'Bilan téléchargé'], 'Snapshot shared': ['Resumen compartido', 'Bilan partagé'],
  'Share canceled': ['Se canceló compartir', 'Partage annulé'],
  'Recommended Next': ['Siguiente recomendación', 'Prochaine recommandation'], 'Session History': ['Historial de sesiones', 'Historique des sessions'],
  'Challenge Intensity': ['Intensidad del desafío', 'Intensité du défi'], 'Gentle Reflection': ['Reflexión suave', 'Réflexion douce'],
  'Balanced Challenge': ['Desafío equilibrado', 'Défi équilibré'], 'Strong Challenge': ['Desafío intenso', 'Défi intense'],
  'No completed sessions yet': ['Aún no hay sesiones completadas', 'Aucune session terminée'],
  'Complete a reasoning challenge to start building history.': ['Completa un desafío de razonamiento para empezar tu historial.', 'Termine un défi de raisonnement pour commencer ton historique.'],
  'Trait evolving': ['Rasgo en evolución', 'Trait en évolution'], 'Reasoning Session': ['Sesión de razonamiento', 'Session de raisonnement'],
  'Evidence Builder': ['Constructor de evidencia', 'Construction de preuves'], 'Question Assumptions': ['Cuestiona los supuestos', 'Questionne les hypothèses'],
  'Strategic Pattern Spotter': ['Observador de patrones estratégicos', 'Repérage de tendances stratégiques'], 'Growth in Progress': ['Crecimiento en curso', 'Progression en cours'],
};
export function profileText(text: string, language: Language) {
  return language === 'en' ? text : labels[text]?.[language === 'es' ? 0 : 1] || localizeText(text, language);
}
