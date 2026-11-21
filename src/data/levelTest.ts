import type { Level } from '../types';

/**
 * The optional level test offered to self-learners: ten short reading questions,
 * each on an exact passage from one of the books (chapter 2), three at A2, four at B1, three at B2.
 * The Arabic test is written from the Arabic story text, not translated from English.
 */
export interface LevelTestItem {
  band: Level;
  source: { storyId: string; level: Level; chapter: number };
  passage: string;
  question: string;
  options: string[];
  answer: number;
}

export const levelTestEn: LevelTestItem[] = [
  {
    band: 'A2',
    source: { storyId: 'musa', level: 'A2', chapter: 2 },
    passage: 'One day the king had a dream. He saw a fire in his vision. The fire came from Jerusalem and burnt the houses of the Egyptians.',
    question: 'Where did the fire come from?',
    options: ['From Egypt', 'From Jerusalem', 'From the king’s house'],
    answer: 1,
  },
  {
    band: 'A2',
    source: { storyId: 'adam', level: 'A2', chapter: 2 },
    passage: 'All the angels thought that Adam was amazing. They all admired him and respected him. But Iblis didn’t think so.',
    question: 'Who did not think that Adam was amazing?',
    options: ['Iblis', 'The angels', 'Adam'],
    answer: 0,
  },
  {
    band: 'A2',
    source: { storyId: 'yunusEmre', level: 'A2', chapter: 2 },
    passage: 'They were kind and cheerful; they were not cold or sulky.',
    question: 'What does “cheerful” mean here?',
    options: ['Sad and quiet', 'Angry', 'Happy and friendly'],
    answer: 2,
  },
  {
    band: 'B1',
    source: { storyId: 'ibrahim', level: 'B1', chapter: 2 },
    passage: 'One day, his father saw Abraham riding the statue of Marduk (the Chief God of Babylon), and he got angry with him. He told his son not to play with it again.',
    question: 'Why did Abraham’s father get angry?',
    options: ['Abraham broke a statue.', 'Abraham was riding the statue of Marduk.', 'Abraham did not go to the house of worship.'],
    answer: 1,
  },
  {
    band: 'B1',
    source: { storyId: 'mecca', level: 'B1', chapter: 2 },
    passage: 'The Jahiliyyah was an age of barbarism. People did not truly know Allah, and many people did not have justice, order, and peace in their personal and social lives. Prophet Muhammad (pbuh) described Islam as the opposite of barbarism. This era ended when the first revelation of the Qur’an began in 610 CE.',
    question: 'According to the text, what ended the Jahiliyyah?',
    options: ['The birth of Prophet Muhammad (pbuh)', 'A war between the tribes', 'The beginning of the first revelation of the Qur’an'],
    answer: 2,
  },
  {
    band: 'B1',
    source: { storyId: 'yunusEmre', level: 'B1', chapter: 2 },
    passage: 'People love his works very much due to his style. It is neither too simple nor too complex.',
    question: 'What is his style like?',
    options: ['Not too easy and not too difficult', 'Very difficult', 'Only for children'],
    answer: 0,
  },
  {
    band: 'B1',
    source: { storyId: 'musa', level: 'B1', chapter: 2 },
    passage: 'His mother was so frightened that she was unable to sleep at night. She was scared that when Moses cried, the soldiers could hear his voice.',
    question: 'Why couldn’t Moses’ mother sleep?',
    options: ['The baby was ill.', 'She was afraid the soldiers would hear him cry.', 'She worked at night.'],
    answer: 1,
  },
  {
    band: 'B2',
    source: { storyId: 'mecca', level: 'B2', chapter: 2 },
    passage: 'The meaning of "ignorance" is not the lack of science or the lack of knowledge. This period is called the Age of Ignorance because people did not truly know Allah and lacked justice, order, and peace in both their personal and social lives.',
    question: 'According to the writer, why is this period called the Age of Ignorance?',
    options: [
      'People did not truly know Allah and lacked justice, order and peace.',
      'People could not read or write.',
      'There were no schools in Mecca.',
    ],
    answer: 0,
  },
  {
    band: 'B2',
    source: { storyId: 'adam', level: 'B2', chapter: 2 },
    passage: 'So, in essence, people are from the same soil and they have no superiority over one another due to the difference in their colors.',
    question: 'What conclusion does the writer draw?',
    options: ['Some colors are better than others.', 'People should live in the land they come from.', 'Nobody is superior to others because of their color.'],
    answer: 2,
  },
  {
    band: 'B2',
    source: { storyId: 'yunusEmre', level: 'B2', chapter: 2 },
    passage: 'At that time, tekkes were not just institutions that offered Sufi training but they were also important civil society organizations that strengthened social solidarity and cooperation and also received support from government officials of their time.',
    question: 'What does the text suggest about tekkes?',
    options: ['They only offered Sufi training.', 'They had a social role as well as an educational one.', 'The government was against them.'],
    answer: 1,
  },
];

