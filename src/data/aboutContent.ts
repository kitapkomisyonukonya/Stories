/**
 * About & Sources page content. The About texts and the team come from the approved
 * MEB presentation (v61) and the project's media kit. The source list is a draft compiled
 * from the presentation's bibliography and the references cited inside the stories;
 * it will be replaced by the project team's own list.
 */

type Localized = { en: string; ar: string };

export interface SourceEntry {
  text: string;
  url?: string;
}

export interface SourceGroup {
  /** 'general', or a story id whose translated name becomes the heading. */
  id: string;
  title?: Localized;
  sources: SourceEntry[];
  /** Qur’an verses and hadith the book's text cites inline. */
  citations?: { label: Localized; text: Localized }[];
}

/** The About page is shown in Turkish, English or Arabic; the reader picks it on the page. */
export type AboutLang = 'tr' | 'en' | 'ar';
export type Tri = Record<AboutLang, string>;

export const aboutIntro = {
  name: 'Lisandan Kültüre',
  names: { en: 'From Language to Culture', ar: 'من اللسان إلى الثقافة' },
  subtitle: {
    tr: 'Yabancı Dil, Kültür, Tarih ve Değerlerimiz Dijital Kütüphane Projesi',
    en: 'A digital library project for foreign languages, culture, history and our values',
    ar: 'مشروع مكتبة رقمية للغات الأجنبية والثقافة والتاريخ وقيمنا',
  } as Tri,
  tagline: {
    tr: 'Kendi medeniyetimizi dünyanın dilleriyle anlatan bir kütüphane.',
    en: 'A library that tells our own civilization in the languages of the world.',
    ar: 'مكتبة تروي حضارتنا بلغات العالم.',
  } as Tri,
  videoId: 'elzWNbBBaGA',
};

/** Wording follows the MEB presentation and the project dossier; translations keep the same sentences. */
export const aboutAim = {
  title: { tr: 'Amaç ve Vizyon', en: 'Aim and Vision', ar: 'الهدف والرؤية' } as Tri,
  lead: {
    tr: 'Bu projenin amacı yeni bir dil öğrenen öğrencilerimize konusunu kendi tarih, kültür ve ortak hafızamızdan alan seviyelendirilmiş dil öğretim materyalleri sunmaktır.',
    en: 'The aim of this project is to offer our students who are learning a new language levelled language-teaching materials whose subjects come from our own history, culture and shared memory.',
    ar: 'يهدف هذا المشروع إلى أن يقدّم لطلابنا الذين يتعلّمون لغة جديدة موادَّ تعليمية متدرّجة المستوى، تستمدّ موضوعاتها من تاريخنا وثقافتنا وذاكرتنا المشتركة.',
  } as Tri,
  aims: [
    {
      tr: 'Sürekli büyüyen bir dijital yabancı dil, kültür ve değerler kütüphanesi oluşturmaktır.',
      en: 'To build a digital library of foreign languages, culture and values that keeps growing.',
      ar: 'إنشاء مكتبة رقمية للغات الأجنبية والثقافة والقيم تنمو باستمرار.',
    },
    {
      tr: 'İngilizce ve Arapça öğrenen öğrencilere ders kitabının yanında destekleyici yabancı dil materyalleri hazırlamaktır.',
      en: 'To prepare supporting foreign-language materials for students of English and Arabic to use alongside their coursebook.',
      ar: 'إعداد مواد داعمة لتعلّم اللغة الأجنبية لطلاب الإنجليزية والعربية إلى جانب كتابهم المدرسي.',
    },
    {
      tr: 'Öğretmenin sınıfta, öğrencinin okul dışında ve bireysel çalışmada kullanabileceği bütüncül bir öğrenme ortamı tasarlamaktır.',
      en: 'To design a complete learning environment that the teacher can use in class and the student can use outside school and for self-study.',
      ar: 'تصميم بيئة تعلّم متكاملة يستخدمها المعلّم في الصف، ويستخدمها الطالب خارج المدرسة وفي الدراسة الذاتية.',
    },
  ] as Tri[],
  vision: {
    tr: 'Kendi tarih ve medeniyet dünyamızı, öğrenilen yabancı dil üzerinden farklı coğrafyalara taşıyabilecek sürdürülebilir bir içerik kütüphanesi hedeflenmiştir.',
    en: 'The goal is a sustainable content library that can carry our own history and civilization to other parts of the world through the foreign language being learned.',
    ar: 'والغاية مكتبة محتوى مستدامة تنقل تاريخنا وعالمنا الحضاري إلى بقاع مختلفة من العالم عبر اللغة الأجنبية التي يتعلّمها الطالب.',
  } as Tri,
};

