import type { Level, ProphetStory } from '../../types';
import storyFile from '../../content/stories.json';

interface StoryFile {
  id: string;
  text: Record<'en' | 'ar', { name: string; description: string }>;
  availableLevels: string[];
  collection: string;
  englishOnly?: boolean;
  englishOnlyLevels?: string[];
  hidden?: boolean;
}

import adamCover from '../../assets/images/adam_cover.webp';
import adamCoverSmall from '../../assets/images/adam_cover_sm.webp';
import meccaCover from '../../assets/images/mecca_cover.webp';
import meccaCoverSmall from '../../assets/images/mecca_cover_sm.webp';
import abrahamCover from '../../assets/images/abraham_cover.webp';
import abrahamCoverSmall from '../../assets/images/abraham_cover_sm.webp';
import mosesCover from '../../assets/images/moses_cover.webp';
import mosesCoverSmall from '../../assets/images/moses_cover_sm.webp';
import yunusEmreCover from '../../assets/images/yunus_emre_cover.webp';
import yunusEmreCoverSmall from '../../assets/images/yunus_emre_cover_sm.webp';
import ibnJubayrCover from '../../assets/images/ibn_jubayr_cover.webp';
import ibnJubayrCoverSmall from '../../assets/images/ibn_jubayr_cover_sm.webp';
import prophetsIcon from '../../assets/images/prophets_icon.webp';
import civilizationIcon from '../../assets/images/civilization_icon.webp';
import scholarsIcon from '../../assets/images/scholars_icon.webp';
// Temporary mark until the drawn Our World Today emblem arrives.
import todayIcon from '../../assets/images/today_icon.webp';
// Temporary Green Deal cover until the drawn one arrives.
// Our World Today books share the collection emblem as a temporary cover until their own pictures are drawn.
import todayCoverTemp from '../../assets/images/today_cover_temp.webp';
import todayCoverTempSmall from '../../assets/images/today_cover_temp_sm.webp';

export type StoryCollectionId = 'prophets' | 'history' | 'turkish' | 'today';

export interface StoryCatalogItem extends ProphetStory {
  nameAr: string;
  descriptionAr: string;
  collection: StoryCollectionId;
  /** The book has no Arabic edition: the reader opens it in English and hides the language switch. */
  englishOnly?: boolean;
  /** Levels of the book that have no Arabic edition yet: they open in English. */
  englishOnlyLevels?: Level[];
  /** Never listed anywhere; opens only from a preview link (see hashRoute). */
  hidden?: boolean;
}

/**
 * The one place a collection's colours live. The home page reads these fields directly; the reader
 * publishes `readerTokens` as CSS variables on its root, which index.css maps to the `accent`,
 * `accent-strong`, `chrome`, `chrome-menu`, `page` and `page-deep` utilities.
 */
export interface CollectionVisual {
  id: StoryCollectionId;
  nameEn: string;
  nameAr: string;
  shortEn: string;
  shortAr: string;
  accent: string;
  accentBright: string;
  accentSoft: string;
  ambient: string;
  stage: string;
  summaryGradient: string;
  summaryCard: string;
  summaryButton: string;
  icon: string;
  readerTokens: ReaderTokens;
}

export interface ReaderTokens {
  /** Text and outline accent on the dark reader chrome. */
  accent: string;
  /** Filled controls (next button, active TOC row). */
  accentStrong: string;
  /** Header and footer surface. */
  chrome: string;
  /** Side menu and pop-over surface. */
  chromeMenu: string;
  /** Reading surface at A2/B1. */
  page: string;
  /** Slightly deeper reading surface at B2. */
  pageDeep: string;
  /** Eleven-step scale (50-950) behind the `brand-*` utilities used on light surfaces: cards, buttons, borders. */
  scale: BrandScale;
}

export type BrandShade = '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | '950';
export type BrandScale = Record<BrandShade, string>;

