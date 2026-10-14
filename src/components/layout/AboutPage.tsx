import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { BookOpen, Check, Download, FileText, Info, Languages, Library, Link as LinkIcon, Play, Target, Type, Users, X } from '../ui/icons';
import brandLogo from '../../assets/images/brand_logo_384.webp';
import {
  aboutAim,
  aboutFeatures,
  aboutIntro,
  aboutLibrary,
  aboutStandards,
  aboutStats,
  advisoryBoard,
  boardNote,
  brandColors,
  collectionColors,
  mediaKit,
  projectCoordinator,
  sourceGroups,
  teamIntro,
  teamSections,
  type AboutLang,
  type BrandColor,
} from '../../data/aboutContent';
import { useDialogFocus } from '../../hooks/useDialogFocus';

type AboutTab = 'about' | 'sources';

interface AboutPageProps {
  isOpen: boolean;
  onClose: () => void;
}

const LANG_KEY = 'about-page-language';

const readSavedLang = (): AboutLang | null => {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    return saved === 'tr' || saved === 'en' || saved === 'ar' ? saved : null;
  } catch {
    return null;
  }
};

const COPY = {
  tr: {
    heading: 'Hakkında ve Kaynaklar',
    about: 'Hakkında',
    sources: 'Kaynaklar',
    close: 'Kapat',
    eyebrow: 'Hakkında',
    languages: 'Sayfa dili',
    video: 'Tanıtım Filmi',
    openYoutube: 'YouTube’da aç',
    jump: { film: 'Tanıtım Filmi', project: 'Proje', team: 'Proje Ekibi', media: 'Medya Paketi' },
    team: 'Proje Ekibi ve Bilim Kurulu',
    content: 'Dil ve İçerik Ekibi',
    board: 'Bilim Kurulu',
    levels: 'Mevcut seviyeler',
    logo: 'Logo',
    onDark: 'Koyu zemin · ana kullanım',
    onLight: 'Açık zemin',
    name: 'Ad',
    nameTr: 'Türkçe ad',
    nameEn: 'İngilizce ad',
    nameAr: 'Arapça ad',
    subtitle: 'Alt başlık',
    colors: 'Renk Kodları',
    mainColors: 'Ana renkler',
    collectionColors: 'Koleksiyon renkleri',
    copy: 'Kopyala',
    copied: 'Kopyalandı',
    fonts: 'Yazı Tipleri',
    latin: 'Latin harfli metinler',
    arabic: 'Arapça metinler',
    download: 'İndir',
    sourcesIntro: 'Hikâyelerin yazımında başvurulan başlıca kaynaklar. Bağlantılı kaynaklar internette açılır.',
    citedInText: 'Hikâye metninde geçen atıflar',
  },
  en: {
    heading: 'About & Sources',
    about: 'About',
    sources: 'Sources',
    close: 'Close',
    eyebrow: 'About the project',
    languages: 'Page language',
    video: 'Introduction Film',
    openYoutube: 'Open on YouTube',
    jump: { film: 'Film', project: 'The project', team: 'Team', media: 'Media kit' },
    team: 'Project Team and Academic Advisory Board',
    content: 'Language and Content Team',
    board: 'Academic Advisory Board',
    levels: 'Current levels',
    logo: 'Logo',
    onDark: 'Dark background · main use',
    onLight: 'Light background',
    name: 'Name',
    nameTr: 'Turkish name',
    nameEn: 'English name',
    nameAr: 'Arabic name',
    subtitle: 'Subtitle',
    colors: 'Colour Codes',
    mainColors: 'Main colours',
    collectionColors: 'Collection colours',
    copy: 'Copy',
    copied: 'Copied',
    fonts: 'Typefaces',
    latin: 'Latin-script texts',
    arabic: 'Arabic texts',
    download: 'Download',
    sourcesIntro: 'The main sources used in writing the stories. Linked entries open the source online.',
    citedInText: 'Cited in the story text',
  },
  ar: {
    heading: 'عن المشروع والمصادر',
    about: 'عن المشروع',
    sources: 'المصادر',
    close: 'إغلاق',
    eyebrow: 'عن المشروع',
    languages: 'لغة الصفحة',
    video: 'الفيلم التعريفي',
    openYoutube: 'افتح على يوتيوب',
    jump: { film: 'الفيلم', project: 'المشروع', team: 'الفريق', media: 'الحزمة الإعلامية' },
    team: 'فريق المشروع والهيئة العلمية',
    content: 'فريق اللغة والمحتوى',
    board: 'الهيئة العلمية',
    levels: 'المستويات الحالية',
    logo: 'الشعار',
    onDark: 'خلفية داكنة · الاستخدام الرئيسي',
    onLight: 'خلفية فاتحة',
    name: 'الاسم',
    nameTr: 'الاسم التركي',
    nameEn: 'الاسم الإنجليزي',
    nameAr: 'الاسم العربي',
    subtitle: 'العنوان الفرعي',
    colors: 'رموز الألوان',
    mainColors: 'الألوان الرئيسية',
    collectionColors: 'ألوان المجموعات',
    copy: 'نسخ',
    copied: 'نُسخ',
    fonts: 'الخطوط',
    latin: 'النصوص بالحروف اللاتينية',
    arabic: 'النصوص العربية',
    download: 'تنزيل',
    sourcesIntro: 'أهم المصادر التي رُجع إليها في كتابة القصص. الروابط تفتح المصدر على الإنترنت.',
    citedInText: 'إحالات في نص القصة',
  },
};

