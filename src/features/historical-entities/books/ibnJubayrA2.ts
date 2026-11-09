import type { HistoricalEntity, HistoricalEntityCopy, HistoricalEntityKind, HistoricalMapFocus } from '../types';
import { GROUP_OF_KIND } from '../categories';
import { MEDITERRANEAN_MAP_ASPECT, mediterraneanContextMap, medFeature, medPoint } from '../mediterraneanMap';

// Places and historical names in Ibn Jubayr A2 (English only).
// Copy is A2 English: short sentences and story words. The Turkish name sits in
// `learnerNames.tr` and shows in brackets after the title, e.g. "Damascus (Şam)".

const POINT_NOTE = 'Location shown on a regional map';
const AREA_NOTE = 'Area shown approximately';
const GROUP_NOTE = 'Lands shown approximately';

interface PlaceInput {
  id: string;
  kind: HistoricalEntityKind;
  aliases: string[];
  title: string;
  kindLabel: string;
  periodLabel: string;
  summary: string;
  /** One more short sentence, on the Places page only. */
  more?: string;
  tr?: string;
  focus?: HistoricalMapFocus;
  sources: string[];
}

const place = ({ id, kind, aliases, title, kindLabel, periodLabel, summary, more, tr, focus, sources }: PlaceInput): HistoricalEntity => {
  const hasMap = Boolean(focus);
  const isGroup = GROUP_OF_KIND[kind] === 'people';
  const isArea = isGroup || GROUP_OF_KIND[kind] === 'lands';
  const copy: HistoricalEntityCopy = {
    title,
    kindLabel,
    periodLabel,
    summary,
    ...(more ? { more } : {}),
    mapAlt: !hasMap ? '' : isGroup ? `Map showing the lands of ${title}.` : `Map showing where ${title} is.`,
    ...(hasMap ? { approximateLabel: isGroup ? GROUP_NOTE : isArea ? AREA_NOTE : POINT_NOTE } : {}),
  };
  return {
    id,
    kind,
    aliases: { en: aliases },
    copy: { en: copy },
    ...(focus ? { mapAsset: mediterraneanContextMap, mapAspect: MEDITERRANEAN_MAP_ASPECT, focus, showFocus: true } : {}),
    approximate: isArea,
    picture: { folder: 'andalus', name: id.replace(/^ibnjubayr-/, '') },
    ...(tr ? { learnerNames: { tr } } : {}),
    sources,
  };
};

const CITY_ZOOM = 1.8;
// Sources are TDV İslâm Ansiklopedisi article titles, for the teacher's check.

