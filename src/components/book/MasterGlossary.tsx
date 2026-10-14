import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Volume2,
  Search,
  Check,
  X,
  RotateCcw,
  BookOpenCheck,
  Clock,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from '../ui/icons';
import { PageData, BookData, VocabularyItem } from '../../types';
import { SECTION_ICONS } from '../../lib/sectionIcons';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useIsPhone } from '../../lib/phone';
import { partOfSpeechLabel } from '../../lib/partOfSpeech';

interface MasterGlossaryProps {
  bookData: BookData;
  page: PageData;
  collectionId?: string;
}

type KnownState = 'known' | 'unknown' | 'unreviewed';
type FilterMode = 'all' | 'known' | 'unknown' | 'unreviewed';

const STORAGE_KEY = (bookId: string) => `glossary_known_${bookId}`;
const ARABIC_SCRIPT_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
const LATIN_SCRIPT_RE = /[A-Za-z]/;
const TURKISH_OR_OTTOMAN_CHAR_RE = /[çğıöşüÇĞİÖŞÜâÂîÎûÛ]/;

const normalizeGlossaryKey = (word: string) => word.trim().toLocaleLowerCase();

const isTargetLanguageVocabulary = (word: string, isRTL: boolean) => {
  const cleaned = word.trim();
  if (!cleaned) return false;

  if (isRTL) {
    return ARABIC_SCRIPT_RE.test(cleaned) && !LATIN_SCRIPT_RE.test(cleaned);
  }

  return !ARABIC_SCRIPT_RE.test(cleaned) && !TURKISH_OR_OTTOMAN_CHAR_RE.test(cleaned);
};

const pickPreferredVoice = (lang: string) => {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return undefined;

  const normalizedLang = lang.toLowerCase();
  const prefix = normalizedLang.split('-')[0];
  const exact = voices.filter(voice => voice.lang.toLowerCase() === normalizedLang);
  const sameLanguage = voices.filter(voice => voice.lang.toLowerCase().startsWith(prefix));
  const candidates = exact.length > 0 ? exact : sameLanguage;
  if (!candidates.length) return undefined;

  const preferredName = /(google|microsoft|samantha|daniel|karen|zira|aria|majed|maged|tarik|hamed)/i;
  return candidates.find(voice => preferredName.test(voice.name))
    ?? candidates.find(voice => voice.localService)
    ?? candidates[0];
};

