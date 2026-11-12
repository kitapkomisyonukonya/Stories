/**
 * The printable PDFs of each book, served from /pdfs/books: three story books (the Story book with the
 * activities in every chapter and QR codes, the story alone, and the story followed by all the activities),
 * the Teacher's Book and the Self-Study Guide. They are built outside the app from the book data; Ibn Jubayr has an English
 * edition only.
 */
import type { Level } from '../types';
import { appFileUrl } from '../scorm/config';
import { isEnglishOnlyEdition, isHiddenStory } from '../core/content/storyCatalog';

export type BookPdfKind = 'story' | 'story-only' | 'story-activities' | 'teachers-book' | 'self-study-guide';

/** The three story books, in the order of the menu. */
export const STORY_PDF_KINDS = ['story', 'story-only', 'story-activities'] as const;

const SLUGS: Record<string, string> = { ibnJubayr: 'ibn-jubayr', yunusEmre: 'yunus-emre' };
const ENGLISH_ONLY = new Set(['ibnJubayr']);

/** A1 PDFs are built for these books (2026-11-09); other A1 editions have none yet. */
const A1_PDF_BOOKS = new Set(['adam', 'ibrahim', 'musa', 'mecca', 'yunusEmre', 'ibnJubayr']);

/** Hidden books have no printable PDFs yet. */
export const hasBookPdfs = (storyId: string, level: string) => !isHiddenStory(storyId) && (level !== 'A1' || A1_PDF_BOOKS.has(storyId));

export const bookPdfUrl = (storyId: string, level: string, language: string, kind: BookPdfKind) => {
  // An edition that is English only (stories.json englishOnly / englishOnlyLevels) has English PDFs only.
  const lang = language === 'ar' && !ENGLISH_ONLY.has(storyId) && !isEnglishOnlyEdition(storyId, level as Level) ? 'ar' : 'en';
  return appFileUrl(`/pdfs/books/${SLUGS[storyId] ?? storyId}-${level.toLowerCase()}-${lang}-${kind}.pdf`);
};

export const BOOK_PDF_LABELS: Record<'en' | 'ar', Record<BookPdfKind, string> & { heading: string; hint: string; button: string }> = {
  en: {
    heading: 'Printable PDFs',
    hint: 'Opens in your browser to read, print or save.',
    button: 'PDF',
    story: 'Story book (PDF)',
    'story-only': 'Story only (PDF)',
    'story-activities': 'Story + Workbook (PDF)',
    'teachers-book': 'Teacher’s Book (PDF)',
    'self-study-guide': 'Self-Study Guide (PDF)',
  },
  ar: {
    heading: 'مِلَفَّاتُ PDF لِلطِّبَاعَةِ',
    hint: 'يُفْتَحُ فِي المُتَصَفِّحِ لِلْقِرَاءَةِ أَوِ الطِّبَاعَةِ أَوِ الحِفْظِ.',
    button: 'PDF',
    story: 'كِتَابُ القِصَّةِ (PDF)',
    'story-only': 'القِصَّةُ فَقَطْ (PDF)',
    'story-activities': 'القِصَّةُ وَكُرَّاسَةُ الأَنْشِطَةِ (PDF)',
    'teachers-book': 'كِتَابُ المُعَلِّمِ (PDF)',
    'self-study-guide': 'دَلِيلُ التَّعَلُّمِ الذَّاتِيِّ (PDF)',
  },
};