export const aboutStats: { value: string; label: Tri; when: Tri }[] = [
  {
    value: '31',
    label: { tr: 'Mevcut seviyelendirilmiş içerik', en: 'Levelled titles available', ar: 'محتوى متدرّج متاح' },
    when: { tr: 'Mevcut', en: 'Now', ar: 'الآن' },
  },
  {
    value: '16 + 15',
    label: { tr: 'İngilizce + Arapça', en: 'English + Arabic', ar: 'الإنجليزية + العربية' },
    when: { tr: 'Mevcut', en: 'Now', ar: 'الآن' },
  },
  {
    value: '60+',
    label: { tr: 'Planlanan yeni içerik', en: 'New titles planned', ar: 'محتوى جديد مخطَّط له' },
    when: { tr: 'Mayıs 2027', en: 'May 2027', ar: 'مايو 2027' },
  },
  {
    value: '≈210',
    label: { tr: 'İlk büyük kütüphane hedefi', en: 'First large library goal', ar: 'هدف المكتبة الكبيرة الأولى' },
    when: { tr: 'Mayıs 2029', en: 'May 2029', ar: 'مايو 2029' },
  },
];

export const aboutLibrary = {
  title: { tr: 'Mevcut Kütüphane', en: 'The Library Today', ar: 'المكتبة اليوم' } as Tri,
  lead: {
    tr: 'Kendi tarihimizden ve medeniyet dünyamızdan beslenen, seviyelendirilmiş dijital yabancı dil materyallerinden oluşan bir kütüphane oluşturulmuştur.',
    en: 'A library of levelled digital foreign-language materials, drawn from our own history and civilization, has been built.',
    ar: 'أُنشئت مكتبة من المواد الرقمية المتدرّجة لتعلّم اللغات الأجنبية، تستمدّ مادّتها من تاريخنا وعالمنا الحضاري.',
  } as Tri,
  /** The six story sets; `accent` is the collection colour used in the app. */
  sets: [
    { name: { tr: 'Hz. Âdem', en: 'Prophet Adam', ar: 'النبي آدم' }, group: { tr: 'Peygamberler', en: 'Prophets', ar: 'الأنبياء' }, accent: '#D8B35C' },
    { name: { tr: 'Hz. İbrâhim', en: 'Prophet Abraham', ar: 'النبي إبراهيم' }, group: { tr: 'Peygamberler', en: 'Prophets', ar: 'الأنبياء' }, accent: '#D8B35C' },
    { name: { tr: 'Hz. Mûsâ', en: 'Prophet Moses', ar: 'النبي موسى' }, group: { tr: 'Peygamberler', en: 'Prophets', ar: 'الأنبياء' }, accent: '#D8B35C' },
    { name: { tr: 'Mekke & Bilâl-i Habeşî', en: 'Mecca & Bilal', ar: 'مكة وبلال الحبشي' }, group: { tr: 'Tarih / Siyer', en: 'History / Sirah', ar: 'التاريخ / السيرة' }, accent: '#55C997' },
    { name: { tr: 'Yunus Emre', en: 'Yunus Emre', ar: 'يونس إمره' }, group: { tr: 'Türk-İslâm Mirası', en: 'Turkish-Islamic Heritage', ar: 'التراث التركي الإسلامي' }, accent: '#58CBE0' },
    { name: { tr: 'Endülüs', en: 'Muslim Spain', ar: 'الأندلس' }, group: { tr: 'Tarih / Medeniyet', en: 'History / Civilization', ar: 'التاريخ / الحضارة' }, accent: '#55C997' },
  ] as { name: Tri; group: Tri; accent: string }[],
  levels: 'A2 · B1 · B2',
};

