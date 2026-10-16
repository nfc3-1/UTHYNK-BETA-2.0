import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const read = name => JSON.parse(readFileSync(new URL(`../data/${name}`, import.meta.url), 'utf8'));
const hash = value => createHash('sha256').update(value).digest('hex');
export function buildSpanishReview() {
  const questions = read('i18n/lessonQuestions.json');
  const parts = read('connectedReadingModules.json');
  const paths = read('connectedReadingPaths.json');
  const passages = read('readingPassages.json').passages;
  const files = { 'thinking-challenges': [], 'reading-questions': [], 'reading-passages': [], 'reading-context': [], 'path-text': [] };
  const issues = [];
  const coverage = { es: { missingFields: 0, pendingChallenges: 0, pendingReadings: 0 }, fr: { missingFields: 0, pendingChallenges: 0, pendingReadings: 0 } };
  function add(group, id, field, text, sourceFile, sourceUrl = '', status = 'needs_review') {
    for (const language of ['es','fr']) {
      if (!text[language]?.trim()) { coverage[language].missingFields++; issues.push({id, field, language, issue:'missing'}); }
    }
    files[group].push({ id, field, english: text.en, spanish: text.es, suggested_spanish: '', decision: '', notes: '', status, source_file: sourceFile, source_url: sourceUrl, english_sha256: hash(text.en), spanish_sha256: hash(text.es || '') });
  }
  function walk(group, id, value, sourceFile, sourceUrl = '', prefix = '') {
    if (!value || typeof value !== 'object') return;
    if (typeof value.en === 'string') { add(group,id,prefix,value,sourceFile,sourceUrl); return; }
    for (const [key, child] of Object.entries(value)) walk(group,id,child,sourceFile,sourceUrl,prefix ? `${prefix}.${key}` : key);
  }
  for (const question of questions) {
    add('thinking-challenges',question.id,'question',{en:question.source,es:question.translations.es.text,fr:question.translations.fr.text},'data/i18n/lessonQuestions.json','',question.translations.es.status);
    for (const language of ['es','fr']) if (question.translations[language].status !== 'approved') coverage[language].pendingChallenges++;
  }
  for (const part of parts) {
    const passage=passages[part.id];
    const url=part.sourceUrl;
    add('reading-questions',part.id,'question',part.question,'data/connectedReadingModules.json',url);
    add('reading-passages',part.id,'text',passage.text,'data/readingPassages.json',url);
    const {question, ...context}=part;
    walk('reading-context',part.id,context,'data/connectedReadingModules.json',url);
    const {text, ...passageContext}=passage;
    walk('reading-context',part.id,passageContext,'data/readingPassages.json',url);
    for (const language of ['es','fr']) {
      if (part.editorialStatus !== 'approved') coverage[language].pendingReadings++;
      const anchor=part.evidenceAnchor?.[language];
      if (anchor && (!passage.text[language].includes(anchor) || !question[language].includes(anchor))) issues.push({id:part.id,language,issue:'quote does not match both passage and question'});
    }
  }
  for (const path of paths) {
    const {readingPaths, ...context}=path;
    walk('path-text',path.slug,context,'data/connectedReadingPaths.json');
    for (const reading of readingPaths) walk('path-text',`${path.slug}/${reading.slug}`,reading,'data/connectedReadingPaths.json');
  }
  return {files,report:{scope:'450 current challenges and 210 current readings, plus current path/context text',coverage,structuralIssues:issues,archivedReadingsNotIncluded:Object.keys(passages).length-parts.length,humanReview:'No approval inferred from structural checks. Spanish reviewer available; French reviewer not available. Archive and UI copy are separate review queues.'}};
}

// Quote every cell and neutralize spreadsheet formulas in reviewable source text.
const cell = value => `"${String(value ?? '').replace(/^[=+@\-]/, "'$&").replaceAll('"','""')}"`;
export function reviewCsv(rows) {
  const columns=['id','field','english','spanish','suggested_spanish','decision','notes','status','source_file','source_url','english_sha256','spanish_sha256'];
  return '\uFEFF'+[columns.map(cell).join(','),...rows.map(row=>columns.map(key=>cell(row[key])).join(','))].join('\r\n')+'\r\n';
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const destination=process.argv[2];
  if (!destination) throw new Error('Provide an output directory: npm run review:spanish -- /absolute/output/path');
  mkdirSync(destination,{recursive:true});
  const {files,report}=buildSpanishReview();
  for (const [name,rows] of Object.entries(files)) writeFileSync(resolve(destination,`${name}.csv`),reviewCsv(rows));
  writeFileSync(resolve(destination,'coverage-and-review.json'),JSON.stringify(report,null,2)+'\n');
  writeFileSync(resolve(destination,'START-HERE.txt'),`UThynk Spanish review — current beta content\n\nStart with thinking-challenges.csv (450 questions), then reading-passages.csv and reading-questions.csv (210 each). Reading-context.csv and path-text.csv provide supporting wording.\n\nOpen in Excel or another CSV editor using UTF-8. Compare English and Spanish. Keep id, field, English/Spanish source cells and hashes unchanged. Put revisions in suggested_spanish; choose approve, revise, or question in decision; add notes. Return the files to us. Nothing is automatically published or marked approved.\n\nPreserve meaning, uncertainty, numbers, negation, names, and the question's specific reasoning demand. Reading questions quote the translated passage: review the quotation and its passage together, keeping them identical after edits. Review natural Spanish and age suitability. U.S. school/financial terminology may need an explanatory phrase.\n\nThe hashes identify the exact source snapshot. Before applying feedback, compare both hashes with the current repository. Changed wording requires reconciliation and a new review. Review is per language and field; Spanish approval never approves French. Existing reading editorialStatus is shared, so it must not be set approved based on Spanish-only feedback.\n\nFrench remains an unreviewed working translation. Structural checks catch missing text and mismatched quotes; they cannot certify meaning or fluency. No French human review is claimed. The 117 archived readings, interface copy, and generated AI responses are not included in this pack and remain separate review work.\n`);
  console.log(JSON.stringify({output:resolve(destination),rows:Object.fromEntries(Object.entries(files).map(([key,rows])=>[key,rows.length])),report}));
  if (report.structuralIssues.length) process.exitCode=1;
}
