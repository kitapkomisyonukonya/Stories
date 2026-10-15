import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import brandLogo from '../../assets/images/brand_logo_384.webp';
import type { Level } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { editionKey, useJournal, type SealLanguage } from '../../lib/seyahatname/store';
import { certificateBooks } from '../../lib/seyahatname/view';
import { certificateLink, downloadText, encodeCertificate, formatCertificateDate, openBadgesAvailable, requestOpenBadge } from '../../lib/seyahatname/certificate';
import { BookSeal } from './art';
import { arCount } from './copy';
import { Modal } from './Modal';
import { QrCode } from './QrCode';

const NAME_KEY = 'v2:seyahatname-name';
const WIDTH = 1123;
const HEIGHT = 794;
const POPPINS = 'Poppins, sans-serif';
const ARAKOM = 'Arakom, sans-serif';
const INK = '#14221a';
const GOLD = '#b08a3e';
const TEAL = '#1d5f5a';

const COPY = {
  en: {
    title: 'Seyahatname Certificate',
    name: 'Your name, as it should appear',
    namePlaceholder: 'Name and surname',
    print: 'Print or save as PDF',
    badge: 'Download as Open Badge',
    badgeWorking: 'Preparing…',
    badgeNote: 'An Open Badges 3.0 credential: badge wallets and the 1EdTech validator can read it.',
    badgeFailed: 'The Open Badge could not be made now. Try again later.',
  },
  ar: {
    title: 'شَهَادَةُ الرِّحْلَةِ',
    name: 'اسْمُكَ كَمَا تُرِيدُ أَنْ يَظْهَرَ',
    namePlaceholder: 'الِاسْمُ وَاللَّقَبُ',
    print: 'اطْبَعْ أَوِ احْفَظْ بِصِيغَةِ PDF',
    badge: 'نَزِّلْهَا بِصِيغَةِ Open Badge',
    badgeWorking: 'جَارٍ التَّحْضِيرُ…',
    badgeNote: 'وَثِيقَةٌ بِمِعْيَارِ Open Badges 3.0 تَقْرَؤُهَا مَحَافِظُ الشَّارَاتِ وَأَدَاةُ التَّحَقُّقِ مِنْ 1EdTech.',
    badgeFailed: 'تَعَذَّرَ إِعْدَادُ الشَّارَةِ الْآنَ. حَاوِلْ لَاحِقًا.',
  },
};

const readName = () => {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
};

const EN_NUMBERS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
/** Arabic counts of books after a genitive ("reading … books"), fully vowelled. */
const AR_BOOKS = ['', 'كِتَابٍ وَاحِدٍ', 'كِتَابَيْنِ', 'ثَلَاثَةِ', 'أَرْبَعَةِ', 'خَمْسَةِ', 'سِتَّةِ', 'سَبْعَةِ', 'ثَمَانِيَةِ', 'تِسْعَةِ', 'عَشَرَةِ'];

const enBooks = (count: number) => {
  const number = EN_NUMBERS[count] ?? String(count);
  return count === 1 ? 'one book in English up to its Final Challenge' : `${number} books in English up to their Final Challenge`;
};

const arBooks = (count: number) => {
  if (count === 1 || count === 2) return AR_BOOKS[count];
  if (count <= 10) return `${AR_BOOKS[count]}\u00a0كُتُبٍ`;
  return arCount(count, new Intl.NumberFormat('ar-u-nu-arab').format(count), { one: '', two: '', few: 'كُتُبٍ', many: 'كِتَابًا' });
};

const SHEET_COPY = {
  en: {
    title: 'Seyahatname Certificate',
    level: (level: string) => `LEVEL ${level}`,
    awarded: 'This certificate is awarded to',
    body: (level: string, books: number) => `for completing the ${level} journey of the Lisandan Kültüre digital library, reading ${enBooks(books)}.`,
    date: 'DATE',
    check: 'Check code',
  },
  ar: {
    title: 'شَهَادَةُ الرِّحْلَةِ',
    level: (level: string) => `الْمُسْتَوَى ${level}`,
    awarded: 'تُمْنَحُ هٰذِهِ الشَّهَادَةُ لِـ',
    body: (level: string, books: number) =>
      `تَقْدِيرًا لِإِتْمَامِ رِحْلَةِ الْمُسْتَوَى ${level} فِي مَكْتَبَةِ «\u2068Lisandan\u00a0Kültüre\u2069» الرَّقْمِيَّةِ، وَقِرَاءَةِ ${arBooks(books)} بِاللُّغَةِ الْعَرَبِيَّةِ حَتَّى تَحَدِّيهَا النِّهَائِيِّ.`,
    date: 'التَّارِيخُ',
    check: 'رَمْزُ التَّحَقُّقِ',
  },
};

