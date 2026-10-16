import { describe, expect, it } from 'vitest';
import { buildSpanishReview, reviewCsv } from '../scripts/exportSpanishReview.mjs';
describe('Spanish reviewer handoff', () => {
  it('covers every current question and passage with stable IDs, hashes, and separate review cells', () => {
    const {files,report}=buildSpanishReview();
    expect(files['thinking-challenges']).toHaveLength(450);
    expect(files['reading-questions']).toHaveLength(210);
    expect(files['reading-passages']).toHaveLength(210);
    expect(new Set(files['reading-passages'].map((row: any)=>row.id)).size).toBe(210);
    for (const rows of Object.values(files) as any[][]) for (const row of rows) {
      expect(row.english).toBeTruthy(); expect(row.spanish).toBeTruthy();
      expect(row.english_sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(row.spanish_sha256).toMatch(/^[a-f0-9]{64}$/);
      expect(row.decision).toBe(''); expect(row.suggested_spanish).toBe('');
    }
    expect(report.structuralIssues).toEqual([]);
    expect(report.coverage.es).toEqual({missingFields:0,pendingChallenges:450,pendingReadings:210});
    expect(report.coverage.fr).toEqual({missingFields:0,pendingChallenges:450,pendingReadings:210});
    expect(report.archivedReadingsNotIncluded).toBe(117);
  });
  it('exports quoted UTF-8 CSV with safe spreadsheet text', () => {
    const csv=reviewCsv([{id:'a',english:'=1+1',spanish:'Sí, "correcto"\nOtra línea'}]);
    expect(csv).toContain('"\'=1+1"');
    expect(csv).toContain('"Sí, ""correcto""\nOtra línea"');
    expect(csv.startsWith('\uFEFF')).toBe(true);
  });
});
