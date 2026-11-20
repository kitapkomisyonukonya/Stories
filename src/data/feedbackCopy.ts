import type { FeedbackLang, FeedbackQuestion, FeedbackRole } from '../lib/feedback';

/**
 * Texts of the feedback form. The form has its own language switch (Türkçe, English, العربية), so a
 * tester fills it in the language they are most at home in, whatever the app's own language is.
 * The links that open it inside the app stay English or Arabic like the rest of the app.
 */
export interface FeedbackCopy {
  heading: string;
  intro: string;
  privacy: string;
  formLanguage: string;
  role: string;
  roles: Record<FeedbackRole, string>;
  book: string;
  general: string;
  level: string;
  anyLevel: string;
  ratingsTitle: string;
  low: string;
  high: string;
  questions: Record<FeedbackQuestion, string>;
  liked: string;
  problems: string;
  ideas: string;
  placeholder: string;
  send: string;
  sending: string;
  empty: string;
  thanks: string;
  thanksText: string;
  again: string;
  close: string;
  failed: string;
  busy: string;
}

export const FEEDBACK_COPY: Record<FeedbackLang, FeedbackCopy> = {
  tr: {
    heading: 'Görüşleriniz',
    intro: 'Uygulamayı kullandıktan sonra düşüncelerinizi proje ekibiyle paylaşın. Bütün sorular isteğe bağlıdır. Yalnızca istediğiniz soruları cevaplayabilirsiniz.',
    privacy: 'Ad, okul, e-posta ya da telefon bilgisi istenmez. Lütfen cevaplarınıza da bu tür bilgiler yazmayın. Görüşleri yalnızca proje ekibi okur.',
    formLanguage: 'Form dili',
    role: 'Uygulamayı kim olarak kullandınız?',
    roles: { student: 'Öğrenci', teacher: 'Öğretmen', parent: 'Veli', other: 'Diğer' },
    book: 'Hangi kitap hakkında yazıyorsunuz?',
    general: 'Genel olarak uygulama',
    level: 'Seviye',
    anyLevel: 'Belirtmek istemiyorum',
    ratingsTitle: '1 ile 5 arasında puan verin',
    low: 'Zayıf',
    high: 'Çok iyi',
    questions: {
      overall: 'Uygulamayı genel olarak nasıl buldunuz?',
      ease: 'Kullanımı ne kadar kolaydı?',
      level: 'Metinler seviyeye uygun muydu?',
      exercises: 'Alıştırmalar ne kadar faydalıydı?',
      media: 'Resimler ve sesler nasıldı?',
    },
    liked: 'En çok neyi beğendiniz?',
    problems: 'Bir hata ya da sorun gördünüz mü? Hangi kitapta, hangi sayfada?',
    ideas: 'Önerileriniz nelerdir?',
    placeholder: 'Buraya yazabilirsiniz…',
    send: 'Gönder',
    sending: 'Gönderiliyor…',
    empty: 'Göndermeden önce en az bir soruyu cevaplayın.',
    thanks: 'Teşekkür ederiz!',
    thanksText: 'Görüşleriniz proje ekibine ulaştı.',
    again: 'Yeni bir görüş yaz',
    close: 'Kapat',
    failed: 'Gönderilemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.',
    busy: 'Kısa sürede çok fazla gönderim yapıldı. Birkaç dakika sonra tekrar deneyin.',
  },
  en: {
    heading: 'Your feedback',
    intro: 'Tell the project team what you think after using the app. Every question is optional: answer only the ones you want.',
    privacy: 'We do not ask for your name, school, e-mail or phone number. Please do not write such details in your answers. Only the project team reads the feedback.',
    formLanguage: 'Form language',
    role: 'You used the app as a…',
    roles: { student: 'Student', teacher: 'Teacher', parent: 'Parent', other: 'Other' },
    book: 'Which book are you writing about?',
    general: 'The app in general',
    level: 'Level',
    anyLevel: 'I’d rather not say',
    ratingsTitle: 'Give a score from 1 to 5',
    low: 'Poor',
    high: 'Excellent',
    questions: {
      overall: 'How did you find the app overall?',
      ease: 'How easy was it to use?',
      level: 'Were the texts right for the level?',
      exercises: 'How useful were the exercises?',
      media: 'How were the pictures and the audio?',
    },
    liked: 'What did you like most?',
    problems: 'Did you notice a mistake or a problem? In which book, on which page?',
    ideas: 'What would you suggest?',
    placeholder: 'Write here…',
    send: 'Send',
    sending: 'Sending…',
    empty: 'Answer at least one question before sending.',
    thanks: 'Thank you!',
    thanksText: 'Your feedback has reached the project team.',
    again: 'Write another',
    close: 'Close',
    failed: 'It could not be sent. Check your internet connection and try again.',
    busy: 'Too many messages in a short time. Please try again in a few minutes.',
  },
  ar: {
    heading: 'رَأْيُكَ',
    intro: 'أَخْبِرْ فَرِيقَ الْمَشْرُوعِ بِرَأْيِكَ بَعْدَ اسْتِخْدَامِ التَّطْبِيقِ. كُلُّ الْأَسْئِلَةِ اخْتِيَارِيَّةٌ: أَجِبْ عَمَّا تُرِيدُ فَقَطْ.',
    privacy: 'لَا نَسْأَلُكَ عَنِ اسْمِكَ أَوْ مَدْرَسَتِكَ أَوْ بَرِيدِكَ الْإِلِكْتِرُونِيِّ أَوْ رَقْمِ هَاتِفِكَ. مِنْ فَضْلِكَ لَا تَكْتُبْ مِثْلَ هٰذِهِ الْمَعْلُومَاتِ فِي إِجَابَاتِكَ. لَا يَقْرَأُ الْآرَاءَ إِلَّا فَرِيقُ الْمَشْرُوعِ.',
    formLanguage: 'لُغَةُ الِاسْتِمَارَةِ',
    role: 'اسْتَخْدَمْتَ التَّطْبِيقَ بِصِفَتِكَ:',
    roles: { student: 'طَالِبًا', teacher: 'مُعَلِّمًا', parent: 'وَلِيَّ أَمْرٍ', other: 'غَيْرَ ذٰلِكَ' },
    book: 'عَنْ أَيِّ كِتَابٍ تَكْتُبُ؟',
    general: 'التَّطْبِيقُ بِشَكْلٍ عَامٍّ',
    level: 'الْمُسْتَوَى',
    anyLevel: 'لَا أُرِيدُ التَّحْدِيدَ',
    ratingsTitle: 'أَعْطِ دَرَجَةً مِنْ ١ إِلَى ٥',
    low: 'ضَعِيفٌ',
    high: 'مُمْتَازٌ',
    questions: {
      overall: 'كَيْفَ وَجَدْتَ التَّطْبِيقَ بِشَكْلٍ عَامٍّ؟',
      ease: 'مَا مَدَى سُهُولَةِ اسْتِخْدَامِهِ؟',
      level: 'هَلْ كَانَتِ النُّصُوصُ مُنَاسِبَةً لِلْمُسْتَوَى؟',
      exercises: 'مَا مَدَى فَائِدَةِ التَّمَارِينِ؟',
      media: 'كَيْفَ كَانَتِ الصُّوَرُ وَالتَّسْجِيلَاتُ الصَّوْتِيَّةُ؟',
    },
    liked: 'مَا أَكْثَرُ شَيْءٍ أَعْجَبَكَ؟',
    problems: 'هَلْ لَاحَظْتَ خَطَأً أَوْ مُشْكِلَةً؟ فِي أَيِّ كِتَابٍ، وَفِي أَيِّ صَفْحَةٍ؟',
    ideas: 'مَا اقْتِرَاحَاتُكَ؟',
    placeholder: 'اكْتُبْ هُنَا…',
    send: 'أَرْسِلْ',
    sending: 'جَارٍ الْإِرْسَالُ…',
    empty: 'أَجِبْ عَنْ سُؤَالٍ وَاحِدٍ عَلَى الْأَقَلِّ قَبْلَ الْإِرْسَالِ.',
    thanks: 'شُكْرًا لَكَ!',
    thanksText: 'وَصَلَ رَأْيُكَ إِلَى فَرِيقِ الْمَشْرُوعِ.',
    again: 'اكْتُبْ رَأْيًا آخَرَ',
    close: 'إِغْلَاقٌ',
    failed: 'تَعَذَّرَ الْإِرْسَالُ. تَحَقَّقْ مِنِ اتِّصَالِكَ بِالْإِنْتَرْنِتْ ثُمَّ حَاوِلْ مَرَّةً أُخْرَى.',
    busy: 'أُرْسِلَتْ رَسَائِلُ كَثِيرَةٌ فِي وَقْتٍ قَصِيرٍ. حَاوِلْ مَرَّةً أُخْرَى بَعْدَ دَقَائِقَ.',
  },
};

/** The app's own links to the form (English or Arabic, like the rest of the app). */
export const FEEDBACK_LINK_COPY = {
  en: {
    link: 'Share your feedback',
    summaryTitle: 'How was this book?',
    summaryText: 'Tell the project team what worked and what did not. It takes two minutes.',
  },
  ar: {
    link: 'شَارِكْنَا رَأْيَكَ',
    summaryTitle: 'كَيْفَ كَانَ هٰذَا الْكِتَابُ؟',
    summaryText: 'أَخْبِرْ فَرِيقَ الْمَشْرُوعِ بِمَا نَجَحَ وَمَا لَمْ يَنْجَحْ. لَا يَسْتَغْرِقُ ذٰلِكَ أَكْثَرَ مِنْ دَقِيقَتَيْنِ.',
  },
};
