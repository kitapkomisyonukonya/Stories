import { defineEntity, type EntitySpec } from './define';
import { medFeature, medPoint } from '../mediterraneanMap';
import type { EntityBookSet } from './index';

// Places & People cards for Ahmed Yesevî (A1–B2). A1 and A2 share the simple cards; B1 and B2
// share the full set. Pictures: Storage places-people/yesevi/ (shared ones from yunus/, gevherNesibe/, kasgarli/).
// English only for now: the Arabic copy repeats the English until the Arabic edition arrives.
// Copy never goes beyond the story. A card without a picture file shows a placeholder.

type Text = { title: string; kindLabel: string; periodLabel: string; summary: string; more?: string };
const card = (spec: Omit<EntitySpec, 'aliases' | 'copy'> & { aliases: string[]; en: Text }) => defineEntity({
  ...spec,
  aliases: { en: spec.aliases, ar: [] },
  copy: { en: spec.en, ar: spec.en },
});
const pic = (name: string, folder = "yesevi") => ({ folder, name });

const entities = [
  card({
    id: "yesevi-a-ahmed-yesevi", kind: "person", tr: "Hoca Ahmed Yesevî", aliases: ["Ahmed Yesevî", "Yesevî"],
    en: { title: "Ahmed Yesevî", kindLabel: "Sufi teacher and poet", periodLabel: "11th–12th century", summary: "Ahmed Yesevî was a great Sufi teacher. He wrote poems in Turkish. People also call him Pîr-i Turkistan.", more: "He studied with Arslan Baba in Yesi and taught people there." },
    focus: medFeature('turkestan', 43.3, 68.27, 1, { view: { north: 52, west: 22, widthDegrees: 62 }, pins: [{ at: [43.3, 68.27], label: 'Yesi' }] }),
    picture: pic("ahmed-yesevi"), sources: ["TDV İslâm Ansiklopedisi: Ahmed Yesevî"],
  }),
  card({
    id: "yesevi-a-east-turkestan", kind: "region", tr: "Doğu Türkistan", aliases: ["East Turkestan"],
    en: { title: "East Turkestan", kindLabel: "Land", periodLabel: "Central Asia", summary: "East Turkestan is a land in Central Asia. Ahmed Yesevî was born there." },
    focus: medFeature('turkestan', 40.5, 80, 1, { view: { north: 52, west: 22, widthDegrees: 62 } }),
    picture: pic("east-turkestan"), sources: ["TDV İslâm Ansiklopedisi: Doğu Türkistan"],
  }),
  card({
    id: "yesevi-a-turkestan", kind: "region", tr: "Türkistan", aliases: ["Turkestan"],
    en: { title: "Turkestan", kindLabel: "Land", periodLabel: "Central Asia", summary: "Turkestan is a land in Central Asia. Ahmed Yesevî taught the Turkish people there.", more: "The city of Yesi was in Turkestan." },
    focus: medFeature('turkestan', 42.5, 68, 1, { view: { north: 52, west: 22, widthDegrees: 62 } }),
    picture: pic("turkestan", "yunus"), sources: ["TDV İslâm Ansiklopedisi: Türkistan"],
  }),
  card({
    id: "yesevi-a-yesi", kind: "city", tr: "Yesi (Türkistan şehri)", aliases: ["Yesi"],
    en: { title: "Yesi", kindLabel: "City", periodLabel: "Kazakhstan today", summary: "Ahmed Yesevî went to the city of Yesi when he was young. Today, Yesi is in Kazakhstan.", more: "He studied there with Arslan Baba." },
    focus: medFeature('turkestan', 43.3, 68.27, 1, { view: { north: 52, west: 22, widthDegrees: 62 }, pins: [{ at: [43.3, 68.27], label: 'Yesi' }] }),
    picture: pic("yesi"), sources: ["TDV İslâm Ansiklopedisi: Yesi"],
  }),
  card({
    id: "yesevi-a-bukhara", kind: "city", tr: "Buhara", aliases: ["Bukhara"],
    en: { title: "Bukhara", kindLabel: "City", periodLabel: "Uzbekistan today", summary: "Bukhara is a famous old city. Ahmed Yesevî went there, and then he returned to Yesi.", more: "Today, Bukhara is in Uzbekistan." },
    focus: medFeature('transoxiana', 39.77, 64.42, 1, { view: { north: 52, west: 22, widthDegrees: 62 }, pins: [{ at: [39.77, 64.42], label: 'Bukhara' }] }),
    picture: pic("bukhara", "kasgarli"), sources: ["TDV İslâm Ansiklopedisi: Buhara"],
  }),
  card({
    id: "yesevi-a-arslan-baba", kind: "person", tr: "Arslan Baba", aliases: ["Arslan Baba"],
    en: { title: "Arslan Baba", kindLabel: "Teacher", periodLabel: "11th century", summary: "Arslan Baba was a wise teacher. Ahmed Yesevî studied with him in Yesi." },
    focus: medFeature('turkestan', 43.3, 68.27, 1, { view: { north: 52, west: 22, widthDegrees: 62 }, pins: [{ at: [43.3, 68.27], label: 'Yesi' }] }),
    picture: pic("arslan-baba"), sources: ["TDV İslâm Ansiklopedisi: Arslan Baba"],
  }),
  card({
    id: "yesevi-a-hakim-ata", kind: "person", tr: "Hakîm Ata", aliases: ["Hakîm Ata", "Hakîm Süleyman"],
    en: { title: "Hakîm Ata", kindLabel: "Sufi poet", periodLabel: "12th century", summary: "Hakîm Ata was a student of Ahmed Yesevî. His name was Süleyman. Hakîm means “wise”.", more: "Later, he went to Khwarazm." },
    focus: medFeature('khwarezm', 41.5, 60.5, 1, { view: { north: 52, west: 22, widthDegrees: 62 } }),
    picture: pic("hakim-ata"), sources: ["TDV İslâm Ansiklopedisi: Hakîm Ata"],
  }),
  card({
    id: "yesevi-a-khwarazm", kind: "region", tr: "Harezm", aliases: ["Khwarazm"],
    en: { title: "Khwarazm", kindLabel: "Land", periodLabel: "Central Asia", summary: "Hakîm Ata went to Khwarazm. Today, this place is in Uzbekistan and Turkmenistan." },
    focus: medFeature('khwarezm', 41.5, 60.5, 1, { view: { north: 52, west: 22, widthDegrees: 62 } }),
    picture: pic("khwarezm", "yunus"), sources: ["TDV İslâm Ansiklopedisi: Hârizm"],
  }),
  card({
    id: "yesevi-a-karakhanids", kind: "dynasty", tr: "Karahanlılar", aliases: ["Karakhanid", "Karakhanids"],
    en: { title: "The Karakhanids", kindLabel: "Turkic state", periodLabel: "840–1212", summary: "The Karakhanids were a Turkic state. Ahmed Yesevî lived during the Karakhanid period." },
    focus: medFeature('turkestan', 42, 72, 1, { view: { north: 52, west: 22, widthDegrees: 62 } }),
    picture: pic("karakhanids", "kasgarli"), sources: ["TDV İslâm Ansiklopedisi: Karahanlılar"],
  }),
  card({
    id: "yesevi-a-tashkent", kind: "city", tr: "Taşkent", aliases: ["Tashkent"],
    en: { title: "Tashkent", kindLabel: "City", periodLabel: "Central Asia", summary: "Ahmed Yesevî became famous among the Turkic people near Tashkent." },
    focus: medFeature('turkestan', 41.3, 69.24, 1, { view: { north: 52, west: 22, widthDegrees: 62 }, pins: [{ at: [41.3, 69.24], label: 'Tashkent' }] }),
    picture: pic("tashkent"), sources: ["TDV İslâm Ansiklopedisi: Taşkent"],
  }),
  card({
    id: "yesevi-a-syr-darya", kind: "river", tr: "Seyhun (Sir Derya)", aliases: ["Syr Darya River", "Syr Darya"],
    en: { title: "The Syr Darya River", kindLabel: "River", periodLabel: "Central Asia", summary: "The Syr Darya is a long river in Central Asia. Ahmed Yesevî became famous among the Turkic people along this river." },
    focus: medFeature('transoxiana', 43.5, 66.5, 1, { view: { north: 52, west: 22, widthDegrees: 62 } }),
    picture: pic("syr-darya"), sources: ["TDV İslâm Ansiklopedisi: Seyhun"],
  }),
  card({
    id: "yesevi-a-anatolia", kind: "region", tr: "Anadolu", aliases: ["Anatolia"],
    en: { title: "Anatolia", kindLabel: "Land", periodLabel: "Türkiye today", summary: "Anatolia is a big land far to the west of Turkestan. Turkic people there deeply love Ahmed Yesevî." },
    focus: medFeature('anatolia', 39, 33.5, 1),
    picture: pic("anatolia", "yunus"), sources: ["TDV İslâm Ansiklopedisi: Anadolu"],
  }),
  card({
    id: "yesevi-a-balkans", kind: "region", tr: "Balkanlar", aliases: ["Balkans"],
    en: { title: "The Balkans", kindLabel: "Land", periodLabel: "South-east Europe", summary: "The Balkans are a land west of Anatolia. Turkic people there also love Ahmed Yesevî." },
    focus: medPoint(42.5, 22.5, 1.3),
    picture: pic("balkans"), sources: ["TDV İslâm Ansiklopedisi: Balkanlar"],
  }),
  card({
    id: "yesevi-ahmed-yesevi", kind: "person", tr: "Hoca Ahmed Yesevî", aliases: ["Hoca Ahmed Yesevî", "Ahmed Yesevî", "Hoca Ahmed", "Yesevî"],
    en: { title: "Ahmed Yesevî", kindLabel: "Sufi poet and guide", periodLabel: "11th–12th century", summary: "Ahmed Yesevî, known as Pîr-i Turkistan, was a great Sufi poet who wrote his poems in plain Turkish. His book is the Dîvân-ı Hikmet.", more: "He studied with Arslan Baba in Yesi and with Sheikh Yûsuf el-Hemedânî in Bukhara, then guided people in Yesi until his death." },
    focus: medFeature('turkestan', 43.3, 68.27, 1, { view: { north: 52, west: 22, widthDegrees: 62 }, pins: [{ at: [43.3, 68.27], label: 'Yesi' }] }),
    picture: pic("ahmed-yesevi"), sources: ["TDV İslâm Ansiklopedisi: Ahmed Yesevî"],
  }),
  card({
    id: "yesevi-sayram", kind: "city", tr: "Sayram", aliases: ["Sayram"],
    en: { title: "Sayram", kindLabel: "Town", periodLabel: "11th century", summary: "It is believed that Ahmed Yesevî was born in the town of Sayram in the second half of the 11th century." },
    focus: medFeature('turkestan', 42.3, 69.77, 1, { view: { north: 52, west: 22, widthDegrees: 62 }, pins: [{ at: [42.3, 69.77], label: 'Sayram' }] }),
    picture: pic("sayram"), sources: ["TDV İslâm Ansiklopedisi: Sayram"],
  }),
  card({
    id: "yesevi-yesi", kind: "city", tr: "Yesi (Türkistan şehri)", aliases: ["Yesi"],
    en: { title: "Yesi", kindLabel: "City", periodLabel: "Turkestan, Kazakhstan today", summary: "Ahmed Yesevî moved to Yesi at a young age and guided people there until his death. Today, Yesi is the city of Turkestan in Kazakhstan.", more: "Timur visited his tomb here and ordered a mausoleum over the grave." },
    focus: medFeature('turkestan', 43.3, 68.27, 1, { view: { north: 52, west: 22, widthDegrees: 62 }, pins: [{ at: [43.3, 68.27], label: 'Yesi' }] }),
    picture: pic("yesi"), sources: ["TDV İslâm Ansiklopedisi: Yesi"],
  }),
  card({
    id: "yesevi-turkestan", kind: "region", tr: "Türkistan", aliases: ["Turkestan"],
    en: { title: "Turkestan", kindLabel: "Land", periodLabel: "Central Asia", summary: "When Ahmed Yesevî grew up, Turkestan was a center for many fields of knowledge." },
    focus: medFeature('turkestan', 42.5, 68, 1, { view: { north: 52, west: 22, widthDegrees: 62 } }),
    picture: pic("turkestan", "yunus"), sources: ["TDV İslâm Ansiklopedisi: Türkistan"],
  }),
  card({
    id: "yesevi-east-turkestan", kind: "region", tr: "Doğu Türkistan", aliases: ["East Turkestan"],
    en: { title: "East Turkestan", kindLabel: "Land", periodLabel: "Central Asia", summary: "East Turkestan is a land in Central Asia. The town of Sayram, where Ahmed Yesevî was born, was in this region." },
    focus: medFeature('turkestan', 40.5, 80, 1, { view: { north: 52, west: 22, widthDegrees: 62 } }),
    picture: pic("east-turkestan"), sources: ["TDV İslâm Ansiklopedisi: Doğu Türkistan"],
  }),
  card({
    id: "yesevi-arslan-baba", kind: "person", tr: "Arslan Baba", aliases: ["Arslan Baba"],
    en: { title: "Arslan Baba", kindLabel: "Teacher", periodLabel: "11th century", summary: "Arslan Baba was Ahmed Yesevî’s first teacher in Yesi. After his death, Ahmed Yesevî went to Bukhara." },
    focus: medFeature('turkestan', 43.3, 68.27, 1, { view: { north: 52, west: 22, widthDegrees: 62 }, pins: [{ at: [43.3, 68.27], label: 'Yesi' }] }),
    picture: pic("arslan-baba"), sources: ["TDV İslâm Ansiklopedisi: Arslan Baba"],
  }),
  card({
    id: "yesevi-bukhara", kind: "city", tr: "Buhara", aliases: ["Bukhara"],
    en: { title: "Bukhara", kindLabel: "City", periodLabel: "A center of Islam", summary: "Bukhara was a very important center for Islam. Ahmed Yesevî studied there under Sheikh Yûsuf el-Hemedânî." },
    focus: medFeature('transoxiana', 39.77, 64.42, 1, { view: { north: 52, west: 22, widthDegrees: 62 }, pins: [{ at: [39.77, 64.42], label: 'Bukhara' }] }),
    picture: pic("bukhara", "kasgarli"), sources: ["TDV İslâm Ansiklopedisi: Buhara"],
  }),
  card({
    id: "yesevi-hemedani", kind: "person", tr: "Yûsuf el-Hemedânî", aliases: ["Sheikh Yûsuf el-Hemedânî", "Hemedânî"],
    en: { title: "Sheikh Yûsuf el-Hemedânî", kindLabel: "Sufi teacher", periodLabel: "11th–12th century", summary: "Sheikh Yûsuf el-Hemedânî was a teacher in Bukhara. Ahmed Yesevî learned Islamic sciences under his guidance." },
    focus: medFeature('transoxiana', 39.77, 64.42, 1, { view: { north: 52, west: 22, widthDegrees: 62 }, pins: [{ at: [39.77, 64.42], label: 'Bukhara' }] }),
    picture: pic("yusuf-hemedani"), sources: ["TDV İslâm Ansiklopedisi: Yûsuf el-Hemedânî"],
  }),
  card({
    id: "yesevi-gucduvani", kind: "person", tr: "Abdülhâlik Gucdüvânî", aliases: ["Sheikh Abdülhâlik Gucdüvânî", "Gucdüvânî"],
    en: { title: "Sheikh Abdülhâlik Gucdüvânî", kindLabel: "Sufi teacher", periodLabel: "12th century", summary: "Ahmed Yesevî handed over his duty as a spiritual guide to Sheikh Abdülhâlik Gucdüvânî, then returned to Yesi." },
    focus: medFeature('transoxiana', 39.77, 64.42, 1, { view: { north: 52, west: 22, widthDegrees: 62 }, pins: [{ at: [39.77, 64.42], label: 'Bukhara' }] }),
    picture: pic("gucduvani"), sources: ["TDV İslâm Ansiklopedisi: Abdülhâlik Gucdüvânî"],
  }),
  card({
    id: "yesevi-karakhanids", kind: "dynasty", tr: "Karahanlılar", aliases: ["Karakhanids"],
    en: { title: "The Karakhanids", kindLabel: "Turkic state", periodLabel: "840–1212", summary: "The Karakhanids were a Turkic state. Ahmed Yesevî lived in their era." },
    focus: medFeature('turkestan', 42, 72, 1, { view: { north: 52, west: 22, widthDegrees: 62 } }),
    picture: pic("karakhanids", "kasgarli"), sources: ["TDV İslâm Ansiklopedisi: Karahanlılar"],
  }),
  card({
    id: "yesevi-tashkent", kind: "city", tr: "Taşkent", aliases: ["Tashkent"],
    en: { title: "Tashkent", kindLabel: "City", periodLabel: "Central Asia", summary: "Ahmed Yesevî became widely known among the nomadic Turkic communities near Tashkent." },
    focus: medFeature('turkestan', 41.3, 69.24, 1, { view: { north: 52, west: 22, widthDegrees: 62 }, pins: [{ at: [41.3, 69.24], label: 'Tashkent' }] }),
    picture: pic("tashkent"), sources: ["TDV İslâm Ansiklopedisi: Taşkent"],
  }),
  card({
    id: "yesevi-syr-darya", kind: "river", tr: "Seyhun (Sir Derya)", aliases: ["Syr Darya River", "Syr Darya"],
    en: { title: "The Syr Darya River", kindLabel: "River", periodLabel: "Central Asia", summary: "Ahmed Yesevî became widely known among the nomadic Turkic communities along the Syr Darya River." },
    focus: medFeature('transoxiana', 43.5, 66.5, 1, { view: { north: 52, west: 22, widthDegrees: 62 } }),
    picture: pic("syr-darya"), sources: ["TDV İslâm Ansiklopedisi: Seyhun"],
  }),
  card({
    id: "yesevi-timur", kind: "person", tr: "Timur", aliases: ["Timur"],
    en: { title: "Timur", kindLabel: "Ruler", periodLabel: "Died 1405", summary: "Timur visited the tomb of Ahmed Yesevî in Yesi and ordered a mausoleum to be built over the grave.", more: "The building was left unfinished when Timur died in 1405." },
    focus: medFeature('turkestan', 43.3, 68.27, 1, { view: { north: 52, west: 22, widthDegrees: 62 }, pins: [{ at: [43.3, 68.27], label: 'Yesi' }] }),
    picture: pic("timur"), sources: ["TDV İslâm Ansiklopedisi: Timur"],
  }),
  card({
    id: "yesevi-mausoleum", kind: "landmark", tr: "Hoca Ahmed Yesevî Türbesi", aliases: ["tomb of Ahmed Yesevî"],
    en: { title: "The Mausoleum of Ahmed Yesevî", kindLabel: "Mausoleum", periodLabel: "Late 14th century", summary: "Timur ordered this mausoleum over the grave of Ahmed Yesevî in Yesi. Many people wanted to be buried near it.", more: "In 2003, it was added to the UNESCO World Heritage List." },
    focus: medFeature('turkestan', 43.3, 68.27, 1, { view: { north: 52, west: 22, widthDegrees: 62 }, pins: [{ at: [43.3, 68.27], label: 'Yesi' }] }),
    picture: pic("yesevi-mausoleum"), sources: ["UNESCO World Heritage List: Mausoleum of Khoja Ahmed Yasawi", "TDV İslâm Ansiklopedisi: Ahmed Yesevî Türbesi"],
  }),
  card({
    id: "yesevi-central-asia", kind: "region", tr: "Orta Asya", aliases: ["Central Asia"],
    en: { title: "Central Asia", kindLabel: "Land", periodLabel: "Steppes and cities", summary: "The Yesevî path spread among the Turks of Central Asia in a short time. His Dîvân-ı Hikmet is still a spiritual home for them." },
    focus: medFeature('central-asia', 43, 65, 1, { view: { north: 52, west: 22, widthDegrees: 62 } }),
    picture: pic("central-asia", "yunus"), sources: ["TDV İslâm Ansiklopedisi: Türkistan"],
  }),
  card({
    id: "yesevi-khorasan", kind: "region", tr: "Horasan", aliases: ["Khorasan"],
    en: { title: "Khorasan", kindLabel: "Land", periodLabel: "East of Iran", summary: "The sages of Khorasan, together with the sages of Anatolia, carried the banner of the Yesevî path." },
    focus: medFeature('khorasan', 36, 58, 1, { view: { north: 52, west: 22, widthDegrees: 62 } }),
    picture: pic("khorasan", "yunus"), sources: ["TDV İslâm Ansiklopedisi: Horasan"],
  }),
  card({
    id: "yesevi-anatolia", kind: "region", tr: "Anadolu", aliases: ["Anatolia"],
    en: { title: "Anatolia", kindLabel: "Land", periodLabel: "Türkiye today", summary: "The Yesevî path spread as far as Anatolia. Great thinkers who followed it built a civilization of wisdom in Anatolia." },
    focus: medFeature('anatolia', 39, 33.5, 1),
    picture: pic("anatolia", "yunus"), sources: ["TDV İslâm Ansiklopedisi: Anadolu"],
  }),
  card({
    id: "yesevi-balkans", kind: "region", tr: "Balkanlar", aliases: ["Balkans"],
    en: { title: "The Balkans", kindLabel: "Land", periodLabel: "South-east Europe", summary: "The Yesevî path spread across a very large area, as far as Anatolia and the Balkans." },
    focus: medPoint(42.5, 22.5, 1.3),
    picture: pic("balkans"), sources: ["TDV İslâm Ansiklopedisi: Balkanlar"],
  }),
  card({
    id: "yesevi-tapduk-emre", kind: "person", tr: "Tapduk Emre", aliases: ["Tapduk Emre"],
    en: { title: "Tapduk Emre", kindLabel: "Anatolian thinker", periodLabel: "Anatolia", summary: "Tapduk Emre was one of the great thinkers who followed Ahmed Yesevî’s path and built a civilization of wisdom in Anatolia." },
    focus: medFeature('anatolia', 39, 33.5, 1),
    picture: pic("taptuk-emre", "yunus"), sources: ["TDV İslâm Ansiklopedisi: Tapduk Emre"],
  }),
  card({
    id: "yesevi-yunus-emre", kind: "person", tr: "Yunus Emre", aliases: ["Yunus Emre"],
    en: { title: "Yunus Emre", kindLabel: "Anatolian thinker", periodLabel: "Anatolia", summary: "Yunus Emre was one of the great thinkers who followed Ahmed Yesevî’s path and built a civilization of wisdom in Anatolia." },
    focus: medFeature('anatolia', 39, 33.5, 1),
    picture: pic("yunus-emre", "yunus"), sources: ["TDV İslâm Ansiklopedisi: Yunus Emre"],
  }),
  card({
    id: "yesevi-mevlana", kind: "person", tr: "Mevlânâ Celâleddîn-i Rûmî", aliases: ["Mevlana Jalaluddin Rumi"],
    en: { title: "Mevlana Jalaluddin Rumi", kindLabel: "Anatolian thinker", periodLabel: "Anatolia", summary: "Mevlana Jalaluddin Rumi was one of the great thinkers who followed Ahmed Yesevî’s path and built a civilization of wisdom in Anatolia." },
    focus: medFeature('anatolia', 39, 33.5, 1),
    picture: pic("mevlana-rumi", "yunus"), sources: ["TDV İslâm Ansiklopedisi: Mevlânâ Celâleddîn-i Rûmî"],
  }),
  card({
    id: "yesevi-sadreddin-konevi", kind: "person", tr: "Sadreddin Konevî", aliases: ["Sadreddin Konevi"],
    en: { title: "Sadreddin Konevi", kindLabel: "Anatolian thinker", periodLabel: "Anatolia", summary: "Sadreddin Konevi was one of the great thinkers who followed Ahmed Yesevî’s path and built a civilization of wisdom in Anatolia." },
    focus: medFeature('anatolia', 39, 33.5, 1),
    picture: pic("sadreddin-konevi", "gevherNesibe"), sources: ["TDV İslâm Ansiklopedisi: Sadreddin Konevî"],
  }),
  card({
    id: "yesevi-haci-bektas", kind: "person", tr: "Hacı Bektâş-ı Velî", aliases: ["Hacı Bektaş-ı Veli"],
    en: { title: "Hacı Bektaş-ı Veli", kindLabel: "Anatolian thinker", periodLabel: "Anatolia", summary: "Hacı Bektaş-ı Veli was one of the great thinkers who followed Ahmed Yesevî’s path and built a civilization of wisdom in Anatolia." },
    focus: medFeature('anatolia', 39, 33.5, 1),
    picture: pic("haci-bektas-veli", "yunus"), sources: ["TDV İslâm Ansiklopedisi: Hacı Bektâş-ı Velî"],
  }),
  card({
    id: "yesevi-sari-saltuk", kind: "person", tr: "Sarı Saltuk", aliases: ["Sarı Saltuk"],
    en: { title: "Sarı Saltuk", kindLabel: "Anatolian thinker", periodLabel: "Anatolia", summary: "Sarı Saltuk was one of the great thinkers who followed Ahmed Yesevî’s path and built a civilization of wisdom in Anatolia." },
    focus: medFeature('anatolia', 39, 33.5, 1),
    picture: pic("saru-saltuk", "yunus"), sources: ["TDV İslâm Ansiklopedisi: Sarı Saltuk"],
  }),
  card({
    id: "yesevi-baba-ilyas", kind: "person", tr: "Baba İlyas", aliases: ["Baba İlyas"],
    en: { title: "Baba İlyas", kindLabel: "Anatolian thinker", periodLabel: "Anatolia", summary: "Baba İlyas was one of the great thinkers who followed Ahmed Yesevî’s path and built a civilization of wisdom in Anatolia." },
    focus: medFeature('anatolia', 39, 33.5, 1),
    picture: pic("baba-ilyas", "yunus"), sources: ["TDV İslâm Ansiklopedisi: Baba İlyas-ı Horasânî"],
  }),
  card({
    id: "yesevi-somuncu-baba", kind: "person", tr: "Somuncu Baba", aliases: ["Somuncu Baba"],
    en: { title: "Somuncu Baba", kindLabel: "Anatolian thinker", periodLabel: "Anatolia", summary: "Somuncu Baba was one of the great thinkers who followed Ahmed Yesevî’s path and built a civilization of wisdom in Anatolia." },
    focus: medFeature('anatolia', 39, 33.5, 1),
    picture: pic("somuncu-baba"), sources: ["TDV İslâm Ansiklopedisi: Somuncu Baba"],
  }),
];

