import { defineEntity } from './define';
import { medFeature, medPoint } from '../mediterraneanMap';
import type { EntityBookSet } from './index';

// Places & People cards for the abraham books (A2, B1, B2), English and Arabic.
// Generated from the reviewed card list; the chapters are where each level's story
// names the place. Sources are TDV İslâm Ansiklopedisi article titles.

const CITY_ZOOM = 1.8;

const entities = [
  defineEntity({
    id: "abraham-babylon", kind: "city", tr: "Babil",
    aliases: { en: ["Babylon"], ar: ["بابل"] },
    copy: {
      en: { title: "Babylon", kindLabel: "Ancient city and kingdom", periodLabel: "Ancient Mesopotamia", summary: "Babylon was an old city and kingdom in Mesopotamia. In the story, Abraham (pbuh) lived in the kingdom of Babylon, and Nimrod was its king.", more: "Its ruins are near the Euphrates River, in Iraq today." },
      ar: { title: "بَابِلُ", kindLabel: "مَدِينَةٌ وَمَمْلَكَةٌ قَدِيمَةٌ", periodLabel: "بِلَادُ مَا بَيْنَ النَّهْرَيْنِ قَدِيمًا", summary: "كَانَتْ بَابِلُ مَدِينَةً وَمَمْلَكَةً قَدِيمَةً فِي بِلَادِ مَا بَيْنَ النَّهْرَيْنِ. وَفِي الْقِصَّةِ عَاشَ إِبْرَاهِيمُ عَلَيْهِ السَّلَامُ فِي مَمْلَكَةِ بَابِلَ، وَكَانَ نُمْرُودُ مَلِكَهَا.", more: "وَتَقَعُ آثَارُهَا الْيَوْمَ فِي الْعِرَاقِ، قُرْبَ نَهْرِ الْفُرَاتِ." },
    },
    focus: medPoint(32.54, 44.42, CITY_ZOOM),
    picture: { folder: "abraham", name: "babylon" },
    sources: ["TDV İslâm Ansiklopedisi: Bâbil"],
  }),
  defineEntity({
    id: "abraham-ur", kind: "city",
    aliases: { en: ["city of Ur"], ar: ["مدينة أور"] },
    copy: {
      en: { title: "Ur", kindLabel: "Ancient city", periodLabel: "Ancient Mesopotamia", summary: "Ur was an old city of the Sumerians in the south of Mesopotamia. Some sources say that Abraham (pbuh) was born in Ur or in Babylon.", more: "Its ruins, with a big stepped temple tower, are in the south of Iraq today." },
      ar: { title: "أُورُ", kindLabel: "مَدِينَةٌ قَدِيمَةٌ", periodLabel: "بِلَادُ مَا بَيْنَ النَّهْرَيْنِ قَدِيمًا", summary: "كَانَتْ أُورُ مَدِينَةً قَدِيمَةً لِلسُّومَرِيِّينَ فِي جَنُوبِ بِلَادِ مَا بَيْنَ النَّهْرَيْنِ. وَتَقُولُ بَعْضُ الْمَصَادِرِ إِنَّ إِبْرَاهِيمَ عَلَيْهِ السَّلَامُ وُلِدَ فِي أُورَ أَوْ فِي بَابِلَ.", more: "وَتُوجَدُ آثَارُهَا الْيَوْمَ فِي جَنُوبِ الْعِرَاقِ، وَمِنْهَا مَعْبَدٌ كَبِيرٌ مُدَرَّجٌ يُسَمَّى الزِّقُّورَةَ." },
    },
    focus: medPoint(30.96, 46.1, CITY_ZOOM),
    picture: { folder: "abraham", name: "ur" },
    sources: ["TDV İslâm Ansiklopedisi: İbrâhim","TDV İslâm Ansiklopedisi: Irak"],
  }),
  defineEntity({
    id: "abraham-harran", kind: "city",
    aliases: { en: ["Harran"], ar: ["حران"] },
    copy: {
      en: { title: "Harran", kindLabel: "Ancient city", periodLabel: "Upper Mesopotamia", summary: "Harran is an old city in the north of Mesopotamia, in the south of Türkiye today. Some sources say that Abraham (pbuh) moved from the land of Sumer to Harran.", more: "Its old ruins are near the city of Şanlıurfa." },
      ar: { title: "حَرَّانُ", kindLabel: "مَدِينَةٌ قَدِيمَةٌ", periodLabel: "شَمَالُ بِلَادِ مَا بَيْنَ النَّهْرَيْنِ", summary: "حَرَّانُ مَدِينَةٌ قَدِيمَةٌ فِي شَمَالِ بِلَادِ مَا بَيْنَ النَّهْرَيْنِ، وَتَقَعُ الْيَوْمَ فِي جَنُوبِ تُرْكِيَا. وَتَقُولُ بَعْضُ الْمَصَادِرِ إِنَّ إِبْرَاهِيمَ عَلَيْهِ السَّلَامُ هَاجَرَ مِنْ أَرْضِ سُومَرَ إِلَى حَرَّانَ.", more: "وَتَقَعُ آثَارُهَا الْقَدِيمَةُ قُرْبَ مَدِينَةِ شَانْلِي أُورْفَا." },
    },
    focus: medPoint(36.86, 39.03, CITY_ZOOM),
    picture: { folder: "abraham", name: "harran" },
    sources: ["TDV İslâm Ansiklopedisi: Harran"],
  }),
  defineEntity({
    id: "abraham-mecca-valley-ancient", kind: "city", tr: "Mekke",
    aliases: { en: ["Mecca"], ar: ["مكة"] },
    copy: {
      en: { title: "Mecca", kindLabel: "Valley and city", periodLabel: "Western Arabia", summary: "Mecca is a city in a dry valley in western Arabia. In the story, Hagar and Ishmael (pbuh) lived in this valley, and more people came there because of the Zamzam water.", more: "Today, millions of Muslims visit Mecca for Hajj and Umrah." },
      ar: { title: "مَكَّةُ", kindLabel: "وَادٍ وَمَدِينَةٌ", periodLabel: "غَرْبُ الْجَزِيرَةِ الْعَرَبِيَّةِ", summary: "مَكَّةُ مَدِينَةٌ فِي وَادٍ جَافٍّ فِي غَرْبِ الْجَزِيرَةِ الْعَرَبِيَّةِ. وَفِي الْقِصَّةِ عَاشَتْ هَاجَرُ وَابْنُهَا إِسْمَاعِيلُ عَلَيْهِ السَّلَامُ فِي هَذَا الْوَادِي، وَجَاءَ إِلَيْهِ نَاسٌ كَثِيرُونَ بِسَبَبِ مَاءِ زَمْزَمَ.", more: "وَيَزُورُ مَكَّةَ الْيَوْمَ مَلَايِينُ الْمُسْلِمِينَ لِأَدَاءِ الْحَجِّ وَالْعُمْرَةِ." },
    },
    focus: medPoint(21.42, 39.83, CITY_ZOOM),
    picture: { folder: "mecca", name: "mecca-valley-ancient" },
    sources: ["TDV İslâm Ansiklopedisi: Mekke"],
  }),
  defineEntity({
    id: "abraham-damascus-pre-islamic", kind: "city", tr: "Şam",
    aliases: { en: ["Damascus"], ar: ["دمشق"] },
    copy: {
      en: { title: "Damascus", kindLabel: "City", periodLabel: "Syria · before Islam", summary: "Damascus is a very old city in Syria. In the story, Waraqa ibn Nawfal went there to look for Hanifism, the faith of Abraham (pbuh).", more: "It is one of the oldest cities in the world where people still live." },
      ar: { title: "دِمَشْقُ", kindLabel: "مَدِينَةٌ", periodLabel: "بِلَادُ الشَّامِ قَبْلَ الْإِسْلَامِ", summary: "دِمَشْقُ مَدِينَةٌ قَدِيمَةٌ جِدًّا فِي بِلَادِ الشَّامِ. وَفِي الْقِصَّةِ ذَهَبَ إِلَيْهَا وَرَقَةُ بْنُ نَوْفَلٍ بَحْثًا عَنِ الْحَنِيفِيَّةِ، دِينِ إِبْرَاهِيمَ عَلَيْهِ السَّلَامُ.", more: "وَهِيَ مِنْ أَقْدَمِ مُدُنِ الْعَالَمِ الَّتِي مَا زَالَ النَّاسُ يَسْكُنُونَهَا." },
    },
    focus: medPoint(33.51, 36.29, CITY_ZOOM),
    picture: { folder: "abraham", name: "damascus-pre-islamic" },
    sources: ["TDV İslâm Ansiklopedisi: Şam"],
  }),
  defineEntity({
    id: "abraham-mesopotamia", kind: "region", tr: "Mezopotamya",
    aliases: { en: ["Mesopotamia"], ar: ["ما بين النهرين"] },
    copy: {
      en: { title: "Mesopotamia", kindLabel: "Historical region", periodLabel: "Ancient Near East", summary: "Mesopotamia is the old name of the land between two rivers, the Tigris and the Euphrates. In the story, Abraham (pbuh) was born in this land.", more: "Most of this land is in Iraq today." },
      ar: { title: "بِلَادُ مَا بَيْنَ النَّهْرَيْنِ", kindLabel: "مِنْطَقَةٌ تَارِيخِيَّةٌ", periodLabel: "الشَّرْقُ الْأَدْنَى الْقَدِيمُ", summary: "بِلَادُ مَا بَيْنَ النَّهْرَيْنِ اسْمٌ قَدِيمٌ لِلْأَرْضِ الَّتِي تَقَعُ بَيْنَ نَهْرَيْ دِجْلَةَ وَالْفُرَاتِ. وَفِي الْقِصَّةِ وُلِدَ إِبْرَاهِيمُ عَلَيْهِ السَّلَامُ فِي هَذِهِ الْأَرْضِ.", more: "وَيَقَعُ أَكْثَرُ هَذِهِ الْأَرْضِ الْيَوْمَ فِي الْعِرَاقِ." },
    },
    focus: medFeature('mesopotamia', 33.6, 43.8, 1),
    picture: { folder: "abraham", name: "mesopotamia" },
    sources: ["TDV İslâm Ansiklopedisi: Irak","TDV İslâm Ansiklopedisi: Fırat"],
  }),
  defineEntity({
    id: "abraham-sumer", kind: "region",
    aliases: { en: ["Sumer"], ar: ["سومر"] },
    copy: {
      en: { title: "Sumer", kindLabel: "Ancient land", periodLabel: "Southern Mesopotamia", summary: "Sumer was an old land in the south of Mesopotamia. Some sources say that Abraham (pbuh) was born in the land of Sumer.", more: "The Sumerians were among the first people to use writing." },
      ar: { title: "سُومَرُ", kindLabel: "أَرْضٌ قَدِيمَةٌ", periodLabel: "جَنُوبُ بِلَادِ مَا بَيْنَ النَّهْرَيْنِ", summary: "كَانَتْ سُومَرُ أَرْضًا قَدِيمَةً فِي جَنُوبِ بِلَادِ مَا بَيْنَ النَّهْرَيْنِ. وَتَقُولُ بَعْضُ الْمَصَادِرِ إِنَّ إِبْرَاهِيمَ عَلَيْهِ السَّلَامُ وُلِدَ فِي أَرْضِ سُومَرَ.", more: "وَكَانَ السُّومَرِيُّونَ مِنْ أَوَّلِ الشُّعُوبِ الَّتِي اسْتَعْمَلَتِ الْكِتَابَةَ." },
    },
    focus: medFeature('sumer', 31.3, 46.1, 1),
    picture: { folder: "abraham", name: "sumer" },
    sources: ["TDV İslâm Ansiklopedisi: İbrâhim","TDV İslâm Ansiklopedisi: Irak"],
  }),
  defineEntity({
    id: "abraham-syria-ancient", kind: "region", tr: "Suriye",
    aliases: { en: ["Syria"], ar: ["الشام","سوريا"] },
    copy: {
      en: { title: "Syria (al-Sham)", kindLabel: "Historical region", periodLabel: "The Levant", summary: "Syria, or al-Sham, is an old land west of Mesopotamia, near the Mediterranean Sea. In the story, Abraham (pbuh) travelled from Babylon to Syria and Palestine.", more: "Damascus and Aleppo are two of its old cities." },
      ar: { title: "بِلَادُ الشَّامِ (سُورِيَا)", kindLabel: "مِنْطَقَةٌ تَارِيخِيَّةٌ", periodLabel: "بِلَادُ الشَّامِ", summary: "بِلَادُ الشَّامِ أَرْضٌ قَدِيمَةٌ تَقَعُ غَرْبَ بِلَادِ مَا بَيْنَ النَّهْرَيْنِ، قُرْبَ الْبَحْرِ الْمُتَوَسِّطِ. وَفِي الْقِصَّةِ سَافَرَ إِبْرَاهِيمُ عَلَيْهِ السَّلَامُ مِنْ بَابِلَ إِلَى بِلَادِ الشَّامِ وَفِلَسْطِينَ.", more: "وَمِنْ مُدُنِهَا الْقَدِيمَةِ دِمَشْقُ وَحَلَبُ." },
    },
    focus: medFeature('syria', 35, 38, 1),
    picture: { folder: "abraham", name: "syria-ancient" },
    sources: ["TDV İslâm Ansiklopedisi: Suriye"],
  }),
  defineEntity({
    id: "abraham-palestine-ancient", kind: "region", tr: "Filistin",
    aliases: { en: ["Palestine"], ar: ["فلسطين"] },
    copy: {
      en: { title: "Palestine", kindLabel: "Historical region", periodLabel: "Eastern Mediterranean", summary: "Palestine is an old land on the eastern coast of the Mediterranean Sea. In the story, Abraham (pbuh) travelled to Palestine and called people to Allah.", more: "The city of Jerusalem (al-Quds) is in Palestine." },
      ar: { title: "فِلَسْطِينُ", kindLabel: "مِنْطَقَةٌ تَارِيخِيَّةٌ", periodLabel: "شَرْقُ الْبَحْرِ الْمُتَوَسِّطِ", summary: "فِلَسْطِينُ أَرْضٌ قَدِيمَةٌ عَلَى السَّاحِلِ الشَّرْقِيِّ لِلْبَحْرِ الْمُتَوَسِّطِ. وَفِي الْقِصَّةِ سَافَرَ إِبْرَاهِيمُ عَلَيْهِ السَّلَامُ إِلَيْهَا، وَدَعَا النَّاسَ إِلَى اللهِ.", more: "وَفِيهَا مَدِينَةُ الْقُدْسِ." },
    },
    focus: medFeature('palestine', 31.6, 35, 1),
    picture: { folder: "mecca", name: "palestine-ancient" },
    sources: ["TDV İslâm Ansiklopedisi: Filistin"],
  }),
  defineEntity({
    id: "abraham-egypt-ancient", kind: "country", tr: "Mısır",
    aliases: { en: ["Egypt"], ar: ["مصر"] },
    copy: {
      en: { title: "Egypt", kindLabel: "Ancient land", periodLabel: "North-east Africa · the Nile", summary: "Egypt is an old land in north-east Africa, along the River Nile. In the story, Abraham (pbuh) travelled to Egypt with Sarah and Lot (pbuh), and Hagar was from Egypt.", more: "The great pyramids of Giza are in Egypt." },
      ar: { title: "مِصْرُ", kindLabel: "أَرْضٌ قَدِيمَةٌ", periodLabel: "شَمَالُ شَرْقِ أَفْرِيقِيَا · وَادِي النِّيلِ", summary: "مِصْرُ أَرْضٌ قَدِيمَةٌ فِي شَمَالِ شَرْقِ أَفْرِيقِيَا، عَلَى ضِفَافِ نَهْرِ النِّيلِ. وَفِي الْقِصَّةِ سَافَرَ إِبْرَاهِيمُ عَلَيْهِ السَّلَامُ إِلَيْهَا مَعَ سَارَةَ وَلُوطٍ عَلَيْهِ السَّلَامُ، وَكَانَتْ هَاجَرُ مِصْرِيَّةً.", more: "وَفِي مِصْرَ أَهْرَامُ الْجِيزَةِ الْعَظِيمَةُ." },
    },
    focus: medFeature('egypt', 27, 30.5, 1),
    picture: { folder: "abraham", name: "egypt-ancient" },
    sources: ["TDV İslâm Ansiklopedisi: Mısır"],
  }),
  defineEntity({
    id: "abraham-arabian-peninsula", kind: "region", tr: "Arap Yarımadası",
    aliases: { en: ["Arabian Peninsula"], ar: ["الجزيرة العربية"] },
    copy: {
      en: { title: "The Arabian Peninsula", kindLabel: "Region", periodLabel: "Arabia", summary: "The Arabian Peninsula is a large land of deserts and mountains between the Red Sea and the Gulf. In the story, the valley of Mecca is in it, and the children of Ishmael (pbuh) later spread all over it.", more: "Today, Saudi Arabia, Yemen, Oman and other countries are on this peninsula." },
      ar: { title: "شِبْهُ الْجَزِيرَةِ الْعَرَبِيَّةِ", kindLabel: "مِنْطَقَةٌ", periodLabel: "بِلَادُ الْعَرَبِ", summary: "شِبْهُ الْجَزِيرَةِ الْعَرَبِيَّةِ أَرْضٌ وَاسِعَةٌ مِنَ الصَّحَارِي وَالْجِبَالِ بَيْنَ الْبَحْرِ الْأَحْمَرِ وَالْخَلِيجِ. وَفِي الْقِصَّةِ يَقَعُ فِيهَا وَادِي مَكَّةَ، وَقَدِ انْتَشَرَ أَبْنَاءُ إِسْمَاعِيلَ عَلَيْهِ السَّلَامُ فِي أَنْحَائِهَا.", more: "وَتَقَعُ فِيهَا الْيَوْمَ السُّعُودِيَّةُ وَالْيَمَنُ وَعُمَانُ وَدُوَلٌ أُخْرَى." },
    },
    focus: medFeature('arabian-peninsula', 23.5, 45.5, 1),
    picture: { folder: "mecca", name: "arabian-peninsula" },
    sources: ["TDV İslâm Ansiklopedisi: Arabistan"],
  }),
  defineEntity({
    id: "abraham-hijaz", kind: "region", tr: "Hicaz",
    aliases: { en: ["Hijaz"], ar: ["حجاز"] },
    copy: {
      en: { title: "The Hijaz", kindLabel: "Region", periodLabel: "Western Arabia", summary: "The Hijaz is a region in the west of the Arabian Peninsula, along the Red Sea. In the story, Ishmael (pbuh) taught the faith of his father in the Hijaz.", more: "The cities of Mecca and Medina are in the Hijaz." },
      ar: { title: "الْحِجَازُ", kindLabel: "مِنْطَقَةٌ", periodLabel: "غَرْبُ الْجَزِيرَةِ الْعَرَبِيَّةِ", summary: "الْحِجَازُ مِنْطَقَةٌ فِي غَرْبِ شِبْهِ الْجَزِيرَةِ الْعَرَبِيَّةِ، عَلَى سَاحِلِ الْبَحْرِ الْأَحْمَرِ. وَفِي الْقِصَّةِ عَلَّمَ إِسْمَاعِيلُ عَلَيْهِ السَّلَامُ دِينَ أَبِيهِ فِي الْحِجَازِ.", more: "وَفِيهِ مَكَّةُ الْمُكَرَّمَةُ وَالْمَدِينَةُ الْمُنَوَّرَةُ." },
    },
    focus: medFeature('hijaz', 24.2, 39, 1),
    picture: { folder: "abraham", name: "hijaz" },
    sources: ["TDV İslâm Ansiklopedisi: Hicaz"],
  }),
  defineEntity({
    id: "abraham-yemen", kind: "region",
    aliases: { en: ["Yemen"], ar: ["اليمن"] },
    copy: {
      en: { title: "Yemen", kindLabel: "Region", periodLabel: "Southern Arabia", summary: "Yemen is a land in the south of the Arabian Peninsula, with high green mountains. In the story, the tribe of Jurham came from Yemen to the valley of Mecca.", more: "In old times, Yemen was famous for its trade in incense and spices." },
      ar: { title: "الْيَمَنُ", kindLabel: "مِنْطَقَةٌ", periodLabel: "جَنُوبُ الْجَزِيرَةِ الْعَرَبِيَّةِ", summary: "الْيَمَنُ أَرْضٌ فِي جَنُوبِ شِبْهِ الْجَزِيرَةِ الْعَرَبِيَّةِ، فِيهَا جِبَالٌ عَالِيَةٌ خَضْرَاءُ. وَفِي الْقِصَّةِ جَاءَتْ قَبِيلَةُ جُرْهُمَ مِنَ الْيَمَنِ إِلَى وَادِي مَكَّةَ.", more: "وَكَانَ الْيَمَنُ قَدِيمًا مَشْهُورًا بِتِجَارَةِ الْبَخُورِ وَالتَّوَابِلِ." },
    },
    focus: medFeature('yemen', 15.5, 47, 1),
    picture: { folder: "abraham", name: "yemen" },
    sources: ["TDV İslâm Ansiklopedisi: Yemen"],
  }),
  defineEntity({
    id: "abraham-safa-and-marwa-ancient", kind: "landmark", tr: "Safa ve Merve",
    aliases: { en: ["Safa and Marwah","Safa and Marwa","Safa","Marwa"], ar: ["الصفا","المروة"] },
    copy: {
      en: { title: "Safa and Marwa", kindLabel: "Two hills", periodLabel: "Mecca · Western Arabia", summary: "Safa and Marwa are two small hills in Mecca, near the Ka’ba. In the story, Hagar ran between them to look for water.", more: "During Hajj and Umrah, Muslims walk between these two hills seven times; this is called sa'y." },
      ar: { title: "الصَّفَا وَالْمَرْوَةُ", kindLabel: "تَلَّانِ", periodLabel: "مَكَّةُ · غَرْبُ الْجَزِيرَةِ الْعَرَبِيَّةِ", summary: "الصَّفَا وَالْمَرْوَةُ تَلَّانِ صَغِيرَانِ فِي مَكَّةَ، قُرْبَ الْكَعْبَةِ. وَفِي الْقِصَّةِ سَعَتْ هَاجَرُ بَيْنَهُمَا تَبْحَثُ عَنِ الْمَاءِ.", more: "وَفِي الْحَجِّ وَالْعُمْرَةِ يَسْعَى الْمُسْلِمُونَ بَيْنَهُمَا سَبْعَةَ أَشْوَاطٍ، وَيُسَمَّى ذَلِكَ السَّعْيَ." },
    },
    focus: medPoint(21.42, 39.83, CITY_ZOOM),
    picture: { folder: "abraham", name: "safa-and-marwa-ancient" },
    sources: ["TDV İslâm Ansiklopedisi: Safâ","TDV İslâm Ansiklopedisi: Sa'y"],
  }),
  defineEntity({
    id: "abraham-zamzam", kind: "landmark", tr: "Zemzem",
    aliases: { en: ["Zamzam"], ar: ["زمزم"] },
    copy: {
      en: { title: "Zamzam", kindLabel: "Well (spring)", periodLabel: "Mecca · Western Arabia", summary: "Zamzam is the water that came out of the ground in the valley of Mecca, near little Ishmael (pbuh). It still flows today, near the Ka’ba.", more: "Pilgrims drink Zamzam water, and many take some home with them." },
      ar: { title: "زَمْزَمُ", kindLabel: "بِئْرٌ (نَبْعٌ)", periodLabel: "مَكَّةُ · غَرْبُ الْجَزِيرَةِ الْعَرَبِيَّةِ", summary: "زَمْزَمُ مَاءٌ خَرَجَ مِنَ الْأَرْضِ فِي وَادِي مَكَّةَ، عِنْدَ الطِّفْلِ إِسْمَاعِيلَ عَلَيْهِ السَّلَامُ. وَمَا زَالَ يَتَدَفَّقُ إِلَى الْيَوْمِ قُرْبَ الْكَعْبَةِ.", more: "وَيَشْرَبُ الْحُجَّاجُ مِنْ مَاءِ زَمْزَمَ، وَيَأْخُذُ كَثِيرٌ مِنْهُمْ شَيْئًا مِنْهُ إِلَى بِلَادِهِمْ." },
    },
    focus: medPoint(21.42, 39.83, CITY_ZOOM),
    picture: { folder: "mecca", name: "zamzam" },
    sources: ["TDV İslâm Ansiklopedisi: Zemzem"],
  }),
  defineEntity({
    id: "abraham-kaaba-abraham", kind: "landmark", tr: "Kâbe",
    aliases: { en: ["Ka’ba","Ka’ba","House of Allah"], ar: ["الكعبة","بيت الله"] },
    copy: {
      en: { title: "The Ka’ba", kindLabel: "Holy building", periodLabel: "Mecca · Western Arabia", summary: "The Ka’ba, the House of Allah, is the holy building in Mecca. In the story, Abraham (pbuh) and Ishmael (pbuh) built it again on its old foundations.", more: "Muslims all over the world face the Ka’ba when they pray." },
      ar: { title: "الْكَعْبَةُ", kindLabel: "بَيْتٌ مُقَدَّسٌ", periodLabel: "مَكَّةُ · غَرْبُ الْجَزِيرَةِ الْعَرَبِيَّةِ", summary: "الْكَعْبَةُ هِيَ بَيْتُ اللهِ الْحَرَامُ فِي مَكَّةَ. وَفِي الْقِصَّةِ بَنَاهَا إِبْرَاهِيمُ وَإِسْمَاعِيلُ عَلَيْهِمَا السَّلَامُ مِنْ جَدِيدٍ عَلَى أُسُسِهَا الْقَدِيمَةِ.", more: "وَيَتَّجِهُ إِلَيْهَا الْمُسْلِمُونَ فِي كُلِّ الْعَالَمِ عِنْدَ الصَّلَاةِ؛ فَهِيَ قِبْلَتُهُمْ." },
    },
    focus: medPoint(21.42, 39.83, CITY_ZOOM),
    picture: { folder: "abraham", name: "kaaba-abraham" },
    sources: ["TDV İslâm Ansiklopedisi: Kâbe"],
  }),
  defineEntity({
    id: "abraham-nimrod", kind: "person", tr: "Nemrut",
    aliases: { en: ["Nimrod"], ar: ["نمرود"] },
    copy: {
      en: { title: "Nimrod", kindLabel: "King", periodLabel: "Kingdom of Babylon", summary: "In the story, Nimrod was the king of Babylon. He argued with Abraham (pbuh) about Allah, but he could not answer him.", more: "The Qur’an tells about this argument, but it does not give the king's name." },
      ar: { title: "نُمْرُودُ", kindLabel: "مَلِكٌ", periodLabel: "مَمْلَكَةُ بَابِلَ", summary: "فِي الْقِصَّةِ كَانَ نُمْرُودُ مَلِكَ بَابِلَ. وَقَدْ جَادَلَ إِبْرَاهِيمَ عَلَيْهِ السَّلَامُ فِي رَبِّهِ، فَلَمْ يَجِدْ جَوَابًا.", more: "وَيَذْكُرُ الْقُرْآنُ الْكَرِيمُ هَذَا الْجِدَالَ، وَلَكِنَّهُ لَا يَذْكُرُ اسْمَ الْمَلِكِ." },
    },
    focus: medPoint(32.54, 44.42, CITY_ZOOM),
    picture: { folder: "abraham", name: "nimrod" },
    sources: ["TDV İslâm Ansiklopedisi: Nemrûd"],
  }),
  defineEntity({
    id: "abraham-jurhum", kind: "tribe", tr: "Cürhüm kabilesi",
    aliases: { en: ["Jurham"], ar: ["جرهم"] },
    copy: {
      en: { title: "Jurham", kindLabel: "Arab tribe", periodLabel: "Yemen and Mecca", summary: "Jurham was an Arab tribe that came from Yemen, in southern Arabia, to the valley of Mecca. In the story, Ishmael (pbuh) grew up among them and learned Arabic from them.", more: "History books say that Jurham looked after the Ka’ba for a long time." },
      ar: { title: "جُرْهُمُ", kindLabel: "قَبِيلَةٌ عَرَبِيَّةٌ", periodLabel: "الْيَمَنُ وَمَكَّةُ", summary: "جُرْهُمُ قَبِيلَةٌ عَرَبِيَّةٌ جَاءَتْ مِنَ الْيَمَنِ، فِي جَنُوبِ الْجَزِيرَةِ الْعَرَبِيَّةِ، إِلَى وَادِي مَكَّةَ. وَفِي الْقِصَّةِ نَشَأَ إِسْمَاعِيلُ عَلَيْهِ السَّلَامُ بَيْنَهُمْ، وَتَعَلَّمَ مِنْهُمُ الْعَرَبِيَّةَ.", more: "وَتَذْكُرُ كُتُبُ التَّارِيخِ أَنَّ جُرْهُمَ تَوَلَّتْ أَمْرَ الْكَعْبَةِ زَمَنًا طَوِيلًا." },
    },
    focus: medFeature('yemen', 15.5, 47, 1, { arrows: [{ from: [15.4, 44.2], to: [21.42, 39.83] }] }),
    picture: { folder: "mecca", name: "jurhum" },
    sources: ["TDV İslâm Ansiklopedisi: Cürhüm"],
  }),
  defineEntity({
    id: "abraham-hanifs", kind: "people", tr: "Hanifler",
    aliases: { en: ["hanîfs"], ar: ["حنفاء"] },
    copy: {
      en: { title: "The hanîfs", kindLabel: "Believers in one God", periodLabel: "The Hijaz · before Islam", summary: "The hanîfs were a group of people in the Hijaz before Islam. They believed in one God and stayed away from idols.", more: "In the Qur’an, Abraham (pbuh) is called a hanîf." },
      ar: { title: "الْحُنَفَاءُ", kindLabel: "مُؤْمِنُونَ بِإِلَهٍ وَاحِدٍ", periodLabel: "الْحِجَازُ قَبْلَ الْإِسْلَامِ", summary: "الْحُنَفَاءُ جَمَاعَةٌ مِنَ النَّاسِ كَانُوا فِي الْحِجَازِ قَبْلَ الْإِسْلَامِ. وَكَانُوا يُؤْمِنُونَ بِاللهِ الْوَاحِدِ، وَيَبْتَعِدُونَ عَنِ الْأَصْنَامِ.", more: "وَيَصِفُ الْقُرْآنُ الْكَرِيمُ إِبْرَاهِيمَ عَلَيْهِ السَّلَامُ بِأَنَّهُ كَانَ حَنِيفًا." },
    },
    focus: medFeature('hijaz', 24.2, 39, 1),
    picture: { folder: "mecca", name: "hanifs" },
    sources: ["TDV İslâm Ansiklopedisi: Hanîf"],
  }),
  defineEntity({
    id: "abraham-waraqa-ibn-nawfal", kind: "person", tr: "Varaka b. Nevfel",
    aliases: { en: ["Waraqa ibn Nawfal","Waraqa"], ar: ["ورقة بن نوفل"] },
    copy: {
      en: { title: "Waraqa ibn Nawfal", kindLabel: "Hanîf", periodLabel: "Time of Prophet Muhammad (pbuh)", summary: "Waraqa ibn Nawfal was a cousin of Khadija, the wife of Prophet Muhammad (pbuh). He was one of the last hanîfs, and he welcomed the prophethood of Muhammad (pbuh).", more: "He knew the earlier holy books very well." },
      ar: { title: "وَرَقَةُ بْنُ نَوْفَلٍ", kindLabel: "حَنِيفٌ", periodLabel: "زَمَنُ النَّبِيِّ مُحَمَّدٍ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ", summary: "كَانَ وَرَقَةُ بْنُ نَوْفَلٍ ابْنَ عَمِّ خَدِيجَةَ زَوْجَةِ النَّبِيِّ مُحَمَّدٍ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ. وَكَانَ مِنْ آخِرِ الْحُنَفَاءِ، وَقَدْ رَحَّبَ بِنُبُوَّتِهِ.", more: "وَكَانَ عَالِمًا بِالْكُتُبِ السَّمَاوِيَّةِ السَّابِقَةِ." },
    },
    focus: medPoint(21.42, 39.83, CITY_ZOOM),
    picture: { folder: "abraham", name: "waraqa-ibn-nawfal" },
    sources: ["TDV İslâm Ansiklopedisi: Varaka b. Nevfel"],
  }),
];

