/**
 * Seyahatname: which place each chapter stamp carries. Built from the book's own journey map, so a stamp
 * never names a place the book does not put at that chapter. Pure functions; the build script
 * (scripts/content/buildSeyahatname.ts) runs them over every book and writes src/content/seyahatname.json.
 */

/** Line drawings in the middle of a stamp. */
export type StampIcon =
  | 'minaret' | 'walls' | 'arches' | 'ship' | 'lighthouse' | 'cube' | 'dome' | 'palm'
  | 'mountain' | 'tent' | 'well' | 'quill' | 'waves' | 'route' | 'book' | 'flame';

export interface EditionPlace {
  id: string;
  en: string;
  ar?: string;
  kind: string;
  kindAr?: string;
  /** Chapters (1-based) the map ties to this place. */
  chapters: number[];
}

export interface EditionChapter {
  /** The place on the stamp; absent when the map ties no place to the chapter. */
  place?: string;
  icon: StampIcon;
}

export interface EditionIndex {
  chapters: EditionChapter[];
  places: EditionPlace[];
  /** Page index (0-based) of each chapter, and of the journey map, for links into the book. */
  pages: number[];
  mapPage?: number;
  /** Quick Challenge id of each chapter, English and Arabic: a chapter is stamped when either is done. */
  quick: { en: string[]; ar: string[] };
}

interface MapPlaceLike { id: string; name?: string; kind?: string; icon?: string; teacherNote?: string }
interface MapLike { places?: MapPlaceLike[]; timeline?: { chapter?: number; placeId: string }[] }
interface PageLike { type: string; map?: MapLike; exercises?: { id: string }[] }
interface BookLike { pages: PageLike[] }

/** "Chapter 1.", "Chapters 2, 4 and 13", "Chapters 3–5" → [1], [2, 4, 13], [3, 4, 5]. */
export const chapterNumbersIn = (text: string | undefined): number[] => {
  if (!text) return [];
  const found = new Set<number>();
  for (const match of text.matchAll(/\bChapters?\s+((?:\d+\s*(?:[-–]\s*\d+)?\s*(?:,|and|&)?\s*)+)/gi)) {
    for (const part of match[1].matchAll(/(\d+)(?:\s*[-–]\s*(\d+))?/g)) {
      const from = Number(part[1]);
      const to = part[2] ? Number(part[2]) : from;
      for (let n = from; n <= Math.min(to, from + 40); n += 1) found.add(n);
    }
  }
  return [...found].sort((a, b) => a - b);
};

const ICON_FOR_MAP: Record<string, StampIcon> = {
  kaaba: 'cube', palm: 'palm', waves: 'waves', palace: 'arches', dome: 'dome', city: 'minaret',
  mountain: 'mountain', tent: 'tent', well: 'well', quill: 'quill', route: 'route', swords: 'route',
};

const stampIconFor = (place: MapPlaceLike | undefined, beforeIslam: boolean): StampIcon => {
  if (!place) return 'book';
  if (/mecca|makkah/i.test(place.id)) return 'cube';
  if (place.id === 'alexandria') return 'lighthouse';
  if (place.id === 'fire') return 'flame';
  if (/port/i.test(place.kind ?? '')) return 'ship';
  const icon = ICON_FOR_MAP[place.icon ?? ''] ?? 'minaret';
  // No minarets in books set before Islam: their towns get a walled gate.
  return beforeIslam && icon === 'minaret' ? 'walls' : icon;
};

export const buildEditionIndex = (en: BookLike, ar: BookLike | null, { beforeIslam = false } = {}): EditionIndex => {
  const stories = en.pages.filter(page => page.type === 'story');
  const pages = en.pages.flatMap((page, index) => (page.type === 'story' ? [index] : []));
  const mapIndex = en.pages.findIndex(page => page.type === 'map');
  const arStories = ar?.pages.filter(page => page.type === 'story') ?? [];
  const map = en.pages.find(page => page.type === 'map')?.map;
  const arMap = ar?.pages.find(page => page.type === 'map')?.map;
  const mapPlaces = map?.places ?? [];
  const timeline = (map?.timeline ?? []).filter(step => typeof step.chapter === 'number');

  const places: EditionPlace[] = mapPlaces.map(place => {
    const arPlace = arMap?.places?.find(item => item.id === place.id);
    const chapters = new Set(chapterNumbersIn(place.teacherNote));
    timeline.filter(step => step.placeId === place.id).forEach(step => chapters.add(step.chapter as number));
    return {
      id: place.id,
      en: place.name ?? place.id,
      ...(arPlace?.name ? { ar: arPlace.name } : {}),
      kind: place.kind ?? '',
      ...(arPlace?.kind ? { kindAr: arPlace.kind } : {}),
      chapters: [...chapters].filter(n => n >= 1 && n <= stories.length).sort((a, b) => a - b),
    };
  });

  const chapters: EditionChapter[] = stories.map((_, index) => {
    const n = index + 1;
    // The journey step that starts in this chapter, else a place whose map note names the chapter.
    // No guessing beyond that: a chapter the map does not place gets a stamp with the book's name.
    const exact = timeline.find(step => step.chapter === n)?.placeId;
    const noted = places.find(place => place.chapters.includes(n))?.id;
    const id = [exact, noted].find(candidate => candidate && places.some(place => place.id === candidate));
    const mapPlace = mapPlaces.find(place => place.id === id);
    return id ? { place: id, icon: stampIconFor(mapPlace, beforeIslam) } : { icon: 'book' };
  });

  return {
    chapters,
    places,
    pages,
    ...(mapIndex >= 0 ? { mapPage: mapIndex } : {}),
    quick: {
      en: stories.map(page => page.exercises?.[0]?.id ?? ''),
      ar: arStories.map(page => page.exercises?.[0]?.id ?? ''),
    },
  };
};
