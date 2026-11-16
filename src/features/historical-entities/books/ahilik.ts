import { defineEntity, type EntitySpec } from './define';
import { medFeature, medPoint } from '../mediterraneanMap';
import type { EntityBookSet } from './index';

// Places & People cards for The Ahî Organization (A1–B2). A1 and A2 share the simple cards;
// B1 and B2 share the full set. Pictures: Storage places-people/ahilik/ (shared ones from yunus/ and andalus/).
// English only for now: the Arabic copy repeats the English until the Arabic edition arrives.
// Copy never goes beyond the story. A card without a picture file shows a placeholder.

type Text = { title: string; kindLabel: string; periodLabel: string; summary: string; more?: string };
const card = (spec: Omit<EntitySpec, 'aliases' | 'copy'> & { aliases: string[]; en: Text }) => defineEntity({
  ...spec,
  aliases: { en: spec.aliases, ar: [] },
  copy: { en: spec.en, ar: spec.en },
});
const pic = (name: string, folder = "ahilik") => ({ folder, name });

const entities = [
  card({
    id: "ahilik-a1-anatolia", kind: "region", tr: "Anadolu", aliases: ["Anatolia"],
    en: { title: "Anatolia", kindLabel: "Land", periodLabel: "Türkiye today", summary: "Anatolia is a big land. The Ahî Organization started here about seven hundred years ago.", more: "Today, Anatolia is a part of Türkiye." },
    focus: medFeature('anatolia', 39, 33.5, 1),
    picture: pic("anatolia", "yunus"), sources: ["TDV İslâm Ansiklopedisi: Anadolu"],
  }),
  card({
    id: "ahilik-a1-ottomans", kind: "empire", tr: "Osmanlılar", aliases: ["Ottomans", "Ottoman Empire"],
    en: { title: "The Ottomans", kindLabel: "State", periodLabel: "From about 1300", summary: "The Ottomans started a state in Anatolia. The Ahî Organization was very important in its early years." },
    focus: medFeature('early-ottoman-lands', 40.2, 29.8, 1.4),
    picture: pic("ottomans", "yunus"), sources: ["TDV İslâm Ansiklopedisi: Osmanlılar"],
  }),
  card({
    id: "ahilik-anatolia", kind: "region", tr: "Anadolu", aliases: ["Anatolia"],
    en: { title: "Anatolia", kindLabel: "Land", periodLabel: "13th century", summary: "The Ahî organization first appeared in Anatolia in the 13th century. Its zaviyes were schools for the people of Anatolia.", more: "Ibn Battuta said that all the world’s beauties were found together in one place in Anatolia." },
    focus: medFeature('anatolia', 39, 33.5, 1),
    picture: pic("anatolia", "yunus"), sources: ["TDV İslâm Ansiklopedisi: Anadolu"],
  }),
  card({
    id: "ahilik-central-asia", kind: "region", tr: "Orta Asya", aliases: ["Central Asia"],
    en: { title: "Central Asia", kindLabel: "Land", periodLabel: "East of Anatolia", summary: "Central Asia is a large land far to the east of Anatolia. Ahî Evran traveled from Central Asia to Anatolia." },
    focus: medFeature('central-asia', 43, 65, 1, { view: { north: 52, west: 22, widthDegrees: 62 } }),
    picture: pic("central-asia", "yunus"), sources: ["TDV İslâm Ansiklopedisi: Türkistan"],
  }),
  card({
    id: "ahilik-konya", kind: "city", aliases: ["Konya"],
    en: { title: "Konya", kindLabel: "City", periodLabel: "Seljuk capital", summary: "When Sühreverdî arrived in Konya with the Caliph’s robe, people welcomed him with a great ceremony.", more: "Ahî Evran also stayed in Konya for a time." },
    focus: medPoint(37.87, 32.49, 1.8),
    picture: pic("konya", "yunus"), sources: ["TDV İslâm Ansiklopedisi: Konya"],
  }),
  card({
    id: "ahilik-kayseri", kind: "city", aliases: ["Kayseri"],
    en: { title: "Kayseri", kindLabel: "City", periodLabel: "Central Anatolia", summary: "Ahî Evran stayed in Kayseri for a time. Later, the Ahîs helped defend the city against the Mongols, but the city finally fell." },
    focus: medPoint(38.72, 35.49, 1.8),
    picture: pic("kayseri", "yunus"), sources: ["TDV İslâm Ansiklopedisi: Kayseri"],
  }),
  card({
    id: "ahilik-kirsehir", kind: "city", aliases: ["Kırşehir"],
    en: { title: "Kırşehir", kindLabel: "City", periodLabel: "Central Anatolia", summary: "Ahî Evran finally settled in Kırşehir. He founded a zaviye there.", more: "This zaviye became the center for artisans all across Anatolia." },
    focus: medPoint(39.15, 34.16, 1.8),
    picture: pic("kirsehir"), sources: ["TDV İslâm Ansiklopedisi: Kırşehir"],
  }),
  card({
    id: "ahilik-denizli", kind: "city", aliases: ["Denizli"],
    en: { title: "Denizli", kindLabel: "City", periodLabel: "Anatolia", summary: "Denizli is a city in Anatolia. Ahî Evran stayed here for a time before he settled in Kırşehir." },
    focus: medPoint(37.78, 29.09, 1.8),
    picture: pic("denizli"), sources: ["TDV İslâm Ansiklopedisi: Denizli"],
  }),
  card({
    id: "ahilik-kosedag", kind: "region", aliases: ["Kösedağ"],
    en: { title: "Kösedağ", kindLabel: "Battle place", periodLabel: "1243", summary: "At Kösedağ, the Mongols defeated the Seljuk sultan Gıyâseddin II.", more: "After this battle, the Ahîs helped defend Kayseri." },
    focus: medPoint(40.03, 37.92, 1.8),
    picture: pic("kosedag", "yunus"), sources: ["TDV İslâm Ansiklopedisi: Kösedağ Savaşı"],
  }),
  card({
    id: "ahilik-tokat", kind: "city", aliases: ["Tokat"],
    en: { title: "Tokat", kindLabel: "City", periodLabel: "Anatolia", summary: "Tokat is a city in Anatolia. After the battle of Kösedağ, the Mongols took Tokat before they came to Kayseri." },
    focus: medPoint(40.31, 36.55, 1.8),
    picture: pic("tokat"), sources: ["TDV İslâm Ansiklopedisi: Tokat"],
  }),
  card({
    id: "ahilik-sivas", kind: "city", aliases: ["Sivas"],
    en: { title: "Sivas", kindLabel: "City", periodLabel: "Central Anatolia", summary: "Sivas is a city in Anatolia. After the battle of Kösedağ, the Mongols took Sivas before they came to Kayseri." },
    focus: medPoint(39.75, 37.02, 1.8),
    picture: pic("sivas", "yunus"), sources: ["TDV İslâm Ansiklopedisi: Sivas"],
  }),
  card({
    id: "ahilik-tangier", kind: "city", tr: "Tanca", aliases: ["Tangier"],
    en: { title: "Tangier", kindLabel: "City", periodLabel: "North Africa", summary: "Tangier is a city in North Africa. The traveler Ibn Battuta came from Tangier." },
    focus: medPoint(35.77, -5.8, 1.8),
    picture: pic("tangier", "andalus"), sources: ["TDV İslâm Ansiklopedisi: Tanca"],
  }),
  card({
    id: "ahilik-ahi-evran", kind: "person", tr: "Ahî Evran", aliases: ["Ahî Evran"],
    en: { title: "Ahî Evran", kindLabel: "Scholar", periodLabel: "13th century", summary: "Ahî Evran was a Sufi scholar who traveled from Central Asia to Anatolia. He played a key role in starting the Ahî movement.", more: "He was known as the spiritual leader of leather workers and other craftsmen. He settled in Kırşehir." },
    focus: medPoint(39.15, 34.16, 1.8),
    picture: pic("ahi-evran"), sources: ["TDV İslâm Ansiklopedisi: Ahî Evran"],
  }),
  card({
    id: "ahilik-suhreverdi", kind: "person", tr: "Şehâbeddin es-Sühreverdî", aliases: ["Sühreverdî"],
    en: { title: "Şehâbeddin es-Sühreverdî", kindLabel: "Scholar", periodLabel: "13th century", summary: "Sühreverdî was a well-known scholar and a beloved Sufi. The Caliph sent him to Konya with a Fütüvvet robe for the sultan." },
    focus: medPoint(37.87, 32.49, 1.8),
    picture: pic("suhreverdi"), sources: ["TDV İslâm Ansiklopedisi: Sühreverdî, Şehâbeddin"],
  }),
  card({
    id: "ahilik-keykubad-i", kind: "person", tr: "I. Alâeddin Keykubad", aliases: ["Alâeddin Keykubad I", "Alâeddin Keykubad", "Alaeddin Keykubad", "Keykubad I"],
    en: { title: "Alâeddin Keykubad I", kindLabel: "Seljuk sultan", periodLabel: "1220–1237", summary: "Alâeddin Keykubad I was a sultan of the Anatolian Seljuks. The Caliph sent him a Fütüvvet robe.", more: "He supported the Ahî order." },
    focus: medFeature('anatolian-seljuk-lands', 38.8, 34.5, 1, { pins: [{ at: [37.87, 32.49], label: 'Konya' }] }),
    picture: pic("alaeddin-keykubad-i", "yunus"), sources: ["TDV İslâm Ansiklopedisi: Keykubad I"],
  }),
  card({
    id: "ahilik-giyaseddin-ii", kind: "person", tr: "II. Gıyâseddin Keyhüsrev", aliases: ["Gıyâseddin II"],
    en: { title: "Gıyâseddin II", kindLabel: "Seljuk sultan", periodLabel: "13th century", summary: "Gıyâseddin II was a Seljuk sultan. The Ahîs opposed him.", more: "The Mongols defeated him at Kösedağ." },
    focus: medFeature('anatolian-seljuk-lands', 38.8, 34.5, 1, { pins: [{ at: [37.87, 32.49], label: 'Konya' }] }),
    picture: pic("giyaseddin-keyhusrev-ii", "yunus"), sources: ["TDV İslâm Ansiklopedisi: Keyhusrev II"],
  }),
  card({
    id: "ahilik-nasir", kind: "person", tr: "Nâsır-Lidînillâh", aliases: ["Nâsır-Lidînillâh"],
    en: { title: "Nâsır-Lidînillâh", kindLabel: "Abbasid caliph", periodLabel: "1180–1225", summary: "Nâsır-Lidînillâh was an Abbasid caliph. He sent a Fütüvvet robe to Sultan Alâeddin Keykubad I." },
    focus: medFeature('abbasids', 32.5, 44.2, 1.3),
    picture: pic("nasir-lidinillah"), sources: ["TDV İslâm Ansiklopedisi: Nâsır-Lidînillâh"],
  }),
  card({
    id: "ahilik-abbasids", kind: "dynasty", tr: "Abbâsîler", aliases: ["Abbasids", "Abbasid"],
    en: { title: "The Abbasids", kindLabel: "Ruling family", periodLabel: "Late 12th and early 13th centuries", summary: "The Abbasids were the family of the caliphs. The idea of Fütüvvet reached Anatolia through them." },
    focus: medFeature('abbasids', 32.5, 44.2, 1.3),
    picture: pic("abbasids", "andalus"), sources: ["TDV İslâm Ansiklopedisi: Abbâsîler"],
  }),
  card({
    id: "ahilik-anatolian-seljuks", kind: "kingdom", tr: "Anadolu Selçukluları", aliases: ["Anatolian Seljuk", "Seljuk"],
    en: { title: "Anatolian Seljuks", kindLabel: "State", periodLabel: "11th–14th century", summary: "The Anatolian Seljuks were a Turkish Muslim state in Anatolia. Ahî Evran gained the support of the Seljuk sultans." },
    focus: medFeature('anatolian-seljuk-lands', 38.8, 34.5, 1),
    picture: pic("anatolian-seljuks", "yunus"), sources: ["TDV İslâm Ansiklopedisi: Türkiye Selçukluları"],
  }),
  card({
    id: "ahilik-mongols", kind: "people", tr: "Moğollar", aliases: ["Mongols", "Mongol"],
    en: { title: "The Mongols", kindLabel: "People", periodLabel: "13th century", summary: "The Mongols invaded Anatolia in the 13th century. During the invasion, Ahî groups took control of city governments." },
    focus: medFeature('mongol-homeland', 49.6, 103, 1, { arrows: [{ from: [45.6, 100], to: [39.5, 40] }], view: { north: 62, west: 28, widthDegrees: 95 } }),
    picture: pic("mongols", "andalus"), sources: ["TDV İslâm Ansiklopedisi: Moğollar"],
  }),
  card({
    id: "ahilik-ottomans", kind: "empire", tr: "Osmanlı Devleti", aliases: ["Ottoman Empire"],
    en: { title: "The Ottoman Empire", kindLabel: "State", periodLabel: "From about 1300", summary: "The Ahî movement played a major role in the founding of the Ottoman Empire.", more: "Murad I joined the organization. Starting with Mehmed II, it lost its political power." },
    focus: medFeature('early-ottoman-lands', 40.2, 29.8, 1.4),
    picture: pic("ottomans", "yunus"), sources: ["TDV İslâm Ansiklopedisi: Osmanlılar"],
  }),
  card({
    id: "ahilik-murad-i", kind: "person", tr: "I. Murad", aliases: ["Murad I"],
    en: { title: "Murad I", kindLabel: "Ottoman sultan", periodLabel: "14th century", summary: "Murad I was an Ottoman ruler. He joined the Ahî organization." },
    focus: medFeature('early-ottoman-lands', 40.2, 29.8, 1.4),
    picture: pic("murad-i"), sources: ["TDV İslâm Ansiklopedisi: Murad I"],
  }),
  card({
    id: "ahilik-mehmed-ii", kind: "person", tr: "Fâtih Sultan Mehmed", aliases: ["Mehmed II"],
    en: { title: "Mehmed II", kindLabel: "Ottoman sultan", periodLabel: "15th century", summary: "Mehmed II was an Ottoman sultan. Starting in his rule, the Ahî organization lost its political power." },
    focus: medPoint(41.01, 28.98, 1.8),
    picture: pic("mehmed-ii"), sources: ["TDV İslâm Ansiklopedisi: Mehmed II"],
  }),
  card({
    id: "ahilik-ibn-battuta", kind: "person", tr: "İbn Battûta", aliases: ["Ibn Battuta"],
    en: { title: "Ibn Battuta", kindLabel: "Traveler", periodLabel: "14th century", summary: "Ibn Battuta was a traveler from Tangier. He said that the Ahî organization was unique in the world." },
    focus: medPoint(35.77, -5.8, 1.8),
    picture: pic("ibn-battuta"), sources: ["TDV İslâm Ansiklopedisi: İbn Battûta"],
  }),
];

