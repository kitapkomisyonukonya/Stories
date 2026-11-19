import { defineEntity, type EntitySpec } from './define';
import { medFeature, medPoint } from '../mediterraneanMap';
import type { EntityBookSet } from './index';
import type { HistoricalEntity } from '../types';

// Places & People cards for The Gevher Nesibe Hospital (A1–B2). The Arabic words
// of the cards are in src/content/entityCards.json, with the names as the Arabic
// editions write them. Copy never goes beyond the story.
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

// The A1 book has its own, simpler card words (A1 words, and only what the A1 story says).
// Maps, pictures and sources are the same as the A2 cards.
const byId: Record<string, HistoricalEntity> = Object.fromEntries(entities.map(entity => [entity.id, entity]));
const a1Card = (baseId: string, en: Text, aliasesEn: string[]): HistoricalEntity => {
  const base = byId[baseId];
  const words = { ...base.copy.en, ...en, mapAlt: base.copy.en.mapAlt.replace(base.copy.en.title, en.title) };
  return { ...base, id: baseId.replace(/^gevher-/, 'gevher-a1-'), aliases: { en: aliasesEn, ar: [] }, copy: { en: words, ar: words } };
};

const a1Entities: HistoricalEntity[] = [
  a1Card('gevher-complex', { title: 'The Gevher Nesibe Hospital and Medical School', kindLabel: 'Hospital and school', periodLabel: '1205–1206', summary: 'This old building in Kayseri was both a hospital and a school. It was the first place in the world with both.', more: 'Today, it is the Museum of the Seljuk Civilization.' }, ['Gevher Nesibe Hospital and Medical School', 'Gevher Nesibe Hospital', 'Twin Madrasas']),
  a1Card('gevher-kayseri', { title: 'Kayseri', kindLabel: 'City', periodLabel: 'Anatolia', summary: 'Kayseri is a city in Anatolia. The Gevher Nesibe Hospital and Medical School is here.', more: 'It is the oldest Seljuk hospital in Anatolia.' }, ['Kayseri']),
  a1Card('gevher-anatolia', { title: 'Anatolia', kindLabel: 'Land', periodLabel: 'Türkiye today', summary: 'Anatolia is a big land. Kayseri is a city in Anatolia.', more: 'Today, Anatolia is a part of Türkiye.' }, ['Anatolia']),
  a1Card('gevher-europe', { title: 'Europe', kindLabel: 'Land', periodLabel: 'Today and in history', summary: 'Europe is a big land. In Europe, similar schools started more than 300 years later.' }, ['Europe']),
  a1Card('gevher-gevher-nesibe-sultan', { title: 'Gevher Nesibe', kindLabel: 'Seljuk princess', periodLabel: 'The 1100s', summary: 'Gevher Nesibe was a Seljuk princess. She became very sick and died at a young age.', more: 'Her last wish was a hospital, free for everyone.' }, ['Gevher Nesibe']),
  a1Card('gevher-kilicarslan-ii', { title: 'Kılıçarslan II', kindLabel: 'Seljuk sultan', periodLabel: 'The 1100s', summary: 'Sultan Kılıçarslan II was a Seljuk sultan. He was the father of Gevher Nesibe.' }, ['Kılıçarslan II']),
  a1Card('gevher-giyaseddin-keyhusrev-i', { title: 'Gıyâseddin Keyhusrev I', kindLabel: 'Seljuk sultan', periodLabel: 'The early 1200s', summary: 'Sultan Gıyâseddin Keyhusrev I was the brother of Gevher Nesibe.', more: 'He kept his promise and built two buildings next to each other.' }, ['Gıyâseddin Keyhusrev I']),
  a1Card('gevher-giyasiye', { title: 'Gıyâsiye Madrasa', kindLabel: 'School for doctors', periodLabel: 'The early 1200s', summary: 'The Gıyâsiye Madrasa was a school for doctors. Gevher Nesibe’s grave is inside it.' }, ['Gıyâsiye Madrasa', 'Gıyâsiye']),
  a1Card('gevher-sifaiye', { title: 'Şifâiye', kindLabel: 'Hospital', periodLabel: 'The early 1200s', summary: 'The Şifâiye was the hospital. People also called it “the house of healing”.' }, ['Şifâiye']),
  a1Card('gevher-ibn-sina', { title: 'İbn Sînâ', kindLabel: 'Scientist', periodLabel: '980–1037', summary: 'İbn Sînâ was a great scientist. The students in Kayseri read his important books.', more: 'He wrote that kind words and music can help sick people.' }, ['İbn Sînâ']),
  a1Card('gevher-hippocrates', { title: 'Hippocrates', kindLabel: 'Doctor', periodLabel: 'Ancient Greece', summary: 'Hippocrates was a doctor from ancient Greece. The students in Kayseri read his books.' }, ['Hippocrates']),
  a1Card('gevher-farabi', { title: 'Fârâbî', kindLabel: 'Scientist', periodLabel: 'The 800s and 900s', summary: 'Fârâbî was a scientist. He also studied music.', more: 'He found that music can make people happy or calm.' }, ['Fârâbî']),
];

