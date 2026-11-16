import type React from 'react';

/** Small glyphs drawn inside map markers and card chips. */
export type StoryMapIcon = 'quill' | 'dome' | 'swords' | 'route' | 'kaaba' | 'well' | 'mountain' | 'waves' | 'palm' | 'tent' | 'city' | 'palace';

/** Which generated base map a story map is drawn on. */
export type StoryMapBaseMapId = 'anatolia' | 'nearEast' | 'mediterranean' | 'centralAsia';

/** Historical overlays drawn as soft, approximate shapes over the base map. */
export type StoryMapOverlay = 'seljuk-1243' | 'mongol-1243' | 'ilkhanate-1308';

export type StoryMapLegendKey = StoryMapOverlay | 'seljuk-pressure' | `route:${string}`;

export type StoryMapLabelSide = 'right' | 'left' | 'top' | 'bottom';

/** Language-neutral position and look of one place. Shared by the EN and AR editions. */
export interface StoryMapPlaceLayout {
  id: string;
  lon: number;
  lat: number;
  icon: StoryMapIcon;
  /** `event` is drawn in the battle colour; `place` in the book's accent. */
  tone: 'place' | 'event';
  /** A region rather than a point: a soft circle of this radius appears when it is selected. */
  areaRadiusKm?: number;
  /** Keep the region's soft circle visible all the time, not only when selected. */
  showArea?: boolean;
  labelSide?: StoryMapLabelSide;
  /** The Places & People card with this place's picture, shown under the place's text. */
  entityId?: string;
}

/** Manually authored card text for one place, in one language. */
export interface StoryMapPlaceCopy {
  name: string;
  kind: string;
  text: string;
  /** Shown to teachers only. */
  teacherNote?: string;
  /** A question for the class, shown to teachers only. */
  question?: string;
}

export interface StoryMapNamedPoint {
  id: string;
  lon: number;
  lat: number;
  name: string;
  labelSide?: 'right' | 'bottom';
}

/** Where the camera goes for one dated event: a centre in degrees and a zoom (1 = whole map). */
export interface StoryMapCamera {
  lon: number;
  lat: number;
  zoom: number;
}

/**
 * A short scene that plays on the map while its event is the current one, so every date on the
 * time line shows something happening, not only a camera move.
 * - dawn: soft light rises over a place (a birth).
 * - radiate: light and rings spread out from a city (a teacher's words reaching people).
 * - journey: travel lines draw from one place to others, then a wide glow spreads (a life's legacy).
 */
export type StoryMapEventScene =
  | { kind: 'dawn'; placeId: string }
  | { kind: 'radiate'; placeId: string; reach?: string[] }
  | { kind: 'journey'; fromId: string; toIds: string[] };

export interface StoryMapTimelineEvent {
  /** A year, or in `stages` mode the step number (1, 2, 3 …). */
  year: number;
  /** In `stages` mode: the chapter where this step happens, shown on the step button. */
  chapter?: number;
  placeId: string;
  camera: StoryMapCamera;
  scene?: StoryMapEventScene;
}

export interface StoryMapTimelineItem extends StoryMapTimelineEvent {
  label: string;
}

/** Which interactive tools a map offers. Each level switches on what suits its learners. */
export interface StoryMapFeatures {
  timeSlider: boolean;
  tour: boolean;
  challenge: boolean;
  classroom: boolean;
}

/** The place a learner has to find in the "tap the map" challenge. The accepted answer is a circle. */
export interface StoryMapChallengeTarget {
  id: string;
  lon: number;
  lat: number;
  radiusKm: number;
}

export interface StoryMapChallengeQuestion extends StoryMapChallengeTarget {
  prompt: React.ReactNode;
}

export interface StoryMapLayout {
  baseMap: StoryMapBaseMapId;
  /** The part of the base map the reader sees first, in degrees. */
  home: { west: number; east: number; south: number; north: number };
  overlays: StoryMapOverlay[];
  features: StoryMapFeatures;
  /**
   * The slider runs from `start` to the end of `lastYear`. `birth` is used for the age line.
   * `stages` is for stories without dates: the steps follow the chapters instead of years.
   */
  time: { start: number; lastYear: number; birth: number; mode?: 'years' | 'stages' };
  /** Journeys drawn along the time line: a route draws itself between `start` and `end`. */
  routes?: StoryMapRoute[];
  places: StoryMapPlaceLayout[];
  towns: Array<{ id: string; lon: number; lat: number; labelSide?: 'right' | 'bottom' }>;
  seas: Array<{ id: string; lon: number; lat: number }>;
  timeline: StoryMapTimelineEvent[];
  challenge?: StoryMapChallengeTarget[];
}

export interface StoryMapRoute {
  id: string;
  points: Array<[number, number]>;
  start: number;
  end: number;
  /** `army` is drawn in the battle colour, `journey` in the book's accent. */
  tone: 'journey' | 'army';
}

/**
 * The age line shown with the year. The book files are JSON, so `alive` and `died` are sentences
 * with a `{years}` slot ("Yunus Emre is about {years} old."); the page fills it with the age in the
 * reader's digits and the right word for "years".
 */
export interface StoryMapAgeCopy {
  born: string;
  alive: string;
  died: string;
}

export interface StoryMapCopy {
  places: Record<string, StoryMapPlaceCopy>;
  towns: Record<string, string>;
  seas: Record<string, string>;
  timeline: Record<number, string>;
  legend: Partial<Record<StoryMapLegendKey, string>>;
  /** Only for maps in `years` mode. */
  age?: StoryMapAgeCopy;
  /** One prompt per challenge target id. */
  challenge?: Record<string, string>;
}

export interface StoryMapPlace extends StoryMapPlaceLayout, StoryMapPlaceCopy {}

/** A complete map for one page in one language. */
export interface StoryMap {
  baseMap: StoryMapBaseMapId;
  home: StoryMapLayout['home'];
  overlays: StoryMapOverlay[];
  features: StoryMapFeatures;
  time: StoryMapLayout['time'];
  legend: StoryMapCopy['legend'];
  age?: StoryMapAgeCopy;
  routes: StoryMapRoute[];
  places: StoryMapPlace[];
  towns: StoryMapNamedPoint[];
  seas: StoryMapNamedPoint[];
  timeline: StoryMapTimelineItem[];
  challenge: StoryMapChallengeQuestion[];
}
