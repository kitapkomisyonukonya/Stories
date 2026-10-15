import type { Level } from '../../types';
import { storyCatalog, getStoryMeta } from '../../core/content/storyCatalog';
import { readBookProgress } from '../bookProgress';
import type { MyWord } from '../myWords';
import { EDITIONS, editionKey, stampKey, stampsThisWeek, type JournalState } from './store';
import { storyStyle } from '../../components/seyahatname/art';
import type { StampIcon } from './places';

export const LEVELS: Level[] = ['A2', 'B1', 'B2'];

/** The books a level's certificate asks for: every listed book that has that level. */
export const levelBooks = (level: Level) =>
  storyCatalog.filter(story => story.availableLevels.includes(level) && EDITIONS[editionKey(story.id, level)]);

/** Every listed edition, in library order. */
export const visibleEditions = () =>
  LEVELS.flatMap(level => levelBooks(level).map(story => ({ storyId: story.id, level })));

export const bookName = (storyId: string, lang: 'en' | 'ar') => {
  const meta = getStoryMeta(storyId);
  return (lang === 'ar' ? meta?.nameAr : meta?.name) ?? storyId;
};

export const placeName = (storyId: string, level: Level | string, placeId: string | undefined, lang: 'en' | 'ar') => {
  const place = EDITIONS[editionKey(storyId, level)]?.places.find(item => item.id === placeId);
  if (!place) return undefined;
  return lang === 'ar' && place.ar ? place.ar : place.en;
};

export interface ChapterStampView {
  key: string;
  storyId: string;
  level: Level;
  chapter: number;
  top: string;
  bottom: string;
  number: string;
  icon: StampIcon;
  color: string;
  arabic: boolean;
  earned: boolean;
  at?: number;
  /** For screen readers and the tooltip. */
  label: string;
}

/**
 * What a chapter stamp says. Top: the place the journey map ties to the chapter (or the book's name).
 * Bottom: the book and the level. Middle: a drawing of the place and the chapter number.
 */
export const chapterStamp = (
  state: JournalState,
  storyId: string,
  level: Level,
  chapter: number,
  lang: 'en' | 'ar',
  formatNumber: (value: number) => string,
): ChapterStampView => {
  const edition = EDITIONS[editionKey(storyId, level)];
  const info = edition?.chapters[chapter - 1];
  const style = storyStyle(storyId);
  // An English-only book keeps English stamps in the Arabic interface: its places have no Arabic names.
  const arabic = lang === 'ar' && Boolean(edition?.quick.ar.length);
  const place = placeName(storyId, level, info?.place, arabic ? 'ar' : 'en');
  const shortName = arabic ? style.ar : style.en;
  const at = state.stamps[stampKey(storyId, level, chapter)];
  const chapterWord = lang === 'ar' ? 'الْفَصْلُ' : 'Chapter';
  return {
    key: stampKey(storyId, level, chapter),
    storyId,
    level,
    chapter,
    top: place ?? shortName,
    bottom: arabic ? shortName : `${shortName} · ${level}`,
    number: arabic ? `${formatNumber(chapter)} · ${level}` : String(chapter),
    icon: info?.icon ?? 'book',
    color: style.ink,
    arabic,
    earned: at !== undefined,
    at,
    label: `${place ? `${place} · ` : ''}${bookName(storyId, lang)} ${level} · ${chapterWord} ${formatNumber(chapter)}`,
  };
};

export const totalStamps = (state: JournalState) => Object.keys(state.stamps).length;
export const totalSeals = (state: JournalState) => Object.keys(state.seals).length;

export type BadgeId =
  | 'firstStamp' | 'firstSeal' | 'twoLanguages' | 'allPlaces'
  | 'wordChest' | 'threeCollections' | 'weeklyGoal' | 'levelComplete';