const entities: HistoricalEntity[] = [
  // Cities
  place({
    id: 'ibnjubayr-valencia', kind: 'city', aliases: ['Valencia'],
    title: 'Valencia', kindLabel: 'City', periodLabel: 'Al-Andalus · Spain',
    summary: 'Valencia is a city on the east coast of Spain, near the Mediterranean Sea. Ibn Jubayr was born here in 1145.',
    more: 'Today, it is the third biggest city in Spain.',
    tr: 'Valensiya', focus: medPoint(39.47, -0.38, CITY_ZOOM),
    sources: ['TDV İslâm Ansiklopedisi: Belensiye'],
  }),
  place({
    id: 'ibnjubayr-granada', kind: 'city', aliases: ['Granada'],
    title: 'Granada', kindLabel: 'City', periodLabel: 'Al-Andalus · Spain',
    summary: 'Granada is a city in the south of Spain, near high mountains. Ibn Jubayr worked here. His long journey started and ended here.',
    more: 'The famous Alhambra palace is in Granada.',
    tr: 'Gırnata', focus: medPoint(37.18, -3.6, CITY_ZOOM),
    sources: ['TDV İslâm Ansiklopedisi: Gırnata'],
  }),
  place({
    id: 'ibnjubayr-seville', kind: 'city', aliases: ['Sevilla', 'Seville'],
    title: 'Sevilla', kindLabel: 'City', periodLabel: 'Al-Andalus · Spain',
    summary: 'Sevilla (Seville) is a city in the south-west of Spain, on a big river. In Al-Andalus, it was a large and rich city.',
    more: 'Its big river is the Guadalquivir.',
    tr: 'İşbîliye', focus: medPoint(37.39, -5.98, CITY_ZOOM),
    sources: ['TDV İslâm Ansiklopedisi: İşbîliye'],
  }),
  place({
    id: 'ibnjubayr-cordoba', kind: 'city', aliases: ['Córdoba', 'Cordoba'],
    title: 'Córdoba', kindLabel: 'City', periodLabel: 'Al-Andalus · Spain',
    summary: 'Córdoba is a city in the south of Spain. For a long time, it was the capital of Al-Andalus and a great city of learning.',
    more: 'Its Great Mosque is one of the most famous buildings in Spain.',
    tr: 'Kurtuba', focus: medPoint(37.88, -4.78, CITY_ZOOM),
    sources: ['TDV İslâm Ansiklopedisi: Kurtuba'],
  }),
  place({
    id: 'ibnjubayr-ceuta', kind: 'city', aliases: ['Ceuta'],
    title: 'Ceuta', kindLabel: 'Port city', periodLabel: 'North Africa',
    summary: 'Ceuta is a port city in North Africa, across the sea from Spain. Here, Ibn Jubayr got on a ship to the east.',
    more: 'It is on the narrow sea between Africa and Europe.',
    tr: 'Sebte', focus: medPoint(35.89, -5.32, CITY_ZOOM),
    sources: ['TDV İslâm Ansiklopedisi: Sebte'],
  }),
  place({
    id: 'ibnjubayr-genoa', kind: 'city', aliases: ['Genoese', 'Genoa'],
    title: 'Genoa', kindLabel: 'Port city', periodLabel: 'Italy',
    summary: 'Genoa is a port city in the north-west of Italy. In the Middle Ages, its ships carried people and goods across the Mediterranean. "Genoese" means "from Genoa".',
    more: 'Ibn Jubayr sailed on a Genoese ship from Ceuta to Alexandria.',
    tr: 'Cenova', focus: medPoint(44.41, 8.93, 1.4),
    sources: [],
  }),
  place({
    id: 'ibnjubayr-alexandria', kind: 'city', aliases: ['Alexandria'],
    title: 'Alexandria', kindLabel: 'Port city', periodLabel: 'Egypt',
    summary: 'Alexandria is a port city in Egypt, on the Mediterranean Sea. Ibn Jubayr arrived here by ship. At the end of his life, he died here.',
    more: 'Alexander the Great started the city a very long time ago.',
    tr: 'İskenderiye', focus: medPoint(31.2, 29.92, CITY_ZOOM),
    sources: ['TDV İslâm Ansiklopedisi: İskenderiye'],
  }),
  place({
    id: 'ibnjubayr-cairo', kind: 'city', aliases: ['Cairo'],
    title: 'Cairo', kindLabel: 'City', periodLabel: 'Egypt',
    summary: 'Cairo is a big city in Egypt, near the Nile River. In Ibn Jubayr’s time, it was the capital of Saladin’s state.',
    more: 'Today, it is the capital of Egypt and one of the biggest cities in Africa.',
    tr: 'Kahire', focus: medPoint(30.04, 31.24, CITY_ZOOM),
    sources: ['TDV İslâm Ansiklopedisi: Kahire'],
  }),
  place({
    id: 'ibnjubayr-mecca', kind: 'city', aliases: ['Mecca'],
    title: 'Mecca', kindLabel: 'Holy city', periodLabel: 'Western Arabia',
    summary: 'Mecca is the holy city of Islam, in western Arabia. The Ka’bah is here. Muslims come to Mecca for Hajj.',
    more: 'Ibn Jubayr stayed in Mecca for more than eight months.',
    tr: 'Mekke', focus: medPoint(21.42, 39.83, CITY_ZOOM),
    sources: ['TDV İslâm Ansiklopedisi: Mekke'],
  }),
  place({
    id: 'ibnjubayr-medina', kind: 'city', aliases: ['Medina'],
    title: 'Medina', kindLabel: 'Holy city', periodLabel: 'Western Arabia',
    summary: 'Medina is a holy city in western Arabia, north of Mecca. The Prophet Muhammad (pbuh) lived here, and his mosque is here.',
    more: 'Ibn Jubayr stayed in Medina for five nights.',
    tr: 'Medine', focus: medPoint(24.47, 39.61, CITY_ZOOM),
    sources: ['TDV İslâm Ansiklopedisi: Medine'],
  }),
  place({
    id: 'ibnjubayr-baghdad', kind: 'city', aliases: ['Baghdad'],
    title: 'Baghdad', kindLabel: 'City', periodLabel: 'Iraq',
    summary: 'Baghdad is a big city on the Tigris River, in today’s Iraq. For a long time, it was the capital of the Abbasids.',
    more: 'In Ibn Jubayr’s time, it had many bathhouses and mosques.',
    tr: 'Bağdat', focus: medPoint(33.31, 44.36, CITY_ZOOM),
    sources: ['TDV İslâm Ansiklopedisi: Bağdat'],
  }),
  place({
    id: 'ibnjubayr-mosul', kind: 'city', aliases: ['Mosul'],
    title: 'Mosul', kindLabel: 'City', periodLabel: 'Iraq',
    summary: 'Mosul is an old city on the Tigris River, in the north of today’s Iraq.',
    more: 'Ibn Jubayr visited Mosul on his journey.',
    tr: 'Musul', focus: medPoint(36.34, 43.13, CITY_ZOOM),
    sources: ['TDV İslâm Ansiklopedisi: Musul'],
  }),
  place({
    id: 'ibnjubayr-aleppo', kind: 'city', aliases: ['Aleppo'],
    title: 'Aleppo', kindLabel: 'City', periodLabel: 'Syria',
    summary: 'Aleppo is one of the oldest cities in the world. It is in the north of Syria and has a famous castle on a hill.',
    more: 'Ibn Jubayr went through Aleppo on his way to Damascus.',
    tr: 'Halep', focus: medPoint(36.2, 37.16, CITY_ZOOM),
    sources: ['TDV İslâm Ansiklopedisi: Halep'],
  }),
  place({
    id: 'ibnjubayr-damascus', kind: 'city', aliases: ['Damascus'],
    title: 'Damascus', kindLabel: 'City', periodLabel: 'Syria',
    summary: 'Damascus is a very old city in Syria. It was the capital of the Umayyads, and its Great Mosque is famous.',
    more: 'Ibn Jubayr wrote a lot about its Great Mosque.',
    tr: 'Şam', focus: medPoint(33.51, 36.29, CITY_ZOOM),
    sources: ['TDV İslâm Ansiklopedisi: Şam'],
  }),
  place({
    id: 'ibnjubayr-jerusalem', kind: 'city', aliases: ['Jerusalem'],
    title: 'Jerusalem', kindLabel: 'Holy city', periodLabel: 'Palestine',
    summary: 'Jerusalem is a holy city for Muslims, Christians and Jews. Al-Aqsa Mosque is here.',
    more: 'In 1187, Saladin took Jerusalem back from the Crusaders.',
    tr: 'Kudüs', focus: medPoint(31.78, 35.23, CITY_ZOOM),
    sources: ['TDV İslâm Ansiklopedisi: Kudüs'],
  }),
  place({
    id: 'ibnjubayr-acre', kind: 'city', aliases: ['Acre'],
    title: 'Acre', kindLabel: 'Port city', periodLabel: 'Palestine',
    summary: 'Acre is an old port city on the coast of Palestine. In Ibn Jubayr’s time, the Crusaders ruled it.',
    more: 'Ibn Jubayr waited here for nearly two weeks for good winds.',
    tr: 'Akkâ', focus: medPoint(32.93, 35.07, CITY_ZOOM),
    sources: ['TDV İslâm Ansiklopedisi: Akkâ'],
  }),

  // Lands and regions
  place({
    id: 'ibnjubayr-al-andalus', kind: 'region', aliases: ['Al-Andalus'],
    title: 'Al-Andalus', kindLabel: 'Historical land', periodLabel: '711–1492',
    summary: 'Al-Andalus was the name of the Muslim lands in Spain and Portugal. Its borders changed many times.',
    more: 'Muslims, Christians and Jews lived side by side here.',
    tr: 'Endülüs', focus: medFeature('al-andalus', 38.2, -4.4, 1.3),
    sources: ['TDV İslâm Ansiklopedisi: Endülüs'],
  }),
  place({
    id: 'ibnjubayr-north-africa', kind: 'region', aliases: ['North Africa'],
    title: 'North Africa', kindLabel: 'Region', periodLabel: 'Africa',
    summary: 'North Africa is the north part of Africa, along the Mediterranean Sea.',
    more: 'Ibn Jubayr started his sea journey from Ceuta, a city in North Africa.',
    tr: 'Kuzey Afrika', focus: medFeature('north-africa', 31, 6),
    sources: [],
  }),
  place({
    id: 'ibnjubayr-egypt', kind: 'country', aliases: ['Egypt'],
    title: 'Egypt', kindLabel: 'Country', periodLabel: 'North-east Africa',
    summary: 'Egypt is a country in the north-east of Africa. The Nile River runs through it from south to north.',
    more: 'Cairo and Alexandria are two big cities in Egypt.',
    tr: 'Mısır', focus: medFeature('egypt', 26.5, 29.8, 1.3),
    sources: [],
  }),
  place({
    id: 'ibnjubayr-syria', kind: 'region', aliases: ['Syria'],
    title: 'Syria', kindLabel: 'Historical land', periodLabel: 'East of the Mediterranean',
    summary: 'In the Middle Ages, Syria was a large land east of the Mediterranean Sea. Aleppo and Damascus were its great cities.',
    more: 'Ibn Jubayr traveled through northern Syria to Damascus.',
    tr: 'Suriye', focus: medFeature('syria', 34.6, 38, 1.6),
    sources: ['TDV İslâm Ansiklopedisi: Suriye'],
  }),
  place({
    id: 'ibnjubayr-palestine', kind: 'region', aliases: ['Palestine'],
    title: 'Palestine', kindLabel: 'Historical land', periodLabel: 'East of the Mediterranean',
    summary: 'Palestine is a land on the east coast of the Mediterranean Sea. Jerusalem is its most famous city.',
    more: 'In Ibn Jubayr’s time, the Crusaders ruled it.',
    tr: 'Filistin', focus: medFeature('palestine', 31.2, 34.9, 2.2),
    sources: ['TDV İslâm Ansiklopedisi: Filistin'],
  }),
  place({
    id: 'ibnjubayr-kingdom-of-jerusalem', kind: 'kingdom', aliases: ['Kingdom of Jerusalem'],
    title: 'Kingdom of Jerusalem', kindLabel: 'Crusader state', periodLabel: '1099–1291',
    summary: 'The Kingdom of Jerusalem was a Christian state. The Crusaders started it in 1099. Acre was its main port.',
    more: 'Ibn Jubayr stayed here for about a month.',
    tr: 'Kudüs Krallığı', focus: medFeature('kingdom-of-jerusalem', 31.6, 35.3, 2),
    sources: [],
  }),

  // Seas, rivers and islands
  place({
    id: 'ibnjubayr-mediterranean', kind: 'sea', aliases: ['Mediterranean'],
    title: 'The Mediterranean Sea', kindLabel: 'Sea', periodLabel: 'Between Europe, Africa and Asia',
    summary: 'The Mediterranean is a big sea between Europe, Africa and Asia. Ibn Jubayr crossed it two times, to the east and back.',
    more: 'In the twelfth century, storms and wars made it very dangerous.',
    tr: 'Akdeniz', focus: medFeature('mediterranean', 34.6, 18),
    sources: [],
  }),
  place({
    id: 'ibnjubayr-red-sea', kind: 'sea', aliases: ['Red Sea'],
    title: 'The Red Sea', kindLabel: 'Sea', periodLabel: 'Between Africa and Arabia',
    summary: 'The Red Sea is a long, narrow sea between Africa and Arabia. Ibn Jubayr crossed it by ship on his way to Mecca.',
    more: 'Ibn Jubayr went to it with a camel caravan.',
    tr: 'Kızıldeniz', focus: medFeature('red-sea', 20.5, 38.6),
    sources: [],
  }),
  place({
    id: 'ibnjubayr-nile', kind: 'river', aliases: ['Nile'],
    title: 'The Nile', kindLabel: 'River', periodLabel: 'Egypt',
    summary: 'The Nile is a very long river in Africa. It flows north through Egypt to the Mediterranean Sea. Every year, its floods brought water to the farms.',
    more: 'In Cairo, Ibn Jubayr saw a Nilometer, a tool to measure the floods.',
    tr: 'Nil Nehri', focus: medFeature('nile', 24, 32.9),
    sources: [],
  }),
  place({
    id: 'ibnjubayr-euphrates', kind: 'river', aliases: ['Euphrates River', 'Euphrates'],
    title: 'The Euphrates', kindLabel: 'River', periodLabel: 'Türkiye · Syria · Iraq',
    summary: 'The Euphrates is a long river. It starts in the mountains of Türkiye and flows through Syria and Iraq.',
    more: 'On his way to Baghdad, Ibn Jubayr passed near it.',
    tr: 'Fırat Nehri', focus: medFeature('euphrates', 35.2, 41.5),
    sources: [],
  }),
  place({
    id: 'ibnjubayr-sardinia', kind: 'island', aliases: ['Sardinia'],
    title: 'Sardinia', kindLabel: 'Island', periodLabel: 'Mediterranean Sea',
    summary: 'Sardinia is a large island in the Mediterranean Sea, west of Italy.',
    more: 'Ibn Jubayr’s ship passed it on the way to the east and on the way home.',
    tr: 'Sardinya', focus: medFeature('sardinia', 40.1, 9.0, 1.4),
    sources: [],
  }),
  place({
    id: 'ibnjubayr-sicily', kind: 'island', aliases: ['Sicily'],
    title: 'Sicily', kindLabel: 'Island', periodLabel: 'Mediterranean Sea',
    summary: 'Sicily is the largest island in the Mediterranean Sea, south of Italy. On the way home, Ibn Jubayr’s ship hit the ground near its coast.',
    more: 'The king of Sicily, William II, helped the passengers.',
    tr: 'Sicilya', focus: medFeature('sicily', 37.55, 14.1, 1.4),
    sources: [],
  }),
  place({
    id: 'ibnjubayr-crete', kind: 'island', aliases: ['Crete'],
    title: 'Crete', kindLabel: 'Island', periodLabel: 'Mediterranean Sea',
    summary: 'Crete is a large island in the Mediterranean Sea, south of Greece.',
    more: 'After a big storm, Ibn Jubayr’s ship sailed toward Crete.',
    tr: 'Girit', focus: medFeature('crete', 35.2, 24.9, 1.4),
    sources: [],
  }),

  // Buildings
  place({
    id: 'ibnjubayr-lighthouse-of-alexandria', kind: 'landmark', aliases: ['Lighthouse of Alexandria'],
    title: 'Lighthouse of Alexandria', kindLabel: 'Building', periodLabel: 'Egypt',
    summary: 'The Lighthouse of Alexandria was a very tall tower near the port. Its light helped ships find the port. Later, earthquakes destroyed it.',
    more: 'Ibn Jubayr wrote that it was more than 50 men tall.',
    tr: 'İskenderiye Feneri', focus: medPoint(31.21, 29.89, 2.4),
    sources: [],
  }),
  place({
    id: 'ibnjubayr-great-mosque-of-damascus', kind: 'landmark', aliases: ['Great Mosque of Damascus'],
    title: 'Great Mosque of Damascus', kindLabel: 'Mosque', periodLabel: 'Syria · early 700s',
    summary: 'The Great Mosque of Damascus is also called the Umayyad Mosque. The Umayyads built it in the early 700s. It is one of the oldest great mosques in the world.',
    more: 'Ibn Jubayr described its dome, its minarets and its beautiful mosaics.',
    tr: 'Emevî Camii', focus: medPoint(33.51, 36.31, 2.4),
    sources: ['TDV İslâm Ansiklopedisi: Emevî Camii'],
  }),
  place({
    id: 'ibnjubayr-kerak', kind: 'landmark', aliases: ['Kerak'],
    title: 'Kerak', kindLabel: 'Castle', periodLabel: 'East of the Dead Sea',
    summary: 'Kerak is a big castle on a hill, east of the Dead Sea, in today’s Jordan. The Crusaders built it.',
    more: 'In 1184, Saladin attacked it.',
    tr: 'Kerek Kalesi', focus: medPoint(31.18, 35.7, 2.4),
    sources: ['TDV İslâm Ansiklopedisi: Kerek'],
  }),

  // People and ruling families: the lands they ruled, drawn approximately
  place({
    id: 'ibnjubayr-crusaders', kind: 'people', aliases: ['Crusaders'],
    title: 'The Crusaders', kindLabel: 'Soldiers', periodLabel: '1096–1291',
    summary: 'The Crusaders were Christian soldiers from Europe. They came to the Middle East and took Jerusalem and other lands in 1099.',
    more: 'In Ibn Jubayr’s time, they ruled Palestine.',
    tr: 'Haçlılar',
    focus: medFeature('crusaders', 44.6, 25, 1, { arrows: [{ from: [45.5, 4], to: [35.4, 33.6] }] }),
    sources: ['TDV İslâm Ansiklopedisi: Haçlı Seferleri'],
  }),
  place({
    id: 'ibnjubayr-ayyubids', kind: 'dynasty', aliases: ['Ayyubid state'],
    title: 'The Ayyubids', kindLabel: 'Ruling family', periodLabel: 'From 1171',
    summary: 'The Ayyubids were a Muslim family of rulers. Saladin started their state in Egypt. They also ruled Syria, Yemen and other lands.',
    more: 'Their capital was Cairo.',
    tr: 'Eyyûbîler',
    focus: medFeature('ayyubids', 26.5, 29.8),
    sources: ['TDV İslâm Ansiklopedisi: Eyyûbîler'],
  }),
  place({
    id: 'ibnjubayr-saladin', kind: 'person', aliases: ['Saladin al-Ayyubi', 'Salah ad-Din al-Ayyubi', 'Saladin'],
    title: 'Saladin', kindLabel: 'Sultan', periodLabel: '1138–1193',
    summary: 'Saladin (Salah ad-Din al-Ayyubi) was a great Muslim ruler and army leader. He ruled Egypt and Syria. In 1187, he took Jerusalem back from the Crusaders.',
    more: 'Ibn Jubayr praised his kindness and his fair rules.',
    tr: 'Selâhaddîn-i Eyyûbî',
    focus: medFeature('saladin', 27.5, 30.5, 1.3),
    sources: ['TDV İslâm Ansiklopedisi: Selâhaddîn-i Eyyûbî'],
  }),
  place({
    id: 'ibnjubayr-abbasids', kind: 'dynasty', aliases: ['Abbasids'],
    title: 'The Abbasids', kindLabel: 'Ruling family', periodLabel: '750–1258',
    summary: 'The Abbasids were a family of caliphs. They ruled from Baghdad until the Mongols attacked the city in 1258.',
    more: 'Ibn Jubayr visited their capital, Baghdad.',
    tr: 'Abbâsîler',
    focus: medFeature('abbasids', 32.5, 44.2, 1.3),
    sources: ['TDV İslâm Ansiklopedisi: Abbâsîler'],
  }),
  place({
    id: 'ibnjubayr-mongols', kind: 'people', aliases: ['Mongols'],
    title: 'The Mongols', kindLabel: 'People', periodLabel: '13th century',
    summary: 'The Mongols were people from Central Asia. In 1258, their army attacked Baghdad and destroyed a large part of it.',
    more: 'They came from the east on horses and built a very big empire.',
    tr: 'Moğollar',
    // The map slides out to the east: the Mongol homeland, and the army's way to Baghdad.
    focus: medFeature('mongol-homeland', 49.6, 103, 1, {
      arrows: [{ from: [45.6, 100], to: [34, 45.2] }],
      pins: [{ at: [33.31, 44.36], label: 'Baghdad' }],
      view: { north: 62, west: 28, widthDegrees: 95 },
    }),
    sources: [],
  }),
  place({
    id: 'ibnjubayr-umayyads', kind: 'dynasty', aliases: ['Umayyads'],
    title: 'The Umayyads', kindLabel: 'Ruling family', periodLabel: '661–750',
    summary: 'The Umayyads were the first family of caliphs. They ruled from Damascus from 661 to 750. Later, another Umayyad family ruled Al-Andalus from Córdoba.',
    more: 'The Great Mosque of Damascus is one of their famous buildings.',
    tr: 'Emevîler',
    focus: medFeature('umayyads', 25, 44),
    sources: ['TDV İslâm Ansiklopedisi: Emevîler'],
  }),
];

