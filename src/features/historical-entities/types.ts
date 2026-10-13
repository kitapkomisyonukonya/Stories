export type HistoricalEntityLocale = 'en' | 'ar';

/** The learner's own language, shown as a small "name in your language" line. */
export type LearnerLanguage = 'tr';

export type HistoricalEntityKind =
  | 'city'
  | 'kingdom'
  | 'region'
  | 'country'
  | 'sea'
  | 'river'
  | 'island'
  | 'spring'
  | 'landmark'
  | 'people'
  | 'tribe'
  | 'dynasty'
  | 'person'
  | 'empire';

export type HistoricalMapFocus =
  | {
      mode: 'point';
      x: number;
      y: number;
      /** Card map zoom around the point. 1 shows the whole map. */
      zoom?: number;
    }
  | {
      mode: 'area';
      x: number;
      y: number;
      width: number;
      height: number;
      rotate?: number;
      zoom?: number;
    }
  | {
      /**
       * Shapes lit up on the map: a sea, a river, an island, a land or the
       * lands a people ruled. Arrows show where a people came from; pins mark a
       * city. x/y place the title label. All values are percentages of the map.
       */
      mode: 'feature';
      features: string[];
      x: number;
      y: number;
      zoom?: number;
      arrows?: { fromX: number; fromY: number; toX: number; toY: number }[];
      pins?: { x: number; y: number; label: string; labelAr?: string }[];
      /**
       * Slide the map out to show lands beyond the usual frame (e.g. where the
       * Mongols came from). x/y are the top-left corner of the view, in map
       * percentages; scale below 1 zooms out onto the wide map.
       */
      view?: { x: number; y: number; scale: number };
    };

export interface HistoricalEntityCopy {
  title: string;
  kindLabel: string;
  periodLabel: string;
  summary: string;
  /** One more short sentence, shown on the Places page only. */
  more?: string;
  mapAlt: string;
  approximateLabel?: string;
}

export type HistoricalMapAsset = string | Record<HistoricalEntityLocale, string>;

export interface HistoricalEntity {
  id: string;
  kind: HistoricalEntityKind;
  aliases: Partial<Record<HistoricalEntityLocale, string[]>>;
  /** English is required; other editions fall back to it until they are written. */
  copy: { en: HistoricalEntityCopy } & Partial<Record<HistoricalEntityLocale, HistoricalEntityCopy>>;
  /** Optional: a card without a map shows only its text. */
  mapAsset?: HistoricalMapAsset;
  /** CSS aspect ratio of the map image, e.g. '800 / 537'. Defaults to 4 / 3. */
  mapAspect?: string;
  focus?: HistoricalMapFocus;
  /**
   * Draw the focus on top of a plain context map. Off for maps that already
   * carry their own marker artwork.
   */
  showFocus?: boolean;
  approximate: boolean;
  /** The usual name in the learner's own language, when there is one. */
  learnerNames?: Partial<Record<LearnerLanguage, string>>;
  sources: string[];
  /** A square picture in assets/pictures/<folder>/<name>.webp, once it has been drawn. */
  picture?: { folder: string; name: string };
}