export const BADGE_COPY: Record<BadgeId, { en: string; ar: string; howEn: string; howAr: string }> = {
  firstStamp: { en: 'First stamp', ar: 'الْخَتْمُ الْأَوَّلُ', howEn: 'Finish the Quick Challenge of any chapter.', howAr: 'أَكْمِلِ التَّحَدِّيَ السَّرِيعَ فِي أَيِّ فَصْلٍ.' },
  firstSeal: { en: 'First book seal', ar: 'أَوَّلُ خَتْمِ كِتَابٍ', howEn: 'Finish the Final Challenge of a book.', howAr: 'أَكْمِلِ التَّحَدِّيَ النِّهَائِيَّ فِي كِتَابٍ.' },
  twoLanguages: { en: 'Two languages, one story', ar: 'لُغَتَانِ وَقِصَّةٌ وَاحِدَةٌ', howEn: 'Do the same chapter’s Quick Challenge in English and in Arabic.', howAr: 'أَكْمِلِ التَّحَدِّيَ السَّرِيعَ لِفَصْلٍ وَاحِدٍ بِالْعَرَبِيَّةِ وَالْإِنْجِلِيزِيَّةِ.' },
  allPlaces: { en: 'Every place on the map', ar: 'كُلُّ أَمَاكِنِ الْخَرِيطَةِ', howEn: 'Stamp every place on one book’s journey map.', howAr: 'اخْتِمْ كُلَّ أَمَاكِنِ خَرِيطَةِ كِتَابٍ وَاحِدٍ.' },
  wordChest: { en: 'Word chest', ar: 'صُنْدُوقُ الْكَلِمَاتِ', howEn: 'Save 50 words in My words.', howAr: 'احْفَظْ ٥٠ كَلِمَةً فِي «كَلِمَاتِي».' },
  threeCollections: { en: 'Three collections', ar: 'ثَلَاثُ مَجْمُوعَاتٍ', howEn: 'Press a stamp in a book of each collection.', howAr: 'اخْتِمْ فَصْلًا فِي كِتَابٍ مِنْ كُلِّ مَجْمُوعَةٍ.' },
  weeklyGoal: { en: 'Goal reached', ar: 'بَلَغْتَ الْهَدَفَ', howEn: 'Reach your weekly goal once.', howAr: 'اِبْلُغْ هَدَفَكَ الْأُسْبُوعِيَّ مَرَّةً وَاحِدَةً.' },
  levelComplete: { en: 'A whole level', ar: 'مُسْتَوًى كَامِلٌ', howEn: 'Seal every book of one level.', howAr: 'اخْتِمْ كُلَّ كُتُبِ مُسْتَوًى وَاحِدٍ.' },
};

export const BADGE_ORDER = Object.keys(BADGE_COPY) as BadgeId[];

const placesStamped = (state: JournalState, storyId: string, level: Level) => {
  const edition = EDITIONS[editionKey(storyId, level)];
  const places = (edition?.places ?? []).filter(place => place.chapters.length > 0);
  const stamped = places.filter(place => place.chapters.some(n => state.stamps[stampKey(storyId, level, n)] !== undefined));
  return { stamped, places };
};

export const mapPlacesStamped = placesStamped;

export const earnedBadges = (state: JournalState, words: MyWord[], weeksOnTarget: number): Set<BadgeId> => {
  const earned = new Set<BadgeId>();
  if (Object.keys(state.stamps).length) earned.add('firstStamp');
  if (Object.keys(state.seals).length) earned.add('firstSeal');
  if (words.length >= 50) earned.add('wordChest');
  if (weeksOnTarget > 0 || (state.goal > 0 && stampsThisWeek(state) >= state.goal)) earned.add('weeklyGoal');
  const collections = new Set(
    Object.keys(state.stamps).map(key => storyCatalog.find(story => story.id === key.split(':')[0])?.collection).filter(Boolean),
  );
  if (collections.size >= 3) earned.add('threeCollections');
  if (LEVELS.some(level => levelBooks(level).length > 0 && levelBooks(level).every(story => state.seals[editionKey(story.id, level)] !== undefined))) {
    earned.add('levelComplete');
  }
  for (const key of Object.keys(EDITIONS)) {
    const [storyId, level] = key.split(':') as [string, Level];
    const { stamped, places } = placesStamped(state, storyId, level);
    if (places.length > 0 && stamped.length === places.length) earned.add('allPlaces');
    if (!earned.has('twoLanguages')) {
      const edition = EDITIONS[key];
      const done = new Set(readBookProgress(storyId, level).doneExercises);
      if (edition.quick.en.some((id, i) => id && done.has(id) && edition.quick.ar[i] && done.has(edition.quick.ar[i]))) earned.add('twoLanguages');
    }
  }
  return earned;
};

/** Word treasury chests: the next one to fill. */
export const CHESTS = [50, 100, 250, 500, 1000];
export const nextChest = (count: number) => CHESTS.find(size => size > count) ?? CHESTS[CHESTS.length - 1];
