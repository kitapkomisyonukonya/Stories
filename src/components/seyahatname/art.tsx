import React, { useId } from 'react';
import type { StampIcon } from '../../lib/seyahatname/places';

/** Line drawings for stamps, in a 200 × 200 box around (100, 104). */
export const STAMP_ICONS: Record<StampIcon, string> = {
  minaret: 'M92 140V82h16v58M88 82h24M96 82V70l4-8 4 8v12M80 140h40M96 100h8M96 116h8',
  walls: 'M62 136h76M66 136V92h18v44M116 136V92h18v44M84 136v-30h32v30M66 92v-8h6v6h6v-6h6v8M116 92v-8h6v6h6v-6h6v8M84 106v-6h6v4h6v-4h8v4h6v-4h6v6M92 136v-14a8 8 0 0 1 16 0v14',
  arches: 'M72 138v-34a10 10 0 0 1 20 0v34M92 138v-38a8 8 0 0 1 16 0v38M108 138v-34a10 10 0 0 1 20 0v34M66 138h68M70 96h60M76 96l4-12h40l4 12',
  ship: 'M68 120h64l-10 16H78zM100 120V68M100 70l24 40h-24M100 76l-18 34h18M64 142c6 4 12 4 18 0s12-4 18 0 12 4 18 0 12-4 18 0',
  lighthouse: 'M90 140l4-52h12l4 52M86 140h28M92 88h16v-8H92zM96 80l4-10 4 10M94 110h12M93 124h14M80 76l-8-3M120 76l8-3',
  cube: 'M70 92l30-14 30 14v34l-30 14-30-14zM70 92l30 14 30-14M100 106v34M70 100l30 14 30-14',
  dome: 'M72 138v-30h56v30M76 108c0-18 10-28 24-30 14 2 24 12 24 30M100 78v-10M66 138h68M88 138v-14a12 12 0 0 1 24 0v14',
  palm: 'M100 140c0-20 2-40 0-58M100 82c-10-8-22-8-30-2M100 82c10-8 22-8 30-2M100 82c-6-10-16-14-24-14M100 82c6-10 16-14 24-14M100 82c-2 8-10 14-18 16M100 82c2 8 10 14 18 16M72 140h56',
  mountain: 'M58 136l30-50 14 18 12-20 28 52zM78 102l10-6 8 8M60 136h82',
  tent: 'M64 134l36-56 36 56zM100 78v56M88 134l12-20 12 20M56 134h88M100 78l-6-10M100 78l6-10',
  well: 'M72 102h56M76 102v34h48v-34M70 136h60M84 102V80h32v22M80 80h40M100 80v12M94 92h12v8H94zM76 116h48',
  quill: 'M128 66c-26 6-42 28-48 58l-6 14M128 66c-2 24-18 42-44 48M84 116l12-2M94 100l16-4M108 84l12-6M70 140h40',
  waves: 'M60 94c8-7 15-7 22 0s15 7 22 0 15-7 22 0 13 6 16 2M60 112c8-7 15-7 22 0s15 7 22 0 15-7 22 0 13 6 16 2M60 130c8-7 15-7 22 0s15 7 22 0 15-7 22 0 13 6 16 2',
  route: 'M64 136c10-2 14-12 22-16s18 0 26-8 8-18 14-22M118 84a10 10 0 1 1 20 0c0 9-10 18-10 18s-10-9-10-18zM128 84h0M60 136h10',
  book: 'M64 124c12-7 24-7 36 0 12-7 24-7 36 0V82c-12-7-24-7-36 0-12-7-24-7-36 0zM100 82v42M72 92c8-3 14-3 20 0M72 104c8-3 14-3 20 0M108 92c8-3 14-3 20 0M108 104c8-3 14-3 20 0',
  flame: 'M100 138c-17 0-28-11-26-27 2-14 14-20 14-34 10 8 12 18 10 26 6-4 8-10 8-16 10 10 18 22 16 34-2 11-9 17-22 17zM100 138c-7 0-11-5-10-12 1-6 6-9 7-15 6 5 9 10 9 16 0 7-2 11-6 11z',
};

