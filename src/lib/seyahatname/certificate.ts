import type { Level } from '../../types';
import { storyCatalog } from '../../core/content/storyCatalog';

/**
 * The certificate's check code: 8 characters carrying the level, the language, the books, the day and
 * a short fingerprint of the name, with a check digit. Typed in or scanned, it shows what the certificate
 * says; changing the name or a letter breaks it. Like the result code, a light check, not a register.
 */
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const LEVELS: Level[] = ['A2', 'B1', 'B2'];
const EPOCH = Date.UTC(2026, 0, 1);
const DAY = 86_400_000;

const nameHash = (name: string) => {
  let hash = 2166136261;
  for (const char of name.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr')) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  return hash % 1024;
};

const checksum = (bits: bigint) => {
  let sum = 0n;
  let rest = bits;
  while (rest > 0n) {
    sum = (sum * 7n + (rest & 0xfn) + 5n) % 16n;
    rest >>= 4n;
  }
  return sum;
};

export interface CertificateData {
  level: Level;
  /** Each certificate is in one language: the language its books were read in. */
  lang: 'en' | 'ar';
  storyIds: string[];
  /** The day the last book was sealed. */
  date: Date;
}

export const encodeCertificate = (data: CertificateData, name: string) => {
  const mask = storyCatalog.reduce((value, story, index) => (data.storyIds.includes(story.id) ? value | (1 << index) : value), 0);
  const day = Math.max(0, Math.min(8191, Math.floor((data.date.getTime() - EPOCH) / DAY)));
  let bits = BigInt(LEVELS.indexOf(data.level));
  bits = (bits << 1n) | (data.lang === 'ar' ? 1n : 0n);
  bits = (bits << 10n) | BigInt(mask & 1023);
  bits = (bits << 13n) | BigInt(day);
  bits = (bits << 10n) | BigInt(nameHash(name));
  bits = (bits << 4n) | checksum(bits);
  let code = '';
  for (let i = 0; i < 8; i += 1) {
    code = ALPHABET[Number(bits & 31n)] + code;
    bits >>= 5n;
  }
  return `${code.slice(0, 4)}-${code.slice(4)}`;
};

/** Null when the code is mistyped or does not belong to this name. */
export const decodeCertificate = (raw: string, name: string): CertificateData | null => {
  const code = raw.toUpperCase().replace(/[^0-9A-Z]/g, '');
  if (code.length !== 8) return null;
  let bits = 0n;
  for (const char of code) {
    const index = ALPHABET.indexOf(char);
    if (index < 0) return null;
    bits = (bits << 5n) | BigInt(index);
  }
  const check = bits & 0xfn;
  bits >>= 4n;
  if (checksum(bits) !== check) return null;
  const hash = Number(bits & 1023n);
  bits >>= 10n;
  const day = Number(bits & 8191n);
  bits >>= 13n;
  const mask = Number(bits & 1023n);
  bits >>= 10n;
  const lang = bits & 1n ? 'ar' : 'en';
  bits >>= 1n;
  const level = LEVELS[Number(bits)];
  if (!level || hash !== nameHash(name)) return null;
  return {
    level,
    lang,
    storyIds: storyCatalog.filter((_, index) => mask & (1 << index)).map(story => story.id),
    date: new Date(EPOCH + day * DAY),
  };
};

const AR_MONTHS = ['يَنَايِر', 'فِبْرَايِر', 'مَارِس', 'أَبْرِيل', 'مَايُو', 'يُونْيُو', 'يُولْيُو', 'أَغُسْطُس', 'سِبْتَمْبَر', 'أُكْتُوبَر', 'نُوفَمْبَر', 'دِيسَمْبَر'];

/** "13 October 2026"; in Arabic with Arabic digits and the month fully vowelled. */
export const formatCertificateDate = (date: Date, lang: 'en' | 'ar') => {
  if (lang === 'en') return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(date);
  const digits = (value: number) => new Intl.NumberFormat('ar-u-nu-arab', { useGrouping: false }).format(value);
  return `${digits(date.getUTCDate())} ${AR_MONTHS[date.getUTCMonth()]} ${digits(date.getUTCFullYear())}`;
};

export const certificateLink = (code: string, name: string) =>
  `${window.location.origin}${window.location.pathname}?belge=${encodeURIComponent(code)}&ad=${encodeURIComponent(name.trim())}`;

/** Asks the server for a signed Open Badges 3.0 credential. Null when signing is not available. */
export const requestOpenBadge = async (achievement: string, name: string, date: Date) => {
  try {
    const response = await fetch('/ob/issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ achievement, name, date: date.toISOString().slice(0, 10) }),
    });
    if (!response.ok) return null;
    const result = (await response.json()) as { credential: unknown; jwt: string | null };
    return result.jwt ? result : null;
  } catch {
    return null;
  }
};

let signingKnown: Promise<boolean> | null = null;
/** Whether the server signs Open Badges (its key is set). Asked once. */
export const openBadgesAvailable = () => {
  signingKnown ??= fetch('/ob/issuer')
    .then(response => (response.ok ? response.json() : { signing: false }))
    .then(profile => Boolean(profile?.signing))
    .catch(() => false);
  return signingKnown;
};

export const downloadText = (fileName: string, text: string, type = 'application/json') => {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
};
