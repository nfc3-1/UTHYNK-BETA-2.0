import { describe, expect, it } from 'vitest';
import { create } from 'react-test-renderer';
import { qualitativeAssessment, observationCopy } from '../lib/qualitativeAssessment';
import { criterionIds, validatePointAssessment } from '../lib/pointRubric';
import ReasoningObservations from '../components/ReasoningObservations';
function fixture(note = 'A relevant reason supports your position.') {
  return { observations: Object.fromEntries(criterionIds.map(id => [id, {status:'strong',note,evidenceIds:['A1S1']}])), nextFocus: 'State what finding would change the conclusion.' };
}
describe('evidence-based response observations', () => {
  it.each([
    ['en','Test similar classes.','You proposed comparing similar classes.'],
    ['es','Compararía clases similares.','Propusiste comparar clases similares.'],
    ['fr','Je comparerais des classes semblables.','Tu as proposé de comparer des classes semblables.'],
  ] as const)('resolves original answer evidence and preserves equivalent labels in %s', (language, answer, note) => {
    const assessment = qualitativeAssessment(fixture(note),[answer],language);
    expect(assessment.status).toBe('provisional');
    expect(assessment.observations.map(o => o.status)).toEqual(['strong','strong','strong','strong']);
    expect(assessment.observations.every(o => o.note === note && o.evidence[0] === answer)).toBe(true);
    expect(assessment).not.toHaveProperty('percentage'); expect(assessment).not.toHaveProperty('earned');
    const ui = create(<ReasoningObservations language={language} assessment={assessment} />);
    expect(JSON.stringify(ui.toJSON())).toContain(observationCopy[language].strong);
    expect(ui.root.findAllByType('textarea')).toHaveLength(0);
  });
  it('distinguishes the two learner answers and never resolves coach text', () => {
    const raw = fixture(); raw.observations.claim.evidenceIds = ['A1S1','A2S1'];
    const assessment = qualitativeAssessment(raw,['Try one class.','Control class size.'],'en');
    expect(assessment.observations[0].evidence).toEqual(['Try one class.','Control class size.']);
    raw.observations.claim.evidenceIds = ['COACH1'];
    expect(qualitativeAssessment(raw,['Try one class.'],'en').observations[0]).toEqual({id:'claim',status:'unavailable',note:'',evidence:[]});
  });
  it.each([{evidenceIds:[]},{evidenceIds:['invented-id']}])('does not invent a weakness when positive evidence is missing %j', ({evidenceIds}) => {
    const raw = fixture(); raw.observations.claim.evidenceIds = evidenceIds;
    const result = qualitativeAssessment(raw,['Test first.'],'en');
    expect(result.status).toBe('unavailable'); expect(result.observations[0].status).toBe('unavailable'); expect(result.nextFocus).toBe('');
  });
  it('keeps a criterion not elicited distinct from a relevant move not demonstrated', () => {
    const raw = fixture();
    raw.observations.alternatives = {status:'not_elicited',note:'This task asked for a concrete example.',evidenceIds:[]};
    raw.observations.conclusion = {status:'not_demonstrated',note:'The answer does not yet connect its example to the conclusion.',evidenceIds:['A1S1']};
    const result = qualitativeAssessment(raw,['One class.'],'en');
    expect(result.status).toBe('provisional'); expect(result.observations[2].status).toBe('not_elicited'); expect(result.observations[3].status).toBe('not_demonstrated');
  });
  it('drops an additional question from next focus', () => {
    const raw = fixture(); raw.nextFocus = 'What would you test?';
    expect(qualitativeAssessment(raw,['Test first.'],'en').nextFocus).toBe('');
  });
  it('switches interface labels without changing a saved observation or its quotations', () => {
    const saved = qualitativeAssessment(fixture(),['Test first.'],'en');
    const before = JSON.stringify(saved);
    const ui = create(<ReasoningObservations language="en" assessment={saved} />);
    ui.update(<ReasoningObservations language="fr" assessment={saved} />);
    expect(JSON.stringify(ui.toJSON())).toContain(observationCopy.fr.strong);
    expect(JSON.stringify(ui.toJSON())).toContain('A relevant reason supports your position.');
    expect(JSON.stringify(ui.toJSON())).toContain(observationCopy.fr.savedLanguage);
    expect(JSON.stringify(saved)).toBe(before);
  });
  it('preserves historical points without displaying them or relabeling them as strengths', () => {
    const old = validatePointAssessment({criteria:Object.fromEntries(criterionIds.map(id => [id,{points:4,evidenceIds:['A1S1']}]))},['Old answer.'],'test','old');
    const before = JSON.stringify(old);
    const ui = create(<ReasoningObservations language="en" assessment={old} />);
    expect(JSON.stringify(ui.toJSON())).toContain(observationCopy.en.legacy);
    expect(JSON.stringify(ui.toJSON())).not.toContain('16');
    expect(JSON.stringify(old)).toBe(before);
  });
});