export const aboutFeatures = {
  title: { tr: 'Bağımsız ve Bütüncül Bir Dijital Kütüphane', en: 'An Independent, Complete Digital Library', ar: 'مكتبة رقمية مستقلّة ومتكاملة' } as Tri,
  lead: {
    tr: 'Lisandan Kültüre, aşağıdaki unsurları kültür ve medeniyet içeriği etrafında tek bir yapıda bir araya getirmektedir.',
    en: 'Lisandan Kültüre brings the following together in one structure, around content on culture and civilization.',
    ar: 'تجمع «من اللسان إلى الثقافة» العناصر الآتية في بنية واحدة حول محتوى الثقافة والحضارة.',
  } as Tri,
  items: [
    { tr: 'Seviyeli hikâyeler · A2 · B1 · B2', en: 'Levelled stories · A2 · B1 · B2', ar: 'قصص متدرّجة · A2 · B1 · B2' },
    { tr: 'Aynı hikâye İngilizce ve Arapça', en: 'The same story in English and Arabic', ar: 'القصة نفسها بالإنجليزية والعربية' },
    { tr: 'Her bölüm için seslendirme', en: 'Narration for every chapter', ar: 'تسجيل صوتي لكل فصل' },
    { tr: 'Bölüme özel alıştırmalar', en: 'Exercises written for each chapter', ar: 'تمارين خاصة بكل فصل' },
    { tr: 'Öğretmen ve öğrenci rehberleri', en: 'Teacher and student guides', ar: 'أدلّة للمعلّم والطالب' },
    { tr: 'Yolculuk haritaları', en: 'Journey maps', ar: 'خرائط الرحلة' },
    { tr: 'Yerler ve Kişiler kartları', en: 'Places & People cards', ar: 'بطاقات الأماكن والأعلام' },
    { tr: 'Basılabilir PDF kitaplar', en: 'Printable PDF books', ar: 'كتب PDF قابلة للطباعة' },
    { tr: 'Kelime notları ve sözlük', en: 'Word notes and glossary', ar: 'ملاحظات المفردات والمعجم' },
    { tr: 'Kitap sonu etkinlikleri', en: 'End-of-book activities', ar: 'أنشطة نهاية الكتاب' },
    { tr: 'Harekeli ve harekesiz Arapça', en: 'Arabic with and without vowel marks', ar: 'العربية بالحركات ومن دونها' },
    { tr: 'Her cihazdan erişim', en: 'Access from any device', ar: 'الوصول من أي جهاز' },
  ] as Tri[],
  support: {
    tr: 'Aynı öğrenme paketi sınıfta öğretmen eşliğinde, evde bireysel olarak ve çevrim dışı biçimde kullanılabilmektedir.',
    en: 'The same learning package can be used in class with a teacher, at home on one’s own, and offline.',
    ar: 'يمكن استخدام حزمة التعلّم نفسها في الصف بإشراف المعلّم، وفي البيت فرديًّا، ومن دون اتصال بالإنترنت.',
  } as Tri,
};

export const aboutStandards = {
  title: { tr: 'İçerik Standardı ve Özellikleri', en: 'Content Standard', ar: 'معايير المحتوى' } as Tri,
  lead: {
    tr: 'İçerik doğruluğu, ortak yazım standardı ve dil düzeyi uygunluğu aynı üretim zinciri içerisinde birlikte yönetilmiştir.',
    en: 'Accuracy of content, a shared spelling standard and fit to language level were managed together in the same production chain.',
    ar: 'أُديرت دقّة المحتوى ومعيار الكتابة الموحّد وملاءمة المستوى اللغوي معًا في سلسلة إنتاج واحدة.',
  } as Tri,
  items: [
    {
      title: { tr: 'Akademik güvenilirlik ve doğruluk', en: 'Academic reliability and accuracy', ar: 'الموثوقية الأكاديمية والدقّة' },
      text: {
        tr: 'İçerikler farklı akademik kaynaklardan istifade edilerek insan tarafından üretilmiş metinlerdir.',
        en: 'The texts were written by people, drawing on a range of academic sources.',
        ar: 'المحتوى نصوصٌ كتبها الإنسان مستفيدًا من مصادر أكاديمية مختلفة.',
      },
    },
    {
      title: { tr: 'Alan uzmanı geri bildirimi', en: 'Feedback from subject experts', ar: 'ملاحظات المتخصّصين' },
      text: {
        tr: 'Kontrol, geri bildirim ve sürekli revizyon döngüsü oluşturulmuştur.',
        en: 'A cycle of checking, feedback and continuous revision was set up.',
        ar: 'أُنشئت دورة من المراجعة والملاحظات والتنقيح المستمرّ.',
      },
    },
    {
      title: { tr: 'Bilimsel literatüre uygun kelime ve terim seçimi', en: 'Words and terms true to the scholarly literature', ar: 'اختيار المفردات والمصطلحات وفق الأدبيات العلمية' },
      text: {
        tr: 'Kelime ve terimler konu literatürü, tarihsel bağlam ve öğrenci seviyesi birlikte gözetilerek seçilmiştir.',
        en: 'Words and terms were chosen with the subject literature, the historical context and the student’s level in mind together.',
        ar: 'اختيرت المفردات والمصطلحات بمراعاة أدبيات الموضوع والسياق التاريخي ومستوى الطالب معًا.',
      },
    },
    {
      title: { tr: 'Dil Seviyelendirmesi', en: 'Language levelling', ar: 'تدريج المستوى اللغوي' },
      text: {
        tr: 'Türkiye Yüzyılı Maarif Modeli’nin yabancı dil alan becerileri ve yöntemsel yaklaşımları, CEFR düzeyleriyle birlikte ele alınmıştır.',
        en: 'The foreign-language skills and methods of the Türkiye Century Maarif Model were applied together with the CEFR levels.',
        ar: 'رُوعيت مهارات اللغة الأجنبية ومناهجها في نموذج معارف قرن تركيا، مع مستويات الإطار الأوروبي المرجعي (CEFR).',
      },
    },
    {
      title: { tr: 'DKAB İmla Standartları', en: 'DKAB spelling standards', ar: 'معايير الإملاء في مادة الثقافة الدينية' },
      text: {
        tr: 'DKAB İmla Kılavuzu’nda yer alan standartlar kullanılmıştır.',
        en: 'The standards of the DKAB Spelling Guide were used.',
        ar: 'اعتُمدت المعايير الواردة في دليل الإملاء لمادة الثقافة الدينية والمعرفة الأخلاقية (DKAB).',
      },
    },
  ] as { title: Tri; text: Tri }[],
  aiTitle: { tr: 'Yapay Zekâ Kullanımı', en: 'Use of Artificial Intelligence', ar: 'استخدام الذكاء الاصطناعي' } as Tri,
  ai: {
    tr: 'Yapay zekâ içerik üretim sürecinde yalnızca destek aracı olarak kullanılmış ve tüm kararlar insan kontrolünde verilmiştir.',
    en: 'Artificial intelligence was used in content production only as a support tool, and every decision was made under human control.',
    ar: 'استُخدم الذكاء الاصطناعي في إنتاج المحتوى أداةً مساعدةً فقط، واتُّخذت القرارات كلّها تحت إشراف الإنسان.',
  } as Tri,
};