export const levelTestAr: LevelTestItem[] = [
  {
    band: 'A2',
    source: { storyId: 'musa', level: 'A2', chapter: 2 },
    passage: 'وَفِي أَحَدِ الْأَيَّامِ، رَأَى فِرْعَوْنُ حُلْمًا. فَقَدْ رَأَى فِي رُؤْيَاهُ نَارًا. كَانَتِ النَّارُ قَادِمَةً مِنَ الْقُدْسِ، وَأَحْرَقَتْ بُيُوتَ الْمِصْرِيِّينَ.',
    question: 'مِنْ أَيْنَ جَاءَتِ النَّارُ؟',
    options: ['مِنْ مِصْرَ', 'مِنَ الْقُدْسِ', 'مِنْ قَصْرِ فِرْعَوْنَ'],
    answer: 1,
  },
  {
    band: 'A2',
    source: { storyId: 'adam', level: 'A2', chapter: 2 },
    passage: 'فَرَأَتِ المَلائِكَةُ أَنَّ آدَمَ شَيْءٌ عَظيمٌ، فَأُعْجِبُوا بِهِ وَسَجَدُوا لَهُ تَكْريمًا. لَكِنَّ إِبْلِيسَ لَمْ يَفْعَلْ ذَلِكَ؛ إِبْلِيسُ يَرَى أَنَّ آدَمَ شَخْصٌ غَيْرُ مُهِمٍّ، لِأَنَّهُ خُلِقَ مِنَ الطِّينِ.',
    question: 'مَنْ لَمْ يَسْجُدْ لِآدَمَ؟',
    options: ['إِبْلِيسُ', 'الْمَلَائِكَةُ', 'آدَمُ'],
    answer: 0,
  },
  {
    band: 'A2',
    source: { storyId: 'yunusEmre', level: 'A2', chapter: 2 },
    passage: 'كانوا لُطَفاءَ وَمُبْتَسِمينَ، وَلَمْ يَكونوا بارِدينَ أَوْ عابِسينَ.',
    question: 'مَا مَعْنَى «مُبْتَسِمينَ» هُنَا؟',
    options: ['حَزِينُونَ وَصَامِتُونَ', 'غَاضِبُونَ', 'وُجُوهُهُمْ فَرِحَةٌ وَضَاحِكَةٌ'],
    answer: 2,
  },
  {
    band: 'B1',
    source: { storyId: 'ibrahim', level: 'B1', chapter: 2 },
    passage: 'وذات يوم، رأى والده إبراهيم يَرْكَب تمثال مردوخ، إله بابل الأعظم، فغضب منه، وأمره ألّا يَلْعَب به مرة أخرى.',
    question: 'لِمَاذَا غَضِبَ وَالِدُ إِبْرَاهِيمَ؟',
    options: ['لِأَنَّ إِبْرَاهِيمَ كَسَرَ تِمْثَالًا.', 'لِأَنَّ إِبْرَاهِيمَ كَانَ يَرْكَبُ تِمْثَالَ مَرْدُوخَ.', 'لِأَنَّ إِبْرَاهِيمَ لَمْ يَذْهَبْ إِلَى بَيْتِ الْعِبَادَةِ.'],
    answer: 1,
  },
  {
    band: 'B1',
    source: { storyId: 'mecca', level: 'B1', chapter: 2 },
    passage: 'المراد بالجاهلية هو «عصر الوحشيّة». فلم يَعْرِف الناس الله حق معرفته، ولم يَكُن لديْهم نظام ولا عدالة ولا سلام على نطاق واسع في حياتهم الشخصية والاجتماعية. وفي الواقع، وَصَفَ النبي محمد صلى الله عليه وسلم الإسلام بأنه نقيض الهَمَجِيَّة. وَانْتَهَى هذا العصر عندما بَدَأَ نزول الوحي الأول من القرآن الكريم عام ستّمئة وعشرة ميلادي.',
    question: 'حَسَبَ النَّصِّ، مَتَى انْتَهَى عَصْرُ الْجَاهِلِيَّةِ؟',
    options: ['عِنْدَ وِلَادَةِ النَّبِيِّ مُحَمَّدٍ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ', 'بَعْدَ حَرْبٍ بَيْنَ الْقَبَائِلِ', 'عِنْدَمَا بَدَأَ نُزُولُ الْوَحْيِ الْأَوَّلِ مِنَ الْقُرْآنِ الْكَرِيمِ'],
    answer: 2,
  },
  {
    band: 'B1',
    source: { storyId: 'yunusEmre', level: 'B1', chapter: 2 },
    passage: 'يُحِبُّ النَّاسُ أَعْمَالَهُ كَثِيرًا بِسَبَبِ أُسْلُوبِهِ. فَهُوَ لَيْسَ بَسِيطًا جِدًّا، وَلَيْسَ مُعَقَّدًا أَيْضًا.',
    question: 'كَيْفَ هُوَ أُسْلُوبُهُ؟',
    options: ['لَيْسَ سَهْلًا جِدًّا وَلَا صَعْبًا جِدًّا', 'صَعْبٌ جِدًّا', 'لِلْأَطْفَالِ فَقَطْ'],
    answer: 0,
  },
  {
    band: 'B1',
    source: { storyId: 'musa', level: 'B1', chapter: 2 },
    passage: 'كانت أمّه خائفة جدًّا، حتى إنّها لم تستطِع النوْم ليْلًا. كانت تخاف أنْ يسمَع الجنود صوْت موسى عندما يبْكي.',
    question: 'لِمَاذَا لَمْ تَسْتَطِعْ أُمُّ مُوسَى النَّوْمَ؟',
    options: ['لِأَنَّ الطِّفْلَ كَانَ مَرِيضًا.', 'لِأَنَّهَا خَافَتْ أَنْ يَسْمَعَ الْجُنُودُ بُكَاءَهُ.', 'لِأَنَّهَا كَانَتْ تَعْمَلُ فِي اللَّيْلِ.'],
    answer: 1,
  },
  {
    band: 'B2',
    source: { storyId: 'mecca', level: 'B2', chapter: 2 },
    passage: 'مَعْنَى «الْجَهْلِ» لَيْسَ نَقْصَ الْعِلْمِ أَوْ نَقْصَ الْمَعْرِفَةِ. تُسَمَّى هَذِهِ الْفَتْرَةُ بِعَصْرِ الْجَاهِلِيَّةِ لِأَنَّ النَّاسَ لَمْ يَعْرِفُوا اللَّهَ حَقًّا وَلَمْ يَمْلِكُوا بِشَكْلٍ وَاسِعٍ الْعَدْلَ وَالنِّظَامَ وَالسَّلَامَ فِي حَيَاتِهِمُ الشَّخْصِيَّةِ وَالِاجْتِمَاعِيَّةِ.',
    question: 'حَسَبَ الْكَاتِبِ، لِمَاذَا سُمِّيَتْ هَذِهِ الْفَتْرَةُ بِعَصْرِ الْجَاهِلِيَّةِ؟',
    options: [
      'لِأَنَّ النَّاسَ لَمْ يَعْرِفُوا اللَّهَ حَقًّا، وَافْتَقَدُوا الْعَدْلَ وَالنِّظَامَ وَالسَّلَامَ.',
      'لِأَنَّ النَّاسَ لَمْ يَكُونُوا يَعْرِفُونَ الْقِرَاءَةَ وَالْكِتَابَةَ.',
      'لِأَنَّهُ لَمْ تَكُنْ فِي مَكَّةَ مَدَارِسُ.',
    ],
    answer: 0,
  },
  {
    band: 'B2',
    source: { storyId: 'adam', level: 'B2', chapter: 2 },
    passage: 'وهكذا، فإن الناس في الأصل من تراب واحد، ولا فضل لبعضهم على بعض بسبب اختلاف ألوانهم.',
    question: 'مَا النَّتِيجَةُ الَّتِي يَصِلُ إِلَيْهَا الْكَاتِبُ؟',
    options: ['بَعْضُ الْأَلْوَانِ أَفْضَلُ مِنْ غَيْرِهَا.', 'يَجِبُ أَنْ يَعِيشَ كُلُّ إِنْسَانٍ فِي الْأَرْضِ الَّتِي جَاءَ مِنْهَا.', 'لَا أَحَدَ أَفْضَلُ مِنْ غَيْرِهِ بِسَبَبِ لَوْنِهِ.'],
    answer: 2,
  },
  {
    band: 'B2',
    source: { storyId: 'yunusEmre', level: 'B2', chapter: 2 },
    passage: 'وَفِي ذَلِكَ الْوَقْتِ، لَمْ تَكُنِ التَّكَايَا مُؤَسَّسَاتٍ تُقَدِّمُ التَّعْلِيمَ الصُّوفِيَّ فَقَطْ، بَلْ كَانَتْ أَيْضًا مُؤَسَّسَاتٍ مُهِمَّةً فِي الْمُجْتَمَعِ الْمَدَنِيِّ، تُعَزِّزُ التَّضَامُنَ الاجْتِمَاعِيَّ وَالتَّعَاوُنَ، كَمَا كَانَتْ تَحْظَى بِدَعْمِ الْمَسْؤُولِينَ الْحُكُومِيِّينَ فِي عَصْرِهَا.',
    question: 'مَاذَا يُفْهَمُ مِنَ النَّصِّ عَنِ التَّكَايَا؟',
    options: ['كَانَتْ تُقَدِّمُ التَّعْلِيمَ الصُّوفِيَّ فَقَطْ.', 'كَانَ لَهَا دَوْرٌ اجْتِمَاعِيٌّ إِلَى جَانِبِ دَوْرِهَا التَّعْلِيمِيِّ.', 'كَانَتِ الْحُكُومَةُ ضِدَّهَا.'],
    answer: 1,
  },
];

/**
 * A2 unless at least two A2 and three B1 answers are right; B2 when, on top of that, two B2 answers are right.
 * The result is only a suggestion; the learner can still open any level.
 */
export const scoreLevelTest = (items: LevelTestItem[], answers: number[]): Level => {
  const right = (band: Level) => items.filter((item, i) => item.band === band && answers[i] === item.answer).length;
  if (right('A2') < 2 || right('B1') < 3) return 'A2';
  return right('B2') >= 2 ? 'B2' : 'B1';
};
