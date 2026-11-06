import type { Level } from '../types';

export type LearningExerciseVariant = 'multiple-choice' | 'true-false' | 'matching' | 'fill-blanks' | 'tap-reveal';

export interface LearningLevelPolicy {
  level: Level;
  knowledgeCount: number;
  vocabularyCount: number;
  vocabularyContextCount: number;
  vocabularyRecallCount: number;
  vocabularyRecallMode: 'choice' | 'guided' | 'independent';
  reviewCount: number;
  finalCount: number;
  quickPattern: readonly LearningExerciseVariant[];
  vocabularyPattern: readonly LearningExerciseVariant[];
  hotspotPattern: readonly LearningExerciseVariant[];
  teacherTiming: string;
  selfStudyTiming: string;
  evidenceCount: 1 | 2;
  summaryLength: string;
  writingTarget: string;
  questionMode: 'direct' | 'relationship' | 'evidence';
  analysisFocusEn: string;
  analysisFocusAr: string;
  grammarEn: string;
  grammarAr: string;
  fastEn: string;
  fastAr: string;
}

export const LEARNING_LEVEL_POLICIES: Record<Level, LearningLevelPolicy> = {
  A1: {
    level: 'A1',
    knowledgeCount: 6,
    vocabularyCount: 6,
    vocabularyContextCount: 4,
    vocabularyRecallCount: 3,
    vocabularyRecallMode: 'choice',
    reviewCount: 6,
    finalCount: 8,
    quickPattern: ['matching', 'true-false', 'multiple-choice', 'tap-reveal', 'fill-blanks'],
    vocabularyPattern: ['matching', 'tap-reveal', 'multiple-choice', 'true-false', 'fill-blanks'],
    hotspotPattern: ['tap-reveal', 'matching', 'true-false', 'multiple-choice'],
    teacherTiming: '30 minutes',
    selfStudyTiming: '15 minutes',
    evidenceCount: 1,
    summaryLength: '1–2 sentences',
    writingTarget: 'one short sentence with a sentence frame',
    questionMode: 'direct',
    analysisFocusEn: 'names, places, simple facts and the order of events',
    analysisFocusAr: 'الأسماء والأماكن والمعلومات البسيطة وترتيب الأحداث',
    grammarEn: 'Find one short chapter sentence and say it again with your own words in the same pattern.',
    grammarAr: 'ابحث عن جملة قصيرة من الفصل وقلها مرة أخرى بكلماتك بالنمط نفسه.',
    fastEn: 'Write two short sentences with one chapter word in each.',
    fastAr: 'اكتب جملتين قصيرتين في كل واحدة كلمة من كلمات الفصل.',
  },
  A2: {
    level: 'A2',
    knowledgeCount: 8,
    vocabularyCount: 6,
    vocabularyContextCount: 5,
    vocabularyRecallCount: 4,
    vocabularyRecallMode: 'choice',
    reviewCount: 8,
    finalCount: 10,
    quickPattern: ['tap-reveal', 'fill-blanks', 'matching', 'multiple-choice', 'true-false'],
    vocabularyPattern: ['fill-blanks', 'matching', 'tap-reveal', 'multiple-choice', 'true-false'],
    hotspotPattern: ['tap-reveal', 'matching', 'true-false', 'multiple-choice'],
    teacherTiming: '30–35 minutes',
    selfStudyTiming: '15–20 minutes',
    evidenceCount: 1,
    summaryLength: '2–3 sentences',
    writingTarget: 'one short factual sentence',
    questionMode: 'direct',
    analysisFocusEn: 'simple factual understanding, sequence, and short retelling',
    analysisFocusAr: 'الفهم المباشر للمعلومة والتسلسل وإعادة السرد القصير',
    grammarEn: 'Notice one short chapter sentence, its verb form, and its word order; reuse the same pattern.',
    grammarAr: 'لاحظ جملة قصيرة من الفصل وصيغة الفعل وترتيب الكلمات فيها، ثم استخدم النمط نفسه.',
    fastEn: 'Write three short sentences using two chapter words and check every fact in the text.',
    fastAr: 'اكتب ثلاث جمل قصيرة مستخدماً كلمتين من مفردات الفصل، ثم تحقق من كل معلومة في النص.',
  },
  B1: {
    level: 'B1',
    knowledgeCount: 8,
    vocabularyCount: 10,
    vocabularyContextCount: 6,
    vocabularyRecallCount: 5,
    vocabularyRecallMode: 'guided',
    reviewCount: 8,
    finalCount: 10,
    quickPattern: ['multiple-choice', 'matching', 'fill-blanks', 'true-false', 'tap-reveal'],
    vocabularyPattern: ['matching', 'fill-blanks', 'multiple-choice', 'tap-reveal', 'true-false'],
    hotspotPattern: ['multiple-choice', 'true-false', 'matching', 'tap-reveal'],
    teacherTiming: '45 minutes',
    selfStudyTiming: '35–40 minutes',
    evidenceCount: 2,
    summaryLength: '3–5 sentences',
    writingTarget: 'a short claim → evidence → explanation response',
    questionMode: 'relationship',
    analysisFocusEn: 'main idea, cause/result, character action or motivation, and text-supported explanation',
    analysisFocusAr: 'الفكرة الرئيسة والسبب والنتيجة وفعل الشخصية أو دافعها والتفسير المدعوم بالنص',
    grammarEn: 'Use cause/result linkers, reporting language, and short complex sentences when they help explain the chapter.',
    grammarAr: 'استخدم روابط السبب والنتيجة وأفعال القول والجمل المركبة القصيرة عندما تساعد على شرح الفصل.',
    fastEn: 'Write a short claim → evidence → explanation paragraph and add a second consequence or comparison only when the chapter supports it.',
    fastAr: 'اكتب فقرة قصيرة: ادعاء ← دليل ← تفسير، وأضف نتيجة أو مقارنة ثانية فقط إذا كان الفصل يدعمها.',
  },
  B2: {
    level: 'B2',
    knowledgeCount: 8,
    vocabularyCount: 10,
    vocabularyContextCount: 7,
    vocabularyRecallCount: 6,
    vocabularyRecallMode: 'independent',
    reviewCount: 8,
    finalCount: 10,
    quickPattern: ['multiple-choice', 'true-false', 'tap-reveal', 'matching', 'fill-blanks'],
    vocabularyPattern: ['multiple-choice', 'matching', 'fill-blanks', 'tap-reveal', 'true-false'],
    hotspotPattern: ['multiple-choice', 'true-false', 'tap-reveal', 'matching'],
    teacherTiming: '55 minutes',
    selfStudyTiming: '40 minutes',
    evidenceCount: 2,
    summaryLength: '5–7 sentences',
    writingTarget: 'a 120–150 word evidence-based analytical paragraph',
    questionMode: 'evidence',
    analysisFocusEn: 'evidence selection, inference, comparison, cause, turning points, and clearly labelled interpretation',
    analysisFocusAr: 'اختيار الدليل والاستنتاج والمقارنة والسبب ونقاط التحول مع تمييز التفسير بوضوح',
    grammarEn: 'Use evidence, comparison, concession, and cause-effect language such as because, therefore, whereas, according to the chapter, and this suggests.',
    grammarAr: 'استخدم لغة الدليل والمقارنة والاستدراك والسبب والنتيجة مثل: لأن، لذلك، بينما، وفقاً للفصل، ويدل هذا على.',
    fastEn: 'Write a 120–150 word analytical paragraph using at least two pieces of chapter evidence and clearly separate evidence from interpretation.',
    fastAr: 'اكتب فقرة تحليلية من 120–150 كلمة مستخدماً دليلين على الأقل من الفصل، وافصل بوضوح بين الدليل والتفسير.',
  },
};

export const getLearningLevelPolicy = (level: Level): LearningLevelPolicy => LEARNING_LEVEL_POLICIES[level];
