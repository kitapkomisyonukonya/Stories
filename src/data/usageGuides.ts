/**
 * Short usage guides, one per role: how to use the app and the PDFs.
 * Shown in the reader menu and printed as PDFs in public/pdfs/guides/.
 * Plain data (no React) so the PDF build can read it too.
 */
import type { UserRole } from '../contexts/UserRoleContext';

/** Names of icons in src/components/ui/icons.tsx. */
export type UsageGuideIcon =
  | 'LockKeyhole'
  | 'Library'
  | 'BookOpen'
  | 'Notepad'
  | 'ProjectorScreen'
  | 'Trophy'
  | 'Certificate'
  | 'FileText'
  | 'Lightbulb'
  | 'Target'
  | 'BookMarked'
  | 'Search'
  | 'Users'
  | 'Scroll';

export interface UsageGuideSection {
  icon: UsageGuideIcon;
  heading: string;
  steps: string[];
}

export interface UsageGuide {
  title: string;
  subtitle: string;
  intro: string;
  sections: UsageGuideSection[];
}

export type UsageGuideLang = 'en' | 'ar';

export const USAGE_GUIDE_FILES: Record<UserRole, string> = {
  teacher: 'teacher-guide',
  student: 'student-guide',
  self: 'user-guide',
};

/** The printable copy, served by the app: /pdfs/guides/teacher-guide-en.pdf and so on. */
export const usageGuidePdfUrl = (role: UserRole, lang: UsageGuideLang) => `/pdfs/guides/${USAGE_GUIDE_FILES[role]}-${lang}.pdf`;