export const AHILIK_SET: EntityBookSet = {
  entities,
  chapters: {
    "ahilik-a1": {
      1: ["ahilik-a1-anatolia", "ahilik-a1-ottomans"],
      2: [],
      3: [],
      4: [],
      5: [],
      6: ["ahilik-a1-anatolia"],
      7: [],
    },
    "ahilik-a2": {
      1: ["ahilik-a1-anatolia", "ahilik-a1-ottomans"],
      2: [],
      3: ["ahilik-a1-anatolia"],
      4: [],
      5: [],
      6: ["ahilik-a1-anatolia"],
      7: [],
    },
    "ahilik-b1": {
      1: ["ahilik-anatolia", "ahilik-ottomans"],
      2: ["ahilik-anatolia", "ahilik-abbasids"],
      3: ["ahilik-konya", "ahilik-suhreverdi", "ahilik-keykubad-i", "ahilik-nasir", "ahilik-abbasids"],
      4: ["ahilik-anatolia", "ahilik-central-asia", "ahilik-konya", "ahilik-kayseri", "ahilik-kirsehir", "ahilik-denizli", "ahilik-kosedag", "ahilik-ahi-evran", "ahilik-keykubad-i", "ahilik-giyaseddin-ii", "ahilik-anatolian-seljuks", "ahilik-mongols"],
      5: ["ahilik-anatolia", "ahilik-anatolian-seljuks"],
      6: ["ahilik-anatolia"],
      7: ["ahilik-anatolia", "ahilik-tangier", "ahilik-ottomans", "ahilik-murad-i", "ahilik-mehmed-ii", "ahilik-ibn-battuta"],
      8: [],
    },
    "ahilik-b2": {
      1: ["ahilik-anatolia", "ahilik-ottomans"],
      2: ["ahilik-anatolia", "ahilik-abbasids"],
      3: ["ahilik-konya", "ahilik-suhreverdi", "ahilik-keykubad-i", "ahilik-nasir", "ahilik-abbasids"],
      4: ["ahilik-anatolia", "ahilik-central-asia", "ahilik-konya", "ahilik-kayseri", "ahilik-kirsehir", "ahilik-denizli", "ahilik-kosedag", "ahilik-tokat", "ahilik-sivas", "ahilik-ahi-evran", "ahilik-keykubad-i", "ahilik-giyaseddin-ii", "ahilik-anatolian-seljuks", "ahilik-mongols"],
      5: ["ahilik-anatolia", "ahilik-anatolian-seljuks"],
      6: ["ahilik-anatolia"],
      7: ["ahilik-anatolia", "ahilik-tangier", "ahilik-ottomans", "ahilik-murad-i", "ahilik-mehmed-ii", "ahilik-ibn-battuta"],
      8: [],
    },
  },
};