const A1_CHAPTERS: Record<number, string[]> = {
  1: ['gevher-a1-kayseri', 'gevher-a1-anatolia', 'gevher-a1-complex', 'gevher-a1-europe'],
  2: ['gevher-a1-gevher-nesibe-sultan', 'gevher-a1-kilicarslan-ii', 'gevher-a1-giyaseddin-keyhusrev-i', 'gevher-a1-kayseri'],
  3: ['gevher-a1-gevher-nesibe-sultan'],
  4: ['gevher-a1-giyaseddin-keyhusrev-i', 'gevher-a1-giyasiye', 'gevher-a1-sifaiye', 'gevher-a1-gevher-nesibe-sultan'],
  5: ['gevher-a1-giyasiye', 'gevher-a1-sifaiye'],
  6: ['gevher-a1-ibn-sina', 'gevher-a1-hippocrates'],
  7: ['gevher-a1-ibn-sina', 'gevher-a1-farabi', 'gevher-a1-kayseri'],
  8: ['gevher-a1-gevher-nesibe-sultan', 'gevher-a1-complex'],
};


// B1 and B2 share their own cards: the longer stories name more people and places, and the
// words follow them (Ibn Sînâ, al-Razi, Galen, Salerno …). Paris sits at the edge of the map.
const bEntities = [
  card({
    id: "gevher-b-complex", kind: "landmark", tr: "Gevher Nesibe Darüşşifası ve Tıp Medresesi (Çifte Medrese)", aliases: ["Gevher Nesibe Complex", "Gevher Nesibe Hospital", "Gevher Nesibe Dârüşşifâ", "Twin Madrasas"],
    en: { title: "The Gevher Nesibe Complex", kindLabel: "Hospital and medical school", periodLabel: "13th century", summary: "The complex in Kayseri has a medical school and a hospital, built together in one place. People call them the Twin Madrasas.", more: "It is the oldest Anatolian Seljuk hospital still standing. Today it is the Museum of the Seljuk Civilization." },
    focus: medPoint(38.72, 35.49, CITY_ZOOM),
    picture: pic("gevher-nesibe-complex"), sources: ["TDV İslâm Ansiklopedisi: Gevher Nesibe Dârüşşifâsı"],
  }),
  card({
    id: "gevher-b-gevher-nesibe-sultan", kind: "person", tr: "Gevher Nesibe Sultan", aliases: ["Gevher Nesibe Sultan"],
    en: { title: "Gevher Nesibe Sultan", kindLabel: "Seljuk princess", periodLabel: "Late 12th century", summary: "Gevher Nesibe Sultan was the daughter of Kılıçarslan II and the sister of Gıyâseddin Keyhusrev I. She died at a young age.", more: "Her brother built the complex to follow her final wish. She was buried in her tomb inside the madrasa." },
    focus: medPoint(38.72, 35.49, CITY_ZOOM),
    picture: pic("gevher-nesibe-sultan"), sources: ["TDV İslâm Ansiklopedisi: Gevher Nesibe Sultan"],
  }),
  card({
    id: "gevher-b-giyaseddin-keyhusrev-i", kind: "person", tr: "I. Gıyâseddin Keyhusrev", aliases: ["Gıyâseddin Keyhusrev I", "Gıyâseddin Keyhusrev"],
    en: { title: "Gıyâseddin Keyhusrev I", kindLabel: "Seljuk ruler", periodLabel: "Early 13th century", summary: "Gıyâseddin Keyhusrev I was an Anatolian Seljuk ruler and the brother of Gevher Nesibe Sultan.", more: "To follow his sister’s wish, he built a madrasa and a hospital in Kayseri." },
    focus: medFeature('anatolian-seljuk-lands', 38.8, 34.5, 1, { pins: [{ at: [37.87, 32.49], label: 'Konya' }] }),
    picture: pic("giyaseddin-keyhusrev-i"), sources: ["TDV İslâm Ansiklopedisi: Keyhusrev I"],
  }),
  card({
    id: "gevher-b-kilicarslan-ii", kind: "person", tr: "II. Kılıçarslan", aliases: ["Kılıçarslan II"],
    en: { title: "Kılıçarslan II", kindLabel: "Seljuk sultan", periodLabel: "12th century", summary: "Kılıçarslan II was the father of Gevher Nesibe Sultan and Gıyâseddin Keyhusrev I." },
    focus: medFeature('anatolian-seljuk-lands', 38.8, 34.5, 1, { pins: [{ at: [37.87, 32.49], label: 'Konya' }] }),
    picture: pic("kilicarslan-ii"), sources: ["TDV İslâm Ansiklopedisi: Kılıcarslan II"],
  }),
  card({
    id: "gevher-b-mahmud-ii", kind: "person", tr: "II. Mahmud", aliases: ["Sultan Mahmud II", "Mahmud II"],
    en: { title: "Sultan Mahmud II", kindLabel: "Ottoman sultan", periodLabel: "19th century", summary: "Mahmud II was an Ottoman sultan. He built the Imperial Medical School." },
    focus: medPoint(41.01, 28.98, CITY_ZOOM),
    picture: pic("mahmud-ii"), sources: ["TDV İslâm Ansiklopedisi: Mahmud II"],
  }),
  card({
    id: "gevher-b-imperial-medical-school", kind: "landmark", tr: "Mekteb-i Tıbbiyye-i Adliyye-i Şâhâne", aliases: ["Imperial Medical School"],
    en: { title: "Imperial Medical School", kindLabel: "Medical school", periodLabel: "Ottoman period", summary: "The Imperial Medical School was built by the Ottoman Sultan Mahmud II. It opened more than 600 years after the medical school in Kayseri." },
    focus: medPoint(41.01, 28.98, CITY_ZOOM),
    picture: pic("imperial-medical-school"), sources: ["TDV İslâm Ansiklopedisi: Mekteb-i Tıbbiyye"],
  }),
  card({
    id: "gevher-b-sadreddin-konevi", kind: "person", tr: "Sadreddin Konevî", aliases: ["Sadreddin Konevî"],
    en: { title: "Sadreddin Konevî", kindLabel: "Scholar", periodLabel: "13th century", summary: "Sadreddin Konevî was one of the famous scholars who taught at the school in Kayseri." },
    focus: medPoint(38.72, 35.49, CITY_ZOOM),
    picture: pic("sadreddin-konevi"), sources: ["TDV İslâm Ansiklopedisi: Sadreddin Konevî"],
  }),
  card({
    id: "gevher-b-ekmeleddin-nahcuvani", kind: "person", tr: "Ekmeleddin en-Nahcuvânî", aliases: ["Ekmeleddin al-Nahcuvânî"],
    en: { title: "Ekmeleddin al-Nahcuvânî", kindLabel: "Doctor", periodLabel: "13th century", summary: "Ekmeleddin al-Nahcuvânî taught at the school in Kayseri. He was Mevlânâ’s close friend and doctor." },
    focus: medPoint(38.72, 35.49, CITY_ZOOM),
    picture: pic("ekmeleddin-nahcuvani"), sources: ["TDV İslâm Ansiklopedisi: Ekmeleddin en-Nahcuvânî"],
  }),
  card({
    id: "gevher-b-mevlana", kind: "person", tr: "Mevlânâ Celâleddîn-i Rûmî", aliases: ["Mevlânâ"],
    en: { title: "Mevlânâ", kindLabel: "Scholar and poet", periodLabel: "13th century", summary: "Mevlânâ was a great Muslim scholar and poet. The doctor Ekmeleddin al-Nahcuvânî was his close friend." },
    focus: medPoint(37.87, 32.49, CITY_ZOOM),
    picture: pic("mevlana-rumi", "yunus"), sources: ["TDV İslâm Ansiklopedisi: Mevlânâ Celâleddîn-i Rûmî"],
  }),
  card({
    id: "gevher-b-kutbuddin-shirazi", kind: "person", tr: "Kutbüddin-i Şîrâzî", aliases: ["Kutbüddin al-Shirazi"],
    en: { title: "Kutbüddin al-Shirazi", kindLabel: "Doctor", periodLabel: "13th century", summary: "Kutbüddin al-Shirazi was a famous eye doctor. He taught at the school in Kayseri." },
    focus: medPoint(38.72, 35.49, CITY_ZOOM),
    picture: pic("kutbuddin-shirazi"), sources: ["TDV İslâm Ansiklopedisi: Kutbüddîn-i Şîrâzî"],
  }),
  card({
    id: "gevher-b-abdullatif-baghdadi", kind: "person", tr: "Abdüllatîf el-Bağdâdî", aliases: ["Abdüllatîf al-Baghdadî"],
    en: { title: "Abdüllatîf al-Baghdadî", kindLabel: "Scholar", periodLabel: "Died 1231", summary: "Abdüllatîf al-Baghdadî was a versatile scholar and philosopher. He was one of the scholars at the complex in Kayseri." },
    focus: medPoint(38.72, 35.49, CITY_ZOOM),
    picture: pic("abdullatif-baghdadi"), sources: ["TDV İslâm Ansiklopedisi: Abdüllatîf el-Bağdâdî"],
  }),
  card({
    id: "gevher-b-ibn-sina", kind: "person", tr: "İbn Sînâ", aliases: ["Ibn Sînâ", "Avicenna"],
    en: { title: "Ibn Sînâ", kindLabel: "Doctor and scientist", periodLabel: "11th century", summary: "Ibn Sînâ, known as Avicenna in the West, was a famous doctor and scientist. Students in Kayseri studied his books.", more: "In Kitâbü’ş-Şifâ, he wrote that one of the best ways to treat patients is to make their minds and spirits stronger." },
    focus: medFeature('transoxiana', 40, 65.5, 1, { view: { north: 52, west: 22, widthDegrees: 62 } }),
    picture: pic("ibn-sina"), sources: ["TDV İslâm Ansiklopedisi: İbn Sînâ"],
  }),
  card({
    id: "gevher-b-er-razi", kind: "person", tr: "Ebû Bekir er-Râzî", aliases: ["Abu Bakr al-Razi", "al-Razi", "Al-Razi", "Razi"],
    en: { title: "Al-Razi", kindLabel: "Doctor and scientist", periodLabel: "10th century", summary: "Al-Razi was a famous doctor. Students in Kayseri studied his works.", more: "He noted that sad and stressed patients should be treated with music." },
    focus: medFeature('iran', 32.5, 54, 1, { view: { north: 52, west: 22, widthDegrees: 62 } }),
    picture: pic("er-razi"), sources: ["TDV İslâm Ansiklopedisi: Râzî, Ebû Bekir"],
  }),
  card({
    id: "gevher-b-biruni", kind: "person", tr: "Bîrûnî", aliases: ["Bîrûnî"],
    en: { title: "Bîrûnî", kindLabel: "Scientist", periodLabel: "11th century", summary: "Bîrûnî was a famous scientist. Treatment methods in the hospital were based on his ideas and on the ideas of Ibn Sînâ." },
    focus: medFeature('khwarezm', 41.5, 60.5, 1, { view: { north: 52, west: 22, widthDegrees: 62 } }),
    picture: pic("biruni"), sources: ["TDV İslâm Ansiklopedisi: Bîrûnî"],
  }),
  card({
    id: "gevher-b-farabi", kind: "person", tr: "Fârâbî", aliases: ["Fârâbî"],
    en: { title: "Fârâbî", kindLabel: "Scientist", periodLabel: "10th century", summary: "Fârâbî was a scientist. He studied how different musical modes (makams) affect the human soul." },
    focus: medFeature('turkestan', 42.5, 68, 1, { view: { north: 52, west: 22, widthDegrees: 62 } }),
    picture: pic("farabi"), sources: ["TDV İslâm Ansiklopedisi: Fârâbî"],
  }),
  card({
    id: "gevher-b-hippocrates", kind: "person", tr: "Hipokrat", aliases: ["Hippocrates"],
    en: { title: "Hippocrates", kindLabel: "Doctor", periodLabel: "Ancient Greece", summary: "Hippocrates was an ancient Greek doctor. Students in Kayseri read Arabic translations of his works." },
    focus: medPoint(36.89, 27.29, CITY_ZOOM),
    picture: pic("hippocrates"), sources: ["TDV İslâm Ansiklopedisi: Bukrât"],
  }),
  card({
    id: "gevher-b-galen", kind: "person", tr: "Galen (Câlînûs)", aliases: ["Galen"],
    en: { title: "Galen", kindLabel: "Doctor", periodLabel: "Ancient Rome", summary: "Galen was a doctor in the ancient Roman world. Students in Kayseri read Arabic translations of his works." },
    focus: medFeature('roman-empire', 40, 18, 1),
    picture: pic("galen"), sources: ["TDV İslâm Ansiklopedisi: Câlînûs"],
  }),
  card({
    id: "gevher-b-kayseri", kind: "city", aliases: ["Kayseri"],
    en: { title: "Kayseri", kindLabel: "City", periodLabel: "Second Seljuk capital", summary: "Kayseri was a second capital of the Anatolian Seljuks. It was known as ‘Makarr-ı Ulemâ’.", more: "The Gevher Nesibe Complex is here." },
    focus: medPoint(38.72, 35.49, CITY_ZOOM),
    picture: pic("kayseri", "yunus"), sources: ["TDV İslâm Ansiklopedisi: Kayseri"],
  }),
  card({
    id: "gevher-b-konya", kind: "city", aliases: ["Konya"],
    en: { title: "Konya", kindLabel: "City", periodLabel: "Capital of the Anatolian Seljuks", summary: "When the complex in Kayseri was built, Konya was the capital of the Anatolian Seljuk State." },
    focus: medPoint(37.87, 32.49, CITY_ZOOM),
    picture: pic("konya", "yunus"), sources: ["TDV İslâm Ansiklopedisi: Konya"],
  }),
  card({
    id: "gevher-b-sivas", kind: "city", aliases: ["Sivas"],
    en: { title: "Sivas", kindLabel: "City", periodLabel: "Central Anatolia", summary: "Sivas is a city in Anatolia. The Keykâvus Hospital is here." },
    focus: medPoint(39.75, 37.02, CITY_ZOOM),
    picture: pic("sivas", "yunus"), sources: ["TDV İslâm Ansiklopedisi: Sivas"],
  }),
  card({
    id: "gevher-b-keykavus-hospital", kind: "landmark", tr: "İzzeddin Keykâvus Darüşşifası", aliases: ["Keykâvus Hospital", "Keykâvus Dârüşşifâ"],
    en: { title: "Keykâvus Hospital", kindLabel: "Hospital", periodLabel: "Seljuk period", summary: "The Keykâvus Hospital is in Sivas. Its staff was very similar to the staff in Kayseri." },
    focus: medPoint(39.75, 37.02, CITY_ZOOM),
    picture: pic("keykavus-hospital"), sources: ["TDV İslâm Ansiklopedisi: İzzeddin Keykâvus Dârüşşifâsı"],
  }),
  card({
    id: "gevher-b-giyasiye", kind: "landmark", tr: "Gıyâsiye Medresesi", aliases: ["Gıyâsiye Medresesi", "Gıyâsiye"],
    en: { title: "Gıyâsiye Medresesi", kindLabel: "Medical school", periodLabel: "13th century", summary: "The Gıyâsiye was the medical school of the complex. Students learned theory here.", more: "Gevher Nesibe Sultan was buried in her tomb inside it." },
    focus: medPoint(38.72, 35.49, CITY_ZOOM),
    picture: pic("giyasiye-madrasa"), sources: ["TDV İslâm Ansiklopedisi: Gevher Nesibe Dârüşşifâsı"],
  }),
  card({
    id: "gevher-b-sifaiye", kind: "landmark", tr: "Şifâiye (Darüşşifa)", aliases: ["Şifâiye Hospital", "Şifâiye"],
    en: { title: "Şifâiye", kindLabel: "Hospital", periodLabel: "13th century", summary: "The Şifâiye was the hospital of the complex. Students practiced at patients’ bedsides here." },
    focus: medPoint(38.72, 35.49, CITY_ZOOM),
    picture: pic("sifaiye-hospital"), sources: ["TDV İslâm Ansiklopedisi: Gevher Nesibe Dârüşşifâsı"],
  }),
  card({
    id: "gevher-b-anatolia", kind: "region", tr: "Anadolu", aliases: ["Anatolia"],
    en: { title: "Anatolia", kindLabel: "Land", periodLabel: "The Asian part of Türkiye", summary: "Anatolia is a large land between the Black Sea and the Mediterranean Sea. In the 13th century, medical training here joined classroom lessons with work at patients’ bedsides." },
    focus: medFeature('anatolia', 39, 33.5, 1),
    picture: pic("anatolia", "yunus"), sources: ["TDV İslâm Ansiklopedisi: Anadolu"],
  }),
  card({
    id: "gevher-b-europe", kind: "region", tr: "Avrupa", aliases: ["Europe"],
    en: { title: "Europe", kindLabel: "Land", periodLabel: "West of Anatolia", summary: "Europe is the land west of Anatolia. This kind of medical training did not appear there until the 16th and 17th centuries." },
    focus: medPoint(45, 10, 1),
    picture: pic("europe"), sources: ["TDV İslâm Ansiklopedisi: Avrupa"],
  }),
  card({
    id: "gevher-b-salerno", kind: "city", tr: "Salerno", aliases: ["Salerno"],
    en: { title: "Salerno", kindLabel: "City", periodLabel: "Italy", summary: "Salerno had one of the first famous medical universities. The Gevher Nesibe Hospital was more advanced in many ways." },
    focus: medPoint(40.68, 14.77, 1.6),
    picture: pic("salerno"), sources: ["Encyclopaedia Britannica: Salerno, medical school of"],
  }),
  card({
    id: "gevher-b-bologna", kind: "city", tr: "Bologna", aliases: ["Bologna"],
    en: { title: "Bologna", kindLabel: "City", periodLabel: "Italy", summary: "Bologna had one of the first famous universities that taught medicine." },
    focus: medPoint(44.49, 11.34, 1.6),
    picture: pic("bologna"), sources: ["Encyclopaedia Britannica: University of Bologna"],
  }),
  card({
    id: "gevher-b-paris", kind: "city", tr: "Paris", aliases: ["Paris"],
    en: { title: "Paris", kindLabel: "City", periodLabel: "France", summary: "Paris had one of the first famous universities that taught medicine." },
    focus: medPoint(47.9, 2.35, 1),
    picture: pic("paris"), sources: ["Encyclopaedia Britannica: University of Paris"],
  }),
];

