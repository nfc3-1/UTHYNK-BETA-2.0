import {describe,expect,it} from 'vitest';
import {groundReadingFollowUp} from '../lib/readingGrounding';
import {getCurrentReadingModules} from '../lib/thinkingPaths';
describe('reading-specific second question',()=>{
 it.each(['en','es','fr'] as const)('ties a generic provider question to the actual passage in %s without a third learner question',language=>{
  for(const reading of getCurrentReadingModules()){
  const result=groundReadingFollowUp({secondaryQuestion:'What could change your view?',followUp:'What could change your view?'},reading,language,'follow_up');
  expect(result.secondaryQuestion).toBe(result.followUp);
  const quote=result.secondaryQuestion.match(/[“«](.*)[”»]/)![1];
  expect(reading.text[language]).toContain(quote);
  expect((result.secondaryQuestion.match(/\?/g)||[])).toHaveLength(1);
  }
 });
 it('leaves final synthesis and ordinary challenges untouched',()=>{
  const feedback={secondaryQuestion:'',followUp:'',finalSynthesis:'A final synthesis.'};
  expect(groundReadingFollowUp(feedback,getCurrentReadingModules()[0],'en','synthesis')).toBe(feedback);
  expect(groundReadingFollowUp(feedback,undefined,'en','follow_up')).toBe(feedback);
 });
});
