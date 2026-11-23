import { defineEntity, type EntitySpec } from './define';
import { medFeature, medPoint } from '../mediterraneanMap';
import type { EntityBookSet } from './index';

// Places & People cards for Mahmud Kashgari (A1–B2). A1 has its own simple cards; A2, B1 and B2
// share the full set. Japan has no map: it lies east of the widest map. Pictures: Storage places-people/kasgarli/.
// The Arabic copy and aliases live in src/content/entityCards.json (Arabic edition 2026-11-23, hidden with arabicHidden).
// Copy never goes beyond the story. A card without a picture file shows a placeholder.

type Text = { title: string; kindLabel: string; periodLabel: string; summary: string; more?: string };
const card = (spec: Omit<EntitySpec, 'aliases' | 'copy'> & { aliases: string[]; en: Text }) => defineEntity({
  ...spec,
  aliases: { en: spec.aliases, ar: [] },
  copy: { en: spec.en, ar: spec.en },
});
const pic = (name: string, folder = "kasgarli") => ({ folder, name });

const entities = [
  card({
    id: "kasgarli-a1-kashgari", kind: "person", tr: "Kâşgarlı Mahmud", aliases: ["Mahmud Kashgari", "Kashgari", "Mahmud"],
    en: { title: "Mahmud Kashgari", kindLabel: "Writer", periodLabel: "1008–1105", summary: "Mahmud Kashgari wrote a very old book about the Turkish language. He was born in Barsgan and died in Kashgar.", more: "His book has a world map, too." },
    focus: medFeature('turkestan', 39.47, 75.99, 1, { view: { north: 55, west: 35, widthDegrees: 60 }, pins: [{ at: [39.47, 75.99], label: 'Kashgar' }] }),
    picture: pic("mahmud-kashgari"), sources: ["TDV İslâm Ansiklopedisi: Kâşgarlı Mahmud"],
  }),
  card({
    id: "kasgarli-a1-barsgan", kind: "city", tr: "Barsgan", aliases: ["Barsgan"],
    en: { title: "Barsgan", kindLabel: "Town", periodLabel: "Kyrgyzstan today", summary: "Mahmud Kashgari was born in Barsgan in 1008. Today, Barsgan is in Kyrgyzstan." },
    focus: medFeature('turkestan', 42.15, 77.6, 1, { view: { north: 55, west: 35, widthDegrees: 60 }, pins: [{ at: [42.15, 77.6], label: 'Barsgan' }] }),
    picture: pic("barsgan"), sources: ["TDV İslâm Ansiklopedisi: Kâşgarlı Mahmud"],
  }),
  card({
    id: "kasgarli-a1-kashgar", kind: "city", tr: "Kaşgar", aliases: ["Kashgar"],
    en: { title: "Kashgar", kindLabel: "City", periodLabel: "East Turkestan", summary: "Kashgar is a very old city in East Turkestan. Mahmud lived there for many years.", more: "People call him Kashgari, “the man from Kashgar”." },
    focus: medFeature('turkestan', 39.47, 75.99, 1, { view: { north: 55, west: 35, widthDegrees: 60 }, pins: [{ at: [39.47, 75.99], label: 'Kashgar' }] }),
    picture: pic("kashgar"), sources: ["TDV İslâm Ansiklopedisi: Kâşgar"],
  }),
  card({
    id: "kasgarli-a1-karakhanids", kind: "dynasty", tr: "Karahanlılar", aliases: ["Karakhanids"],
    en: { title: "The Karakhanids", kindLabel: "Turkish state", periodLabel: "The 900s to the 1200s", summary: "The Karakhanids were a Turkish state. Mahmud’s family was from the Karakhanids." },
    focus: medFeature('turkestan', 42, 72, 1, { view: { north: 55, west: 35, widthDegrees: 60 } }),
    picture: pic("karakhanids"), sources: ["TDV İslâm Ansiklopedisi: Karahanlılar"],
  }),
  card({
    id: "kasgarli-a1-baghdad", kind: "city", tr: "Bağdat", aliases: ["Baghdad"],
    en: { title: "Baghdad", kindLabel: "City", periodLabel: "Iraq today", summary: "Mahmud wrote his big book in Baghdad. In 1077, he gave it to the Caliph there." },
    focus: medPoint(33.31, 44.36, 1.8),
    picture: pic("baghdad", "andalus"), sources: ["TDV İslâm Ansiklopedisi: Bağdat"],
  }),
  card({
    id: "kasgarli-a1-ili-valley", kind: "region", tr: "İli Vadisi", aliases: ["Ili Valley"],
    en: { title: "The Ili Valley", kindLabel: "Valley", periodLabel: "Central Asia", summary: "The Ili Valley has a big river. In the story of the Turkish calendar, people pushed wild animals to this river." },
    focus: medFeature('turkestan', 43.9, 81.3, 1, { view: { north: 55, west: 35, widthDegrees: 60 }, pins: [{ at: [43.9, 81.3], label: 'Ili Valley' }] }),
    picture: pic("ili-valley"), sources: ["TDV İslâm Ansiklopedisi: İli"],
  }),
  card({
    id: "kasgarli-a1-balasagun", kind: "city", tr: "Balasagun", aliases: ["Balasagun"],
    en: { title: "Balasagun", kindLabel: "City", periodLabel: "Kyrgyzstan today", summary: "Balasagun was a city of the Turks. It is in the middle of Mahmud’s world map." },
    focus: medFeature('turkestan', 42.75, 75.25, 1, { view: { north: 55, west: 35, widthDegrees: 60 }, pins: [{ at: [42.75, 75.25], label: 'Balasagun' }] }),
    picture: pic("balasagun"), sources: ["TDV İslâm Ansiklopedisi: Balasagun"],
  }),
  card({
    id: "kasgarli-a1-millet-library", kind: "landmark", tr: "Millet Kütüphanesi", aliases: ["Millet Library"],
    en: { title: "The Millet Library", kindLabel: "Library", periodLabel: "Istanbul", summary: "The Millet Library is in Istanbul. Mahmud’s old book is there today." },
    focus: medPoint(41.01, 28.98, 1.8),
    picture: pic("millet-library"), sources: ["TDV İslâm Ansiklopedisi: Millet Kütüphanesi"],
  }),
  card({
    id: "kasgarli-a1-japan", kind: "country", tr: "Japonya", aliases: ["Japan"],
    en: { title: "Japan", kindLabel: "Land", periodLabel: "East Asia", summary: "Mahmud’s map shows Japan. It is the first world map with Japan on it." },
    picture: pic("japan"), sources: ["Encyclopaedia Iranica: Kāšḡarī, Maḥmūd", "TDV İslâm Ansiklopedisi: Kâşgarlı Mahmud"],
  }),
  card({
    id: "kasgarli-kashgari", kind: "person", tr: "Kâşgarlı Mahmud", aliases: ["Mahmud Kashgari", "Mahmud of Kashgar", "Kashgari"],
    en: { title: "Mahmud Kashgari", kindLabel: "Scholar", periodLabel: "11th century", summary: "Mahmud Kashgari wrote Dîvânu Lugâti’t-Türk, a dictionary of the Turkic languages. He was born in Barsgan and died in Kashgar.", more: "In 1077, he presented his work to the Abbasid Caliph in Baghdad. His world map was the first to show Japan." },
    focus: medFeature('turkestan', 39.47, 75.99, 1, { view: { north: 55, west: 35, widthDegrees: 60 }, pins: [{ at: [39.47, 75.99], label: 'Kashgar' }] }),
    picture: pic("mahmud-kashgari"), sources: ["TDV İslâm Ansiklopedisi: Kâşgarlı Mahmud"],
  }),
  card({
    id: "kasgarli-barsgan", kind: "city", tr: "Barsgan", aliases: ["Barsgan"],
    en: { title: "Barsgan", kindLabel: "Town", periodLabel: "Kyrgyzstan today", summary: "Historians believe that Mahmud Kashgari was born in Barsgan. Today, Barsgan is in Kyrgyzstan." },
    focus: medFeature('turkestan', 42.15, 77.6, 1, { view: { north: 55, west: 35, widthDegrees: 60 }, pins: [{ at: [42.15, 77.6], label: 'Barsgan' }] }),
    picture: pic("barsgan"), sources: ["TDV İslâm Ansiklopedisi: Kâşgarlı Mahmud"],
  }),
  card({
    id: "kasgarli-kashgar", kind: "city", tr: "Kaşgar", aliases: ["Kashgar"],
    en: { title: "Kashgar", kindLabel: "City", periodLabel: "East Turkestan", summary: "Kashgar is a very old city in an ancient Turkic homeland, also called East Turkestan. Mahmud Kashgari died there." },
    focus: medFeature('turkestan', 39.47, 75.99, 1, { view: { north: 55, west: 35, widthDegrees: 60 }, pins: [{ at: [39.47, 75.99], label: 'Kashgar' }] }),
    picture: pic("kashgar"), sources: ["TDV İslâm Ansiklopedisi: Kâşgar"],
  }),
  card({
    id: "kasgarli-karakhanids", kind: "dynasty", tr: "Karahanlılar", aliases: ["Karakhanids", "Karakhanid"],
    en: { title: "The Karakhanids", kindLabel: "Turkic state", periodLabel: "10th–13th century", summary: "The Karakhanids were a Turkic state. Mahmud Kashgari came from a noble Karakhanid family.", more: "In Karakhanid schools, Arabic was the main language for teaching." },
    focus: medFeature('turkestan', 42, 72, 1, { view: { north: 55, west: 35, widthDegrees: 60 } }),
    picture: pic("karakhanids"), sources: ["TDV İslâm Ansiklopedisi: Karahanlılar"],
  }),
  card({
    id: "kasgarli-baghdad", kind: "city", tr: "Bağdat", aliases: ["Baghdad"],
    en: { title: "Baghdad", kindLabel: "City", periodLabel: "Abbasid capital", summary: "Mahmud Kashgari traveled for many years before he reached Baghdad. In 1077, he presented his book to the Abbasid Caliph there." },
    focus: medPoint(33.31, 44.36, 1.8),
    picture: pic("baghdad", "andalus"), sources: ["TDV İslâm Ansiklopedisi: Bağdat"],
  }),
  card({
    id: "kasgarli-ili-valley", kind: "region", tr: "İli Vadisi", aliases: ["Ili Valley"],
    en: { title: "The Ili Valley", kindLabel: "Valley", periodLabel: "Central Asia", summary: "In the story of the Twelve-Animal calendar, the khan’s people drove wild animals toward a big river in the Ili Valley." },
    focus: medFeature('turkestan', 43.9, 81.3, 1, { view: { north: 55, west: 35, widthDegrees: 60 }, pins: [{ at: [43.9, 81.3], label: 'Ili Valley' }] }),
    picture: pic("ili-valley"), sources: ["TDV İslâm Ansiklopedisi: İli"],
  }),
  card({
    id: "kasgarli-turkestan", kind: "region", tr: "Türkistan", aliases: ["Turkestan"],
    en: { title: "Turkestan", kindLabel: "Land", periodLabel: "Home of the Turks", summary: "On Mahmud Kashgari’s world map, Turkestan, the home of the Turks, is in the center of the world." },
    focus: medFeature('turkestan', 42.5, 68, 1, { view: { north: 52, west: 22, widthDegrees: 62 } }),
    picture: pic("turkestan", "yunus"), sources: ["TDV İslâm Ansiklopedisi: Türkistan"],
  }),
  card({
    id: "kasgarli-balasagun", kind: "city", tr: "Balasagun", aliases: ["Balasagun"],
    en: { title: "Balasagun", kindLabel: "City", periodLabel: "Kyrgyzstan today", summary: "Balasagun was on a very busy part of the Silk Road. On Kashgari’s map, it is in the heart of the Turkic land." },
    focus: medFeature('turkestan', 42.75, 75.25, 1, { view: { north: 55, west: 35, widthDegrees: 60 }, pins: [{ at: [42.75, 75.25], label: 'Balasagun' }] }),
    picture: pic("balasagun"), sources: ["TDV İslâm Ansiklopedisi: Balasagun"],
  }),
  card({
    id: "kasgarli-silk-road", kind: "region", tr: "İpek Yolu", aliases: ["Silk Road"],
    en: { title: "The Silk Road", kindLabel: "Trade route", periodLabel: "Ancient and medieval times", summary: "The Silk Road was a great trade road across Asia. The city of Balasagun was on a very busy part of it." },
    focus: medFeature('silk-road', 38, 60, 1, { view: { north: 55, west: 20, widthDegrees: 100 } }),
    picture: pic("silk-road", "mecca"), sources: ["TDV İslâm Ansiklopedisi: İpek Yolu"],
  }),
  card({
    id: "kasgarli-volga", kind: "river", tr: "İdil (Volga) Nehri", aliases: ["Idil", "Volga"],
    en: { title: "The Idil (Volga) River", kindLabel: "River", periodLabel: "West of the map", summary: "Mahmud Kashgari’s world map goes as far west as the Idil (Volga) River." },
    focus: medPoint(46.5, 47.5, 1.4),
    picture: pic("volga"), sources: ["Encyclopaedia Iranica: Kāšḡarī, Maḥmūd", "TDV İslâm Ansiklopedisi: Kâşgarlı Mahmud"],
  }),
  card({
    id: "kasgarli-china", kind: "country", tr: "Çin", aliases: ["China"],
    en: { title: "China", kindLabel: "Land", periodLabel: "East of the map", summary: "Mahmud Kashgari’s world map shows China in the east. On the map, China is called ‘the Land of Yecüc and Mecüc’." },
    focus: medFeature('china', 35, 105, 1, { view: { north: 55, west: 60, widthDegrees: 65 } }),
    picture: pic("china-ancient", "mecca"), sources: ["Encyclopaedia Iranica: Kāšḡarī, Maḥmūd", "TDV İslâm Ansiklopedisi: Kâşgarlı Mahmud"],
  }),
  card({
    id: "kasgarli-japan", kind: "country", tr: "Japonya", aliases: ["Japan"],
    en: { title: "Japan", kindLabel: "Land", periodLabel: "East of the map", summary: "Mahmud Kashgari’s map is the first world map that shows Japan. On the map, Japan has the name ‘Jabarqa’.", more: "The second map with Japan came about four hundred years later." },
    picture: pic("japan"), sources: ["Encyclopaedia Iranica: Kāšḡarī, Maḥmūd", "TDV İslâm Ansiklopedisi: Kâşgarlı Mahmud"],
  }),
  card({
    id: "kasgarli-millet-library", kind: "landmark", tr: "Millet Kütüphanesi", aliases: ["Millet Library"],
    en: { title: "The Millet Library", kindLabel: "Library", periodLabel: "Istanbul", summary: "The only copy of Dîvânu Lugâti’t-Türk that still exists is in the Millet Library in Istanbul." },
    focus: medPoint(41.01, 28.98, 1.8),
    picture: pic("millet-library"), sources: ["TDV İslâm Ansiklopedisi: Millet Kütüphanesi"],
  }),
  card({
    id: "kasgarli-nasr-ilig-khan", kind: "person", tr: "Nasr İlig Han", aliases: ["Nasr Ilig Khan"],
    en: { title: "Nasr Ilig Khan", kindLabel: "Karakhanid ruler", periodLabel: "10th–11th century", summary: "Nasr Ilig Khan was a famous Karakhanid ruler who conquered Transoxiana and Bukhara. Mahmud Kashgari says he was his ancestor." },
    focus: medFeature('transoxiana', 40, 65.5, 1, { view: { north: 52, west: 22, widthDegrees: 62 } }),
    picture: pic("nasr-ilig-khan"), sources: ["TDV İslâm Ansiklopedisi: Karahanlılar"],
  }),
  card({
    id: "kasgarli-bukhara", kind: "city", tr: "Buhara", aliases: ["Bukhara"],
    en: { title: "Bukhara", kindLabel: "City", periodLabel: "Transoxiana", summary: "Bukhara is an old city in Transoxiana. The Karakhanid ruler Nasr Ilig Khan conquered it." },
    focus: medFeature('transoxiana', 39.77, 64.42, 1, { view: { north: 52, west: 22, widthDegrees: 62 }, pins: [{ at: [39.77, 64.42], label: 'Bukhara' }] }),
    picture: pic("bukhara"), sources: ["TDV İslâm Ansiklopedisi: Buhara"],
  }),
  card({
    id: "kasgarli-transoxiana", kind: "region", tr: "Mâverâünnehir", aliases: ["Transoxiana"],
    en: { title: "Transoxiana", kindLabel: "Land", periodLabel: "Central Asia", summary: "Transoxiana is a land in Central Asia. In its schools, Arabic was the main language for teaching." },
    focus: medFeature('transoxiana', 40, 65.5, 1, { view: { north: 52, west: 22, widthDegrees: 62 } }),
    picture: pic("transoxiana", "yunus"), sources: ["TDV İslâm Ansiklopedisi: Mâverâünnehir"],
  }),
  card({
    id: "kasgarli-abbasids", kind: "dynasty", tr: "Abbâsîler", aliases: ["Abbasids"],
    en: { title: "The Abbasids", kindLabel: "Ruling family", periodLabel: "Center of the Islamic world", summary: "The Abbasids were the center of the Islamic world. Their capital was Baghdad." },
    focus: medFeature('abbasids', 32.5, 44.2, 1.3),
    picture: pic("abbasids", "andalus"), sources: ["TDV İslâm Ansiklopedisi: Abbâsîler"],
  }),
  card({
    id: "kasgarli-muktedi", kind: "person", tr: "Muktedî-Biemrillâh", aliases: ["Muktedî-Biemrillâh"],
    en: { title: "Muktedî-Biemrillâh", kindLabel: "Abbasid caliph", periodLabel: "11th century", summary: "Muktedî-Biemrillâh was an Abbasid caliph. Mahmud Kashgari presented his book to him in Baghdad in 1077." },
    focus: medPoint(33.31, 44.36, 1.8),
    picture: pic("muktedi-biemrillah"), sources: ["TDV İslâm Ansiklopedisi: Muktedî-Biemrillâh"],
  }),
  card({
    id: "kasgarli-oghuz", kind: "tribe", tr: "Oğuzlar", aliases: ["Oghuz"],
    en: { title: "The Oghuz", kindLabel: "Turkic tribe", periodLabel: "11th century", summary: "The Oghuz were the most powerful tribe in the western part of the Turkic world. They get the most attention in Kashgari’s book." },
    focus: medFeature('oghuz-steppe', 44, 60, 1, { view: { north: 52, west: 22, widthDegrees: 62 } }),
    picture: pic("oghuz", "yunus"), sources: ["TDV İslâm Ansiklopedisi: Oğuzlar"],
  }),
  card({
    id: "kasgarli-seljuks", kind: "dynasty", tr: "Selçuklular", aliases: ["Seljuks"],
    en: { title: "The Seljuks", kindLabel: "Turkic state", periodLabel: "11th century", summary: "The Seljuks were an Oghuz Turkic tribe. They were very strong and protected the Abbasids." },
    focus: medFeature('khorasan', 36, 58, 1, { view: { north: 52, west: 22, widthDegrees: 62 } }),
    picture: pic("great-seljuks"), sources: ["TDV İslâm Ansiklopedisi: Selçuklular"],
  }),
  card({
    id: "kasgarli-ghaznavids", kind: "dynasty", tr: "Gazneliler", aliases: ["Ghaznavids"],
    en: { title: "The Ghaznavids", kindLabel: "Turkic state", periodLabel: "11th century", summary: "The Ghaznavids were one of the three great Turkic states of the time, with the Karakhanids and the Seljuks." },
    focus: medPoint(33.55, 68.42, 1),
    picture: pic("ghaznavids"), sources: ["TDV İslâm Ansiklopedisi: Gazneliler"],
  }),
  card({
    id: "kasgarli-orkhon", kind: "landmark", tr: "Orhun Âbideleri", aliases: ["Orkhon Monuments", "Orkhon Inscriptions"],
    en: { title: "The Orkhon Monuments", kindLabel: "Old stones with writing", periodLabel: "725, 731 and 732", summary: "The Orkhon Monuments describe historical events according to the Twelve-Animal Turkic calendar." },
    focus: medFeature('mongol-homeland', 47.5, 102.8, 1, { view: { north: 62, west: 60, widthDegrees: 65 } }),
    picture: pic("orkhon-monuments"), sources: ["TDV İslâm Ansiklopedisi: Orhun Âbideleri"],
  }),
];