export const ibnJubayrA2Entities: Record<string, HistoricalEntity> = Object.fromEntries(
  entities.map(entity => [entity.id, entity]),
);

/** Which cards each chapter offers. The first mention in the chapter is tappable. */
export const IBN_JUBAYR_A2_CHAPTER_ENTITIES: Record<number, string[]> = {
  1: ['ibnjubayr-al-andalus', 'ibnjubayr-valencia', 'ibnjubayr-granada', 'ibnjubayr-seville', 'ibnjubayr-cordoba'],
  2: ['ibnjubayr-baghdad', 'ibnjubayr-mosul', 'ibnjubayr-aleppo', 'ibnjubayr-jerusalem', 'ibnjubayr-damascus'],
  3: ['ibnjubayr-mediterranean', 'ibnjubayr-palestine'],
  4: ['ibnjubayr-ceuta', 'ibnjubayr-north-africa', 'ibnjubayr-genoa', 'ibnjubayr-sardinia', 'ibnjubayr-sicily', 'ibnjubayr-crete', 'ibnjubayr-egypt', 'ibnjubayr-alexandria', 'ibnjubayr-lighthouse-of-alexandria', 'ibnjubayr-cairo'],
  5: ['ibnjubayr-ayyubids', 'ibnjubayr-saladin', 'ibnjubayr-nile'],
  6: ['ibnjubayr-red-sea'],
  7: ['ibnjubayr-mecca'],
  8: ['ibnjubayr-medina', 'ibnjubayr-baghdad', 'ibnjubayr-euphrates', 'ibnjubayr-abbasids', 'ibnjubayr-mongols', 'ibnjubayr-syria'],
  9: ['ibnjubayr-aleppo', 'ibnjubayr-damascus', 'ibnjubayr-umayyads', 'ibnjubayr-great-mosque-of-damascus'],
  10: ['ibnjubayr-palestine', 'ibnjubayr-crusaders', 'ibnjubayr-acre', 'ibnjubayr-kerak', 'ibnjubayr-jerusalem'],
  11: ['ibnjubayr-kingdom-of-jerusalem', 'ibnjubayr-sicily'],
};

