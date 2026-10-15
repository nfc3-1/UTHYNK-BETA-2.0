import {
  rubricCopy,
  translatedAnchors,
  type PointAssessment,
} from "@/lib/pointRubric";
export default function AssessmentBreakdown({
  assessment,
  language,
}: {
  assessment: PointAssessment | null | undefined;
  language: "en" | "es" | "fr";
}) {
  if (
    assessment?.rubricVersion !== "reasoning-20-v1" ||
    !Array.isArray(assessment.criteria)
  )
    return null;
  const copy = rubricCopy[language];
  return (
    <details className="advancedExplanationLayer">
      <summary>
        {copy.title}: {assessment.earned} / {assessment.possible}
      </summary>
      <p>
        {copy.total}: 4 × 5 = 20. {assessment.percentage}%
      </p>
      <table>
        <thead>
          <tr>
            <th>{copy.title}</th>
            <th> / 5</th>
            <th>{copy.support}</th>
          </tr>
        </thead>
        <tbody>
          {assessment.criteria.map((c) => (
            <tr key={c.id}>
              <th>{copy.labels[c.id]}</th>
              <td>
                {c.points} / 5
                <p>{translatedAnchors[language][c.id][c.points]}</p>
              </td>
              <td>
                {c.evidence.map((quote, i) => (
                  <p key={i}>“{quote}”</p>
                ))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>{assessment.rubricVersion}</p>
    </details>
  );
}
