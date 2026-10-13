import { defineEntity } from './define';
import { medFeature, medPoint } from '../mediterraneanMap';
import type { EntityBookSet } from './index';

// Places & People cards for the moses books (A2, B1, B2), English and Arabic.
// Generated from the reviewed card list; the chapters are where each level's story
// names the place. Sources are TDV İslâm Ansiklopedisi article titles.

const CITY_ZOOM = 1.8;

const entities = [
  defineEntity({
    id: "moses-jerusalem-ancient", kind: "city", tr: "Kudüs",
    aliases: { en: ["Jerusalem"], ar: ["القدس","بيت المقدس"] },
    copy: {
      en: { title: "Jerusalem", kindLabel: "City", periodLabel: "Canaan · Palestine", summary: "Jerusalem is an old city in the hills of Palestine. In the Pharaoh’s dream, a fire came from Jerusalem.", more: "It is a holy city for Muslims, Christians and Jews." },
      ar: { title: "الْقُدْسُ", kindLabel: "مَدِينَةٌ", periodLabel: "أَرْضُ كَنْعَانَ · فِلَسْطِينُ", summary: "الْقُدْسُ، أَوْ بَيْتُ الْمَقْدِسِ، مَدِينَةٌ قَدِيمَةٌ فِي جِبَالِ فِلَسْطِينَ. وَفِي رُؤْيَا فِرْعَوْنَ جَاءَتْ نَارٌ مِنَ الْقُدْسِ.", more: "وَهِيَ مَدِينَةٌ مُقَدَّسَةٌ عِنْدَ الْمُسْلِمِينَ وَالْمَسِيحِيِّينَ وَالْيَهُودِ." },
    },
    focus: medPoint(31.78, 35.24, CITY_ZOOM),
    picture: { folder: "moses", name: "jerusalem-ancient" },
    sources: ["TDV İslâm Ansiklopedisi: Kudüs"],
  }),
  defineEntity({
    id: "moses-pi-ramesses", kind: "city", tr: "Pi-Ramses",
    aliases: { en: ["new capital city of Ramses"], ar: ["العاصمة الجديدة لرمسيس"] },
    copy: {
      en: { title: "Pi-Ramesses", kindLabel: "Royal city", periodLabel: "Ancient Egypt · Nile Delta", summary: "Pi-Ramesses was the new capital city of Ramses II, in the Nile Delta. In the story, the Children of Israel were forced to work on it.", more: "Its name means “House of Ramses”." },
      ar: { title: "بِي رَمْسِيس", kindLabel: "مَدِينَةٌ مَلَكِيَّةٌ", periodLabel: "مِصْرُ الْقَدِيمَةُ · دَلْتَا النِّيلِ", summary: "بِي رَمْسِيس هِيَ الْعَاصِمَةُ الْجَدِيدَةُ الَّتِي بَنَاهَا رَمْسِيسُ الثَّانِي فِي دَلْتَا النِّيلِ. وَفِي الْقِصَّةِ أُجْبِرَ بَنُو إِسْرَائِيلَ عَلَى الْعَمَلِ فِي بِنَائِهَا.", more: "وَمَعْنَى اسْمِهَا «بَيْتُ رَمْسِيسَ»." },
    },
    focus: medPoint(30.8, 31.83, CITY_ZOOM),
    picture: { folder: "moses", name: "pi-ramesses" },
    sources: ["TDV İslâm Ansiklopedisi: Firavun","TDV İslâm Ansiklopedisi: Mûsâ"],
  }),
  defineEntity({
    id: "moses-egypt-ancient", kind: "country", tr: "Mısır",
    aliases: { en: ["Egypt"], ar: ["مصر"] },
    copy: {
      en: { title: "Egypt", kindLabel: "Land", periodLabel: "Ancient Egypt", summary: "Egypt is a land in the north-east of Africa, along the River Nile. In the time of Moses (pbuh), the Pharaoh ruled it.", more: "The pyramids of Giza were already very old in the time of Moses (pbuh)." },
      ar: { title: "مِصْرُ", kindLabel: "بَلَدٌ", periodLabel: "مِصْرُ الْقَدِيمَةُ", summary: "مِصْرُ بَلَدٌ فِي شَمَالِ شَرْقِ إِفْرِيقِيَا، عَلَى ضِفَافِ نَهْرِ النِّيلِ. وَفِي زَمَنِ مُوسَى عَلَيْهِ السَّلَامُ كَانَ فِرْعَوْنُ يَحْكُمُهَا.", more: "وَكَانَتْ أَهْرَامُ الْجِيزَةِ قَدِيمَةً جِدًّا فِي زَمَنِ مُوسَى عَلَيْهِ السَّلَامُ." },
    },
    focus: medFeature('egypt', 26.5, 30.5, 1),
    picture: { folder: "abraham", name: "egypt-ancient" },
    sources: ["TDV İslâm Ansiklopedisi: Mısır"],
  }),
  defineEntity({
    id: "moses-nile-delta", kind: "region", tr: "Nil Deltası",
    aliases: { en: ["Nile Delta","delta"], ar: ["دلتا النيل","الدلتا"] },
    copy: {
      en: { title: "Nile Delta", kindLabel: "Region", periodLabel: "Northern Egypt", summary: "The Nile Delta is the wide, green land in the north of Egypt, where the Nile splits into branches and reaches the sea. In the time of Seti I and Ramses II, many canals were dug here for farming.", more: "It is one of the richest farming lands in the world." },
      ar: { title: "دَلْتَا النِّيلِ", kindLabel: "مِنْطَقَةٌ", periodLabel: "شَمَالُ مِصْرَ", summary: "دَلْتَا النِّيلِ أَرْضٌ وَاسِعَةٌ خَضْرَاءُ فِي شَمَالِ مِصْرَ، يَتَفَرَّعُ فِيهَا النِّيلُ ثُمَّ يَصُبُّ فِي الْبَحْرِ. وَفِي عَهْدَيْ سِيتِي الْأَوَّلِ وَرَمْسِيسَ الثَّانِي حُفِرَتْ فِيهَا قَنَوَاتٌ كَثِيرَةٌ لِلزِّرَاعَةِ.", more: "وَهِيَ مِنْ أَخْصَبِ الْأَرَاضِي الزِّرَاعِيَّةِ فِي الْعَالَمِ." },
    },
    focus: medFeature('nile-delta', 30.9, 31.1, 1),
    picture: { folder: "moses", name: "nile-delta" },
    sources: ["TDV İslâm Ansiklopedisi: Nil"],
  }),
  defineEntity({
    id: "moses-midian", kind: "region", tr: "Medyen",
    aliases: { en: ["Midian"], ar: ["إلى مدين","في مدين","أرض مدين","أهل مدين","كانت مدين","خارج مدين","أي مدين","موسى مدين"] },
    copy: {
      en: { title: "Midian", kindLabel: "Land", periodLabel: "East of the Gulf of Aqaba", summary: "Midian was a land on the east side of the Gulf of Aqaba, between Egypt and Syria. Moses (pbuh) lived here for ten years with the family of Prophet Shu’ayb (pbuh).", more: "Today, this area is in the north-west of Saudi Arabia." },
      ar: { title: "مَدْيَنُ", kindLabel: "أَرْضٌ", periodLabel: "شَرْقَ خَلِيجِ الْعَقَبَةِ", summary: "مَدْيَنُ أَرْضٌ تَقَعُ شَرْقَ خَلِيجِ الْعَقَبَةِ، بَيْنَ مِصْرَ وَالشَّامِ. عَاشَ فِيهَا مُوسَى عَلَيْهِ السَّلَامُ عَشْرَ سَنَوَاتٍ مَعَ أُسْرَةِ النَّبِيِّ شُعَيْبٍ عَلَيْهِ السَّلَامُ.", more: "وَتَقَعُ هَذِهِ الْمِنْطَقَةُ الْيَوْمَ فِي شَمَالِ غَرْبِ الْمَمْلَكَةِ الْعَرَبِيَّةِ السُّعُودِيَّةِ." },
    },
    focus: medFeature('midian', 28.4, 35.6, 1),
    picture: { folder: "moses", name: "midian" },
    sources: ["TDV İslâm Ansiklopedisi: Medyen"],
  }),
  defineEntity({
    id: "moses-syria-ancient", kind: "region", tr: "Suriye",
    aliases: { en: ["Syria"], ar: ["الشام"] },
    copy: {
      en: { title: "Syria", kindLabel: "Historical land", periodLabel: "East of the Mediterranean", summary: "In old times, Syria (al-Sham) was a large land north-east of Egypt, on the east coast of the Mediterranean Sea. The story places Midian between Egypt and Syria.", more: "Damascus and Aleppo are among its oldest cities." },
      ar: { title: "الشَّامُ", kindLabel: "إِقْلِيمٌ تَارِيخِيٌّ", periodLabel: "شَرْقَ الْبَحْرِ الْمُتَوَسِّطِ", summary: "الشَّامُ أَرْضٌ وَاسِعَةٌ تَقَعُ شَمَالَ شَرْقِ مِصْرَ، عَلَى السَّاحِلِ الشَّرْقِيِّ لِلْبَحْرِ الْمُتَوَسِّطِ. وَتَذْكُرُ الْقِصَّةُ أَنَّ مَدْيَنَ بَيْنَ مِصْرَ وَالشَّامِ.", more: "وَمِنْ أَقْدَمِ مُدُنِهَا دِمَشْقُ وَحَلَبُ." },
    },
    focus: medFeature('syria', 34.8, 37.5, 1),
    picture: { folder: "abraham", name: "syria-ancient" },
    sources: ["TDV İslâm Ansiklopedisi: Suriye"],
  }),
  defineEntity({
    id: "moses-sinai", kind: "region", tr: "Sina",
    aliases: { en: ["across the Sinai"], ar: ["عبر سيناء"] },
    copy: {
      en: { title: "Sinai", kindLabel: "Peninsula", periodLabel: "Between Africa and Asia", summary: "The Sinai is a dry land of deserts and high mountains between Egypt and Midian. Moses (pbuh) crossed it with his family on his way back from Midian.", more: "It is shaped like a triangle between two arms of the Red Sea." },
      ar: { title: "سَيْنَاءُ", kindLabel: "شِبْهُ جَزِيرَةٍ", periodLabel: "بَيْنَ إِفْرِيقِيَا وَآسِيَا", summary: "سَيْنَاءُ أَرْضٌ جَافَّةٌ مِنَ الصَّحَارِي وَالْجِبَالِ الْعَالِيَةِ، تَقَعُ بَيْنَ مِصْرَ وَمَدْيَنَ. عَبَرَهَا مُوسَى عَلَيْهِ السَّلَامُ مَعَ أَهْلِهِ فِي طَرِيقِ عَوْدَتِهِ مِنْ مَدْيَنَ.", more: "وَشَكْلُهَا يُشْبِهُ الْمُثَلَّثَ بَيْنَ ذِرَاعَيْنِ مِنَ الْبَحْرِ الْأَحْمَرِ." },
    },
    focus: medFeature('sinai', 29.6, 33.8, 1),
    picture: { folder: "moses", name: "sinai" },
    sources: ["TDV İslâm Ansiklopedisi: Sînâ"],
  }),
  defineEntity({
    id: "moses-mount-sinai", kind: "region", tr: "Tur Dağı",
    aliases: { en: ["Mount Sinai","Mount Tur","climbed the mountain"], ar: ["جبل سيناء","جبل الطور","الجبل"] },
    copy: {
      en: { title: "Mount Sinai (Mount Tur)", kindLabel: "Mountain", periodLabel: "Sinai", summary: "Mount Sinai, also called Mount Tur, is a high mountain in the Sinai. Here, on a cold winter night, Allah spoke to Moses (pbuh) and made him a prophet.", more: "Many people believe it is Jabal Musa, a peak in the south of Sinai." },
      ar: { title: "جَبَلُ الطُّورِ (جَبَلُ سَيْنَاءَ)", kindLabel: "جَبَلٌ", periodLabel: "سَيْنَاءُ", summary: "جَبَلُ الطُّورِ، وَيُسَمَّى أَيْضًا جَبَلَ سَيْنَاءَ، جَبَلٌ عَالٍ فِي سَيْنَاءَ. وَهُنَا، فِي لَيْلَةٍ شَتْوِيَّةٍ بَارِدَةٍ، كَلَّمَ اللهُ مُوسَى عَلَيْهِ السَّلَامُ وَاخْتَارَهُ نَبِيًّا.", more: "وَيَرَى كَثِيرٌ مِنَ النَّاسِ أَنَّهُ «جَبَلُ مُوسَى» فِي جَنُوبِ سَيْنَاءَ." },
    },
    focus: medPoint(28.54, 33.98, CITY_ZOOM),
    picture: { folder: "moses", name: "mount-sinai" },
    sources: ["TDV İslâm Ansiklopedisi: Tûr"],
  }),
  defineEntity({
    id: "moses-valley-of-tuwa", kind: "region", tr: "Tuva vadisi",
    aliases: { en: ["Tuwa","valley between mountains"], ar: ["طوى","واد بين الجبال","واديا بين الجبال"] },
    copy: {
      en: { title: "Tuwa, the sacred valley", kindLabel: "Valley", periodLabel: "Sinai", summary: "Tuwa is a sacred valley at Mount Sinai (Mount Tur). This is where Allah first spoke to Moses (pbuh).", more: "The Qur’an names this valley in Surah Taha." },
      ar: { title: "وَادِي طُوًى", kindLabel: "وَادٍ", periodLabel: "سَيْنَاءُ", summary: "طُوًى وَادٍ مُقَدَّسٌ عِنْدَ جَبَلِ الطُّورِ. وَفِيهِ كَلَّمَ اللهُ مُوسَى عَلَيْهِ السَّلَامُ أَوَّلَ مَرَّةٍ.", more: "وَقَدْ ذَكَرَ الْقُرْآنُ الْكَرِيمُ هَذَا الْوَادِيَ بِاسْمِهِ فِي سُورَةِ طٰهٰ." },
    },
    focus: medPoint(28.56, 33.98, CITY_ZOOM),
    picture: { folder: "moses", name: "valley-of-tuwa" },
    sources: ["TDV İslâm Ansiklopedisi: Tuvâ"],
  }),
  defineEntity({
    id: "moses-canaan", kind: "region", tr: "Kenan diyarı",
    aliases: { en: ["Canaan","land of Palestine"], ar: ["كنعان","أرض فلسطين"] },
    copy: {
      en: { title: "Canaan", kindLabel: "Historical land", periodLabel: "Palestine", summary: "Canaan is the old name of the land of Palestine. After leaving Egypt, Moses (pbuh) led the Children of Israel toward this land.", more: "Prophet Abraham (pbuh), Isaac (pbuh) and Jacob (pbuh) lived in this land." },
      ar: { title: "أَرْضُ كَنْعَانَ", kindLabel: "أَرْضٌ تَارِيخِيَّةٌ", periodLabel: "فِلَسْطِينُ", summary: "كَنْعَانُ هُوَ الِاسْمُ الْقَدِيمُ لِأَرْضِ فِلَسْطِينَ. وَبَعْدَ الْخُرُوجِ مِنْ مِصْرَ، قَادَ مُوسَى عَلَيْهِ السَّلَامُ بَنِي إِسْرَائِيلَ نَحْوَ هَذِهِ الْأَرْضِ.", more: "وَقَدْ عَاشَ فِي هَذِهِ الْأَرْضِ إِبْرَاهِيمُ وَإِسْحَاقُ وَيَعْقُوبُ عَلَيْهِمُ السَّلَامُ." },
    },
    focus: medFeature('palestine', 31.5, 35, 1),
    picture: { folder: "moses", name: "canaan" },
    sources: ["TDV İslâm Ansiklopedisi: Ken‘ân","TDV İslâm Ansiklopedisi: Filistin"],
  }),
  defineEntity({
    id: "moses-nile", kind: "river", tr: "Nil Nehri",
    aliases: { en: ["Nile"], ar: ["النيل"] },
    copy: {
      en: { title: "The River Nile", kindLabel: "River", periodLabel: "Egypt", summary: "The Nile is the great river of Egypt. Baby Moses (pbuh) was put on its water, and it carried him near the Pharaoh’s palace.", more: "It is one of the longest rivers in the world." },
      ar: { title: "نَهْرُ النِّيلِ", kindLabel: "نَهْرٌ", periodLabel: "مِصْرُ", summary: "النِّيلُ هُوَ النَّهْرُ الْعَظِيمُ فِي مِصْرَ. وَضَعَتْ أُمُّ مُوسَى عَلَيْهِ السَّلَامُ طِفْلَهَا فِي مَائِهِ، فَحَمَلَهُ إِلَى قُرْبِ قَصْرِ فِرْعَوْنَ.", more: "وَهُوَ مِنْ أَطْوَلِ أَنْهَارِ الْعَالَمِ." },
    },
    focus: medFeature('nile', 26, 32.7, 1),
    picture: { folder: "andalus", name: "nile" },
    sources: ["TDV İslâm Ansiklopedisi: Nil"],
  }),
  defineEntity({
    id: "moses-red-sea", kind: "sea", tr: "Kızıldeniz",
    aliases: { en: ["Red Sea","arrived at the sea"], ar: ["البحر الأحمر","وصلوا إلى البحر"] },
    copy: {
      en: { title: "The Red Sea", kindLabel: "Sea", periodLabel: "Between Africa and Arabia", summary: "The Red Sea is a long sea between Africa and Arabia. Allah opened a road in the sea for Moses (pbuh) and his people, and the Pharaoh’s army drowned in it.", more: "In the north, it splits into two gulfs: The Gulf of Suez and the Gulf of Aqaba." },
      ar: { title: "الْبَحْرُ الْأَحْمَرُ", kindLabel: "بَحْرٌ", periodLabel: "بَيْنَ إِفْرِيقِيَا وَجَزِيرَةِ الْعَرَبِ", summary: "الْبَحْرُ الْأَحْمَرُ بَحْرٌ طَوِيلٌ بَيْنَ إِفْرِيقِيَا وَجَزِيرَةِ الْعَرَبِ. شَقَّهُ اللهُ لِمُوسَى عَلَيْهِ السَّلَامُ وَقَوْمِهِ فَعَبَرُوا، وَغَرِقَ فِيهِ فِرْعَوْنُ وَجَيْشُهُ.", more: "وَيَنْقَسِمُ فِي شَمَالِهِ إِلَى خَلِيجَيْنِ: خَلِيجِ السُّوَيْسِ وَخَلِيجِ الْعَقَبَةِ." },
    },
    focus: medFeature('red-sea', 22, 38, 1),
    picture: { folder: "andalus", name: "red-sea" },
    sources: ["TDV İslâm Ansiklopedisi: Kızıldeniz"],
  }),
  defineEntity({
    id: "moses-gulf-of-aqaba", kind: "sea", tr: "Akabe Körfezi",
    aliases: { en: ["Gulf of Aqaba"], ar: ["خليج العقبة"] },
    copy: {
      en: { title: "Gulf of Aqaba", kindLabel: "Gulf", periodLabel: "Red Sea", summary: "The Gulf of Aqaba is the long, narrow north-eastern arm of the Red Sea. The land of Midian was on its eastern side.", more: "Today, the port city of Aqaba is at its northern end." },
      ar: { title: "خَلِيجُ الْعَقَبَةِ", kindLabel: "خَلِيجٌ", periodLabel: "الْبَحْرُ الْأَحْمَرُ", summary: "خَلِيجُ الْعَقَبَةِ ذِرَاعٌ طَوِيلَةٌ ضَيِّقَةٌ مِنَ الْبَحْرِ الْأَحْمَرِ فِي شَمَالِهِ الشَّرْقِيِّ. وَكَانَتْ أَرْضُ مَدْيَنَ عَلَى جَانِبِهِ الشَّرْقِيِّ.", more: "وَتَقَعُ مَدِينَةُ الْعَقَبَةِ الْيَوْمَ عِنْدَ طَرَفِهِ الشَّمَالِيِّ." },
    },
    focus: medFeature('gulf-of-aqaba', 28.7, 34.8, 1),
    picture: { folder: "moses", name: "gulf-of-aqaba" },
    sources: ["TDV İslâm Ansiklopedisi: Akabe"],
  }),
  defineEntity({
    id: "moses-pharaohs-palace", kind: "landmark", tr: "Firavun'un sarayı",
    aliases: { en: ["king’s palace","Pharaoh’s palace","palace"], ar: ["قصر فرعون","القصر"] },
    copy: {
      en: { title: "The Pharaoh’s palace", kindLabel: "Palace", periodLabel: "Ancient Egypt", summary: "The Pharaoh’s palace was near the River Nile. Baby Moses (pbuh) was found near it, and he grew up inside it.", more: "No one knows today exactly where this palace was." },
      ar: { title: "قَصْرُ فِرْعَوْنَ", kindLabel: "قَصْرٌ", periodLabel: "مِصْرُ الْقَدِيمَةُ", summary: "كَانَ قَصْرُ فِرْعَوْنَ قَرِيبًا مِنْ نَهْرِ النِّيلِ. وُجِدَ مُوسَى الرَّضِيعُ عَلَيْهِ السَّلَامُ بِالْقُرْبِ مِنْهُ، وَنَشَأَ فِيهِ.", more: "وَلَا يَعْرِفُ أَحَدٌ الْيَوْمَ مَكَانَهُ بِالضَّبْطِ." },
    },
    focus: medPoint(30.8, 31.83, CITY_ZOOM),
    picture: { folder: "moses", name: "pharaohs-palace" },
    sources: ["TDV İslâm Ansiklopedisi: Firavun"],
  }),
  defineEntity({
    id: "moses-pharaoh", kind: "person", tr: "Firavun",
    aliases: { en: ["Pharaoh"], ar: ["فرعون"] },
    copy: {
      en: { title: "Pharaoh", kindLabel: "King of Egypt", periodLabel: "Time of Moses (pbuh)", summary: "Pharaoh was the cruel king of Egypt in the time of Moses (pbuh). He thought he was a god, and in the end he drowned in the sea with his army.", more: "“Pharaoh” was the title of the kings of ancient Egypt." },
      ar: { title: "فِرْعَوْنُ", kindLabel: "مَلِكُ مِصْرَ", periodLabel: "زَمَنُ مُوسَى عَلَيْهِ السَّلَامُ", summary: "فِرْعَوْنُ هُوَ مَلِكُ مِصْرَ الظَّالِمُ فِي زَمَنِ مُوسَى عَلَيْهِ السَّلَامُ. كَانَ يَظُنُّ أَنَّهُ إِلٰهٌ، وَفِي النِّهَايَةِ غَرِقَ فِي الْبَحْرِ مَعَ جَيْشِهِ.", more: "وَ«فِرْعَوْنُ» لَقَبٌ كَانَ يُطْلَقُ عَلَى مُلُوكِ مِصْرَ الْقَدِيمَةِ." },
    },
    focus: medFeature('egypt', 26.5, 30.5, 1),
    picture: { folder: "moses", name: "pharaoh" },
    sources: ["TDV İslâm Ansiklopedisi: Firavun"],
  }),
  defineEntity({
    id: "moses-children-of-israel", kind: "people", tr: "İsrailoğulları",
    aliases: { en: ["Children of Israel","Israelites","Israelite"], ar: ["بني إسرائيل","بنو إسرائيل","الإسرائيليين"] },
    copy: {
      en: { title: "The Children of Israel", kindLabel: "People", periodLabel: "Egypt · Time of Moses (pbuh)", summary: "The Children of Israel (the Israelites) were the descendants of Prophet Jacob (pbuh). They lived in Egypt, and the Pharaoh forced them to do hard work.", more: "“Israel” is another name of Prophet Jacob (pbuh)." },
      ar: { title: "بَنُو إِسْرَائِيلَ", kindLabel: "قَوْمٌ", periodLabel: "مِصْرُ · زَمَنُ مُوسَى عَلَيْهِ السَّلَامُ", summary: "بَنُو إِسْرَائِيلَ هُمْ أَحْفَادُ النَّبِيِّ يَعْقُوبَ عَلَيْهِ السَّلَامُ. عَاشُوا فِي مِصْرَ، وَأَجْبَرَهُمْ فِرْعَوْنُ عَلَى الْأَعْمَالِ الشَّاقَّةِ.", more: "وَ«إِسْرَائِيلُ» اسْمٌ آخَرُ لِلنَّبِيِّ يَعْقُوبَ عَلَيْهِ السَّلَامُ." },
    },
    focus: medFeature('egypt', 30.6, 31.4, 1),
    picture: { folder: "moses", name: "children-of-israel" },
    sources: ["TDV İslâm Ansiklopedisi: Benî İsrâil"],
  }),
  defineEntity({
    id: "moses-ancient-egyptians", kind: "people", tr: "Kıptîler",
    aliases: { en: ["Egyptians","Egyptian","Copts"], ar: ["المصريين","المصريون","المصري","مصريا","القبط"] },
    copy: {
      en: { title: "The Egyptians (Copts)", kindLabel: "People", periodLabel: "Ancient Egypt", summary: "The Egyptians were the local people of ancient Egypt. They are also called Copts.", more: "Most of them lived in villages along the River Nile and worked as farmers." },
      ar: { title: "الْمِصْرِيُّونَ (الْقِبْطُ)", kindLabel: "شَعْبٌ", periodLabel: "مِصْرُ الْقَدِيمَةُ", summary: "الْمِصْرِيُّونَ هُمْ أَهْلُ مِصْرَ الْقَدِيمَةِ، وَيُسَمَّوْنَ أَيْضًا الْقِبْطَ.", more: "وَكَانَ أَكْثَرُهُمْ يَعِيشُونَ فِي قُرًى عَلَى ضِفَافِ النِّيلِ، وَيَعْمَلُونَ فِي الزِّرَاعَةِ." },
    },
    focus: medFeature('egypt', 26.5, 30.5, 1),
    picture: { folder: "moses", name: "ancient-egyptians" },
    sources: ["TDV İslâm Ansiklopedisi: Kıptîler","TDV İslâm Ansiklopedisi: Mısır"],
  }),
  defineEntity({
    id: "moses-pharaohs-magicians", kind: "people", tr: "Firavun'un sihirbazları",
    aliases: { en: ["magicians"], ar: ["سحرة","سحرته","سحرتي"] },
    copy: {
      en: { title: "The Pharaoh’s magicians", kindLabel: "Group of people", periodLabel: "Ancient Egypt", summary: "The magicians worked for the Pharaoh. When the staff of Moses (pbuh) swallowed what they had made, they bowed down to Allah and believed.", more: "In ancient Egypt, magicians were also important scholars at the king’s court." },
      ar: { title: "سَحَرَةُ فِرْعَوْنَ", kindLabel: "جَمَاعَةٌ مِنَ النَّاسِ", periodLabel: "مِصْرُ الْقَدِيمَةُ", summary: "كَانَ السَّحَرَةُ يَعْمَلُونَ عِنْدَ فِرْعَوْنَ. وَلَمَّا ابْتَلَعَتْ عَصَا مُوسَى عَلَيْهِ السَّلَامُ مَا صَنَعُوا، سَجَدُوا لِلهِ وَآمَنُوا.", more: "وَكَانَ السَّحَرَةُ فِي مِصْرَ الْقَدِيمَةِ مِنْ كِبَارِ الْعُلَمَاءِ فِي بَلَاطِ الْمَلِكِ." },
    },
    focus: medFeature('egypt', 26.5, 30.5, 1),
    picture: { folder: "moses", name: "pharaohs-magicians" },
    sources: ["TDV İslâm Ansiklopedisi: Sihir","TDV İslâm Ansiklopedisi: Mûsâ"],
  }),
  defineEntity({
    id: "moses-seti-i", kind: "person", tr: "I. Seti",
    aliases: { en: ["Seti I"], ar: ["سيتي الأول"] },
    copy: {
      en: { title: "Seti I", kindLabel: "King of Egypt", periodLabel: "c. 1290–1279 BC", summary: "Seti I was a king (pharaoh) of ancient Egypt and the father of Ramses II. Some sources say he was the Pharaoh who made the Children of Israel suffer.", more: "He built a great temple at Abydos, in southern Egypt." },
      ar: { title: "سِيتِي الْأَوَّلُ", kindLabel: "مَلِكُ مِصْرَ", periodLabel: "نَحْوَ 1290–1279 قَبْلَ الْمِيلَادِ", summary: "سِيتِي الْأَوَّلُ أَحَدُ فَرَاعِنَةِ مِصْرَ الْقَدِيمَةِ، وَهُوَ وَالِدُ رَمْسِيسَ الثَّانِي. وَتَذْكُرُ بَعْضُ الْمَصَادِرِ أَنَّهُ الْفِرْعَوْنُ الَّذِي اضْطَهَدَ بَنِي إِسْرَائِيلَ.", more: "وَقَدْ بَنَى مَعْبَدًا عَظِيمًا فِي أَبِيدُوس، فِي جَنُوبِ مِصْرَ." },
    },
    focus: medFeature('egypt', 26.5, 30.5, 1, { pins: [{ at: [26.18, 31.92], label: 'Abydos', labelAr: 'أَبِيدُوس' }] }),
    picture: { folder: "moses", name: "seti-i" },
    sources: ["TDV İslâm Ansiklopedisi: Firavun"],
  }),
  defineEntity({
    id: "moses-ramses-ii", kind: "person", tr: "II. Ramses",
    aliases: { en: ["Ramses II"], ar: ["رمسيس الثاني"] },
    copy: {
      en: { title: "Ramses II", kindLabel: "King of Egypt", periodLabel: "c. 1279–1213 BC", summary: "Ramses II was a famous king (pharaoh) of ancient Egypt and the son of Seti I. Many historians think the Children of Israel left Egypt in his time.", more: "He ruled for a very long time and built many great temples." },
      ar: { title: "رَمْسِيسُ الثَّانِي", kindLabel: "مَلِكُ مِصْرَ", periodLabel: "نَحْوَ 1279–1213 قَبْلَ الْمِيلَادِ", summary: "رَمْسِيسُ الثَّانِي مِنْ أَشْهَرِ فَرَاعِنَةِ مِصْرَ الْقَدِيمَةِ، وَهُوَ ابْنُ سِيتِي الْأَوَّلِ. وَيَرَى كَثِيرٌ مِنَ الْمُؤَرِّخِينَ أَنَّ بَنِي إِسْرَائِيلَ خَرَجُوا مِنْ مِصْرَ فِي عَهْدِهِ.", more: "حَكَمَ مُدَّةً طَوِيلَةً جِدًّا، وَبَنَى مَعَابِدَ عَظِيمَةً كَثِيرَةً." },
    },
    focus: medPoint(30.8, 31.83, CITY_ZOOM),
    picture: { folder: "moses", name: "ramses-ii" },
    sources: ["TDV İslâm Ansiklopedisi: Firavun"],
  }),
  defineEntity({
    id: "moses-herodotus", kind: "person", tr: "Herodot",
    aliases: { en: ["Herodotus"], ar: ["هيرودوت"] },
    copy: {
      en: { title: "Herodotus", kindLabel: "Historian", periodLabel: "Ancient Greece", summary: "Herodotus was a famous Greek historian. He wrote that “Egypt is the gift of the Nile.”", more: "He is often called “the Father of History”." },
      ar: { title: "هِيرُودُوت", kindLabel: "مُؤَرِّخٌ", periodLabel: "الْيُونَانُ الْقَدِيمَةُ", summary: "هِيرُودُوت مُؤَرِّخٌ يُونَانِيٌّ مَشْهُورٌ. وَقَدْ قَالَ: «مِصْرُ هِيَ هِبَةُ النِّيلِ».", more: "وَكَثِيرًا مَا يُلَقَّبُ بِـ«أَبِي التَّارِيخِ»." },
    },
    focus: medPoint(37.04, 27.43, CITY_ZOOM),
    picture: { folder: "moses", name: "herodotus" },
    sources: ["TDV İslâm Ansiklopedisi: Herodotos"],
  }),
];