export const ABRAHAM_SET: EntityBookSet = {
  entities,
  chapters: {
    'abraham-a2': {
      1: ["abraham-babylon","abraham-mesopotamia"],
      10: ["abraham-babylon","abraham-nimrod"],
      11: ["abraham-babylon","abraham-syria-ancient","abraham-palestine-ancient","abraham-safa-and-marwa-ancient"],
      13: ["abraham-mecca-valley-ancient","abraham-zamzam"],
      14: ["abraham-mecca-valley-ancient","abraham-kaaba-abraham"],
    },
    'abraham-b1': {
      1: ["abraham-babylon","abraham-mesopotamia"],
      2: ["abraham-babylon"],
      9: ["abraham-babylon","abraham-nimrod"],
      10: ["abraham-babylon","abraham-syria-ancient","abraham-palestine-ancient","abraham-safa-and-marwa-ancient"],
      11: ["abraham-mecca-valley-ancient","abraham-safa-and-marwa-ancient","abraham-kaaba-abraham"],
      12: ["abraham-mecca-valley-ancient","abraham-zamzam"],
      13: ["abraham-arabian-peninsula","abraham-kaaba-abraham"],
    },
    'abraham-b2': {
      3: ["abraham-damascus-pre-islamic","abraham-hijaz","abraham-hanifs","abraham-waraqa-ibn-nawfal"],
      4: ["abraham-babylon","abraham-ur","abraham-harran","abraham-mesopotamia","abraham-sumer","abraham-nimrod"],
      5: ["abraham-babylon","abraham-mesopotamia","abraham-nimrod"],
      6: ["abraham-babylon"],
      23: ["abraham-nimrod"],
      24: ["abraham-babylon"],
      25: ["abraham-palestine-ancient","abraham-egypt-ancient"],
      26: ["abraham-mecca-valley-ancient","abraham-arabian-peninsula","abraham-safa-and-marwa-ancient"],
      27: ["abraham-mecca-valley-ancient","abraham-kaaba-abraham"],
      28: ["abraham-mecca-valley-ancient","abraham-palestine-ancient","abraham-arabian-peninsula","abraham-kaaba-abraham"],
      29: ["abraham-safa-and-marwa-ancient"],
      30: ["abraham-mecca-valley-ancient","abraham-arabian-peninsula","abraham-yemen","abraham-zamzam","abraham-kaaba-abraham","abraham-jurhum"],
      31: ["abraham-mecca-valley-ancient","abraham-jurhum"],
      33: ["abraham-palestine-ancient","abraham-egypt-ancient","abraham-kaaba-abraham"],
      34: ["abraham-mecca-valley-ancient","abraham-kaaba-abraham"],
      35: ["abraham-mecca-valley-ancient","abraham-palestine-ancient","abraham-hijaz","abraham-kaaba-abraham"],
    },
  },
};