/** Project team, word for word from the team slide of the MEB presentation (v61). */
export const teamIntro: Tri = {
  tr: 'İçerik geliştirme, bilimsel danışmanlık, dil editörlüğü ve dijital tasarım süreci.',
  en: 'Content development, academic advice, language editing and digital design.',
  ar: 'تطوير المحتوى والاستشارة العلمية والتحرير اللغوي والتصميم الرقمي.',
};

export const projectCoordinator = {
  role: { tr: 'Proje Koordinatörü - Editör', en: 'Project Coordinator - Editor', ar: 'منسّق المشروع - المحرّر' } as Tri,
  name: 'Dr. Ahmet Ağralı',
};

export interface TeamRole {
  role: Tri;
  members: string[];
  note?: Tri;
}

export interface TeamSection {
  title: Tri;
  roles: TeamRole[];
}

export const teamSections: TeamSection[] = [
  {
    title: { tr: 'İngilizce Bölümü', en: 'English Section', ar: 'القسم الإنجليزي' },
    roles: [
      {
        role: { tr: 'Metin Yazarı ve Editör', en: 'Author and Editor', ar: 'كاتبة النصوص والمحرّرة' },
        members: ['Selma Özülkü'],
        note: { tr: 'Bilim Uzmanı / İslam Tarihi ve Sanatları', en: 'MA, Islamic History and Arts', ar: 'ماجستير في التاريخ الإسلامي والفنون' },
      },
      { role: { tr: 'Metin İnceleme', en: 'Text Review', ar: 'مراجعة النصوص' }, members: ['Yunus Emre Yılmaz'] },
    ],
  },
  {
    title: { tr: 'Arapça Bölümü', en: 'Arabic Section', ar: 'القسم العربي' },
    roles: [
      { role: { tr: 'Editör', en: 'Editor', ar: 'المحرّر' }, members: ['Dr. Ahmet Ağralı'] },
      {
        role: { tr: 'Çeviri ve Metin İnceleme', en: 'Translation and Text Review', ar: 'الترجمة ومراجعة النصوص' },
        members: ['Dr. İshak Doğan', 'Dr. Rabia Okutan', 'Hasan Arslan', 'Sümeyye Akten'],
      },
    ],
  },
  {
    title: { tr: 'Yazılım Geliştirme ve Dijital Tasarım', en: 'Software Development and Digital Design', ar: 'تطوير البرمجيات والتصميم الرقمي' },
    roles: [{ role: { tr: 'Yazılım ve tasarım', en: 'Software and design', ar: 'البرمجيات والتصميم' }, members: ['Yunus Emre Yılmaz'] }],
  },
];

export interface BoardMember {
  name: string;
  university: Tri;
  department: Tri;
}

const theologyIslamicHistory: Tri = {
  tr: 'İlahiyat Fak. · İslam Tarihi ve Sanatları ABD',
  en: 'Faculty of Theology · Islamic History and Arts',
  ar: 'كلية الإلهيات · قسم التاريخ الإسلامي والفنون',
};
const neu: Tri = { tr: 'Necmettin Erbakan Üniversitesi', en: 'Necmettin Erbakan University', ar: 'جامعة نجم الدين أربكان' };
const selcuk: Tri = { tr: 'Selçuk Üniversitesi', en: 'Selçuk University', ar: 'جامعة سلجوق' };

