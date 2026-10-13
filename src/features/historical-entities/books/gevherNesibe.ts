import { defineEntity, type EntitySpec } from './define';
import { medFeature, medPoint } from '../mediterraneanMap';
import type { EntityBookSet } from './index';

// Places & People cards for The Gevher Nesibe Hospital (A2). The book is
// English only for now: the Arabic copy repeats the English until the Arabic
// edition arrives, then it is written here. Copy never goes beyond the story.
// Pictures: Storage places-people/Gevher_Nesibe/ (shared ones from Yunus/).

const CITY_ZOOM = 1.8;
type Text = { title: string; kindLabel: string; periodLabel: string; summary: string; more?: string };
const card = (spec: Omit<EntitySpec, 'aliases' | 'copy'> & { aliases: string[]; en: Text }) => defineEntity({
  ...spec,
  aliases: { en: spec.aliases, ar: [] },
  copy: { en: spec.en, ar: spec.en },
});
const pic = (name: string, folder = 'gevherNesibe') => ({ folder, name });

const entities = [
  card({
    id: 'gevher-gevher-nesibe-sultan', kind: 'person', tr: 'Gevher Nesibe Sultan', aliases: ['Gevher Nesibe Sultan'],
    en: { title: 'Gevher Nesibe Sultan', kindLabel: 'Seljuk princess', periodLabel: 'Late 12th century', summary: 'Gevher Nesibe Sultan was the daughter of Kılıçarslan II and the sister of Gıyâseddin Keyhusrev I. She died at a young age.', more: 'Her last wish was a hospital for sick people. Her grave is inside the Gıyâsiye Medresesi.' },
    focus: medPoint(38.72, 35.49, CITY_ZOOM),
    picture: pic('gevher-nesibe-sultan'), sources: ['TDV İslâm Ansiklopedisi: Gevher Nesibe Sultan'],
  }),
  card({
    id: 'gevher-giyaseddin-keyhusrev-i', kind: 'person', tr: 'I. Gıyâseddin Keyhusrev', aliases: ['Gıyâseddin Keyhusrev I', 'Gıyâseddin Keyhusrev'],
    en: { title: 'Gıyâseddin Keyhusrev I', kindLabel: 'Seljuk sultan', periodLabel: 'Early 13th century', summary: 'Gıyâseddin Keyhusrev I was a ruler of the Anatolian Seljuks and the brother of Gevher Nesibe Sultan.', more: 'To make his sister’s wish come true, he built the medical school and the hospital in Kayseri.' },
    focus: medFeature('anatolian-seljuk-lands', 38.8, 34.5, 1, { pins: [{ at: [37.87, 32.49], label: 'Konya' }] }),
    picture: pic('giyaseddin-keyhusrev-i'), sources: ['TDV İslâm Ansiklopedisi: Keyhusrev I'],
  }),
  card({
    id: 'gevher-kilicarslan-ii', kind: 'person', tr: 'II. Kılıçarslan', aliases: ['Kılıçarslan II'],
    en: { title: 'Kılıçarslan II', kindLabel: 'Seljuk sultan', periodLabel: '12th century', summary: 'Kılıçarslan II was a sultan of the Anatolian Seljuks. He was the father of Gevher Nesibe Sultan and Gıyâseddin Keyhusrev I.' },
    focus: medFeature('anatolian-seljuk-lands', 38.8, 34.5, 1, { pins: [{ at: [37.87, 32.49], label: 'Konya' }] }),
    picture: pic('kilicarslan-ii'), sources: ['TDV İslâm Ansiklopedisi: Kılıcarslan II'],
  }),
  card({
    id: 'gevher-mahmud-ii', kind: 'person', tr: 'II. Mahmud', aliases: ['Sultan Mahmud II', 'Mahmud II'],
    en: { title: 'Sultan Mahmud II', kindLabel: 'Ottoman sultan', periodLabel: '19th century', summary: 'Mahmud II was an Ottoman sultan. He built the Imperial Medical School.' },
    focus: medPoint(41.01, 28.98, CITY_ZOOM),
    picture: pic('mahmud-ii'), sources: ['TDV İslâm Ansiklopedisi: Mahmud II'],
  }),
  card({
    id: 'gevher-sadreddin-konevi', kind: 'person', tr: 'Sadreddin Konevî', aliases: ['Sadreddin Konevî'],
    en: { title: 'Sadreddin Konevî', kindLabel: 'Scholar', periodLabel: '13th century', summary: 'Sadreddin Konevî was a famous scholar. He was one of the teachers at the school in Kayseri.' },
    focus: medPoint(38.72, 35.49, CITY_ZOOM),
    picture: pic('sadreddin-konevi'), sources: ['TDV İslâm Ansiklopedisi: Sadreddin Konevî'],
  }),
  card({
    id: 'gevher-ekmeleddin-nahcuvani', kind: 'person', tr: 'Ekmeleddin en-Nahcuvânî', aliases: ['Ekmeleddin al-Nahcuvânî'],
    en: { title: 'Ekmeleddin al-Nahcuvânî', kindLabel: 'Doctor', periodLabel: '13th century', summary: 'Ekmeleddin al-Nahcuvânî was a doctor who taught at the school. He was Mevlânâ’s close friend and personal doctor.' },
    focus: medPoint(38.72, 35.49, CITY_ZOOM),
    picture: pic('ekmeleddin-nahcuvani'), sources: ['TDV İslâm Ansiklopedisi: Ekmeleddin en-Nahcuvânî'],
  }),
  card({
    id: 'gevher-mevlana', kind: 'person', tr: 'Mevlânâ Celâleddîn-i Rûmî', aliases: ['Mevlânâ'],
    en: { title: 'Mevlânâ', kindLabel: 'Scholar and poet', periodLabel: '13th century', summary: 'Mevlânâ was a great Muslim scholar and poet. He lived in Konya.', more: 'The doctor Ekmeleddin al-Nahcuvânî was his close friend.' },
    focus: medPoint(37.87, 32.49, CITY_ZOOM),
    picture: pic('mevlana-rumi', 'yunus'), sources: ['TDV İslâm Ansiklopedisi: Mevlânâ Celâleddîn-i Rûmî'],
  }),
  card({
    id: 'gevher-ibn-sina', kind: 'person', tr: 'İbn Sînâ', aliases: ['İbn Sînâ'],
    en: { title: 'İbn Sînâ', kindLabel: 'Doctor and scientist', periodLabel: '11th century', summary: 'İbn Sînâ was a famous doctor and scientist. Students at the school read his medical books.', more: 'He wrote that doctors must make patients’ minds and hearts stronger.' },
    focus: medFeature('transoxiana', 40, 65.5, 1, { view: { north: 52, west: 22, widthDegrees: 62 } }),
    picture: pic('ibn-sina'), sources: ['TDV İslâm Ansiklopedisi: İbn Sînâ'],
  }),
  card({
    id: 'gevher-hippocrates', kind: 'person', tr: 'Hipokrat', aliases: ['Hippocrates'],
    en: { title: 'Hippocrates', kindLabel: 'Doctor', periodLabel: 'Ancient Greece', summary: 'Hippocrates was an ancient Greek doctor. Students at the school also read his books.' },
    focus: medPoint(36.89, 27.29, CITY_ZOOM),
    picture: pic('hippocrates'), sources: ['TDV İslâm Ansiklopedisi: Bukrât'],
  }),
  card({
    id: 'gevher-er-razi', kind: 'person', tr: 'Ebû Bekir er-Râzî', aliases: ['Er-Râzî'],
    en: { title: 'Er-Râzî', kindLabel: 'Doctor and scientist', periodLabel: '10th century', summary: 'Er-Râzî was a scientist and doctor. He said that doctors should help sad and stressed patients with music.' },
    focus: medFeature('iran', 32.5, 54, 1, { view: { north: 52, west: 22, widthDegrees: 62 } }),
    picture: pic('er-razi'), sources: ['TDV İslâm Ansiklopedisi: Râzî, Ebû Bekir'],
  }),
  card({
    id: 'gevher-farabi', kind: 'person', tr: 'Fârâbî', aliases: ['Fârâbî'],
    en: { title: 'Fârâbî', kindLabel: 'Scientist', periodLabel: '10th century', summary: 'Fârâbî was a scientist. He studied how music changed human feelings.', more: 'He showed the best time of the day for each type of music.' },
    focus: medFeature('turkestan', 42.5, 68, 1, { view: { north: 52, west: 22, widthDegrees: 62 } }),
    picture: pic('farabi'), sources: ['TDV İslâm Ansiklopedisi: Fârâbî'],
  }),
  card({
    id: 'gevher-anatolian-seljuks', kind: 'kingdom', tr: 'Anadolu Selçukluları', aliases: ['Anatolian Seljuk State', 'Anatolian Seljuk'],
    en: { title: 'Anatolian Seljuks', kindLabel: 'State', periodLabel: '11th–14th century', summary: 'The Anatolian Seljuks were a Turkish Muslim state in Anatolia. Their capital was Konya.' },
    focus: medFeature('anatolian-seljuk-lands', 38.8, 34.5, 1),
    picture: pic('anatolian-seljuks', 'yunus'), sources: ['TDV İslâm Ansiklopedisi: Türkiye Selçukluları'],
  }),
  card({
    id: 'gevher-kayseri', kind: 'city', aliases: ['Kayseri'],
    en: { title: 'Kayseri', kindLabel: 'City', periodLabel: 'Central Anatolia', summary: 'Kayseri is an old city in central Anatolia. The Gevher Nesibe Hospital and Medical School is here.', more: 'Today, the old building is the Museum of the Seljuk Civilization.' },
    focus: medPoint(38.72, 35.49, CITY_ZOOM),
    picture: pic('kayseri', 'yunus'), sources: ['TDV İslâm Ansiklopedisi: Kayseri'],
  }),
  card({
    id: 'gevher-konya', kind: 'city', aliases: ['Konya'],
    en: { title: 'Konya', kindLabel: 'City', periodLabel: 'Capital of the Anatolian Seljuks', summary: 'Konya is a city in central Anatolia. When the hospital opened, it was the capital city of the Anatolian Seljuk State.' },
    focus: medPoint(37.87, 32.49, CITY_ZOOM),
    picture: pic('konya', 'yunus'), sources: ['TDV İslâm Ansiklopedisi: Konya'],
  }),
  card({
    id: 'gevher-sivas', kind: 'city', aliases: ['Sivas'],
    en: { title: 'Sivas', kindLabel: 'City', periodLabel: 'Central Anatolia', summary: 'Sivas is a city in central Anatolia. The Keykâvus Hospital is here.' },
    focus: medPoint(39.75, 37.02, CITY_ZOOM),
    picture: pic('sivas', 'yunus'), sources: ['TDV İslâm Ansiklopedisi: Sivas'],
  }),
  card({
    id: 'gevher-anatolia', kind: 'region', tr: 'Anadolu', aliases: ['Anatolia'],
    en: { title: 'Anatolia', kindLabel: 'Land', periodLabel: 'The Asian part of Türkiye', summary: 'Anatolia is a large land between the Black Sea and the Mediterranean Sea. The Gevher Nesibe Hospital is the oldest Seljuk hospital in Anatolia that is still standing.' },
    focus: medFeature('anatolia', 39, 33.5, 1),
    picture: pic('anatolia', 'yunus'), sources: ['TDV İslâm Ansiklopedisi: Anadolu'],
  }),
  card({
    id: 'gevher-europe', kind: 'region', tr: 'Avrupa', aliases: ['Europe', 'European'],
    en: { title: 'Europe', kindLabel: 'Land', periodLabel: 'West of Anatolia', summary: 'Europe is the land west of Anatolia. Its universities started classroom and practical medical training much later, in the 16th and 17th centuries.' },
    focus: medPoint(45, 10, 1),
    picture: pic('europe'), sources: ['TDV İslâm Ansiklopedisi: Avrupa'],
  }),
  card({
    id: 'gevher-complex', kind: 'landmark', tr: 'Gevher Nesibe Darüşşifası ve Tıp Medresesi (Çifte Medrese)', aliases: ['Gevher Nesibe Hospital and Medical School', 'Gevher Nesibe Hospital', 'Twin Madrasas'],
    en: { title: 'Gevher Nesibe Hospital and Medical School', kindLabel: 'Building', periodLabel: 'Built in 1205–1206', summary: 'Two buildings side by side in Kayseri: A medical school and a hospital. People call them the Twin Madrasas.', more: 'It was the first school and hospital together. Today it is the Museum of the Seljuk Civilization.' },
    focus: medPoint(38.72, 35.49, CITY_ZOOM),
    picture: pic('gevher-nesibe-complex'), sources: ['TDV İslâm Ansiklopedisi: Gevher Nesibe Dârüşşifâsı'],
  }),
  card({
    id: 'gevher-sifaiye', kind: 'landmark', tr: 'Şifâiye (Darüşşifa)', aliases: ['Şifâiye', 'Dârüşşifâ'],
    en: { title: 'Şifâiye (Dârüşşifâ)', kindLabel: 'Hospital', periodLabel: 'Built in 1205–1206', summary: 'The Şifâiye was the hospital in Kayseri. People also called it the Dârüşşifâ, “the house of healing.”', more: 'Students worked with real patients here.' },
    focus: medPoint(38.72, 35.49, CITY_ZOOM),
    picture: pic('sifaiye-hospital'), sources: ['TDV İslâm Ansiklopedisi: Gevher Nesibe Dârüşşifâsı'],
  }),
  card({
    id: 'gevher-giyasiye', kind: 'landmark', tr: 'Gıyâsiye Medresesi', aliases: ['Gıyâsiye Medresesi', 'Gıyâsiye'],
    en: { title: 'Gıyâsiye Medresesi', kindLabel: 'Medical school', periodLabel: 'Built in 1205–1206', summary: 'The Gıyâsiye was the medical school next to the hospital. Students learned their lessons here.', more: 'The grave of Gevher Nesibe Sultan is inside it.' },
    focus: medPoint(38.72, 35.49, CITY_ZOOM),
    picture: pic('giyasiye-madrasa'), sources: ['TDV İslâm Ansiklopedisi: Gevher Nesibe Dârüşşifâsı'],
  }),
  card({
    id: 'gevher-keykavus-hospital', kind: 'landmark', tr: 'İzzeddin Keykâvus Darüşşifası', aliases: ['Keykâvus Hospital'],
    en: { title: 'Keykâvus Hospital', kindLabel: 'Hospital', periodLabel: 'Seljuk period', summary: 'The Keykâvus Hospital is in Sivas. Its team of doctors was very similar to the team in Kayseri.' },
    focus: medPoint(39.75, 37.02, CITY_ZOOM),
    picture: pic('keykavus-hospital'), sources: ['TDV İslâm Ansiklopedisi: İzzeddin Keykâvus Dârüşşifâsı'],
  }),
  card({
    id: 'gevher-imperial-medical-school', kind: 'landmark', tr: 'Mekteb-i Tıbbiyye-i Adliyye-i Şâhâne', aliases: ['Imperial Medical School'],
    en: { title: 'Imperial Medical School', kindLabel: 'Medical school', periodLabel: 'Ottoman period', summary: 'The Imperial Medical School was an Ottoman medical school. Sultan Mahmud II built it.' },
    focus: medPoint(41.01, 28.98, CITY_ZOOM),
    picture: pic('imperial-medical-school'), sources: ['TDV İslâm Ansiklopedisi: Mekteb-i Tıbbiyye'],
  }),
];

