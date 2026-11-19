import { defineEntity, type EntitySpec } from './define';
import { medFeature, medPoint } from '../mediterraneanMap';
import type { EntityBookSet } from './index';

// Places & People cards for Al-Andalus (Endülüs) B1 and B2. These two books tell the history of
// Al-Andalus, not Ibn Jubayr’s journey, so they have their own cards. Pictures: Storage places-people/andalus/.
// The Arabic words of the cards are in src/content/entityCards.json, with the names as the Arabic editions write them.
// Copy never goes beyond the story. A card without a picture file shows a placeholder.

type Text = { title: string; kindLabel: string; periodLabel: string; summary: string; more?: string };
const card = (spec: Omit<EntitySpec, 'aliases' | 'copy'> & { aliases: string[]; en: Text }) => defineEntity({
  ...spec,
  aliases: { en: spec.aliases, ar: [] },
  copy: { en: spec.en, ar: spec.en },
});
const pic = (name: string, folder = "andalus") => ({ folder, name });

const entities = [
  card({
    id: "andalus-b-al-andalus", kind: "region", tr: "Endülüs", aliases: ["Al-Andalus"],
    en: { title: "Al-Andalus", kindLabel: "Land", periodLabel: "711–1492", summary: "Al-Andalus was the land in the Iberian Peninsula that Muslims ruled from 711 to 1492.", more: "Muslims lived there for 781 years, until only the Kingdom of Granada was left." },
    focus: medFeature('al-andalus', 38.6, -4.6, 1.5),
    picture: pic("al-andalus", "andalus"), sources: ["TDV İslâm Ansiklopedisi: Endülüs"],
  }),
  card({
    id: "andalus-b-iberian-peninsula", kind: "region", tr: "İber Yarımadası", aliases: ["Iberian Peninsula"],
    en: { title: "The Iberian Peninsula", kindLabel: "Land", periodLabel: "Spain and Portugal today", summary: "The Iberian Peninsula today includes Spain and Portugal. In 711, Tariq ibn Ziyad started its conquest with an army." },
    focus: medPoint(40, -4, 1.2),
    picture: pic("iberian-peninsula"), sources: ["TDV İslâm Ansiklopedisi: Endülüs"],
  }),
  card({
    id: "andalus-b-cordoba", kind: "city", tr: "Kurtuba", aliases: ["Córdoba"],
    en: { title: "Córdoba", kindLabel: "City", periodLabel: "Capital of Al-Andalus", summary: "Córdoba was the capital of Al-Andalus. With 300,000 to 500,000 people, it was the biggest city in Western Europe.", more: "The German poetess Hrotsvitha called it “the ornament of the world.”" },
    focus: medPoint(37.88, -4.78, 1.8),
    picture: pic("cordoba", "andalus"), sources: ["TDV İslâm Ansiklopedisi: Kurtuba"],
  }),
  card({
    id: "andalus-b-granada", kind: "city", tr: "Gırnata", aliases: ["Granada"],
    en: { title: "Granada", kindLabel: "City", periodLabel: "The last Muslim kingdom", summary: "The Kingdom of Granada was the last Muslim land in Al-Andalus. The Alhambra Palace is in Granada." },
    focus: medPoint(37.18, -3.6, 1.8),
    picture: pic("granada", "andalus"), sources: ["TDV İslâm Ansiklopedisi: Gırnata"],
  }),
  card({
    id: "andalus-b-seville", kind: "city", tr: "İşbîliye (Sevilla)", aliases: ["Seville"],
    en: { title: "Seville", kindLabel: "City", periodLabel: "Al-Andalus", summary: "In the golden age, Seville had 500 bathhouses and 1,000 mosques.", more: "The Alcazar of Seville is a royal palace in the center of the city." },
    focus: medPoint(37.39, -5.98, 1.8),
    picture: pic("seville", "andalus"), sources: ["TDV İslâm Ansiklopedisi: İşbîliye"],
  }),
  card({
    id: "andalus-b-toledo", kind: "city", tr: "Tuleytula (Toledo)", aliases: ["Toledo"],
    en: { title: "Toledo", kindLabel: "City", periodLabel: "Al-Andalus", summary: "Toledo was the capital city of the Visigoths. Tariq ibn Ziyad captured it in 711.", more: "In the 12th century, Ibn Sînâ’s al-Qanun fi’t-Tibb was translated into Latin in Toledo." },
    focus: medPoint(39.86, -4.02, 1.8),
    picture: pic("toledo"), sources: ["TDV İslâm Ansiklopedisi: Tuleytula"],
  }),
  card({
    id: "andalus-b-valencia", kind: "city", tr: "Belensiye (Valencia)", aliases: ["Valencia"],
    en: { title: "Valencia", kindLabel: "City", periodLabel: "Al-Andalus", summary: "The famous traveler Ibn Jubayr was born in Valencia in 1145, in the golden age of Muslim Spain." },
    focus: medPoint(39.47, -0.38, 1.8),
    picture: pic("valencia", "andalus"), sources: ["TDV İslâm Ansiklopedisi: Belensiye"],
  }),
  card({
    id: "andalus-b-castile", kind: "kingdom", tr: "Kastilya", aliases: ["Castile"],
    en: { title: "Castile", kindLabel: "Christian kingdom", periodLabel: "Middle Ages", summary: "Castile was a Christian kingdom in the Iberian Peninsula. King Ferdinand I of Castile brought the small Muslim sultanates under his control.", more: "Later, Castile and Aragon were united under one royal house." },
    focus: medPoint(41, -4, 1.4),
    picture: pic("castile"), sources: ["TDV İslâm Ansiklopedisi: Kastilya"],
  }),
  card({
    id: "andalus-b-aragon", kind: "kingdom", tr: "Aragon", aliases: ["Aragon"],
    en: { title: "Aragon", kindLabel: "Christian kingdom", periodLabel: "Middle Ages", summary: "Aragon was a Christian kingdom in the Iberian Peninsula. With a royal marriage, Aragon and Castile were united." },
    focus: medPoint(41.6, -0.9, 1.4),
    picture: pic("aragon"), sources: ["TDV İslâm Ansiklopedisi: Aragon"],
  }),
  card({
    id: "andalus-b-north-africa", kind: "region", tr: "Kuzey Afrika", aliases: ["North Africa"],
    en: { title: "North Africa", kindLabel: "Land", periodLabel: "South of Al-Andalus", summary: "By 710, Muslims had conquered almost all of North Africa. The Berbers are a people of North Africa.", more: "Later, many Andalusians found a safe new home in North Africa." },
    focus: medFeature('north-africa', 31, 5, 1),
    picture: pic("north-africa", "andalus"), sources: ["TDV İslâm Ansiklopedisi: Mağrib"],
  }),
  card({
    id: "andalus-b-ifriqiya", kind: "region", tr: "İfrîkıye", aliases: ["Ifriqiya"],
    en: { title: "Ifriqiya", kindLabel: "Land", periodLabel: "North Africa", summary: "Ifriqiya is the area that is now Tunisia, eastern Algeria and western Libya. Musa ibn Nusayr was its Umayyad governor." },
    focus: medPoint(35, 10, 1.4),
    picture: pic("ifriqiya"), sources: ["TDV İslâm Ansiklopedisi: İfrîkıye"],
  }),
  card({
    id: "andalus-b-tangier", kind: "city", tr: "Tanca", aliases: ["Tangier"],
    en: { title: "Tangier", kindLabel: "City", periodLabel: "North Africa", summary: "Tangier is a historic city in north-western Morocco. Tariq ibn Ziyad was its governor." },
    focus: medPoint(35.77, -5.8, 1.8),
    picture: pic("tangier", "andalus"), sources: ["TDV İslâm Ansiklopedisi: Tanca"],
  }),
  card({
    id: "andalus-b-constantinople", kind: "city", tr: "Konstantinopolis (İstanbul)", aliases: ["Constantinople", "Istanbul"],
    en: { title: "Constantinople (Istanbul)", kindLabel: "City", periodLabel: "Conquered in 1453", summary: "Constantinople sent ambassadors to Abd al-Rahman III. Its conquest in 1453 brought great joy to Granada.", more: "Later, many Andalusians found a safe new home in Istanbul." },
    focus: medPoint(41.01, 28.98, 1.8),
    picture: pic("constantinople-byzantine", "mecca"), sources: ["TDV İslâm Ansiklopedisi: İstanbul"],
  }),
  card({
    id: "andalus-b-tariq", kind: "person", tr: "Târık b. Ziyâd", aliases: ["Tariq ibn Ziyad"],
    en: { title: "Tariq ibn Ziyad", kindLabel: "Commander", periodLabel: "711", summary: "Tariq ibn Ziyad was a Berber governor. In 711, he started the conquest of the Iberian Peninsula and captured Toledo." },
    focus: medPoint(36.14, -5.35, 1.8),
    picture: pic("tariq-ibn-ziyad"), sources: ["TDV İslâm Ansiklopedisi: Târık b. Ziyâd"],
  }),
  card({
    id: "andalus-b-musa", kind: "person", tr: "Mûsâ b. Nusayr", aliases: ["Musa ibn Nusayr"],
    en: { title: "Musa ibn Nusayr", kindLabel: "Governor", periodLabel: "712", summary: "Musa ibn Nusayr was the Umayyad governor of Ifriqiya. In 712, he joined Tariq ibn Ziyad." },
    focus: medPoint(35, 10, 1.4),
    picture: pic("musa-ibn-nusayr"), sources: ["TDV İslâm Ansiklopedisi: Mûsâ b. Nusayr"],
  }),
  card({
    id: "andalus-b-abd-al-rahman-i", kind: "person", tr: "I. Abdurrahman", aliases: ["Abd al-Rahman I"],
    en: { title: "Abd al-Rahman I", kindLabel: "Emir", periodLabel: "756–788", summary: "Abd al-Rahman I was the first Umayyad emir of Al-Andalus." },
    focus: medPoint(37.88, -4.78, 1.8),
    picture: pic("abd-al-rahman-i"), sources: ["TDV İslâm Ansiklopedisi: Abdurrahman I"],
  }),
  card({
    id: "andalus-b-abd-al-rahman-iii", kind: "person", tr: "III. Abdurrahman", aliases: ["Abd al-Rahman III"],
    en: { title: "Abd al-Rahman III", kindLabel: "Caliph", periodLabel: "912–961", summary: "The reign of Abd al-Rahman III was the golden age of Al-Andalus.", more: "He built the Madinat al-Zahra Palace and made his own gold coins." },
    focus: medPoint(37.88, -4.78, 1.8),
    picture: pic("abd-al-rahman-iii"), sources: ["TDV İslâm Ansiklopedisi: Abdurrahman III"],
  }),
  card({
    id: "andalus-b-hakam-ii", kind: "person", tr: "II. Hakem", aliases: ["Al-Hakam II", "al-Hakam II"],
    en: { title: "Al-Hakam II", kindLabel: "Caliph", periodLabel: "961–976", summary: "Caliph Al-Hakam II loved learning. His library had more than 400,000 books." },
    focus: medPoint(37.88, -4.78, 1.8),
    picture: pic("hakam-ii"), sources: ["TDV İslâm Ansiklopedisi: Hakem II"],
  }),
  card({
    id: "andalus-b-ibn-rushd", kind: "person", tr: "İbn Rüşd", aliases: ["Ibn Rushd"],
    en: { title: "Ibn Rushd", kindLabel: "Philosopher and scientist", periodLabel: "12th century", summary: "Ibn Rushd was a great philosopher and scientist of Al-Andalus." },
    focus: medPoint(37.88, -4.78, 1.8),
    picture: pic("ibn-rushd"), sources: ["TDV İslâm Ansiklopedisi: İbn Rüşd"],
  }),
  card({
    id: "andalus-b-ibn-tufayl", kind: "person", tr: "İbn Tufeyl", aliases: ["Ibn Tufayl"],
    en: { title: "Ibn Tufayl", kindLabel: "Philosopher and doctor", periodLabel: "12th century", summary: "Ibn Tufayl was an Andalusian philosopher and doctor. He wrote Hayy ibn Yaqzan.", more: "This book later inspired Daniel Defoe’s Robinson Crusoe." },
    focus: medFeature('al-andalus', 38.6, -4.6, 1.5),
    picture: pic("ibn-tufayl"), sources: ["TDV İslâm Ansiklopedisi: İbn Tufeyl"],
  }),
  card({
    id: "andalus-b-ibn-al-arabi", kind: "person", tr: "Muhyiddîn İbnü’l-Arabî", aliases: ["Ibn al-Arabi"],
    en: { title: "Ibn al-Arabi", kindLabel: "Sufi writer", periodLabel: "12th–13th century", summary: "Ibn al-Arabi was a famous Sufi writer from Al-Andalus." },
    focus: medFeature('al-andalus', 38.6, -4.6, 1.5),
    picture: pic("ibn-al-arabi"), sources: ["TDV İslâm Ansiklopedisi: İbnü’l-Arabî, Muhyiddin"],
  }),
  card({
    id: "andalus-b-ibn-hazm", kind: "person", tr: "İbn Hazm", aliases: ["Ibn Hazm"],
    en: { title: "Ibn Hazm", kindLabel: "Scholar", periodLabel: "994–1064", summary: "Ibn Hazm was a very important scholar of Al-Andalus. He wrote about 400 books." },
    focus: medPoint(37.88, -4.78, 1.8),
    picture: pic("ibn-hazm"), sources: ["TDV İslâm Ansiklopedisi: İbn Hazm"],
  }),
  card({
    id: "andalus-b-zahrawi", kind: "person", tr: "Ebü’l-Kāsım ez-Zehrâvî", aliases: ["Abu al-Qasim al-Zahrawi", "al-Zahrawi"],
    en: { title: "Abu al-Qasim al-Zahrawi", kindLabel: "Doctor", periodLabel: "10th century", summary: "Al-Zahrawi was an expert in medicine and chemistry. He wrote a thirty-volume medical encyclopedia, al-Tasrif." },
    focus: medPoint(37.88, -4.78, 1.8),
    picture: pic("zahrawi"), sources: ["TDV İslâm Ansiklopedisi: Zehrâvî"],
  }),
  card({
    id: "andalus-b-hasday", kind: "person", tr: "Hasday b. Şaprut", aliases: ["Hasday ibn Shaprut"],
    en: { title: "Hasday ibn Shaprut", kindLabel: "Doctor", periodLabel: "10th century", summary: "Hasday ibn Shaprut was a Jewish doctor in the caliph’s court in Córdoba." },
    focus: medPoint(37.88, -4.78, 1.8),
    picture: pic("hasday-ibn-shaprut"), sources: ["Encyclopaedia Judaica: Ibn Shaprut, Hisdai"],
  }),
  card({
    id: "andalus-b-bayezid-ii", kind: "person", tr: "II. Bayezid", aliases: ["Bayezid II"],
    en: { title: "Bayezid II", kindLabel: "Ottoman sultan", periodLabel: "15th–16th century", summary: "In 1487, Granada asked the Ottoman Sultan Bayezid II for help. Later, he sent a fleet under Kemal Reis." },
    focus: medPoint(41.01, 28.98, 1.8),
    picture: pic("bayezid-ii"), sources: ["TDV İslâm Ansiklopedisi: Bayezid II"],
  }),
  card({
    id: "andalus-b-kemal-reis", kind: "person", tr: "Kemal Reis", aliases: ["Kemal Reis"],
    en: { title: "Kemal Reis", kindLabel: "Ottoman commander", periodLabel: "Late 15th century", summary: "Kemal Reis was a famous Ottoman naval commander. He attacked the Spanish coast and rescued a group of Muslims." },
    focus: medFeature('mediterranean', 37, 10, 1),
    picture: pic("kemal-reis"), sources: ["TDV İslâm Ansiklopedisi: Kemal Reis"],
  }),
  card({
    id: "andalus-b-visigoths", kind: "people", tr: "Vizigotlar", aliases: ["Visigoths", "Visigothic"],
    en: { title: "The Visigoths", kindLabel: "People", periodLabel: "Before 711", summary: "The Visigoths ruled Spain before the Muslims. Their capital was Toledo." },
    focus: medPoint(40, -4, 1.2),
    picture: pic("visigoths"), sources: ["TDV İslâm Ansiklopedisi: Vizigotlar"],
  }),
  card({
    id: "andalus-b-berbers", kind: "people", tr: "Berberîler", aliases: ["Berbers", "Berber"],
    en: { title: "The Berbers", kindLabel: "People", periodLabel: "North Africa", summary: "The Berbers are a people who live in North Africa. Tariq ibn Ziyad’s army was made up mostly of Berbers." },
    focus: medFeature('north-africa', 31, 5, 1),
    picture: pic("berbers"), sources: ["TDV İslâm Ansiklopedisi: Berberîler"],
  }),
  card({
    id: "andalus-b-umayyads", kind: "dynasty", tr: "Endülüs Emevîleri", aliases: ["Umayyads", "Umayyad"],
    en: { title: "The Umayyads", kindLabel: "Ruling family", periodLabel: "756–1031 in Al-Andalus", summary: "The Abbasids overthrew the Umayyads in 750. But the Umayyads started a new era in Al-Andalus in 756 and ruled it for 275 years." },
    focus: medFeature('al-andalus', 38.6, -4.6, 1.5),
    picture: pic("umayyads", "andalus"), sources: ["TDV İslâm Ansiklopedisi: Endülüs Emevîleri"],
  }),
  card({
    id: "andalus-b-fatimids", kind: "dynasty", tr: "Fâtımîler", aliases: ["Fatimids"],
    en: { title: "The Fatimids", kindLabel: "Ruling family", periodLabel: "From 909", summary: "In 909, the Fatimids announced their own caliphate in North Africa. Abd al-Rahman III competed with them in world trade." },
    focus: medPoint(35, 10, 1.4),
    picture: pic("fatimids"), sources: ["TDV İslâm Ansiklopedisi: Fâtımîler"],
  }),
  card({
    id: "andalus-b-great-mosque", kind: "landmark", tr: "Kurtuba Ulucamii", aliases: ["Great Mosque of Córdoba"],
    en: { title: "The Great Mosque of Córdoba", kindLabel: "Mosque", periodLabel: "From the 8th century", summary: "The Great Mosque of Córdoba was the third-largest mosque in the Islamic world.", more: "Today, the building is a church, and people call it the Córdoba Cathedral." },
    focus: medPoint(37.88, -4.78, 1.8),
    picture: pic("great-mosque-of-cordoba"), sources: ["TDV İslâm Ansiklopedisi: Kurtuba Ulucamii"],
  }),
  card({
    id: "andalus-b-madinat-al-zahra", kind: "landmark", tr: "Medînetü’z-Zehrâ", aliases: ["Madinat al-Zahra Palace", "Madinat al-Zahra"],
    en: { title: "Madinat al-Zahra Palace", kindLabel: "Palace", periodLabel: "10th century", summary: "Madinat al-Zahra Palace was built by Caliph Abd al-Rahman III. Workers used 4,300 columns for it." },
    focus: medPoint(37.89, -4.87, 1.8),
    picture: pic("madinat-al-zahra"), sources: ["TDV İslâm Ansiklopedisi: Medînetüzzehrâ"],
  }),
  card({
    id: "andalus-b-alhambra", kind: "landmark", tr: "Elhamra Sarayı", aliases: ["Alhambra Palace", "Alhambra"],
    en: { title: "The Alhambra Palace", kindLabel: "Palace", periodLabel: "9th–14th century", summary: "The Alhambra Palace in Granada is very important for Andalusian architecture and Islamic art.", more: "Its name comes from “al-hamra”, which means “red”, because the clay in its walls is reddish." },
    focus: medPoint(37.18, -3.59, 1.8),
    picture: pic("alhambra"), sources: ["TDV İslâm Ansiklopedisi: Elhamrâ"],
  }),
  card({
    id: "andalus-b-alcazar", kind: "landmark", tr: "Sevilla Alcazarı", aliases: ["Alcazar of Seville", "Alcazar Palace"],
    en: { title: "The Alcazar of Seville", kindLabel: "Palace", periodLabel: "Al-Andalus", summary: "The Alcazar of Seville is a famous royal palace in the center of Seville. Its name comes from the Arabic word al-qasr, “the palace.”" },
    focus: medPoint(37.38, -5.99, 1.8),
    picture: pic("alcazar-of-seville"), sources: ["TDV İslâm Ansiklopedisi: İşbîliye"],
  }),
];