export const advisoryBoard: BoardMember[] = [
  { name: 'Prof. Dr. Ahmet Turan Yüksel', university: neu, department: theologyIslamicHistory },
  { name: 'Prof. Dr. Mithat Eser', university: selcuk, department: theologyIslamicHistory },
  {
    name: 'Prof. Dr. Bilal Kuşpınar',
    university: neu,
    department: {
      tr: 'Sosyal ve Beşeri Bilimler Fak. · Felsefe Tarihi',
      en: 'Faculty of Social Sciences and Humanities · History of Philosophy',
      ar: 'كلية العلوم الاجتماعية والإنسانية · تاريخ الفلسفة',
    },
  },
  {
    name: 'Prof. Dr. Resul Ay',
    university: { tr: 'Hacettepe Üniversitesi', en: 'Hacettepe University', ar: 'جامعة حاجة تبه' },
    department: {
      tr: 'Edebiyat Fak. · Tarih Bölümü · Ortaçağ ABD',
      en: 'Faculty of Letters · Department of History · Medieval History',
      ar: 'كلية الآداب · قسم التاريخ · تاريخ العصور الوسطى',
    },
  },
  { name: 'Dr. Yusuf Büyükyılmaz', university: selcuk, department: theologyIslamicHistory },
];

export const boardNote: Tri = {
  tr: 'Akademik danışmanlık ve bilimsel geri bildirim desteği',
  en: 'Academic advice and scholarly feedback',
  ar: 'الاستشارة الأكاديمية والملاحظات العلمية',
};

/** Media kit: the files live on Cloudflare R2 (README, "Book PDFs"); the server redirects these paths there. */
export const mediaKit = {
  title: { tr: 'Medya Paketi', en: 'Media Kit', ar: 'الحزمة الإعلامية' } as Tri,
  lead: {
    tr: 'Medya paketi üç parçadan oluşur. Paketteki dosyalar okul, kurum ve basın duyurularında Marka Rehberi’ndeki kurallara uygun olarak kullanılabilir.',
    en: 'The media kit has three parts. Its files may be used in school, institutional and press announcements in line with the rules of the Brand Guide.',
    ar: 'تتكوّن الحزمة الإعلامية من ثلاثة أجزاء. ويمكن استخدام ملفاتها في إعلانات المدارس والمؤسسات والصحافة وفق قواعد دليل الهوية.',
  } as Tri,
  /** The guides themselves are written in Turkish. */
  inTurkish: { tr: 'Türkçe', en: 'In Turkish', ar: 'باللغة التركية' } as Tri,
  files: [
    {
      id: 'brand',
      title: { tr: 'Marka Rehberi', en: 'Brand Guide', ar: 'دليل الهوية' },
      text: {
        tr: 'Projenin adı, tanıtım metinleri, logo ve kullanım kuralları, renk kodları ve yazı tipleri.',
        en: 'The project’s name, introduction texts, logo and its rules of use, colour codes and typefaces.',
        ar: 'اسم المشروع ونصوصه التعريفية والشعار وقواعد استخدامه ورموز الألوان والخطوط.',
      },
      href: '/pdfs/media-kit/lisandan-kulture-marka-rehberi.pdf',
      kind: 'PDF',
      size: '4,7 MB',
    },
    {
      id: 'visual',
      title: { tr: 'Görsel Dil Rehberi', en: 'Visual Style Guide', ar: 'دليل الأسلوب البصري' },
      text: {
        tr: 'Hikâyelere göre resim üslupları, her seviyeden örnek resimler ve bütün resimlerde uyulan görsel ilkeler.',
        en: 'The illustration style of each story, sample pictures from every level and the visual principles followed in all pictures.',
        ar: 'أساليب الرسم لكل قصة، ونماذج من رسوم كل مستوى، والمبادئ البصرية المتّبعة في جميع الرسوم.',
      },
      href: '/pdfs/media-kit/lisandan-kulture-gorsel-dil-rehberi.pdf',
      kind: 'PDF',
      size: '9,3 MB',
    },
    {
      id: 'logo',
      title: { tr: 'Logo Dosyaları', en: 'Logo Files', ar: 'ملفات الشعار' },
      text: {
        tr: 'Logo ve logotipin yüksek çözünürlüklü, saydam zeminli PNG dosyaları ile koleksiyon simgeleri.',
        en: 'High-resolution PNG files of the logo and logotype on a transparent background, with the collection icons.',
        ar: 'ملفات PNG عالية الدقّة بخلفية شفافة للشعار والشعار النصّي، مع أيقونات المجموعات.',
      },
      href: '/pdfs/media-kit/lisandan-kulture-logo-dosyalari.zip',
      kind: 'ZIP',
      size: '3,5 MB',
    },
  ] as { id: string; title: Tri; text: Tri; href: string; kind: string; size: string }[],
  logoText: {
    tr: 'Logo, kemer biçimli altın çerçeve, açık kitap ve kitabın üzerinde yükselen ışıktan oluşur. Logo tek başına veya projenin adıyla birlikte (logotip) kullanılır.',
    en: 'The logo is made of an arch-shaped gold frame, an open book and a light rising above the book. It is used on its own or together with the project’s name (logotype).',
    ar: 'يتكوّن الشعار من إطار ذهبي على هيئة قوس، وكتاب مفتوح، ونور يرتفع فوق الكتاب. ويُستخدم الشعار وحده أو مع اسم المشروع (الشعار النصّي).',
  } as Tri,
  nameNote: {
    tr: 'Ad Türkçe metinlerde Türkçe, İngilizce ve Arapça metinlerde o dildeki karşılığıyla yazılır. Ad kesme işaretiyle bölünmez ve kısaltılmaz.',
    en: 'The name is written in Turkish in Turkish texts, and with its English or Arabic equivalent in English and Arabic texts. It is never split with an apostrophe or shortened.',
    ar: 'يُكتب الاسم بالتركية في النصوص التركية، وبمقابله الإنجليزي أو العربي في النصوص الإنجليزية والعربية. ولا يُفصل بعلامة الفاصلة العليا ولا يُختصر.',
  } as Tri,
  colorsText: {
    tr: 'Lisandan Kültüre’nin ana renkleri gece laciverti ve altındır. Zümrüt yeşili yardımcı renk olarak kullanılır. CMYK değerleri yaklaşıktır, baskı öncesinde prova ile kontrol edilmelidir.',
    en: 'The main colours of Lisandan Kültüre are night navy and gold. Emerald green is used as a supporting colour. CMYK values are approximate and should be checked with a proof before printing.',
    ar: 'اللونان الرئيسيان لـ«من اللسان إلى الثقافة» هما الكحلي الليلي والذهبي، ويُستخدم الأخضر الزمرّدي لونًا مساعدًا. قيم CMYK تقريبية، وينبغي التحقّق منها بنسخة تجريبية قبل الطباعة.',
  } as Tri,
  fontsText: {
    tr: 'Türkçe, İngilizce ve diğer Latin harfli yazılar için Poppins, Arapça yazılar için Arakom yazı tipi kullanılır.',
    en: 'Poppins is used for Turkish, English and other Latin-script texts, and Arakom for Arabic texts.',
    ar: 'يُستخدم خط Poppins للنصوص التركية والإنجليزية وسائر النصوص بالحروف اللاتينية، وخط Arakom للنصوص العربية.',
  } as Tri,
};