export const MasterGlossary: React.FC<MasterGlossaryProps> = ({
  bookData,
  page,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const [knownMap, setKnownMap] = useState<Record<string, KnownState>>({});
  const [filter, setFilter] = useState<FilterMode>('all');
  const [expandedWord, setExpandedWord] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeChapter, setActiveChapter] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { t, formatNumber, isRTL, language } = useLanguage();
  const WORDS_PER_PAGE = 12;
  const isPhone = useIsPhone();

  const copy = useMemo(() => {
    const isA2 = String(bookData.level).toUpperCase() === 'A2';

    if (isRTL) {
      return isA2
        ? {
            eyebrow: 'المعجم الرئيسي',
            subtitle: 'تعلّم كلمات القصة واختر الكلمات التي تريد أن تتدرّب عليها مرة أخرى.',
            progressTitle: 'تقدّمي',
            progressHint: 'يوضح هذا الكلمات التي تعرفها الآن.',
            total: 'كل الكلمات',
            confident: 'أعرفها',
            practice: 'تدرّب',
            fresh: 'جديد',
            allWords: 'كل الكلمات',
            confidentFilter: 'أعرفها',
            practiceFilter: 'تدرّب',
            newFilter: 'جديد',
            knowAction: 'أعرفها',
            reviewAction: 'تدرّب مرة أخرى',
            knownBadge: 'أعرفها',
            reviewBadge: 'تدرّب',
            newBadge: 'جديد',
            visibleWords: 'كلمات ظاهرة',
            wordFocus: 'تفاصيل الكلمة',
            closeFocus: 'إخفاء التفاصيل',
            inStory: 'في القصة',
            wordFamilyLabel: 'عائلة الكلمة',
            collocationsLabel: 'تعبيرات شائعة',
            synonymsLabel: 'كلمات قريبة',
            antonymsLabel: 'عكسها',
            chapterLabel: 'الفصل',
            categoryLabel: 'التصنيف',
            allChapters: 'كل الفصول',
            pageLabel: 'صفحة',
            ofLabel: 'من',
          }
        : {
            eyebrow: 'المعجم الرئيسي',
            subtitle: 'راجِعِ الكلمات، وقيِّمْ ثقتك، وحدِّدْ ما يحتاج إلى مزيد من التدرّب.',
            progressTitle: 'خريطة الثقة',
            progressHint: 'يعكس هذا المؤشر تقييمك الذاتي الحالي للكلمات.',
            total: 'كل الكلمات',
            confident: 'واثق',
            practice: 'للتدرّب',
            fresh: 'جديد',
            allWords: 'كل الكلمات',
            confidentFilter: 'واثق',
            practiceFilter: 'للتدرّب',
            newFilter: 'جديد',
            knowAction: 'أعرف هذه الكلمة',
            reviewAction: 'أحتاج إلى التدرّب',
            knownBadge: 'واثق',
            reviewBadge: 'للتدرّب',
            newBadge: 'جديد',
            visibleWords: 'كلمات ظاهرة',
            wordFocus: 'تفاصيل الكلمة',
            closeFocus: 'إخفاء التفاصيل',
            inStory: 'في القصة',
            wordFamilyLabel: 'عائلة الكلمة',
            collocationsLabel: 'تعبيرات شائعة',
            synonymsLabel: 'كلمات قريبة',
            antonymsLabel: 'عكسها',
            chapterLabel: 'الفصل',
            categoryLabel: 'التصنيف',
            allChapters: 'كل الفصول',
            pageLabel: 'صفحة',
            ofLabel: 'من',
          };
    }

    return isA2
      ? {
          eyebrow: 'Story words',
          subtitle: 'Learn the words from the story and choose the words you want to practise again.',
          progressTitle: 'My Progress',
          progressHint: 'This shows the words you know now.',
          total: 'All Words',
          confident: 'I Know',
          practice: 'Practice',
          fresh: 'New',
          allWords: 'All Words',
          confidentFilter: 'I Know',
          practiceFilter: 'Practice',
          newFilter: 'New',
          knowAction: 'I know this',
          reviewAction: 'Practice again',
          knownBadge: 'I Know',
          reviewBadge: 'Practice',
          newBadge: 'New',
          visibleWords: 'words shown',
          wordFocus: 'Word details',
          closeFocus: 'Hide details',
          inStory: 'In the story',
          wordFamilyLabel: 'Word family',
          collocationsLabel: 'Useful phrases',
          synonymsLabel: 'Similar words',
          antonymsLabel: 'Opposite',
          chapterLabel: 'Chapter',
          categoryLabel: 'Category',
          allChapters: 'All Chapters',
          pageLabel: 'Page',
          ofLabel: 'of',
        }
      : {
          eyebrow: 'Vocabulary Learning Hub',
          subtitle: 'Review the story vocabulary, map your confidence and keep difficult words visible.',
          progressTitle: 'Confidence map',
          progressHint: 'This stage reflects your current self-assessment of the vocabulary.',
          total: 'All words',
          confident: 'Confident',
          practice: 'Practice',
          fresh: 'New',
          allWords: 'All words',
          confidentFilter: 'Confident',
          practiceFilter: 'Practice',
          newFilter: 'New',
          knowAction: 'I know this',
          reviewAction: 'Needs practice',
          knownBadge: 'Confident',
          reviewBadge: 'Practice',
          newBadge: 'New',
          visibleWords: 'words shown',
          wordFocus: 'Word Focus',
          closeFocus: 'Hide details',
          inStory: 'In the story',
          wordFamilyLabel: 'Word family',
          collocationsLabel: 'Collocations',
          synonymsLabel: 'Synonyms',
          antonymsLabel: 'Antonyms',
          chapterLabel: 'Chapter',
          categoryLabel: 'Category',
          allChapters: 'All Chapters',
          pageLabel: 'Page',
          ofLabel: 'of',
        };
  }, [isRTL, bookData.level]);

  const colTheme = {
      brand600: 'bg-brand-700',
      brand700: 'bg-brand-700',
      brandText: 'text-brand-700',
      brandTextStrong: 'text-brand-950',
      brandSoft: 'bg-brand-50',
      brandSoftStrong: 'bg-brand-100',
      border: 'border-brand-100',
      borderStrong: 'border-brand-200',
      hoverBorder: 'hover:border-brand-300',
      progressTrack: 'bg-brand-100',
      progressFill: 'bg-brand-500',
      audio: 'bg-brand-100 text-brand-700 hover:bg-brand-200',
      audioPlaying: 'bg-brand-700 text-white',
      hero: 'from-brand-50/95 via-white/80 to-brand-50/70',
      heroGlow: 'bg-brand-300/20',
      accentBorder: 'border-brand-200/70',
    };

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY(bookData.id ?? 'default'));
      if (stored) setKnownMap(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, [bookData.id]);

  const persistKnownMap = useCallback((map: Record<string, KnownState>) => {
    try {
      localStorage.setItem(STORAGE_KEY(bookData.id ?? 'default'), JSON.stringify(map));
    } catch {
      // ignore
    }
  }, [bookData.id]);

  const allVocabulary = useMemo(() => {
    if (page.vocabulary && page.vocabulary.length > 0) {
      return page.vocabulary
        .filter(v => isTargetLanguageVocabulary(v.word, isRTL))
        .map(v => ({
          ...v,
          key: normalizeGlossaryKey(v.word),
          word: v.word.trim(),
        }))
        .sort((a, b) => a.word.localeCompare(b.word, isRTL ? 'ar' : 'en', { sensitivity: 'base' }));
    }

    const vocabMap = new Map<string, VocabularyItem>();
    bookData.pages.forEach(p => {
      p.vocabulary?.forEach(v => {
        if (!isTargetLanguageVocabulary(v.word, isRTL)) return;

        const key = normalizeGlossaryKey(v.word);
        if (!vocabMap.has(key)) {
          vocabMap.set(key, {
            ...v,
            word: v.word.trim(),
          });
        }
      });
    });

    return Array.from(vocabMap.entries())
      .map(([key, data]) => ({ key, ...data }))
      .sort((a, b) => a.word.localeCompare(b.word, isRTL ? 'ar' : 'en', { sensitivity: 'base' }));
  }, [bookData, page, isRTL]);

  const knownCount = useMemo(
    () => allVocabulary.filter(v => knownMap[v.key] === 'known').length,
    [allVocabulary, knownMap]
  );
  const reviewCount = useMemo(
    () => allVocabulary.filter(v => knownMap[v.key] === 'unknown').length,
    [allVocabulary, knownMap]
  );
  const newCount = allVocabulary.length - knownCount - reviewCount;

  const filteredVocab = useMemo(() => {
    return allVocabulary.filter(v => {
      const searchHaystack = [
        v.word,
        v.definition,
        v.category,
        v.partOfSpeech,
        v.chapterTitle,
        ...(v.collocations ?? []),
        ...(v.wordFamily ?? []),
      ].filter(Boolean).join(' ').toLowerCase();
      const matchesSearch = !searchTerm || searchHaystack.includes(searchTerm.toLowerCase());

      const state: KnownState = knownMap[v.key] ?? 'unreviewed';
      const matchesFilter =
        filter === 'all' ||
        (filter === 'known' && state === 'known') ||
        (filter === 'unknown' && state === 'unknown') ||
        (filter === 'unreviewed' && state === 'unreviewed');

      const matchesCategory = !activeCategory || v.category === activeCategory;
      const matchesChapter = activeChapter === null || v.chapter === activeChapter;

      return matchesSearch && matchesFilter && matchesCategory && matchesChapter;
    });
  }, [allVocabulary, searchTerm, filter, knownMap, activeCategory, activeChapter]);

  const chapterOptions = useMemo(() => {
    const chapters = new Map<number, string>();
    allVocabulary.forEach(v => {
      if (typeof v.chapter === 'number' && !chapters.has(v.chapter)) {
        chapters.set(v.chapter, v.chapterTitle ?? `${copy.chapterLabel} ${formatNumber(v.chapter)}`);
      }
    });
    return Array.from(chapters.entries())
      .map(([chapter, title]) => ({ chapter, title }))
      .sort((a, b) => a.chapter - b.chapter);
  }, [allVocabulary, copy.chapterLabel, formatNumber]);

  const totalPages = Math.max(1, Math.ceil(filteredVocab.length / WORDS_PER_PAGE));
  const paginatedVocab = useMemo(() => {
    const start = (currentPage - 1) * WORDS_PER_PAGE;
    return filteredVocab.slice(start, start + WORDS_PER_PAGE);
  }, [filteredVocab, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    setExpandedWord(null);
  }, [searchTerm, filter, activeCategory, activeChapter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const playWord = useCallback((word: string) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    setPlayingWord(word);

    const targetLang = isRTL ? 'ar-SA' : 'en-US';
    const utterance = new SpeechSynthesisUtterance(word);
    const preferredVoice = pickPreferredVoice(targetLang);

    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.lang = preferredVoice?.lang ?? targetLang;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    const reset = () => setPlayingWord(null);
    utterance.onerror = reset;

    const timeout = setTimeout(reset, 3000);
    utterance.onend = () => {
      clearTimeout(timeout);
      reset();
    };

    window.speechSynthesis.speak(utterance);
  }, [isRTL]);

  const markWord = useCallback((wordKey: string, state: KnownState) => {
    setKnownMap(prev => {
      const next = { ...prev, [wordKey]: state };
      persistKnownMap(next);
      return next;
    });
  }, [persistKnownMap]);

  const resetProgress = useCallback(() => {
    setKnownMap({});
    persistKnownMap({});
  }, [persistKnownMap]);

  const progressPct = allVocabulary.length > 0
    ? Math.round((knownCount / allVocabulary.length) * 100)
    : 0;

  const filterOptions: { value: FilterMode; label: string; count: number }[] = [
    { value: 'all', label: copy.allWords, count: allVocabulary.length },
    { value: 'known', label: copy.confidentFilter, count: knownCount },
    { value: 'unknown', label: copy.practiceFilter, count: reviewCount },
    { value: 'unreviewed', label: copy.newFilter, count: newCount },
  ];

  const summaryCards = [
    {
      key: 'all' as FilterMode,
      label: copy.total,
      value: allVocabulary.length,
      icon: BookOpenCheck,
      className: cn(colTheme.brandSoft, colTheme.brandText, colTheme.border),
    },
    {
      key: 'known' as FilterMode,
      label: copy.confident,
      value: knownCount,
      icon: CheckCircle,
      className: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    },
    {
      key: 'unknown' as FilterMode,
      label: copy.practice,
      value: reviewCount,
      icon: RotateCcw,
      className: 'bg-rose-50 text-rose-700 border-rose-100',
    },
    {
      key: 'unreviewed' as FilterMode,
      label: copy.fresh,
      value: newCount,
      icon: Clock,
      className: 'bg-violet-50 text-violet-700 border-violet-100',
    },
  ];

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
      <section className={cn(
        'shrink-0 relative overflow-hidden rounded-[1.6rem] border bg-gradient-to-br px-4 py-4 sm:px-5 sm:py-4 shadow-sm max-sm:hidden',
        colTheme.hero,
        colTheme.accentBorder
      )}>
        <div className={cn('absolute -top-16 -right-12 w-44 h-44 rounded-full blur-3xl pointer-events-none', colTheme.heroGlow)} />
        <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 max-sm:flex-row max-sm:items-center max-sm:gap-3">
          <div className="flex items-start gap-3 min-w-0 max-sm:hidden">
            <div className={cn(
              'w-11 h-11 sm:w-12 sm:h-12 rounded-2xl text-white flex items-center justify-center shadow-lg shrink-0 max-sm:hidden',
              colTheme.brand600
            )}>
              <SECTION_ICONS.glossary.icon size={23} />
            </div>
            <div className="min-w-0">
              <div className={cn('text-[11px] sm:text-xs uppercase tracking-[0.18em] font-black mb-1 max-sm:hidden', colTheme.brandText)}>
                {copy.eyebrow}
              </div>
              <h2 className={cn('text-2xl sm:text-3xl font-black tracking-tight leading-none max-sm:text-lg', colTheme.brandTextStrong)}>
                {t('nav.masterGlossary')}
              </h2>
              <p className="text-sm sm:text-[15px] text-wood/60 mt-1.5 max-w-2xl leading-relaxed max-sm:hidden">
                {copy.subtitle}
              </p>
            </div>
          </div>

          {/* Phones: one slim line instead of the progress box, so the words get the screen */}
          <div className="sm:hidden flex items-center gap-2.5 min-w-0 flex-1">
            <span className={cn('text-xs font-black whitespace-nowrap', colTheme.brandText)}>{copy.confident}</span>
            <div className={cn('h-1.5 flex-1 rounded-full overflow-hidden', colTheme.progressTrack)}>
              <div className={cn('h-full rounded-full', colTheme.progressFill)} style={{ width: `${progressPct}%` }} />
            </div>
            <span className={cn('text-xs font-black tabular-nums whitespace-nowrap', colTheme.brandTextStrong)}>
              {formatNumber(knownCount)} / {formatNumber(allVocabulary.length)}
            </span>
            {(knownCount > 0 || reviewCount > 0) && (
              <button
                onClick={resetProgress}
                className={cn('shrink-0 w-8 h-8 rounded-lg flex items-center justify-center', colTheme.brandSoft, colTheme.brandText)}
                title={t('nav.reset')}
                aria-label={t('nav.reset')}
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>

          <div className="max-sm:hidden xl:w-[42%] xl:min-w-[430px] rounded-2xl border border-white/80 bg-white/65 backdrop-blur-md px-4 py-3 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div>
                <div className={cn('text-xs font-black uppercase tracking-[0.12em]', colTheme.brandText)}>
                  {copy.progressTitle}
                </div>
                <p className="text-[11px] sm:text-xs text-wood/60 mt-0.5">
                  {copy.progressHint}
                </p>
              </div>
              <div className={cn('text-2xl sm:text-3xl font-black tabular-nums', colTheme.brandTextStrong)}>
                {formatNumber(progressPct)}%
              </div>
            </div>

            <div className={cn('h-2.5 rounded-full overflow-hidden', colTheme.progressTrack)}>
              <motion.div
                className={cn('h-full rounded-full', colTheme.progressFill)}
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              />
            </div>

            <div className="flex items-center justify-between gap-2 mt-2">
              <span className="text-[11px] sm:text-xs text-wood/60">
                {formatNumber(knownCount)} / {formatNumber(allVocabulary.length)} {copy.confident === 'I Know' ? 'I know' : copy.confident.toLowerCase()}
              </span>
              {(knownCount > 0 || reviewCount > 0) && (
                <button
                  onClick={resetProgress}
                  className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all hover:scale-[1.02]', colTheme.brandSoft, colTheme.brandText)}
                  title={t('nav.reset')}
                  aria-label={t('nav.reset')}
                >
                  <RotateCcw size={12} />
                  {t('nav.reset')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Phones: the filter chips below already carry these counts */}
        <div className="relative hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-2.5 mt-4">
          {summaryCards.map(item => {
            const Icon = item.icon;
            const active = filter === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setFilter(item.key)}
                className={cn(
                  'rounded-2xl border p-3 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm',
                  item.className,
                  active && 'ring-2 ring-current/15 shadow-sm'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="w-8 h-8 rounded-xl bg-white/70 flex items-center justify-center shadow-sm">
                    <Icon size={16} />
                  </div>
                  <span className="text-xl sm:text-2xl font-black tabular-nums">{formatNumber(item.value)}</span>
                </div>
                <div className="mt-2 text-[11px] sm:text-xs font-black uppercase tracking-[0.08em]">
                  {item.label}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="shrink-0 rounded-2xl border border-black/5 bg-white/45 backdrop-blur-sm p-3 shadow-sm max-sm:p-2">
        <div className="flex flex-col xl:flex-row xl:items-center gap-2.5 max-sm:flex-row max-sm:flex-wrap max-sm:gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className={cn(
              'absolute top-1/2 -translate-y-1/2 w-4 h-4',
              isRTL ? 'right-3.5' : 'left-3.5',
              colTheme.brandText
            )} />
            <input
              type="text"
              placeholder={t('nav.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={cn(
                'w-full py-2.5 max-sm:py-2 bg-white/75 border rounded-xl outline-none transition-all font-serif shadow-inner focus:ring-2 focus:ring-black/5',
                isRTL ? 'pr-10 pl-3' : 'pl-10 pr-3',
                colTheme.borderStrong,
                colTheme.brandTextStrong
              )}
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto custom-scrollbar shrink-0 pb-0.5 xl:pb-0 max-sm:order-last max-sm:basis-full" data-no-swipe>
            {filterOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={cn(
                  'px-3 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap',
                  filter === opt.value
                    ? `${colTheme.brand600} text-white ${colTheme.brand600.replace('bg-', 'border-')}`
                    : cn('bg-white/60 hover:bg-white', colTheme.brandText, colTheme.border)
                )}
              >
                {isPhone && opt.value === 'known' && <Check size={12} className="me-1 inline-block align-[-1px]" aria-hidden="true" />}
                {isPhone && opt.value === 'unknown' && <RotateCcw size={12} className="me-1 inline-block align-[-1px]" aria-hidden="true" />}
                {opt.label} <span>· {formatNumber(opt.count)}</span>
              </button>
            ))}
          </div>

          {chapterOptions.length > 0 && (
            <select
              value={activeChapter ?? ''}
              onChange={(e) => setActiveChapter(e.target.value ? Number(e.target.value) : null)}
              className={cn(
                'shrink-0 px-3 py-2 rounded-xl text-xs font-bold border bg-white/70 outline-none cursor-pointer max-sm:w-[6.5rem] max-sm:px-2',
                colTheme.borderStrong,
                colTheme.brandText
              )}
              aria-label={copy.chapterLabel}
            >
              <option value="">{copy.allChapters}</option>
              {chapterOptions.map(item => (
                <option key={item.chapter} value={item.chapter}>
                  {copy.chapterLabel} {formatNumber(item.chapter)} · {item.title}
                </option>
              ))}
            </select>
          )}
          {isPhone && (knownCount > 0 || reviewCount > 0) && (
            <button
              onClick={resetProgress}
              className={cn('shrink-0 w-9 h-9 rounded-xl flex items-center justify-center', colTheme.brandSoft, colTheme.brandText)}
              title={t('nav.reset')}
              aria-label={t('nav.reset')}
            >
              <RotateCcw size={14} />
            </button>
          )}

          <div className="hidden 2xl:flex items-center gap-1.5 text-[11px] text-wood/40 whitespace-nowrap px-1">
            <span>{formatNumber(filteredVocab.length)}</span>
            <span>{copy.visibleWords}</span>
          </div>
        </div>

        {(activeCategory || activeChapter !== null) && (
          <div className="mt-2.5 pt-2.5 border-t border-black/5 flex flex-wrap items-center gap-2">
            {activeCategory && (
              <>
                <span className="text-[11px] font-black uppercase tracking-[0.1em] text-wood/55">
                  {copy.categoryLabel}
                </span>
                <button
                  onClick={() => setActiveCategory(null)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all',
                    colTheme.brandSoft,
                    colTheme.brandText,
                    colTheme.borderStrong
                  )}
                >
                  {activeCategory}
                  <X size={11} />
                </button>
              </>
            )}
            {activeChapter !== null && (
              <>
                <span className="text-[11px] font-black uppercase tracking-[0.1em] text-wood/55">
                  {copy.chapterLabel}
                </span>
                <button
                  onClick={() => setActiveChapter(null)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all',
                    colTheme.brandSoft,
                    colTheme.brandText,
                    colTheme.borderStrong
                  )}
                >
                  {formatNumber(activeChapter)}
                  <X size={11} />
                </button>
              </>
            )}
          </div>
        )}

      </section>

      {isPhone ? (
        // Phones: a plain word list (all words, no pages). Tap a row for more; ✓ and ↻ mark it.
        <div className="flex-1 min-h-0 overflow-y-auto -mx-3 border-t border-black/5">
          <div className="flex items-center gap-4 px-4 py-2 text-[12px] text-wood/65" aria-hidden="true">
            <span className="flex items-center gap-1.5"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white"><Check size={11} /></span>{copy.knownBadge}</span>
            <span className="flex items-center gap-1.5"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white"><RotateCcw size={10} /></span>{copy.reviewBadge}</span>
          </div>
          {filteredVocab.length === 0 && (
            <p className="px-4 py-10 text-center text-sm text-wood/55">
              {searchTerm ? t('nav.noWordsFound') : t('nav.noWordsCategory')}
            </p>
          )}
          <ul className="divide-y divide-black/5">
            {filteredVocab.map(v => {
              const state: KnownState = knownMap[v.key] ?? 'unreviewed';
              return (
                <li key={v.key} className="bg-white/55 ps-4 pe-3">
                  <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExpandedWord(expandedWord === v.key ? null : v.key)}
                    className="min-w-0 flex-1 py-3 text-start"
                    aria-expanded={expandedWord === v.key}
                  >
                    <span className="flex flex-wrap items-baseline gap-x-2">
                      <span className={cn('font-black text-[17px] leading-tight', colTheme.brandTextStrong, !isRTL && 'capitalize')}>
                        {v.word}
                        <ChevronUp size={14} className={cn('ms-1 inline-block align-middle opacity-60 transition-transform', expandedWord !== v.key && 'rotate-180')} />
                      </span>
                      <span className="text-xs font-semibold text-wood/60">
                        {[partOfSpeechLabel(v.partOfSpeech, language), v.chapter ? `${copy.chapterLabel} ${formatNumber(v.chapter)}` : null].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                    <span className="mt-0.5 block font-serif text-[15px] leading-snug text-wood/75">{v.definition}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => playWord(v.word)}
                    aria-label={v.word}
                    className={cn('relative shrink-0 w-10 h-10 rounded-full flex items-center justify-center before:absolute before:-inset-[2px]', playingWord === v.word ? colTheme.audioPlaying : colTheme.audio)}
                  >
                    <Volume2 size={15} className={playingWord === v.word ? 'animate-pulse' : ''} />
                  </button>
                  {/* One tap each: ✓ I know, ↻ Practice. Tapping the lit one again clears it. */}
                  <button
                    type="button"
                    onClick={() => markWord(v.key, state === 'known' ? 'unreviewed' : 'known')}
                    aria-pressed={state === 'known'}
                    title={copy.knownBadge}
                    aria-label={`${v.word}: ${copy.knownBadge}`}
                    data-gloss-known
                    className={cn(
                      'relative shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-[1.5px] transition-colors before:absolute before:-inset-[2px]',
                      state === 'known' ? 'bg-emerald-600 border-emerald-600 text-white' : 'bg-white border-black/10 text-wood/45'
                    )}
                  >
                    <Check size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => markWord(v.key, state === 'unknown' ? 'unreviewed' : 'unknown')}
                    aria-pressed={state === 'unknown'}
                    title={copy.reviewBadge}
                    aria-label={`${v.word}: ${copy.reviewBadge}`}
                    data-gloss-practice
                    className={cn(
                      'relative shrink-0 w-10 h-10 rounded-full flex items-center justify-center border-[1.5px] transition-colors before:absolute before:-inset-[2px]',
                      state === 'unknown' ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-black/10 text-wood/45'
                    )}
                  >
                    <RotateCcw size={16} />
                  </button>
                  </div>
                  {expandedWord === v.key && (
                    <div className={cn('mb-3 rounded-xl border bg-white/70 p-3 text-[13px] leading-relaxed text-wood/75 space-y-2', colTheme.border)}>
                      {v.storyExample && (
                        <div>
                          <div className={cn('text-[10px] font-black uppercase tracking-[0.1em]', colTheme.brandText)}>
                            {copy.inStory}{v.chapter ? ` · ${copy.chapterLabel} ${formatNumber(v.chapter)}` : ''}
                          </div>
                          <p className="font-serif italic">“{v.storyExample}”</p>
                        </div>
                      )}
                      {!v.storyExample && v.example && <p className="font-serif italic">“{v.example}”</p>}
                      {v.pronunciation && <p className="font-serif text-wood/60">{v.pronunciation}</p>}
                      {([
                        [copy.categoryLabel, v.category ? [v.category] : undefined],
                        [copy.wordFamilyLabel, v.wordFamily],
                        [copy.collocationsLabel, v.collocations],
                        [copy.synonymsLabel, v.synonyms],
                        [copy.antonymsLabel, v.antonyms],
                      ] as const).filter(([, items]) => items?.length).map(([label, items]) => (
                        <div key={label}>
                          <div className="text-[10px] font-black uppercase tracking-[0.1em] text-wood/55">{label}</div>
                          <p>{items!.join(' · ')}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pe-2 -me-2">
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3.5 pb-2 items-start">
          <AnimatePresence mode="popLayout">
            {paginatedVocab.map((v, index) => {
              const state: KnownState = knownMap[v.key] ?? 'unreviewed';
              const statusLabel = state === 'known'
                ? copy.knownBadge
                : state === 'unknown'
                  ? copy.reviewBadge
                  : copy.newBadge;

              return (
                <motion.article
                  key={v.key}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.16 }}
                  className={cn(
                    'group self-start relative overflow-hidden bg-white/68 backdrop-blur-sm border rounded-[1.35rem] p-4 transition-all shadow-sm hover:shadow-md hover:-translate-y-[1px]',
                    state === 'known'
                      ? 'border-emerald-200/80'
                      : state === 'unknown'
                        ? 'border-rose-200/80'
                        : cn(colTheme.border, colTheme.hoverBorder)
                  )}
                >
                  <div className={cn(
                    'absolute inset-x-0 top-0 h-1',
                    state === 'known'
                      ? 'bg-emerald-400'
                      : state === 'unknown'
                        ? 'bg-rose-400'
                        : colTheme.progressFill
                  )} />

                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[11px] font-black tabular-nums text-wood/55">
                          {formatNumber(String((currentPage - 1) * WORDS_PER_PAGE + index + 1).padStart(2, '0'))}
                        </span>
                        <span className={cn(
                          'px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-[0.08em]',
                          state === 'known'
                            ? 'bg-emerald-50 text-emerald-700'
                            : state === 'unknown'
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-violet-50 text-violet-700'
                        )}>
                          {statusLabel}
                        </span>
                      </div>

                      <h3 className={cn(
                        'text-xl sm:text-[1.35rem] font-black leading-tight',
                        colTheme.brandTextStrong,
                        !isRTL && 'capitalize'
                      )}>
                        {v.word}
                      </h3>

                      {(v.pronunciation || v.partOfSpeech || v.chapter) && (
                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mt-1.5 text-[11px] sm:text-xs text-wood/60">
                          {v.pronunciation && <span className="font-serif">{v.pronunciation}</span>}
                          {v.partOfSpeech && <span className="font-semibold">{partOfSpeechLabel(v.partOfSpeech, language)}</span>}
                          {v.chapter && (
                            <span className="font-semibold">
                              {copy.chapterLabel} {formatNumber(v.chapter)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => playWord(v.word)}
                      className={cn(
                        'shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all shadow-sm',
                        playingWord === v.word ? colTheme.audioPlaying : colTheme.audio
                      )}
                      aria-label={v.word}
                    >
                      <Volume2 size={16} className={playingWord === v.word ? 'animate-pulse' : ''} />
                    </button>
                  </div>

                  <p className="font-serif text-[15px] sm:text-base text-wood/72 leading-relaxed mt-3 min-h-[3rem]">
                    {v.definition}
                  </p>

                  {v.example && (
                    <div className={cn(
                      'mt-3 rounded-xl border px-3 py-2.5 bg-white/55',
                      colTheme.border
                    )}>
                      <p className="font-serif italic text-sm text-wood/55 leading-relaxed">
                        “{v.example}”
                      </p>
                    </div>
                  )}

                  {(v.category || v.storyExample || v.wordFamily?.length || v.collocations?.length || v.synonyms?.length || v.antonyms?.length) && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between gap-2">
                        {v.category ? (
                          <button
                            onClick={() => setActiveCategory(activeCategory === v.category ? null : v.category ?? null)}
                            title={activeCategory === v.category ? v.category : `${copy.categoryLabel}: ${v.category}`}
                            className={cn(
                              'px-2 py-1 rounded-lg text-[11px] font-black uppercase tracking-[0.08em] border transition-all',
                              activeCategory === v.category
                                ? `${colTheme.brand600} text-white ${colTheme.brand600.replace('bg-', 'border-')} shadow-sm`
                                : cn(colTheme.brandSoft, colTheme.brandText, colTheme.border)
                            )}
                          >
                            {v.category}
                          </button>
                        ) : <span />}

                        <button
                          onClick={() => setExpandedWord(expandedWord === v.key ? null : v.key)}
                          className={cn(
                            'text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition-all',
                            colTheme.brandSoft,
                            colTheme.brandText
                          )}
                        >
                          {expandedWord === v.key ? copy.closeFocus : copy.wordFocus}
                        </button>
                      </div>

                      <AnimatePresence initial={false}>
                        {expandedWord === v.key && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, y: -4 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -4 }}
                            transition={{ duration: 0.18 }}
                            className="overflow-hidden"
                          >
                            <div className={cn('mt-2.5 rounded-xl border bg-white/60 p-3', colTheme.border)}>
                              {v.chapterTitle && (
                                <div className="text-[11px] font-bold text-wood/60 mb-2">
                                  {copy.chapterLabel} {v.chapter ? formatNumber(v.chapter) : ''}{v.chapter ? ' · ' : ''}{v.chapterTitle}
                                </div>
                              )}

                              {v.storyExample && (
                                <div className="mb-3">
                                  <div className={cn('text-[11px] font-black uppercase tracking-[0.1em] mb-1', colTheme.brandText)}>
                                    {copy.inStory}
                                  </div>
                                  <p className="font-serif italic text-sm text-wood/65 leading-relaxed">
                                    “{v.storyExample}”
                                  </p>
                                </div>
                              )}

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {v.wordFamily?.length ? (
                                  <div>
                                    <div className="text-[11px] font-black uppercase tracking-[0.08em] text-wood/55 mb-1">{copy.wordFamilyLabel}</div>
                                    <p className="text-xs text-wood/65 leading-relaxed">{v.wordFamily.join(' · ')}</p>
                                  </div>
                                ) : null}
                                {v.collocations?.length ? (
                                  <div>
                                    <div className="text-[11px] font-black uppercase tracking-[0.08em] text-wood/55 mb-1">{copy.collocationsLabel}</div>
                                    <p className="text-xs text-wood/65 leading-relaxed">{v.collocations.join(' · ')}</p>
                                  </div>
                                ) : null}
                                {v.synonyms?.length ? (
                                  <div>
                                    <div className="text-[11px] font-black uppercase tracking-[0.08em] text-wood/55 mb-1">{copy.synonymsLabel}</div>
                                    <p className="text-xs text-wood/65 leading-relaxed">{v.synonyms.join(' · ')}</p>
                                  </div>
                                ) : null}
                                {v.antonyms?.length ? (
                                  <div>
                                    <div className="text-[11px] font-black uppercase tracking-[0.08em] text-wood/55 mb-1">{copy.antonymsLabel}</div>
                                    <p className="text-xs text-wood/65 leading-relaxed">{v.antonyms.join(' · ')}</p>
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-black/5">
                    <button
                      onClick={() => markWord(v.key, state === 'known' ? 'unreviewed' : 'known')}
                      className={cn(
                        'flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all border',
                        state === 'known'
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-100'
                          : 'bg-white/70 text-emerald-700 border-emerald-100 hover:bg-emerald-50 hover:border-emerald-200'
                      )}
                      title={t('nav.iKnowThisWord')}
                    >
                      <Check size={13} />
                      {copy.knowAction}
                    </button>

                    <button
                      onClick={() => markWord(v.key, state === 'unknown' ? 'unreviewed' : 'unknown')}
                      className={cn(
                        'flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all border',
                        state === 'unknown'
                          ? 'bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-100'
                          : 'bg-white/70 text-rose-600 border-rose-100 hover:bg-rose-50 hover:border-rose-200'
                      )}
                      title={t('nav.needToReview')}
                    >
                      <X size={13} />
                      {copy.reviewAction}
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredVocab.length === 0 && (
          <div className="h-48 flex flex-col items-center justify-center text-center p-6">
            <div className={cn('w-12 h-12 rounded-full flex items-center justify-center mb-3', colTheme.brandSoft)}>
              <Search className={cn('w-6 h-6', colTheme.brandText)} />
            </div>
            <p className="font-serif italic text-wood/40">
              {searchTerm ? t('nav.noWordsFound') : t('nav.noWordsCategory')}
            </p>
          </div>
        )}
      </div>
      )}

      {!isPhone && filteredVocab.length > WORDS_PER_PAGE && (
        <div className="shrink-0 flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage(pageNumber => Math.max(1, pageNumber - 1))}
            disabled={currentPage === 1}
            className={cn(
              'w-8 h-8 rounded-lg border flex items-center justify-center transition-all',
              currentPage === 1
                ? 'opacity-30 cursor-not-allowed bg-white/30 border-black/5 text-wood/30'
                : cn('bg-white/70 hover:bg-white', colTheme.borderStrong, colTheme.brandText)
            )}
            aria-label="Previous page"
          >
            <ChevronLeft size={14} mirrored={isRTL} />
          </button>

          <div className="px-3 py-1.5 rounded-lg bg-white/55 border border-black/5 text-[11px] sm:text-xs font-bold text-wood/55 tabular-nums">
            {copy.pageLabel} {formatNumber(currentPage)} {copy.ofLabel} {formatNumber(totalPages)}
            <span className="mx-1.5 text-wood/20">·</span>
            {formatNumber((currentPage - 1) * WORDS_PER_PAGE + 1)}–{formatNumber(Math.min(currentPage * WORDS_PER_PAGE, filteredVocab.length))}
            <span className="mx-1">/</span>
            {formatNumber(filteredVocab.length)}
          </div>

          <button
            onClick={() => setCurrentPage(pageNumber => Math.min(totalPages, pageNumber + 1))}
            disabled={currentPage === totalPages}
            className={cn(
              'w-8 h-8 rounded-lg border flex items-center justify-center transition-all',
              currentPage === totalPages
                ? 'opacity-30 cursor-not-allowed bg-white/30 border-black/5 text-wood/30'
                : cn('bg-white/70 hover:bg-white', colTheme.borderStrong, colTheme.brandText)
            )}
            aria-label="Next page"
          >
            <ChevronRight size={14} mirrored={isRTL} />
          </button>
        </div>
      )}


    </div>
  );
};