/** Each book presses in its own ink, and its wax seal carries its own emblem. */
export const STORY_STYLE: Record<string, { ink: string; wax: string; waxDark: string; emblem: StampIcon; en: string; ar: string }> = {
  ibnJubayr: { ink: '#1d6b66', wax: '#1f6e68', waxDark: '#0b3532', emblem: 'ship', en: 'Ibn Jubayr', ar: 'ابْنُ جُبَيْرٍ' },
  mecca: { ink: '#7a4a1c', wax: '#8a5523', waxDark: '#3e220a', emblem: 'cube', en: 'Mecca', ar: 'مَكَّةُ' },
  adam: { ink: '#2f6b3a', wax: '#356f3c', waxDark: '#143018', emblem: 'palm', en: 'Prophet Adam', ar: 'النَّبِيُّ آدَمُ' },
  ibrahim: { ink: '#9b2d20', wax: '#a3302a', waxDark: '#4a0f0b', emblem: 'flame', en: 'Prophet Abraham', ar: 'النَّبِيُّ إِبْرَاهِيمُ' },
  musa: { ink: '#24406b', wax: '#2a4b7c', waxDark: '#0e1d36', emblem: 'mountain', en: 'Prophet Moses', ar: 'النَّبِيُّ مُوسَى' },
  yunusEmre: { ink: '#5b3a6b', wax: '#6a3f7c', waxDark: '#2a1433', emblem: 'quill', en: 'Yunus Emre', ar: 'يُونُسُ إِمْرَه' },
  gevherNesibe: { ink: '#1f5d74', wax: '#226680', waxDark: '#0b2a36', emblem: 'dome', en: 'Gevher Nesibe', ar: 'جَوْهَر نَسِيبَة' },
  /** The certificate's own seal, in gold. */
  seyahatname: { ink: '#8a6a1f', wax: '#b8892c', waxDark: '#4f3408', emblem: 'book', en: 'Seyahatname', ar: 'الرِّحْلَةُ' },
};

export const storyStyle = (storyId: string) => STORY_STYLE[storyId] ?? STORY_STYLE.ibnJubayr;

/** A steady tilt per stamp, so a page of stamps looks hand-pressed but never moves between visits. */
export const tiltFor = (key: string) => {
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return (Math.abs(hash) % 17) - 8;
};

const svgId = (raw: string) => raw.replace(/[^a-zA-Z0-9_-]/g, '');

/** Fits a line of capitals into an arc of about `room` units. */
const fitSize = (text: string, room: number, max: number) => Math.min(max, room / Math.max(text.length * 0.86, 1));

interface StampProps {
  /** The place, or the book's name when the map ties no place to the chapter. */
  top: string;
  bottom: string;
  number: string;
  icon: StampIcon;
  color: string;
  arabic?: boolean;
  size?: number;
  tilt?: number;
  /** Not earned yet: a pale outline. */
  faded?: boolean;
  className?: string;
  title?: string;
}

/** A chapter stamp: a rubber-stamp impression in the book's ink, with the place, the book and the chapter. */
export const Stamp: React.FC<StampProps> = ({ top, bottom, number, icon, color, arabic = false, size = 120, tilt = 0, faded = false, className, title }) => {
  const id = svgId(useId());
  const ink = faded ? '#b9ae97' : color;
  const latin = { fontFamily: 'Poppins, sans-serif', fontWeight: 700 } as const;
  const topText = arabic ? top : top.toLocaleUpperCase('en');
  const bottomText = arabic ? bottom : bottom.toLocaleUpperCase('en');
  const topSize = fitSize(topText, 175, 15);
  const bottomSize = fitSize(bottomText, 225, 13.5);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      style={{ transform: tilt ? `rotate(${tilt}deg)` : undefined, opacity: faded ? 0.55 : 1 }}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      <defs>
        <filter id={`ink${id}`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="warp" />
          <feDisplacementMap in="SourceGraphic" in2="warp" scale="3" xChannelSelector="R" yChannelSelector="G" result="moved" />
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="7" result="grain" />
          <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -1.7 0 0 0 1.8" result="mask" />
          <feComposite in="moved" in2="mask" operator="in" />
        </filter>
        {!arabic && <path id={`t${id}`} d="M37 100 A63 63 0 0 1 163 100" />}
        {!arabic && <path id={`b${id}`} d="M24 100 A76 76 0 0 0 176 100" />}
      </defs>
      <g filter={faded ? undefined : `url(#ink${id})`} fill="none" stroke={ink}>
        <circle cx="100" cy="100" r="90" strokeWidth="5" />
        <circle cx="100" cy="100" r="83" strokeWidth="1.6" />
        <circle cx="100" cy="100" r="57" strokeWidth="1.6" strokeDasharray={faded ? '4 5' : undefined} />
        <circle cx="29" cy="100" r="3" fill={ink} stroke="none" />
        <circle cx="171" cy="100" r="3" fill={ink} stroke="none" />
        {arabic ? (
          <>
            <text x="100" y="40" textAnchor="middle" fill={ink} stroke="none" fontFamily="Arakom, sans-serif" fontWeight={700} fontSize={Math.min(21, 200 / Math.max(top.replace(/[ً-ْ]/g, '').length, 1))}>{top}</text>
            <text x="100" y="171" textAnchor="middle" fill={ink} stroke="none" fontFamily="Arakom, sans-serif" fontWeight={700} fontSize={Math.min(16, 180 / Math.max(bottom.replace(/[ً-ْ]/g, '').length, 1))}>{bottom}</text>
          </>
        ) : (
          <>
            <text fill={ink} stroke="none" style={{ ...latin, fontSize: topSize, letterSpacing: topSize * 0.17 }}>
              <textPath href={`#t${id}`} startOffset="50%" textAnchor="middle">{topText}</textPath>
            </text>
            <text fill={ink} stroke="none" style={{ ...latin, fontSize: bottomSize, letterSpacing: bottomSize * 0.15 }}>
              <textPath href={`#b${id}`} startOffset="50%" textAnchor="middle">{bottomText}</textPath>
            </text>
          </>
        )}
        <g strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" transform="translate(100 96) scale(.82) translate(-100 -104)">
          <path d={STAMP_ICONS[icon]} />
        </g>
        <text x="100" y="146" fill={ink} stroke="none" textAnchor="middle" fontFamily={arabic ? 'Arakom, sans-serif' : 'Poppins, sans-serif'} fontWeight={700} fontSize={arabic ? 17 : 14}>
          {number}
        </text>
      </g>
    </svg>
  );
};