export interface BrandColor {
  name: Tri;
  hex: string;
  rgb: string;
  cmyk?: string;
  use: Tri;
}

export const brandColors: BrandColor[] = [
  { name: { tr: 'Gece Laciverti', en: 'Night Navy', ar: 'الكحلي الليلي' }, hex: '#0A1120', rgb: '10 · 17 · 32', cmyk: '69 · 47 · 0 · 87', use: { tr: 'Kapaklar, koyu zeminler, başlıklar', en: 'Covers, dark backgrounds, headings', ar: 'الأغلفة والخلفيات الداكنة والعناوين' } },
  { name: { tr: 'Altın', en: 'Gold', ar: 'الذهبي' }, hex: '#E2B559', rgb: '226 · 181 · 89', cmyk: '0 · 20 · 61 · 11', use: { tr: 'Logo adı, vurgular, numaralar', en: 'Logo name, highlights, numbers', ar: 'اسم الشعار والإبراز والأرقام' } },
  { name: { tr: 'Açık Altın', en: 'Light Gold', ar: 'الذهبي الفاتح' }, hex: '#F7DD9C', rgb: '247 · 221 · 156', cmyk: '0 · 11 · 37 · 3', use: { tr: 'Altın geçişin açık ucu', en: 'Light end of the gold gradient', ar: 'الطرف الفاتح من التدرّج الذهبي' } },
  { name: { tr: 'Koyu Altın', en: 'Dark Gold', ar: 'الذهبي الداكن' }, hex: '#C99A3E', rgb: '201 · 154 · 62', cmyk: '0 · 23 · 69 · 21', use: { tr: 'Açık zeminde altın yazı ve çizgiler', en: 'Gold text and lines on light backgrounds', ar: 'النصوص والخطوط الذهبية على الخلفيات الفاتحة' } },
  { name: { tr: 'Zümrüt', en: 'Emerald', ar: 'الزمرّدي' }, hex: '#1E8C6B', rgb: '30 · 140 · 107', cmyk: '79 · 0 · 24 · 45', use: { tr: 'Bölüm etiketleri, simgeler, onay işaretleri', en: 'Section labels, icons, check marks', ar: 'تسميات الأقسام والأيقونات وعلامات التأكيد' } },
  { name: { tr: 'Kâğıt', en: 'Paper', ar: 'الورقي' }, hex: '#FBF8F1', rgb: '251 · 248 · 241', cmyk: '0 · 1 · 4 · 2', use: { tr: 'İç sayfa zemini', en: 'Inner page background', ar: 'خلفية الصفحات الداخلية' } },
  { name: { tr: 'Mürekkep', en: 'Ink', ar: 'الحبري' }, hex: '#18202E', rgb: '24 · 32 · 46', cmyk: '48 · 30 · 0 · 82', use: { tr: 'Metin rengi', en: 'Text colour', ar: 'لون النص' } },
  { name: { tr: 'Gri', en: 'Grey', ar: 'الرمادي' }, hex: '#5D6779', rgb: '93 · 103 · 121', cmyk: '23 · 15 · 0 · 53', use: { tr: 'Açıklama ve dipnot metinleri', en: 'Captions and footnotes', ar: 'نصوص الشروح والحواشي' } },
];

