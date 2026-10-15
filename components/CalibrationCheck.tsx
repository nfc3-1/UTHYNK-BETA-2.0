"use client";
import { useState } from "react";
import type { CalibrationResult } from "@/lib/reasoningCalibration";
export default function CalibrationCheck() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [result, setResult] = useState<{
    id?: string;
    report: {
      passed: boolean;
      checkedAt: string;
      limitation: string;
      results: CalibrationResult[];
    };
  } | null>(null);
  async function run() {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const r = await fetch("/api/admin/calibration", { method: "POST" });
      const value = await r.json();
      if (value.report) setResult(value);
      if (!r.ok) throw new Error(value.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Calibration failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="card teacherPanel" style={{ marginTop: 18 }}>
      <h2>Language scoring calibration</h2>
      <p>
        Run six fresh model evaluations on authored, matched English, Spanish,
        and French answers. This uses the configured scoring model and does not
        add learner results, XP, or leaderboard entries.
      </p>
      <button className="btn" disabled={busy} onClick={() => void run()}>
        {busy ? "Checking all three languages…" : "Run Language Calibration"}
      </button>
      {error && <p role="alert">{error}</p>}
      {result && (
        <>
          <h3>
            {result.report.passed
              ? "Matched fixture passed"
              : "Calibration needs attention"}
          </h3>
          <p>
            {result.report.checkedAt}
            {result.id ? ` · Saved report: ${result.id}` : ""}
          </p>
          <table>
            <thead>
              <tr>
                <th>Language / phase</th>
                <th>Claim / 5</th>
                <th>Evidence / 5</th>
                <th>Alternatives / 5</th>
                <th>Conclusion / 5</th>
                <th>Total / 20</th>
              </tr>
            </thead>
            <tbody>
              {result.report.results.map((r) => (
                <tr key={`${r.language}:${r.phase}`}>
                  <th>
                    {r.language} / {r.phase}
                  </th>
                  {r.assessment ? (
                    <>
                      {r.assessment.criteria.map((c) => (
                        <td key={c.id}>{c.points}</td>
                      ))}
                      <td>{r.assessment.earned}</td>
                    </>
                  ) : (
                    <td colSpan={5}>{r.error}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <p>{result.report.limitation}</p>
        </>
      )}
    </section>
  );
}
