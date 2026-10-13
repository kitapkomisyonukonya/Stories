import type { HistoricalEntity, HistoricalEntityCopy, HistoricalEntityKind, HistoricalMapFocus } from '../types';
import { GROUP_OF_KIND } from '../categories';
import { MEDITERRANEAN_MAP_ASPECT, mediterraneanContextMap } from '../mediterraneanMap';

// Cards for the bilingual books (English and Arabic). The copy is written once
// per story and shown at every level, so it stays simple and never goes beyond
// what the story texts say. The `more` line shows on the Places page only.

type CardText = Omit<HistoricalEntityCopy, 'mapAlt' | 'approximateLabel'>;

export interface EntitySpec {
  id: string;
  kind: HistoricalEntityKind;
  aliases: { en: string[]; ar: string[] };
  copy: { en: CardText; ar: CardText };
  /** The usual Turkish name, shown in brackets after the title. */
  tr?: string;
  focus?: HistoricalMapFocus;
  /** Where its square picture will be: assets/pictures/<folder>/<name>.webp. */
  picture?: { folder: string; name: string };
  sources: string[];
}

const NOTES = {
  en: { point: 'Location shown on a regional map', area: 'Area shown approximately', group: 'Lands shown approximately' },
  ar: { point: 'الْمَوْقِعُ عَلَى خَرِيطَةٍ إِقْلِيمِيَّةٍ', area: 'الْمِنْطَقَةُ تَقْرِيبِيَّةٌ', group: 'الْأَرَاضِي تَقْرِيبِيَّةٌ' },
};

const mapAlt = (locale: 'en' | 'ar', title: string, isGroup: boolean) => (
  locale === 'en'
    ? (isGroup ? `Map showing the lands of ${title}.` : `Map showing where ${title} is.`)
    : (isGroup ? `خَرِيطَةٌ تُبَيِّنُ أَرَاضِيَ ${title}.` : `خَرِيطَةٌ تُبَيِّنُ مَوْقِعَ ${title}.`)
);

export const defineEntity = ({ id, kind, aliases, copy, tr, focus, picture, sources }: EntitySpec): HistoricalEntity => {
  // One person is not a group: their map shows where they lived or the land they ruled.
  const isGroup = GROUP_OF_KIND[kind] === 'people' && kind !== 'person';
  const isArea = Boolean(focus && focus.mode !== 'point');
  const note = isGroup ? 'group' : isArea ? 'area' : 'point';
  const build = (locale: 'en' | 'ar'): HistoricalEntityCopy => ({
    ...copy[locale],
    mapAlt: focus ? mapAlt(locale, copy[locale].title, isGroup) : '',
    ...(focus ? { approximateLabel: NOTES[locale][note] } : {}),
  });
  return {
    id,
    kind,
    aliases,
    copy: { en: build('en'), ar: build('ar') },
    ...(focus ? { mapAsset: mediterraneanContextMap, mapAspect: MEDITERRANEAN_MAP_ASPECT, focus, showFocus: true } : {}),
    approximate: isArea || isGroup,
    ...(picture ? { picture } : {}),
    ...(tr ? { learnerNames: { tr } } : {}),
    sources,
  };
};