// Tailwind's own amber, emerald and sky scales, so the migrated components render exactly as before.
const amberScale: BrandScale = {
  '50': 'oklch(98.7% .022 95.277)', '100': 'oklch(96.2% .059 95.617)', '200': 'oklch(92.4% .12 95.746)',
  '300': 'oklch(87.9% .169 91.605)', '400': 'oklch(82.8% .189 84.429)', '500': 'oklch(76.9% .188 70.08)',
  '600': 'oklch(66.6% .179 58.318)', '700': 'oklch(55.5% .163 48.998)', '800': 'oklch(47.3% .137 46.201)',
  '900': 'oklch(41.4% .112 45.904)', '950': 'oklch(27.9% .077 45.635)',
};
const emeraldScale: BrandScale = {
  '50': 'oklch(97.9% .021 166.113)', '100': 'oklch(95% .052 163.051)', '200': 'oklch(90.5% .093 164.15)',
  '300': 'oklch(84.5% .143 164.978)', '400': 'oklch(76.5% .177 163.223)', '500': 'oklch(69.6% .17 162.48)',
  '600': 'oklch(59.6% .145 163.225)', '700': 'oklch(50.8% .118 165.612)', '800': 'oklch(43.2% .095 166.913)',
  '900': 'oklch(37.8% .077 168.94)', '950': 'oklch(26.2% .051 172.552)',
};
const coralScale: BrandScale = {
  '50': 'oklch(98% .016 50)', '100': 'oklch(95.4% .036 48)', '200': 'oklch(90.1% .07 45)',
  '300': 'oklch(83.7% .11 42)', '400': 'oklch(75% .15 38)', '500': 'oklch(70.5% .17 36)',
  '600': 'oklch(62% .175 34)', '700': 'oklch(53% .16 33)', '800': 'oklch(45.5% .13 33)',
  '900': 'oklch(39.5% .1 33)', '950': 'oklch(26.6% .07 33)',
};
const skyScale: BrandScale = {
  '50': 'oklch(97.7% .013 236.62)', '100': 'oklch(95.1% .026 236.824)', '200': 'oklch(90.1% .058 230.902)',
  '300': 'oklch(82.8% .111 230.318)', '400': 'oklch(74.6% .16 232.661)', '500': 'oklch(68.5% .169 237.323)',
  '600': 'oklch(58.8% .158 241.966)', '700': 'oklch(50% .134 242.749)', '800': 'oklch(44.3% .11 240.79)',
  '900': 'oklch(39.1% .09 240.876)', '950': 'oklch(29.3% .066 243.157)',
};

/** Confetti and other canvas colours that cannot read CSS variables: three mid shades of the scale. */
export const brandConfetti = (scale: BrandScale): string[] => [scale['600'], scale['500'], scale['300']];

/** The CSS variables a collection publishes; App sets them on <html> so portals and overlays see them too. */
export const readerTokenVariables = (tokens: ReaderTokens): Record<string, string> => ({
  '--accent': tokens.accent,
  '--accent-strong': tokens.accentStrong,
  '--chrome': tokens.chrome,
  '--chrome-menu': tokens.chromeMenu,
  '--page': tokens.page,
  '--page-deep': tokens.pageDeep,
  ...Object.fromEntries(Object.entries(tokens.scale).map(([shade, value]) => [`--brand-${shade}`, value])),
});

const covers: Record<string, { image: string; imageSmall?: string }> = {
  adam: { image: adamCover, imageSmall: adamCoverSmall },
  ibrahim: { image: abrahamCover, imageSmall: abrahamCoverSmall },
  musa: { image: mosesCover, imageSmall: mosesCoverSmall },
  mecca: { image: meccaCover, imageSmall: meccaCoverSmall },
  ibnJubayr: { image: ibnJubayrCover, imageSmall: ibnJubayrCoverSmall },
  yunusEmre: { image: yunusEmreCover, imageSmall: yunusEmreCoverSmall },
  gevherNesibe: { image: scholarsIcon },
  greenDeal: { image: todayCoverTemp, imageSmall: todayCoverTempSmall },
  zeroWaste: { image: todayCoverTemp, imageSmall: todayCoverTempSmall },
};

/** A book's cover picture (the content panel shows it too); a book without one gets the collection picture. */
export const storyCover = (storyId: string): { image: string; imageSmall?: string; placeholder: boolean } =>
  covers[storyId] && covers[storyId].image !== scholarsIcon ? { ...covers[storyId], placeholder: false } : { image: scholarsIcon, placeholder: true };

