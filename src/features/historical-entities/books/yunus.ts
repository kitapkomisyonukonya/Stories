import { defineEntity } from './define';
import { medFeature, medPoint } from '../mediterraneanMap';
import type { EntityBookSet } from './index';

// Places & People cards for the yunus-emre books (A2, B1, B2), English and Arabic.
// Generated from the reviewed card list; the chapters are where each level's story
// names the place. Sources are TDV İslâm Ansiklopedisi article titles.

const CITY_ZOOM = 1.8;

const entities = [
  defineEntity({
    id: "yunus-konya", kind: "city",
    aliases: { en: ["Konya"], ar: ["قونية"] },
    copy: {
      en: { title: "Konya", kindLabel: "City", periodLabel: "Capital of the Anatolian Seljuks", summary: "Konya is a city in central Anatolia. It was the capital of the Anatolian Seljuks.", more: "Mevlana lived and taught in Konya, and his tomb is there." },
      ar: { title: "قُونْيَة", kindLabel: "مَدِينَةٌ", periodLabel: "عَاصِمَةُ سَلَاجِقَةِ الْأَنَاضُولِ", summary: "قُونْيَةُ مَدِينَةٌ فِي وَسَطِ الْأَنَاضُولِ. وَكَانَتْ عَاصِمَةَ سَلَاجِقَةِ الْأَنَاضُولِ.", more: "عَاشَ مَوْلَانَا فِي قُونْيَةَ وَعَلَّمَ فِيهَا، وَفِيهَا قَبْرُهُ." },
    },
    focus: medPoint(37.87, 32.49, CITY_ZOOM),
    picture: { folder: "yunus", name: "konya" },
    sources: ["TDV İslâm Ansiklopedisi: Konya"],
  }),
  defineEntity({
    id: "yunus-erzurum", kind: "city",
    aliases: { en: ["Erzurum"], ar: ["أرضروم","إرزوروم"] },
    copy: {
      en: { title: "Erzurum", kindLabel: "City", periodLabel: "Eastern Anatolia", summary: "Erzurum is a city on a high plain in eastern Anatolia. In 1242, the Mongols captured it and killed its people.", more: "It is one of the coldest cities in Türkiye in winter." },
      ar: { title: "أَرْضُرُوم", kindLabel: "مَدِينَةٌ", periodLabel: "شَرْقُ الْأَنَاضُولِ", summary: "أَرْضُرُومُ مَدِينَةٌ عَلَى هَضْبَةٍ عَالِيَةٍ فِي شَرْقِ الْأَنَاضُولِ. فِي عَامِ أَلْفٍ وَمِئَتَيْنِ وَاثْنَيْنِ وَأَرْبَعِينَ، اسْتَوْلَى عَلَيْهَا الْمُغُولُ وَقَتَلُوا أَهْلَهَا.", more: "وَهِيَ مِنْ أَبْرَدِ مُدُنِ تُرْكِيَا فِي الشِّتَاءِ." },
    },
    focus: medPoint(39.91, 41.27, CITY_ZOOM),
    picture: { folder: "yunus", name: "erzurum" },
    sources: ["TDV İslâm Ansiklopedisi: Erzurum"],
  }),
  defineEntity({
    id: "yunus-sivas", kind: "city",
    aliases: { en: ["Sivas"], ar: ["سيواس","سيفاس"] },
    copy: {
      en: { title: "Sivas", kindLabel: "City", periodLabel: "Central Anatolia", summary: "Sivas is a city in central Anatolia. After the battle of Kosedag in 1243, the Mongols destroyed and robbed it.", more: "It stands on the Kızılırmak, the longest river in Türkiye." },
      ar: { title: "سِيوَاس", kindLabel: "مَدِينَةٌ", periodLabel: "وَسَطُ الْأَنَاضُولِ", summary: "سِيوَاسُ مَدِينَةٌ فِي وَسَطِ الْأَنَاضُولِ. بَعْدَ مَعْرَكَةِ كُوسَه دَاغ عَامَ أَلْفٍ وَمِئَتَيْنِ وَثَلَاثَةٍ وَأَرْبَعِينَ، دَمَّرَهَا الْمُغُولُ وَنَهَبُوهَا.", more: "وَتَقَعُ عَلَى نَهْرِ قِزِلْ إِرْمَاق، أَطْوَلِ نَهْرٍ فِي تُرْكِيَا." },
    },
    focus: medPoint(39.75, 37.02, CITY_ZOOM),
    picture: { folder: "yunus", name: "sivas" },
    sources: ["TDV İslâm Ansiklopedisi: Sivas"],
  }),
  defineEntity({
    id: "yunus-kayseri", kind: "city",
    aliases: { en: ["Kayseri"], ar: ["قيصري"] },
    copy: {
      en: { title: "Kayseri", kindLabel: "City", periodLabel: "Central Anatolia", summary: "Kayseri is an old city in central Anatolia. After the battle of Kosedag in 1243, the Mongols destroyed and robbed it.", more: "It lies at the foot of Mount Erciyes, a high old volcano." },
      ar: { title: "قَيْصَرِي", kindLabel: "مَدِينَةٌ", periodLabel: "وَسَطُ الْأَنَاضُولِ", summary: "قَيْصَرِي مَدِينَةٌ قَدِيمَةٌ فِي وَسَطِ الْأَنَاضُولِ. بَعْدَ مَعْرَكَةِ كُوسَه دَاغ عَامَ أَلْفٍ وَمِئَتَيْنِ وَثَلَاثَةٍ وَأَرْبَعِينَ، دَمَّرَهَا الْمُغُولُ وَنَهَبُوهَا.", more: "وَتَقَعُ عِنْدَ سَفْحِ جَبَلِ أَرْجِيَسَ، وَهُوَ بُرْكَانٌ قَدِيمٌ عَالٍ." },
    },
    focus: medPoint(38.72, 35.49, CITY_ZOOM),
    picture: { folder: "yunus", name: "kayseri" },
    sources: ["TDV İslâm Ansiklopedisi: Kayseri"],
  }),
  defineEntity({
    id: "yunus-erzincan", kind: "city",
    aliases: { en: ["Erzincan"], ar: ["أرزنجان","إرزنجان"] },
    copy: {
      en: { title: "Erzincan", kindLabel: "City", periodLabel: "Eastern Anatolia", summary: "Erzincan is a city in eastern Anatolia. After the battle of Kosedag in 1243, the Mongols destroyed and robbed it.", more: "It lies in a green plain between high mountains, near the Euphrates River." },
      ar: { title: "أَرْزِنْجَان", kindLabel: "مَدِينَةٌ", periodLabel: "شَرْقُ الْأَنَاضُولِ", summary: "أَرْزِنْجَانُ مَدِينَةٌ فِي شَرْقِ الْأَنَاضُولِ. بَعْدَ مَعْرَكَةِ كُوسَه دَاغ عَامَ أَلْفٍ وَمِئَتَيْنِ وَثَلَاثَةٍ وَأَرْبَعِينَ، دَمَّرَهَا الْمُغُولُ وَنَهَبُوهَا.", more: "وَتَقَعُ فِي سَهْلٍ أَخْضَرَ بَيْنَ جِبَالٍ عَالِيَةٍ، قُرْبَ نَهْرِ الْفُرَاتِ." },
    },
    focus: medPoint(39.75, 39.49, CITY_ZOOM),
    picture: { folder: "yunus", name: "erzincan" },
    sources: ["TDV İslâm Ansiklopedisi: Erzincan"],
  }),
  defineEntity({
    id: "yunus-anatolia", kind: "region", tr: "Anadolu",
    aliases: { en: ["Anatolia"], ar: ["الأناضول"] },
    copy: {
      en: { title: "Anatolia", kindLabel: "Land", periodLabel: "The Asian part of Türkiye", summary: "Anatolia is a large land between the Black Sea and the Mediterranean Sea. Yunus Emre was born and lived here, and he travelled to many of its cities.", more: "Today, most of Türkiye is in Anatolia." },
      ar: { title: "الْأَنَاضُول", kindLabel: "أَرْضٌ", periodLabel: "الْجُزْءُ الْآسْيَوِيُّ مِنْ تُرْكِيَا", summary: "الْأَنَاضُولُ أَرْضٌ وَاسِعَةٌ بَيْنَ الْبَحْرِ الْأَسْوَدِ وَالْبَحْرِ الْأَبْيَضِ الْمُتَوَسِّطِ. وُلِدَ فِيهَا يُونُسُ إِمْرَه وَعَاشَ، وَسَافَرَ إِلَى كَثِيرٍ مِنْ مُدُنِهَا.", more: "وَمُعْظَمُ أَرَاضِي تُرْكِيَا الْيَوْمَ فِي الْأَنَاضُولِ." },
    },
    focus: medFeature('anatolia', 39, 33.5, 1),
    picture: { folder: "yunus", name: "anatolia" },
    sources: ["TDV İslâm Ansiklopedisi: Anadolu"],
  }),
  defineEntity({
    id: "yunus-syria", kind: "region", tr: "Suriye",
    aliases: { en: ["Syria"], ar: ["سوريا"] },
    copy: {
      en: { title: "Syria", kindLabel: "Region", periodLabel: "South of Anatolia", summary: "Syria is a land south of Anatolia, near the Mediterranean Sea. Yunus Emre travelled there.", more: "Damascus and Aleppo were its great cities." },
      ar: { title: "سُورِيَا", kindLabel: "مِنْطَقَةٌ", periodLabel: "جَنُوبَ الْأَنَاضُولِ", summary: "سُورِيَا أَرْضٌ تَقَعُ جَنُوبَ الْأَنَاضُولِ، قُرْبَ الْبَحْرِ الْأَبْيَضِ الْمُتَوَسِّطِ. وَقَدْ سَافَرَ إِلَيْهَا يُونُسُ إِمْرَه.", more: "وَمِنْ أَشْهَرِ مُدُنِهَا دِمَشْقُ وَحَلَبُ." },
    },
    focus: medFeature('syria', 34.6, 38, 1),
    picture: { folder: "andalus", name: "syria" },
    sources: ["TDV İslâm Ansiklopedisi: Suriye"],
  }),
  defineEntity({
    id: "yunus-azerbaijan", kind: "region", tr: "Azerbaycan",
    aliases: { en: ["Azerbaijan"], ar: ["أذربيجان"] },
    copy: {
      en: { title: "Azerbaijan", kindLabel: "Region", periodLabel: "East of Anatolia", summary: "Azerbaijan is a land east of Anatolia, near the Caspian Sea. Yunus Emre travelled there, and from there the Mongols attacked the Anatolian Seljuks.", more: "Today, this old land is part of Iran and of the country of Azerbaijan." },
      ar: { title: "أَذْرَبِيجَان", kindLabel: "مِنْطَقَةٌ", periodLabel: "شَرْقَ الْأَنَاضُولِ", summary: "أَذْرَبِيجَانُ أَرْضٌ تَقَعُ شَرْقَ الْأَنَاضُولِ، قُرْبَ بَحْرِ قَزْوِينَ. سَافَرَ إِلَيْهَا يُونُسُ إِمْرَه، وَمِنْهَا هَاجَمَ الْمُغُولُ سَلَاجِقَةَ الْأَنَاضُولِ.", more: "وَهَذِهِ الْأَرْضُ الْقَدِيمَةُ الْيَوْمَ جُزْءٌ مِنْ إِيرَانَ وَمِنْ دَوْلَةِ أَذْرَبِيجَانَ." },
    },
    focus: medFeature('azerbaijan-historic', 38.8, 47, 1),
    picture: { folder: "yunus", name: "azerbaijan" },
    sources: ["TDV İslâm Ansiklopedisi: Azerbaycan"],
  }),
  defineEntity({
    id: "yunus-middle-east", kind: "region", tr: "Orta Doğu",
    aliases: { en: ["Middle East"], ar: ["الشرق الأوسط"] },
    copy: {
      en: { title: "The Middle East", kindLabel: "Region", periodLabel: "Western Asia and Egypt", summary: "The Middle East is a large area in western Asia and Egypt. When Sultan Ala al-Din Kayqubad I died, the Anatolian Seljuks were the strongest and largest state in the Middle East.", more: "Today, it has countries like Türkiye, Iran, Iraq, Syria and Egypt." },
      ar: { title: "الشَّرْقُ الْأَوْسَطُ", kindLabel: "مِنْطَقَةٌ", periodLabel: "غَرْبُ آسِيَا وَمِصْرُ", summary: "الشَّرْقُ الْأَوْسَطُ مِنْطَقَةٌ كَبِيرَةٌ فِي غَرْبِ آسِيَا وَمِصْرَ. وَعِنْدَ وَفَاةِ السُّلْطَانِ عَلَاءِ الدِّينِ الْأَوَّلِ، كَانَتْ دَوْلَةُ سَلَاجِقَةِ الْأَنَاضُولِ أَقْوَى دَوْلَةٍ فِيهِ وَأَكْبَرَهَا.", more: "وَفِيهِ الْيَوْمَ دُوَلٌ مِثْلُ تُرْكِيَا وَإِيرَانَ وَالْعِرَاقِ وَسُورِيَا وَمِصْرَ." },
    },
    focus: medFeature('middle-east', 31, 42, 1),
    picture: { folder: "andalus", name: "middle-east" },
    sources: [],
  }),
  defineEntity({
    id: "yunus-central-asia", kind: "region", tr: "Orta Asya",
    aliases: { en: ["Central Asia"], ar: ["آسيا الوسطى"] },
    copy: {
      en: { title: "Central Asia", kindLabel: "Region", periodLabel: "East of the Caspian Sea", summary: "Central Asia is a large land of steppes and deserts east of the Caspian Sea. Because of the Mongol invasion, many people moved from here to Anatolia.", more: "It is the old homeland of the Turkic peoples." },
      ar: { title: "آسِيَا الْوُسْطَى", kindLabel: "مِنْطَقَةٌ", periodLabel: "شَرْقَ بَحْرِ قَزْوِينَ", summary: "آسِيَا الْوُسْطَى أَرْضٌ وَاسِعَةٌ مِنَ السُّهُوبِ وَالصَّحَارِي شَرْقَ بَحْرِ قَزْوِينَ. وَبِسَبَبِ الْغَزْوِ الْمُغُولِيِّ، هَاجَرَ مِنْهَا كَثِيرٌ مِنَ النَّاسِ إِلَى الْأَنَاضُولِ.", more: "وَهِيَ الْمَوْطِنُ الْقَدِيمُ لِلشُّعُوبِ التُّرْكِيَّةِ." },
    },
    focus: medFeature('central-asia', 43, 65, 1, { view: { north: 52, west: 22, widthDegrees: 62 } }),
    picture: { folder: "yunus", name: "central-asia" },
    sources: ["TDV İslâm Ansiklopedisi: Türkistan"],
  }),
  defineEntity({
    id: "yunus-turkestan", kind: "region", tr: "Türkistan",
    aliases: { en: ["Turkestan"], ar: ["تركستان"] },
    copy: {
      en: { title: "Turkestan", kindLabel: "Region", periodLabel: "Central Asia", summary: "Turkestan means \"the land of the Turks\". It was the name of a large part of Central Asia, and under Mongol pressure, sheikhs came from here to Anatolia.", more: "Ahmed Yesevi, a famous Turkish Sufi, lived in Turkestan." },
      ar: { title: "تُرْكِسْتَان", kindLabel: "مِنْطَقَةٌ", periodLabel: "آسِيَا الْوُسْطَى", summary: "اسْمُ تُرْكِسْتَانَ يَعْنِي «بِلَادَ التُّرْكِ»، وَكَانَ يُطْلَقُ عَلَى جُزْءٍ كَبِيرٍ مِنْ آسِيَا الْوُسْطَى. وَمِنْهَا جَاءَ شُيُوخٌ إِلَى الْأَنَاضُولِ تَحْتَ ضَغْطِ الْمُغُولِ.", more: "وَعَاشَ فِيهَا الصُّوفِيُّ التُّرْكِيُّ الْمَشْهُورُ أَحْمَدُ يَسَوِي." },
    },
    focus: medFeature('turkestan', 42.5, 68, 1, { view: { north: 52, west: 22, widthDegrees: 62 } }),
    picture: { folder: "yunus", name: "turkestan" },
    sources: ["TDV İslâm Ansiklopedisi: Türkistan"],
  }),
  defineEntity({
    id: "yunus-khorasan", kind: "region", tr: "Horasan",
    aliases: { en: ["Khorasan"], ar: ["خراسان"] },
    copy: {
      en: { title: "Khorasan", kindLabel: "Region", periodLabel: "North-east Iran and Central Asia", summary: "Khorasan is a large old land in north-east Iran and the areas near it. Under Mongol pressure, sheikhs came from here to Anatolia.", more: "Nishapur, Merv and Herat were some of its great old cities." },
      ar: { title: "خُرَاسَان", kindLabel: "مِنْطَقَةٌ", periodLabel: "شَمَالُ شَرْقِ إِيرَانَ وَآسِيَا الْوُسْطَى", summary: "خُرَاسَانُ أَرْضٌ قَدِيمَةٌ وَاسِعَةٌ فِي شَمَالِ شَرْقِ إِيرَانَ وَمَا حَوْلَهَا. وَمِنْهَا جَاءَ شُيُوخٌ إِلَى الْأَنَاضُولِ تَحْتَ ضَغْطِ الْمُغُولِ.", more: "وَمِنْ مُدُنِهَا الْكَبِيرَةِ الْقَدِيمَةِ نَيْسَابُورُ وَمَرْوُ وَهَرَاةُ." },
    },
    focus: medFeature('khorasan', 36, 60, 1, { view: { north: 52, west: 22, widthDegrees: 62 } }),
    picture: { folder: "yunus", name: "khorasan" },
    sources: ["TDV İslâm Ansiklopedisi: Horasan"],
  }),
  defineEntity({
    id: "yunus-iran", kind: "country", tr: "İran",
    aliases: { en: ["Iran"], ar: ["إيران"] },
    copy: {
      en: { title: "Iran", kindLabel: "Country", periodLabel: "East of Anatolia", summary: "Iran is a large country east of Anatolia. The Ilkhanate, a Mongol state, had its centre in Iran.", more: "The main language of Iran is Persian." },
      ar: { title: "إِيرَان", kindLabel: "بَلَدٌ", periodLabel: "شَرْقَ الْأَنَاضُولِ", summary: "إِيرَانُ بَلَدٌ كَبِيرٌ يَقَعُ شَرْقَ الْأَنَاضُولِ. وَكَانَ مَرْكَزُ الدَّوْلَةِ الْإِيلْخَانِيَّةِ الْمُغُولِيَّةِ فِي إِيرَانَ.", more: "وَاللُّغَةُ الرَّئِيسِيَّةُ فِي إِيرَانَ هِيَ الْفَارِسِيَّةُ." },
    },
    focus: medFeature('iran', 32.5, 54, 1, { view: { north: 52, west: 22, widthDegrees: 62 } }),
    picture: { folder: "yunus", name: "iran" },
    sources: ["TDV İslâm Ansiklopedisi: İran"],
  }),
  defineEntity({
    id: "yunus-transoxiana", kind: "region", tr: "Maveraünnehir",
    aliases: { en: ["Transoxiana"], ar: ["ما وراء النهر"] },
    copy: {
      en: { title: "Transoxiana", kindLabel: "Region", periodLabel: "Central Asia", summary: "Transoxiana is the land between two great rivers of Central Asia, the Amu Darya and the Syr Darya. Under Mongol pressure, sheikhs came from here to Anatolia.", more: "Bukhara and Samarkand are its most famous cities." },
      ar: { title: "مَا وَرَاءَ النَّهْرِ", kindLabel: "مِنْطَقَةٌ", periodLabel: "آسِيَا الْوُسْطَى", summary: "مَا وَرَاءَ النَّهْرِ هِيَ الْأَرْضُ الَّتِي تَقَعُ بَيْنَ نَهْرَيْ جَيْحُونَ وَسَيْحُونَ فِي آسِيَا الْوُسْطَى. وَمِنْهَا جَاءَ شُيُوخٌ إِلَى الْأَنَاضُولِ تَحْتَ ضَغْطِ الْمُغُولِ.", more: "وَأَشْهَرُ مُدُنِهَا بُخَارَى وَسَمَرْقَنْدُ." },
    },
    focus: medFeature('transoxiana', 40, 65.5, 1, { view: { north: 52, west: 22, widthDegrees: 62 } }),
    picture: { folder: "yunus", name: "transoxiana" },
    sources: ["TDV İslâm Ansiklopedisi: Mâverâünnehir"],
  }),
  defineEntity({
    id: "yunus-khwarezm", kind: "region", tr: "Harezm",
    aliases: { en: ["Khwarezm"], ar: ["خوارزم"] },
    copy: {
      en: { title: "Khwarezm", kindLabel: "Region", periodLabel: "Central Asia", summary: "Khwarezm is an old land on the lower Amu Darya River, south of the Aral Sea. Under Mongol pressure, sheikhs came from here to Anatolia.", more: "It was a land of rich oases in the middle of a desert." },
      ar: { title: "خُوَارِزْم", kindLabel: "مِنْطَقَةٌ", periodLabel: "آسِيَا الْوُسْطَى", summary: "خُوَارِزْمُ أَرْضٌ قَدِيمَةٌ عَلَى الْمَجْرَى الْأَدْنَى لِنَهْرِ جَيْحُونَ، جَنُوبَ بَحْرِ آرَالَ. وَمِنْهَا جَاءَ شُيُوخٌ إِلَى الْأَنَاضُولِ تَحْتَ ضَغْطِ الْمُغُولِ.", more: "وَكَانَتْ أَرْضَ وَاحَاتٍ غَنِيَّةٍ وَسَطَ الصَّحْرَاءِ." },
    },
    focus: medFeature('khwarezm', 42.2, 60.2, 1, { view: { north: 52, west: 22, widthDegrees: 62 } }),
    picture: { folder: "yunus", name: "khwarezm" },
    sources: ["TDV İslâm Ansiklopedisi: Hârizm"],
  }),
  defineEntity({
    id: "yunus-kosedag", kind: "landmark",
    aliases: { en: ["Kosedag"], ar: ["كوسه داغ"] },
    copy: {
      en: { title: "Kosedag", kindLabel: "Mountain", periodLabel: "Battle of 1243", summary: "Kosedag is a mountain about 80 km north-east of Sivas. Here, in 1243, the Mongols defeated the army of the Anatolian Seljuks.", more: "This defeat opened the way for the Mongols into Anatolia." },
      ar: { title: "كُوسَه دَاغ", kindLabel: "جَبَلٌ", periodLabel: "مَعْرَكَةُ عَامِ 1243", summary: "كُوسَه دَاغ جَبَلٌ يَقَعُ عَلَى بُعْدِ نَحْوِ ثَمَانِينَ كِيلُومِتْرًا شَمَالَ شَرْقِ سِيوَاسَ. وَعِنْدَهُ هَزَمَ الْمُغُولُ جَيْشَ سَلَاجِقَةِ الْأَنَاضُولِ عَامَ أَلْفٍ وَمِئَتَيْنِ وَثَلَاثَةٍ وَأَرْبَعِينَ.", more: "وَقَدْ فَتَحَتْ هَذِهِ الْهَزِيمَةُ الطَّرِيقَ أَمَامَ الْمُغُولِ إِلَى الْأَنَاضُولِ." },
    },
    focus: medPoint(40.03, 37.92, CITY_ZOOM),
    picture: { folder: "yunus", name: "kosedag" },
    sources: ["TDV İslâm Ansiklopedisi: Kösedağ Savaşı"],
  }),
  defineEntity({
    id: "yunus-mediterranean", kind: "sea", tr: "Akdeniz",
    aliases: { en: ["Mediterranean"], ar: ["الأبيض المتوسط"] },
    copy: {
      en: { title: "Mediterranean Sea", kindLabel: "Sea", periodLabel: "South of Anatolia", summary: "The Mediterranean Sea is a large sea south of Anatolia. Sultan Ala al-Din Kayqubad I built a navy on this sea.", more: "On its coast is Alanya, a port town that Ala al-Din Kayqubad I took for his state." },
      ar: { title: "الْبَحْرُ الْأَبْيَضُ الْمُتَوَسِّطُ", kindLabel: "بَحْرٌ", periodLabel: "جَنُوبَ الْأَنَاضُولِ", summary: "الْبَحْرُ الْأَبْيَضُ الْمُتَوَسِّطُ بَحْرٌ كَبِيرٌ جَنُوبَ الْأَنَاضُولِ. وَقَدْ أَنْشَأَ السُّلْطَانُ عَلَاءُ الدِّينِ الْأَوَّلُ أُسْطُولًا بَحْرِيًّا فِيهِ.", more: "وَعَلَى سَاحِلِهِ مَدِينَةُ أَلَانْيَا، الَّتِي ضَمَّهَا عَلَاءُ الدِّينِ الْأَوَّلُ إِلَى دَوْلَتِهِ." },
    },
    focus: medFeature('mediterranean', 34.6, 18, 1),
    picture: { folder: "andalus", name: "mediterranean" },
    sources: ["TDV İslâm Ansiklopedisi: Akdeniz"],
  }),
  defineEntity({
    id: "yunus-black-sea", kind: "sea", tr: "Karadeniz",
    aliases: { en: ["Black Sea","Black Seas"], ar: ["البحر الأسود"] },
    copy: {
      en: { title: "Black Sea", kindLabel: "Sea", periodLabel: "North of Anatolia", summary: "The Black Sea is a large sea north of Anatolia. Sultan Ala al-Din Kayqubad I also had a navy on this sea.", more: "Sinop was an important Seljuk port on its coast." },
      ar: { title: "الْبَحْرُ الْأَسْوَدُ", kindLabel: "بَحْرٌ", periodLabel: "شَمَالَ الْأَنَاضُولِ", summary: "الْبَحْرُ الْأَسْوَدُ بَحْرٌ كَبِيرٌ شَمَالَ الْأَنَاضُولِ. وَكَانَ لِلسُّلْطَانِ عَلَاءِ الدِّينِ الْأَوَّلِ أُسْطُولٌ بَحْرِيٌّ فِيهِ أَيْضًا.", more: "وَكَانَتْ سِينُوبُ مِينَاءً سَلْجُوقِيًّا مُهِمًّا عَلَى سَاحِلِهِ." },
    },
    focus: medFeature('black-sea', 43.3, 34.5, 1),
    picture: { folder: "yunus", name: "black-sea" },
    sources: ["TDV İslâm Ansiklopedisi: Karadeniz"],
  }),
  defineEntity({
    id: "yunus-tekke", kind: "landmark", tr: "Tekke",
    aliases: { en: ["dervish house","tekke"], ar: ["بيوت الدراويش","دار الدراويش","تكية","تكايا"] },
    copy: {
      en: { title: "Tekke (dervish house)", kindLabel: "Building", periodLabel: "Sufi life", summary: "A tekke was a house where dervishes lived and learned under a sheikh. Yunus Emre trained at the tekke of his teacher, Taptuk Emre.", more: "Tekkes also helped poor people and travellers and gave them food." },
      ar: { title: "التَّكِيَّةُ (دَارُ الدَّرَاوِيشِ)", kindLabel: "مَبْنًى", periodLabel: "حَيَاةُ الصُّوفِيَّةِ", summary: "التَّكِيَّةُ دَارٌ كَانَ الدَّرَاوِيشُ يَعِيشُونَ فِيهَا وَيَتَعَلَّمُونَ تَحْتَ إِرْشَادِ شَيْخٍ. وَقَدْ تَعَلَّمَ يُونُسُ إِمْرَه فِي تَكِيَّةِ مُعَلِّمِهِ تَابْتُوك إِمْرَه.", more: "وَكَانَتِ التَّكَايَا تُسَاعِدُ الْفُقَرَاءَ وَالْمُسَافِرِينَ، وَتُقَدِّمُ لَهُمُ الطَّعَامَ." },
    },
    picture: { folder: "yunus", name: "tekke" },
    sources: ["TDV İslâm Ansiklopedisi: Tekke","TDV İslâm Ansiklopedisi: Dergâh"],
  }),
  defineEntity({
    id: "yunus-madrasa", kind: "landmark", tr: "Medrese",
    aliases: { en: ["madrasa"], ar: ["مدارس","المدرسة الدينية"] },
    copy: {
      en: { title: "Madrasa", kindLabel: "School", periodLabel: "Islamic education", summary: "A madrasa was a school for the Islamic sciences. Some sources say that Yunus Emre studied at a madrasa.", more: "The Seljuks built many fine stone madrasas in Anatolia." },
      ar: { title: "الْمَدْرَسَةُ", kindLabel: "مَدْرَسَةٌ", periodLabel: "التَّعْلِيمُ الْإِسْلَامِيُّ", summary: "الْمَدْرَسَةُ مَكَانٌ لِتَعْلِيمِ الْعُلُومِ الْإِسْلَامِيَّةِ. وَتَذْكُرُ بَعْضُ الْمَصَادِرِ أَنَّ يُونُسَ إِمْرَه دَرَسَ فِي مَدْرَسَةٍ.", more: "وَقَدْ بَنَى السَّلَاجِقَةُ فِي الْأَنَاضُولِ مَدَارِسَ جَمِيلَةً كَثِيرَةً مِنَ الْحَجَرِ." },
    },
    picture: { folder: "yunus", name: "madrasa" },
    sources: ["TDV İslâm Ansiklopedisi: Medrese"],
  }),
  defineEntity({
    id: "yunus-yunus-emre", kind: "person",
    aliases: { en: ["Yunus Emre","Yunus"], ar: ["يونس إمره","يونس"] },
    copy: {
      en: { title: "Yunus Emre", kindLabel: "Poet and dervish", periodLabel: "About 1240–1320", summary: "Yunus Emre was a great Turkish poet and dervish from Anatolia. He wrote his poems in simple Turkish, about love for Allah and good morals.", more: "Many towns in Anatolia say that his grave is there." },
      ar: { title: "يُونُسُ إِمْرَه", kindLabel: "شَاعِرٌ وَدَرْوِيشٌ", periodLabel: "نَحْوَ 1240–1320", summary: "كَانَ يُونُسُ إِمْرَه شَاعِرًا تُرْكِيًّا عَظِيمًا وَدَرْوِيشًا مِنَ الْأَنَاضُولِ. كَتَبَ قَصَائِدَهُ بِلُغَةٍ تُرْكِيَّةٍ بَسِيطَةٍ عَنْ حُبِّ اللَّهِ وَالْأَخْلَاقِ الْحَسَنَةِ.", more: "وَتَقُولُ مُدُنٌ كَثِيرَةٌ فِي الْأَنَاضُولِ إِنَّ قَبْرَهُ فِيهَا." },
    },
    picture: { folder: "yunus", name: "yunus-emre" },
    sources: ["TDV İslâm Ansiklopedisi: Yûnus Emre"],
  }),
  defineEntity({
    id: "yunus-taptuk-emre", kind: "person",
    aliases: { en: ["Taptuk Emre","Taptuk"], ar: ["تابتوك إمره","تابتوك"] },
    copy: {
      en: { title: "Taptuk Emre", kindLabel: "Sheikh (dervish teacher)", periodLabel: "13th century", summary: "Taptuk Emre was a sheikh and the teacher of Yunus Emre. Yunus served at his dervish house for forty years.", more: "Yunus Emre speaks of Taptuk with love in his poems." },
      ar: { title: "تَابْتُوك إِمْرَه", kindLabel: "شَيْخٌ (مُعَلِّمُ الدَّرَاوِيشِ)", periodLabel: "الْقَرْنُ الثَّالِثَ عَشَرَ", summary: "كَانَ تَابْتُوك إِمْرَه شَيْخًا، وَكَانَ مُعَلِّمَ يُونُسَ إِمْرَه. وَقَدْ خَدَمَ يُونُسُ فِي دَارِهِ لِلدَّرَاوِيشِ أَرْبَعِينَ عَامًا.", more: "وَيَذْكُرُ يُونُسُ إِمْرَه شَيْخَهُ تَابْتُوك بِمَحَبَّةٍ فِي قَصَائِدِهِ." },
    },
    picture: { folder: "yunus", name: "taptuk-emre" },
    sources: ["TDV İslâm Ansiklopedisi: Taptuk Emre"],
  }),
  defineEntity({
    id: "yunus-mevlana-rumi", kind: "person", tr: "Mevlânâ Celâleddîn-i Rûmî",
    aliases: { en: ["Mevlana"], ar: ["مولانا"] },
    copy: {
      en: { title: "Mevlana Jalal al-Din Rumi", kindLabel: "Scholar and poet", periodLabel: "Died 1273", summary: "Mevlana Jalal al-Din Rumi was a great Muslim scholar and Sufi poet. He lived at the same time as Yunus Emre and died in 1273.", more: "He lived in Konya, and many people visit his tomb there." },
      ar: { title: "مَوْلَانَا جَلَالُ الدِّينِ الرُّومِيُّ", kindLabel: "عَالِمٌ وَشَاعِرٌ", periodLabel: "تُوُفِّيَ عَامَ 1273", summary: "كَانَ مَوْلَانَا جَلَالُ الدِّينِ الرُّومِيُّ عَالِمًا مُسْلِمًا كَبِيرًا وَشَاعِرًا صُوفِيًّا. عَاشَ فِي زَمَنِ يُونُسَ إِمْرَه، وَتُوُفِّيَ عَامَ أَلْفٍ وَمِئَتَيْنِ وَثَلَاثَةٍ وَسَبْعِينَ.", more: "عَاشَ فِي قُونْيَةَ، وَيَزُورُ قَبْرَهُ فِيهَا كَثِيرٌ مِنَ النَّاسِ." },
    },
    picture: { folder: "yunus", name: "mevlana-rumi" },
    sources: ["TDV İslâm Ansiklopedisi: Mevlânâ Celâleddîn-i Rûmî"],
  }),
  defineEntity({
    id: "yunus-haci-bektas-veli", kind: "person",
    aliases: { en: ["Haji Bektash Veli"], ar: ["حاجي بكتاش"] },
    copy: {
      en: { title: "Haji Bektash Veli", kindLabel: "Sufi teacher", periodLabel: "13th century", summary: "Haji Bektash Veli was a famous Sufi teacher in Anatolia. He lived at the same time as Yunus Emre.", more: "A town in central Anatolia, Hacıbektaş, carries his name." },
      ar: { title: "حَاجِي بَكْتَاش وَلِيّ", kindLabel: "مُعَلِّمٌ صُوفِيٌّ", periodLabel: "الْقَرْنُ الثَّالِثَ عَشَرَ", summary: "كَانَ حَاجِي بَكْتَاش وَلِيّ مُعَلِّمًا صُوفِيًّا مَشْهُورًا فِي الْأَنَاضُولِ. وَعَاشَ فِي زَمَنِ يُونُسَ إِمْرَه.", more: "وَتَحْمِلُ اسْمَهُ بَلْدَةٌ فِي وَسَطِ الْأَنَاضُولِ، هِيَ بَلْدَةُ حَاجِي بَكْتَاش." },
    },
    picture: { folder: "yunus", name: "haci-bektas-veli" },
    sources: ["TDV İslâm Ansiklopedisi: Hacı Bektâş-ı Velî"],
  }),
  defineEntity({
    id: "yunus-saru-saltuk", kind: "person", tr: "Sarı Saltuk",
    aliases: { en: ["Saru Saltuk"], ar: ["سارو سالتوك"] },
    copy: {
      en: { title: "Saru Saltuk", kindLabel: "Dervish", periodLabel: "13th century", summary: "Saru Saltuk was a Turkish dervish. He lived at the same time as Yunus Emre.", more: "Stories say that he travelled west to the Balkans with groups of Turkmen." },
      ar: { title: "سَارُو سَالْتُوك", kindLabel: "دَرْوِيشٌ", periodLabel: "الْقَرْنُ الثَّالِثَ عَشَرَ", summary: "كَانَ سَارُو سَالْتُوك دَرْوِيشًا تُرْكِيًّا، وَعَاشَ فِي زَمَنِ يُونُسَ إِمْرَه.", more: "وَتَرْوِي الْحِكَايَاتُ أَنَّهُ سَافَرَ غَرْبًا إِلَى الْبَلْقَانِ مَعَ جَمَاعَاتٍ مِنَ التُّرْكُمَانِ." },
    },
    picture: { folder: "yunus", name: "saru-saltuk" },
    sources: ["TDV İslâm Ansiklopedisi: Sarı Saltuk"],
  }),
  defineEntity({
    id: "yunus-alaeddin-keykubad-i", kind: "person", tr: "I. Alâeddin Keykubad",
    aliases: { en: ["Ala al-Din Kayqubad I"], ar: ["علاء الدين الأول"] },
    copy: {
      en: { title: "Sultan Ala al-Din Kayqubad I", kindLabel: "Sultan of the Anatolian Seljuks", periodLabel: "Ruled 1220–1237", summary: "Ala al-Din Kayqubad I was a sultan of the Anatolian Seljuks. His rule was their strongest time, and he built a navy in the Mediterranean and Black Seas.", more: "Many stone caravanserais, inns for travellers on the trade roads, were built in his time." },
      ar: { title: "السُّلْطَانُ عَلَاءُ الدِّينِ الْأَوَّلُ", kindLabel: "سُلْطَانُ سَلَاجِقَةِ الْأَنَاضُولِ", periodLabel: "حَكَمَ 1220–1237", summary: "كَانَ عَلَاءُ الدِّينِ الْأَوَّلُ سُلْطَانًا مِنْ سَلَاجِقَةِ الْأَنَاضُولِ. وَكَانَ عَهْدُهُ أَقْوَى فَتَرَاتِهِمْ، وَقَدْ أَنْشَأَ أُسْطُولًا بَحْرِيًّا فِي الْبَحْرِ الْأَبْيَضِ الْمُتَوَسِّطِ وَالْبَحْرِ الْأَسْوَدِ.", more: "وَبُنِيَتْ فِي عَهْدِهِ خَانَاتٌ حَجَرِيَّةٌ كَثِيرَةٌ لِلْمُسَافِرِينَ عَلَى طُرُقِ التِّجَارَةِ." },
    },
    picture: { folder: "yunus", name: "alaeddin-keykubad-i" },
    sources: ["TDV İslâm Ansiklopedisi: Keykubad I"],
  }),
  defineEntity({
    id: "yunus-giyaseddin-keyhusrev-ii", kind: "person", tr: "II. Gıyaseddin Keyhüsrev",
    aliases: { en: ["Kaykhusraw II"], ar: ["غياث الدين كيخسرو"] },
    copy: {
      en: { title: "Kaykhusraw II", kindLabel: "Sultan of the Anatolian Seljuks", periodLabel: "Ruled 1237–1246", summary: "Kaykhusraw II was the son of Ala al-Din Kayqubad I and a sultan of the Anatolian Seljuks. Because of his poor rule, the state began to grow weak.", more: "In his time, the Mongols defeated the Seljuk army at Kosedag." },
      ar: { title: "غِيَاثُ الدِّينِ كَيْخُسْرَوْ الثَّانِي", kindLabel: "سُلْطَانُ سَلَاجِقَةِ الْأَنَاضُولِ", periodLabel: "حَكَمَ 1237–1246", summary: "كَانَ غِيَاثُ الدِّينِ كَيْخُسْرَوْ الثَّانِي ابْنَ عَلَاءِ الدِّينِ الْأَوَّلِ، وَسُلْطَانًا مِنْ سَلَاجِقَةِ الْأَنَاضُولِ. وَبِسَبَبِ سُوءِ إِدَارَتِهِ بَدَأَتِ الدَّوْلَةُ تَضْعُفُ.", more: "وَفِي عَهْدِهِ هَزَمَ الْمُغُولُ الْجَيْشَ السَّلْجُوقِيَّ فِي كُوسَه دَاغ." },
    },
    picture: { folder: "yunus", name: "giyaseddin-keyhusrev-ii" },
    sources: ["TDV İslâm Ansiklopedisi: Keyhüsrev II"],
  }),
  defineEntity({
    id: "yunus-baba-ilyas", kind: "person",
    aliases: { en: ["Baba Ilyas"], ar: ["بابا إلياس"] },
    copy: {
      en: { title: "Baba Ilyas", kindLabel: "Turkmen religious leader", periodLabel: "13th century", summary: "Baba Ilyas was a religious and Sufi leader among the Turkmen in Anatolia. He started a movement that was not Sunni, and Baba Ishak was his follower.", more: "It is said that he came from Khorasan and lived near Amasya." },
      ar: { title: "بَابَا إِلْيَاس", kindLabel: "قَائِدٌ دِينِيٌّ تُرْكُمَانِيٌّ", periodLabel: "الْقَرْنُ الثَّالِثَ عَشَرَ", summary: "كَانَ بَابَا إِلْيَاسُ قَائِدًا دِينِيًّا صُوفِيًّا بَيْنَ التُّرْكُمَانِ فِي الْأَنَاضُولِ. أَسَّسَ حَرَكَةً دِينِيَّةً غَيْرَ سُنِّيَّةٍ، وَكَانَ بَابَا إِسْحَاقُ مِنْ مُرِيدِيهِ.", more: "وَيُقَالُ إِنَّهُ جَاءَ مِنْ خُرَاسَانَ، وَعَاشَ قُرْبَ مَدِينَةِ أَمَاسْيَا." },
    },
    picture: { folder: "yunus", name: "baba-ilyas" },
    sources: ["TDV İslâm Ansiklopedisi: Baba İlyâs-ı Horasânî","TDV İslâm Ansiklopedisi: Babaîlik"],
  }),
  defineEntity({
    id: "yunus-baba-ishak", kind: "person",
    aliases: { en: ["Baba Ishak"], ar: ["بابا إسحاق"] },
    copy: {
      en: { title: "Baba Ishak", kindLabel: "Turkmen leader", periodLabel: "Revolt of 1240", summary: "Baba Ishak was a follower of Baba Ilyas. In 1240, he led the Turkmen in a revolt against the Anatolian Seljuks.", more: "This revolt is known as the Babai revolt." },
      ar: { title: "بَابَا إِسْحَاق", kindLabel: "قَائِدٌ تُرْكُمَانِيٌّ", periodLabel: "ثَوْرَةُ عَامِ 1240", summary: "كَانَ بَابَا إِسْحَاقُ مُرِيدًا لِبَابَا إِلْيَاسَ. وَفِي عَامِ أَلْفٍ وَمِئَتَيْنِ وَأَرْبَعِينَ، قَادَ التُّرْكُمَانَ فِي ثَوْرَةٍ عَلَى سَلَاجِقَةِ الْأَنَاضُولِ.", more: "وَتُعْرَفُ هَذِهِ الثَّوْرَةُ بِثَوْرَةِ الْبَابَائِيِّينَ." },
    },
    picture: { folder: "yunus", name: "baba-ishak" },
    sources: ["TDV İslâm Ansiklopedisi: Babaîlik"],
  }),
  defineEntity({
    id: "yunus-celaleddin-karatay", kind: "person",
    aliases: { en: ["Jalal al-Din Karatay"], ar: ["قرطاي"] },
    copy: {
      en: { title: "Jalal al-Din Karatay", kindLabel: "Statesman", periodLabel: "13th century", summary: "Jalal al-Din Karatay was a statesman of the Anatolian Seljuks. He tried to manage the Mongols and to help the state and the people.", more: "The Karatay Madrasa that he built in Konya is a museum today." },
      ar: { title: "جَلَالُ الدِّينِ قَرَطَاي", kindLabel: "رَجُلُ دَوْلَةٍ", periodLabel: "الْقَرْنُ الثَّالِثَ عَشَرَ", summary: "كَانَ جَلَالُ الدِّينِ قَرَطَاي رَجُلَ دَوْلَةٍ عِنْدَ سَلَاجِقَةِ الْأَنَاضُولِ. حَاوَلَ أَنْ يُدِيرَ الْعَلَاقَةَ مَعَ الْمُغُولِ، وَأَنْ يُخَفِّفَ عَنِ الدَّوْلَةِ وَالشَّعْبِ.", more: "وَالْمَدْرَسَةُ الَّتِي بَنَاهَا فِي قُونْيَةَ، مَدْرَسَةُ قَرَطَاي، أَصْبَحَتِ الْيَوْمَ مُتْحَفًا." },
    },
    picture: { folder: "yunus", name: "celaleddin-karatay" },
    sources: ["TDV İslâm Ansiklopedisi: Karatay, Celâleddin"],
  }),
  defineEntity({
    id: "yunus-anatolian-seljuks", kind: "kingdom", tr: "Anadolu Selçukluları",
    aliases: { en: ["Anatolian Seljuk","Seljuk Sultanate of Konya","Seljuk"], ar: ["السلاجقة الأناضوليون","سلاجقة قونية","السلاجقة"] },
    copy: {
      en: { title: "Anatolian Seljuks", kindLabel: "Sultanate", periodLabel: "11th–14th century", summary: "The Anatolian Seljuks were a Turkish Muslim state, and their capital was Konya. After the defeat at Kosedag in 1243, they slowly came under Mongol rule.", more: "Many of their stone buildings can still be seen in Konya today." },
      ar: { title: "سَلَاجِقَةُ الْأَنَاضُولِ", kindLabel: "سَلْطَنَةٌ", periodLabel: "الْقُرُونُ 11–14", summary: "كَانَتْ دَوْلَةُ سَلَاجِقَةِ الْأَنَاضُولِ دَوْلَةً تُرْكِيَّةً مُسْلِمَةً، وَعَاصِمَتُهَا قُونْيَةُ. وَبَعْدَ هَزِيمَةِ كُوسَه دَاغ عَامَ أَلْفٍ وَمِئَتَيْنِ وَثَلَاثَةٍ وَأَرْبَعِينَ، أَصْبَحُوا شَيْئًا فَشَيْئًا تَابِعِينَ لِلْمُغُولِ.", more: "وَلَا تَزَالُ كَثِيرٌ مِنْ مَبَانِيهِمُ الْحَجَرِيَّةِ قَائِمَةً فِي قُونْيَةَ حَتَّى الْيَوْمِ." },
    },
    focus: medFeature('anatolian-seljuk-lands', 38.8, 34.5, 1),
    picture: { folder: "yunus", name: "anatolian-seljuks" },
    sources: ["TDV İslâm Ansiklopedisi: Türkiye Selçukluları"],
  }),
  defineEntity({
    id: "yunus-mongols", kind: "people", tr: "Moğollar",
    aliases: { en: ["Mongols","Mongol"], ar: ["مغول"] },
    copy: {
      en: { title: "The Mongols", kindLabel: "People", periodLabel: "13th century", summary: "The Mongols were a people from the steppes of Mongolia, far to the east. In the 13th century, their armies invaded Anatolia and destroyed many cities.", more: "They built one of the largest empires in history." },
      ar: { title: "الْمُغُولُ", kindLabel: "شَعْبٌ", periodLabel: "الْقَرْنُ الثَّالِثَ عَشَرَ", summary: "الْمُغُولُ شَعْبٌ جَاءَ مِنْ سُهُوبِ مَنْغُولْيَا فِي شَرْقِ آسِيَا. وَفِي الْقَرْنِ الثَّالِثَ عَشَرَ، غَزَتْ جُيُوشُهُمُ الْأَنَاضُولَ وَدَمَّرَتْ مُدُنًا كَثِيرَةً.", more: "وَقَدْ أَسَّسُوا وَاحِدَةً مِنْ أَكْبَرِ الْإِمْبَرَاطُورِيَّاتِ فِي التَّارِيخِ." },
    },
    focus: medFeature('mongol-homeland', 49.6, 103, 1, { arrows: [{ from: [45.6, 100], to: [39.5, 40] }], view: { north: 62, west: 28, widthDegrees: 95 } }),
    picture: { folder: "andalus", name: "mongols" },
    sources: ["TDV İslâm Ansiklopedisi: Moğollar"],
  }),
  defineEntity({
    id: "yunus-ilkhanate", kind: "empire", tr: "İlhanlılar",
    aliases: { en: ["Ilkhanate"], ar: ["إيلخان"] },
    copy: {
      en: { title: "The Ilkhanate", kindLabel: "Mongol state", periodLabel: "13th–14th century", summary: "The Ilkhanate was a Mongol state with its centre in Iran. In 1308, the lands of Anatolia were joined directly to it.", more: "It was founded by Hülegü, a grandson of Genghis Khan." },
      ar: { title: "الدَّوْلَةُ الْإِيلْخَانِيَّةُ", kindLabel: "دَوْلَةٌ مُغُولِيَّةٌ", periodLabel: "الْقَرْنَانِ الثَّالِثَ عَشَرَ وَالرَّابِعَ عَشَرَ", summary: "كَانَتِ الدَّوْلَةُ الْإِيلْخَانِيَّةُ دَوْلَةً مُغُولِيَّةً مَرْكَزُهَا إِيرَانُ. وَفِي عَامِ أَلْفٍ وَثَلَاثِمِئَةٍ وَثَمَانِيَةٍ، أُلْحِقَتْ بِهَا أَرَاضِي الْأَنَاضُولِ مُبَاشَرَةً.", more: "وَقَدْ أَسَّسَهَا هُولَاكُو، حَفِيدُ جِنْكِيزْ خَانْ." },
    },
    focus: medFeature('ilkhanate', 34.5, 51, 1, { view: { north: 52, west: 22, widthDegrees: 62 } }),
    picture: { folder: "yunus", name: "ilkhanate" },
    sources: ["TDV İslâm Ansiklopedisi: İlhanlılar"],
  }),
  defineEntity({
    id: "yunus-turkmens", kind: "people", tr: "Türkmenler",
    aliases: { en: ["Turkmen"], ar: ["تركمان"] },
    copy: {
      en: { title: "The Turkmen", kindLabel: "People", periodLabel: "Nomads in Anatolia", summary: "The Turkmen were Turkish nomads who lived in tents with their flocks. In the 13th century, their number in Anatolia grew, and they rose against the Anatolian Seljuks.", more: "Today, the people of Turkmenistan are also called Turkmen." },
      ar: { title: "التُّرْكُمَانُ", kindLabel: "شَعْبٌ", periodLabel: "رُحَّلٌ فِي الْأَنَاضُولِ", summary: "كَانَ التُّرْكُمَانُ قَبَائِلَ تُرْكِيَّةً رُحَّلًا تَعِيشُ فِي الْخِيَامِ مَعَ قُطْعَانِهَا. وَفِي الْقَرْنِ الثَّالِثَ عَشَرَ ازْدَادَ عَدَدُهُمْ فِي الْأَنَاضُولِ، وَثَارُوا عَلَى سَلَاجِقَةِ الْأَنَاضُولِ.", more: "وَيُسَمَّى أَهْلُ تُرْكُمَانِسْتَانَ الْيَوْمَ تُرْكُمَانًا أَيْضًا." },
    },
    focus: medFeature('anatolia', 39, 33.5, 1, { arrows: [{ from: [40, 60], to: [39.3, 38] }], view: { north: 52, west: 22, widthDegrees: 62 } }),
    picture: { folder: "yunus", name: "turkmens" },
    sources: ["TDV İslâm Ansiklopedisi: Türkmen"],
  }),
  defineEntity({
    id: "yunus-oghuz", kind: "tribe", tr: "Oğuzlar",
    aliases: { en: ["Oguz"], ar: ["أوغوز"] },
    copy: {
      en: { title: "The Oguz", kindLabel: "Turkic tribes", periodLabel: "Nomads of Central Asia", summary: "The Oguz were nomadic Turkic tribes. To escape the Mongols, many of them moved from Central Asia to Anatolia.", more: "Most Turks of Türkiye, Azerbaijan and Turkmenistan come from the Oguz." },
      ar: { title: "الْأُوغُوزُ", kindLabel: "قَبَائِلُ تُرْكِيَّةٌ", periodLabel: "رُحَّلُ آسِيَا الْوُسْطَى", summary: "كَانَ الْأُوغُوزُ قَبَائِلَ تُرْكِيَّةً رُحَّلًا. وَهَرَبًا مِنَ الْمُغُولِ، هَاجَرَ كَثِيرٌ مِنْهُمْ مِنْ آسِيَا الْوُسْطَى إِلَى الْأَنَاضُولِ.", more: "وَيَنْحَدِرُ مُعْظَمُ أَتْرَاكِ تُرْكِيَا وَأَذْرَبِيجَانَ وَتُرْكُمَانِسْتَانَ مِنَ الْأُوغُوزِ." },
    },
    focus: medFeature('oghuz-steppe', 44, 60, 1, { arrows: [{ from: [42.5, 60], to: [39.3, 38] }], view: { north: 52, west: 22, widthDegrees: 62 } }),
    picture: { folder: "yunus", name: "oghuz" },
    sources: ["TDV İslâm Ansiklopedisi: Oğuzlar"],
  }),
  defineEntity({
    id: "yunus-ottomans", kind: "kingdom", tr: "Osmanlılar",
    aliases: { en: ["Ottoman state"], ar: ["الدولة العثمانية"] },
    copy: {
      en: { title: "The Ottoman State", kindLabel: "State", periodLabel: "From about 1300", summary: "The Ottoman State began as a small principality in north-west Anatolia. In the time of Yunus Emre, it was still small.", more: "Later, it became a great empire that lasted for about six centuries." },
      ar: { title: "الدَّوْلَةُ الْعُثْمَانِيَّةُ", kindLabel: "دَوْلَةٌ", periodLabel: "مُنْذُ نَحْوِ عَامِ 1300", summary: "بَدَأَتِ الدَّوْلَةُ الْعُثْمَانِيَّةُ إِمَارَةً صَغِيرَةً فِي شَمَالِ غَرْبِ الْأَنَاضُولِ. وَفِي زَمَنِ يُونُسَ إِمْرَه كَانَتْ لَا تَزَالُ صَغِيرَةً.", more: "ثُمَّ أَصْبَحَتْ بَعْدَ ذَلِكَ إِمْبَرَاطُورِيَّةً كَبِيرَةً دَامَتْ نَحْوَ سِتَّةِ قُرُونٍ." },
    },
    focus: medFeature('early-ottoman-lands', 40.1, 30.2, 1),
    picture: { folder: "yunus", name: "ottomans" },
    sources: ["TDV İslâm Ansiklopedisi: Osmanlılar"],
  }),
];

