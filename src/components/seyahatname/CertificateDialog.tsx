import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import brandLogo from '../../assets/images/brand_logo_384.webp';
import type { Level } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { EDITIONS, editionKey, useJournal } from '../../lib/seyahatname/store';
import { levelBooks } from '../../lib/seyahatname/view';
import { certificateLink, downloadText, encodeCertificate, openBadgesAvailable, requestOpenBadge } from '../../lib/seyahatname/certificate';
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

const formatDate = (date: Date, lang: 'en' | 'ar') =>
  new Intl.DateTimeFormat(lang === 'ar' ? 'ar-u-nu-arab' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);

/** A thin double rule with a small lozenge in the middle, for between the title lines. */
const Rule: React.FC<{ width: number }> = ({ width }) => (
  <svg width={width} height="12" viewBox={`0 0 ${width} 12`} aria-hidden="true" style={{ display: 'block', margin: '0 auto' }}>
    <path d={`M0 6H${width / 2 - 10}M${width / 2 + 10} 6H${width}`} stroke={GOLD} strokeWidth="1.2" />
    <path d={`M${width / 2} 1l5 5-5 5-5-5z`} fill="none" stroke={GOLD} strokeWidth="1.2" />
  </svg>
);

/** Corner ornament: an interlaced bracket, drawn once and turned for each corner. */
const Corner: React.FC<{ rotate: number; x: number; y: number }> = ({ rotate, x, y }) => (
  <g transform={`translate(${x} ${y}) rotate(${rotate})`} fill="none" stroke={GOLD} strokeWidth="1.6" strokeLinecap="round">
    <path d="M0 64V14a14 14 0 0 1 14-14h50" />
    <path d="M10 64V24a14 14 0 0 1 14-14h40" strokeOpacity=".7" />
    <path d="M22 22c10 0 16 6 16 16s-6 16-16 16-12-4-12-10 4-10 10-10 8 4 8 8" strokeOpacity=".85" />
  </g>
);

export interface CertificateSheetProps {
  level: Level;
  name: string;
  storyIds: string[];
  stamps: number;
  date: Date;
  code: string;
  link: string;
}