export interface CertificateSheetProps {
  level: Level;
  /** The one language of the certificate: the language its books were read in. */
  lang: SealLanguage;
  name: string;
  storyIds: string[];
  date: Date;
  code: string;
  link: string;
}

/** The certificate itself: A4 landscape, in one language, the books' seals below the text. */
export const CertificateSheet: React.FC<CertificateSheetProps> = ({ level, lang, name, storyIds, date, code, link }) => {
  const ar = lang === 'ar';
  const t = SHEET_COPY[lang];
  const shownName = name.trim() || '—';
  return (
    <div
      dir={ar ? 'rtl' : 'ltr'}
      lang={lang}
      style={{ width: WIDTH, height: HEIGHT, position: 'relative', background: '#fbf7ec', color: INK, fontFamily: ar ? ARAKOM : POPPINS, overflow: 'hidden' }}
      data-certificate-sheet={lang}
    >
      <div style={{ position: 'absolute', inset: 22, border: `2px solid ${GOLD}` }} />
      <div style={{ position: 'absolute', inset: 30, border: `1px solid ${GOLD}`, opacity: 0.6 }} />

      {/* Header */}
      <div style={{ position: 'absolute', top: 58, left: 0, right: 0, textAlign: 'center', fontFamily: POPPINS }} dir="ltr">
        <img src={brandLogo} alt="" width={58} height={58} style={{ display: 'block', margin: '0 auto' }} />
        <div style={{ marginTop: 6, fontSize: 14, fontWeight: 600, letterSpacing: '0.3em' }}>LISANDAN KÜLTÜRE</div>
        <div style={{ marginTop: 2, fontSize: 10, opacity: 0.75 }} lang="tr">Yabancı Dil, Kültür, Tarih ve Değerlerimiz Dijital Kütüphane Projesi</div>
      </div>

      {/* Title, name and what was done */}
      <div style={{ position: 'absolute', top: 196, left: 0, right: 0, textAlign: 'center' }}>
        <div style={{ fontSize: ar ? 48 : 40, fontWeight: ar ? 700 : 600, lineHeight: 1.15 }}>{t.title}</div>
        <div style={{ marginTop: 8, fontSize: ar ? 18 : 13, letterSpacing: ar ? 0 : '0.22em', color: '#6b6250' }}>{t.level(level)}</div>
        <div style={{ marginTop: 34, fontSize: ar ? 20 : 15, color: '#4b4433' }}>{t.awarded}</div>
        <div
          dir="auto"
          style={{ margin: '10px auto 0', width: 620, fontFamily: 'Poppins, Arakom, sans-serif', fontSize: 40, fontWeight: 600, color: TEAL, lineHeight: 1.3, paddingBottom: 8, borderBottom: `1.5px solid ${GOLD}`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {shownName}
        </div>
        <p style={{ margin: '20px auto 0', width: 700, fontSize: ar ? 20 : 15.5, lineHeight: ar ? 1.8 : 1.6, color: '#3d382c' }}>{t.body(level, storyIds.length)}</p>
      </div>

      {/* The books' seals */}
      <div style={{ position: 'absolute', top: 528, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 16 }}>
        {storyIds.map(storyId => (
          <BookSeal key={storyId} storyId={storyId} level={level} arabic={ar} size={84} ribbons={false} />
        ))}
      </div>

      {/* Footer: date, the Seyahatname seal, check code */}
      <div style={{ position: 'absolute', left: 70, right: 70, bottom: 58, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{ textAlign: 'center', width: 200 }}>
          <div style={{ fontSize: ar ? 19 : 15, fontWeight: 600 }}>{formatCertificateDate(date, lang)}</div>
          <div style={{ marginTop: 4, borderTop: `1px solid ${GOLD}`, paddingTop: 4, fontSize: ar ? 14 : 10.5, letterSpacing: ar ? 0 : '0.16em', color: '#6b6250' }}>{t.date}</div>
        </div>
        <BookSeal storyId="seyahatname" level={level} arabic={ar} size={122} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: 200, justifyContent: 'flex-end' }}>
          <div style={{ textAlign: ar ? 'left' : 'right', fontSize: ar ? 13 : 10.5, color: '#6b6250' }}>
            {t.check}
            <div data-certificate-code dir="ltr" style={{ fontFamily: POPPINS, fontSize: 14, fontWeight: 700, letterSpacing: '0.1em', color: INK }}>{code}</div>
          </div>
          <QrCode value={link} size={70} />
        </div>
      </div>
    </div>
  );
};

/** Which certificate is open: a level, in one language. */
export interface CertificateChoice {
  level: Level;
  lang: SealLanguage;
}

const LANGUAGE_NAMES = {
  en: { en: 'English', ar: 'Arabic' },
  ar: { en: 'الْإِنْجِلِيزِيَّةُ', ar: 'الْعَرَبِيَّةُ' },
};

/** The certificate page: the learner types a name, sees the certificate, prints it or takes it as an Open Badge. */
export const CertificateDialog: React.FC<{ certificate: CertificateChoice | null; onClose: () => void }> = ({ certificate, onClose }) => {
  const { language } = useLanguage();
  const lang = language === 'ar' ? 'ar' : 'en';
  const copy = COPY[lang];
  const journal = useJournal();
  const [name, setName] = useState(readName);
  const [badgeState, setBadgeState] = useState<'idle' | 'working' | 'failed'>('idle');
  const [canBadge, setCanBadge] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const level = certificate?.level ?? null;
  const sheetLang = certificate?.lang ?? 'en';

  useEffect(() => {
    if (!level) return;
    setBadgeState('idle');
    openBadgesAvailable().then(setCanBadge);
  }, [level, sheetLang]);

  useEffect(() => {
    try {
      localStorage.setItem(NAME_KEY, name);
    } catch {
      /* the name is just not remembered */
    }
  }, [name]);

  useLayoutEffect(() => {
    if (!level) return;
    const frame = frameRef.current;
    if (!frame) return;
    const fit = () => setScale(Math.min(1, frame.clientWidth / WIDTH));
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(frame);
    return () => observer.disconnect();
  }, [level, sheetLang]);

  const data = useMemo(() => {
    if (!level) return null;
    const storyIds = certificateBooks(level, sheetLang).map(story => story.id);
    const last = Math.max(...storyIds.map(id => journal.seals[editionKey(id, level)] ?? 0), 0);
    return { storyIds, date: new Date(last > 0 ? last : Date.now()) };
  }, [level, sheetLang, journal]);

  if (!level || !data) return <Modal open={false} onClose={onClose} title={copy.title}>{null}</Modal>;
  const code = encodeCertificate({ level, lang: sheetLang, storyIds: data.storyIds, date: data.date }, name);
  const link = certificateLink(code, name);
  const sheet = <CertificateSheet level={level} lang={sheetLang} name={name} storyIds={data.storyIds} date={data.date} code={code} link={link} />;

  const downloadBadge = async () => {
    setBadgeState('working');
    const result = await requestOpenBadge(`level-${level}-${sheetLang}`, name, data.date);
    if (!result?.jwt) {
      setBadgeState('failed');
      return;
    }
    downloadText(`seyahatname-${level.toLowerCase()}-${sheetLang}-open-badge.jwt`, result.jwt, 'application/jwt');
    setBadgeState('idle');
  };

  return (
    <Modal open onClose={onClose} title={`${copy.title} · ${level} · ${LANGUAGE_NAMES[lang][sheetLang]}`} wide>
      <label className="block text-[13px] font-semibold text-[#14221a]/75" htmlFor="certificate-name">{copy.name}</label>
      <input
        id="certificate-name"
        value={name}
        onChange={event => setName(event.target.value.slice(0, 60))}
        placeholder={copy.namePlaceholder}
        dir="auto"
        autoComplete="name"
        className="mt-1 w-full rounded-xl border border-black/15 bg-white px-3 py-2.5 text-[16px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d6b66]"
      />
      <div ref={frameRef} className="mt-4 w-full overflow-hidden rounded-xl shadow-[0_6px_30px_rgba(0,0,0,0.18)]" style={{ height: HEIGHT * scale }}>
        <div style={{ width: WIDTH, height: HEIGHT, transform: `scale(${scale})`, transformOrigin: 'top left' }} dir="ltr">{sheet}</div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button type="button" onClick={() => window.print()} disabled={!name.trim()} className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#14221a] px-5 text-sm font-semibold text-[#F6F0E2] disabled:opacity-40" data-certificate-print>
          {copy.print}
        </button>
        {canBadge && (
          <button type="button" onClick={downloadBadge} disabled={!name.trim() || badgeState === 'working'} className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#14221a]/25 px-5 text-sm font-semibold disabled:opacity-40" data-certificate-badge>
            {badgeState === 'working' ? copy.badgeWorking : copy.badge}
          </button>
        )}
      </div>
      {canBadge && <p className="mt-2 text-[12px] text-[#14221a]/60">{badgeState === 'failed' ? copy.badgeFailed : copy.badgeNote}</p>}
      {createPortal(
        <div className="seyahatname-print" aria-hidden="true">
          <style>{'@media screen{.seyahatname-print{display:none}}@media print{@page{size:A4 landscape;margin:0}body>*:not(.seyahatname-print){display:none!important}.seyahatname-print{display:block;width:297mm;height:210mm;overflow:hidden}.seyahatname-print>div{transform:scale(1.0)}html,body{background:#fff!important;height:auto!important;overflow:visible!important}}'}</style>
          {sheet}
        </div>,
        document.body,
      )}
    </Modal>
  );
};
