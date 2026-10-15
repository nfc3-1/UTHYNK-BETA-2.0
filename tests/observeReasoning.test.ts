import { afterEach, describe, expect, it, vi } from 'vitest';
import { observeReasoning } from '../lib/observeReasoning';
import { criterionIds } from '../lib/pointRubric';
afterEach(() => vi.unstubAllGlobals());
function raw(note = 'The proposed comparison gives a basis for the decision.') {
  return {observations:Object.fromEntries(criterionIds.map(id => [id,{status:'strong',note,evidenceIds:['A1S1']}])),nextFocus:''};
}
describe('independent reasoning review', () => {
  it.each(['en','es','fr'] as const)('keeps coaching and historical judgments out of the %s review task', async language => {
    let sent:any;
    vi.stubGlobal('fetch',async (_url:any, options:any) => {sent=JSON.parse(options.body);return Response.json({choices:[{message:{content:JSON.stringify(raw())}}]});});
    const result = await observeReasoning({answers:['Compare similar classes.','Retain an urgent-contact exception.'],question:'Extend the rule?',secondaryQuestion:'How would you compare classes?',language,apiKey:'test'});
    expect(result.status).toBe('provisional');
    expect(result.observations[0].evidence).toEqual(['Compare similar classes.']);
    expect(sent.temperature).toBe(0);expect(sent.seed).toBe(1701);
    expect(sent.response_format.json_schema.strict).toBe(true);
    expect(sent.response_format.json_schema.schema.required).toEqual(['observations','nextFocus']);
    const schema = sent.response_format.json_schema.schema.properties.observations;
    expect(schema.required).toEqual([...criterionIds]);
    expect(schema.properties.claim.anyOf[0].properties.note.minLength).toBe(1);
    expect(schema.properties.claim.anyOf[0].properties.note.maxLength).toBe(1600);
    expect(schema.properties.claim.anyOf[0].properties.evidenceIds.items.enum).toEqual(['A1S1','A2S1']);
    const task = JSON.parse(sent.messages[1].content);
    expect(task).toEqual({outputLanguage:language,originalQuestion:'Extend the rule?',secondaryQuestion:'How would you compare classes?',learnerAnswerSentences:[{id:'A1S1',text:'Compare similar classes.'},{id:'A2S1',text:'Retain an urgent-contact exception.'}]});
    expect(sent.messages[0].content).toContain('Do not invent a new perspective');
    expect(sent.messages[0].content).toContain('proposed comparison/test');
  });
  it.each(['outage','malformed','invalid-evidence'] as const)('returns unavailable rather than a grade or failed conversation on %s', async failure => {
    vi.stubGlobal('fetch',async () => {
      if(failure==='outage')throw new Error('offline');
      const value = raw();value.observations.claim.evidenceIds=['COACH1'];
      return Response.json({choices:[{message:{content:failure==='malformed'?'broken':JSON.stringify(value)}}]});
    });
    const result = await observeReasoning({answers:['Test first.'],question:'Try the rule?',language:'en',apiKey:'test'});
    expect(result.status).toBe('unavailable');expect(result.observations[0].evidence).toEqual([]);expect(result).not.toHaveProperty('percentage');
  });
});
