import type { UserRole } from '../contexts/UserRoleContext';
import mapEn from '../assets/images/home/f-map-en.webp';
import mapAr from '../assets/images/home/f-map-ar.webp';
import placesEn from '../assets/images/home/f-places-en.webp';
import placesAr from '../assets/images/home/f-places-ar.webp';
import wordnoteEn from '../assets/images/home/f-wordnote-en.webp';
import wordnoteAr from '../assets/images/home/f-wordnote-ar.webp';
import teacherEn from '../assets/images/home/f-teacher-en.webp';
import teacherAr from '../assets/images/home/f-teacher-ar.webp';
import practiceEn from '../assets/images/home/f-practice-en.webp';
import practiceAr from '../assets/images/home/f-practice-ar.webp';
import selfstudyEn from '../assets/images/home/f-selfstudy-en.webp';
import selfstudyAr from '../assets/images/home/f-selfstudy-ar.webp';

/** "More than a story" on the home page: screenshots are from Mecca A2 in the same language as the page. */
type Lang = 'en' | 'ar';
type Text = Record<Lang, string>;

export type HomeFeatureId = 'map' | 'places' | 'wordnote' | 'teacher' | 'practice' | 'selfstudy';
export interface HomeFeature {
  image: Record<Lang, string>;
  verb: Text;
  title: Text;
  body: Text;
  points: Record<Lang, [string, string]>;
}

export const HOME_FEATURES: Record<HomeFeatureId, HomeFeature> = {
  map: {
    image: { en: mapEn, ar: mapAr },
    verb: { en: 'Read', ar: 'اقرأ' },
    title: { en: 'Interactive journey maps', ar: 'خرائط الرحلة التفاعلية' },
    body: {
      en: 'The map grows with the story. Each chapter lights up the next step of the journey, and a map challenge at the end checks what stayed with you.',
      ar: 'تكبر الخريطة مع القصة. كل فصل يضيء خطوة جديدة من الرحلة، وفي النهاية تحدٍّ على الخريطة يختبر ما بقي في ذهنك.',
    },
    points: { en: ['A step on the map for every chapter', 'Map challenge after the story'], ar: ['خطوة على الخريطة لكل فصل', 'تحدّي الخريطة بعد القصة'] },
  },
  places: {
    image: { en: placesEn, ar: placesAr },
    verb: { en: 'Discover', ar: 'اكتشف' },
    title: { en: 'Places & People', ar: 'الأماكن والأشخاص' },
    body: {
      en: 'Every city, sea, building and people in the story has its own card, with a picture and a short note in clear English.',
      ar: 'لكل مدينة وبحر ومبنى وقوم في القصة بطاقة خاصة، فيها صورة وملاحظة قصيرة بلغة عربية واضحة.',
    },
    points: { en: ['Cards open from the story text', 'Grouped by cities, seas and buildings'], ar: ['البطاقات تُفتح من نص القصة', 'مرتّبة: مدن، بحار، مبانٍ'] },
  },
  wordnote: {
    image: { en: wordnoteEn, ar: wordnoteAr },
    verb: { en: 'Listen', ar: 'استمع' },
    title: { en: 'Word Notes and narration', ar: 'ملاحظات الكلمات والقراءة الصوتية' },
    body: {
      en: 'Tap a highlighted word to see what it means in this sentence. Press play to hear the chapter read aloud.',
      ar: 'اضغط على الكلمة الملوّنة لترى معناها في هذه الجملة، واضغط زر التشغيل لتسمع الفصل مقروءًا.',
    },
    points: { en: ['Meaning in context, not a dictionary list', 'Narration for every chapter'], ar: ['المعنى في السياق', 'قراءة صوتية لكل فصل'] },
  },
  teacher: {
    image: { en: teacherEn, ar: teacherAr },
    verb: { en: 'Teach', ar: 'علّم' },
    title: { en: 'Teacher’s Book', ar: 'كتاب المعلّم' },
    body: {
      en: 'A full guide for every book: aims, chapter-by-chapter support, classroom ideas and assessment.',
      ar: 'دليل كامل لكل كتاب: الأهداف، والدعم فصلًا بفصل، وأفكار للصف، والتقييم.',
    },
    points: { en: ['Support for every chapter', 'Assessment and rubrics'], ar: ['دعم لكل فصل', 'التقييم ومعايير التصحيح'] },
  },
  practice: {
    image: { en: practiceEn, ar: practiceAr },
    verb: { en: 'Practice', ar: 'تدرّب' },
    title: { en: 'Practice on every page', ar: 'تمرين في كل صفحة' },
    body: {
      en: 'A Quick Challenge checks each page right after you read it. Language Focus helps you notice the language and use it yourself.',
      ar: 'التحدّي السريع يختبر فهمك لكل صفحة بعد قراءتها مباشرة، والتركيز اللغوي يساعدك على ملاحظة اللغة واستعمالها.',
    },
    points: { en: ['Quick Challenge on every page', 'Language Focus after each chapter'], ar: ['تحدٍّ سريع في كل صفحة', 'تركيز لغوي بعد كل فصل'] },
  },
  selfstudy: {
    image: { en: selfstudyEn, ar: selfstudyAr },
    verb: { en: 'Plan', ar: 'خطّط' },
    title: { en: 'Self-Study Guide', ar: 'دليل الدراسة الذاتية' },
    body: {
      en: 'Know where you are and what comes next. The guide gives you a study path, chapter by chapter, and keeps your progress.',
      ar: 'اعرف أين أنت وما الخطوة التالية. يعطيك الدليل مسار دراسة فصلًا بفصل ويحفظ تقدّمك.',
    },
    points: { en: ['A study path for every book', 'Your progress at a glance'], ar: ['مسار دراسة لكل كتاب', 'تقدّمك بنظرة واحدة'] },
  },
};

