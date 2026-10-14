import type { StoryMap } from './features/story-maps/types';

export type PageType = 'story' | 'quiz' | 'vocabulary-match' | 'exercises' | 'glossary' | 'final-challenge' | 'map' | 'places';

export type Level = 'A2' | 'B1' | 'B2';

export type ExerciseType = 
  | 'true-false' 
  | 'multiple-choice' 
  | 'matching' 
  | 'sequencing' 
  | 'fill-blanks' 
  | 'drag-drop' 
  | 'tap-reveal' 
  | 'reflection' 
  | 'quiz-game'
  | 'choose-form'
  | 'word-bank'
  | 'error-correction'
  | 'sentence-building'
  | 'transformation';

/** One sentence with an inline choice at its [choice] gap (choose-form). */
export interface FormChoiceItem {
  sentence: string;
  options: string[];
  answer: number;
}

/** One sentence containing a single authored error (error-correction). */
export interface ErrorCorrectionItem {
  sentence: string;
  /** Exact substring of `sentence` that is wrong. */
  error: string;
  options: string[];
  answer: number;
}

/** Rewrite a story sentence by completing the [blank] in `frame` (transformation). */
export interface TransformationItem {
  source: string;
  frame: string;
  answers: string[];
}

export interface QuizQuestion {
  question: string;
  options: { text: string; isCorrect: boolean }[];
  hint: string;
}

export interface Exercise {
  id: string;
  type: ExerciseType;
  title?: string;
  instructions?: string;
  question?: string;
  options?: string[];
  correctAnswer: any;
  explanation?: string;
  feedback: {
    correct: string;
    incorrect: string;
  };
  matchingPairs?: { left: string; right: string }[];
  /** Column headings for matching; defaults to generic labels. */
  matchingHeadings?: { left: string; right: string };
  formChoices?: FormChoiceItem[];
  /** word-bank: chips for the [blank]s in fillBlanksText (answers + distractors). */
  wordBank?: string[];
  errorItems?: ErrorCorrectionItem[];
  /** sentence-building: chunks in the correct order; correctAnswer may list other accepted orders. */
  sentenceChunks?: string[];
  transformItems?: TransformationItem[];
  sequencingItems?: { id: string; text: string }[];
  fillBlanksText?: string;
  dragDropGroups?: { group: string; items: string[] }[];
  tapRevealItems?: { question: string; answer: string }[];
  hints?: string[];
  /** `example` is a short model answer, shown after the learner submits. */
  discussionPrompts?: { question: string; mode: string; example?: string }[];
  quizQuestions?: QuizQuestion[];
}

export interface Hotspot {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  title: string;
  description: string;
}

export interface VocabularyItem {
  word: string;
  definition: string;
  example?: string;
  partOfSpeech?: string;
  level?: Level;
  pronunciation?: string;
  wordFamily?: string[];
  collocations?: string[];
  synonyms?: string[];
  antonyms?: string[];
  chapter?: number;
  chapterTitle?: string;
  storyExample?: string;
  category?: string;
}

export interface VocabularyChallengePair {
  word: string;
  meaning: string;
  context?: string;
  chapter?: number;
  chapterTitle?: string;
  partOfSpeech?: string;
}

/** One prediction question before a chapter, checked by listening (or reading when there is no audio). */
/** A short task for a group of 3–4 learners, shown after some chapters. */
export interface GroupTask {
  type: 'jigsaw' | 'roleplay' | 'mapGap' | 'project';
  title: string;
  time: string;
  groupSize: string;
  roles?: { name: string; job: string }[];
  steps: string[];
  /** What each group shows the class at the end. */
  share: string;
  /** How a learner who studies alone can do a version of it. */
  solo: string;
}

/** picture: the picture shows the answer; guess: predict, then check; find: scan the text against a timer; skim: read quickly for the main idea, against a timer. */
export type BeforeYouReadKind = 'picture' | 'guess' | 'find' | 'skim';

export interface BeforeYouRead {
  /** Defaults to 'picture'. */
  kind?: BeforeYouReadKind;
  question: string;
  options: string[];
  /** Index of the correct option. */
  answer: number;
  /** Words from the story that prove the answer. */
  quote?: string;
}

export interface PageData {
  id: number;
  type: PageType;
  title: string;
  subtitle?: string;
  content: string;
  exercises?: Exercise[];
  languageFocusExercises?: Exercise[];
  image?: string;
  audioUrl?: string;
  vocabulary?: VocabularyItem[];
  vocabularyPairs?: VocabularyChallengePair[];
  hotspots?: Hotspot[];
  animatedWords?: string[];
  syncPoints?: number[];
  timedChunks?: { start: number; end: number; text: string }[];
  /** Interactive map shown on a `map` page between chapters. */
  map?: StoryMap;
  /** Which book's place and history cards a `places` page lists. */
  entityBookKey?: string;
  beforeYouRead?: BeforeYouRead;
  /** Three can-do lines the learner rates at the end of the chapter. */
  iCan?: string[];
  groupTask?: GroupTask;
}

