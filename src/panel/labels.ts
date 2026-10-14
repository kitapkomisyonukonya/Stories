/**
 * Plain Turkish names for everything in a book file, so nobody in the panel ever sees a field
 * name like "languageFocusExercises". `help` says in one line what the field does in the app.
 */

export const PAGE_TYPES: Record<string, string> = {
  story: 'Bölüm',
  quiz: 'Knowledge Check',
  'vocabulary-match': 'Vocabulary Challenge',
  exercises: 'Language Review',
  glossary: 'Master Glossary',
  'final-challenge': 'Final Challenge',
  map: 'Yolculuk haritası',
  places: 'Places & People',
};

export const EXERCISE_TYPES: Record<string, { name: string; help: string }> = {
  'multiple-choice': { name: 'Çoktan seçmeli', help: 'Bir soru ve seçenekler; biri doğru.' },
  'true-false': { name: 'Doğru / Yanlış', help: 'Bir cümle; öğrenci doğru mu yanlış mı der.' },
  matching: { name: 'Eşleştirme', help: 'Soldaki her şey sağdakiyle eşleşir.' },
  sequencing: { name: 'Sıralama', help: 'Olayları doğru sırayla yazın; uygulama karıştırıp gösterir.' },
  'fill-blanks': { name: 'Boşluk doldurma', help: 'Cümlede [blank] yerine yazılacak kelime; kabul edilen bütün cevaplar.' },
  'word-bank': { name: 'Kelime bankası', help: 'Boşluklar [blank] ile; bankadaki kelimelerden doğrusu seçilir.' },
  'drag-drop': { name: 'Gruplara ayırma', help: 'Her cümle doğru gruba sürüklenir.' },
  'choose-form': { name: 'Doğru biçimi seçme', help: 'Cümlede [choice] yerine üç biçimden doğrusu seçilir.' },
  'error-correction': { name: 'Hatayı bulma', help: 'Her cümlede bir hata var; öğrenci bulur ve düzeltir.' },
  'sentence-building': { name: 'Cümle kurma', help: 'Parçaları doğru sırayla yazın; uygulama karıştırır.' },
  transformation: { name: 'Dönüştürme', help: 'Hikâyeden bir cümle aynı anlamla başka türlü yazılır.' },
  reflection: { name: 'Düşün ve konuş', help: 'Cevabı tek olmayan sorular; örnek cevap gösterilir.' },
  'tap-reveal': { name: 'Dokun ve gör', help: 'Soruya dokununca cevap açılır.' },
  'quiz-game': { name: 'Bilgi yarışması', help: 'Arka arkaya sorular.' },
  'drag-drop-legacy': { name: 'Sürükle bırak', help: '' },
};

export const GROUP_TYPES: Record<string, string> = { jigsaw: 'Yapboz (jigsaw)', roleplay: 'Canlandırma', mapGap: 'Harita boşluğu', project: 'Proje' };
export const BEFORE_KINDS: Record<string, string> = { picture: 'Resme bak', guess: 'Tahmin et', find: 'Metinde bul (süreli)', skim: 'Hızlı oku (süreli)' };

interface FieldLabel {
  label: string;
  help?: string;
  /** Long texts get a big box. */
  long?: boolean;
  /** Hidden from the form: the app or the panel keeps it right by itself. */
  hidden?: boolean;
}