const B1_CHAPTERS: Record<number, string[]> = {
  1: ["gevher-b-complex", "gevher-b-gevher-nesibe-sultan", "gevher-b-giyaseddin-keyhusrev-i", "gevher-b-mahmud-ii", "gevher-b-imperial-medical-school", "gevher-b-kayseri", "gevher-b-konya", "gevher-b-europe"],
  2: ["gevher-b-gevher-nesibe-sultan", "gevher-b-giyaseddin-keyhusrev-i", "gevher-b-kilicarslan-ii", "gevher-b-kayseri"],
  3: ["gevher-b-gevher-nesibe-sultan"],
  4: ["gevher-b-complex", "gevher-b-gevher-nesibe-sultan", "gevher-b-giyaseddin-keyhusrev-i", "gevher-b-giyasiye", "gevher-b-sifaiye"],
  5: ["gevher-b-sivas", "gevher-b-keykavus-hospital", "gevher-b-giyasiye", "gevher-b-sifaiye"],
  6: ["gevher-b-sadreddin-konevi", "gevher-b-ekmeleddin-nahcuvani", "gevher-b-mevlana", "gevher-b-kutbuddin-shirazi", "gevher-b-ibn-sina", "gevher-b-er-razi", "gevher-b-hippocrates", "gevher-b-galen", "gevher-b-giyasiye", "gevher-b-sifaiye"],
  7: ["gevher-b-complex"],
  8: [],
  9: ["gevher-b-ibn-sina", "gevher-b-biruni"],
  10: ["gevher-b-complex", "gevher-b-ibn-sina", "gevher-b-er-razi", "gevher-b-farabi"],
  11: ["gevher-b-complex", "gevher-b-gevher-nesibe-sultan", "gevher-b-salerno", "gevher-b-bologna", "gevher-b-paris"],
};