/** The certificate itself: A4 landscape, English on the left, Arabic on the right, the books' seals below. */
export const CertificateSheet: React.FC<CertificateSheetProps> = ({ level, name, storyIds, stamps, date, code, link }) => {
  const arNumber = (value: number) => new Intl.NumberFormat('ar-u-nu-arab').format(value);
  const books = storyIds.length;
  const shownName = name.trim() || '—';
  const enBody = `for completing the ${level} journey of the Lisandan Kültüre digital library: ${books} books read up to their Final Challenge, ${stamps} chapter stamps.`;
  const arBody = `تَقْدِيرًا لِإِتْمَامِ رِحْلَةِ الْمُسْتَوَى ${level} فِي مَكْتَبَةِ «\u2068Lisandan\u00a0Kültüre\u2069» الرَّقْمِيَّةِ: قِرَاءَةِ ${arCount(books, arNumber(books), { one: 'كِتَابٍ وَاحِدٍ', two: 'كِتَابَيْنِ', few: 'كُتُبٍ', many: 'كِتَابًا' })} حَتَّى تَحَدِّيهَا النِّهَائِيِّ، وَجَمْعِ ${arCount(stamps, arNumber(stamps), { one: 'خَتْمٍ وَاحِدٍ', two: 'خَتْمَيْنِ', few: 'أَخْتَامٍ', many: 'خَتْمًا' })} لِلْفُصُولِ.`;
  return (
    <div
      dir="ltr"
      lang="en"
      style={{ width: WIDTH, height: HEIGHT, position: 'relative', background: 'radial-gradient(ellipse at 50% 40%, #fffaf0 0%, #f8f0de 62%, #efe2c4 100%)', color: INK, fontFamily: POPPINS, overflow: 'hidden' }}
      data-certificate-sheet
    >
      <svg width={WIDTH} height={HEIGHT} style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
        <rect x="14" y="14" width={WIDTH - 28} height={HEIGHT - 28} fill="none" stroke={INK} strokeWidth="10" />
        <rect x="30" y="30" width={WIDTH - 60} height={HEIGHT - 60} fill="none" stroke={GOLD} strokeWidth="1.6" />
        <rect x="36" y="36" width={WIDTH - 72} height={HEIGHT - 72} fill="none" stroke={GOLD} strokeWidth=".8" strokeOpacity=".7" />
        <Corner rotate={0} x={44} y={44} />
        <Corner rotate={90} x={WIDTH - 44} y={44} />
        <Corner rotate={180} x={WIDTH - 44} y={HEIGHT - 44} />
        <Corner rotate={270} x={44} y={HEIGHT - 44} />
      </svg>

      {/* Header */}
      <div style={{ position: 'absolute', top: 54, left: 0, right: 0, textAlign: 'center' }}>
        <img src={brandLogo} alt="" width={62} height={62} style={{ display: 'block', margin: '0 auto' }} />
        <div style={{ marginTop: 6, fontSize: 15, fontWeight: 600, letterSpacing: '0.32em' }}>LISANDAN KÜLTÜRE</div>
        <div style={{ marginTop: 2, fontSize: 10.5, color: '#5b5140', letterSpacing: '0.02em' }}>Yabancı Dil, Kültür, Tarih ve Değerlerimiz Dijital Kütüphane Projesi</div>
      </div>

      {/* Titles: English left, Arabic right */}
      <div style={{ position: 'absolute', top: 178, left: 90, right: 90, display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 70 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 31, fontWeight: 600, letterSpacing: '0.02em', lineHeight: 1.1 }}>Seyahatname Certificate</div>
          <div style={{ marginTop: 8, fontSize: 13, color: '#6b6250', letterSpacing: '0.18em' }}>LEVEL {level}</div>
        </div>
        <div dir="rtl" lang="ar" style={{ textAlign: 'center', fontFamily: ARAKOM }}>
          <div style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.1, color: INK }}>شَهَادَةُ الرِّحْلَةِ</div>
          <div style={{ marginTop: 4, fontSize: 17, color: '#6b6250' }}>الْمُسْتَوَى {level}</div>
        </div>
      </div>
      <div style={{ position: 'absolute', top: 262, left: 0, right: 0 }}>
        <Rule width={420} />
      </div>

      {/* Awarded to */}
      <div style={{ position: 'absolute', top: 284, left: 90, right: 90, display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 70, fontSize: 14, color: '#4b4433' }}>
        <div style={{ textAlign: 'center' }}>This certificate is awarded to</div>
        <div dir="rtl" lang="ar" style={{ textAlign: 'center', fontFamily: ARAKOM, fontSize: 18 }}>تُمْنَحُ هٰذِهِ الشَّهَادَةُ لِـ</div>
      </div>
      <div style={{ position: 'absolute', top: 314, left: 150, right: 150, textAlign: 'center' }}>
        <div dir="auto" style={{ fontSize: 38, fontWeight: 600, color: '#1d5f5a', lineHeight: 1.25, paddingBottom: 6, borderBottom: `1.5px solid ${GOLD}`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {shownName}
        </div>
      </div>

      {/* Body */}
      <div style={{ position: 'absolute', top: 386, left: 90, right: 90, display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 70 }}>
        <p style={{ margin: 0, textAlign: 'center', fontSize: 14, lineHeight: 1.6, color: '#3d382c' }}>{enBody}</p>
        <p dir="rtl" lang="ar" style={{ margin: 0, textAlign: 'center', fontFamily: ARAKOM, fontSize: 17, lineHeight: 1.75, color: '#3d382c' }}>{arBody}</p>
      </div>

      {/* The level's book seals */}
      <div style={{ position: 'absolute', top: 488, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 14 }}>
        {storyIds.map(storyId => (
          <BookSeal key={storyId} storyId={storyId} level={level} size={92} ribbons={false} />
        ))}
      </div>

      {/* Footer: check code, date, certificate seal */}
      <div style={{ position: 'absolute', left: 72, right: 72, bottom: 62, display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'end' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <QrCode value={link} size={86} />
          <div style={{ fontSize: 10.5, lineHeight: 1.45, color: '#4b4433' }}>
            <div style={{ fontWeight: 600, fontSize: 11.5 }}>Check this certificate</div>
            <div dir="rtl" lang="ar" style={{ fontFamily: ARAKOM, fontSize: 13 }}>تَحَقَّقْ مِنْ هٰذِهِ الشَّهَادَةِ</div>
            <div data-certificate-code style={{ marginTop: 2, fontSize: 15, fontWeight: 700, letterSpacing: '0.12em', color: INK }}>{code}</div>
          </div>
        </div>
        <div style={{ textAlign: 'center', minWidth: 220 }}>
          <div style={{ fontSize: 15, fontWeight: 600 }}>{formatDate(date, 'en')}</div>
          <div dir="rtl" lang="ar" style={{ fontFamily: ARAKOM, fontSize: 16 }}>{formatDate(date, 'ar')}</div>
          <div style={{ marginTop: 4, borderTop: `1px solid ${GOLD}`, paddingTop: 3, fontSize: 10.5, color: '#6b6250', letterSpacing: '0.14em' }}>
            DATE · <span style={{ fontFamily: ARAKOM, letterSpacing: 0, fontSize: 12 }}>التَّارِيخُ</span>
          </div>
        </div>
        <div style={{ justifySelf: 'end', marginBottom: -14 }}>
          <BookSeal storyId="seyahatname" level={level} size={124} />
        </div>
      </div>
    </div>
  );
};

/** The certificate page: the learner types a name, sees the certificate, prints it or takes it as an Open Badge. */
export const CertificateDialog: React.FC<{ level: Level | null; onClose: () => void }> = ({ level, onClose }) => {
  const { language } = useLanguage();
  const lang = language === 'ar' ? 'ar' : 'en';
  const copy = COPY[lang];
  const journal = useJournal();
  const [name, setName] = useState(readName);
  const [badgeState, setBadgeState] = useState<'idle' | 'working' | 'failed'>('idle');
  const [canBadge, setCanBadge] = useState(false);
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    if (!level) return;
    setBadgeState('idle');
    openBadgesAvailable().then(setCanBadge);
  }, [level]);

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
  }, [level]);

  const data = useMemo(() => {
    if (!level) return null;
    const storyIds = levelBooks(level).map(story => story.id);
    const sealedAt = storyIds.map(id => journal.seals[editionKey(id, level)] ?? 0);
    const last = Math.max(...sealedAt, 0);
    const stamps = storyIds.reduce(
      (sum, id) => sum + (EDITIONS[editionKey(id, level)]?.chapters ?? []).filter((_, i) => journal.stamps[`${id}:${level}:${i + 1}`] !== undefined).length,
      0,
    );
    return { storyIds, stamps, date: new Date(last > 0 ? last : Date.now()) };
  }, [level, journal]);

  if (!level || !data) return <Modal open={false} onClose={onClose} title={copy.title}>{null}</Modal>;
  const code = encodeCertificate({ level, storyIds: data.storyIds, date: data.date }, name);
  const link = certificateLink(code, name);
  const sheet = <CertificateSheet level={level} name={name} storyIds={data.storyIds} stamps={data.stamps} date={data.date} code={code} link={link} />;

  const downloadBadge = async () => {
    setBadgeState('working');
    const result = await requestOpenBadge(`level-${level}`, name, data.date);
    if (!result?.jwt) {
      setBadgeState('failed');
      return;
    }
    downloadText(`seyahatname-${level.toLowerCase()}-open-badge.jwt`, result.jwt, 'application/jwt');
    setBadgeState('idle');
  };

  return (
    <Modal open onClose={onClose} title={`${copy.title} · ${level}`} wide>
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