export const IBN_JUBAYR_B_SET: EntityBookSet = {
  entities,
  chapters: {
    "ibnJubayr-b1": {
      1: ["andalus-b-al-andalus", "andalus-b-iberian-peninsula", "andalus-b-cordoba", "andalus-b-granada", "andalus-b-seville"],
      2: ["andalus-b-iberian-peninsula", "andalus-b-toledo", "andalus-b-north-africa", "andalus-b-ifriqiya", "andalus-b-tariq", "andalus-b-musa", "andalus-b-visigoths", "andalus-b-berbers", "andalus-b-umayyads"],
      3: ["andalus-b-al-andalus", "andalus-b-cordoba", "andalus-b-granada", "andalus-b-seville", "andalus-b-valencia", "andalus-b-ibn-rushd", "andalus-b-ibn-tufayl", "andalus-b-ibn-al-arabi"],
      4: ["andalus-b-al-andalus", "andalus-b-iberian-peninsula", "andalus-b-north-africa", "andalus-b-abd-al-rahman-i", "andalus-b-abd-al-rahman-iii", "andalus-b-berbers", "andalus-b-umayyads"],
      5: ["andalus-b-al-andalus", "andalus-b-north-africa", "andalus-b-constantinople", "andalus-b-abd-al-rahman-iii", "andalus-b-hasday", "andalus-b-berbers", "andalus-b-umayyads", "andalus-b-fatimids"],
      6: ["andalus-b-al-andalus", "andalus-b-cordoba", "andalus-b-granada", "andalus-b-toledo", "andalus-b-castile", "andalus-b-berbers"],
      7: ["andalus-b-seville", "andalus-b-castile", "andalus-b-aragon"],
      8: ["andalus-b-granada"],
      9: ["andalus-b-al-andalus", "andalus-b-granada", "andalus-b-valencia", "andalus-b-castile", "andalus-b-aragon", "andalus-b-north-africa", "andalus-b-constantinople", "andalus-b-bayezid-ii", "andalus-b-kemal-reis"],
      10: ["andalus-b-al-andalus", "andalus-b-cordoba", "andalus-b-abd-al-rahman-iii", "andalus-b-visigoths", "andalus-b-berbers"],
      11: ["andalus-b-al-andalus", "andalus-b-cordoba", "andalus-b-granada", "andalus-b-seville", "andalus-b-toledo", "andalus-b-valencia", "andalus-b-north-africa"],
      12: ["andalus-b-al-andalus", "andalus-b-cordoba", "andalus-b-zahrawi", "andalus-b-berbers"],
      13: ["andalus-b-al-andalus", "andalus-b-granada", "andalus-b-seville", "andalus-b-toledo", "andalus-b-castile", "andalus-b-constantinople", "andalus-b-abd-al-rahman-iii", "andalus-b-hakam-ii", "andalus-b-ibn-tufayl", "andalus-b-ibn-hazm", "andalus-b-great-mosque", "andalus-b-madinat-al-zahra", "andalus-b-alhambra", "andalus-b-alcazar"],
    },
    "ibnJubayr-b2": {
      1: ["andalus-b-al-andalus", "andalus-b-iberian-peninsula", "andalus-b-cordoba", "andalus-b-granada", "andalus-b-seville"],
      2: ["andalus-b-iberian-peninsula", "andalus-b-toledo", "andalus-b-north-africa", "andalus-b-ifriqiya", "andalus-b-tangier", "andalus-b-tariq", "andalus-b-musa", "andalus-b-visigoths", "andalus-b-berbers", "andalus-b-umayyads"],
      3: ["andalus-b-al-andalus", "andalus-b-cordoba", "andalus-b-granada", "andalus-b-seville", "andalus-b-valencia", "andalus-b-ibn-rushd", "andalus-b-ibn-tufayl", "andalus-b-ibn-al-arabi"],
      4: ["andalus-b-al-andalus", "andalus-b-iberian-peninsula", "andalus-b-north-africa", "andalus-b-abd-al-rahman-i", "andalus-b-abd-al-rahman-iii", "andalus-b-visigoths", "andalus-b-berbers", "andalus-b-umayyads"],
      5: ["andalus-b-al-andalus", "andalus-b-north-africa", "andalus-b-constantinople", "andalus-b-abd-al-rahman-iii", "andalus-b-hasday", "andalus-b-berbers", "andalus-b-fatimids"],
      6: ["andalus-b-al-andalus", "andalus-b-cordoba", "andalus-b-seville", "andalus-b-toledo", "andalus-b-castile", "andalus-b-north-africa", "andalus-b-berbers", "andalus-b-umayyads"],
      7: ["andalus-b-al-andalus", "andalus-b-cordoba", "andalus-b-granada", "andalus-b-seville", "andalus-b-castile", "andalus-b-aragon"],
      8: ["andalus-b-granada", "andalus-b-valencia", "andalus-b-castile", "andalus-b-aragon"],
      9: ["andalus-b-al-andalus", "andalus-b-granada", "andalus-b-north-africa", "andalus-b-constantinople", "andalus-b-bayezid-ii", "andalus-b-kemal-reis"],
      10: ["andalus-b-al-andalus", "andalus-b-berbers"],
      11: ["andalus-b-al-andalus", "andalus-b-cordoba", "andalus-b-abd-al-rahman-i", "andalus-b-abd-al-rahman-iii", "andalus-b-visigoths", "andalus-b-great-mosque"],
      12: ["andalus-b-al-andalus", "andalus-b-cordoba", "andalus-b-granada", "andalus-b-seville", "andalus-b-toledo", "andalus-b-valencia", "andalus-b-north-africa"],
      13: ["andalus-b-al-andalus", "andalus-b-cordoba", "andalus-b-zahrawi", "andalus-b-berbers"],
      14: ["andalus-b-al-andalus", "andalus-b-cordoba", "andalus-b-ibn-rushd"],
      15: ["andalus-b-al-andalus", "andalus-b-granada", "andalus-b-seville", "andalus-b-toledo", "andalus-b-constantinople", "andalus-b-abd-al-rahman-iii", "andalus-b-great-mosque", "andalus-b-madinat-al-zahra", "andalus-b-alhambra", "andalus-b-alcazar"],
      16: ["andalus-b-al-andalus", "andalus-b-toledo", "andalus-b-hakam-ii", "andalus-b-ibn-tufayl", "andalus-b-ibn-hazm"],
      17: ["andalus-b-seville", "andalus-b-castile"],
    },
  },
};