export const YUNUS_EMRE_SET: EntityBookSet = {
  entities,
  chapters: {
    'yunusEmre-a2': {
      1: ["yunus-anatolia","yunus-syria","yunus-azerbaijan","yunus-tekke","yunus-madrasa","yunus-yunus-emre","yunus-taptuk-emre","yunus-mevlana-rumi"],
      3: ["yunus-yunus-emre","yunus-taptuk-emre"],
      4: ["yunus-tekke","yunus-yunus-emre","yunus-taptuk-emre"],
      5: ["yunus-yunus-emre","yunus-taptuk-emre"],
      6: ["yunus-tekke","yunus-yunus-emre"],
      7: ["yunus-yunus-emre","yunus-taptuk-emre"],
      8: ["yunus-yunus-emre"],
    },
    'yunusEmre-b1': {
      1: ["yunus-anatolia","yunus-yunus-emre"],
      2: ["yunus-tekke","yunus-madrasa","yunus-mevlana-rumi","yunus-haci-bektas-veli"],
      3: ["yunus-anatolia","yunus-kosedag","yunus-tekke","yunus-yunus-emre","yunus-taptuk-emre","yunus-anatolian-seljuks","yunus-mongols"],
      4: ["yunus-anatolia","yunus-middle-east","yunus-central-asia","yunus-mediterranean","yunus-black-sea","yunus-yunus-emre","yunus-alaeddin-keykubad-i","yunus-giyaseddin-keyhusrev-ii","yunus-anatolian-seljuks","yunus-mongols","yunus-turkmens"],
      5: ["yunus-erzurum","yunus-sivas","yunus-kayseri","yunus-erzincan","yunus-azerbaijan","yunus-kosedag","yunus-anatolian-seljuks","yunus-mongols","yunus-turkmens"],
      6: ["yunus-anatolia","yunus-iran","yunus-yunus-emre","yunus-anatolian-seljuks","yunus-mongols","yunus-ilkhanate"],
      7: ["yunus-anatolia","yunus-turkestan","yunus-khorasan","yunus-iran","yunus-yunus-emre","yunus-mongols"],
      8: ["yunus-yunus-emre"],
      9: ["yunus-yunus-emre"],
      10: ["yunus-yunus-emre"],
      11: ["yunus-yunus-emre"],
      12: ["yunus-yunus-emre"],
      13: ["yunus-yunus-emre"],
    },
    'yunusEmre-b2': {
      1: ["yunus-anatolia","yunus-yunus-emre"],
      2: ["yunus-tekke","yunus-madrasa","yunus-mevlana-rumi","yunus-haci-bektas-veli","yunus-saru-saltuk"],
      3: ["yunus-anatolia","yunus-kosedag","yunus-mediterranean","yunus-black-sea","yunus-tekke","yunus-yunus-emre","yunus-taptuk-emre","yunus-alaeddin-keykubad-i","yunus-anatolian-seljuks","yunus-mongols"],
      4: ["yunus-anatolia","yunus-middle-east","yunus-central-asia","yunus-giyaseddin-keyhusrev-ii","yunus-baba-ilyas","yunus-baba-ishak","yunus-anatolian-seljuks","yunus-mongols","yunus-turkmens","yunus-oghuz"],
      5: ["yunus-erzurum","yunus-sivas","yunus-kayseri","yunus-erzincan","yunus-anatolia","yunus-azerbaijan","yunus-kosedag","yunus-yunus-emre","yunus-anatolian-seljuks","yunus-mongols","yunus-turkmens"],
      6: ["yunus-konya","yunus-anatolia","yunus-iran","yunus-celaleddin-karatay","yunus-anatolian-seljuks","yunus-mongols","yunus-ilkhanate","yunus-ottomans"],
      7: ["yunus-anatolia","yunus-turkestan","yunus-khorasan","yunus-iran","yunus-transoxiana","yunus-khwarezm","yunus-yunus-emre","yunus-mongols"],
      8: ["yunus-yunus-emre"],
      9: ["yunus-yunus-emre"],
      10: ["yunus-yunus-emre"],
      11: ["yunus-yunus-emre"],
      12: ["yunus-yunus-emre"],
      13: ["yunus-yunus-emre"],
      14: ["yunus-kosedag","yunus-tekke","yunus-yunus-emre"],
    },
  },
};
