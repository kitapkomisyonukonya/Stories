import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  X, 
  Scroll,
  ListOrdered,
  Accessibility,
  Book as BookIcon,
  Layout, 
  Users, 
  Heart, 
  ShieldAlert, 
  ClipboardList, 
  Home, 
  CheckCircle,
  FileText,
  MessageSquare,
  Lightbulb,
  Move,
  Globe,
  Award,
  Download,
  ChevronRight,
  Search,
  Clock,
  ClipboardCheck
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { collectionVisualFor } from '../../core/content/storyCatalog';
import { TeacherGuideSection, Level, PageData } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { GuideV2ChapterBox, GuideV2Tools, storyPageForSection } from './GuideV2';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import { LevelExamDialog } from '../exam/LevelExamDialog';

const splitLessonPlanSteps = (lessonPlan: string): string[] => {
  const normalized = lessonPlan.replace(/\s+/g, ' ').trim();
  if (!normalized) return [];

  const numbered = normalized
    .split(/(?=\b\d+\.\s)/)
    .map(step => step.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);

  if (numbered.length > 1) return numbered;

  const semicolonSteps = normalized
    .split(/\s*[;؛]\s*/)
    .map(step => step.trim())
    .filter(Boolean);

  return semicolonSteps.length > 1 ? semicolonSteps : [normalized];
};


export const TeacherGuide = ({ 
  isOpen, 
  onClose, 
  title,
  subtitle,
  content = [],
  pages = [],
  metadata,
  bookId,
  bookTitle,
  level,
  collectionId,
  pdfUrl
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  footerText?: string;
  content?: TeacherGuideSection[];
  pages?: PageData[];
  metadata?: import('../../types').TeacherGuideMetadata;
  bookId?: string;
  /** The book's library name; shown instead of the guide's own title so every screen uses one name. */
  bookTitle?: string;
  level?: Level;
  collectionId?: string;
  /** The book's printable Teacher's Book (opens in a new tab). */
  pdfUrl?: string;
}) => {
  // Tab stays inside and focus returns to the opener; Escape is handled below.
  const dialogRef = useDialogFocus(isOpen, onClose, { escape: false });
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPrepOpen, setIsPrepOpen] = useState(false);
  const [examLevel, setExamLevel] = useState<Level | null>(null);
  const [prepChapterIndex, setPrepChapterIndex] = useState(0);
  const [pendingChapterIndex, setPendingChapterIndex] = useState<number | null>(null);
  const contentScrollRef = React.useRef<HTMLDivElement>(null);
  const sectionNavRef = React.useRef<HTMLElement>(null);
  const chapterRefs = React.useRef<Record<number, HTMLDivElement | null>>({});
  const { language, t, formatNumber, isRTL } = useLanguage();

  const guideTokens = collectionVisualFor(collectionId).readerTokens;

  const isAdam = bookId?.toLowerCase().includes('adam');
  const isAbraham = bookId?.toLowerCase().includes('abraham');
  const isMoses = bookId?.toLowerCase().includes('moses') || bookId?.toLowerCase().includes('musa');
  const isMecca = bookId?.toLowerCase().includes('mecca') || bookId?.toLowerCase().includes('mekke');
  const isYunus = bookId?.toLowerCase().includes('yunus');


const assessmentLevel: Level = level || 'A2';
const isArabicGuide = language === 'ar';