/**
 * The books themselves live in src/content/stories.json: name and description per language,
 * levels, collection. Only the cover pictures stay in code, because the bundler has to see them.
 * A new book, or a new language for a book, is a change to that file.
 */
const toCatalogItem = (story: StoryFile): StoryCatalogItem => ({
  id: story.id,
  name: story.text.en.name,
  nameAr: story.text.ar.name,
  description: story.text.en.description,
  descriptionAr: story.text.ar.description,
  image: covers[story.id]?.image ?? scholarsIcon,
  imageSmall: covers[story.id]?.imageSmall,
  availableLevels: story.availableLevels as Level[],
  collection: story.collection as StoryCollectionId,
  englishOnly: story.englishOnly,
  englishOnlyLevels: story.englishOnlyLevels as Level[] | undefined,
  hidden: story.hidden,
});

// A preview link (?gizli=…) also puts the hidden Our World Today books on the shelf, so the new
// collection can be seen as readers will see it. Other hidden books stay off the shelf.
const previewShelf = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('gizli');
export const storyCatalog: StoryCatalogItem[] = storyFile.stories
  .filter(story => !story.hidden || (previewShelf && story.collection === 'today'))
  .map(toCatalogItem);

/**
 * Books that are loaded in the app but not shown to anyone yet: they are kept out of
 * `storyCatalog`, so the home page, shelf, search, next-book links and result codes never
 * see them. They open only from a preview link: `?gizli=1#/<storyId>/<level>`.
 * A book is shown by removing its "hidden" line in src/content/stories.json.
 */
export const hiddenStoryCatalog: StoryCatalogItem[] = storyFile.stories.filter(story => story.hidden).map(toCatalogItem);


export const isHiddenStory = (storyId: string): boolean =>
  hiddenStoryCatalog.some(story => story.id === storyId);

/**
 * A level of a shown book that is loaded in the app but not on the shelf yet: it has a book file
 * (src/content/bookCatalog.json) but is missing from the book's availableLevels. Like a hidden
 * book, it opens only from a preview link: `?gizli=1#/<storyId>/<level>`.
 */
export const isHiddenEdition = (storyId: string, level: Level): boolean => {
  const story = storyFile.stories.find(item => item.id === storyId);
  return Boolean(story) && !story!.availableLevels.includes(level);
};

export const collectionStoryIds: Record<StoryCollectionId, string[]> = {
  prophets: storyCatalog.filter(story => story.collection === 'prophets').map(story => story.id),
  history: storyCatalog.filter(story => story.collection === 'history').map(story => story.id),
  turkish: storyCatalog.filter(story => story.collection === 'turkish').map(story => story.id),
  today: storyCatalog.filter(story => story.collection === 'today').map(story => story.id),
};