export const FIELDS: Record<string, FieldLabel> = {
  title: { label: 'Başlık' },
  subtitle: { label: 'Alt başlık' },
  content: { label: 'Metin', long: true, help: 'Paragrafları boş bir satırla ayırın. **kalın** yazmak için iki yıldız kullanın.' },
  image: { label: 'Resim adresi', hidden: true },
  audioUrl: { label: 'Ses adresi', hidden: true },
  syncPoints: { label: 'Ses zamanları', hidden: true },
  timedChunks: { label: 'Ses parçaları', hidden: true },
  id: { label: 'Kimlik', hidden: true },
  type: { label: 'Tür', hidden: true },
  exercises: { label: 'Quick etkinlikleri' },
  languageFocusExercises: { label: 'Focus (Language Focus) etkinlikleri' },
  vocabulary: { label: 'Kelime notları' },
  vocabularyPairs: { label: 'Kelime çiftleri' },
  hotspots: { label: 'Resimdeki noktalar' },
  beforeYouRead: { label: 'Önce oku (Before you read)' },
  iCan: { label: 'I can maddeleri', help: 'Öğrencinin bölüm sonunda kendini değerlendirdiği üç cümle.' },
  groupTask: { label: 'Grup çalışması' },
  map: { label: 'Harita', hidden: true },
  entityBookKey: { label: 'Kart listesi', hidden: true },
  animatedWords: { label: 'Hareketli kelimeler' },

  instructions: { label: 'Yönerge', help: 'A2 en çok 12, B1 16, B2 20 kelime.' },
  question: { label: 'Soru' },
  options: { label: 'Seçenekler' },
  correctAnswer: { label: 'Doğru cevap' },
  explanation: { label: 'Açıklama', long: true, help: 'İkinci denemeden sonra gösterilir.' },
  feedback: { label: 'Geri bildirim' },
  correct: { label: 'Doğru cevapta' },
  incorrect: { label: 'Yanlış cevapta' },
  hint: { label: 'İpucu' },
  hints: { label: 'İpuçları' },
  matchingPairs: { label: 'Eşleşen çiftler' },
  matchingHeadings: { label: 'Sütun başlıkları' },
  left: { label: 'Sol' },
  right: { label: 'Sağ' },
  sequencingItems: { label: 'Olaylar (doğru sırayla)' },
  text: { label: 'Metin', long: true },
  fillBlanksText: { label: 'Boşluklu metin', long: true, help: 'Her boşluğu [blank] diye yazın.' },
  wordBank: { label: 'Kelime bankası' },
  dragDropGroups: { label: 'Gruplar' },
  group: { label: 'Grup adı' },
  items: { label: 'Maddeler' },
  formChoices: { label: 'Cümleler' },
  sentence: { label: 'Cümle', long: true },
  answer: { label: 'Doğru seçenek' },
  errorItems: { label: 'Hatalı cümleler' },
  error: { label: 'Hatalı kısım', help: 'Cümlede birebir geçmeli.' },
  sentenceChunks: { label: 'Parçalar (doğru sırayla)' },
  transformItems: { label: 'Dönüştürülecek cümleler' },
  source: { label: 'Hikâyedeki cümle', long: true },
  frame: { label: 'Yeni cümle', help: 'Boşluğu [blank] diye yazın.', long: true },
  answers: { label: 'Kabul edilen cevaplar' },
  discussionPrompts: { label: 'Sorular' },
  mode: { label: 'Nasıl', help: 'Örneğin pair, group, write.' },
  example: { label: 'Örnek cevap', long: true },
  tapRevealItems: { label: 'Kartlar' },
  quizQuestions: { label: 'Sorular' },
  word: { label: 'Kelime' },
  definition: { label: 'Anlamı', long: true },
  partOfSpeech: { label: 'Kelime türü' },
  pronunciation: { label: 'Okunuşu' },
  storyExample: { label: 'Hikâyedeki cümle', long: true },
  chapter: { label: 'Bölüm' },
  chapterTitle: { label: 'Bölüm adı' },
  category: { label: 'Kategori' },
  meaning: { label: 'Anlamı' },
  context: { label: 'Cümlede', long: true },
  x: { label: 'Soldan (%)' },
  y: { label: 'Yukarıdan (%)' },
  description: { label: 'Açıklama', long: true },
  kind: { label: 'Türü' },
  quote: { label: 'Kanıt cümlesi', help: 'Hikâyeden cevabı gösteren sözcükler.' },
  time: { label: 'Süre' },
  groupSize: { label: 'Grup büyüklüğü' },
  roles: { label: 'Roller' },
  name: { label: 'Ad' },
  job: { label: 'Görevi' },
  steps: { label: 'Adımlar' },
  share: { label: 'Sınıfa ne gösterilir', long: true },
  solo: { label: 'Tek başına çalışan öğrenci için', long: true },

  // Teacher's Book and self-study guide
  timing: { label: 'Süre' },
  objectives: { label: 'Hedefler' },
  pedagogy: { label: 'Yaklaşım', long: true },
  priorKnowledge: { label: 'Ön bilgi' },
  anticipatedMisconceptions: { label: 'Olası yanlış anlamalar' },
  grammarFocus: { label: 'Dil bilgisi odağı', long: true },
  pronunciationFocus: { label: 'Telaffuz odağı', long: true },
  beforeReading: { label: 'Okumadan önce' },
  duringReading: { label: 'Okurken' },
  afterReading: { label: 'Okuduktan sonra' },
  lessonPlan: { label: 'Ders planı', long: true },
  discussionPoints: { label: 'Tartışma soruları' },
  interactiveTips: { label: 'Etkileşim önerileri' },
  differentiation: { label: 'Farklılaştırma' },
  fastFinishers: { label: 'Erken bitirenler', long: true },
  strugglingLearners: { label: 'Zorlanan öğrenciler', long: true },
  formativeAssessment: { label: 'Süreç değerlendirme' },
  expectedResponses: { label: 'Beklenen cevaplar' },
  transferTask: { label: 'Aktarım görevi', long: true },
  teacherReflection: { label: 'Öğretmen için düşünme', long: true },
  assessmentTools: { label: 'Değerlendirme araçları' },
  rubric: { label: 'Dereceli puanlama' },
  exitTicket: { label: 'Çıkış kartı' },
  rubricLevels: { label: 'Ölçüt düzeyleri' },
  criterion: { label: 'Ölçüt' },
  secure: { label: 'Sağlam', long: true },
  notYet: { label: 'Henüz değil, destek', long: true },
  classroomManagement: { label: 'Sınıf yönetimi' },
  checkQuestions: { label: 'Yönerge kontrol soruları' },
  monitoring: { label: 'Öğrenciler çalışırken', long: true },
  whatToNotice: { label: 'Neye dikkat et' },
  readListen: { label: 'Oku ve dinle' },
  findAnswerInStory: { label: 'Cevabı hikâyede bul' },
  vocabularyInContext: { label: 'Kelimeler cümlede' },
  quickChallengeGuide: { label: 'Quick için yol gösterme', long: true },
  wrongAnswerSupport: { label: 'Yanlış cevapta yardım' },
  selfCheck: { label: 'Kendini kontrol et' },
  useWhatYouLearned: { label: 'Öğrendiğini kullan', long: true },
  reflectionPrompt: { label: 'Düşünme sorusu', long: true },
  kinestheticActivities: { label: 'Hareketli etkinlikler' },
  globalCitizenship: { label: 'Küresel vatandaşlık' },
  extraResources: { label: 'Ek kaynaklar' },
  worksheets: { label: 'Çalışma kâğıtları' },
  links: { label: 'Bağlantılar' },
  label: { label: 'Ad' },
  url: { label: 'Adres' },
  metadata: { label: 'Kitabın genel bilgileri' },
  teacherGuide: { label: 'Öğretmen kitabı' },
  selfStudyGuide: { label: 'Kendi kendine çalışma rehberi' },
  narrationText: { label: 'Okunacak metin', long: true },
  storagePath: { label: 'Ses dosyasının yeri' },
  enabled: { label: 'Açık' },
  sections: { label: 'Bölümler' },
  points: { label: 'Maddeler' },
  icon: { label: 'Simge', hidden: true },

  // Places & People cards
  kindLabel: { label: 'Türü (kartta)' },
  periodLabel: { label: 'Dönemi (kartta)' },
  summary: { label: 'Kısa bilgi', long: true },
  more: { label: 'Bir cümle daha (sadece Places & People sayfasında)', long: true },
  tr: { label: 'Türkçe adı (parantez içinde)' },

  // stories.json
  stories: { label: 'Kitaplar' },
  availableLevels: { label: 'Seviyeler' },
  collection: { label: 'Koleksiyon' },
  hidden: { label: 'Gizli', help: 'Gizli kitap ana sayfada görünmez; sadece önizleme bağlantısıyla açılır.' },
  englishOnly: { label: 'Sadece İngilizce' },
};

export const fieldLabel = (key: string): FieldLabel => FIELDS[key] ?? { label: humanize(key) };

const humanize = (key: string) =>
  key
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, letter => letter.toUpperCase());

export const ROLE_HELP: Record<string, string> = {
  admin: 'Her şeyi değiştirir, başkalarının değişikliklerini yayınlar, ekibe kişi ekler.',
  editor: 'Her şeyi değiştirebilir; yayınlamak için bir yöneticiye gönderir.',
  teacher: 'Hikâye metinlerini ve alıştırmaları düzeltir; yayın için yöneticiye gönderir.',
  translator: 'Sadece Arapça (ve ileride başka dillerdeki) metinleri değiştirir.',
  viewer: 'Her şeye bakar, hiçbir şeyi değiştiremez.',
};
