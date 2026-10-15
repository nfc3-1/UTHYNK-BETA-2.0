import { createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import {
  learnerEvidence,
  pointAssessmentSchema,
  pointRubricPrompt,
  POINT_RUBRIC_VERSION,
  validatePointAssessment,
  type PointAssessment,
} from "@/lib/pointRubric";
import { reasoningProviderError } from "@/lib/reasoningProviderError";
// No language, coaching mode, session ID, or prior grade participates in scoring.
// The same answers retain the same assessment while the display language changes.
export async function assessReasoning(input: {
  question: string;
  answers: string[];
  userId?: string;
  apiKey: string;
  freshCalibration?: boolean;
}) {
  const model = process.env.OPENAI_ASSESSMENT_MODEL || "gpt-4o-mini";
  const fingerprint = createHash("sha256")
    .update(
      JSON.stringify([
        POINT_RUBRIC_VERSION,
        "sentence-ids-v1",
        model,
        input.userId || "guest",
        input.question,
        ...input.answers,
      ]),
    )
    .digest("hex");
  if (supabaseAdmin && input.userId && !input.freshCalibration) {
    const cached = await supabaseAdmin
      .from("reasoning_assessments")
      .select("assessment")
      .eq("fingerprint", fingerprint)
      .maybeSingle();
    if (cached.error)
      throw new Error(
        "Assessment storage is unavailable. Your answer is saved; retry.",
      );
    if (cached.data) return cached.data.assessment as PointAssessment;
  }
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    signal: AbortSignal.timeout(25000),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      seed: 1701,
      response_format: pointAssessmentSchema(
        learnerEvidence(input.answers).map((s) => s.id),
      ),
      messages: [
        { role: "system", content: pointRubricPrompt },
        {
          role: "user",
          content: JSON.stringify({
            question: input.question,
            learnerAnswerSentences: learnerEvidence(input.answers),
          }),
        },
      ],
    }),
  });
  if (!response.ok) throw await reasoningProviderError(response);
  const body = await response.json();
  const assessment = validatePointAssessment(
    JSON.parse(body.choices?.[0]?.message?.content || "{}"),
    input.answers,
    model,
    fingerprint,
  );
  if (supabaseAdmin && input.userId && !input.freshCalibration) {
    const saved = await supabaseAdmin.from("reasoning_assessments").upsert(
      {
        fingerprint,
        profile_id: input.userId,
        rubric_version: POINT_RUBRIC_VERSION,
        model,
        assessment,
      },
      { onConflict: "fingerprint", ignoreDuplicates: true },
    );
    if (saved.error)
      throw new Error(
        "The point breakdown could not be saved. Your answer is saved; retry.",
      );
    const canonical = await supabaseAdmin
      .from("reasoning_assessments")
      .select("assessment")
      .eq("fingerprint", fingerprint)
      .single();
    if (canonical.error)
      throw new Error("The saved point breakdown is unavailable. Retry.");
    return canonical.data.assessment as PointAssessment;
  }
  return assessment;
}