export const collectionVisuals: Record<StoryCollectionId, CollectionVisual> = {
  prophets: {
    id: 'prophets',
    nameEn: 'Stories of the Prophets',
    nameAr: 'قصص الأنبياء',
    shortEn: 'Prophets',
    shortAr: 'الأنبياء',
    accent: '#D8B35C',
    accentBright: '#F3D58A',
    accentSoft: 'rgba(216,179,92,0.14)',
    ambient: 'rgba(111,74,29,0.44)',
    stage: 'linear-gradient(135deg, #17140f 0%, #21180f 46%, #10130f 100%)',
    summaryGradient: 'linear-gradient(145deg, #130d09 0%, #2a180d 48%, #0c0d0a 100%)',
    summaryCard: 'rgba(216,179,92,0.075)',
    summaryButton: '#B7791F',
    icon: prophetsIcon,
    readerTokens: {
      accent: '#c2aa6b',
      accentStrong: '#b7791f',
      chrome: '#2a1d0c',
      chromeMenu: '#14221a',
      page: '#fff7ed',
      pageDeep: '#f4f1ea',
      scale: amberScale,
    },
  },
  history: {
    id: 'history',
    nameEn: 'Islamic History & Civilization',
    nameAr: 'التاريخ والحضارة الإسلامية',
    shortEn: 'History & Civilization',
    shortAr: 'التاريخ والحضارة',
    accent: '#55C997',
    accentBright: '#86EDBD',
    accentSoft: 'rgba(85,201,151,0.14)',
    ambient: 'rgba(14,95,65,0.40)',
    stage: 'linear-gradient(135deg, #0d1714 0%, #10251d 48%, #0b1512 100%)',
    summaryGradient: 'linear-gradient(145deg, #07140f 0%, #0d2a1d 48%, #06110d 100%)',
    summaryCard: 'rgba(85,201,151,0.075)',
    summaryButton: '#16865F',
    icon: civilizationIcon,
    readerTokens: {
      accent: '#34d399',
      accentStrong: '#059669',
      chrome: '#022c22',
      chromeMenu: '#042416',
      page: '#f4f7f5',
      pageDeep: '#edf2ee',
      scale: emeraldScale,
    },
  },
  turkish: {
    id: 'turkish',
    nameEn: 'Turkish-Islamic Heritage',
    nameAr: 'التراث التركي الإسلامي',
    shortEn: 'Turkish-Islamic Heritage',
    shortAr: 'التراث التركي الإسلامي',
    accent: '#58CBE0',
    accentBright: '#8AE8F5',
    accentSoft: 'rgba(88,203,224,0.14)',
    ambient: 'rgba(22,88,108,0.42)',
    stage: 'linear-gradient(135deg, #0b1418 0%, #10242b 48%, #0a1216 100%)',
    summaryGradient: 'linear-gradient(145deg, #071116 0%, #0c2730 48%, #061015 100%)',
    summaryCard: 'rgba(88,203,224,0.075)',
    summaryButton: '#137D93',
    icon: scholarsIcon,
    readerTokens: {
      accent: '#22d3ee',
      accentStrong: '#0369a1',
      chrome: '#0d1d2c',
      chromeMenu: '#0a1826',
      page: '#f2f6f9',
      pageDeep: '#eaf0f4',
      scale: skyScale,
    },
  },
  today: {
    id: 'today',
    nameEn: 'Our World Today',
    nameAr: 'عَالَمُنَا الْيَوْمَ',
    shortEn: 'Our World Today',
    shortAr: 'عَالَمُنَا الْيَوْمَ',
    accent: '#E8836B',
    accentBright: '#F6A890',
    accentSoft: 'rgba(232,131,107,0.14)',
    ambient: 'rgba(122,52,34,0.42)',
    stage: 'linear-gradient(135deg, #18110e 0%, #2a1912 48%, #120d0b 100%)',
    summaryGradient: 'linear-gradient(145deg, #140b08 0%, #2e170f 48%, #0f0a08 100%)',
    summaryCard: 'rgba(232,131,107,0.075)',
    summaryButton: '#B85A43',
    icon: todayIcon,
    readerTokens: {
      accent: '#f0a08a',
      accentStrong: '#c2410c',
      chrome: '#2c140c',
      chromeMenu: '#24100a',
      page: '#fdf6f2',
      pageDeep: '#f6ece6',
      scale: coralScale,
    },
  },
};

/** The visual set for a collection id that may come from a loosely typed prop; unknown ids fall back to Prophets. */
export const collectionVisualFor = (collectionId?: string): CollectionVisual =>
  collectionVisuals[(collectionId ?? 'prophets') as StoryCollectionId] ?? collectionVisuals.prophets;

export const getStoryCollection = (storyId: string): StoryCollectionId =>
  getStoryMeta(storyId)?.collection ?? 'prophets';

export const getStoryMeta = (storyId: string): StoryCatalogItem | undefined =>
  storyCatalog.find(story => story.id === storyId) ?? hiddenStoryCatalog.find(story => story.id === storyId);

/** True when this edition has no Arabic text: the whole book is English-only, or just this level. */
export const isEnglishOnlyEdition = (storyId: string, level: Level): boolean => {
  const meta = getStoryMeta(storyId);
  return Boolean(meta && (meta.englishOnly || meta.englishOnlyLevels?.includes(level)));
};

export const getNextLevel = (level: Level): Level | null => {
  const levels: Level[] = ['A1', 'A2', 'B1', 'B2'];
  const index = levels.indexOf(level);
  return index >= 0 && index < levels.length - 1 ? levels[index + 1] : null;
};