const CHAPTERS: Record<number, string[]> = {
  1: ['gevher-complex', 'gevher-kayseri', 'gevher-anatolia', 'gevher-konya', 'gevher-anatolian-seljuks', 'gevher-giyaseddin-keyhusrev-i', 'gevher-gevher-nesibe-sultan', 'gevher-europe', 'gevher-mahmud-ii', 'gevher-imperial-medical-school'],
  2: ['gevher-gevher-nesibe-sultan', 'gevher-kilicarslan-ii', 'gevher-giyaseddin-keyhusrev-i', 'gevher-kayseri'],
  3: ['gevher-gevher-nesibe-sultan'],
  4: ['gevher-giyaseddin-keyhusrev-i', 'gevher-giyasiye', 'gevher-sifaiye', 'gevher-complex', 'gevher-gevher-nesibe-sultan'],
  5: ['gevher-giyasiye', 'gevher-sifaiye', 'gevher-keykavus-hospital', 'gevher-sivas'],
  6: ['gevher-sadreddin-konevi', 'gevher-mevlana', 'gevher-ekmeleddin-nahcuvani', 'gevher-ibn-sina', 'gevher-hippocrates'],
  7: ['gevher-complex'],
  8: [],
  9: ['gevher-ibn-sina'],
  10: ['gevher-ibn-sina', 'gevher-er-razi', 'gevher-farabi', 'gevher-complex'],
  11: ['gevher-complex', 'gevher-europe'],
};

export const GEVHER_NESIBE_SET: EntityBookSet = {
  entities,
  chapters: { 'gevherNesibe-a2': CHAPTERS },
};