const B2_CHAPTERS: Record<number, string[]> = {
  1: ["gevher-b-complex", "gevher-b-gevher-nesibe-sultan", "gevher-b-giyaseddin-keyhusrev-i", "gevher-b-mahmud-ii", "gevher-b-imperial-medical-school", "gevher-b-kayseri", "gevher-b-konya", "gevher-b-anatolia", "gevher-b-europe"],
  2: ["gevher-b-gevher-nesibe-sultan", "gevher-b-giyaseddin-keyhusrev-i", "gevher-b-kilicarslan-ii", "gevher-b-kayseri"],
  3: ["gevher-b-gevher-nesibe-sultan"],
  4: ["gevher-b-complex", "gevher-b-gevher-nesibe-sultan", "gevher-b-giyaseddin-keyhusrev-i", "gevher-b-giyasiye", "gevher-b-sifaiye"],
  5: ["gevher-b-sivas", "gevher-b-keykavus-hospital", "gevher-b-giyasiye", "gevher-b-sifaiye"],
  6: ["gevher-b-sadreddin-konevi", "gevher-b-ekmeleddin-nahcuvani", "gevher-b-mevlana", "gevher-b-kutbuddin-shirazi", "gevher-b-abdullatif-baghdadi", "gevher-b-ibn-sina", "gevher-b-er-razi", "gevher-b-hippocrates", "gevher-b-galen", "gevher-b-kayseri", "gevher-b-giyasiye", "gevher-b-sifaiye"],
  7: ["gevher-b-complex"],
  8: [],
  9: ["gevher-b-ibn-sina", "gevher-b-biruni"],
  10: ["gevher-b-complex", "gevher-b-ibn-sina", "gevher-b-er-razi", "gevher-b-farabi"],
  11: ["gevher-b-complex", "gevher-b-gevher-nesibe-sultan", "gevher-b-salerno", "gevher-b-bologna", "gevher-b-paris"],
};
export const GEVHER_NESIBE_SET: EntityBookSet = {
  entities: [...entities, ...a1Entities, ...bEntities],
  chapters: { 'gevherNesibe-a2': CHAPTERS, 'gevherNesibe-a1': A1_CHAPTERS, 'gevherNesibe-b1': B1_CHAPTERS, 'gevherNesibe-b2': B2_CHAPTERS },
};
