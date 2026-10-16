import {act,create} from 'react-test-renderer';
import {afterEach,describe,expect,it,vi} from 'vitest';
import ThinkingPathsClient from '../components/ThinkingPathsClient';
import {publicPathSummaries} from '../lib/thinkingPaths';
import {pathCopy} from '../lib/pathCopy';
const state=vi.hoisted(()=>({language:'en' as 'en'|'es'|'fr'}));
vi.mock('next/link',()=>({default:'a'}));
vi.mock('../components/PathShell',()=>({default:({children}:any)=><main>{children}</main>,usePathLanguage:()=>({language:state.language,changeLanguage:vi.fn()})}));
vi.mock('../components/ThinkingWalkthrough',()=>({default:()=>null}));
afterEach(()=>vi.unstubAllGlobals());
describe('school-trial reading path discovery',()=>{
 it.each(['en','es','fr'] as const)('shows three real paths per category with translated goals and ten readings in %s',language=>{
  state.language=language;
  for(const path of publicPathSummaries()){
   const ui=create(<ThinkingPathsClient paths={[path]} selectedPath={path.slug}/>);
   expect(ui.root.findAllByType('article')).toHaveLength(3);
   expect(ui.root.findAllByType('ul')).toHaveLength(3);
   expect(ui.root.findAllByType('li')).toHaveLength(30);
   const text=JSON.stringify(ui.toJSON());
   for(const reading of path.readingPaths){
    expect(text).toContain(reading.title[language]);
    expect(text).toContain(reading.practiceGoal![language]);
    expect(ui.root.findAllByType('a').some(a=>a.props.href===`/thinking-paths/${path.slug}/${reading.slug}`)).toBe(true);
   }
   act(()=>ui.unmount());
  }
 });
 it('counts three ten-part paths on each category card',()=>{
  state.language='en';const ui=create(<ThinkingPathsClient paths={publicPathSummaries()}/>);
  expect(ui.root.findAllByType('article')).toHaveLength(7);
  expect(JSON.stringify(ui.toJSON())).toContain(`3 ${pathCopy.en.reading.toLowerCase()} · 10 ${pathCopy.en.each}`);
  act(()=>ui.unmount());
 });
});