export const collectionColors: BrandColor[] = [
  { name: { tr: 'Peygamberler', en: 'Stories of the Prophets', ar: 'قصص الأنبياء' }, hex: '#D8B35C', rgb: '216 · 179 · 92', use: { tr: 'Koleksiyon rengi', en: 'Collection colour', ar: 'لون المجموعة' } },
  { name: { tr: 'İslam Tarihi ve Medeniyeti', en: 'Islamic History & Civilization', ar: 'التاريخ الإسلامي والحضارة' }, hex: '#55C997', rgb: '85 · 201 · 151', use: { tr: 'Koleksiyon rengi', en: 'Collection colour', ar: 'لون المجموعة' } },
  { name: { tr: 'Türk-İslâm Mirası', en: 'Turkish-Islamic Heritage', ar: 'التراث التركي الإسلامي' }, hex: '#58CBE0', rgb: '88 · 203 · 224', use: { tr: 'Koleksiyon rengi', en: 'Collection colour', ar: 'لون المجموعة' } },
];

const quranLabel: Localized = { en: 'Qur’an', ar: 'القرآن الكريم' };
const hadithLabel: Localized = { en: 'Hadith', ar: 'الحديث الشريف' };

export const sourceGroups: SourceGroup[] = [
  {
    id: 'general',
    title: { en: 'General sources', ar: 'مصادر عامة' },
    sources: [
      { text: 'TDV İslâm Ansiklopedisi, related entries.', url: 'https://islamansiklopedisi.org.tr' },
      { text: 'Türk Maarif Ansiklopedisi, related entries.', url: 'https://turkmaarifansiklopedisi.org.tr' },
      { text: 'Diyanet İşleri Başkanlığı. Kur’an-ı Kerim Meali.', url: 'https://kuran.diyanet.gov.tr' },
      { text: 'Diyanet İşleri Başkanlığı. Hadislerle İslam. İstanbul, 2020.' },
      { text: 'Ibn Kathir. Stories of the Prophets. Tr. Muhammad Mustafa Geme’ah. Al-Azhar.' },
      { text: 'Köksal, Mustafa Asım. Peygamberler Tarihi. Ankara, 2007.' },
      { text: 'Hamidullah, Muhammed. Introduction to Islam. Ankara, 2011.' },
      { text: 'Yusuf Ali. The Holy Qur’an. Lahore, 1937.' },
      { text: 'Pickthall, Muhammad Marmaduke. The Meaning of the Glorious Qur’an. New York, 1930.' },
      { text: 'Öztürk, Abdul Sedar. The Qur’an. İstanbul, 2003.' },
    ],
  },
  {
    id: 'adam',
    sources: [],
    citations: [
      { label: quranLabel, text: { en: 'al-Isra 70 · an-Nisa 163–165 · Sad 72', ar: 'الإسراء ٧٠ · النساء ١٦٣–١٦٥ · ص ٧٢' } },
      { label: hadithLabel, text: { en: 'Abu Dawud, Sunnah 16 · Tirmidhi, Tafsir 2/1 · Muslim, Jumu‘ah 17, 18 · Tirmidhi, Jumu‘ah 1, 2 · Nasa’i, Jumu‘ah 4, 45', ar: 'أبو داود، السنة ١٦ · الترمذي، التفسير ٢/١ · مسلم، الجمعة ١٧، ١٨ · الترمذي، الجمعة ١، ٢ · النسائي، الجمعة ٤، ٤٥' } },
    ],
  },
  {
    id: 'ibrahim',
    sources: [{ text: 'Kuzgun, Şaban. İslam Kaynaklarına Göre Hz. İbrahim ve Haniflik. Ankara, 1985.' }],
    citations: [
      {
        label: quranLabel,
        text: { en: 'al-Baqarah 124, 127, 258 · Al Imran 96 · al-An’am 74, 77, 80–83 · Ibrahim 37 · al-Anbiya 51, 68–70 · al-Ankabut 24, 26 · as-Saffat 91–92, 101–106 · Fussilat 37', ar: 'البقرة ١٢٤، ١٢٧، ٢٥٨ · آل عمران ٩٦ · الأنعام ٧٤، ٧٧، ٨٠–٨٣ · إبراهيم ٣٧ · الأنبياء ٥١، ٦٨–٧٠ · العنكبوت ٢٤، ٢٦ · الصافات ٩١–٩٢، ١٠١–١٠٦ · فصّلت ٣٧' },
      },
    ],
  },
  {
    id: 'musa',
    sources: [
      {
        text: 'Harman, Ömer Faruk (ed.). Kur’an’da Yahudiler. “Kur’an Kıssaları Bağlamında Yahudi (İsrail) Tarihi” (Mehmet Katar). İstanbul 29 Mayıs Üniversitesi Kur’an Araştırmaları Merkezi Yayınları, İstanbul, 2019.',
      },
    ],
    citations: [
      { label: quranLabel, text: { en: 'al-A’raf 142 · Taha 9–24 · ash-Shu’ara 30–33, 52–68 · al-Qasas 7, 9, 15–21', ar: 'الأعراف ١٤٢ · طه ٩–٢٤ · الشعراء ٣٠–٣٣، ٥٢–٦٨ · القصص ٧، ٩، ١٥–٢١' } },
    ],
  },
  {
    id: 'mecca',
    sources: [
      { text: 'Çelebi, Furkan. Cahiliye Döneminde Mekke. Ankara, 2024.' },
      { text: 'Kelpetin, Mahmut. “Cahiliye,” TÜBİTAK Ansiklopedisi.' },
    ],
    citations: [
      { label: quranLabel, text: { en: 'Al Imran 96 · an-Nahl 58–59 · Ibrahim 37 · az-Zukhruf 31 · Quraysh 1–4', ar: 'آل عمران ٩٦ · النحل ٥٨–٥٩ · إبراهيم ٣٧ · الزخرف ٣١ · قريش ١–٤' } },
      { label: hadithLabel, text: { en: 'Sunan al-Tirmidhi, 3925', ar: 'سنن الترمذي، ٣٩٢٥' } },
    ],
  },
  {
    id: 'yunusEmre',
    sources: [
      { text: 'Bulduk, Üçler. “Yunus Emre Çağında Anadolu’nun Siyasal ve Sosyal Durumu,” DTCF Dergisi Yunus Emre Özel Sayısı, 2021, s. 57-67.' },
      { text: 'Gürer, Banu. “Yunus Emre,” Türk Maarif Ansiklopedisi.', url: 'https://turkmaarifansiklopedisi.org.tr/yunus-emre' },
      { text: 'Kara, Mustafa. “Tekke,” TDV İslâm Ansiklopedisi.', url: 'https://islamansiklopedisi.org.tr/tekke' },
      { text: 'Ocak, Ahmet Yaşar. “Babaîlik,” TDV İslâm Ansiklopedisi.', url: 'https://islamansiklopedisi.org.tr/babailik' },
      { text: 'Ocak, Ahmet Yaşar. Babaîler İsyanı. Dergah Yayınları, İstanbul, 2011.' },
      { text: 'Öngören, Reşat. “Sûfî,” TDV İslâm Ansiklopedisi.', url: 'https://islamansiklopedisi.org.tr/sufi' },
      { text: 'Sevim, Ali. “Keyhüsrev II,” TDV İslâm Ansiklopedisi.', url: 'https://islamansiklopedisi.org.tr/keyhusrev-ii' },
      { text: 'Sümer, Faruk. “Keykubad I,” TDV İslâm Ansiklopedisi.', url: 'https://islamansiklopedisi.org.tr/keykubad-i' },
      { text: 'Sümer, Faruk. “Kösedağ Savaşı,” TDV İslâm Ansiklopedisi.', url: 'https://islamansiklopedisi.org.tr/kosedag-savasi' },
      { text: 'Tatcı, Mustafa. “Yûnus Emre,” TDV İslâm Ansiklopedisi.', url: 'https://islamansiklopedisi.org.tr/yunus-emre' },
      { text: 'Yazıcı, Tahsin. “Derviş,” TDV İslâm Ansiklopedisi.', url: 'https://islamansiklopedisi.org.tr/dervis' },
      { text: 'Yeniterzi, Emine. “Mesnevi-i Şerif ve Risaletü’n-Nushiyye’de Ortak Değerler,” I. Ulusal Yunus Emre Sempozyumu, Karaman, 2010, s. 101-116.' },
    ],
    citations: [{ label: hadithLabel, text: { en: 'Ibn Majah, Zuhd 31, no. 4259', ar: 'ابن ماجه، الزهد ٣١، رقم ٤٢٥٩' } }],
  },
];