export const MOSES_SET: EntityBookSet = {
  entities,
  chapters: {
    'moses-a2': {
      1: ["moses-egypt-ancient","moses-pharaoh","moses-children-of-israel","moses-ancient-egyptians"],
      2: ["moses-jerusalem-ancient","moses-egypt-ancient","moses-pharaoh","moses-children-of-israel","moses-ancient-egyptians","moses-pharaohs-magicians"],
      3: ["moses-nile"],
      4: ["moses-pharaohs-palace","moses-pharaoh"],
      5: ["moses-egypt-ancient","moses-pharaohs-palace","moses-pharaoh","moses-children-of-israel","moses-ancient-egyptians"],
      6: ["moses-egypt-ancient","moses-pharaoh","moses-children-of-israel","moses-ancient-egyptians"],
      7: ["moses-egypt-ancient","moses-midian","moses-pharaoh","moses-ancient-egyptians"],
      9: ["moses-egypt-ancient","moses-midian"],
      10: ["moses-egypt-ancient","moses-mount-sinai","moses-valley-of-tuwa"],
      11: ["moses-egypt-ancient","moses-pharaohs-palace","moses-pharaoh"],
      12: ["moses-pharaoh","moses-pharaohs-magicians"],
      13: ["moses-pharaohs-palace","moses-pharaoh","moses-pharaohs-magicians"],
      14: ["moses-egypt-ancient","moses-red-sea","moses-pharaoh"],
      15: ["moses-pharaoh"],
      16: ["moses-pharaoh"],
    },
    'moses-b1': {
      1: ["moses-egypt-ancient","moses-pharaoh","moses-children-of-israel","moses-ancient-egyptians"],
      2: ["moses-jerusalem-ancient","moses-egypt-ancient","moses-pharaoh","moses-children-of-israel","moses-ancient-egyptians","moses-pharaohs-magicians"],
      3: ["moses-nile","moses-pharaohs-palace","moses-pharaoh"],
      4: ["moses-pharaohs-palace","moses-pharaoh","moses-children-of-israel"],
      5: ["moses-egypt-ancient","moses-children-of-israel","moses-ancient-egyptians"],
      6: ["moses-egypt-ancient","moses-midian","moses-syria-ancient","moses-pharaoh","moses-ancient-egyptians"],
      7: ["moses-midian","moses-gulf-of-aqaba"],
      8: ["moses-egypt-ancient","moses-midian","moses-mount-sinai","moses-valley-of-tuwa"],
      9: ["moses-egypt-ancient","moses-mount-sinai","moses-pharaoh"],
      10: ["moses-pharaohs-palace","moses-pharaoh"],
      11: ["moses-pharaohs-palace","moses-pharaoh","moses-pharaohs-magicians"],
      12: ["moses-egypt-ancient","moses-red-sea","moses-pharaoh"],
      13: ["moses-red-sea","moses-pharaoh"],
    },
    'moses-b2': {
      1: ["moses-egypt-ancient","moses-midian","moses-red-sea","moses-pharaohs-palace","moses-pharaoh","moses-children-of-israel","moses-ancient-egyptians"],
      2: ["moses-pi-ramesses","moses-egypt-ancient","moses-pharaoh","moses-children-of-israel","moses-seti-i","moses-ramses-ii"],
      3: ["moses-egypt-ancient","moses-nile-delta","moses-nile","moses-pharaoh","moses-seti-i","moses-ramses-ii","moses-herodotus"],
      4: ["moses-egypt-ancient","moses-nile","moses-red-sea","moses-pharaohs-palace","moses-pharaoh","moses-children-of-israel","moses-ancient-egyptians"],
      5: ["moses-jerusalem-ancient","moses-egypt-ancient","moses-pharaoh","moses-children-of-israel","moses-ancient-egyptians","moses-pharaohs-magicians"],
      6: ["moses-nile","moses-pharaoh","moses-children-of-israel"],
      7: ["moses-nile","moses-pharaohs-palace","moses-pharaoh"],
      8: ["moses-egypt-ancient","moses-midian","moses-pharaohs-palace","moses-pharaoh","moses-children-of-israel","moses-ancient-egyptians"],
      9: ["moses-egypt-ancient","moses-pharaohs-palace","moses-pharaoh","moses-children-of-israel","moses-ancient-egyptians"],
      10: ["moses-midian"],
      11: ["moses-egypt-ancient","moses-midian","moses-syria-ancient","moses-pharaohs-palace","moses-pharaoh"],
      12: ["moses-midian"],
      13: ["moses-egypt-ancient","moses-midian","moses-gulf-of-aqaba"],
      14: ["moses-egypt-ancient","moses-midian","moses-sinai","moses-ramses-ii"],
      15: ["moses-mount-sinai"],
      16: ["moses-valley-of-tuwa","moses-pharaoh"],
      17: ["moses-pharaoh"],
      18: ["moses-nile","moses-pharaohs-palace","moses-pharaoh","moses-children-of-israel"],
      19: ["moses-egypt-ancient","moses-pharaoh","moses-ancient-egyptians"],
      20: ["moses-egypt-ancient","moses-pharaoh","moses-pharaohs-magicians"],
      21: ["moses-egypt-ancient","moses-pharaoh","moses-children-of-israel","moses-pharaohs-magicians"],
      22: ["moses-red-sea","moses-pharaoh","moses-children-of-israel"],
      23: ["moses-canaan","moses-pharaoh","moses-children-of-israel"],
      24: ["moses-egypt-ancient","moses-mount-sinai","moses-pharaoh","moses-children-of-israel","moses-ancient-egyptians"],
    },
  },
};