interface SealProps {
  storyId: string;
  level: string;
  arabic?: boolean;
  size?: number;
  /** Not earned yet: a pale pressed outline where the seal will go. */
  faded?: boolean;
  /** Ribbons under the wax (the big seal); the small library seal leaves them out. */
  ribbons?: boolean;
  title?: string;
  className?: string;
}

/** The pressed lines of a seal: a pale wax tone, so the emblem and the words read on any wax colour. */
const RELIEF = '#fde9d4';

/** The wax seal pressed on a finished book: poured wax with a raised rim, the book's emblem and its level. */
export const BookSeal: React.FC<SealProps> = ({ storyId, level, arabic = false, size = 120, faded = false, ribbons = true, title, className }) => {
  const id = svgId(useId());
  const style = storyStyle(storyId);
  const name = arabic ? style.ar : style.en.toLocaleUpperCase('en');
  if (faded) {
    return (
      <svg width={size} height={size} viewBox="0 0 200 200" className={className} aria-hidden="true">
        <circle cx="100" cy="96" r="70" fill="none" stroke="currentColor" strokeOpacity=".28" strokeWidth="3" strokeDasharray="6 7" />
        <g fill="none" stroke="currentColor" strokeOpacity=".28" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" transform="translate(100 92) scale(.6) translate(-100 -104)">
          <path d={STAMP_ICONS[style.emblem]} />
        </g>
      </svg>
    );
  }
  // Poured wax: a round body with soft lobes where it spread under the press.
  const blob = 'M100 22c12 0 18-6 29-3s13 12 23 17 18 6 21 17-3 18 0 29 11 17 7 28-13 13-17 23-2 21-11 28-19 1-30 6-17 13-29 13-19-9-30-12-22 0-29-9 0-19-6-28-17-12-19-24 7-17 7-28-8-21-1-30 17-6 25-14 9-20 21-23 18 3 30 3z';
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" className={className} role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <defs>
        <radialGradient id={`w${id}`} cx="38%" cy="32%" r="78%">
          <stop offset="0" stopColor={style.wax} stopOpacity="1" />
          <stop offset=".55" stopColor={style.wax} />
          <stop offset="1" stopColor={style.waxDark} />
        </radialGradient>
        <radialGradient id={`p${id}`} cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor={style.waxDark} stopOpacity=".05" />
          <stop offset=".8" stopColor={style.waxDark} stopOpacity=".28" />
          <stop offset="1" stopColor={style.waxDark} stopOpacity=".5" />
        </radialGradient>
        {/* Light from the top left on the wax's relief: the rim and the emblem look pressed in. */}
        <filter id={`gloss${id}`} x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="soft" />
          <feSpecularLighting in="soft" surfaceScale="6" specularConstant=".42" specularExponent="34" lightingColor="#fff4e6" result="spec">
            <fePointLight x="50" y="30" z="120" />
          </feSpecularLighting>
          <feComposite in="spec" in2="SourceAlpha" operator="in" result="shine" />
          <feComposite in="SourceGraphic" in2="shine" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
        </filter>
        <filter id={`press${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feOffset dx="1.2" dy="1.4" in="SourceAlpha" result="up" />
          <feFlood floodColor="#000" floodOpacity=".55" />
          <feComposite in2="up" operator="in" result="dark" />
          <feOffset dx="-0.8" dy="-0.9" in="SourceAlpha" result="down" />
          <feFlood floodColor="#ffffff" floodOpacity=".25" />
          <feComposite in2="down" operator="in" result="light" />
          <feMerge>
            <feMergeNode in="dark" />
            <feMergeNode in="light" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`drop${id}`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#000" floodOpacity=".35" />
        </filter>
        {!arabic && <path id={`r${id}`} d="M48 100 A52 52 0 0 1 152 100" />}
      </defs>
      {ribbons && (
        <g filter={`url(#drop${id})`}>
          <path d="M78 140l-22 52 15-7 9 14 18-50z" fill={style.waxDark} />
          <path d="M122 140l22 52-15-7-9 14-18-50z" fill={style.waxDark} />
          <path d="M80 142l-18 44M120 142l18 44" stroke={style.wax} strokeOpacity=".7" strokeWidth="2" />
        </g>
      )}
      <g filter={`url(#drop${id})`}>
        <path d={blob} fill={`url(#w${id})`} filter={`url(#gloss${id})`} />
      </g>
      {/* The pressed disc and its beaded rim. */}
      <circle cx="100" cy="100" r="62" fill={`url(#p${id})`} />
      <g filter={`url(#press${id})`}>
        <circle cx="100" cy="100" r="62" fill="none" stroke={RELIEF} strokeOpacity=".55" strokeWidth="2.5" />
        {Array.from({ length: 36 }, (_, i) => {
          const angle = (i / 36) * Math.PI * 2;
          return <circle key={i} cx={100 + Math.cos(angle) * 69} cy={100 + Math.sin(angle) * 69} r="1.8" fill={RELIEF} fillOpacity=".5" />;
        })}
        <circle cx="100" cy="100" r="40" fill="none" stroke={RELIEF} strokeOpacity=".5" strokeWidth="1.8" />
        <g fill="none" stroke={RELIEF} strokeOpacity=".9" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" transform="translate(100 98) scale(.52) translate(-100 -104)">
          <path d={STAMP_ICONS[style.emblem]} />
        </g>
        {arabic ? (
          <text x="100" y="58" textAnchor="middle" fill={RELIEF} fillOpacity=".9" fontFamily="Arakom, sans-serif" fontWeight={700} fontSize={Math.min(15, 110 / Math.max(name.replace(/[ً-ْ]/g, '').length, 1))}>{name}</text>
        ) : (
          <text fill={RELIEF} fillOpacity=".9" style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: fitSize(name, 150, 11.5), letterSpacing: 1.6 }}>
            <textPath href={`#r${id}`} startOffset="50%" textAnchor="middle">{name}</textPath>
          </text>
        )}
        <text x="100" y="153" textAnchor="middle" fill={RELIEF} fillOpacity=".9" style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 700, fontSize: 15, letterSpacing: 2 }}>{level}</text>
      </g>
    </svg>
  );
};