export interface StudentGuideSection {
  title: string;
  icon?: string; // Icon name from the application semantic icon registry
  text: string;
  points: string[];
}

export interface TeacherGuideSection {
  chapter: string;
  timing: string;
  objectives: string[];
  pedagogy: string;
  priorKnowledge?: string[];
  anticipatedMisconceptions?: string[];
  grammarFocus?: string;
  pronunciationFocus?: string;
  beforeReading?: string[];
  duringReading?: string[];
  afterReading?: string[];
  lessonPlan: string;
  discussionPoints: string[];
  interactiveTips: string[];
  differentiation: {
    fastFinishers: string;
    strugglingLearners: string;
  };
  formativeAssessment?: string[];
  expectedResponses?: string[];
  transferTask?: string;
  teacherReflection?: string;
  // Chapter-specific instructions, instruction-check questions and what to
  // watch for while learners work (EPG: interaction management & monitoring).
  classroomManagement?: {
    instructions: string;
    checkQuestions: string[];
    monitoring: string;
  };
  assessmentTools?: {
    rubric?: string[];
    exitTicket?: string[];
    // One row per rubric item: what secure performance looks like and the
    // support move when it is not there yet.
    rubricLevels?: { criterion: string; secure: string; notYet: string }[];
  };
  // Self-study-only heading fields. They are optional so the same simple
  // chapter data shape can be rendered by both guide UIs without generators.
  whatToNotice?: string[];
  readListen?: string[];
  findAnswerInStory?: string[];
  vocabularyInContext?: string[];
  quickChallengeGuide?: string;
  wrongAnswerSupport?: string[];
  selfCheck?: string[];
  useWhatYouLearned?: string;
  reflectionPrompt?: string;
  kinestheticActivities?: string[];
  globalCitizenship?: string[];
  extraResources?: {
    worksheets?: string[];
    links?: { label: string; url: string }[];
  };
}

export interface RubricRow {
  criterion: string;
  excellent: string;
  good: string;
  developing: string;
}

export interface TeacherGuideMetadata {
  title?: string;
  subtitle?: string;
  level?: string;
  estimatedDuration?: string;
  targetAudience?: string;
  purpose?: string;
  approachDesc?: string;
  targetLearners?: string;
  assessmentEvidence?: string;
  assessmentOverview?: {
    formative: string[];
    summative: string[];
  };
  readingFramework?: {
    before: string;
    during: string;
    after: string;
  };
  rubricTitle?: string;
  rubricRows?: RubricRow[];
  vocabularyApproach?: string | {
    selection: string;
    method: string;
    recycling: string;
  };
  grammarApproach?: string;
  grammarSequence?: string[];
  skillsFocus?: {
    reading: string;
    listening: string;
    speaking: string;
    writing: string;
  };
  classroomManagement?: string[];
  valuesFocus?: string[];
  languageFocus?: string[];
  classroomUse?: {
    recommendedApproach: string;
    grouping: string;
    teacherRole: string;
  };
  projectIdeas?: string[];
  finalRubric?: RubricRow[];
  speakingApproach?: string;
  writingApproach?: string;
  valuesFramework?: string[];
  differentiationNotes?: string;
  assessmentRubric?: RubricRow[];
  homeConnection?: {
    title: string;
    items: string[];
  };
  globalCitizenship?: {
    title: string;
    description: string;
    themes: { title: string; description: string }[];
    actions: string[];
  };
  valuesEducation?: {
    title: string;
    description: string;
    items: { label: string; value: string }[];
    questions?: string[];
    actions?: string[];
  };
  sensitiveNotes?: {
    title: string;
    notes: string[];
  };
  appendices?: {
    exitTicket?: string[];
    miniProject?: { title: string; desc: string };
    reflectivePrompt?: { title: string; desc: string };
    sentenceFrames?: string[];
  };
}

export interface StudentGuideMetadata {
  whoIsThisFor?: string;
  title?: string;
  subtitle?: string;
  level?: string;
  language?: string;
  estimatedStudyTime?: string;
  learningGoals?: string[];
  recommendedUse?: string[];
  audience?: string;
  description?: string;
}

export interface BookData {
  id: string;
  level: Level;
  title: string;
  pages: PageData[];
  teacherGuide: TeacherGuideSection[];
  selfStudyGuide: TeacherGuideSection[];
  studentGuideText?: string;
  studentGuideSections?: StudentGuideSection[];
  teacherGuideMetadata?: TeacherGuideMetadata;
  studentGuideMetadata?: StudentGuideMetadata;
  baseFontSize: number;
}

export interface ProphetStory {
  id: string;
  name: string;
  description: string;
  image: string;
  /** A 480 px wide copy for small cover tiles, blurred backdrops and phones. */
  imageSmall?: string;
  availableLevels: Level[];
  isComingSoon?: boolean;
}
