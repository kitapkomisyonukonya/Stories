// Word-type labels come from the book files in English; Arabic books show them in Arabic.
const ARABIC: Record<string, string> = {
  noun: 'اسم',
  'proper noun': 'اسم علم',
  'noun phrase': 'مركب اسمي',
  verb: 'فعل',
  'phrasal verb': 'فعل مركب',
  'verb phrase': 'مركب فعلي',
  adjective: 'صفة',
  'adjective phrase': 'مركب وصفي',
  adverb: 'ظرف',
  'adverb phrase': 'مركب ظرفي',
  preposition: 'حرف جر',
  phrase: 'عبارة',
};

export const partOfSpeechLabel = (partOfSpeech: string | undefined, language: string) =>
  partOfSpeech && language === 'ar' ? ARABIC[partOfSpeech.trim().toLowerCase()] ?? partOfSpeech : partOfSpeech;