/** Traveller badge drawings, in the same 200 box. */
export const BADGE_ICONS: Record<string, string> = {
  firstStamp: 'M100 64a36 36 0 1 0 0.1 0zM100 76a24 24 0 1 0 0.1 0zM92 100l6 6 12-14',
  firstSeal: 'M100 62c10 0 14 6 22 8s14 8 14 18-6 14-6 22 4 14-4 20-14 4-20 8-10 8-18 6-12-8-20-10-14-6-14-16 6-14 4-22-6-16 2-22 14-4 22-8 8-4 18-4zM86 106l10 10 18-22',
  twoLanguages: 'M64 76h34v24H80l-10 8v-8h-6zM102 92h34v24h-6v8l-10-8h-18zM74 88h14M112 104h14',
  allPlaces: 'M66 82l22-8 24 8 22-8v52l-22 8-24-8-22 8zM88 74v52M112 82v52M76 104l8 8 14-16',
  wordChest: 'M62 96h76v40H62zM62 96c0-14 12-22 38-22s38 8 38 22M62 108h76M94 102h12v12H94z',
  threeCollections: 'M68 132V80h12v52M84 132V74h12v58M100 132V84h12v48M116 132l6-50 12 2-6 48M62 132h76',
  weeklyGoal: 'M100 70a34 34 0 1 0 0.1 0M100 84a20 20 0 1 0 0.1 0M100 98a6 6 0 1 0 0.1 0',
  levelComplete: 'M64 128l36-50 36 50M80 128l20-26 20 26M56 134h88M100 70v8',
};

export const BadgeMark: React.FC<{ badge: string; earned: boolean; size?: number }> = ({ badge, earned, size = 64 }) => (
  <svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true">
    <circle cx="100" cy="100" r="92" fill={earned ? '#fff7ed' : 'transparent'} stroke={earned ? '#b7791f' : 'currentColor'} strokeOpacity={earned ? 1 : 0.3} strokeWidth="7" />
    <circle cx="100" cy="100" r="80" fill="none" stroke={earned ? '#b7791f' : 'currentColor'} strokeOpacity={earned ? 1 : 0.25} strokeWidth="2" strokeDasharray={earned ? undefined : '6 8'} />
    <path d={BADGE_ICONS[badge]} fill="none" stroke={earned ? '#14221a' : 'currentColor'} strokeOpacity={earned ? 1 : 0.4} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