export const YESEVI_SET: EntityBookSet = {
  entities,
  chapters: {
    "yesevi-a1": {
      1: ["yesevi-a-ahmed-yesevi", "yesevi-a-turkestan"],
      2: ["yesevi-a-east-turkestan", "yesevi-a-yesi", "yesevi-a-bukhara", "yesevi-a-arslan-baba"],
      3: ["yesevi-a-ahmed-yesevi"],
      4: ["yesevi-a-ahmed-yesevi"],
      5: ["yesevi-a-ahmed-yesevi", "yesevi-a-hakim-ata"],
      6: ["yesevi-a-ahmed-yesevi", "yesevi-a-hakim-ata", "yesevi-a-khwarazm"],
      7: ["yesevi-a-hakim-ata"],
    },
    "yesevi-a2": {
      1: ["yesevi-a-ahmed-yesevi"],
      2: ["yesevi-a-ahmed-yesevi", "yesevi-a-east-turkestan", "yesevi-a-turkestan", "yesevi-a-yesi", "yesevi-a-bukhara", "yesevi-a-arslan-baba", "yesevi-a-karakhanids"],
      3: ["yesevi-a-tashkent", "yesevi-a-syr-darya"],
      4: [],
      5: ["yesevi-a-ahmed-yesevi", "yesevi-a-anatolia", "yesevi-a-balkans"],
      6: ["yesevi-a-ahmed-yesevi", "yesevi-a-hakim-ata"],
      7: ["yesevi-a-ahmed-yesevi", "yesevi-a-yesi", "yesevi-a-hakim-ata", "yesevi-a-khwarazm"],
      8: ["yesevi-a-ahmed-yesevi", "yesevi-a-hakim-ata"],
    },
    "yesevi-b1": {
      1: ["yesevi-ahmed-yesevi"],
      2: ["yesevi-ahmed-yesevi", "yesevi-sayram", "yesevi-yesi", "yesevi-turkestan", "yesevi-east-turkestan", "yesevi-arslan-baba", "yesevi-karakhanids"],
      3: ["yesevi-ahmed-yesevi", "yesevi-yesi", "yesevi-arslan-baba", "yesevi-bukhara", "yesevi-hemedani", "yesevi-gucduvani"],
      4: ["yesevi-tashkent", "yesevi-syr-darya"],
      5: ["yesevi-ahmed-yesevi", "yesevi-yesi", "yesevi-timur", "yesevi-mausoleum", "yesevi-anatolia", "yesevi-balkans"],
      6: ["yesevi-ahmed-yesevi"],
      7: ["yesevi-ahmed-yesevi"],
      8: ["yesevi-ahmed-yesevi", "yesevi-turkestan", "yesevi-central-asia"],
      9: ["yesevi-ahmed-yesevi"],
      10: [],
      11: [],
      12: ["yesevi-ahmed-yesevi", "yesevi-central-asia", "yesevi-anatolia", "yesevi-balkans", "yesevi-tapduk-emre", "yesevi-yunus-emre", "yesevi-mevlana", "yesevi-sadreddin-konevi", "yesevi-haci-bektas", "yesevi-sari-saltuk", "yesevi-baba-ilyas", "yesevi-somuncu-baba"],
      13: [],
    },
    "yesevi-b2": {
      1: ["yesevi-ahmed-yesevi"],
      2: ["yesevi-ahmed-yesevi", "yesevi-sayram", "yesevi-yesi", "yesevi-turkestan", "yesevi-east-turkestan", "yesevi-arslan-baba", "yesevi-karakhanids"],
      3: ["yesevi-ahmed-yesevi", "yesevi-yesi", "yesevi-arslan-baba", "yesevi-bukhara", "yesevi-hemedani", "yesevi-gucduvani"],
      4: ["yesevi-tashkent", "yesevi-syr-darya"],
      5: ["yesevi-ahmed-yesevi", "yesevi-yesi", "yesevi-timur", "yesevi-mausoleum", "yesevi-central-asia", "yesevi-anatolia", "yesevi-balkans"],
      6: ["yesevi-ahmed-yesevi"],
      7: ["yesevi-ahmed-yesevi"],
      8: ["yesevi-ahmed-yesevi"],
      9: ["yesevi-ahmed-yesevi", "yesevi-turkestan", "yesevi-central-asia"],
      10: [],
      11: [],
      12: ["yesevi-ahmed-yesevi", "yesevi-central-asia", "yesevi-khorasan", "yesevi-anatolia", "yesevi-balkans", "yesevi-tapduk-emre", "yesevi-yunus-emre", "yesevi-mevlana", "yesevi-sadreddin-konevi", "yesevi-haci-bektas", "yesevi-sari-saltuk", "yesevi-baba-ilyas", "yesevi-somuncu-baba"],
      13: ["yesevi-ahmed-yesevi"],
    },
  },
};