/** Students and self-learners never see teacher items. */
export const HOME_FEATURE_ORDER: Record<UserRole, HomeFeatureId[]> = {
  teacher: ['map', 'places', 'wordnote', 'teacher'],
  student: ['map', 'places', 'wordnote', 'practice'],
  self: ['map', 'places', 'wordnote', 'selfstudy'],
};

/** The end-of-book sections, in the order every book shows them (icons and names from SECTION_ICONS). */
export const HOME_AFTER_STORY = ['knowledgeCheck', 'glossary', 'places', 'vocabularyChallenge', 'languageReview', 'finalChallenge'] as const;

export type HomeNoteIcon = 'classMode' | 'lessonCard' | 'pdf' | 'offline' | 'guide' | 'levelTest' | 'myWords';
export const HOME_NOTES: Record<UserRole, { icon: HomeNoteIcon; label: Text }[]> = {
  teacher: [
    { icon: 'classMode', label: { en: 'Class mode for the board', ar: 'وضع الصف للسبّورة' } },
    { icon: 'lessonCard', label: { en: 'A lesson card for every chapter', ar: 'بطاقة درس لكل فصل' } },
    { icon: 'pdf', label: { en: 'Printable PDFs', ar: 'ملفات PDF للطباعة' } },
  ],
  student: [
    { icon: 'pdf', label: { en: 'Printable PDFs', ar: 'ملفات PDF للطباعة' } },
    { icon: 'offline', label: { en: 'Read offline', ar: 'القراءة دون اتصال' } },
    { icon: 'guide', label: { en: 'Student Guide', ar: 'دليل الطالب' } },
  ],
  self: [
    { icon: 'levelTest', label: { en: 'Level test', ar: 'اختبار المستوى' } },
    { icon: 'myWords', label: { en: 'My Words', ar: 'كلماتي' } },
    { icon: 'offline', label: { en: 'Read offline', ar: 'القراءة دون اتصال' } },
  ],
};