const LANG_OPTIONS: { id: AboutLang; label: string }[] = [
  { id: 'tr', label: 'Türkçe' },
  { id: 'en', label: 'English' },
  { id: 'ar', label: 'العربية' },
];

const eyebrowClass = 'text-[11px] font-semibold uppercase tracking-[0.22em] text-[#D8B35C]/85';
const cardClass = 'rounded-2xl border border-white/10 bg-white/[0.035]';

const SectionHead: React.FC<{ id: string; kicker: string; title: string; lead?: string; icon: React.ReactNode }> = ({ id, kicker, title, lead, icon }) => (
  <div className="max-w-3xl">
    <p className={cn(eyebrowClass, 'flex items-center gap-2')}>
      {icon}
      {kicker}
    </p>
    <h2 id={id} className="mt-2 font-display text-[24px] font-semibold leading-tight tracking-[-0.01em] text-[#FFF9EC] sm:text-[30px]">
      {title}
    </h2>
    {lead && <p className="mt-3 text-[15px] leading-relaxed text-[#F6F0E2]/75 sm:text-[16px]">{lead}</p>}
  </div>
);

/** "About & Sources" overlay, opened from the home page footer, the phone settings and the reader menu. */
export const AboutPage: React.FC<AboutPageProps> = ({ isOpen, onClose }) => {
  // Tab stays inside and focus returns to the opener; Escape is handled below.
  const dialogRef = useDialogFocus(isOpen, onClose, { escape: false });
  const { language, t } = useLanguage();
  const [tab, setTab] = useState<AboutTab>('about');
  const [vl, setVl] = useState<AboutLang>(() => readSavedLang() ?? (language === 'ar' ? 'ar' : 'en'));
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const isAr = vl === 'ar';
  // The Sources tab has English and Arabic only; the Turkish view shows the English list.
  const sourceLang = isAr ? 'ar' : 'en';
  const copy = COPY[vl];

  useEffect(() => {
    if (!isOpen) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const chooseLang = (next: AboutLang) => {
    setVl(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      // Private mode: the choice simply is not remembered.
    }
  };

  const copyHex = (hex: string) => {
    try {
      void navigator.clipboard?.writeText(hex);
    } catch {
      // Clipboard blocked: the code stays visible on the card.
    }
    setCopiedHex(hex);
    window.setTimeout(() => setCopiedHex(current => (current === hex ? null : current)), 1600);
  };

  const jumpTo = (id: string) => {
    const target = document.getElementById(id);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const groupTitle = (id: string, title?: { en: string; ar: string }) => (title ? title[sourceLang] : t(`prophet.${id}`));

  const tabs: { id: AboutTab; label: string; icon: React.ReactNode }[] = [
    { id: 'about', label: copy.about, icon: <Info size={17} /> },
    { id: 'sources', label: copy.sources, icon: <BookOpen size={17} /> },
  ];

  const swatch = (color: BrandColor) => (
    <li key={color.hex} className={cn(cardClass, 'overflow-hidden')}>
      <button
        type="button"
        onClick={() => copyHex(color.hex)}
        className="group block w-full text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E9C46A]"
        aria-label={`${color.name[vl]} ${color.hex}, ${copy.copy}`}
      >
        <span className="relative block h-20 border-b border-white/10" style={{ backgroundColor: color.hex }}>
          <span
            className={cn(
              'absolute bottom-2 end-2 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white transition-opacity',
              copiedHex === color.hex ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100',
            )}
          >
            {copiedHex === color.hex ? copy.copied : copy.copy}
          </span>
        </span>
        <span className="block p-3.5">
          <span className="block text-[14px] font-semibold text-[#FFF9EC]">{color.name[vl]}</span>
          <span className="mt-1.5 block font-mono text-[13px] font-semibold text-[#F3D58C]" dir="ltr">{color.hex}</span>
          <span className="mt-0.5 block text-[12px] text-[#F6F0E2]/60" dir="ltr">RGB {color.rgb}</span>
          {color.cmyk && <span className="block text-[12px] text-[#F6F0E2]/60" dir="ltr">CMYK {color.cmyk}</span>}
          <span className="mt-1.5 block text-[12px] leading-snug text-[#F6F0E2]/55">{color.use[vl]}</span>
        </span>
      </button>
    </li>
  );

  const logotype = (light: boolean) => (
    <div className="flex items-center gap-3.5" dir="ltr">
      <img src={brandLogo} alt="" className="h-14 w-14 shrink-0 sm:h-16 sm:w-16" />
      <div className="min-w-0 text-left font-['Poppins',sans-serif]">
        <p className={cn('text-[19px] font-semibold leading-tight sm:text-[22px]', light ? 'text-[#0A1120]' : 'text-[#E2B559]')}>{aboutIntro.name}</p>
        <p className={cn('mt-0.5 text-[11px] leading-snug sm:text-[12px]', light ? 'text-[#5D6779]' : 'text-[#F7DD9C]/80')}>{aboutIntro.subtitle.tr}</p>
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className={cn('fixed inset-0 z-[300] overflow-y-auto overscroll-contain bg-[#0b0e0c] text-[#F6F0E2]', isAr && 'font-arabic')}
          // The page can be read in Turkish or English while the app is in Arabic, so the Latin views
          // set Poppins back on their own.
          style={isAr ? undefined : ({ '--font-display': '"Poppins", sans-serif', fontFamily: '"Poppins", sans-serif' } as React.CSSProperties)}
          dir={isAr ? 'rtl' : 'ltr'}
          lang={vl}
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={copy.heading}
          data-about-page
        >
          <div className="sticky top-0 z-10 border-b border-white/[0.07] bg-[#0b0e0c]/92 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-[1120px] items-center justify-between gap-4 px-5 py-3 sm:px-8">
              <div className="flex min-w-0 flex-1 items-center gap-1 rounded-2xl border border-white/15 bg-white/[0.06] p-1 sm:max-w-sm" role="tablist" aria-label={copy.heading}>
                {tabs.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={tab === item.id}
                    onClick={() => {
                      setTab(item.id);
                      dialogRef.current?.scrollTo({ top: 0 });
                    }}
                    className={cn(
                      'flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl px-3.5 font-display text-[14px] font-semibold transition-colors sm:px-4 sm:text-[15px]',
                      tab === item.id ? 'bg-[#E9C46A] text-[#1a1a12] shadow-sm' : 'text-[#F6F0E2]/90 hover:bg-white/10 hover:text-white',
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                aria-label={copy.close}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[#F6F0E2]/85 transition-colors hover:bg-white/[0.08] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
              >
                <X size={22} />
              </button>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[1120px] px-5 pb-20 pt-8 sm:px-8 sm:pt-12" role="tabpanel">
            <div className="mb-8 flex flex-wrap items-center gap-2" role="group" aria-label={copy.languages}>
              <Languages size={16} className="text-[#D8B35C]/80" aria-hidden="true" />
              {LANG_OPTIONS.map(option => (
                <button
                  key={option.id}
                  type="button"
                  lang={option.id}
                  aria-pressed={vl === option.id}
                  onClick={() => chooseLang(option.id)}
                  className={cn(
                    'min-h-9 rounded-full border px-3.5 text-[13px] font-semibold transition-colors',
                    option.id === 'ar' ? 'font-arabic' : "font-['Poppins',sans-serif]",
                    vl === option.id ? 'border-[#E9C46A] bg-[#E9C46A]/15 text-[#F3D58C]' : 'border-white/12 text-[#F6F0E2]/70 hover:border-white/30 hover:text-white',
                  )}
                  data-about-lang={option.id}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {tab === 'about' ? (
              <div className="space-y-16 text-start sm:space-y-20">
                {/* Hero */}
                <section className="grid items-center gap-8 lg:grid-cols-[1fr_auto] lg:gap-14">
                  <div className="order-2 lg:order-1">
                    <p className={eyebrowClass}>{copy.eyebrow}</p>
                    <h1 className="mt-3 font-['Poppins',sans-serif] text-[38px] font-semibold leading-[1.05] tracking-[-0.02em] text-[#FFF9EC] sm:text-[56px]" dir="ltr" style={{ textAlign: isAr ? 'right' : 'left' }}>
                      {aboutIntro.name}
                    </h1>
                    <p className="mt-2 text-[14px] font-medium text-[#F3D58C]/85 sm:text-[15px]">
                      <span lang="en" className="font-['Poppins',sans-serif]">{aboutIntro.names.en}</span>
                      <span className="mx-2 text-[#F6F0E2]/30">·</span>
                      <span lang="ar" className="font-arabic">{aboutIntro.names.ar}</span>
                    </p>
                    <p className="mt-4 text-[16px] font-medium leading-snug text-[#F6F0E2]/85 sm:text-[19px]">{aboutIntro.subtitle[vl]}</p>
                    <p className="mt-5 border-s-2 border-[#D8B35C]/60 ps-4 text-[16px] italic leading-relaxed text-[#F6F0E2]/75 sm:text-[18px]">{aboutIntro.tagline[vl]}</p>
                    <nav className="mt-7 flex flex-wrap gap-2" aria-label={copy.about}>
                      {(
                        [
                          ['about-film', copy.jump.film, <Play key="i" size={15} />],
                          ['about-aim', copy.jump.project, <Target key="i" size={15} />],
                          ['about-team', copy.jump.team, <Users key="i" size={15} />],
                          ['about-media', copy.jump.media, <Download key="i" size={15} />],
                        ] as [string, string, React.ReactNode][]
                      ).map(([id, label, icon], index) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => jumpTo(id)}
                          className={cn(
                            'inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-[13px] font-semibold transition-colors',
                            index === 0 ? 'bg-[#E9C46A] text-[#1a1a12] hover:bg-[#F3D58C]' : 'border border-white/15 bg-white/[0.04] text-[#F6F0E2]/85 hover:bg-white/10 hover:text-white',
                          )}
                        >
                          {icon}
                          {label}
                        </button>
                      ))}
                    </nav>
                  </div>
                  <div className="order-1 flex justify-center lg:order-2">
                    <div className="relative">
                      <div className="absolute inset-0 -z-0 rounded-full bg-[#E2B559]/20 blur-3xl" aria-hidden="true" />
                      <img src={brandLogo} alt={aboutIntro.name} className="relative h-36 w-36 drop-shadow-[0_10px_40px_rgba(226,181,89,0.25)] sm:h-52 sm:w-52 lg:h-64 lg:w-64" />
                    </div>
                  </div>
                </section>

                {/* Numbers */}
                <section aria-label={copy.jump.project}>
                  <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {aboutStats.map(stat => (
                      <li key={stat.value} className={cn(cardClass, 'p-4 sm:p-5')}>
                        <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#55C997]/90">{stat.when[vl]}</p>
                        <p className="mt-1.5 font-['Poppins',sans-serif] text-[30px] font-semibold leading-none text-[#F3D58C] sm:text-[38px]" dir="ltr" style={{ textAlign: isAr ? 'right' : 'left' }}>
                          {stat.value}
                        </p>
                        <p className="mt-2 text-[13px] leading-snug text-[#F6F0E2]/75 sm:text-[14px]">{stat.label[vl]}</p>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Film */}
                <section aria-labelledby="about-film" className="scroll-mt-24">
                  <SectionHead id="about-film" kicker="YouTube" title={copy.video} icon={<Play size={14} />} />
                  <div className="mt-6 aspect-video w-full overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_30px_80px_-30px_rgba(0,0,0,0.8)]">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${aboutIntro.videoId}?rel=0`}
                      title={copy.video}
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                      className="h-full w-full"
                    />
                  </div>
                  <a
                    href={`https://youtu.be/${aboutIntro.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-[#F6F0E2]/60 underline decoration-white/20 underline-offset-4 hover:text-[#F6F0E2]"
                  >
                    {copy.openYoutube}
                    <span dir="ltr">· youtu.be/{aboutIntro.videoId}</span>
                  </a>
                </section>

                {/* Aim and vision */}
                <section aria-labelledby="about-aim" className="scroll-mt-24">
                  <SectionHead id="about-aim" kicker="01" title={aboutAim.title[vl]} lead={aboutAim.lead[vl]} icon={<Target size={14} />} />
                  <ol className="mt-6 grid gap-3 md:grid-cols-3">
                    {aboutAim.aims.map((aim, index) => (
                      <li key={aim.en} className={cn(cardClass, 'p-5')}>
                        <span className="font-['Poppins',sans-serif] text-[13px] font-semibold text-[#D8B35C]">0{index + 1}</span>
                        <p className="mt-2 text-[15px] leading-relaxed text-[#F6F0E2]/85">{aim[vl]}</p>
                      </li>
                    ))}
                  </ol>
                  <blockquote className="mt-5 rounded-2xl border border-[#D8B35C]/25 bg-[#D8B35C]/[0.06] p-5 text-[15px] leading-relaxed text-[#FFF9EC] sm:p-6 sm:text-[17px]">
                    {aboutAim.vision[vl]}
                  </blockquote>
                </section>

                {/* Library */}
                <section aria-labelledby="about-library">
                  <SectionHead id="about-library" kicker="02" title={aboutLibrary.title[vl]} lead={aboutLibrary.lead[vl]} icon={<Library size={14} />} />
                  <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
                    {aboutLibrary.sets.map(set => (
                      <li key={set.name.en} className={cn(cardClass, 'relative overflow-hidden p-4 sm:p-5')}>
                        <span className="absolute inset-y-0 start-0 w-1" style={{ backgroundColor: set.accent }} aria-hidden="true" />
                        <p className="text-[15px] font-semibold leading-snug text-[#FFF9EC] sm:text-[16px]">{set.name[vl]}</p>
                        <p className="mt-1 text-[12px] font-medium" style={{ color: set.accent }}>{set.group[vl]}</p>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-[13px] text-[#F6F0E2]/60">
                    {copy.levels}: <span className="font-semibold text-[#F6F0E2]/85" dir="ltr">{aboutLibrary.levels}</span>
                  </p>
                </section>

                {/* Features */}
                <section aria-labelledby="about-features">
                  <SectionHead id="about-features" kicker="03" title={aboutFeatures.title[vl]} lead={aboutFeatures.lead[vl]} icon={<BookOpen size={14} />} />
                  <ul className="mt-6 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {aboutFeatures.items.map(item => (
                      <li key={item.en} className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[14px] text-[#F6F0E2]/88">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1E8C6B]/25 text-[#55C997]">
                          <Check size={14} />
                        </span>
                        {item[vl]}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-5 max-w-3xl text-[15px] leading-relaxed text-[#F6F0E2]/75">{aboutFeatures.support[vl]}</p>
                </section>

                {/* Standards */}
                <section aria-labelledby="about-standards">
                  <SectionHead id="about-standards" kicker="04" title={aboutStandards.title[vl]} lead={aboutStandards.lead[vl]} icon={<FileText size={14} />} />
                  <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {aboutStandards.items.map((item, index) => (
                      <li key={item.title.en} className={cn(cardClass, 'p-5')}>
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#D8B35C]/15 font-['Poppins',sans-serif] text-[14px] font-semibold text-[#F3D58C]">{index + 1}</span>
                        <h3 className="mt-3 text-[15px] font-semibold leading-snug text-[#FFF9EC]">{item.title[vl]}</h3>
                        <p className="mt-1.5 text-[14px] leading-relaxed text-[#F6F0E2]/72">{item.text[vl]}</p>
                      </li>
                    ))}
                    <li className="rounded-2xl border border-[#55C997]/25 bg-[#1E8C6B]/[0.10] p-5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#55C997]/15 text-[#55C997]">
                        <Check size={16} />
                      </span>
                      <h3 className="mt-3 text-[15px] font-semibold leading-snug text-[#FFF9EC]">{aboutStandards.aiTitle[vl]}</h3>
                      <p className="mt-1.5 text-[14px] leading-relaxed text-[#F6F0E2]/80">{aboutStandards.ai[vl]}</p>
                    </li>
                  </ol>
                </section>

                {/* Team */}
                <section aria-labelledby="about-team" className="scroll-mt-24">
                  <SectionHead id="about-team" kicker="05" title={copy.team} lead={teamIntro[vl]} icon={<Users size={14} />} />

                  <div className="mt-6 flex items-center gap-4 rounded-2xl border border-[#D8B35C]/30 bg-[#D8B35C]/[0.07] p-5 sm:p-6">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#D8B35C]/90">{projectCoordinator.role[vl]}</p>
                      <p className="mt-1.5 text-[20px] font-semibold text-[#FFF9EC] sm:text-[22px]">{projectCoordinator.name}</p>
                    </div>
                  </div>

                  <p className="mt-6 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#F6F0E2]/55">{copy.content}</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {teamSections.map(section => (
                      <div key={section.title.en} className={cn(cardClass, 'p-5')}>
                        <h3 className="font-display text-[15px] font-semibold text-[#FFF9EC]">{section.title[vl]}</h3>
                        <dl className="mt-3 space-y-3.5">
                          {section.roles.map(role => (
                            <div key={role.role.en}>
                              <dt className="text-[12px] font-semibold text-[#D8B35C]/90">{role.role[vl]}</dt>
                              {role.members.map(member => (
                                <dd key={member} className="mt-0.5 text-[15px] text-[#F6F0E2]">{member}</dd>
                              ))}
                              {role.note && <dd className="mt-0.5 text-[12px] text-[#F6F0E2]/55">{role.note[vl]}</dd>}
                            </div>
                          ))}
                        </dl>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#F6F0E2]/55">{copy.board}</h3>
                    <p className="text-[12px] text-[#F6F0E2]/50">{boardNote[vl]}</p>
                  </div>
                  <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {advisoryBoard.map(member => (
                      <li key={member.name} className={cn(cardClass, 'p-4')}>
                        <p className="text-[15px] font-semibold text-[#FFF9EC]">{member.name}</p>
                        <p className="mt-1 text-[13px] text-[#F6F0E2]/75">{member.university[vl]}</p>
                        <p className="mt-0.5 text-[12px] text-[#F6F0E2]/50">{member.department[vl]}</p>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Media kit */}
                <section aria-labelledby="about-media" className="scroll-mt-24">
                  <SectionHead id="about-media" kicker="06" title={mediaKit.title[vl]} lead={mediaKit.lead[vl]} icon={<Download size={14} />} />
                  <ul className="mt-6 grid gap-3 md:grid-cols-3">
                    {mediaKit.files.map(file => (
                      <li key={file.id}>
                        <a
                          href={file.href}
                          download
                          className="group flex h-full flex-col rounded-2xl border border-[#D8B35C]/25 bg-gradient-to-b from-[#D8B35C]/[0.09] to-white/[0.02] p-5 transition-colors hover:border-[#E9C46A]/60 hover:from-[#D8B35C]/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E9C46A]"
                          data-media-kit-file={file.id}
                        >
                          <span className="flex items-center justify-between gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D8B35C]/15 text-[#F3D58C]">
                              {file.kind === 'ZIP' ? <Download size={19} /> : <FileText size={19} />}
                            </span>
                            <span className="text-[11px] font-semibold text-[#F6F0E2]/55" dir="ltr">
                              {file.kind} · {file.size}
                            </span>
                          </span>
                          <span className="mt-4 block text-[17px] font-semibold text-[#FFF9EC]">{file.title[vl]}</span>
                          <span className="mt-1.5 block flex-1 text-[13.5px] leading-relaxed text-[#F6F0E2]/70">{file.text[vl]}</span>
                          <span className="mt-4 flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#F3D58C] group-hover:text-[#FFF9EC]">
                              <Download size={15} />
                              {copy.download}
                            </span>
                            {file.kind === 'PDF' && vl !== 'tr' && <span className="text-[11px] text-[#F6F0E2]/45">{mediaKit.inTurkish[vl]}</span>}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>

                  {/* Logo */}
                  <h3 className="mt-12 flex items-center gap-2 font-display text-[18px] font-semibold text-[#FFF9EC]">{copy.logo}</h3>
                  <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-[#F6F0E2]/70">{mediaKit.logoText[vl]}</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <figure className="rounded-2xl border border-white/10 bg-[#0A1120] p-6 sm:p-8">
                      {logotype(false)}
                      <figcaption className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#F7DD9C]/60">{copy.onDark}</figcaption>
                    </figure>
                    <figure className="rounded-2xl border border-white/10 bg-[#FBF8F1] p-6 sm:p-8">
                      {logotype(true)}
                      <figcaption className="mt-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C99A3E]">{copy.onLight}</figcaption>
                    </figure>
                  </div>

                  {/* Name */}
                  <h3 className="mt-12 font-display text-[18px] font-semibold text-[#FFF9EC]">{copy.name}</h3>
                  <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-[#F6F0E2]/70">{mediaKit.nameNote[vl]}</p>
                  <dl className="mt-4 divide-y divide-white/[0.07] overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                    {(
                      [
                        [copy.nameTr, aboutIntro.name, 'tr'],
                        [copy.subtitle, aboutIntro.subtitle.tr, 'tr'],
                        [copy.nameEn, aboutIntro.names.en, 'en'],
                        [copy.nameAr, aboutIntro.names.ar, 'ar'],
                      ] as [string, string, AboutLang][]
                    ).map(([label, value, valueLang]) => (
                      <div key={label} className="grid gap-1 px-5 py-3.5 sm:grid-cols-[180px_1fr] sm:items-center sm:gap-4">
                        <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#55C997]/85">{label}</dt>
                        <dd
                          lang={valueLang}
                          dir={valueLang === 'ar' ? 'rtl' : 'ltr'}
                          className={cn('text-[16px] font-semibold text-[#FFF9EC] sm:text-[18px]', valueLang === 'ar' ? 'font-arabic text-[20px]' : "font-['Poppins',sans-serif]")}
                          style={{ textAlign: isAr ? 'right' : 'left' }}
                        >
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  {/* Colours */}
                  <h3 className="mt-12 font-display text-[18px] font-semibold text-[#FFF9EC]">{copy.colors}</h3>
                  <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-[#F6F0E2]/70">{mediaKit.colorsText[vl]}</p>
                  <p className="mt-5 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#F6F0E2]/55">{copy.mainColors}</p>
                  <ul className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">{brandColors.map(swatch)}</ul>
                  <p className="mt-6 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#F6F0E2]/55">{copy.collectionColors}</p>
                  <ul className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">{collectionColors.map(swatch)}</ul>

                  {/* Typefaces */}
                  <h3 className="mt-12 flex items-center gap-2 font-display text-[18px] font-semibold text-[#FFF9EC]">
                    <Type size={18} className="text-[#D8B35C]" />
                    {copy.fonts}
                  </h3>
                  <p className="mt-2 max-w-3xl text-[14px] leading-relaxed text-[#F6F0E2]/70">{mediaKit.fontsText[vl]}</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className={cn(cardClass, 'p-5 sm:p-6')} dir="ltr">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#55C997]/85" style={{ textAlign: isAr ? 'right' : 'left' }}>{copy.latin}</p>
                      <p className="mt-2 font-['Poppins',sans-serif] text-[40px] font-semibold leading-none text-[#F3D58C]">Poppins</p>
                      <p className="mt-3 font-['Poppins',sans-serif] text-[14px] leading-relaxed text-[#F6F0E2]/80">Aa Bb Cc Çç Dd Ee Ff Gg Ğğ Hh Iı İi Jj Kk Ll Mm Nn Oo Öö Pp Rr Ss Şş Tt Uu Üü Vv Yy Zz Ââ Îî Ûû 0123456789</p>
                      <p className="mt-3 font-['Poppins',sans-serif] text-[12px] text-[#F6F0E2]/55">400 · 500 · 600 · 700</p>
                    </div>
                    <div className={cn(cardClass, 'p-5 sm:p-6')} dir="rtl">
                      <p className={cn('text-[11px] font-semibold uppercase tracking-[0.16em] text-[#55C997]/85', !isAr && "font-['Poppins',sans-serif]")} style={{ textAlign: isAr ? 'right' : 'left' }} dir={isAr ? 'rtl' : 'ltr'}>{copy.arabic}</p>
                      <p className="mt-2 font-['Poppins',sans-serif] text-[40px] font-semibold leading-none text-[#F3D58C]" dir="ltr" style={{ textAlign: 'right' }}>Arakom</p>
                      <p lang="ar" className="mt-3 font-arabic text-[26px] leading-relaxed text-[#F6F0E2]/85">من اللسان إلى الثقافة</p>
                      <p lang="ar" className="mt-1 font-arabic text-[18px] text-[#F6F0E2]/60">أ ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي</p>
                    </div>
                  </div>
                </section>
              </div>
            ) : (
              <div className="space-y-8 text-start" dir={sourceLang === 'ar' ? 'rtl' : 'ltr'}>
                <p className="max-w-3xl text-[15px] leading-relaxed text-[#F6F0E2]/75">{copy.sourcesIntro}</p>
                {sourceGroups.map(group => (
                  <section key={group.id} aria-labelledby={`sources-${group.id}`}>
                    <h2 id={`sources-${group.id}`} className="border-b border-white/[0.08] pb-2 font-display text-[18px] font-semibold text-[#FFF9EC]">
                      {groupTitle(group.id, group.title)}
                    </h2>
                    {group.sources.length > 0 && (
                      <ul className="mt-3 space-y-2" dir="ltr">
                        {group.sources.map(source => (
                          <li key={source.text} className="text-[14px] leading-relaxed text-[#F6F0E2]/85" style={{ textAlign: isAr ? 'right' : 'left' }}>
                            {source.url ? (
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group inline underline decoration-[#D8B35C]/40 underline-offset-4 transition-colors hover:text-white hover:decoration-[#D8B35C]"
                              >
                                {source.text}
                                <LinkIcon size={13} className="ms-1.5 inline-block align-[-1px] text-[#D8B35C]/80" />
                              </a>
                            ) : (
                              source.text
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                    {group.citations && (
                      <dl className="mt-3 space-y-2 rounded-xl bg-white/[0.03] p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#D8B35C]/75">{copy.citedInText}</p>
                        {group.citations.map(citation => (
                          <div key={citation.text.en} className="text-[13px] leading-relaxed">
                            <dt className="inline font-semibold text-[#F6F0E2]/80">{citation.label[sourceLang]}: </dt>
                            <dd className="inline text-[#F6F0E2]/70" dir={sourceLang === 'ar' ? 'rtl' : 'ltr'}>
                              {citation.text[sourceLang]}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </section>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