// The A1 book has its own, simpler card words (A1 words, and only what the A1 story says).
// Maps, pictures and sources are the same as the A2 cards.
type CardWords = { title: string; kindLabel: string; periodLabel: string; summary: string; more: string };
const a1Card = (baseId: string, en: CardWords, aliasesEn?: string[]): HistoricalEntity => {
  const base = ibnJubayrA2Entities[baseId];
  return {
    ...base,
    id: baseId.replace(/^ibnjubayr-/, 'ibnjubayr-a1-'),
    ...(aliasesEn ? { aliases: { ...base.aliases, en: aliasesEn } } : {}),
    copy: { ...base.copy, en: { ...base.copy.en, ...en, mapAlt: base.copy.en.mapAlt.replace(base.copy.en.title, en.title) } },
  };
};

const a1Entities: HistoricalEntity[] = [
  a1Card('ibnjubayr-al-andalus', { title: 'Al-Andalus', kindLabel: 'Land', periodLabel: '711–1492', summary: 'Al-Andalus was the name of the Muslim lands in Spain and Portugal. Muslims, Christians and Jews lived there together.', more: 'It had big, beautiful cities.' }),
  a1Card('ibnjubayr-cordoba', { title: 'Córdoba', kindLabel: 'City', periodLabel: 'Al-Andalus', summary: 'Córdoba is a city in Spain. In the time of Al-Andalus, it was the biggest city in Western Europe.', more: 'It has a very big, old mosque.' }),
  a1Card('ibnjubayr-seville', { title: 'Sevilla', kindLabel: 'City', periodLabel: 'Al-Andalus', summary: 'Sevilla is a city in Spain. In the time of Al-Andalus, it had 1,000 mosques.', more: 'In English, people also say Seville.' }),
  a1Card('ibnjubayr-valencia', { title: 'Valencia', kindLabel: 'City', periodLabel: 'Al-Andalus', summary: 'Valencia is a city in the east of Spain, near the sea. Ibn Jubayr was born here in 1145.', more: 'At that time, it was a part of Al-Andalus.' }),
  a1Card('ibnjubayr-granada', { title: 'Granada', kindLabel: 'City', periodLabel: 'Al-Andalus', summary: 'Granada is a city in Spain. Ibn Jubayr worked here. He started and ended his journey in Granada.', more: 'He wrote his travel book here.' }),
  a1Card('ibnjubayr-ceuta', { title: 'Ceuta', kindLabel: 'City', periodLabel: 'North Africa', summary: 'Ceuta is a city in North Africa, near the sea. Ibn Jubayr got on a ship here.', more: 'It is very near Spain.' }),
  a1Card('ibnjubayr-sicily', { title: 'Sicily', kindLabel: 'Island', periodLabel: 'In the sea, near Italy', summary: 'Sicily is a big island. Ibn Jubayr’s ship went past it. On the way home, his ship hit some rocks near Sicily.', more: 'The king of Sicily, William II, helped the people from the ship.' }),
  a1Card('ibnjubayr-alexandria', { title: 'Alexandria', kindLabel: 'City', periodLabel: 'Egypt', summary: 'Alexandria is a city in Egypt, near the sea. Ibn Jubayr saw its famous lighthouse. He died here in 1217.', more: 'It is a very old city.' }),
  a1Card('ibnjubayr-lighthouse-of-alexandria', { title: 'The Lighthouse of Alexandria', kindLabel: 'Building', periodLabel: 'Egypt', summary: 'This lighthouse was very tall and very old. It had a light for ships. Ibn Jubayr loved it.', more: 'Today, it is not there.' }, ['lighthouse of Alexandria', 'Lighthouse of Alexandria']),
  a1Card('ibnjubayr-cairo', { title: 'Cairo', kindLabel: 'City', periodLabel: 'Egypt', summary: 'Cairo is a big city in Egypt. In Ibn Jubayr’s time, the leader here was Saladin.', more: 'Today, it is the capital of Egypt.' }),
  a1Card('ibnjubayr-saladin', { title: 'Saladin', kindLabel: 'Sultan', periodLabel: 'The 1100s', summary: 'Saladin was the sultan in Cairo. He was kind and fair. He helped mosques, schools and hospitals.', more: 'Every day, he gave bread to poor people.' }),
  a1Card('ibnjubayr-red-sea', { title: 'The Red Sea', kindLabel: 'Sea', periodLabel: 'Between Africa and Arabia', summary: 'The Red Sea is between Africa and Arabia. Ibn Jubayr went to the Red Sea with a caravan of camels.', more: 'Then he went to Mecca.' }),
  a1Card('ibnjubayr-mecca', { title: 'Mecca', kindLabel: 'City', periodLabel: 'Arabia', summary: 'Mecca is in a narrow valley. The Ka’ba is here. Ibn Jubayr stayed here for more than eight months and made the Hajj.', more: 'People come here from many countries.' }),
  a1Card('ibnjubayr-medina', { title: 'Medina', kindLabel: 'City', periodLabel: 'Arabia', summary: 'Medina is a city north of Mecca. Ibn Jubayr went here in April 1184.', more: 'The mosque of the Prophet (pbuh) is in Medina.' }),
  a1Card('ibnjubayr-baghdad', { title: 'Baghdad', kindLabel: 'City', periodLabel: 'Iraq', summary: 'Baghdad was the capital of the Abbasids. It had 2,000 public baths.', more: 'Today, it is the capital of Iraq.' }),
  a1Card('ibnjubayr-abbasids', { title: 'The Abbasids', kindLabel: 'Ruling family', periodLabel: '750–1258', summary: 'The Abbasids were a family of Muslim leaders. Their capital was Baghdad.', more: 'They ruled for a very long time.' }),
  a1Card('ibnjubayr-aleppo', { title: 'Aleppo', kindLabel: 'City', periodLabel: 'Syria', summary: 'Aleppo is an old city in Syria. Ibn Jubayr went here after Baghdad.', more: 'Then he went to Damascus.' }),
  a1Card('ibnjubayr-damascus', { title: 'Damascus', kindLabel: 'City', periodLabel: 'Syria', summary: 'Damascus is an old city in Syria. Ibn Jubayr visited its Great Mosque. Students and travelers stayed in madrasas here for free.', more: 'Today, it is the capital of Syria.' }),
  a1Card('ibnjubayr-great-mosque-of-damascus', { title: 'The Great Mosque of Damascus', kindLabel: 'Mosque', periodLabel: 'Syria', summary: 'This is a very big, old mosque in Damascus. It has tall minarets and beautiful mosaics. It had a water clock, too.', more: 'People pray there today, too.' }),
  a1Card('ibnjubayr-acre', { title: 'Acre', kindLabel: 'City', periodLabel: 'Palestine', summary: 'Acre is a city in Palestine, near the sea. Ibn Jubayr waited here two weeks for good winds.', more: 'Then he got on a ship for home.' }),
  a1Card('ibnjubayr-crusaders', { title: 'The Crusaders', kindLabel: 'Soldiers', periodLabel: 'The 1100s', summary: 'The Crusaders were soldiers from Europe. They came to fight. In Ibn Jubayr’s time, they ruled Palestine.', more: 'Later, Saladin took Jerusalem back from them.' }),
];