const assessmentProfile = (() => {
  const en = {
    A2: {
      evidenceLabel: 'Learning Evidence',
      formativeLabel: 'Formative Use',
      description: 'Use short, varied, low-pressure evidence throughout the lesson. Focus on basic comprehension, familiar vocabulary and structures, simple spoken or written production, task completion, and reflection. Give immediate feedback and allow another attempt when useful.',
      evidenceItems: [
        'Short comprehension checks: multiple choice, true/false, matching, and sequencing.',
        'Use of 3–5 target words in guided answers or simple sentences.',
        'A brief oral retelling or a 2–4 sentence written response.',
        'Teacher observation of participation and task completion with a simple checklist.',
        'Exit ticket plus simple self-assessment: I can / I need more practice.'
      ],
      rubricTitle: 'A2 Formative Assessment Rubric',
      rubricRows: [
        { criterion: 'Basic Comprehension', excellent: 'Understands the main idea, sequences events, and answers most short questions independently.', good: 'Understands the main idea and answers basic questions with limited support.', developing: 'Needs visuals, rereading, or guided questions to understand the main events.' },
        { criterion: 'Vocabulary', excellent: 'Uses several target words correctly in simple sentences.', good: 'Uses some target words understandably with minor errors.', developing: 'Recognizes some words but needs a word bank or model to use them.' },
        { criterion: 'Language Production', excellent: 'Produces clear, ordered simple sentences orally or in writing.', good: 'Produces short understandable sentences with some errors.', developing: 'Needs sentence starters or a model to produce a complete response.' },
        { criterion: 'Task Completion & Participation', excellent: 'Completes the task and participates appropriately and consistently.', good: 'Completes most of the task and participates when encouraged.', developing: 'Needs repeated support to begin or continue the task.' },
        { criterion: 'Simple Reflection', excellent: 'States a lesson or value and gives a simple personal or school-life example.', good: 'States a relevant lesson or value in a simple sentence.', developing: 'Needs a prompt or choices to express the lesson or value.' }
      ]
    },
    B1: {
      evidenceLabel: 'Learning Evidence',
      formativeLabel: 'Formative Use',
      description: 'Collect varied evidence during learning: comprehension, retelling, vocabulary and structure use, short spoken or written production, interpretation, and reflection. Use results to give specific feedback and adjust support before the next task.',
      evidenceItems: [
        'Comprehension tasks covering main ideas, details, sequence, cause, and consequence.',
        'Short retelling or summary using target vocabulary and structures.',
        'A spoken or written task explaining a motive, result, value, or interpretation.',
        'Teacher observation of participation and collaboration with a checklist.',
        'Exit ticket plus brief self- or peer-assessment with one strength and one next step.'
      ],
      rubricTitle: 'B1 Formative Assessment Rubric',
      rubricRows: [
        { criterion: 'Comprehension & Evidence', excellent: 'Explains main ideas and key relationships and supports answers with relevant details from the text.', good: 'Understands the main idea and most details and gives a simple supporting example.', developing: 'Understands parts of the text but needs support to connect or use details as evidence.' },
        { criterion: 'Vocabulary & Language Control', excellent: 'Uses story vocabulary and target structures accurately in connected sentences.', good: 'Uses appropriate vocabulary and understandable structures with some errors.', developing: 'Uses limited vocabulary or needs sentence frames to complete the task.' },
        { criterion: 'Spoken/Written Production', excellent: 'Expresses ideas clearly in an organized short paragraph or sustained response.', good: 'Produces several connected sentences that communicate the required meaning.', developing: 'Produces short isolated sentences and needs support with linking and organization.' },
        { criterion: 'Interpretation & Reflection', excellent: 'Explains motives, consequences, or values and gives a clear reason for a viewpoint.', good: 'Gives a relevant interpretation or opinion with one reason.', developing: 'States a fact or opinion but needs prompting to explain it.' },
        { criterion: 'Participation & Revision', excellent: 'Participates actively and uses feedback to improve an answer or product.', good: 'Participates appropriately and makes a simple improvement after feedback.', developing: 'Needs repeated encouragement or support to participate and revise.' }
      ]
    },
    B2: {
      evidenceLabel: 'Learning Evidence',
      formativeLabel: 'Formative Use',
      description: 'Collect multiple forms of evidence throughout learning, not only at the end. Track textual comprehension, linguistic precision, analysis, argumentation, transfer to new contexts, and response to feedback. Use the evidence to adjust instruction and allow revision.',
      evidenceItems: [
        'Text-based analysis or discussion supported with precise evidence from the story.',
        'Extended speaking or writing showing organization, accuracy, range, and control.',
        'Performance or transfer tasks that apply an idea or value to a new context.',
        'Teacher observation with a checklist or rating scale during collaborative work.',
        'Self- and peer-assessment followed by a visible revision or improvement.'
      ],
      rubricTitle: 'B2 Formative Assessment Rubric',
      rubricRows: [
        { criterion: 'Critical Comprehension & Textual Evidence', excellent: 'Interprets ideas and relationships insightfully and supports claims with precise textual evidence.', good: 'Understands main ideas and uses appropriate evidence with reasonable explanation.', developing: 'Mostly restates information or needs support to select and explain evidence.' },
        { criterion: 'Language Range & Precision', excellent: 'Uses varied vocabulary and structures accurately and flexibly; minor errors do not affect meaning.', good: 'Uses an appropriate range of language with some errors that do not block communication.', developing: 'Relies on limited or repetitive language; errors sometimes reduce clarity.' },
        { criterion: 'Argumentation & Organization', excellent: 'Develops a clear position, links ideas logically, and supports points with convincing reasons and examples.', good: 'Presents a generally organized position with understandable links and reasons.', developing: 'Presents disconnected ideas or needs support to organize and justify a viewpoint.' },
        { criterion: 'Analysis & Transfer', excellent: 'Makes independent comparisons, inferences, and meaningful connections to new situations.', good: 'Makes relevant connections and gives a reasonable interpretation or application.', developing: 'Needs guiding questions to move beyond literal understanding toward analysis or application.' },
        { criterion: 'Independent Learning & Feedback', excellent: 'Evaluates own work and uses teacher or peer feedback to make clear independent improvements.', good: 'Responds to feedback and makes some appropriate improvements.', developing: 'Needs direct guidance to identify improvements and act on feedback.' }
      ]
    }
  };

  const ar = {
    A2: {
      evidenceLabel: 'أدلة التعلّم',
      formativeLabel: 'الاستخدام التكويني',
      description: 'يُتابَع تقدّم المتعلم من خلال مهام قصيرة ومتنوعة ومنخفضة الضغط أثناء الدرس. يركز التقييم على الفهم الأساسي، والمفردات والتراكيب المألوفة، وإنتاج جمل بسيطة، وإنجاز المهمة، والتأمل، مع تغذية راجعة فورية وفرصة للمحاولة مرة أخرى.',
      evidenceItems: [
        'أسئلة فهم قصيرة: اختيار من متعدد، صواب أو خطأ، مطابقة، وترتيب أحداث.',
        'استخدام 3–5 كلمات مستهدفة في إجابات موجهة أو جمل بسيطة.',
        'إعادة سرد شفهي قصير أو كتابة 2–4 جمل.',
        'ملاحظة المعلم للمشاركة وإنجاز المهمة باستخدام قائمة تحقق بسيطة.',
        'تذكرة خروج مع تقييم ذاتي بسيط: أستطيع / أحتاج إلى مزيد من التدريب.'
      ],
      rubricTitle: 'مقياس التقييم التكويني للمستوى A2',
      rubricRows: [
        { criterion: 'الفهم الأساسي', excellent: 'يفهم الفكرة الرئيسة ويرتب الأحداث ويجيب عن معظم الأسئلة القصيرة بصورة مستقلة.', good: 'يفهم الفكرة الرئيسة ويجيب عن الأسئلة الأساسية مع دعم محدود.', developing: 'يحتاج إلى صور أو إعادة قراءة أو أسئلة موجهة لفهم الأحداث الأساسية.' },
        { criterion: 'المفردات', excellent: 'يستخدم عدة كلمات مستهدفة بصورة صحيحة في جمل بسيطة.', good: 'يستخدم بعض الكلمات المستهدفة بصورة مفهومة مع أخطاء بسيطة.', developing: 'يتعرف على بعض الكلمات لكنه يحتاج إلى بنك كلمات أو نموذج لاستخدامها.' },
        { criterion: 'الإنتاج اللغوي', excellent: 'ينتج جملاً بسيطة واضحة ومرتبة شفهياً أو كتابياً.', good: 'ينتج جملاً قصيرة مفهومة مع بعض الأخطاء.', developing: 'يحتاج إلى بدايات جمل أو نموذج لإنتاج إجابة كاملة.' },
        { criterion: 'إنجاز المهمة والمشاركة', excellent: 'يكمل المهمة ويشارك بصورة مناسبة ومستقرة.', good: 'يكمل معظم المهمة ويشارك عند التشجيع.', developing: 'يحتاج إلى دعم متكرر لبدء المهمة أو الاستمرار فيها.' },
        { criterion: 'التأمل البسيط', excellent: 'يذكر درساً أو قيمة ويعطي مثالاً بسيطاً من حياته أو المدرسة.', good: 'يذكر درساً أو قيمة مناسبة بجملة بسيطة.', developing: 'يحتاج إلى سؤال موجه أو خيارات للتعبير عن الدرس أو القيمة.' }
      ]
    },
    B1: {
      evidenceLabel: 'أدلة التعلّم',
      formativeLabel: 'الاستخدام التكويني',
      description: 'يُقاس تقدّم المتعلم من خلال أدلة متنوعة أثناء التعلم: فهم النص، وإعادة السرد، واستخدام المفردات والتراكيب، والإنتاج الشفهي والكتابي القصير، والتفسير والتأمل. تُستخدم النتائج لتقديم تغذية راجعة وتعديل الدعم قبل المهمة التالية.',
      evidenceItems: [
        'مهام فهم تشمل الفكرة الرئيسة والتفاصيل والتسلسل والسبب والنتيجة.',
        'إعادة سرد أو تلخيص قصير باستخدام مفردات وتراكيب المستوى.',
        'مهمة شفوية أو كتابية تفسر دافعاً أو نتيجة أو قيمة أو رأياً.',
        'ملاحظة مشاركة المتعلم وتعاونه باستخدام قائمة تحقق.',
        'تذكرة خروج مع تقييم ذاتي أو تقييم أقران يحدد نقطة قوة وخطوة تالية.'
      ],
      rubricTitle: 'مقياس التقييم التكويني للمستوى B1',
      rubricRows: [
        { criterion: 'الفهم واستخدام الدليل', excellent: 'يفسر الفكرة الرئيسة والعلاقات المهمة ويستند إلى تفاصيل مناسبة من النص.', good: 'يفهم الفكرة الرئيسة ومعظم التفاصيل ويقدم مثالاً داعماً بسيطاً.', developing: 'يفهم أجزاء من النص لكنه يحتاج دعماً لربط التفاصيل أو استخدامها كدليل.' },
        { criterion: 'المفردات والتراكيب', excellent: 'يستخدم مفردات القصة والتراكيب المستهدفة بدقة في جمل مترابطة.', good: 'يستخدم مفردات مناسبة وتراكيب مفهومة مع بعض الأخطاء.', developing: 'يعتمد على مفردات محدودة أو يحتاج إلى قوالب لغوية لإكمال المهمة.' },
        { criterion: 'التعبير الشفهي والكتابي', excellent: 'يعبر عن أفكاره بوضوح في فقرة أو استجابة قصيرة منظمة.', good: 'ينتج عدة جمل مترابطة توصل المعنى المطلوب.', developing: 'ينتج جملاً قصيرة متفرقة ويحتاج دعماً في الربط والتنظيم.' },
        { criterion: 'التفسير والتأمل', excellent: 'يفسر الدوافع أو النتائج أو القيم ويقدم سبباً واضحاً لرأيه.', good: 'يقدم تفسيراً أو رأياً مناسباً مع سبب واحد.', developing: 'يذكر حقيقة أو رأياً دون تفسير كافٍ إلا مع التوجيه.' },
        { criterion: 'المشاركة والمراجعة', excellent: 'يشارك بفاعلية ويستخدم التغذية الراجعة لتحسين إجابته أو منتجه.', good: 'يشارك بصورة مناسبة ويجري تحسيناً بسيطاً بعد التغذية الراجعة.', developing: 'يحتاج إلى تشجيع أو دعم مستمر للمشاركة والمراجعة.' }
      ]
    },
    B2: {
      evidenceLabel: 'أدلة التعلّم',
      formativeLabel: 'الاستخدام التكويني',
      description: 'تُجمع أدلة متعددة طوال عملية التعلم، لا في نهايتها فقط. يُتابَع فهم النص ودقة استخدام اللغة والتحليل والحجاج والنقل إلى سياقات جديدة والاستفادة من التغذية الراجعة، ثم تُستخدم النتائج لتعديل التدريس وإتاحة المراجعة والتحسين.',
      evidenceItems: [
        'تحليل نصي أو مناقشة تستند إلى شواهد دقيقة من القصة.',
        'إنتاج شفهي أو كتابي ممتد يبيّن التنظيم والدقة والثراء اللغوي.',
        'مهمة أداء أو نقل تطبق فكرة أو قيمة في سياق جديد.',
        'ملاحظة المعلم باستخدام قائمة تحقق أو مقياس تقدير أثناء العمل التعاوني.',
        'تقييم ذاتي وتقييم أقران يتبعه تعديل واضح في المنتج أو الأداء.'
      ],
      rubricTitle: 'مقياس التقييم التكويني للمستوى B2',
      rubricRows: [
        { criterion: 'الفهم النقدي والاستدلال بالنص', excellent: 'يفسر الأفكار والعلاقات بعمق ويستند إلى شواهد دقيقة وملائمة من النص.', good: 'يفهم الأفكار الرئيسة ويستخدم شواهد مناسبة مع تفسير مقبول.', developing: 'يعيد المعلومات غالباً أو يحتاج دعماً لاختيار الشواهد وتفسيرها.' },
        { criterion: 'الدقة والثراء اللغوي', excellent: 'يستخدم مفردات وتراكيب متنوعة ودقيقة بمرونة مع أخطاء قليلة لا تعيق المعنى.', good: 'يستخدم نطاقاً مناسباً من اللغة مع بعض الأخطاء التي لا تمنع الفهم.', developing: 'يعتمد على لغة محدودة أو متكررة وتؤثر الأخطاء أحياناً في الوضوح.' },
        { criterion: 'الحجاج والتنظيم', excellent: 'ينظم موقفه بوضوح ويربط الأفكار منطقياً ويدعمها بأسباب وأمثلة مقنعة.', good: 'يقدم موقفاً منظماً نسبياً مع روابط وأسباب مفهومة.', developing: 'يقدم أفكاراً متفرقة أو يحتاج إلى دعم لتنظيم الرأي وتبريره.' },
        { criterion: 'التحليل والنقل', excellent: 'يقارن ويستنتج بصورة مستقلة ويربط الأفكار بمواقف أو سياقات جديدة.', good: 'يجري روابط مناسبة ويقدم تفسيراً أو تطبيقاً معقولاً.', developing: 'يحتاج إلى أسئلة موجهة للانتقال من الفهم المباشر إلى التحليل أو التطبيق.' },
        { criterion: 'الاستقلالية والتغذية الراجعة', excellent: 'يقيّم عمله ويستخدم تغذية المعلم أو الأقران لإجراء تحسينات واضحة ومستقلة.', good: 'يستجيب للتغذية الراجعة ويجري بعض التحسينات المناسبة.', developing: 'يحتاج إلى متابعة مباشرة لتحديد التحسينات وتطبيق التغذية الراجعة.' }
      ]
    }
  };

  return (isArabicGuide ? ar : en)[assessmentLevel];
})();


  const teacherGuideGlossary = React.useMemo(() => {
    const entries = new Map<string, { word: string; definition: string; example?: string }>();

    pages.forEach((page) => {
      (page.vocabulary || []).forEach((item) => {
        const word = item.word?.trim();
        const definition = item.definition?.trim();
        if (!word || !definition) return;
        const key = word.toLocaleLowerCase(isArabicGuide ? 'ar' : 'en');
        if (!entries.has(key)) {
entries.set(key, { word, definition, example: item.example?.trim() || undefined });
        }
      });

      (page.vocabularyPairs || []).forEach((item) => {
        const word = item.word?.trim();
        const definition = item.meaning?.trim();
        if (!word || !definition) return;
        const key = word.toLocaleLowerCase(isArabicGuide ? 'ar' : 'en');
        if (!entries.has(key)) {
entries.set(key, { word, definition });
        }
      });
    });

    return Array.from(entries.values()).sort((a, b) =>
      a.word.localeCompare(b.word, isArabicGuide ? 'ar' : 'en')
    );
  }, [pages, isArabicGuide]);

  const tabs = [
    { id: 'overview', label: t('tg.overview'), icon: <Scroll size={22} /> },
    { id: 'curriculum', label: t('tg.curriculum'), icon: <Layout size={22} /> },
    { id: 'approach', label: t('tg.approach'), icon: <Lightbulb size={22} /> },
    { id: 'framework', label: t('tg.framework'), icon: <MessageSquare size={22} /> },
    { id: 'chapters', label: t('tg.chapters'), icon: <BookIcon size={22} /> },
    { id: 'management', label: t('tg.management'), icon: <ListOrdered size={22} /> },
    { id: 'differentiation', label: t('tg.differentiation'), icon: <Accessibility size={22} /> },
    { id: 'assessment', label: t('tg.assessment'), icon: <Award size={22} /> },
    ...(metadata?.cefrProfile ? [{ id: 'cefr', label: t('tg.cefr'), icon: <ClipboardCheck size={22} /> }] : []),
    { id: 'kinesthetic', label: t('tg.kinesthetic'), icon: <Move size={22} /> },
    { id: 'global', label: t('tg.global'), icon: <Globe size={22} /> },
    { id: 'values', label: t('tg.values'), icon: <Heart size={22} /> },
    { id: 'sensitive', label: t('tg.sensitive'), icon: <ShieldAlert size={22} /> },
    { id: 'tips', label: t('tg.tips'), icon: <MessageSquare size={22} /> },
    { id: 'home', label: t('tg.home'), icon: <Home size={22} /> },
    { id: 'checklist', label: t('tg.checklist'), icon: <CheckCircle size={22} /> },
    ...(metadata?.professionalDevelopment ? [{ id: 'development', label: t('tg.development'), icon: <Users size={22} /> }] : []),
    { id: 'appendices', label: t('tg.appendices'), icon: <FileText size={22} /> },
  ];

  const activeTabIndex = Math.max(0, tabs.findIndex(tab => tab.id === activeTab));
  const activeTabMeta = tabs[activeTabIndex] ?? tabs[0];
  const displayGuideTitle = bookTitle || metadata?.title || title || t('tg.title');
  const displayGuideSubtitle = metadata?.subtitle || subtitle || t('tg.subtitle');
  const selectedPrepChapter = content[prepChapterIndex] ?? content[0];

  const normalizedSearch = searchQuery.trim().toLocaleLowerCase(language === 'ar' ? 'ar' : 'en');
  const searchResults = normalizedSearch
    ? [
        ...tabs
          .filter(tab => tab.label.toLocaleLowerCase(language === 'ar' ? 'ar' : 'en').includes(normalizedSearch))
          .map(tab => ({ kind: 'section' as const, label: tab.label, tabId: tab.id })),
        ...content
          .map((chapter, index) => ({ chapter, index }))
          .filter(({ chapter }) => chapter.chapter.toLocaleLowerCase(language === 'ar' ? 'ar' : 'en').includes(normalizedSearch))
          .map(({ chapter, index }) => ({ kind: 'chapter' as const, label: chapter.chapter, chapterIndex: index })),
      ].slice(0, 8)
    : [];

  const jumpToChapter = (index: number) => {
    setActiveTab('chapters');
    setPendingChapterIndex(index);
    setSearchQuery('');
  };

  const openLessonPrep = (index = prepChapterIndex) => {
    setPrepChapterIndex(Math.min(Math.max(index, 0), Math.max(content.length - 1, 0)));
    setIsPrepOpen(true);
  };

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(tabs[0].id);
    }
  }, [isOpen]);

  React.useEffect(() => {
    if (!isOpen) return;
    contentScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab, isOpen]);

  // Keep the active section tab in view: the phone strip scrolls sideways, the desktop map vertically.
  React.useEffect(() => {
    if (!isOpen) return;
    const active = sectionNavRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!active) return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    active.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [activeTab, isOpen]);

  React.useEffect(() => {
    if (activeTab !== 'chapters' || pendingChapterIndex === null) return;
    const frame = window.requestAnimationFrame(() => {
      chapterRefs.current[pendingChapterIndex]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setPendingChapterIndex(null);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeTab, pendingChapterIndex]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      // The end-of-level test handles its own Escape (it asks before answers are lost).
      if (examLevel) return;
      if (isPrepOpen) {
        setIsPrepOpen(false);
        return;
      }
      onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, isPrepOpen, examLevel]);

  const renderTeacherContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
              <div className="space-y-3 sm:space-y-6">
                <h3 className="font-display text-xl sm:text-3xl text-parchment">
                  {t('tg.purpose')}
                </h3>
                <p className="font-serif text-sm sm:text-lg text-white leading-relaxed">
                  {metadata?.purpose || t('tg.approachDesc')}
                </p>
              </div>
              <div className="space-y-3 sm:space-y-6">
                <h3 className="font-display text-xl sm:text-3xl text-parchment">
                  {t('tg.targetLearners')}
                </h3>
                <p className="font-serif text-sm sm:text-lg text-white leading-relaxed">
                  {metadata?.targetLearners}
                </p>
              </div>
            </div>
            <div className="bg-gold/5 border border-gold/10 rounded-2xl p-4 sm:p-8">
              <h3 className="font-display text-lg sm:text-2xl text-gold mb-3 sm:mb-4">
                {t('tg.mainFocus')}
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 font-serif text-sm sm:text-base text-white">
                <li className="flex gap-2.5 sm:gap-3 items-start"><CheckCircle size={18} className="text-gold shrink-0 mt-0.5" /> <span><strong>{t('tg.fluency')}:</strong> {t('tg.fluencyDesc')}</span></li>
                <li className="flex gap-2.5 sm:gap-3 items-start"><CheckCircle size={18} className="text-gold shrink-0 mt-0.5" /> <span><strong>{t('tg.vocabulary')}:</strong> {t('tg.vocabularyDesc')}</span></li>
                <li className="flex gap-2.5 sm:gap-3 items-start"><CheckCircle size={18} className="text-gold shrink-0 mt-0.5" /> <span><strong>{t('tg.character')}:</strong> {t('tg.characterDesc')}</span></li>
              </ul>
            </div>
            <GuideV2Tools language={language} variant="teacher" />
          </div>
        );
      case 'curriculum':
        return (
          <div className="space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="font-display text-xl sm:text-3xl text-parchment">{t('tg.holisticAlignment')}</h3>
            <p className={cn(
              "font-serif text-sm sm:text-lg text-white",
              language !== 'ar' && "italic"
            )}>{t('tg.holisticDesc')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
              {[
                { title: t('tg.listeningViewing'), desc: t('tg.listeningViewingDesc') },
                { title: t('tg.readingComprehension'), desc: t('tg.readingComprehensionDesc') },
                { title: t('tg.spokenInteraction'), desc: t('tg.spokenInteractionDesc') },
                { title: t('tg.vocabularyDev'), desc: t('tg.vocabularyDevDesc') },
                { title: t('tg.valuesEducation'), desc: t('tg.valuesEducationDesc') },
                { title: t('tg.sel'), desc: t('tg.selDesc') }
              ].map((item, i) => (
                <div key={i} className="bg-white/5 border border-gold/10 p-4 sm:p-6 rounded-xl">
                  <h4 className="font-display text-gold text-[13px] sm:text-base md:text-[17px] uppercase tracking-widest mb-2 sm:mb-3">{item.title}</h4>
                  <p className="font-serif text-parchment/70 text-[13px] sm:text-base md:text-[17px] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 'approach':
        return (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="font-display text-xl sm:text-3xl text-parchment">{t('tg.principles')}</h3>
            <p className="font-serif text-sm sm:text-lg text-white">{metadata?.approachDesc || t('tg.approachDesc')}</p>
            <div className="space-y-4 sm:space-y-6">
              {[
                { title: t('tg.corePrinciples'), desc: t('tg.preTeach') },
                { title: t('tg.classroomSequence'), desc: t('tg.sequence') },
                { title: t('tg.teacherRole'), desc: t('tg.guideNotLecturer') },
                { title: t('tg.interaction'), desc: t('tg.pairTalk') },
                { title: t('tg.languageUse'), desc: t('tg.clearTeacherTalk') }
              ].map((item, i) => (
                <div key={i} className="flex gap-3 sm:gap-6 items-start">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold font-display shrink-0 text-sm sm:text-xl">{formatNumber(i+1)}</div>
                  <div>
                    <h4 className="font-display text-parchment text-base sm:text-xl">{item.title}</h4>
                    <p className="font-serif text-[13px] sm:text-lg text-parchment/60 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'framework':
        return (
          <div className="space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="font-display text-xl sm:text-3xl text-parchment">{t('tg.bdaFramework')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-10">
              <div className="space-y-3 sm:space-y-6">
                <h4 className="font-display text-gold text-[13px] sm:text-[15px] uppercase tracking-widest border-b border-gold/20 pb-2 sm:pb-3">{t('tg.beforeReading')}</h4>
                <div className="font-serif text-[13px] sm:text-base md:text-[17px] text-parchment/70 leading-relaxed">
                  {metadata?.readingFramework?.before}
                </div>
              </div>
              <div className="space-y-3 sm:space-y-6">
                <h4 className="font-display text-gold text-[13px] sm:text-[15px] uppercase tracking-widest border-b border-gold/20 pb-2 sm:pb-3">{t('tg.duringReading')}</h4>
                <div className="font-serif text-[13px] sm:text-base md:text-[17px] text-parchment/70 leading-relaxed">
                  {metadata?.readingFramework?.during}
                </div>
              </div>
              <div className="space-y-3 sm:space-y-6">
                <h4 className="font-display text-gold text-[13px] sm:text-[15px] uppercase tracking-widest border-b border-gold/20 pb-2 sm:pb-3">{t('tg.afterReading')}</h4>
                <div className="font-serif text-[13px] sm:text-base md:text-[17px] text-parchment/70 leading-relaxed">
                  {metadata?.readingFramework?.after}
                </div>
              </div>
            </div>
          </div>
        );
      case 'chapters':
        return (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-4 border-b border-gold/20 pb-4 sm:pb-5">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                  <p className="font-display text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.16em] text-gold/50">
                    {language === 'ar' ? 'التنقل بين الفصول' : 'CHAPTER NAVIGATOR'}
                  </p>
                  <h3 className="mt-1 font-display text-xl sm:text-3xl text-parchment">{t('tg.chapterSupport')}</h3>
                </div>
              </div>

              <div className="flex gap-2.5 overflow-x-auto pb-1 custom-scrollbar">
                {content.map((chapter, index) => (
                  <button
                    key={`chapter-nav-${index}`}
                    type="button"
                    onClick={() => jumpToChapter(index)}
                    title={chapter.chapter}
                    aria-label={chapter.chapter}
                    className="group shrink-0 min-w-11 h-11 px-3 rounded-full border border-gold/15 bg-white/[0.035] text-gold hover:bg-gold hover:text-white hover:border-gold transition-all font-display text-[12px] font-black"
                  >
                    {formatNumber(index + 1)}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-6 sm:space-y-12">
              {content.map((section, idx) => (
                <div
                  key={idx}
                  ref={(node) => { chapterRefs.current[idx] = node; }}
                  className="relative scroll-mt-24"
                >
                  <div className="relative bg-black/40 border border-gold/20 rounded-2xl overflow-hidden backdrop-blur-xl">
                    <div className="bg-gold/10 px-4 sm:px-8 py-4 sm:py-6 border-b border-gold/20 flex flex-wrap gap-2 justify-between items-center">
                      <div>
                        <h4 className="font-display text-lg sm:text-2xl text-gold">{section.chapter}</h4>
                        <p className="text-gold/40 text-[10px] uppercase tracking-[0.2em] mt-0.5">{t('tg.pedagogicalModule')} {formatNumber(idx + 1)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-[10px] sm:text-xs text-gold bg-gold/5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border border-gold/20 shadow-inner">
                          {formatNumber(section.timing)}
                        </span>
                        <button
                          type="button"
                          onClick={() => openLessonPrep(idx)}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-gold/20 bg-black/10 px-3 font-display text-[10px] sm:text-[11px] font-bold text-gold hover:bg-gold hover:text-white transition-colors"
                        >
                          <ClipboardCheck size={14} />
                          {language === 'ar' ? 'تحضير' : 'Prep'}
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
                        <div className="space-y-3 sm:space-y-4">
                          <h5 className="font-display text-[13px] sm:text-[15px] text-gold uppercase tracking-widest flex items-center gap-2 sm:gap-3">
                            <CheckCircle size={16} className="text-gold shrink-0" /> {t('tg.learningObjectives')}
                          </h5>
                          <ul className="space-y-2 font-serif text-[13px] sm:text-base md:text-[17px] text-white">
                            {section.objectives.map((obj, i) => <li key={i} className="flex gap-2.5 sm:gap-3"><span className="text-gold/40">•</span> {obj}</li>)}
                          </ul>
                        </div>
                        <div className="space-y-3 sm:space-y-4">
                          <h5 className="font-display text-[13px] sm:text-[15px] text-gold uppercase tracking-widest flex items-center gap-2 sm:gap-3">
                            <Lightbulb size={16} className="text-gold shrink-0" /> {t('tg.pedagogyApproach')}
                          </h5>
                          <div className="bg-white/5 p-3 sm:p-4 rounded-xl border border-gold/10">
                            <p className={cn(
                              "font-serif text-[13px] sm:text-base md:text-[17px] text-white leading-relaxed",
                              language !== 'ar' && "italic"
                            )}>
                              {section.pedagogy}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-10 border-t border-gold/10 pt-4 sm:pt-8">
                        <div className="space-y-2 sm:space-y-3">
                          <h5 className="font-display text-[10px] text-gold/60 uppercase tracking-widest">{t('tg.grammarFocus')}</h5>
                          <div className="p-3 bg-white/5 rounded-lg border border-gold/5">
                            <p className="font-serif text-[13px] sm:text-base md:text-[17px] text-white whitespace-pre-line">{section.grammarFocus}</p>
                          </div>
                        </div>
                        <div className="space-y-2 sm:space-y-3">
                          <h5 className="font-display text-[10px] text-gold/60 uppercase tracking-widest">{t('tg.pronunciationFocus')}</h5>
                          <div className="p-3 bg-white/5 rounded-lg border border-gold/5">
                            <p className="font-serif text-[13px] sm:text-base md:text-[17px] text-white whitespace-pre-line">{section.pronunciationFocus}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3 sm:space-y-4 border-t border-gold/10 pt-4 sm:pt-8">
                        <h5 className="font-display text-[13px] sm:text-[15px] text-gold uppercase tracking-widest flex items-center gap-2 sm:gap-3">
                          <ClipboardList size={16} className="text-gold shrink-0" /> {t('tg.lessonFlow')}
                        </h5>
                        <div className="space-y-2.5 sm:space-y-3">
                          {splitLessonPlanSteps(section.lessonPlan).map((step, i) => (
                            <div key={i} className="flex gap-2.5 sm:gap-4 items-start group/step">
                              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold font-display text-[10px] sm:text-xs shrink-0 group-hover/step:bg-gold group-hover/step:text-white transition-colors mt-0.5">{formatNumber(i+1)}</div>
                              <p className="font-serif text-[13px] sm:text-base md:text-[17px] text-white leading-relaxed">{step}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {section.classroomManagement && (
                        <div className="space-y-3 sm:space-y-4 border-t border-gold/10 pt-4 sm:pt-8">
                          <h5 className="font-display text-[13px] sm:text-[15px] text-gold uppercase tracking-widest flex items-center gap-2 sm:gap-3">
                            <Users size={16} className="text-gold shrink-0" /> {t('tg.classroomManagement')}
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                            <div className="p-3 bg-white/5 rounded-lg border border-gold/5">
                              <span className="text-[10px] text-gold/60 uppercase font-display block mb-2">{t('tg.instructions')}</span>
                              <p className="font-serif text-[13px] sm:text-[15px] text-white leading-relaxed">{section.classroomManagement.instructions}</p>
                            </div>
                            <div className="p-3 bg-white/5 rounded-lg border border-gold/5">
                              <span className="text-[10px] text-gold/60 uppercase font-display block mb-2">{t('tg.checkQuestions')}</span>
                              <ul className="space-y-1 font-serif text-[13px] sm:text-[15px] text-white">
                                {section.classroomManagement.checkQuestions.map((q, i) => <li key={i}>• {q}</li>)}
                              </ul>
                            </div>
                            <div className="p-3 bg-white/5 rounded-lg border border-gold/5">
                              <span className="text-[10px] text-gold/60 uppercase font-display block mb-2">{t('tg.monitoring')}</span>
                              <p className="font-serif text-[13px] sm:text-[15px] text-white leading-relaxed">{section.classroomManagement.monitoring}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {section.interculturalFocus && (
                        <div className="space-y-3 sm:space-y-4 border-t border-gold/10 pt-4 sm:pt-8" data-tg-intercultural>
                          <h5 className="font-display text-[13px] sm:text-[15px] text-gold uppercase tracking-widest flex items-center gap-2 sm:gap-3">
                            <Globe size={16} className="text-gold shrink-0" /> {t('tg.intercultural')}
                          </h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                            {([
                              ['tg.icNotice', section.interculturalFocus.notice],
                              ['tg.icCompare', section.interculturalFocus.compare],
                              ['tg.icPerspective', section.interculturalFocus.perspective],
                            ] as const).map(([label, text]) => (
                              <div key={label} className="p-3 bg-white/5 rounded-lg border border-gold/5">
                                <span className="text-[10px] text-gold/60 uppercase font-display block mb-2">{t(label)}</span>
                                <p className="font-serif text-[13px] sm:text-[15px] text-white leading-relaxed">{text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {section.mediationTasks && (
                        <div className="space-y-3 sm:space-y-4 border-t border-gold/10 pt-4 sm:pt-8" data-tg-mediation>
                          <h5 className="font-display text-[13px] sm:text-[15px] text-gold uppercase tracking-widest flex items-center gap-2 sm:gap-3">
                            <ClipboardList size={16} className="text-gold shrink-0" /> {t('tg.mediation')}
                          </h5>
                          <div className="p-3 bg-white/5 rounded-lg border border-gold/5">
                            <span className="text-[10px] text-gold/60 uppercase font-display block mb-2">{t('tg.mtNotes')}</span>
                            <p className="font-serif text-[13px] sm:text-[15px] text-white leading-relaxed">{section.mediationTasks.noteTaking.focus}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {section.mediationTasks.noteTaking.columns.map((column, i) => (
                                <span key={i} className="px-2.5 py-1 rounded-md border border-gold/20 bg-black/10 font-display text-[11px] sm:text-xs text-gold">{column}</span>
                              ))}
                            </div>
                            <p className="mt-2 font-serif text-[13px] sm:text-[15px] text-white/85 leading-relaxed"><span className="text-gold/70">{t('tg.mtAfterNotes')}:</span> {section.mediationTasks.noteTaking.afterNotes}</p>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                            {([
                              ['tg.mtRelay', section.mediationTasks.relay],
                              ['tg.mtPairs', section.mediationTasks.pairRoles],
                              ['tg.mtCulture', section.mediationTasks.cultureGuide],
                              ['tg.mtTranslation', section.mediationTasks.translation],
                              ['tg.mtHome', section.mediationTasks.homeRetell],
                              ['tg.mtAnalysis', section.mediationTasks.analysis],
                              ['tg.mtLookFor', section.mediationTasks.lookFor],
                              ['tg.mtThinkAloud', section.mediationTasks.thinkAloud && `${section.mediationTasks.thinkAloud.strategy}: “${section.mediationTasks.thinkAloud.sentence}” ${section.mediationTasks.thinkAloud.model}`],
                              ['tg.mtStop', section.mediationTasks.stopAndCheck && `${section.mediationTasks.stopAndCheck.after} ${section.mediationTasks.stopAndCheck.question}`],
                              ['tg.mtOnline', section.mediationTasks.onlineTask && `${t('tg.mtOnlinePost')}: ${section.mediationTasks.onlineTask.post} ${t('tg.mtOnlineReply')}: ${section.mediationTasks.onlineTask.reply}`],
                            ] as const).filter(([, text]) => Boolean(text)).map(([label, text]) => (
                              <div key={label} className="p-3 bg-white/5 rounded-lg border border-gold/5">
                                <span className="text-[10px] text-gold/60 uppercase font-display block mb-2">{t(label)}</span>
                                <p className="font-serif text-[13px] sm:text-[15px] text-white leading-relaxed">{text}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* New Assessment & Kinesthetic Fields in Chapter Support */}
                      {(section.assessmentTools || section.kinestheticActivities) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 border-t border-gold/10 pt-4 sm:pt-8">
                          {section.assessmentTools && (
                            <div className="space-y-3 sm:space-y-4">
                              <h5 className="font-display text-[13px] sm:text-[15px] text-gold uppercase tracking-widest flex items-center gap-2 sm:gap-3">
                                <Award size={16} className="text-gold shrink-0" /> {t('tg.assessmentTools')}
                              </h5>
                              <div className="space-y-3 sm:space-y-4">
                                {section.assessmentTools.rubricLevels?.length ? (
                                  <div>
                                    <span className="text-[10px] text-gold/60 uppercase font-display block mb-2">{t('tg.rubricLevels')}</span>
                                    <div className="space-y-2">
                                      {section.assessmentTools.rubricLevels.map((row, i) => (
                                        <div key={i} className="p-2.5 bg-white/5 rounded-lg border border-gold/10">
                                          <p className="font-display text-[11px] sm:text-xs text-gold mb-1">{row.criterion}</p>
                                          <p className="font-serif text-[12px] sm:text-sm text-white"><span className="text-gold/70">{t('tg.secure')}:</span> {row.secure}</p>
                                          <p className="font-serif text-[12px] sm:text-sm text-white/80"><span className="text-gold/70">{t('tg.notYet')}:</span> {row.notYet}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : section.assessmentTools.rubric && (
                                  <div>
                                    <span className="text-[10px] text-gold/60 uppercase font-display block mb-2">{t('tg.sampleRubric')}</span>
                                    <div className="flex flex-wrap gap-2">
                                      {section.assessmentTools.rubric.map((item, i) => (
                                        <span key={i} className="px-2.5 py-1 bg-gold/5 border border-gold/20 rounded-full text-[10px] sm:text-xs text-white font-serif">{item}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {section.assessmentTools.exitTicket && (
                                  <div>
                                    <span className="text-[10px] text-gold/60 uppercase font-display block mb-2">{t('tg.exitTicketQuestions')}</span>
                                    <ul className="space-y-1 font-serif text-[13px] sm:text-[15px] text-white">
                                      {section.assessmentTools.exitTicket.map((q, i) => <li key={i}>• {q}</li>)}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          {section.kinestheticActivities && (
                            <div className="space-y-3 sm:space-y-4">
                              <h5 className="font-display text-[13px] sm:text-[15px] text-gold uppercase tracking-widest flex items-center gap-2 sm:gap-3">
                                <Move size={16} className="text-gold shrink-0" /> {t('tg.kinesthetic')}
                              </h5>
                              <ul className="space-y-2 sm:space-y-3 font-serif text-[13px] sm:text-base md:text-[17px] text-white">
                                {section.kinestheticActivities.map((act, i) => <li key={i} className="flex gap-2.5 sm:gap-3"><span className="text-gold/40">•</span> {act}</li>)}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 border-t border-gold/10 pt-4 sm:pt-8">
                        <div className="space-y-3 sm:space-y-4">
                          <h5 className="font-display text-[13px] sm:text-[15px] text-gold uppercase tracking-widest flex items-center gap-2 sm:gap-3">
                            <MessageSquare size={16} className="text-gold shrink-0" /> {t('tg.discussionPoints')}
                          </h5>
                          <ul className="space-y-2 font-serif text-[13px] sm:text-base md:text-[17px] text-white">
                            {section.discussionPoints.map((point, i) => <li key={i} className="flex gap-2.5 sm:gap-3"><span className="text-gold/40">•</span> {point}</li>)}
                          </ul>
                        </div>
                        <div className="space-y-3 sm:space-y-4">
                          <h5 className="font-display text-[13px] sm:text-[15px] text-gold uppercase tracking-widest flex items-center gap-2 sm:gap-3">
                            <Accessibility size={16} className="text-gold shrink-0" /> {t('tg.differentiation')}
                          </h5>
                          <div className="space-y-3 sm:space-y-4">
                            <div className="bg-white/5 p-3 sm:p-4 rounded-xl border border-gold/10">
                              <span className="text-[10px] text-gold/60 uppercase font-display block mb-1">{t('tg.fastFinishers')}:</span>
                              <p className="text-[13px] sm:text-[15px] font-serif text-white leading-relaxed">{section.differentiation.fastFinishers}</p>
                            </div>
                            <div className="bg-white/5 p-3 sm:p-4 rounded-xl border border-gold/10">
                              <span className="text-[10px] text-gold/60 uppercase font-display block mb-1">{t('tg.strugglingLearners')}:</span>
                              <p className="text-[13px] sm:text-[15px] font-serif text-white leading-relaxed">{section.differentiation.strugglingLearners}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <GuideV2ChapterBox page={storyPageForSection(pages, section, idx)} language={language} variant="teacher" />

                      <div className="bg-gold/5 border border-gold/10 p-4 sm:p-6 rounded-2xl space-y-3 sm:space-y-4">
                        <h5 className="font-display text-[13px] sm:text-[15px] text-gold uppercase tracking-widest flex items-center gap-2 sm:gap-3">
                          <Heart size={16} className="text-gold shrink-0" /> {t('tg.appTips')}
                        </h5>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 font-serif text-[13px] sm:text-[15px] text-white">
                          {section.interactiveTips.map((tip, i) => <li key={i} className="flex gap-2.5 sm:gap-3">
                            <CheckCircle size={14} className="text-gold shrink-0 mt-0.5" /> {tip}
                          </li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'management':
        return (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="font-display text-xl sm:text-3xl text-parchment">{t('tg.management')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
              {[
                { title: t('tg.wholeClassMode'), desc: t('tg.wholeClassModeDesc') },
                { title: t('tg.pairWorkMode'), desc: t('tg.pairWorkModeDesc') },
                { title: t('tg.quizMode'), desc: t('tg.quizModeDesc') },
                { title: t('tg.exitTicketMode'), desc: t('tg.exitTicketModeDesc') }
              ].map((item, i) => (
                <div key={i} className="bg-gold/5 p-4 sm:p-6 rounded-xl border border-gold/10">
                  <h4 className="font-display text-gold text-sm sm:text-base mb-2 sm:mb-3">{item.title}</h4>
                  <p className="font-serif text-white text-[13px] sm:text-base md:text-[17px] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-white/5 p-4 sm:p-6 rounded-xl border border-gold/10">
              <h4 className="font-display text-gold text-sm sm:text-base mb-2 sm:mb-3">{t('tg.practicalNotes')}</h4>
              <ul className="space-y-2 font-serif text-white text-[13px] sm:text-base md:text-[17px] leading-relaxed">
                <li>• {t('tg.practicalNote1')}</li>
                <li>• {t('tg.practicalNote2')}</li>
                <li>• {t('tg.practicalNote3')}</li>
                <li>• {t('tg.practicalNote4')}</li>
              </ul>
            </div>
          </div>
        );
      case 'differentiation':
        return (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="font-display text-xl sm:text-3xl text-parchment">{t('tg.diffStrategies')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
              <div className="space-y-3 sm:space-y-6">
                <h4 className="font-display text-gold text-[13px] sm:text-[15px] uppercase tracking-widest">{t('tg.forSupport')}</h4>
                <ul className="space-y-2 sm:space-y-3 font-serif text-[13px] sm:text-base md:text-[17px] text-white">
                  <li>• {t('tg.forSupport1')}</li>
                  <li>• {t('tg.forSupport2')}</li>
                  <li>• {t('tg.forSupport3')}</li>
                  <li>• {t('tg.forSupport4')}</li>
                  <li>• {t('tg.forSupport5')}</li>
                </ul>
              </div>
              <div className="space-y-3 sm:space-y-6">
                <h4 className="font-display text-gold text-[13px] sm:text-[15px] uppercase tracking-widest">{t('tg.forExtension')}</h4>
                <ul className="space-y-2 sm:space-y-3 font-serif text-[13px] sm:text-base md:text-[17px] text-white">
                  <li>• {t('tg.forExtension1')}</li>
                  <li>• {t('tg.forExtension2')}</li>
                  <li>• {t('tg.forExtension3')}</li>
                  <li>• {t('tg.forExtension4')}</li>
                </ul>
              </div>
            </div>
            <div className="bg-white/5 p-4 sm:p-6 rounded-xl border border-gold/10">
              <h4 className="font-display text-gold text-sm sm:text-base mb-2 sm:mb-3">{t('tg.forMixedAbility')}</h4>
              <ul className="space-y-2 font-serif text-white text-[13px] sm:text-base md:text-[17px] leading-relaxed">
                <li>• {t('tg.forMixedAbility1')}</li>
                <li>• {t('tg.forMixedAbility2')}</li>
                <li>• {t('tg.forMixedAbility3')}</li>
              </ul>
            </div>
          </div>
        );
      case 'assessment':
        return (
          <div className="space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="font-display text-xl sm:text-3xl text-parchment border-b border-gold/20 pb-3 sm:pb-4">{t('tg.assessmentEvidence')}</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
              <div className="bg-white/5 p-4 sm:p-8 rounded-2xl border border-gold/10 hover:bg-gold/5 transition-colors">
                <h4 className="font-display text-gold text-[13px] sm:text-[15px] uppercase mb-3 sm:mb-4 flex items-center gap-2"><ClipboardList size={16} /> {assessmentProfile.evidenceLabel}</h4>
                <div className="font-serif text-white text-[13px] sm:text-base md:text-[17px] leading-relaxed">
                  {assessmentProfile.description}
                </div>
              </div>
              <div className="bg-white/5 p-4 sm:p-8 rounded-2xl border border-gold/10 hover:bg-gold/5 transition-colors">
                <h4 className="font-display text-gold text-[13px] sm:text-[15px] uppercase mb-3 sm:mb-4 flex items-center gap-2"><CheckCircle size={16} /> {assessmentProfile.formativeLabel}</h4>
                <ul className="space-y-2 font-serif text-white text-[13px] sm:text-[15px] leading-relaxed">
                  {assessmentProfile.evidenceItems.map((item, i) => <li key={i}>• {item}</li>)}
                </ul>
              </div>
            </div>

            <div className="bg-gold/5 border border-gold/10 p-4 sm:p-8 rounded-2xl">
              <h4 className="font-display text-lg sm:text-2xl text-gold mb-4 sm:mb-6">{assessmentProfile.rubricTitle}</h4>
              <div className="overflow-x-auto -mx-2 px-2">
                <table className="w-full text-left font-serif text-[13px] sm:text-[15px] text-white min-w-[500px]">
                  <thead>
                    <tr className="border-b border-gold/20">
                      <th className={cn("pb-3 sm:pb-4 font-display text-gold uppercase tracking-widest text-[10px]", isRTL && "text-right")}>{t('tg.criterion')}</th>
                      <th className={cn("pb-3 sm:pb-4 font-display text-gold uppercase tracking-widest text-[10px]", isRTL && "text-right")}>{t('tg.excellent')}</th>
                      <th className={cn("pb-3 sm:pb-4 font-display text-gold uppercase tracking-widest text-[10px]", isRTL && "text-right")}>{t('tg.good')}</th>
                      <th className={cn("pb-3 sm:pb-4 font-display text-gold uppercase tracking-widest text-[10px]", isRTL && "text-right")}>{t('tg.developing')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gold/10">
                    {assessmentProfile.rubricRows.map((row, i) => (
                      <tr key={i}>
                        <td className="py-3 sm:py-6 font-bold text-parchment text-[13px] sm:text-base md:text-[17px]">{row.criterion}</td>
                        <td className="py-3 sm:py-6 pr-2 sm:pr-4">{row.excellent}</td>
                        <td className="py-3 sm:py-6 pr-2 sm:pr-4">{row.good}</td>
                        <td className="py-3 sm:py-6">{row.developing}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case 'cefr': {
        const profile = metadata?.cefrProfile;
        if (!profile) return null;
        return (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500" data-tg-cefr>
            <h3 className="font-display text-xl sm:text-3xl text-parchment border-b border-gold/20 pb-3 sm:pb-4">{t('tg.cefr')}</h3>
            <p className="font-serif text-white text-[13px] sm:text-[17px] leading-relaxed">{profile.intro}</p>
            <div className="space-y-4">
              {profile.rows.map(row => (
                <div key={row.scale} className="bg-white/5 p-4 sm:p-6 rounded-2xl border border-gold/10">
                  <p className="font-display text-gold text-[12px] sm:text-[14px] uppercase tracking-widest">{row.scale}</p>
                  <p className="mt-2 font-serif italic text-parchment text-[13px] sm:text-[16px] leading-relaxed">{row.descriptor}</p>
                  <p className="mt-3 font-display text-white/80 text-[12px] sm:text-[14px]">{t('tg.cefrChapters')}: {row.chapters}</p>
                  <ul className="mt-2 space-y-1.5 font-serif text-white text-[13px] sm:text-[15px] leading-relaxed">
                    {row.practice.map(line => <li key={line}>• {line}</li>)}
                  </ul>
                </div>
              ))}
            </div>
            <div className="bg-gold/5 border border-gold/20 p-4 sm:p-6 rounded-2xl">
              <h4 className="font-display text-lg sm:text-2xl text-gold">{profile.test.title}</h4>
              <p className="mt-2 font-serif text-white text-[13px] sm:text-[16px] leading-relaxed">{profile.test.when}</p>
              <ul className="mt-3 space-y-1.5 font-serif text-white text-[13px] sm:text-[15px] leading-relaxed">
                {profile.test.parts.map(part => <li key={part}>• {part}</li>)}
              </ul>
              <button
                type="button"
                onClick={() => setExamLevel(profile.test.level)}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-gold px-5 text-sm font-semibold text-wood hover:bg-gold/90"
                data-tg-open-exam
              >
                <ClipboardCheck size={16} /> {t('tg.openTest')}
              </button>
            </div>
          </div>
        );
      }
      case 'kinesthetic':
        return (
          <div className="space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="font-display text-xl sm:text-3xl text-parchment border-b border-gold/20 pb-3 sm:pb-4">{t('tg.kinesthetic')}</h3>
            <p className="font-serif text-sm sm:text-lg text-parchment/60 leading-relaxed">{t('tg.kinestheticDesc')}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
              {[
                { 
                  title: t('tg.totalPhysicalResponse'), 
                  desc: t('tg.totalPhysicalResponseDesc'),
                  icon: <Users className="text-gold w-5 h-5 sm:w-6 sm:h-6" />
                },
                { 
                  title: t('tg.storyActing'), 
                  desc: t('tg.storyActingDesc'),
                  icon: <Move className="text-gold w-5 h-5 sm:w-6 sm:h-6" />
                },
                { 
                  title: t('tg.interactiveHotspots'), 
                  desc: t('tg.interactiveHotspotsDesc'),
                  icon: <Layout className="text-gold w-5 h-5 sm:w-6 sm:h-6" />
                },
                { 
                  title: t('tg.classroomGames'), 
                  desc: t('tg.classroomGamesDesc'),
                  icon: <Users className="text-gold w-5 h-5 sm:w-6 sm:h-6" />
                },
                { 
                  title: t('tg.storyWalkTimeline'), 
                  desc: t('tg.storyWalkTimelineDesc'),
                  icon: <Move className="text-gold w-5 h-5 sm:w-6 sm:h-6" />
                }
              ].map((item, i) => (
                <div key={i} className="bg-white/5 border border-gold/10 p-4 sm:p-8 rounded-2xl flex flex-col sm:flex-row gap-3 sm:gap-6 hover:bg-gold/5 transition-colors">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gold/10 flex items-center justify-center shrink-0">{item.icon}</div>
                  <div>
                    <h4 className="font-display text-base sm:text-xl text-gold mb-1.5 sm:mb-2">{item.title}</h4>
                    <p className="font-serif text-white text-[13px] sm:text-base md:text-[17px] leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'global': {
        const globalData = metadata?.globalCitizenship;
        const isAr = language === 'ar';
        
        const fallbackThemes = isAbraham ? (
          isAr ? [
            { title: 'التفكر والبحث عن الحقيقة:', description: 'السعي وراء الحقيقة واليقين بالمنطق والتفكر السليم لا بالتقليد الأعمى.' },
            { title: 'الشجاعة والصدق:', description: 'الوقوف بجانب الحق بشجاعة وصدق والتعبير عنه بلطف وأدب أمام الآخرين.' },
            { title: 'الصبر والتوكل:', description: 'استلهام معاني الأمل واليقين بالله من قصة السيدة هاجر وسعيها في الوادي القاحل.' }
          ] : [
            { title: 'Seeking Truth with Reason:', description: 'Understanding independent thinking and logical checking rather than blind imitation.' },
            { title: 'Standing for Faith:', description: 'Being brave when speaking the truth respectfully, even when facing opposition.' },
            { title: 'Patience and Hope:', description: 'Drawing lessons of hope and resilience from Hagar and Ishmael’s patience in the valley.' }
          ]
        ) : isMoses ? (
          isAr ? [
            { title: 'الوقوف في وجه الظلم:', description: 'نصرة المستضعفين والدفاع عن الحق والعدل في مواجهة قوى البغي والطغيان.' },
            { title: 'القيادة الحكيمة والمسؤولية:', description: 'قيادة الآخرين برفق وصبر وتوجيههم وتفقد أحوالهم بحكمة ورحمة.' },
            { title: 'الكرامة والعدالة الإنسانية:', description: 'لكل إنسان حق أصيل في الكرامة والمعاملة الحسنة والعدالة دون تمييز.' }
          ] : [
            { title: 'Advocating for the Oppressed:', description: 'Standing up for the weak and defending human rights against tyrannical power.' },
            { title: 'Leadership with Responsibility:', description: 'Guiding others with wisdom, patience, and a deep commitment to their welfare.' },
            { title: 'Equality and Dignity:', description: 'Every human being has inherent dignity and must be treated with respect, regardless of status.' }
          ]
        ) : isMecca ? (
          isAr ? [
            { title: 'الأخوة الإنسانية والمساواة:', description: 'التأكيد على وحدة الأصل البشري ونبذ التفاخر بالأنساب والعصبية القبلية أو التفرقة العنصرية.' },
            { title: 'العدالة الاجتماعية والاقتصادية:', description: 'إقامة أسس متينة للتكافل الاجتماعي، ومحاربة الاحتكار، ونصرة الأرامل واليتامى والمستضعفين.' },
            { title: 'صون الكرامة الإنسانية:', description: 'حماية حقوق وحريات جميع أفراد المجتمع، وبالأخص الفئات التي كانت مهمشة تاريخياً.' }
          ] : [
            { title: 'Universal Human Brotherhood:', description: 'Emphasizing shared human ancestry (from Adam and Eve) and transcending tribal pride, origin, or racism.' },
            { title: 'Social Justice and Fair Trade:', description: 'Constructing robust social security nets, banning usurious or corrupt economic exploitation, and giving key priority to helping widows, orphans, and travellers.' },
            { title: 'Dignity of All Persons:', description: 'Protecting and valuing the absolute fundamental rights of all citizens, especially those historically marginalized.' }
          ]
        ) : isYunus ? (
          isAr ? [
            { title: 'الرحمة الشاملة والمحبة:', description: 'النظر لجميع المخلوقات بعين اللطف والمحبة، فكل كائن حي مرآة تعكس بديع صنع الخالق سبحانه.' },
            { title: 'الصدق الباطن والنزاهة:', description: 'الاستقامة المطلقة في النوايا الباطنة والظاهرة، فالحق سبحانه لا يقبل اعوجاجاً في طريق الصدق.' },
            { title: 'التماسك الاجتماعي والفنون:', description: 'استخدام الكلمة الطيبة والشعر البسيط العذب لتقريب القلوب وبث السلام في أوقات الفتن.' }
          ] : [
            { title: 'Universal Compassion:', description: 'Viewing all of creation with active love and kindness because every creature is a temporal mirror reflecting the names of the Creator.' },
            { title: 'Honesty and Integrity (Straight Wood):', description: 'Cultivating absolute honesty inside one\'s thoughts and outer deeds, symbolizing that nothing crooked remains in the circle of truth.' },
            { title: 'Cultural Cohesion & Fine Arts:', description: 'Employing simple, beautiful language and pure poetry as emotional healing and a force of unity in times of social unrest.' }
          ]
        ) : isAdam ? (
          isAr ? [
            { title: 'الأصل البشري الواحد والمساواة:', description: 'بما أن البشر جميعاً يشتركون في أصل واحد، فإن الجميع يستحقون الاحترام والكرامة بالتساوي.' },
            { title: 'الأمانة ورعاية الأرض:', description: 'استخلاف الإنسان في الأرض يحمل مسؤولية عالمية لحماية الطبيعة والبيئة وكل كائن حي.' },
            { title: 'الحوار وحل النزاعات سلماً:', description: 'يبرز موقف هابيل السلمي قيمة اختيار الحوار والبعد عن الحسد والعنف كوسيلة لحل الخلافات.' }
          ] : [
            { title: 'Universal Origin & Equality:', description: 'Since all humans share a single origin, all people deserve equal respect, value, and dignity.' },
            { title: 'Responsible Stewardship:', description: 'Humans are appointed as caretakers of the earth, carrying a global duty to protect nature, wildlife, and resources.' },
            { title: 'Dialogue and Conflict Resolution:', description: 'Habil’s peaceful stance highlights the value of choosing dialogue and non-violence over jealousy and aggression.' }
          ]
        ) : (
          isAr ? [
            { title: 'الأخلاق والفضائل الإنسانية:', description: 'غرس الأخلاق الرفيعة والقيم السامية كركيزة أساسية لبناء مجتمع متعاون ومتراحم.' },
            { title: 'الاحترام المتبادل والتنوع:', description: 'تعزيز الفهم والتقدير المتبادل لكل الأفراد باختلاف خلفياتهم وثقافاتهم.' },
            { title: 'المسؤولية الاجتماعية والبيئية:', description: 'تشجيع المتعلمين على الإسهام الإيجابي في بيئتهم وحل المشكلات بطرق بناءة.' }
          ] : [
            { title: 'Universal Values and Character:', description: 'Focusing on universal moral growth and character building in a diverse world.' },
            { title: 'Empathy and Understanding:', description: 'Encouraging young learners to listen to different perspectives with kindness.' },
            { title: 'Social and Environmental Awareness:', description: 'Guiding pupils to take small, constructive actions inside their class and local community.' }
          ]
        );

        const fallbackActions = isAbraham ? (
          isAr ? [
            'كيف يمكن للتفكير السليم والمنطق أن يساعدنا في اتخاذ القرارات الصحيحة في حياتنا؟',
            'لماذا من المهم أن نكون شجعاناً عندما نعرف الحقيقة ونريد التعبير عنها بلطف؟',
            'كيف يمكننا إظهار الصبر والتوكل عندما نمر بظروف أو أماكن جديدة أو صعبة؟'
          ] : [
            'How can clear thinking help us avoid wrong choices today?',
            'Why is it important to speak the truth with kindness and respect?',
            'How can we show patience in new or challenging places?'
          ]
        ) : isMoses ? (
          isAr ? [
            'كيف نساعد زملاءنا الذين يتعرضون للمضايقات أو المعاملة السيئة في المدرسة أو مجتمعنا؟',
            'ما أهمية وجود قوانين عادلة تحمي الجميع وتحرص على صون كرامة المستضعفين؟',
            'كيف يمكننا التعبير عن آرائنا والدفاع عن الحق بطرق سلمية وحضارية؟'
          ] : [
            'How can we help people who are treated unfairly or bullied in our school or community?',
            'Why is it important to have rules that protect everyone, especially those who are weak?',
            'How can we speak up for what is right in a peaceful and respectful way?'
          ]
        ) : isMecca ? (
          isAr ? [
            'ناقش الأثر الاجتماعي والأخلاقي للربا والاحتكار واتساع الفجوة المادية بين الأغنياء والفقراء.',
            'حلل كيف أرست خطبة الوداع أسساً خالدة لحقوق الإنسان، والمساواة الكاملة، وحماية الأرواح والأموال.',
            'استكشف كيف تبني المجتمعات أواصر التضامن والتعاون لمواجهة التحديات والأزمات الكبرى.'
          ] : [
            'Discuss the social and ethical dangers of usury, monopolies, and extreme wealth gaps.',
            'Analyze how the Farewell Sermon lays down the foundation of modern human rights, equality, and protection.',
            'Explore how societies can build strong community solidarity during times of transition or difficulty.'
          ]
        ) : isYunus ? (
          isAr ? [
            'كيف يمكن للكلمة الصادقة أو الفن الهادف تقريب وجهات النظر ونشر قيم السلام في المدرسة والمجتمع؟',
            'ما المعنى الأخلاقي للعمل الجاد والنزاهة في مهامنا اليومية الصغيرة وكيف يبني ذلك شخصيتنا؟',
            'تأمل في التزامنا الإيجابي بمعاملة الزملاء بتقدير متساوٍ وتجنب ما يجرح خواطرهم أو يؤذي مشاعرهم.'
          ] : [
            'Discuss how simple, heartfelt literature or art can help resolve conflicts and unite diverse groups in high school or society.',
            'Explore the moral meaning of "crooked vs. straight wood," and discuss why honesty in small, daily tasks builds strong character.',
            'Reflect on the ethical responsibility of treating neighbors and classmates with equal respect to avoid causing any emotional harm.'
          ]
        ) : isAdam ? (
          isAr ? [
            'كيف يمكننا ترجمة شعورنا بأننا جميعاً عائلة إنسانية واحدة إلى سلوكيات لطف وتعاون مع زملائنا؟',
            'ما هي الممارسات اليومية التي يمكننا القيام بها للمحافظة على بيئتنا المدرسية والمنزلية؟',
            'كيف يساهم ضبط النفس والتغلب على الحسد في حمايتنا من ارتكاب الأخطاء وإيذاء الآخرين؟'
          ] : [
            'How can we show that we respect all classmates as part of one human family?',
            'What are some practical ways we can care for our environment and nature at school?',
            'Discuss how understanding the consequences of jealousy can help us solve arguments peacefully.'
          ]
        ) : (
          isAr ? [
            'كيف تساهم أخلاقنا وتصرفاتنا اليومية في نشر المودة والسلام داخل بيئتنا الصفية والمدرسية؟',
            'كيف يمكننا إبراز الاحترام والتقدير لكل زملائنا باختلاف صفاتهم ومهاراتهم الفردية؟',
            'ما هي المسؤوليات البسيطة التي يمكننا القيام بها يومياً لنكون مواطنين صالحين في مجتمعنا؟'
          ] : [
            'How do our daily choices and manners contribute to a peaceful and warm classroom environment?',
            'In what ways can we show active respect and appreciation for every classmate\'s unique talents?',
            'What simple responsibilities can we take on today to show care for our shared school environment?'
          ]
        );

        return (
          <div className="space-y-6 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="font-display text-xl sm:text-3xl text-parchment border-b border-gold/20 pb-3 sm:pb-4">
              {globalData?.title || (isAr ? 'المواطنة العالمية والجسور الثقافية' : t('tg.globalCitizenship'))}
            </h3>
            <p className="font-serif text-sm sm:text-lg text-white leading-relaxed italic">
              {globalData?.description || (
                isAr ? (
                  isAbraham ? 'تُركِّز سيرة نبي الله إبراهيم عليه السلام على البحث عن الحقيقة، واستخدام العقل، والثبات على الحق برفق وحكمة.' :
                  isMoses ? 'تُركِّز قصة نبي الله موسى عليه السلام على مواجهة الظلم، وحماية حقوق الإنسان، وترسيخ معاني العدالة والتراحم.' :
                  isMecca ? 'تُركِّز دراسة مكة وظهور الإسلام على إرساء قيم العدالة الاجتماعية، والنزاهة الاقتصادية، والأخوة البشرية الشاملة.' :
                  isYunus ? 'تُركِّز مسيرة الشاعر يونس إمره على المحبة الشاملة، والنزاهة الباطنة، وخدمة الإنسانية بالكلمة الطيبة والجمال.' :
                  isAdam ? 'تُركِّز قصة آدم عليه السلام على الأصل الإنساني المشترك، ورعاية الأمانة وعمارة الأرض، والاعتراف بالخطأ بتواضع ويقين.' :
                  'التركيز على بناء القيم الإنسانية المشتركة، والمسؤولية الأخلاقية، والعيش المشترك في ضوء العبر والدروس.'
                ) : (
                  isAbraham ? 'The story of Prophet Abraham (pbuh) focuses on seeking truth, using reason, and standing with gentle strength.' :
                  isMoses ? 'The story of Prophet Moses (pbuh) focuses on standing against oppression, advocating for human dignity, and promoting justice.' :
                  isMecca ? 'The study of Mecca and the rise of Islam focuses on social justice, fair economics, and universal human brotherhood.' :
                  isYunus ? 'The life and legacy of Yunus Emre focus on universal compassion, inner integrity, ethics of love, and social solidarity through art.' :
                  isAdam ? 'The story of Prophet Adam (pbuh) focuses on our shared human origin, responsible stewardship of the earth, and the beauty of humility after a mistake.' :
                  t('tg.coreGlobalValues')
                )
              )}
            </p>
            
            <div className="space-y-6 sm:space-y-8">
              <div className="bg-gold/5 border border-gold/10 p-4 sm:p-8 rounded-2xl">
                <h4 className="font-display text-lg sm:text-2xl text-gold mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3">
                  <Globe size={20} className="sm:w-6 sm:h-6 shrink-0" /> {t('tg.keyThemes')}
                </h4>
                <div className="space-y-3 font-serif text-[13px] sm:text-lg text-white leading-relaxed">
                  <ul className="space-y-2 sm:space-y-3 pl-4 sm:pl-6 border-l-2 border-gold/20">
                    {(globalData ? globalData.themes : fallbackThemes).map((theme, i) => (
                      <li key={i}>• <strong>{theme.title}</strong> {theme.description}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="bg-white/5 p-4 sm:p-8 rounded-2xl border border-gold/10">
                <h4 className="font-display text-base sm:text-xl text-gold mb-3 sm:mb-4">{t('tg.actionPoints')}</h4>
                <ul className="space-y-2 sm:space-y-3 font-serif text-white text-[13px] sm:text-base md:text-[17px] leading-relaxed">
                  {(globalData?.actions || fallbackActions).map((action, i) => (
                    <li key={i}>• {action}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      }
      case 'values': {
        const valuesData = metadata?.valuesEducation;
        const isAr = language === 'ar';
        
        const fallbackItems = isAbraham ? (
          isAr ? [
            { label: 'الشجاعة والصدق', value: 'الوقوف بجانب الحق والصدق حتى في أشد الظروف صعوبة.' },
            { label: 'التوكل واليقين', value: 'الاعتماد الكامل واليقين بالله سبحانه وتعالى في الابتلاءات والشدائد (معجزة النار).' },
            { label: 'الصبر والتحمل', value: 'صبر السيدة هاجر عليها السلام وسعيها في الوادي القاحل بكل عزم وأمل ويقين.' },
            { label: 'الإخلاص والتوحيد', value: 'عبادة الخالق الواحد البارئ والتفكر في بديع صنعه في الكون الفسيح.' },
            { label: 'الامتنان والرضا', value: 'تقدير نعم الله سبحانه وتعالى الكثيرة والامتنان لها كمعجزة بئر زمزم المبارك.' }
          ] : [
            { label: 'Courage', value: 'Standing for truth even when facing great difficulties.' },
            { label: 'Trust (Tawakkul)', value: 'Relying on Allah during trials, like the fire miracle.' },
            { label: 'Patience', value: 'Hagar’s patience and strength in the valley.' },
            { label: 'Sincerity', value: 'Worshipping only the Creator with clear and honest pure hearts.' },
            { label: 'Gratitude', value: 'Recognizing blessings like Zamzam water.' }
          ]
        ) : isMoses ? (
          isAr ? [
            { label: 'الشجاعة والصدق', value: 'الجهر بالحق والثبات على المبدأ أمام القوى العاتية والمخاوف العظيمة.' },
            { label: 'التوكل واليقين', value: 'الثقة المطلقة في نصر الله ورعايته وحمايته في أحلك المواقف (سلة النيل، انفلاق البحر).' },
            { label: 'العدل والإنصاف', value: 'معاملة جميع الناس بإنصاف وتطبيق القوانين لحماية الضعفاء والانتصار للمظلوم.' },
            { label: 'التوبة والإصلاح', value: 'الاعتراف بالخطأ فوراً، وطلب المغفرة بصدق، والتعلم الواعي من التجارب السابقة.' },
            { label: 'إغاثة الملهوف', value: 'تقديم العون والمساعدة للضعفاء والمحتاجين بكل رفق ولطف (مساعدة الفتاتين في مدين).' }
          ] : [
            { label: 'Courage', value: 'Speaking the truth and standing firm even when facing great power or fear.' },
            { label: 'Trust (Tawakkul)', value: 'Believing in Allah’s protection and guidance during difficult situations (the Nile basket, the splitting of the sea).' },
            { label: 'Justice', value: 'Treating all people fairly and opposing oppression or abuse.' },
            { label: 'Repentance', value: 'Admitting mistakes quickly, asking for forgiveness, and learning from experience.' },
            { label: 'Helping Others', value: 'Showing kindness and offering help to those in need (helping the two sisters in Midian).' }
          ]
        ) : isMecca ? (
          isAr ? [
            { label: 'التوحيد والحرية', value: 'عبادة الله وحده كمنطلق أساسي لتحرير روح الإنسان من التبعية وتحقيق المساواة الشاملة.' },
            { label: 'الأمانة والصدق', value: 'التزام الصدق المطلق في الحديث والأمانة الكاملة في المعاملات والتجارة العادلة.' },
            { label: 'التكافل والعدالة', value: 'بذل المال ومساعدة الفقراء، الأيتام، والأرامل للقضاء على الجشع والاحتكار والأنشطة الظالمة.' },
            { label: 'الصبر والثبات', value: 'تحمل الصعوبات والشدائد والأذى بسلام وصبر جميل دون الانجرار إلى دروب العنف.' },
            { label: 'المساواة والتقوى', value: 'رؤية البشر كأسنان المشط وتفاضلهم فقط بالتقوى والأخلاق والعمل الصالح المعمر.' }
          ] : [
            { label: 'Tawhid (Absolute Oneness)', value: 'Serving only the single Creator, which establishes absolute human liberty and class equality.' },
            { label: 'Trustworthiness (Al-Amin)', value: 'Building solid integrity and truthfulness in daily speech, actions, and fair commercial trade.' },
            { label: 'Social Justice & Charity', value: 'Sharing resources with the poor, widows, orphans, and travellers to eradicate hoarding and greed.' },
            { label: 'Resilience (Sabr)', value: 'Patiently and non-violently enduring boycotted isolation, verbal abuse, and physical hardships.' },
            { label: 'Unity & Equality', value: 'Recognizing individuals strictly by their moral character (taqwa) rather than status, race, or tribal wealth.' }
          ]
        ) : isYunus ? (
          isAr ? [
            { label: 'العشق الإلهي', value: 'توجيه كافة السلوكيات والمعاملات بنور محبة الله عز وجل والرحمة الشاملة بكل خلقه.' },
            { label: 'الإخلاص والنزاهة', value: 'تطابق النية مع الفعل للوصول إلى مرتبة الصدق التام الخالي من شائبة النفاق.' },
            { label: 'التواضع والخدمة', value: 'بذل الجهد لخدمة الآخرين وتأديب النفس وكسر الكبر والأنانية بالالتزام الذاتي المستمر.' },
            { label: 'حفظ القلوب', value: 'الحرص الواعي على تجنب الغيبة والغضب وكل قول أو فعل قد يجرح قلوب ومشاعر الآخرين.' },
            { label: 'الصبر الجميل', value: 'استقبال تقلبات الحياة والشدائد بالرضا والتوكل والامتنان والفرح الروحي الدائم.' }
          ] : [
            { label: 'Divine Love (Aşk)', value: 'Guiding all relations and moral actions through the light of loving Allah and His entire creation.' },
            { label: 'Perfect Sincerity (Straight Wood)', value: 'Matching inner intentions completely with outer behavior to achieve unblemished honesty.' },
            { label: 'Absolute Humility', value: 'Active service to others and subduing the arrogant ego (nafs) through continuous self-discipline.' },
            { label: 'Guarding the Heart', value: 'Striving deeply to avoid backbiting, anger, or gossip that might break or hurt any human heart.' },
            { label: 'Beautiful Patience', value: 'Accepting temporary worldly trials and poverty with content joy, peace, and deep gratitude.' }
          ]
        ) : isAdam ? (
          isAr ? [
            { label: 'التواضع والرفعة', value: 'تجنب الكبر والاستعلاء، مدركين أن التواضع هو جوهر الرفعة والكرامة البشرية.' },
            { label: 'التوبة والرجوع للحق', value: 'تحمل مسؤولية الخطأ والمبادرة بالاعتراف به والإصلاح الفوري بكل صدق ويقين.' },
            { label: 'الإخلاص والصدق', value: 'تقديم أفضل ما لدينا طاعة لله سبحانه وبإخلاص تام دون تطلع لرياء أو سمعة.' },
            { label: 'ضبط النفس والسكينة', value: 'التغلب على مشاعر الغضب والحسد والتحكم بالذات لحماية أنفسنا ومجتمعنا من الأذى.' }
          ] : [
            { label: 'Humility', value: 'Subduing the ego and rejecting arrogance, as shown by the contrast between Adam\'s obedience and Iblis\'s pride.' },
            { label: 'Repentance & Responsibility', value: 'Taking active responsibility for mistakes, asking for forgiveness, and making sincere amends.' },
            { label: 'Sincerity & Pure Effort', value: 'Offering our best work with sincere hearts, without seeking worldly show or competitive pride.' },
            { label: 'Self-Control', value: 'Overcoming negative impulses like anger and jealousy, focusing on peace and contentment.' }
          ]
        ) : (
          isAr ? [
            { label: 'الرحمة والتراحم', value: 'نشر المودة والتعامل بقلب رحيم ورفيق مع جميع الزملاء والكائنات.' },
            { label: 'الأمانة والصدق', value: 'الالتزام الكامل بالحق والصدق في الحديث وحفظ الأمانات والعهود.' },
            { label: 'الصبر والجد', value: 'بذل الجهد المتواصل لمواجهة التحديات الدراسية واليومية بروح إيجابية متفائلة.' },
            { label: 'العدالة والاحترام', value: 'معاملة الجميع بتقدير متساوٍ ومحاربة الانحيازات والاعتزاز بالفضيلة.' }
          ] : [
            { label: 'Compassion & Mercy', value: 'Spreading warmth and treating all peers and living creatures with a kind, caring heart.' },
            { label: 'Integrity & Sincerity', value: 'Committing fully to truthfulness in speech, actions, and keeping promises.' },
            { label: 'Patience & Diligence', value: 'Putting in active, consistent effort to face learning and life challenges with optimistic resilience.' },
            { label: 'Respect & Dignity', value: 'Treating all individuals with equal high regard, celebrating virtues and moral characters.' }
          ]
        );

        const fallbackQuestions = isAbraham ? (
          isAr ? [
            'كيف يساعدنا التفكير السليم والمنطق في اتخاذ القرارات الصحيحة في حياتنا اليومية؟',
            'لماذا من المهم أن نكون شجعاناً عندما نعرف الحق ونعبر عنه بلطف وأدب؟',
            'كيف يمكننا إظهار الصبر والتوكل عندما نمر بظروف أو أماكن جديدة أو صعبة؟'
          ] : [
            'How does thinking for yourself help us make good choices?',
            'How can we show patience in difficult circumstances?',
            'Why is standing for what is right a form of courage?'
          ]
        ) : isMoses ? (
          isAr ? [
            'كيف يمنحنا التوكل على الله سبحانه القوة واليقين لمواجهة الأوقات الصعبة؟',
            'ما هي الطريقة الفعالة والنبيلة لنصرة الضعفاء ومساعدة من يتعرض لمعاملة غير عادلة؟',
            'لماذا يعد الاعتراف بالخطأ والاستغفار علامة على القوة الأخلاقية الحقيقية؟'
          ] : [
            'How does trusting Allah help us find courage in hard times?',
            'What is the best way to help someone who is treated unfairly?',
            'Why is it important to admit when we are wrong and repent?'
          ]
        ) : isMecca ? (
          isAr ? [
            'كيف يهدم الإيمان بالخالق الواحد فكرة التفاضل المبني على العرق أو النسب أو الجاه المادي؟',
            'لماذا تعتبر الأمانة والتجارة الصادقة عبادة روحية عظيمة وليست مجرد نشاط مالي دنيوي؟',
            'ما هي العبر الأخلاقية التي نتعلمها من ثبات وصبر المسلمين الأوائل أثناء حصار المقاطعة؟'
          ] : [
            'How does belief in a single Creator challenge the idea of racial or tribal superiority?',
            'Why is honest trade more than just an economic activity – how is it a spiritual duty?',
            'What lessons of patience can we draw from the early Muslims who endured years of boycotted isolation?'
          ]
        ) : isYunus ? (
          isAr ? [
            'لماذا يعلمنا يونس إمره أن جرح قلب إنسان آخر يذهب ببركة عباداتنا ويجعل أعمالنا بلا معنى؟',
            'كيف يمكن للمرء أن يطابق نواياه الباطنة وتصرفاته الظاهرة ليصل إلى الصدق التام؟',
            'كيف ندرب أنفسنا على التغلب على الغضب والكبر عند مواجهة الإساءة أو الخلاف؟'
          ] : [
            'Why does Yunus Emre teach that hurting another person\'s heart renders our worship meaningless?',
            'How can a person match their inner thoughts with their outer actions to achieve true honesty?',
            'How can we train ourselves to overcome anger and arrogance when someone insults or opposes us?'
          ]
        ) : isAdam ? (
          isAr ? [
            'كيف تمنحنا قصة توبة آدم عليه السلام الأمل في أن الأخطاء هي فرص للتعلم والارتقاء والرجوع للحق؟',
            'كيف تظهر قصة قابيل وهابيل أن الحسد غير المضبوط يقود الإنسان إلى عواقب وخيمة ومؤلمة؟',
            'ما هي الخصال الأخلاقية التي تجعل الإنسان مكرماً ومحترماً حقيقياً في مجتمعه؟'
          ] : [
            'How does Adam\'s story of repentance teach us that mistakes are opportunities for learning, growth, and returning to truth?',
            'How does the story of Habil and Qabil demonstrate that uncontrolled jealousy leads to painful consequences?',
            'What are the core moral virtues that make a person truly honored and respected in their community?'
          ]
        ) : (
          isAr ? [
            'كيف يعيننا الصدق والأمانة على بناء علاقات ثقة متينة ودائمة مع الآخرين؟',
            'لماذا تعد القدرة على ضبط النفس والتحكم بالغضب عند الخلاف قوة وشجاعة حقيقية؟',
            'كيف يمكننا إظهار الرحمة واللطف الفعلي في تعاملاتنا مع من هم أصغر منا أو أضعف؟'
          ] : [
            'How do honesty and integrity help us build solid, lasting bonds of trust with others?',
            'Why is the capacity to manage our temper during an argument a sign of true moral strength?',
            'In what practical ways can we demonstrate actual compassion to those who are younger or weaker?'
          ]
        );

        return (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="font-display text-xl sm:text-3xl text-parchment">
              {valuesData?.title || (isAr ? 'التربية الأخلاقية وبناء الشخصية' : t('tg.valuesCharacter'))}
            </h3>
            <p className="font-serif text-sm sm:text-lg text-white italic mb-6 sm:mb-8">
              {valuesData?.description || (
                isAr ? (
                  isAbraham ? 'التركيز على قيم الصدق المطلق، الشجاعة الأدبية في نصرة الحق، واليقين والتوكل الجميل.' :
                  isMoses ? 'التركيز على بناء الشخصية الأخلاقية المتكاملة، الشجاعة، والاعتماد المطلق على الرعاية الإلهية.' :
                  isMecca ? 'التركيز على تطهير القلوب من العصبية، والالتزام بالأمانة والصدق، ونصرة المستضعفين واليتامى.' :
                  isYunus ? 'التركيز على تهذيب النفس وتزكيتها، وممارسة التواضع والخدمة، ونشر المحبة والسلام الداخلي.' :
                  isAdam ? 'التركيز على التواضع والتحرر من الكبر، والاعتراف بالخطأ والمبادرة بالتوبة، وإخلاص العمل والجهد.' :
                  'التركيز على ترسيخ القيم الأخلاقية النبيلة وبناء الشخصية القوية المتوازنة والفاعلة في الخير.'
                ) : (
                  isAbraham ? 'Focus on seeking truth, courage under trial, and ultimate patience.' :
                  isMoses ? 'Focus on building strong moral character, courage, and reliance on divine guidance.' :
                  isMecca ? 'Focus on purifying tribal loyalty, cultivating absolute honesty, and supporting the oppressed.' :
                  isYunus ? 'Focus on cultivating a pure heart, practicing extreme humility, and expressing divine love toward all creation.' :
                  isAdam ? 'Focus on purifying the heart from pride, taking responsibility for mistakes, and practicing pure sincerity and self-control.' :
                  t('tg.keyValues')
                )
              )}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
              <div className="bg-gold/5 p-4 sm:p-6 rounded-xl border border-gold/10">
                <h4 className="font-display text-gold text-sm sm:text-base mb-2 sm:mb-3">{t('tg.keyThemes')}</h4>
                <ul className="space-y-2 font-serif text-white text-[13px] sm:text-base md:text-[17px] leading-relaxed">
                  {(valuesData ? valuesData.items : fallbackItems).map((item, i) => (
                    <li key={i}>• <strong>{item.label}:</strong> {item.value}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-white/5 p-4 sm:p-6 rounded-xl border border-gold/10">
                <h4 className="font-display text-gold text-sm sm:text-base mb-2 sm:mb-3">{t('tg.actionPoints')}</h4>
                <ul className="space-y-2 font-serif text-white text-[13px] sm:text-[15px] leading-relaxed">
                  {(valuesData?.questions || fallbackQuestions).map((q, i) => (
                    <li key={i}>• {q}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      }
      case 'sensitive': {
        const sensitiveData = metadata?.sensitiveNotes;
        const isAr = language === 'ar';
        
        const fallbackNotes = isAbraham ? (
          isAr ? [
            'التعامل مع مشهد النار بوصفه معجزة إلهية للحماية والسلام؛ والتركيز البالغ على قيمة التوكل والأمان.',
            'شرح مفهوم «الأصنام» بتبسيط يناسب عقول الطلاب كرموز وتماثيل حجرية كان الناس يعبدونها خطأً بدلاً من الخالق سبحانه.',
            'عرض قصة هجرة السيدة هاجر وابنها إسماعيل عليه السلام بتقدير بالغ وعناية لإبراز فضيلة الصبر والأمل وعظيم السعي.',
            'التركيز الشديد على المنجزات والرموز الإيجابية كبناء الكعبة المشرفة وتفجر بئر زمزم المبارك كرموز للنماء والسلام والوحدة.',
            'توجيه بوصلة النقاش نحو البناء الداخلي والنقاء الأخلاقي والصفات الإيجابية الكريمة للأنبياء عليهم السلام.'
          ] : [
            'Handle the fire scene as a miracle of protection; focus on the lesson of trust.',
            'Explain "idols" simply as physical things people mistakenly worshipped instead of the Creator.',
            'Present Hagar and Ishmael’s story with deep respect for their patience, hope, and resilience.',
            'Focus on key historical milestones like the building of the Ka’ba and the miracle of Zamzam.',
            'Keep structural focus on internal strength and character development of the prophets.'
          ]
        ) : isMoses ? (
          isAr ? [
            'تناول مواقف وقرارات فرعون وعناده بموضوعية وهدوء؛ والتركيز على العبرة التربوية الخالدة بأن القوة لا قيمة لها بلا عدل.',
            'توضيح حادثة السوق التي وقعت خطأً من موسى عليه السلام بوصفها حدثاً بشرياً غير مقصود قاده للاستغفار الصادق والنمو الروحي والارتقاء.',
            'عرض محنة وتفريق عائلات بني إسرائيل وصعوبة الظروف بلمسة تربوية حذرة تراعي التوازن النفسي والوجداني للطلاب.',
            'إبراز معجزات الله الكبرى (العصا، اليد البيضاء، انفلاق البحر) كعلامات مضيئة على قدرة الله سبحانه ورعايته للمظلومين والضعفاء.',
            'توجيه النقاش والتحليل حول عاقبة فرعون كقانون طبيعي عادل للجزاء نتيجة الكبر العظيم والظلم البين والإعراض عن الحق.'
          ] : [
            'Handle the actions and decisions of Pharaoh calmly; focus on the pedagogical lesson that power must always be aligned with justice.',
            'Explain Moses’s accidental mistake in the bazaar as a human event that led to sincere repentance and growth.',
            'Present the separation of families and the hardship of the Children of Israel with sensitivity to students’ emotional levels.',
            'Focus on the miracles (the staff, the hand, and the splitting of the sea) as signs of Allah’s ultimate power and protection.',
            'Keep discussions of Pharaoh’s fate focused on the natural consequences of pride, injustice, and refusal to change.'
          ]
        ) : isMecca ? (
          isAr ? [
            'التعامل مع العادات والتقاليد الجاهلية بموضوعية ودقة تاريخية، مبرزين التحول الأخلاقي والإنساني الشامل والعميق الذي أحدثه الإسلام.',
            'عرض فترات الحصار الاقتصادي والاجتماعي والأذى الذي تعرض له المسلمون الأوائل بهدوء، مركزين على قيم الصبر والثبات والتعامل السلمي والرحمة.',
            'تبيان المعاملات المالية كالربا والاحتكار بأسلوب تاريخي ميسر ومقارنتها بقيم التكافل والعدالة الاقتصادية والاجتماعية في الإسلام.',
            'شرح مفهوم التوحيد وإفراد العبودية لله بوصفه قوة تحريرية واجتماعية وإنسانية عظيمة تعيد الاعتبار والكرامة التامة لجميع المستضعفين.',
            'التأكيد التام عند دراسة خطبة الوداع الخالدة على مبدأ الأخوة الإنسانية الشاملة التي تتجاوز وتنسف كل الفروق العرقية والطبقية والقبلية.'
          ] : [
            'Handle pre-Islamic tribal practices and idolatry with objective historical accuracy, highlighting the moral transformation brought by Islam.',
            'Discuss historical boycotted hardships and early martyrdoms calmly, focusing on the concepts of resilience, patience, and non-violence.',
            'Present the economic systems like usury (riba) in their clear historical context while gently highlighting the modern socio-economic ethics.',
            'Explain the concept of monotheism (tawhid) respectfully as a historic source of human dignity, social liberation, and class equality.',
            'Ensure the study of the Farewell Sermon highlights the universal brotherhood of humanity, transcending race, tribe, and social origin.'
          ]
        ) : isYunus ? (
          isAr ? [
            'شرح مصطلحات السلوك والتربية الروحية والتصوف بتبسيط بالغ يناسب الفئة العمرية للطلاب كمدارس ومحاضن أخلاقية تاريخية تهذب السلوك البشري.',
            'عرض مجاز «الحطب المستقيم» الذي كان يجمعه يونس بوضوح لبيان أن الاستقامة الداخلية والنزاهة هي المقصد الأسمى والأهم وراء تزكية النفس.',
            'التعامل مع قيم الزهد والاكتفاء والرضا باليسير برفق وحكمة، موضحين أن يونس آثر الغنى الحقيقي للقلب والروح على بهرج الدنيا الزائل.',
            'مناقشة عبارة يونس الخالدة «أحب الخلق من أجل الخالق» كقاعدة سامية وعالمية تعزز التسامح الشامل وحماية البيئة والإحسان لكل كائن حي.',
            'توجيه نقاش مجاهدة الهوى والطباع السيئة بضرب أمثلة عملية من حياة الطلاب اليومية، مبيناً أن التغلب على الصفات الذميمة هو قمة الانضباط والتحكم بالذات.'
          ] : [
            'Explain Sufism (Tasavvuf) as the spiritual dimension of Islamic practice, complementing formal worship and deepening inner moral character.',
            'Teach historical dervish practices, lodges (tekkes), and sheikhs objectively as structured educational, artistic, and social centers in Anatolian history.',
            'Frame the inner struggle against the animal self (nafs) as a proactive, positive endeavor of personal self-discipline and refinement.',
            'Frame reflections on death and temporary life gently, focusing on how mortality teaches humility, gratitude, and social responsibility.',
            'Emphasize the profound Sufi metaphor of the human heart as a mirror of divine presence, so that students understand the severe ethical cost of pride.'
          ]
        ) : isAdam ? (
          isAr ? [
            'تقديم قصة بدء الخلق بنبرة دهشة وتفكر وتأمل رائع، مركزين على قيمة العقل والتعلم ونعمة المعرفة العظيمة الممنوحة للنوع الإنساني.',
            'شرح استكبار إبليس وإعراضه بشكل موضوعي مبسط لبيان أن الغرور والكبر يؤديان للهلاك، بينما التواضع والاعتراف بالخطأ يرفعان صاحبهما لمقامات شريفة.',
            'تناول قصة ابني آدم (هابيل وقابيل) بلطف فائق وبلا ترويع. تجنب تفصيل المشهد الجسدي العنيف وركز بدلاً من ذلك على قبح الحسد وعاقبة الظلم والاعتداء وقيمة السلم والصفح.',
            'تفسير قصة زلل الجنة والندم بوصفها أثراً بشرياً طبيعياً قاده الاستغفار للتكريم والاصطفاء مجدداً، لتعليم أهمية الأمل الدائم والتجدد الأخلاقي.'
          ] : [
            'Present the creation story with deep awe and wonder, focusing on the unique gift of intellect, knowledge, and learning bestowed upon humanity.',
            'Explain the arrogance and refusal of Iblis objectively as a choice of proud vanity, emphasizing that humility is the genuine source of spiritual strength and dignity.',
            'Handle the story of Habil and Qabil with utmost pedagogical care. Completely avoid graphic or frightening physical descriptions of the violence, focusing entirely on the toxic nature of jealousy, the consequences of greed, and the beauty of Habil’s peaceful, non-violent response.',
            'Frame the temptation in Heaven and subsequent regret as normal aspects of the human experience, showing that sincere repentance (Tawbah) restores direct honor, connection, and spiritual elevation.'
          ]
        ) : (
          isAr ? [
            'معالجة جميع الابتلاءات والشدائد والقصص التاريخية بنبرة أمل ويقين وتوجيه تربوي متوازن بعيداً عن تفاصيل الترويع أو الترهيب الجسدي.',
            'تقديم الشخصيات والمواقف الإيجابية والسلبية بشكل موضوعي هادئ يساعد الطالب على استخلاص العبرة والفضيلة والمقارنة السليمة بمفرده.',
            'شرح الرموز والمجازات اللغوية والمصطلحات التاريخية بمفردات ميسرة ومفهومة تلائم المستوى اللغوي والعمري للطلاب دون تعقيد.',
            'الحرص على أن تكون الخاتمة والهدف دائماً هو تقوية البناء الأخلاقي الداخلي والدافع الذاتي للمتعلم نحو فعل الخير والتعامل الحسن.'
          ] : [
            'Handle all trials, hardships, and historical accounts with a tone of ultimate hope, balance, and positive guidance, avoiding scary physical descriptions.',
            'Present positive and negative character traits objectively, enabling young learners to draw comparisons and value lessons naturally.',
            'Explain metaphorical language, symbols, and historical terms in simple, clear language tailored to the pupils\' linguistic capabilities and maturity.',
            'Ensure the closing focus is always directed towards reinforcing the students\' internal moral motivation, inspiring them toward constructive habits.'
          ]
        );

        return (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="font-display text-lg sm:text-2xl text-parchment">
              {sensitiveData?.title || (isAr ? 'التوجيه التربوي الحساس والأساليب المقترحة' : t('tg.sensitiveGuidance'))}
            </h3>
            <div className="space-y-4">
              <div className="bg-amber-950/20 border border-amber-500/20 p-4 sm:p-6 rounded-2xl">
                <h4 className="font-display text-amber-400 text-sm sm:text-base mb-2">{t('tg.keyGuidance')}</h4>
                <ul className="space-y-2 sm:space-y-3 font-serif text-white text-[13px] sm:text-[15px] leading-relaxed">
                  {(sensitiveData?.notes || fallbackNotes).map((note, i) => (
                    <li key={i}>• {note}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      }
      case 'tips':
        return (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="font-display text-xl sm:text-3xl text-parchment">{t('tg.tips')}</h3>
            <div className="space-y-4 sm:space-y-6">
              {[
                { title: t('tg.simpleClassroomEnglish'), desc: t('tg.simpleEnglishDesc') },
                { title: t('tg.supportMeaning'), desc: t('tg.supportMeaningDesc') },
                { title: t('tg.praiseEffort'), desc: t('tg.praiseEffortDesc') },
                { title: t('tg.consistency'), desc: t('tg.consistencyDesc') },
                { title: t('tg.recycle'), desc: t('tg.recycleDesc') },
                { title: t('tg.l1Use'), desc: t('tg.l1UseDesc') },
                { title: t('tg.production'), desc: t('tg.productionDesc') }
              ].map((item, i) => (
                <div key={i} className="flex gap-3 sm:gap-6 items-start bg-white/5 p-4 sm:p-6 rounded-xl border border-gold/10">
                  <MessageSquare className="text-gold shrink-0 mt-0.5 sm:mt-1 w-5 h-5 sm:w-6 sm:h-6" />
                  <div>
                    <h4 className="font-display text-parchment text-base sm:text-xl mb-1 sm:mb-1.5">{item.title}</h4>
                    <p className="font-serif text-[13px] sm:text-lg text-white leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white/5 p-4 sm:p-6 rounded-xl border border-gold/10">
              <h4 className="font-display text-gold text-sm sm:text-base mb-2 sm:mb-3">{t('tg.usefulLanguage')}</h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 font-serif text-white text-[13px] sm:text-[15px]">
                <li>• {t('tg.classroomLang1')}</li>
                <li>• {t('tg.classroomLang2')}</li>
                <li>• {t('tg.classroomLang3')}</li>
                <li>• {t('tg.classroomLang4')}</li>
                <li>• {t('tg.classroomLang5')}</li>
                <li>• {t('tg.classroomLang6')}</li>
              </ul>
            </div>
          </div>
        );
      case 'home':
        return (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="font-display text-xl sm:text-3xl text-parchment">{t('tg.home')}</h3>
            <div className="bg-white/5 border border-gold/10 p-4 sm:p-8 rounded-2xl space-y-6 sm:space-y-8">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
                <Home className="text-gold shrink-0 w-6 h-6 sm:w-7 sm:h-7" />
                <div className="space-y-4 sm:space-y-6">
                  <h4 className="font-display text-lg sm:text-2xl text-parchment">{t('tg.homeConnection')}</h4>
                  <div className="space-y-3 sm:space-y-4">
                    {[
                      t('tg.homeAction1'),
                      t('tg.homeAction2'),
                      t('tg.homeAction3'),
                      t('tg.homeAction4')
                    ].map((item, i) => (
                      <div key={i} className="flex gap-3 sm:gap-4 items-start group">
                        <div className="w-1.5 h-1.5 rounded-full bg-gold mt-2 shrink-0 group-hover:scale-150 transition-transform" />
                        <p className={cn(
                          "font-serif text-[13px] sm:text-lg text-white leading-relaxed",
                          language !== 'ar' && "italic"
                        )}>{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-gold/5 p-4 sm:p-6 rounded-xl border border-gold/10">
                <h4 className="font-display text-gold text-sm sm:text-base mb-2 sm:mb-3">{t('tg.parentTask')}</h4>
                <ul className="space-y-2 font-serif text-white text-[13px] sm:text-[15px]">
                  <li>• {t('tg.parentTask1')}</li>
                  <li>• {t('tg.parentTask2')}</li>
                  <li>• {t('tg.parentTask3')}</li>
                </ul>
              </div>
            </div>
          </div>
        );
      case 'checklist':
        return (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="font-display text-xl sm:text-3xl text-parchment">{t('tg.checklist')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
              <div className="space-y-3 sm:space-y-4">
                <h4 className="font-display text-gold text-[13px] sm:text-[15px] uppercase tracking-widest">{t('tg.beforeClass')}</h4>
                {[
                  t('tg.checklistBefore1'),
                  t('tg.checklistBefore2'),
                  t('tg.checklistBefore3'),
                  t('tg.checklistBefore4')
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 sm:gap-3 bg-white/5 p-3 sm:p-4 rounded-xl border border-gold/10">
                    <CheckCircle size={16} className="text-gold shrink-0" />
                    <p className="font-serif text-white text-[13px] sm:text-[15px]">{item}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3 sm:space-y-4">
                <h4 className="font-display text-gold text-[13px] sm:text-[15px] uppercase tracking-widest">{t('tg.duringClass')}</h4>
                {[
                  t('tg.checklistDuring1'),
                  t('tg.checklistDuring2'),
                  t('tg.checklistDuring3'),
                  t('tg.checklistDuring4')
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 sm:gap-3 bg-white/5 p-3 sm:p-4 rounded-xl border border-gold/10">
                    <CheckCircle size={16} className="text-gold shrink-0" />
                    <p className="font-serif text-white text-[13px] sm:text-[15px]">{item}</p>
                  </div>
                ))}
              </div>
              <div className="space-y-3 sm:space-y-4">
                <h4 className="font-display text-gold text-[13px] sm:text-[15px] uppercase tracking-widest">{t('tg.afterClass')}</h4>
                {[
                  t('tg.checklistAfter1'),
                  t('tg.checklistAfter2'),
                  t('tg.checklistAfter3'),
                  t('tg.checklistAfter4')
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2.5 sm:gap-3 bg-white/5 p-3 sm:p-4 rounded-xl border border-gold/10">
                    <CheckCircle size={16} className="text-gold shrink-0" />
                    <p className="font-serif text-white text-[13px] sm:text-[15px]">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'development': {
        const dev = metadata?.professionalDevelopment;
        if (!dev) return null;
        const listBox = (title: string, items: string[]) => (
          <div className="bg-white/5 p-4 sm:p-6 rounded-2xl border border-gold/10">
            <h4 className="font-display text-gold text-[13px] sm:text-[15px] uppercase tracking-widest mb-3">{title}</h4>
            <ol className="space-y-2 font-serif text-white text-[13px] sm:text-[15px] leading-relaxed list-decimal ps-5">
              {items.map(item => <li key={item}>{item}</li>)}
            </ol>
          </div>
        );
        return (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500" data-tg-development>
            <h3 className="font-display text-xl sm:text-3xl text-parchment border-b border-gold/20 pb-3 sm:pb-4">{t('tg.development')}</h3>
            <p className="font-serif text-white text-[13px] sm:text-[17px] leading-relaxed">{dev.intro}</p>
            {dev.selfAssessment?.length ? (
              <div className="space-y-4" data-tg-self-assessment>
                <h4 className="font-display text-parchment text-base sm:text-xl">{t('tg.selfAssessment')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {dev.selfAssessment.map(item => (
                    <div key={item.area} className="bg-white/5 p-3 sm:p-4 rounded-xl border border-gold/10">
                      <p className="font-display text-gold text-[12px] sm:text-[13px] uppercase tracking-widest">{item.area}</p>
                      <p className="mt-1.5 font-serif text-white text-[13px] sm:text-[15px] leading-relaxed">{item.prompt}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="space-y-4">
              <h4 className="font-display text-parchment text-base sm:text-xl">{t('tg.peerObservation')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dev.peerObservation.map(obs => (
                  <div key={obs.chapter} className="bg-white/5 p-4 sm:p-6 rounded-2xl border border-gold/10">
                    <p className="font-display text-gold text-[13px] sm:text-[15px]">{obs.chapter}</p>
                    <p className="mt-2 font-serif text-parchment text-[13px] sm:text-[15px] leading-relaxed"><b>{t('tg.observationFocus')}:</b> {obs.focus}</p>
                    <ul className="mt-2 space-y-1.5 font-serif text-white text-[13px] sm:text-[15px] leading-relaxed">
                      {obs.lookFor.map(item => <li key={item}>• {item}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            {listBox(t('tg.reflectionLog'), dev.reflectionLog)}
            {dev.actionResearch && (
              <div className="bg-white/5 p-4 sm:p-6 rounded-2xl border border-gold/10" data-tg-action-research>
                <h4 className="font-display text-gold text-[13px] sm:text-[15px] uppercase tracking-widest mb-3">{t('tg.actionResearch')}</h4>
                <p className="font-serif text-parchment text-[13px] sm:text-[15px] leading-relaxed mb-3">{dev.actionResearch.question}</p>
                <ol className="space-y-2 font-serif text-white text-[13px] sm:text-[15px] leading-relaxed list-decimal ps-5">
                  {dev.actionResearch.steps.map(step => <li key={step}>{step}</li>)}
                </ol>
              </div>
            )}
            {dev.collaboration?.length ? listBox(t('tg.collaboration'), dev.collaboration) : null}
            {listBox(t('tg.standardisation'), dev.standardisation)}
          </div>
        );
      }
      case 'appendices': {
        const appendicesData = metadata?.appendices;
        const fallbackExitTicket = isAbraham ? [
          'One lesson I learned about Prophet Abraham (pbuh) today is...',
          'An action of courage I saw in this study was...',
          'A simple vocabulary word from this chapter I want to use is...'
        ] : isMoses ? [
          'One lesson I learned about Prophet Moses (pbuh) today is...',
          'An action showing safe courage in this study was...',
          'A CEFR A2 word I want to keep using from this chapter is...'
        ] : isMecca ? [
          'One lesson I learned about Mecca’s history or transition is...',
          'An ethical value from the Farewell Sermon that still matters today is...',
          'A key academic term from this chapter I want to remember is...'
        ] : isYunus ? [
          'One lesson I learned about the Sufi concept of tawhid or love is...',
          'An action of honesty or humility I read about in this chapter was...',
          'A key vocabulary word related to character that I want to use is...'
        ] : [
          t('tg.exitTicket1'),
          t('tg.exitTicket2'),
          t('tg.exitTicket3')
        ];

        const fallbackMiniProjectTitle = isAbraham ? 'Truth Search Board' : isMoses ? 'The Midian Kindness Poster' : isMecca ? 'The Brotherhood Scroll' : isYunus ? 'The Straight Path Lodge' : t('tg.miniProjectIdea');
        const fallbackMiniProjectDesc = isAbraham ? 'Draw a simple representation of Abraham looking at the stars, moon, and sun and reflecting on the Creator. Write 2 simple English sentences explaining it.' : isMoses ? 'Draw or write about the scene in Midian where Prophet Moses (pbuh) helped the two sisters, and write 3 simple English sentences on how we can show kindness today.' : isMecca ? 'Design a physical scroll representing the Prophet\'s Farewell Sermon values of absolute racial equality and safety. Write 3 simple English sentences showing how these apply to global citizens.' : isYunus ? 'Draw or write about the scene of Taptuk Emre’s lodge where Yunus Emre carried only straight, uncrooked pieces of wood. Write 3 sentences in English on why integrity in little things matters for our hearts.' : t('tg.miniProjectDesc');

        const fallbackReflectiveTitle = isAbraham ? 'Patience and Trust' : isMoses ? 'Trusting Allah in Difficult Times' : isMecca ? 'Ethical Economics & Character' : isYunus ? 'Guarding and Polishing the Heart' : t('tg.reflectiveWritingPrompt');
        const fallbackReflectiveDesc = isAbraham ? 'Hagar placed her trust in Allah in the desert. Write about a time when you had to be patient, hopeful, and trust things would work out.' : isMoses ? 'Moses’s mother placed him in a basket on the Nile, trusting Allah’s protection. Write about a time when you had to trust and be calm during a hard situation.' : isMecca ? 'Meccan society had high trade wealth but low ethical care for the poor, orphans, and widows. Write about a time you noticed that real richness and success come from helping others rather than just hoarding wealth.' : isYunus ? 'Yunus Emre taught that the heart is the "throne of the Lord," and hurting another person\'s feelings ruins any good deed. Write about a time when you had to control your anger, be patient, or speak kindly to save a sibling or classmate\'s heart.' : t('tg.reflectiveWritingDesc');

        return (
          <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h3 className="font-display text-xl sm:text-3xl text-parchment">{t('tg.appendices')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
              <div className="bg-white/5 p-4 sm:p-8 rounded-2xl border border-gold/10">
                <h4 className="font-display text-lg sm:text-2xl text-gold mb-3 sm:mb-4">{t('tg.sampleExitTicket')}</h4>
                <ul className="space-y-2 sm:space-y-3 font-serif text-[13px] sm:text-base md:text-[17px] text-parchment/60">
                  {(appendicesData?.exitTicket || fallbackExitTicket).map((item, i) => (
                    <li key={i}>• {item}</li>
                  ))}
                </ul>
              </div>
              <div className="bg-white/5 p-4 sm:p-8 rounded-2xl border border-gold/10">
                <h4 className="font-display text-lg sm:text-2xl text-gold mb-3 sm:mb-4">
                  {appendicesData?.miniProject?.title || fallbackMiniProjectTitle}
                </h4>
                <p className={cn(
                  "font-serif text-white text-[13px] sm:text-base md:text-[17px] leading-relaxed",
                  language !== 'ar' && "italic"
                )}>
                  {appendicesData?.miniProject?.desc || fallbackMiniProjectDesc}
                </p>
              </div>
              <div className="bg-white/5 p-4 sm:p-8 rounded-2xl border border-gold/10 col-span-full">
                <h4 className="font-display text-lg sm:text-2xl text-gold mb-3 sm:mb-4">
                  {appendicesData?.reflectivePrompt?.title || fallbackReflectiveTitle}
                </h4>
                <p className={cn(
                  "font-serif text-white text-[13px] sm:text-base md:text-[17px] leading-relaxed",
                  language !== 'ar' && "italic"
                )}>
                  {appendicesData?.reflectivePrompt?.desc || fallbackReflectiveDesc}
                </p>
              </div>
    <div className="bg-gold/5 p-4 sm:p-8 rounded-2xl border border-gold/10 col-span-full">
        <h4 className="font-display text-lg sm:text-2xl text-gold mb-3 sm:mb-4">{t('tg.glossary')}</h4>
        {teacherGuideGlossary.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {teacherGuideGlossary.map((entry, i) => (
              <div key={`${entry.word}-${i}`} className="bg-white/5 border border-gold/10 rounded-xl p-3 sm:p-4">
                <div className="font-display text-sm sm:text-base text-gold mb-1">{entry.word}</div>
                <p className="font-serif text-[13px] sm:text-[15px] text-white leading-relaxed">{entry.definition}</p>
                {entry.example && (
                  <p className={cn(
                    "font-serif text-[11px] sm:text-xs text-parchment/50 mt-2 leading-relaxed",
                    language !== 'ar' && "italic"
                  )}>{entry.example}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="font-serif text-[13px] sm:text-[15px] text-parchment/60 leading-relaxed">
            {language === 'ar'
              ? 'لا توجد مفردات مصدرية متاحة لهذا الكتاب في بيانات الصفحات الحالية.'
              : 'No source glossary entries are available for this book in the current page data.'}
          </p>
        )}
      </div>
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <>
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "teacher-guide-shell fixed inset-0 bg-wood/95 backdrop-blur-2xl z-[100] overflow-hidden flex flex-col",
            isRTL && "font-arabic"
          )}
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={t('nav.teacherGuide')}
          style={{
            '--color-gold': guideTokens.accent,
            '--color-wood': guideTokens.chromeMenu,
          } as React.CSSProperties}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="teacher-guide-header min-h-[4.75rem] md:min-h-[6.5rem] border-b border-gold/15 px-4 sm:px-7 md:px-10 lg:px-12 py-3.5 flex items-center justify-between shrink-0 gap-3">
            <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
              <div className="relative p-2.5 sm:p-3.5 bg-gold text-white rounded-2xl shrink-0 shadow-lg shadow-black/15">
                <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8" />
                <span className="absolute -bottom-1 -end-1 hidden sm:flex min-w-6 h-6 px-1.5 rounded-full bg-black/55 border border-gold/30 items-center justify-center font-display text-[10px] font-black text-gold">
                  {assessmentLevel}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-display text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-gold/65">
                    {language === 'ar' ? 'مساحة عمل المعلم' : 'TEACHER WORKSPACE'}
                  </span>
                  <span className="sm:hidden rounded-full border border-gold/30 bg-black/30 px-1.5 py-px font-display text-[10px] font-black leading-none text-gold">
                    {assessmentLevel}
                  </span>
                  <span className="hidden sm:inline h-1 w-1 rounded-full bg-gold/35" />
                  <span className="hidden sm:inline font-display text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.12em] text-parchment/35">
                    {formatNumber(activeTabIndex + 1)} / {formatNumber(tabs.length)}
                  </span>
                </div>
                <h2 className="font-display text-lg sm:text-2xl md:text-[28px] text-parchment tracking-tight leading-tight truncate">
                  {displayGuideTitle}
                </h2>
                <p className={cn(
                  "hidden sm:block font-serif text-gold/75 text-[13px] sm:text-[15px] md:text-[15px] mt-0.5 truncate",
                  language !== 'ar' && "italic"
                )}>
                  {displayGuideSubtitle}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={() => openLessonPrep(prepChapterIndex)}
                className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl border border-gold/20 bg-gold/[0.10] px-3 sm:px-3.5 font-display text-[12px] sm:text-[13px] font-bold text-gold transition-colors hover:bg-gold hover:text-white"
                title={language === 'ar' ? 'فتح وضع تحضير الدرس' : 'Open Lesson Prep Mode'}
                aria-label={language === 'ar' ? 'فتح وضع تحضير الدرس' : 'Open Lesson Prep Mode'}
              >
                <ClipboardCheck size={17} />
                <span className="hidden sm:inline">{language === 'ar' ? 'تحضير الدرس' : 'Lesson Prep'}</span>
              </button>
              {pdfUrl && (
              <a
                href={pdfUrl}
                target="_blank"
                rel="noopener"
                data-book-pdf-link
                className="flex items-center gap-2 min-h-11 px-3 sm:px-4 bg-gold/[0.08] text-gold rounded-xl border border-gold/15 transition-all font-display text-[13px] sm:text-[15px] hover:bg-gold hover:text-white"
                title={language === 'ar' ? 'افتح كتاب المعلم PDF للقراءة أو الطباعة' : "Open the Teacher's Book PDF to read or print"}
              >
                <Download size={18} className="shrink-0" />
                <span className="hidden sm:inline">PDF</span>
              </a>
              )}
              <button 
                onClick={onClose}
                className="w-11 h-11 flex items-center justify-center bg-white/[0.05] text-gold hover:bg-white/10 rounded-xl border border-white/[0.06] transition-all cursor-pointer shrink-0"
                aria-label={language === 'ar' ? 'إغلاق كتاب المعلم' : "Close Teacher's Book"}
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>

          {/* Main Layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Sidebar Tabs */}
            <aside className={cn(
              "teacher-guide-sidebar w-[4.5rem] sm:w-20 md:w-[21rem] lg:w-[22rem] border-gold/10 overflow-y-auto custom-scrollbar shrink-0",
              isRTL ? "border-l" : "border-r"
            )}>
              <div className="hidden md:block px-5 pt-5 pb-3">
                <div className="rounded-2xl border border-gold/12 bg-white/[0.035] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-gold/50">
                        {language === 'ar' ? 'خريطة الدليل' : 'GUIDE MAP'}
                      </p>
                      <p className="mt-1 font-display text-sm font-bold text-parchment/85">
                        {formatNumber(activeTabIndex + 1)} / {formatNumber(tabs.length)}
                      </p>
                    </div>
                    <div className="relative w-11 h-11 rounded-full border border-gold/20 flex items-center justify-center">
                      <span className="font-display text-[11px] font-black text-gold">
                        {Math.round(((activeTabIndex + 1) / tabs.length) * 100)}%
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                    <motion.div
                      initial={false}
                      animate={{ width: `${((activeTabIndex + 1) / tabs.length) * 100}%` }}
                      className="h-full rounded-full bg-gold"
                    />
                  </div>
                </div>
              </div>

              <nav ref={sectionNavRef} className="p-2 sm:p-3 md:px-4 md:pb-6 space-y-1.5">
                {tabs.map((tab, idx) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      aria-label={`${formatNumber(idx + 1)}. ${tab.label}`}
                      title={tab.label}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        "relative w-full min-h-12 md:min-h-[3.75rem] flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3.5 px-2 md:px-3.5 rounded-xl transition-all group cursor-pointer overflow-hidden",
                        isActive 
                          ? "bg-gold/[0.14] text-parchment border border-gold/25 shadow-[0_8px_24px_rgba(0,0,0,0.12)]" 
                          : "text-parchment/52 border border-transparent hover:bg-white/[0.045] hover:text-parchment"
                      )}
                    >
                      <span className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                        isActive ? "bg-gold text-white" : "bg-white/[0.04] text-gold/65 group-hover:text-gold"
                      )}>
                        {tab.icon}
                      </span>
                      <span className="block md:hidden font-display text-[10px] sm:text-[11px] font-black opacity-85">
                        {formatNumber(idx + 1)}
                      </span>
                      <span className={cn("hidden md:flex min-w-0 flex-1 items-center gap-2", isRTL ? "text-right" : "text-left")}>
                        <span className="w-6 shrink-0 font-display text-[11px] font-black text-gold/45">
                          {formatNumber(idx + 1)}
                        </span>
                        <span className="min-w-0 flex-1 font-display text-[14px] lg:text-[15px] font-bold leading-tight">
                          {tab.label}
                        </span>
                        <ChevronRight className={cn("w-4 h-4 shrink-0 opacity-0 transition-all group-hover:opacity-60", isActive && "opacity-70", isRTL && "rotate-180")} />
                      </span>
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Content Area */}
            <div ref={contentScrollRef} className="teacher-guide-content flex-1 overflow-y-auto custom-scrollbar">
              <div className="sticky top-0 z-20 border-b border-gold/10 bg-wood/95 backdrop-blur-xl px-4 sm:px-7 md:px-10 lg:px-12 py-3.5">
                <div className="max-w-6xl mx-auto flex flex-wrap items-center gap-3 sm:gap-4">
                  <div className="min-w-0 flex flex-1 items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-gold/[0.10] border border-gold/15 text-gold flex items-center justify-center shrink-0">
                      {activeTabMeta.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="font-display text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.16em] text-gold/48">
                        {language === 'ar' ? 'القسم الحالي' : 'CURRENT SECTION'}
                      </p>
                      <h3 className="font-display text-base sm:text-lg md:text-xl font-bold text-parchment truncate">
                        {activeTabMeta.label}
                      </h3>
                    </div>
                  </div>

                  <div className="relative order-3 w-full md:order-none md:w-[19rem] lg:w-[22rem]">
                    <Search className={cn("pointer-events-none absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gold/50", isRTL ? "right-3.5" : "left-3.5")} />
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder={language === 'ar' ? 'ابحث عن قسم أو فصل...' : 'Search sections or chapters...'}
                      className={cn(
                        "w-full h-11 rounded-xl border border-white/[0.08] bg-black/20 text-parchment placeholder:text-parchment/30 outline-none focus:border-gold/35 focus:ring-2 focus:ring-gold/10 font-serif text-[13px] sm:text-sm",
                        isRTL ? "pr-10 pl-3.5 text-right" : "pl-10 pr-3.5"
                      )}
                      aria-label={language === 'ar' ? 'بحث سريع في كتاب المعلم' : "Quick search in Teacher's Book"}
                    />
                    {searchQuery.trim() && (
                      <div className="absolute top-[calc(100%+0.5rem)] inset-x-0 z-50 overflow-hidden rounded-2xl border border-gold/15 bg-wood/95 shadow-2xl backdrop-blur-xl">
                        {searchResults.length > 0 ? (
                          <div className="p-2">
                            {searchResults.map((result, index) => (
                              <button
                                key={`${result.kind}-${index}-${result.label}`}
                                type="button"
                                onClick={() => {
                                  if (result.kind === 'section') {
                                    setActiveTab(result.tabId);
                                    setSearchQuery('');
                                  } else {
                                    jumpToChapter(result.chapterIndex);
                                  }
                                }}
                                className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-start hover:bg-white/[0.06] transition-colors"
                              >
                                <span className="w-8 h-8 rounded-lg bg-gold/[0.10] text-gold flex items-center justify-center shrink-0">
                                  {result.kind === 'section' ? <Layout size={16} /> : <BookIcon size={16} />}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block font-display text-[10px] font-bold uppercase tracking-[0.12em] text-gold/45">
                                    {result.kind === 'section'
                                      ? (language === 'ar' ? 'قسم' : 'Section')
                                      : (language === 'ar' ? 'فصل' : 'Chapter')}
                                  </span>
                                  <span className="block truncate font-display text-[13px] sm:text-sm font-bold text-parchment/85">
                                    {result.label}
                                  </span>
                                </span>
                                <ChevronRight className={cn("w-4 h-4 text-gold/45", isRTL && "rotate-180")} />
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="px-4 py-4 font-serif text-[13px] text-parchment/45">
                            {language === 'ar' ? 'لا توجد نتيجة مطابقة.' : 'No matching section or chapter.'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="hidden sm:flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-full border border-gold/15 bg-gold/[0.06] font-display text-[11px] font-bold text-gold">
                      {assessmentLevel}
                    </span>
                    <span className="px-3 py-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] font-display text-[11px] font-bold text-parchment/55">
                      {formatNumber(activeTabIndex + 1)} / {formatNumber(tabs.length)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-4 py-5 sm:px-7 sm:py-7 md:px-10 md:py-9 lg:px-12 lg:py-10">
                <div className="max-w-6xl mx-auto">
                  {renderTeacherContent()}

                  <div className="mt-10 sm:mt-14 pt-6 sm:pt-8 border-t border-gold/10 flex items-stretch sm:items-center justify-between gap-3">
                    <button
                      type="button"
                      disabled={activeTabIndex === 0}
                      onClick={() => activeTabIndex > 0 && setActiveTab(tabs[activeTabIndex - 1].id)}
                      className="group min-w-0 flex-1 sm:flex-none sm:min-w-[12rem] rounded-2xl border border-white/[0.07] bg-white/[0.025] px-4 py-3.5 text-start transition-all hover:bg-white/[0.05] hover:border-gold/15 disabled:opacity-25 disabled:pointer-events-none"
                    >
                      <span className="flex items-center gap-2 text-gold/55">
                        <ChevronRight className={cn("w-4 h-4 shrink-0", isRTL ? "" : "rotate-180")} />
                        <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em]">
                          {language === 'ar' ? 'السابق' : 'Previous'}
                        </span>
                      </span>
                      {activeTabIndex > 0 && (
                        <span className="mt-1 block truncate font-display text-sm font-bold text-parchment/80">
                          {tabs[activeTabIndex - 1].label}
                        </span>
                      )}
                    </button>

                    <div className="hidden md:flex flex-col items-center justify-center px-4">
                      <span className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-parchment/30">
                        {language === 'ar' ? 'تقدم الدليل' : 'GUIDE PROGRESS'}
                      </span>
                      <span className="mt-1 font-display text-sm font-black text-gold/75">
                        {formatNumber(activeTabIndex + 1)} / {formatNumber(tabs.length)}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={activeTabIndex === tabs.length - 1}
                      onClick={() => activeTabIndex < tabs.length - 1 && setActiveTab(tabs[activeTabIndex + 1].id)}
                      className="group min-w-0 flex-1 sm:flex-none sm:min-w-[12rem] rounded-2xl border border-gold/15 bg-gold/[0.055] px-4 py-3.5 text-end transition-all hover:bg-gold/[0.09] disabled:opacity-25 disabled:pointer-events-none"
                    >
                      <span className="flex items-center justify-end gap-2 text-gold/70">
                        <span className="font-display text-[10px] font-bold uppercase tracking-[0.14em]">
                          {language === 'ar' ? 'التالي' : 'Next'}
                        </span>
                        <ChevronRight className={cn("w-4 h-4 shrink-0", isRTL && "rotate-180")} />
                      </span>
                      {activeTabIndex < tabs.length - 1 && (
                        <span className="mt-1 block truncate font-display text-sm font-bold text-parchment">
                          {tabs[activeTabIndex + 1].label}
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {isPrepOpen && selectedPrepChapter && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[130] bg-black/65 backdrop-blur-md p-2 sm:p-5 md:p-8"
                onClick={() => setIsPrepOpen(false)}
              >
                <motion.section
                  initial={{ opacity: 0, y: 22, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 18, scale: 0.985 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  onClick={(event) => event.stopPropagation()}
                  className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-[1.75rem] border border-gold/20 bg-wood shadow-[0_30px_90px_rgba(0,0,0,0.38)]"
                  dir={isRTL ? 'rtl' : 'ltr'}
                >
                  <div className="shrink-0 border-b border-gold/15 bg-black/20 px-4 py-4 sm:px-6 md:px-8 md:py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex items-start gap-3 sm:gap-4">
                        <span className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gold text-white flex items-center justify-center shrink-0 shadow-lg">
                          <ClipboardCheck size={22} />
                        </span>
                        <div className="min-w-0">
                          <p className="font-display text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.18em] text-gold/55">
                            {language === 'ar' ? 'وضع تحضير الدرس' : 'LESSON PREP MODE'}
                          </p>
                          <h2 className="mt-1 truncate font-display text-lg sm:text-2xl md:text-[28px] font-bold text-parchment">
                            {selectedPrepChapter.chapter}
                          </h2>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-gold/15 bg-gold/[0.07] px-3 py-1 font-display text-[11px] font-bold text-gold">
                              <Clock size={13} />
                              {formatNumber(selectedPrepChapter.timing)}
                            </span>
                            <span className="rounded-full border border-white/[0.07] bg-white/[0.035] px-3 py-1 font-display text-[11px] font-bold text-parchment/55">
                              {formatNumber(prepChapterIndex + 1)} / {formatNumber(content.length)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsPrepOpen(false)}
                        className="w-11 h-11 shrink-0 rounded-xl border border-white/[0.07] bg-white/[0.04] text-gold hover:bg-white/[0.08] transition-colors flex items-center justify-center"
                        aria-label={language === 'ar' ? 'إغلاق وضع التحضير' : 'Close Lesson Prep Mode'}
                      >
                        <X size={21} />
                      </button>
                    </div>

                    <div className="mt-4 flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                      {content.map((chapter, index) => (
                        <button
                          key={`prep-chapter-${index}`}
                          type="button"
                          onClick={() => setPrepChapterIndex(index)}
                          title={chapter.chapter}
                          className={cn(
                            "shrink-0 min-w-10 h-10 px-3 rounded-full border font-display text-[11px] font-black transition-all",
                            prepChapterIndex === index
                              ? "bg-gold text-white border-gold shadow-lg shadow-black/10"
                              : "bg-white/[0.035] text-gold/70 border-gold/15 hover:border-gold/35 hover:text-gold"
                          )}
                        >
                          {formatNumber(index + 1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-5 sm:px-6 md:px-8 md:py-7">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
                      <div className="lg:col-span-7 rounded-2xl border border-gold/15 bg-gold/[0.055] p-4 sm:p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle size={17} className="text-gold" />
                          <h3 className="font-display text-[12px] sm:text-[13px] font-black uppercase tracking-[0.14em] text-gold">
                            {t('tg.learningObjectives')}
                          </h3>
                        </div>
                        <ul className="space-y-2.5 font-serif text-[14px] sm:text-base text-parchment/88 leading-relaxed">
                          {selectedPrepChapter.objectives.map((item, index) => (
                            <li key={index} className="flex gap-2.5">
                              <span className="text-gold/55">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="lg:col-span-5 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <Lightbulb size={17} className="text-gold" />
                          <h3 className="font-display text-[12px] sm:text-[13px] font-black uppercase tracking-[0.14em] text-gold">
                            {t('tg.pedagogyApproach')}
                          </h3>
                        </div>
                        <p className="font-serif text-[14px] sm:text-base text-parchment/78 leading-relaxed">
                          {selectedPrepChapter.pedagogy}
                        </p>
                      </div>

                      {(selectedPrepChapter.beforeReading?.length || selectedPrepChapter.duringReading?.length || selectedPrepChapter.afterReading?.length) ? (
                        <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[
                            { title: t('tg.beforeReading'), items: selectedPrepChapter.beforeReading },
                            { title: t('tg.duringReading'), items: selectedPrepChapter.duringReading },
                            { title: t('tg.afterReading'), items: selectedPrepChapter.afterReading },
                          ].map((group) => group.items?.length ? (
                            <div key={group.title} className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:p-5">
                              <h3 className="font-display text-[12px] sm:text-[13px] font-black uppercase tracking-[0.14em] text-gold mb-3">
                                {group.title}
                              </h3>
                              <ul className="space-y-2 font-serif text-[14px] sm:text-[15px] text-parchment/75 leading-relaxed">
                                {group.items.map((item, index) => <li key={index}>• {item}</li>)}
                              </ul>
                            </div>
                          ) : null)}
                        </div>
                      ) : null}

                      <div className="lg:col-span-7 rounded-2xl border border-white/[0.07] bg-black/10 p-4 sm:p-5">
                        <div className="flex items-center gap-2 mb-3">
                          <ClipboardList size={17} className="text-gold" />
                          <h3 className="font-display text-[12px] sm:text-[13px] font-black uppercase tracking-[0.14em] text-gold">
                            {t('tg.lessonFlow')}
                          </h3>
                        </div>
                        <div className="space-y-2.5">
                          {splitLessonPlanSteps(selectedPrepChapter.lessonPlan).map((step, index) => (
                            <div key={index} className="flex items-start gap-3">
                              <span className="w-6 h-6 rounded-full bg-gold/[0.10] border border-gold/15 text-gold flex items-center justify-center shrink-0 font-display text-[10px] font-black mt-0.5">
                                {formatNumber(index + 1)}
                              </span>
                              <p className="font-serif text-[14px] sm:text-base text-parchment/80 leading-relaxed">
                                {step}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="lg:col-span-5 space-y-4">
                        {(selectedPrepChapter.grammarFocus || selectedPrepChapter.pronunciationFocus) && (
                          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:p-5 space-y-4">
                            {selectedPrepChapter.grammarFocus && (
                              <div>
                                <h3 className="font-display text-[11px] font-black uppercase tracking-[0.14em] text-gold/65 mb-1.5">
                                  {t('tg.grammarFocus')}
                                </h3>
                                <p className="font-serif text-[14px] sm:text-[15px] text-parchment/78 leading-relaxed whitespace-pre-line">
                                  {selectedPrepChapter.grammarFocus}
                                </p>
                              </div>
                            )}
                            {selectedPrepChapter.pronunciationFocus && (
                              <div>
                                <h3 className="font-display text-[11px] font-black uppercase tracking-[0.14em] text-gold/65 mb-1.5">
                                  {t('tg.pronunciationFocus')}
                                </h3>
                                <p className="font-serif text-[14px] sm:text-[15px] text-parchment/78 leading-relaxed whitespace-pre-line">
                                  {selectedPrepChapter.pronunciationFocus}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:p-5">
                          <h3 className="font-display text-[12px] sm:text-[13px] font-black uppercase tracking-[0.14em] text-gold mb-3">
                            {t('tg.differentiation')}
                          </h3>
                          <div className="space-y-3">
                            <div>
                              <p className="font-display text-[10px] font-black uppercase tracking-[0.12em] text-gold/50">{t('tg.fastFinishers')}</p>
                              <p className="mt-1 font-serif text-[14px] text-parchment/75 leading-relaxed">{selectedPrepChapter.differentiation.fastFinishers}</p>
                            </div>
                            <div>
                              <p className="font-display text-[10px] font-black uppercase tracking-[0.12em] text-gold/50">{t('tg.strugglingLearners')}</p>
                              <p className="mt-1 font-serif text-[14px] text-parchment/75 leading-relaxed">{selectedPrepChapter.differentiation.strugglingLearners}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {(selectedPrepChapter.formativeAssessment?.length || selectedPrepChapter.assessmentTools?.exitTicket?.length) ? (
                        <div className="lg:col-span-6 rounded-2xl border border-gold/15 bg-gold/[0.045] p-4 sm:p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <Award size={17} className="text-gold" />
                            <h3 className="font-display text-[12px] sm:text-[13px] font-black uppercase tracking-[0.14em] text-gold">
                              {t('tg.assessment')}
                            </h3>
                          </div>
                          <ul className="space-y-2 font-serif text-[14px] sm:text-[15px] text-parchment/78 leading-relaxed">
                            {(selectedPrepChapter.formativeAssessment ?? selectedPrepChapter.assessmentTools?.exitTicket ?? []).map((item, index) => (
                              <li key={index}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {selectedPrepChapter.transferTask && (
                        <div className="lg:col-span-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:p-5">
                          <div className="flex items-center gap-2 mb-3">
                            <Globe size={17} className="text-gold" />
                            <h3 className="font-display text-[12px] sm:text-[13px] font-black uppercase tracking-[0.14em] text-gold">
                              {language === 'ar' ? 'مهمة النقل' : 'Transfer Task'}
                            </h3>
                          </div>
                          <p className="font-serif text-[14px] sm:text-[15px] text-parchment/78 leading-relaxed">
                            {selectedPrepChapter.transferTask}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.section>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      )}
    </AnimatePresence>
    <LevelExamDialog level={isOpen ? examLevel : null} onClose={() => setExamLevel(null)} />
    </>
  );
};