export const KASGARLI_SET: EntityBookSet = {
  entities,
  chapters: {
    "kasgarli-a1": {
      1: ["kasgarli-a1-kashgari", "kasgarli-a1-baghdad", "kasgarli-a1-millet-library"],
      2: ["kasgarli-a1-kashgari", "kasgarli-a1-barsgan", "kasgarli-a1-kashgar", "kasgarli-a1-karakhanids"],
      3: ["kasgarli-a1-kashgari", "kasgarli-a1-baghdad"],
      4: [],
      5: [],
      6: ["kasgarli-a1-ili-valley"],
      7: [],
      8: ["kasgarli-a1-kashgari", "kasgarli-a1-balasagun", "kasgarli-a1-japan"],
    },
    "kasgarli-a2": {
      1: ["kasgarli-kashgari", "kasgarli-kashgar", "kasgarli-baghdad", "kasgarli-japan", "kasgarli-millet-library"],
      2: ["kasgarli-kashgari", "kasgarli-barsgan", "kasgarli-kashgar", "kasgarli-karakhanids", "kasgarli-china"],
      3: ["kasgarli-kashgari", "kasgarli-kashgar", "kasgarli-karakhanids", "kasgarli-baghdad"],
      4: ["kasgarli-kashgari", "kasgarli-ili-valley"],
      5: [],
      6: ["kasgarli-kashgari"],
      7: ["kasgarli-kashgari", "kasgarli-kashgar", "kasgarli-turkestan", "kasgarli-balasagun", "kasgarli-silk-road", "kasgarli-volga", "kasgarli-china", "kasgarli-japan"],
      8: ["kasgarli-kashgari", "kasgarli-kashgar"],
    },
    "kasgarli-b1": {
      1: ["kasgarli-kashgari", "kasgarli-karakhanids"],
      2: ["kasgarli-kashgari", "kasgarli-barsgan", "kasgarli-kashgar", "kasgarli-karakhanids", "kasgarli-china", "kasgarli-nasr-ilig-khan", "kasgarli-bukhara", "kasgarli-transoxiana"],
      3: ["kasgarli-kashgari", "kasgarli-baghdad", "kasgarli-muktedi"],
      4: ["kasgarli-kashgari", "kasgarli-kashgar", "kasgarli-baghdad", "kasgarli-oghuz"],
      5: ["kasgarli-kashgari", "kasgarli-karakhanids", "kasgarli-baghdad", "kasgarli-abbasids", "kasgarli-oghuz", "kasgarli-seljuks", "kasgarli-ghaznavids"],
      6: ["kasgarli-kashgari", "kasgarli-karakhanids", "kasgarli-transoxiana"],
      7: ["kasgarli-kashgari", "kasgarli-kashgar", "kasgarli-turkestan", "kasgarli-balasagun", "kasgarli-silk-road", "kasgarli-volga", "kasgarli-china", "kasgarli-japan"],
      8: ["kasgarli-kashgari", "kasgarli-ili-valley"],
      9: [],
      10: ["kasgarli-kashgari", "kasgarli-orkhon"],
      11: ["kasgarli-kashgari", "kasgarli-kashgar", "kasgarli-millet-library"],
    },
    "kasgarli-b2": {
      1: ["kasgarli-kashgari", "kasgarli-karakhanids"],
      2: ["kasgarli-kashgari", "kasgarli-baghdad", "kasgarli-muktedi"],
      3: ["kasgarli-kashgari", "kasgarli-barsgan", "kasgarli-kashgar", "kasgarli-karakhanids", "kasgarli-china", "kasgarli-nasr-ilig-khan", "kasgarli-bukhara", "kasgarli-transoxiana"],
      4: [],
      5: ["kasgarli-kashgari", "kasgarli-kashgar", "kasgarli-baghdad", "kasgarli-oghuz"],
      6: ["kasgarli-kashgari", "kasgarli-karakhanids", "kasgarli-baghdad", "kasgarli-abbasids", "kasgarli-oghuz", "kasgarli-seljuks", "kasgarli-ghaznavids"],
      7: ["kasgarli-kashgari", "kasgarli-karakhanids", "kasgarli-transoxiana"],
      8: ["kasgarli-kashgari", "kasgarli-kashgar", "kasgarli-turkestan", "kasgarli-balasagun", "kasgarli-silk-road", "kasgarli-volga", "kasgarli-china", "kasgarli-japan"],
      9: ["kasgarli-kashgari", "kasgarli-ili-valley"],
      10: [],
      11: [],
      12: ["kasgarli-kashgari", "kasgarli-orkhon"],
      13: [],
      14: ["kasgarli-kashgari", "kasgarli-kashgar", "kasgarli-millet-library"],
    },
  },
};
