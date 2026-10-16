// Frozen pre-correction catalog: preserve previous questions, source text, URLs, and saved sessions.
// Server catalog. Client components receive only authorized module content or public summaries.
import partData from '@/data/thinkingPathParts.json';
import schoolTrialParts from '@/data/schoolTrialReadingParts.json';
import sequences from '@/data/readingSequences.json';
import newSources from '@/data/readingSources.json';
import passageData from '@/data/readingPassages.json';
import retiredPartData from '@/data/retiredReadingParts.json';
import type { PathText, ReadingModule, ThinkingPath, PathSummary } from '@/lib/thinkingPathTypes';
const t = (en: string, es: string, fr: string): PathText => ({ en, es, fr });
// A semantic change needs a new ID; wording fixes retain the current identity.
type Passage = Pick<ReadingModule, 'sourceUrl' | 'location' | 'text' | 'contentNote'> & { checkedAt?: string };
const passages: Record<string, Passage> = passageData.passages;
const makeModule = (value: Omit<ReadingModule, 'editorialStatus' | 'rightsEvidence' | 'text' | 'sourceKind'>): ReadingModule => {
  const passage = passages[value.id];
  if (!passage || passage.sourceUrl !== value.sourceUrl) throw new Error(`Missing or mismatched source passage: ${value.id}`);
  const { checkedAt = '2026-10-14', ...passageContent } = passage;
  const gutenbergId = value.sourceUrl.match(/\/(?:files|(?:cache\/)?epub)\/(\d+)\//)?.[1];
  return {
    ...value,
    ...passageContent,
    sourceKind: 'excerpt',
    editorialStatus: 'needs_review',
    rightsEvidence: {
      jurisdiction: 'US',
      statusUrl: gutenbergId ? `https://www.gutenberg.org/ebooks/${gutenbergId}` : 'https://www.copyright.gov/what-is-copyright/',
      checkedAt,
    },
  };
};

const plato = makeModule({
  id: 'reading-plato-republic-473', title: t('Who should lead?', '¿Quién debería dirigir?', 'Qui devrait diriger ?'),
  work: t('The Republic', 'La República', 'La République'), author: 'Plato', edition: 'Benjamin Jowett, 1892',
  location: t('Book V, 473c–d', 'Libro V, 473c–d', 'Livre V, 473c–d'), sourceUrl: 'https://www.gutenberg.org/cache/epub/150/pg150.html',
  rights: 'public_domain_us', category: 'Leadership & Influence',
  plainLanguage: t('Plato connects political power with the search for wisdom. Knowing more and ruling well may not be the same.', 'Platón vincula el poder político con la búsqueda de sabiduría. Saber más y gobernar bien quizá no sean lo mismo.', 'Platon relie le pouvoir politique à la recherche de sagesse. Savoir davantage et bien gouverner ne sont pas forcément identiques.'),
  lenses: [t('Expertise can improve decisions.', 'La experiencia puede mejorar las decisiones.', 'L’expertise peut améliorer les décisions.'), t('Who checks the experts when they are wrong?', '¿Quién controla a los expertos cuando se equivocan?', 'Qui contrôle les experts lorsqu’ils se trompent ?')],
  question: t('Should the wisest people have the most power? What would keep them accountable?', '¿Deberían los más sabios tener más poder? ¿Qué les exigiría rendir cuentas?', 'Les plus sages devraient-ils avoir le plus de pouvoir ? Qu’est-ce qui les obligerait à rendre des comptes ?'),
});
const prince = makeModule({
  id: 'reading-machiavelli-prince-17', title: t('Fear, trust, and loyalty', 'Miedo, confianza y lealtad', 'Peur, confiance et loyauté'),
  work: t('The Prince', 'El príncipe', 'Le Prince'), author: 'Niccolò Machiavelli', edition: 'W. K. Marriott, 1908',
  location: t('Chapter XVII', 'Capítulo XVII', 'Chapitre XVII'), sourceUrl: 'https://www.gutenberg.org/files/1232/1232-h/1232-h.htm', rights: 'public_domain_us', category: 'Leadership & Influence',
  plainLanguage: t('Machiavelli examines a ruler’s survival. His claim invites questions about obedience, hatred, and durable trust.', 'Maquiavelo examina la supervivencia de un gobernante. Su afirmación invita a cuestionar la obediencia, el odio y la confianza duradera.', 'Machiavel examine la survie d’un dirigeant. Son affirmation invite à questionner l’obéissance, la haine et la confiance durable.'),
  lenses: [t('Fear may produce quick obedience.', 'El miedo puede producir obediencia rápida.', 'La peur peut produire une obéissance rapide.'), t('Obedience may hide resentment rather than loyalty.', 'La obediencia puede ocultar resentimiento en vez de lealtad.', 'L’obéissance peut cacher du ressentiment plutôt que de la loyauté.')],
  question: t('When does fear make leadership effective, and when does it weaken the leader’s position?', '¿Cuándo hace eficaz al liderazgo el miedo y cuándo debilita al líder?', 'Quand la peur rend-elle la direction efficace, et quand affaiblit-elle le dirigeant ?'),
});
const sun = makeModule({
  id: 'reading-suntzu-artofwar-3', title: t('Winning without a fight', 'Vencer sin pelear', 'Gagner sans combattre'),
  work: t('The Art of War', 'El arte de la guerra', 'L’Art de la guerre'), author: 'Sun Tzu', edition: 'Lionel Giles, 1910',
  location: t('Chapter III, section 2', 'Capítulo III, sección 2', 'Chapitre III, section 2'), sourceUrl: 'https://www.gutenberg.org/files/132/132-h/132-h.htm', rights: 'public_domain_us', category: 'Strategic Thinking',
  plainLanguage: t('Sun Tzu asks what victory costs. Avoiding conflict can be strategic, but restraint also has limits.', 'Sun Tzu pregunta cuánto cuesta la victoria. Evitar el conflicto puede ser estratégico, pero la contención también tiene límites.', 'Sun Tzu interroge le coût de la victoire. Éviter le conflit peut être stratégique, mais la retenue a aussi ses limites.'),
  lenses: [t('A solution can preserve people and resources.', 'Una solución puede preservar personas y recursos.', 'Une solution peut préserver les personnes et les ressources.'), t('Avoiding a necessary confrontation can also make matters worse.', 'Evitar un enfrentamiento necesario también puede empeorar las cosas.', 'Éviter une confrontation nécessaire peut aussi aggraver la situation.')],
  question: t('How would you distinguish strategic restraint from simply avoiding a hard problem?', '¿Cómo distinguirías la contención estratégica de simplemente evitar un problema difícil?', 'Comment distinguerais-tu la retenue stratégique du simple évitement d’un problème difficile ?'),
});
const declaration = makeModule({
  id: 'reading-declaration-consent', title: t('Where does authority come from?', '¿De dónde viene la autoridad?', 'D’où vient l’autorité ?'),
  work: t('Declaration of Independence', 'Declaración de Independencia', 'Déclaration d’indépendance'), author: 'Second Continental Congress', edition: '1776 · National Archives transcription',
  location: t('Preamble: consent of the governed', 'Preámbulo: consentimiento de los gobernados', 'Préambule : consentement des gouvernés'), sourceUrl: 'https://www.archives.gov/founding-docs/declaration-transcript', rights: 'government_text', category: 'History & Civilization',
  plainLanguage: t('The Declaration grounds authority in consent. Its ideals coexisted with slavery and political exclusion.', 'La Declaración fundamenta la autoridad en el consentimiento. Sus ideales coexistían con la esclavitud y la exclusión política.', 'La Déclaration fonde l’autorité sur le consentement. Ses idéaux coexistaient avec l’esclavage et l’exclusion politique.'),
  lenses: [t('Consent can limit arbitrary power.', 'El consentimiento puede limitar el poder arbitrario.', 'Le consentement peut limiter le pouvoir arbitraire.'), t('An ideal must be tested against who can actually exercise it.', 'Un ideal debe contrastarse con quién puede ejercerlo realmente.', 'Un idéal doit être confronté à ceux qui peuvent réellement l’exercer.')],
  question: t('What would make consent meaningful, especially for people excluded from political power?', '¿Qué haría significativo el consentimiento, sobre todo para quienes quedan excluidos del poder político?', 'Qu’est-ce qui rendrait le consentement réel, notamment pour les personnes exclues du pouvoir politique ?'),
});
const constitution = makeModule({
  id: 'reading-constitution-preamble', title: t('Promises and institutions', 'Promesas e instituciones', 'Promesses et institutions'),
  work: t('U.S. Constitution', 'Constitución de Estados Unidos', 'Constitution des États-Unis'), author: 'Constitutional Convention', edition: '1787 · National Archives transcription',
  location: t('Preamble', 'Preámbulo', 'Préambule'), sourceUrl: 'https://www.archives.gov/founding-docs/constitution-transcript', rights: 'government_text', category: 'History & Civilization',
  plainLanguage: t('The preamble names shared goals. The original document also contained compromises that protected slavery; amendments changed it.', 'El preámbulo nombra metas comunes. El documento original también incluía acuerdos que protegían la esclavitud; las enmiendas lo cambiaron.', 'Le préambule nomme des objectifs communs. Le texte original comprenait aussi des compromis protégeant l’esclavage ; les amendements l’ont modifié.'),
  lenses: [t('Institutions can turn ideals into rules.', 'Las instituciones pueden convertir ideales en reglas.', 'Les institutions peuvent transformer les idéaux en règles.'), t('Rules need enforcement, correction, and people willing to uphold them.', 'Las reglas necesitan aplicación, corrección y personas dispuestas a sostenerlas.', 'Les règles exigent application, correction et volonté de les respecter.')],
  question: t('How can a society tell whether its institutions are delivering the justice they promise?', '¿Cómo puede una sociedad saber si sus instituciones cumplen la justicia que prometen?', 'Comment une société peut-elle savoir si ses institutions réalisent la justice qu’elles promettent ?'),
});
const ivan = makeModule({
  id: 'reading-karamazov-rebellion', title: t('The price of a greater good', 'El precio de un bien mayor', 'Le prix d’un bien supérieur'),
  work: t('The Brothers Karamazov', 'Los hermanos Karamázov', 'Les Frères Karamazov'), author: 'Fyodor Dostoyevsky', edition: 'Constance Garnett, 1912',
  location: t('Book V, chapter IV: Rebellion', 'Libro V, capítulo IV: Rebelión', 'Livre V, chapitre IV : Révolte'), sourceUrl: 'https://www.gutenberg.org/files/28054/28054-h/28054-h.htm', rights: 'public_domain_us', category: 'Ethics & Moral Reasoning',
  plainLanguage: t('Ivan challenges harmony purchased through innocent suffering. Alyosha offers another response; the novel does not reduce the issue to one slogan.', 'Iván cuestiona una armonía comprada con sufrimiento inocente. Aliosha ofrece otra respuesta; la novela no reduce el asunto a un lema.', 'Ivan conteste une harmonie achetée par la souffrance innocente. Aliocha apporte une autre réponse ; le roman ne réduit pas la question à un slogan.'),
  lenses: [t('Innocent people must not be treated merely as a price to pay.', 'Los inocentes no deben ser tratados solo como un precio que pagar.', 'Les innocents ne doivent pas être traités comme un simple prix à payer.'), t('Rejecting an explanation and deciding how to help are different tasks.', 'Rechazar una explicación y decidir cómo ayudar son tareas distintas.', 'Rejeter une explication et décider comment aider sont deux tâches différentes.')],
  question: t('Can a future benefit justify harm to innocent people? What limits would you set?', '¿Puede un beneficio futuro justificar el daño a inocentes? ¿Qué límites pondrías?', 'Un bénéfice futur peut-il justifier le mal fait aux innocents ? Quelles limites poserais-tu ?'),
  contentNote: t('Sensitive theme: suffering of children. Discuss with a parent or teacher if needed; no graphic passage is shown.', 'Tema sensible: sufrimiento infantil. Habla con un padre o profesor si lo necesitas; no se muestra un pasaje gráfico.', 'Thème sensible : souffrance des enfants. Discute avec un parent ou un professeur si nécessaire ; aucun passage explicite n’est présenté.'),
});
const socrates = makeModule({
  id: 'reading-apology-examined-life', title: t('Examine what you believe', 'Examina lo que crees', 'Examine tes croyances'),
  work: t('Apology', 'Apología de Sócrates', 'Apologie de Socrate'), author: 'Plato', edition: 'Benjamin Jowett, 1892',
  location: t('Socrates on the examined life', 'Sócrates sobre la vida examinada', 'Socrate sur la vie examinée'), sourceUrl: 'https://www.gutenberg.org/files/1656/1656-h/1656-h.htm', rights: 'public_domain_us', category: 'Epistemology',
  plainLanguage: t('Socrates defends questioning himself and others. Reflection can uncover weak beliefs, yet action cannot always wait.', 'Sócrates defiende cuestionarse a sí mismo y a otros. La reflexión descubre creencias débiles, pero actuar no siempre puede esperar.', 'Socrate défend le questionnement de soi et des autres. La réflexion révèle des croyances fragiles, mais l’action ne peut pas toujours attendre.'),
  lenses: [t('Questions can reveal beliefs we accepted too easily.', 'Las preguntas revelan creencias que aceptamos con demasiada facilidad.', 'Les questions révèlent des croyances acceptées trop facilement.'), t('Endless questioning can also postpone responsibility.', 'Cuestionar sin fin también puede aplazar la responsabilidad.', 'Un questionnement sans fin peut aussi repousser la responsabilité.')],
  question: t('Which belief deserves closer examination, and what evidence would help you act on the result?', '¿Qué creencia merece más examen y qué pruebas te ayudarían a actuar según el resultado?', 'Quelle croyance mérite un examen plus approfondi, et quelles preuves t’aideraient à agir selon le résultat ?'),
});
const confucius = makeModule({
  id: 'reading-analects-4-16', title: t('Character and gain', 'Carácter y beneficio', 'Caractère et profit'),
  work: t('The Analects', 'Las Analectas', 'Les Entretiens'), author: 'Confucius', edition: 'James Legge, 1861',
  location: t('Book IV, chapter XVI', 'Libro IV, capítulo XVI', 'Livre IV, chapitre XVI'), sourceUrl: 'https://www.gutenberg.org/cache/epub/3330/pg3330.html', rights: 'public_domain_us', category: 'Identity & Human Behavior',
  plainLanguage: t('Confucius contrasts moral priorities with advantage. The older translation’s “superior” refers here to character, not inherited worth.', 'Confucio contrasta las prioridades morales con la ventaja. «Superior» en esta traducción antigua se refiere aquí al carácter, no al valor heredado.', 'Confucius oppose les priorités morales à l’avantage. « Supérieur » dans cette traduction ancienne désigne ici le caractère, non une valeur héritée.'),
  lenses: [t('A gain can be attractive and still be wrong.', 'Una ganancia puede ser atractiva y aun así ser incorrecta.', 'Un gain peut être attirant et pourtant injuste.'), t('Providing for yourself and others can also be a responsibility.', 'Mantenerte a ti y a otros también puede ser una responsabilidad.', 'Subvenir à tes besoins et à ceux des autres peut aussi être une responsabilité.')],
  question: t('When should principle outweigh personal gain, and when might gaining resources serve a good purpose?', '¿Cuándo debe el principio pesar más que el beneficio personal y cuándo puede obtener recursos servir a un buen fin?', 'Quand un principe doit-il primer sur le gain personnel, et quand obtenir des ressources peut-il servir un bon objectif ?'),
});
const tao = makeModule({
  id: 'reading-tao-water-8', title: t('Strength that adapts', 'Fuerza que se adapta', 'Une force qui s’adapte'),
  work: t('Tao Te Ching', 'Tao Te Ching', 'Tao Te King'), author: 'Laozi', edition: 'James Legge, 1891',
  location: t('Chapter 8', 'Capítulo 8', 'Chapitre 8'), sourceUrl: 'https://www.gutenberg.org/files/216/216-h/216-h.htm', rights: 'public_domain_us', category: 'Identity & Human Behavior',
  plainLanguage: t('Water becomes a model for usefulness without constant struggle. Adaptability is not automatically surrender.', 'El agua se vuelve un modelo de utilidad sin lucha constante. Adaptarse no equivale necesariamente a rendirse.', 'L’eau devient un modèle d’utilité sans lutte permanente. S’adapter ne signifie pas automatiquement se rendre.'),
  lenses: [t('Flexibility can accomplish what force cannot.', 'La flexibilidad puede lograr lo que la fuerza no logra.', 'La souplesse peut accomplir ce que la force ne peut pas.'), t('Some boundaries require firmness.', 'Algunos límites requieren firmeza.', 'Certaines limites exigent de la fermeté.')],
  question: t('When would adapting be stronger than pushing harder, and what boundary would you still protect?', '¿Cuándo sería más fuerte adaptarse que insistir y qué límite seguirías protegiendo?', 'Quand s’adapter serait-il plus fort qu’insister, et quelle limite protégerais-tu encore ?'),
});
const herodotus = makeModule({
  id: 'reading-herodotus-customs-3-38', title: t('Familiar does not always mean best', 'Lo familiar no siempre es lo mejor', 'Ce qui est familier n’est pas toujours le meilleur'),
  work: t('The Histories', 'Historias', 'Histoires'), author: 'Herodotus', edition: 'G. C. Macaulay, 1890',
  location: t('Book III, chapter 38', 'Libro III, capítulo 38', 'Livre III, chapitre 38'), sourceUrl: 'https://www.gutenberg.org/files/2707/2707-h/2707-h.htm', rights: 'public_domain_us', category: 'History & Civilization',
  plainLanguage: t('Herodotus describes how people favor the customs they know. His account is an ancient observer’s interpretation, not proof that every culture or person thinks alike.', 'Heródoto describe cómo las personas prefieren las costumbres que conocen. Su relato es la interpretación de un observador antiguo, no una prueba de que todas las culturas o personas piensen igual.', 'Hérodote décrit comment les gens préfèrent les coutumes qu’ils connaissent. Son récit est l’interprétation d’un observateur antique, pas la preuve que toutes les cultures ou personnes pensent de la même façon.'),
  lenses: [t('Understanding a custom can prevent careless judgment.', 'Comprender una costumbre puede evitar juicios precipitados.', 'Comprendre une coutume peut éviter les jugements hâtifs.'), t('Familiarity alone does not prove that a practice is fair.', 'La familiaridad por sí sola no demuestra que una práctica sea justa.', 'La familiarité seule ne prouve pas qu’une pratique soit juste.')],
  question: t('How would you judge a familiar tradition fairly when someone from another culture challenges it?', '¿Cómo juzgarías con justicia una tradición familiar cuando alguien de otra cultura la cuestiona?', 'Comment jugerais-tu équitablement une tradition familière lorsqu’une personne d’une autre culture la remet en question ?'),
});
const smith = makeModule({
  id: 'reading-smith-interest-1-2', title: t('Interests and cooperation', 'Intereses y cooperación', 'Intérêts et coopération'),
  work: t('The Wealth of Nations', 'La riqueza de las naciones', 'La Richesse des nations'), author: 'Adam Smith', edition: '1776',
  location: t('Book I, chapter II', 'Libro I, capítulo II', 'Livre I, chapitre II'), sourceUrl: 'https://www.gutenberg.org/files/3300/3300-h/3300-h.htm', rights: 'public_domain_us', category: 'Financial Judgment',
  plainLanguage: t('Smith examines exchange through self-interest. Mutual benefit is possible, but incentives alone do not guarantee fairness.', 'Smith examina el intercambio mediante el interés propio. Puede haber beneficio mutuo, pero los incentivos solos no garantizan justicia.', 'Smith examine l’échange par l’intérêt personnel. Un bénéfice mutuel est possible, mais les incitations seules ne garantissent pas l’équité.'),
  lenses: [t('Serving another person can also serve your own interests.', 'Servir a otra persona también puede servir a tus intereses.', 'Servir autrui peut aussi servir tes intérêts.'), t('Unequal power can distort an apparently voluntary exchange.', 'Un poder desigual puede distorsionar un intercambio aparentemente voluntario.', 'Un pouvoir inégal peut fausser un échange apparemment volontaire.')],
  question: t('What makes an exchange genuinely beneficial to both sides, rather than merely profitable for one?', '¿Qué hace que un intercambio beneficie realmente a ambos y no solo resulte rentable para uno?', 'Qu’est-ce qui rend un échange réellement bénéfique aux deux parties plutôt que seulement rentable pour l’une ?'),
});

type Source = Pick<ReadingModule, 'work' | 'author' | 'edition' | 'sourceUrl' | 'rights'>;
type Part = Pick<ReadingModule, 'id' | 'title' | 'location' | 'plainLanguage' | 'lenses' | 'question'> & { source: string };
const sources: Record<string, Source> = {
  plato, prince, sun, declaration, constitution, ivan, socrates, confucius, tao, herodotus, smith,
  ...newSources as Record<string, Source>,
};
const categoryByPath: Record<string, string> = {
  'power-leadership': 'Leadership & Influence',
  'freedom-government': 'History & Civilization',
  'meaning-morality-suffering': 'Ethics & Moral Reasoning',
  'truth-knowledge': 'Epistemology',
  'human-nature': 'Identity & Human Behavior',
  'civilizations-culture': 'History & Civilization',
  'economics-society': 'Financial Judgment',
};
const buildParts = (slug: string, entries: Part[]) => entries.map(({ source, ...part }) => {
    if (!sources[source] || !categoryByPath[slug]) throw new Error(`Unknown reading source or path: ${source}/${slug}`);
    const { work, author, edition, sourceUrl, rights } = sources[source];
    return makeModule({ work, author, edition, sourceUrl, rights, ...part, category: categoryByPath[slug] });
  });
const additions = Object.fromEntries(Object.entries(partData).map(([slug, entries]) => [slug, buildParts(slug, entries as Part[])]));
// Replaced passages keep their original identities and answers; they are not active path parts.
const previousReadings = Object.fromEntries(Object.entries(retiredPartData).map(([key, entries]) => [key, buildParts(key.split('/')[0], entries as Part[])]));

const starterPaths: ThinkingPath[] = [
  { slug: 'power-leadership', title: t('Power & Leadership', 'Poder y liderazgo', 'Pouvoir et leadership'), description: t('Who should lead, how power works, and what keeps it accountable.', 'Quién debe dirigir, cómo funciona el poder y cómo exigir responsabilidad.', 'Qui doit diriger, comment fonctionne le pouvoir et comment le contrôler.'), readingPaths: [{ slug: 'rulers-responsibility', title: t('Rulers and responsibility', 'Gobernantes y responsabilidad', 'Dirigeants et responsabilité'), description: t('Ten readings on wisdom, trust, counsel, preparation, and accountable leadership.', 'Diez lecturas sobre sabiduría, confianza, consejos, preparación y liderazgo responsable.', 'Dix lectures sur sagesse, confiance, conseil, préparation et direction responsable.'), modules: [plato, prince, sun, ...additions['power-leadership']] }] },
  { slug: 'freedom-government', title: t('Freedom & Government', 'Libertad y gobierno', 'Liberté et gouvernement'), description: t('Consent, rights, institutions, and the gap between ideals and practice.', 'Consentimiento, derechos, instituciones y la distancia entre ideal y práctica.', 'Consentement, droits, institutions et écart entre idéal et pratique.'), readingPaths: [{ slug: 'promises-of-freedom', title: t('Promises of freedom', 'Promesas de libertad', 'Promesses de liberté'), description: t('Ten readings on rights, institutions, and who can actually use a promised freedom.', 'Diez lecturas sobre derechos, instituciones y quién puede ejercer una libertad prometida.', 'Dix lectures sur les droits, les institutions et l’exercice réel d’une liberté promise.'), modules: [declaration, constitution, ...additions['freedom-government']] }] },
  { slug: 'meaning-morality-suffering', title: t('Meaning, Morality & Suffering', 'Sentido, moralidad y sufrimiento', 'Sens, morale et souffrance'), description: t('What we owe others when explanations and outcomes conflict.', 'Qué debemos a otros cuando chocan explicaciones y resultados.', 'Ce que nous devons aux autres lorsque les explications et les résultats s’opposent.'), readingPaths: [{ slug: 'innocence-and-the-greater-good', title: t('Innocence and the greater good', 'Inocencia y bien mayor', 'Innocence et bien supérieur'), description: t('Ten readings comparing suffering, care, duty, and responsibility without prescribing a belief.', 'Diez lecturas que comparan sufrimiento, cuidado, deber y responsabilidad sin imponer creencias.', 'Dix lectures comparant souffrance, soin, devoir et responsabilité sans imposer de croyance.'), modules: [ivan, ...additions['meaning-morality-suffering']] }] },
  { slug: 'truth-knowledge', title: t('Truth & Knowledge', 'Verdad y conocimiento', 'Vérité et connaissance'), description: t('Examine certainty, evidence, and what could change your mind.', 'Examina certeza, pruebas y qué podría cambiar tu opinión.', 'Examine certitude, preuves et ce qui pourrait changer ton avis.'), readingPaths: [{ slug: 'the-examined-life', title: t('The examined life', 'La vida examinada', 'La vie examinée'), description: t('Ten readings testing certainty, assumptions, appearances, and testimony.', 'Diez lecturas para examinar certeza, supuestos, apariencias y testimonios.', 'Dix lectures pour examiner certitude, hypothèses, apparences et témoignages.'), modules: [socrates, ...additions['truth-knowledge']] }] },
  { slug: 'human-nature', title: t('Human Nature', 'Naturaleza humana', 'Nature humaine'), description: t('Character, motives, habits, and strength beyond appearances.', 'Carácter, motivos, hábitos y fuerza más allá de las apariencias.', 'Caractère, motivations, habitudes et force au-delà des apparences.'), readingPaths: [{ slug: 'character-and-adaptability', title: t('Character and adaptability', 'Carácter y adaptación', 'Caractère et adaptation'), description: t('Ten readings on character, habits, flexibility, and the distance between image and conduct.', 'Diez lecturas sobre carácter, hábitos, flexibilidad y distancia entre imagen y conducta.', 'Dix lectures sur caractère, habitudes, souplesse et écart entre image et actes.'), modules: [confucius, tao, ...additions['human-nature']] }] },
  { slug: 'civilizations-culture', title: t('Civilizations & Culture', 'Civilizaciones y cultura', 'Civilisations et culture'), description: t('Different perspectives on belonging, change, and shared memory.', 'Perspectivas distintas sobre pertenencia, cambio y memoria compartida.', 'Différentes perspectives sur l’appartenance, le changement et la mémoire commune.'), readingPaths: [{ slug: 'inside-outside-stories', title: t('Inside and outside stories', 'Historias internas y externas', 'Récits internes et externes'), description: t('Ten readings comparing historical accounts, identity, cultural memory, and measures of progress.', 'Diez lecturas que comparan relatos históricos, identidad, memoria cultural y medidas del progreso.', 'Dix lectures comparant récits historiques, identité, mémoire culturelle et mesures du progrès.'), modules: [herodotus, ...additions['civilizations-culture']] }] },
  { slug: 'economics-society', title: t('Economics & Society', 'Economía y sociedad', 'Économie et société'), description: t('Incentives, exchange, cooperation, and who carries the costs.', 'Incentivos, intercambio, cooperación y quién soporta los costes.', 'Incitations, échanges, coopération et répartition des coûts.'), readingPaths: [{ slug: 'interests-and-exchange', title: t('Interests and exchange', 'Intereses e intercambio', 'Intérêts et échanges'), description: t('Ten readings comparing exchange, innovation, status, opportunity, and the costs of economic progress.', 'Diez lecturas que comparan intercambio, innovación, posición social, oportunidades y los costos del progreso económico.', 'Dix lectures comparant échange, innovation, statut social, possibilités et coûts du progrès économique.'), modules: [smith, ...additions['economics-society']] }] },
];

// A reading has one canonical question and session identity even when several paths use it.
// New contexts that change the question or passage must create a new reading ID.
const moduleLibrary = new Map([
  ...starterPaths.flatMap(path => path.readingPaths.flatMap(reading => reading.modules)),
  ...Object.entries(schoolTrialParts).flatMap(([slug, entries]) => buildParts(slug, entries as Part[])),
].map(module => [module.id, module]));
export const thinkingPaths: ThinkingPath[] = starterPaths.map(path => ({
  ...path,
  readingPaths: [
    ...path.readingPaths.map(reading => ({ ...reading, practiceGoal: sequences.starterGoals[path.slug as keyof typeof sequences.starterGoals], connections: (sequences.starterConnections as Record<string, PathText[]>)[path.slug] })),
    ...sequences.additionalPaths[path.slug as keyof typeof sequences.additionalPaths].map(({ moduleIds, ...reading }) => ({
      ...reading,
      modules: moduleIds.map(id => {
        const readingModule = moduleLibrary.get(id);
        if (!readingModule) throw new Error(`Unknown reading in sequence ${path.slug}/${reading.slug}: ${id}`);
        return readingModule;
      }),
    })),
  ],
}));
export function getCurrentReadingModules(): ReadingModule[] { return [...moduleLibrary.values()]; }

export function getThinkingPath(slug: string) { return thinkingPaths.find(path => path.slug === slug); }
export function getPreviousReadingModules(pathSlug: string, readingSlug: string): ReadingModule[] {
  if (!getThinkingPath(pathSlug)?.readingPaths.some(reading => reading.slug === readingSlug)) return [];
  return previousReadings[`${pathSlug}/${readingSlug}`] || [];
}
export function getReadingModule(id: string) {
  return moduleLibrary.get(id)
    || Object.values(previousReadings).flat().find(module => module.id === id);
}
export function publicPathSummaries(): PathSummary[] {
  return thinkingPaths.map(path => ({ ...path, readingPaths: path.readingPaths.map(reading => ({ ...reading, modules: reading.modules.map(({ id, title, work, author }) => ({ id, title, work, author })) })) }));
}
export function readingReasoningContext(module: ReadingModule) {
  return `Reading: ${module.work.en} — ${module.author}. ${module.location.en}.\n${module.sourceKind === 'excerpt' ? 'Excerpt' : 'UThynk guided adaptation of the referenced source'}: ${module.text.en}\nContext: ${module.plainLanguage.en}\nQuestion: ${module.question.en}`;
}