export const USAGE_GUIDES: Record<UserRole, Record<UsageGuideLang, UsageGuide>> = {
  teacher: {
    en: {
      title: 'Teacher Guide',
      subtitle: 'How to use the app and the PDFs in your lessons',
      intro: 'From Language to Culture is a library of story books in English and Arabic at three levels: A2, B1 and B2. Every book works in the app and as PDFs. This guide shows how to use both with a class. The full lesson notes for each book are in its Teacher’s Book.',
      sections: [
        {
          icon: 'LockKeyhole',
          heading: 'Getting started',
          steps: [
            'Open the app link in a browser on a computer, a tablet or a phone.',
            'Type the access code you received.',
            'Choose Teacher. You can change this later on the home page.',
            'Choose English or Arabic with the language button at the top.',
            'No account is needed. Progress is saved on the device you use.',
          ],
        },
        {
          icon: 'Library',
          heading: 'Choosing a book',
          steps: [
            'On the home page, choose a story and then a level: A2, B1 or B2.',
            'Every story has the same chapters at each level, so a mixed class can read the same story at different levels.',
            'The Teacher’s Book button on the book card opens the full teaching notes for that level.',
            'The Check a result code card on the home page is only for teachers.',
          ],
        },
        {
          icon: 'BookOpen',
          heading: 'A chapter in the app',
          steps: [
            'Before you read: students look, guess or find the answer fast.',
            'Listen: Every chapter has a recording. Play it once while students follow the text.',
            'Read: Underlined words show a short meaning in both languages.',
            'Quick Challenge, Language Focus and I can close the chapter.',
            'My words: students save new words and review them later.',
          ],
        },
        {
          icon: 'Notepad',
          heading: 'Teacher tools in the chapter',
          steps: [
            'The Lesson card under the chapter title puts the lesson on one screen: aims, timed steps, a group task and an exit ticket.',
            'The Teacher’s Book in the menu has the full plan, answers and assessment ideas for every chapter.',
            'Discussion and Language Review questions have example answers. Show them after students try.',
          ],
        },
        {
          icon: 'ProjectorScreen',
          heading: 'Teaching on the board',
          steps: [
            'Open Story settings and turn on Class mode.',
            'The text becomes larger. Answers and example answers stay hidden until you choose Show the answer or Show example.',
            'Group tasks open for the whole class. The icons show if a task is for one student, a pair or a group.',
            'On the maps, Class mode hides the places so you can show them one by one.',
          ],
        },
        {
          icon: 'Trophy',
          heading: 'The end of the book',
          steps: [
            'Every book ends with Knowledge Check, Master Glossary, Places & People, Vocabulary Challenge, Language Review and Final Challenge.',
            'Students then see a result card with a short code.',
            'Type the code in Check a result code on the home page to see the student’s results. Nothing is sent over the internet.',
          ],
        },
        {
          icon: 'FileText',
          heading: 'The PDFs',
          steps: [
            'Each book has three PDFs: The story book, the Teacher’s Book and the Self-Study Guide.',
            'Story book: The chapters and activities for reading on paper. Its QR codes open the same page in the app.',
            'Teacher’s Book: lesson plans, answers and assessment for every chapter.',
            'Self-Study Guide: A study plan students can follow at home.',
            'Open the book menu. The PDFs are under Printable PDFs.',
            'A PDF opens in the browser. From there you can print it or save it.',
          ],
        },
        {
          icon: 'Lightbulb',
          heading: 'Good to know',
          steps: [
            'How to use this book in the menu explains every icon in one page.',
            'Save this book offline in the menu keeps a book ready for a class without internet.',
            'Install app on the home page puts the library on the device like an app.',
          ],
        },
      ],
    },
    ar: {
      title: 'دليل المعلم',
      subtitle: 'كيف تستخدم التطبيق وملفات PDF في دروسك',
      intro: '«من اللغة إلى الثقافة» مكتبة قصص بالإنجليزية والعربية في ثلاثة مستويات: A2 وB1 وB2. كل كتاب متاح في التطبيق وفي ملفات PDF. يشرح هذا الدليل كيف تستخدمهما مع الصف. أما ملاحظات التدريس الكاملة لكل كتاب ففي «كتاب المعلم» الخاص به.',
      sections: [
        {
          icon: 'LockKeyhole',
          heading: 'البداية',
          steps: [
            'افتح رابط التطبيق في المتصفح على حاسوب أو جهاز لوحي أو هاتف.',
            'اكتب رمز الدخول الذي وصلك.',
            'اختر «معلم». يمكنك تغيير ذلك لاحقًا من الصفحة الرئيسية.',
            'اختر العربية أو الإنجليزية من زر اللغة في الأعلى.',
            'لا حاجة إلى حساب. يُحفظ التقدم على الجهاز الذي تستخدمه.',
          ],
        },
        {
          icon: 'Library',
          heading: 'اختيار الكتاب',
          steps: [
            'اختر من الصفحة الرئيسية قصة ثم مستوى: A2 أو B1 أو B2.',
            'لكل قصة الفصول نفسها في كل مستوى، فيمكن لصف متفاوت أن يقرأ القصة نفسها بمستويات مختلفة.',
            'زر «كتاب المعلم» على بطاقة الكتاب يفتح ملاحظات التدريس الكاملة لذلك المستوى.',
            'بطاقة «تحقق من رمز النتيجة» في الصفحة الرئيسية للمعلم فقط.',
          ],
        },
        {
          icon: 'BookOpen',
          heading: 'الفصل في التطبيق',
          steps: [
            '«قبل القراءة»: ينظر الطلاب أو يخمّنون أو يبحثون عن الجواب بسرعة.',
            '«استمع»: لكل فصل تسجيل صوتي. شغّله مرة والطلاب يتابعون النص.',
            '«اقرأ»: الكلمات التي تحتها خط تُظهر معنى قصيرًا باللغتين.',
            '«تحدٍّ سريع» و«التركيز اللغوي» و«أستطيع» تختم الفصل.',
            '«كلماتي»: يحفظ الطلاب الكلمات الجديدة ويراجعونها لاحقًا.',
          ],
        },
        {
          icon: 'Notepad',
          heading: 'أدوات المعلم في الفصل',
          steps: [
            '«بطاقة الدرس» تحت عنوان الفصل تضع الدرس في شاشة واحدة: الأهداف، والخطوات بأوقاتها، ومهمة جماعية، وبطاقة الخروج.',
            '«كتاب المعلم» في القائمة فيه الخطة الكاملة والإجابات وأفكار التقويم لكل فصل.',
            'لأسئلة النقاش ومراجعة اللغة أمثلة إجابات. اعرضها بعد أن يحاول الطلاب.',
          ],
        },
        {
          icon: 'ProjectorScreen',
          heading: 'التدريس على السبورة',
          steps: [
            'افتح «إعدادات القصة» وشغّل «وضع الصف».',
            'يكبر النص، وتبقى الإجابات وأمثلة الإجابات مخفية حتى تختار إظهارها.',
            'تُفتح المهام الجماعية للصف كله. وتبيّن الرموز إن كانت المهمة لطالب واحد أو لزميلين أو لمجموعة.',
            'في الخرائط يُخفي «وضع الصف» الأماكن لتُظهرها واحدًا بعد الآخر.',
          ],
        },
        {
          icon: 'Trophy',
          heading: 'نهاية الكتاب',
          steps: [
            'ينتهي كل كتاب بـ«اختبار المعرفة» و«المعجم» و«الأماكن والأشخاص» و«تحدي المفردات» و«مراجعة اللغة» و«التحدي النهائي».',
            'بعدها يرى الطالب «بطاقة النتيجة» ومعها رمز قصير.',
            'اكتب الرمز في «تحقق من رمز النتيجة» في الصفحة الرئيسية لترى نتائج الطالب. لا يُرسَل شيء عبر الإنترنت.',
          ],
        },
        {
          icon: 'FileText',
          heading: 'ملفات PDF',
          steps: [
            'لكل كتاب ثلاثة ملفات PDF: كتاب القصة، و«كتاب المعلم»، و«دليل الدراسة الذاتية».',
            'كتاب القصة: الفصول والأنشطة للقراءة على الورق. ورموز QR فيه تفتح الصفحة نفسها في التطبيق.',
            '«كتاب المعلم»: خطط الدروس والإجابات والتقويم لكل فصل.',
            '«دليل الدراسة الذاتية»: خطة دراسة يتبعها الطالب في البيت.',
            'افتح قائمة الكتاب. الملفات تحت «ملفات PDF للطباعة».',
            'يُفتح ملف PDF في المتصفح، ومن هناك تطبعه أو تحفظه.',
          ],
        },
        {
          icon: 'Lightbulb',
          heading: 'من المفيد أن تعرف',
          steps: [
            '«كيف تستخدم هذا الكتاب» في القائمة يشرح كل الرموز في صفحة واحدة.',
            '«احفظ هذا الكتاب للقراءة دون اتصال» في القائمة يجهّز الكتاب لصف بلا إنترنت.',
            '«ثبّت التطبيق» في الصفحة الرئيسية يضع المكتبة على الجهاز مثل تطبيق.',
          ],
        },
      ],
    },
  },
  student: {
    en: {
      title: 'Student Guide',
      subtitle: 'How to use the app and the PDFs',
      intro: 'You read the stories with your class and at home. This guide shows you how to use the app and the PDF books.',
      sections: [
        {
          icon: 'LockKeyhole',
          heading: 'Start',
          steps: [
            'Open the app link on a computer, a tablet or a phone.',
            'Type the access code from your teacher.',
            'Choose Student.',
            'Choose English or Arabic at the top.',
          ],
        },
        {
          icon: 'Library',
          heading: 'Find your book',
          steps: [
            'Choose the story your teacher gives you.',
            'Choose your level: A2, B1 or B2.',
            'You do not need an account. The app remembers your work on this device.',
          ],
        },
        {
          icon: 'BookOpen',
          heading: 'Every chapter',
          steps: [
            'Before you read: look, guess or find the answer fast.',
            'Listen: Listen once and follow the text.',
            'Read: Read one short part at a time.',
            'Tap an underlined word to see its meaning.',
            'Quick Challenge: Answer the short questions.',
            'I can: Check what you can do now.',
          ],
        },
        {
          icon: 'Search',
          heading: 'A wrong answer?',
          steps: [
            'Find the answer sentence in the chapter.',
            'Read it again.',
            'Try again.',
          ],
        },
        {
          icon: 'BookMarked',
          heading: 'My words',
          steps: [
            'Tap an underlined word and choose Save to My words.',
            'Open My words from the menu and review your words after one day, three days and one week.',
          ],
        },
        {
          icon: 'Scroll',
          heading: 'Seyahatname: your travel journal',
          steps: [
            'Open Seyahatname on the home page. On a phone, it has its own tab.',
            'Finish the Quick Challenge of a chapter and its stamp is pressed in your journal.',
            'Finish the Final Challenge of a book and the book is sealed.',
            'If you like, choose a weekly goal. A new week starts on Monday. Nothing you earned is lost.',
            'Finish all the books of a level in one language and your certificate for that level is ready.',
            'New device? Choose Show my code here, then I have a code on the new device.',
          ],
        },
        {
          icon: 'Target',
          heading: 'Study well',
          steps: [
            'Plan: Read Make Your Plan in the Self-Study Guide before Chapter 1.',
            'Check: After each chapter, look at I can. Can you do it now?',
            'Review: Look at My words again after one day, three days and one week.',
            'Look back: When you finish the book, answer Look Back again (section 10 of the Self-Study Guide).',
          ],
        },
        {
          icon: 'Certificate',
          heading: 'The end of the book',
          steps: [
            'Do Knowledge Check, Vocabulary Challenge, Language Review and Final Challenge.',
            'Then you see your result card with a short code.',
            'Show the card or the code to your teacher.',
          ],
        },
        {
          icon: 'FileText',
          heading: 'The PDFs',
          steps: [
            'Story book: The story and the activities on paper. You can also choose Story only or Story + Workbook.',
            'Scan a QR code in the story book to open the same page in the app.',
            'Self-Study Guide: A plan for study at home, with Make Your Plan and Look Back.',
            'Open the book menu. The PDFs are under Printable PDFs.',
            'A PDF opens in your browser. You can print it or save it.',
          ],
        },
        {
          icon: 'Lightbulb',
          heading: 'Good to know',
          steps: [
            'How to use this book in the menu explains every icon.',
            'The Self-Study Guide is also in the menu of every book.',
            'Save this book offline in the menu to read without internet.',
          ],
        },
      ],
    },
    ar: {
      title: 'دليل الطالب',
      subtitle: 'كيف تستخدم التطبيق وملفات PDF',
      intro: 'تقرأ القصص مع صفك وفي البيت. يبيّن لك هذا الدليل كيف تستخدم التطبيق وكتب PDF.',
      sections: [
        {
          icon: 'LockKeyhole',
          heading: 'ابدأ',
          steps: [
            'افتح رابط التطبيق على حاسوب أو جهاز لوحي أو هاتف.',
            'اكتب رمز الدخول الذي أعطاك إياه معلمك.',
            'اختر «طالب».',
            'اختر العربية أو الإنجليزية في الأعلى.',
          ],
        },
        {
          icon: 'Library',
          heading: 'جد كتابك',
          steps: [
            'اختر القصة التي يعطيك إياها معلمك.',
            'اختر مستواك: A2 أو B1 أو B2.',
            'لا تحتاج إلى حساب. يتذكر التطبيق عملك على هذا الجهاز.',
          ],
        },
        {
          icon: 'BookOpen',
          heading: 'في كل فصل',
          steps: [
            '«قبل القراءة»: انظر أو خمّن أو ابحث عن الجواب بسرعة.',
            '«استمع»: استمع مرة وتابع النص.',
            '«اقرأ»: اقرأ جزءًا قصيرًا في كل مرة.',
            'اضغط على كلمة تحتها خط لترى معناها.',
            '«تحدٍّ سريع»: أجب عن الأسئلة القصيرة.',
            '«أستطيع»: تحقق مما تستطيع فعله الآن.',
          ],
        },
        {
          icon: 'Search',
          heading: 'إجابة غير صحيحة؟',
          steps: [
            'جد جملة الإجابة في الفصل.',
            'اقرأها مرة أخرى.',
            'حاول مرة أخرى.',
          ],
        },
        {
          icon: 'BookMarked',
          heading: 'كلماتي',
          steps: [
            'اضغط على كلمة تحتها خط واختر «احفظ في كلماتي».',
            'افتح «كلماتي» من القائمة وراجع كلماتك بعد يوم، ثم بعد ثلاثة أيام، ثم بعد أسبوع.',
          ],
        },
        {
          icon: 'Scroll',
          heading: '«الرحلة»: دفتر رحلتك',
          steps: [
            'افتح «الرحلة» من الصفحة الرئيسية. وفي الهاتف لها تبويب خاص.',
            'أكمل «التحدي السريع» في فصل، فيُختم ختمه في دفترك.',
            'أكمل «التحدي النهائي» في كتاب، فيُختم الكتاب.',
            'إن شئت، اختر هدفًا أسبوعيًا. يبدأ أسبوع جديد يوم الاثنين، ولا يضيع شيء مما كسبته.',
            'أكمل كل كتب مستوى واحد بلغة واحدة، فتصبح شهادتك لذلك المستوى جاهزة.',
            'جهاز جديد؟ اختر «اعرض رمزي» هنا، ثم «عندي رمز» على الجهاز الجديد.',
          ],
        },
        {
          icon: 'Target',
          heading: 'ادرس جيدًا',
          steps: [
            'خطّط: اقرأ «ضع خطتك» في «دليل الدراسة الذاتية» قبل الفصل الأول.',
            'تحقّق: بعد كل فصل انظر إلى «أستطيع». هل تستطيع ذلك الآن؟',
            'راجع: انظر إلى «كلماتي» مرة أخرى بعد يوم، ثم بعد ثلاثة أيام، ثم بعد أسبوع.',
            'انظر إلى الوراء: عندما تنهي الكتاب أجب عن «نظرة إلى الوراء» مرة أخرى (القسم ١٠ من «دليل الدراسة الذاتية»).',
          ],
        },
        {
          icon: 'Certificate',
          heading: 'نهاية الكتاب',
          steps: [
            'أكمل «اختبار المعرفة» و«تحدي المفردات» و«مراجعة اللغة» و«التحدي النهائي».',
            'بعدها ترى «بطاقة النتيجة» ومعها رمز قصير.',
            'اعرض البطاقة أو الرمز على معلمك.',
          ],
        },
        {
          icon: 'FileText',
          heading: 'ملفات PDF',
          steps: [
            'كتاب القصة: القصة والأنشطة على الورق. ويمكنك أيضًا أن تختار «القصة فقط» أو «القصة وكراسة الأنشطة».',
            'امسح رمز QR في كتاب القصة لتفتح الصفحة نفسها في التطبيق.',
            '«دليل الدراسة الذاتية»: خطة للدراسة في البيت، فيها «ضع خطتك» و«نظرة إلى الوراء».',
            'افتح قائمة الكتاب. الملفات تحت «ملفات PDF للطباعة».',
            'يُفتح ملف PDF في المتصفح. يمكنك أن تطبعه أو تحفظه.',
          ],
        },
        {
          icon: 'Lightbulb',
          heading: 'من المفيد أن تعرف',
          steps: [
            '«كيف تستخدم هذا الكتاب» في القائمة يشرح كل الرموز.',
            '«دليل الدراسة الذاتية» موجود أيضًا في قائمة كل كتاب.',
            '«احفظ هذا الكتاب للقراءة دون اتصال» في القائمة لتقرأ بلا إنترنت.',
          ],
        },
      ],
    },
  },
  self: {
    en: {
      title: 'User Guide',
      subtitle: 'How to learn on your own with the app and the PDFs',
      intro: 'You can learn with these books without a class. This guide shows you how to find your level, study each chapter and use the PDFs.',
      sections: [
        {
          icon: 'LockKeyhole',
          heading: 'Start',
          steps: [
            'Open the app link on a computer, a tablet or a phone.',
            'Type the access code you received.',
            'Choose On my own. You can change this later on the home page.',
            'Choose English or Arabic at the top.',
          ],
        },
        {
          icon: 'Target',
          heading: 'Find your level',
          steps: [
            'Take the Level test on the home page. Ten short questions suggest a level for you.',
            'The home page then shows a book at that level.',
            'You can also choose any story and level yourself: A2, B1 or B2.',
          ],
        },
        {
          icon: 'BookOpen',
          heading: 'Study one chapter',
          steps: [
            'Before you read: look, guess or find the answer fast.',
            'Listen once and follow the text.',
            'Read one short part at a time. Tap an underlined word to see its meaning.',
            'Do the Quick Challenge. After a wrong answer, find the answer sentence, read it again and try again.',
            'Look at Language Focus and check I can.',
            'Questions without one right answer have an example answer. Answer first, then look.',
          ],
        },
        {
          icon: 'BookMarked',
          heading: 'Keep your words',
          steps: [
            'Tap an underlined word and choose Save to My words.',
            'Open My words from the menu and review them after one day, three days and one week.',
          ],
        },
        {
          icon: 'Scroll',
          heading: 'Seyahatname: your travel journal',
          steps: [
            'Open Seyahatname on the home page. On a phone, it has its own tab.',
            'Finish the Quick Challenge of a chapter and its stamp is pressed in your journal.',
            'Finish the Final Challenge of a book and the book is sealed.',
            'If you like, choose a weekly goal. A new week starts on Monday. Nothing you earned is lost.',
            'Finish all the books of a level in one language and your certificate for that level is ready.',
            'New device? Choose Show my code here, then I have a code on the new device.',
          ],
        },
        {
          icon: 'Notepad',
          heading: 'Your Self-Study Guide',
          steps: [
            'Every book has a Self-Study Guide in the menu.',
            'It gives a study plan for each chapter and tells you what to do next.',
            'Start with Make Your Plan. When you finish the book, answer Look Back.',
          ],
        },
        {
          icon: 'Trophy',
          heading: 'Finish the book',
          steps: [
            'Do Knowledge Check, Vocabulary Challenge, Language Review and Final Challenge.',
            'Your result card shows how you did.',
            'The app then suggests your next book.',
          ],
        },
        {
          icon: 'FileText',
          heading: 'The PDFs',
          steps: [
            'Story book: The story and the activities on paper. Its QR codes open the same page in the app. You can also choose Story only or Story + Workbook.',
            'Self-Study Guide: The study plan on paper.',
            'Open the book menu. The PDFs are under Printable PDFs.',
            'A PDF opens in your browser. You can print it or save it.',
          ],
        },
        {
          icon: 'Lightbulb',
          heading: 'Good to know',
          steps: [
            'No account is needed. Your work is saved on this device.',
            'Save this book offline in the menu to read without internet.',
            'Install app on the home page puts the library on your device like an app.',
          ],
        },
      ],
    },
    ar: {
      title: 'دليل الاستخدام',
      subtitle: 'كيف تتعلم وحدك بالتطبيق وملفات PDF',
      intro: 'يمكنك أن تتعلم بهذه الكتب دون صف. يبيّن لك هذا الدليل كيف تعرف مستواك، وكيف تدرس كل فصل، وكيف تستخدم ملفات PDF.',
      sections: [
        {
          icon: 'LockKeyhole',
          heading: 'ابدأ',
          steps: [
            'افتح رابط التطبيق على حاسوب أو جهاز لوحي أو هاتف.',
            'اكتب رمز الدخول الذي وصلك.',
            'اختر «وحدي». يمكنك تغيير ذلك لاحقًا من الصفحة الرئيسية.',
            'اختر العربية أو الإنجليزية في الأعلى.',
          ],
        },
        {
          icon: 'Target',
          heading: 'اعرف مستواك',
          steps: [
            'أجرِ «اختبار المستوى» في الصفحة الرئيسية. عشرة أسئلة قصيرة تقترح لك مستوى.',
            'بعدها تعرض الصفحة الرئيسية كتابًا في ذلك المستوى.',
            'ويمكنك أيضًا أن تختار بنفسك أي قصة وأي مستوى: A2 أو B1 أو B2.',
          ],
        },
        {
          icon: 'BookOpen',
          heading: 'ادرس فصلًا واحدًا',
          steps: [
            '«قبل القراءة»: انظر أو خمّن أو ابحث عن الجواب بسرعة.',
            'استمع مرة وتابع النص.',
            'اقرأ جزءًا قصيرًا في كل مرة. اضغط على كلمة تحتها خط لترى معناها.',
            'أكمل «تحدٍّ سريع». بعد إجابة غير صحيحة جد جملة الإجابة، واقرأها مرة أخرى، وحاول مرة أخرى.',
            'انظر في «التركيز اللغوي» وتحقق من «أستطيع».',
            'للأسئلة التي ليس لها إجابة واحدة مثال إجابة. أجب أولًا ثم انظر.',
          ],
        },
        {
          icon: 'BookMarked',
          heading: 'احفظ كلماتك',
          steps: [
            'اضغط على كلمة تحتها خط واختر «احفظ في كلماتي».',
            'افتح «كلماتي» من القائمة وراجعها بعد يوم، ثم بعد ثلاثة أيام، ثم بعد أسبوع.',
          ],
        },
        {
          icon: 'Scroll',
          heading: '«الرحلة»: دفتر رحلتك',
          steps: [
            'افتح «الرحلة» من الصفحة الرئيسية. وفي الهاتف لها تبويب خاص.',
            'أكمل «التحدي السريع» في فصل، فيُختم ختمه في دفترك.',
            'أكمل «التحدي النهائي» في كتاب، فيُختم الكتاب.',
            'إن شئت، اختر هدفًا أسبوعيًا. يبدأ أسبوع جديد يوم الاثنين، ولا يضيع شيء مما كسبته.',
            'أكمل كل كتب مستوى واحد بلغة واحدة، فتصبح شهادتك لذلك المستوى جاهزة.',
            'جهاز جديد؟ اختر «اعرض رمزي» هنا، ثم «عندي رمز» على الجهاز الجديد.',
          ],
        },
        {
          icon: 'Notepad',
          heading: 'دليل الدراسة الذاتية',
          steps: [
            'لكل كتاب «دليل الدراسة الذاتية» في القائمة.',
            'فيه خطة دراسة لكل فصل، ويخبرك بما تفعله بعد ذلك.',
            'ابدأ بـ«ضع خطتك». وعندما تنهي الكتاب أجب عن «نظرة إلى الوراء».',
          ],
        },
        {
          icon: 'Trophy',
          heading: 'أنهِ الكتاب',
          steps: [
            'أكمل «اختبار المعرفة» و«تحدي المفردات» و«مراجعة اللغة» و«التحدي النهائي».',
            '«بطاقة النتيجة» تبيّن لك نتيجتك.',
            'ثم يقترح عليك التطبيق كتابك التالي.',
          ],
        },
        {
          icon: 'FileText',
          heading: 'ملفات PDF',
          steps: [
            'كتاب القصة: القصة والأنشطة على الورق. ورموز QR فيه تفتح الصفحة نفسها في التطبيق. ويمكنك أيضًا أن تختار «القصة فقط» أو «القصة وكراسة الأنشطة».',
            '«دليل الدراسة الذاتية»: خطة الدراسة على الورق.',
            'افتح قائمة الكتاب. الملفات تحت «ملفات PDF للطباعة».',
            'يُفتح ملف PDF في المتصفح. يمكنك أن تطبعه أو تحفظه.',
          ],
        },
        {
          icon: 'Lightbulb',
          heading: 'من المفيد أن تعرف',
          steps: [
            'لا تحتاج إلى حساب. يُحفظ عملك على هذا الجهاز.',
            '«احفظ هذا الكتاب للقراءة دون اتصال» في القائمة لتقرأ بلا إنترنت.',
            '«ثبّت التطبيق» في الصفحة الرئيسية يضع المكتبة على جهازك مثل تطبيق.',
          ],
        },
      ],
    },
  },
};