export const ibnJubayrA1Entities: Record<string, HistoricalEntity> = Object.fromEntries(a1Entities.map(entity => [entity.id, entity]));

export const IBN_JUBAYR_A1_CHAPTER_ENTITIES: Record<number, string[]> = {
  1: ['ibnjubayr-a1-al-andalus', 'ibnjubayr-a1-cordoba', 'ibnjubayr-a1-seville', 'ibnjubayr-a1-valencia'],
  2: ['ibnjubayr-a1-granada'],
  3: ['ibnjubayr-a1-granada', 'ibnjubayr-a1-ceuta', 'ibnjubayr-a1-sicily', 'ibnjubayr-a1-alexandria', 'ibnjubayr-a1-lighthouse-of-alexandria', 'ibnjubayr-a1-cairo'],
  4: ['ibnjubayr-a1-cairo', 'ibnjubayr-a1-saladin'],
  5: ['ibnjubayr-a1-red-sea', 'ibnjubayr-a1-mecca'],
  6: ['ibnjubayr-a1-medina', 'ibnjubayr-a1-baghdad', 'ibnjubayr-a1-abbasids', 'ibnjubayr-a1-aleppo', 'ibnjubayr-a1-damascus', 'ibnjubayr-a1-great-mosque-of-damascus'],
  7: ['ibnjubayr-a1-acre', 'ibnjubayr-a1-crusaders', 'ibnjubayr-a1-sicily'],
};
