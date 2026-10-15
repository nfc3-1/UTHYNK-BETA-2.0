import { learnerEvidence } from './pointRubric';
import { qualitativeAssessment, qualitativePrompt, observationSchema, type QualitativeAssessment } from './qualitativeAssessment';

const observationInstructions = `You are an independent response observer, not the conversation coach. Assess the actual learner answers and only what the supplied questions reasonably elicit. Do not invent a new perspective and then mark the learner down for missing it. The same semantic reasoning in English, Spanish and French warrants the same status. Evaluate meaning first, then write notes in outputLanguage.
Criteria:
claim: Strong when a relevant position or proposed approach is explained with a reason or clear purpose. Developing when the position is relevant but its basis is unclear.
evidence: Strong when a concrete example, passage detail, observation or proposed comparison/test is connected to the claim. A proposed test is valid evidence reasoning, not proof of a result; do not demand existing results when the task is to plan a decision. Developing when relevant support is named but its connection is unclear.
alternatives: Strong when the answer recognizes and explains a meaningful competing explanation, downside, exception or tradeoff. An urgent-contact exception to a phone restriction is a relevant tradeoff. Do not require an exhaustive list of perspectives or a particular alternative. Developing when an alternative is mentioned but its significance is unclear.
conclusion: Strong when a recommendation follows from reasons, including an explicit condition or limit when uncertainty matters. A conditional plan to extend a test rather than expand a rule can be a justified conclusion. Developing when a relevant conclusion is stated but disconnected from its reasons.
Use not_demonstrated only for a relevant move absent across ALL supplied answers. Use not_elicited when the question did not call for this move. Neither describes a person's ability. A short response can be strong; strong does not mean complete, perfect or mastered. Never infer longitudinal improvement. Do not require a change of mind. For developing, name the actual attempted move and a relevant supported limitation; do not manufacture a deficiency to fill a category. Check every alleged omission against every learner sentence. Do not repeat the same gap across criteria. Do not grade against a coaching suggestion, an unstated hypothetical task, answer length or writing style. For a reading task, concrete support must relate to the supplied passage.
Each observation must have a nonempty specific note, including not_elicited (explain why the question did not elicit it). Cite actual learner sentence IDs. Resolve no quotations yourself. Return observations and nextFocus as defined by the schema. nextFocus is one concise actionable instruction about a supported remaining gap, or an empty string if none is supported. It is never another question.`;

export async function observeReasoning({ answers, question, secondaryQuestion, language, apiKey }: {
  answers: string[]; question: string; secondaryQuestion?: string; language: 'en'|'es'|'fr'; apiKey: string;
}): Promise<QualitativeAssessment> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(25000),
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini', temperature: 0, seed: 1701,
        response_format: { type:'json_schema', json_schema:{ name:'response_observations', strict:true, schema:observationSchema(answers) } },
        messages: [
          { role:'system', content:`${observationInstructions} ${qualitativePrompt}` },
          { role:'user', content:JSON.stringify({ outputLanguage:language, originalQuestion:question, secondaryQuestion, learnerAnswerSentences:learnerEvidence(answers) }) },
        ],
      }),
    });
    if (!response.ok) return qualitativeAssessment(null, answers, language);
    const data = await response.json();
    const parsed = JSON.parse(data?.choices?.[0]?.message?.content || 'null');
    return qualitativeAssessment(parsed, answers, language);
  } catch {
    // Observation outages never lose an answer or block an otherwise valid conversation.
    return qualitativeAssessment(null, answers, language);
  }
}
