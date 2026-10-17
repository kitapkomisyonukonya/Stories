import React, { useState } from 'react';
import type { Level } from '../../types';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { EDITIONS, editionKey, stampKey, useJournal } from '../../lib/seyahatname/store';
import { storyStyle } from './art';
import { Modal } from './Modal';

const COPY = {
  en: {
    chip: (n: string, total: string) => `${n} of ${total} places stamped`,
    title: 'Stamped places',
    text: 'A place is stamped when you finish a chapter that takes place there.',
    chapters: 'Chapter',
    stamped: 'Stamped',
    open: 'Not yet',
    journal: 'Open my Seyahatname',
  },
  ar: {
    chip: (n: string, total: string) => `الْأَمَاكِنُ الْمَخْتُومَةُ: ${n} / ${total}`,
    title: 'الْأَمَاكِنُ الْمَخْتُومَةُ',
    text: 'يُخْتَمُ الْمَكَانُ عِنْدَمَا تُكْمِلُ فَصْلًا تَجْرِي أَحْدَاثُهُ فِيهِ.',
    chapters: 'الْفَصْلُ',
    stamped: 'مَخْتُومٌ',
    open: 'لَيْسَ بَعْدُ',
    journal: 'افْتَحْ دَفْتَرَ رِحْلَتِي',
  },
};

/** The small round ink mark beside a stamped place. */
export const StampMark: React.FC<{ color: string; size?: number; title?: string }> = ({ color, size = 18, title }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" role={title ? 'img' : undefined} aria-label={title} aria-hidden={title ? undefined : true} className="shrink-0">
    <circle cx="10" cy="10" r="8.2" fill="none" stroke={color} strokeWidth="1.8" />
    <circle cx="10" cy="10" r="5.6" fill="none" stroke={color} strokeWidth=".9" />
    <path d="M7 10.2l2 2 4-4.4" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Which map places are stamped, from the chapters done. */
export const useStampedPlaces = (storyId: string | undefined, level: Level | undefined) => {
  const journal = useJournal();
  if (!storyId || !level) return null;
  const edition = EDITIONS[editionKey(storyId, level)];
  if (!edition) return null;
  const places = edition.places.filter(place => place.chapters.length > 0);
  const stamped = new Set(places.filter(place => place.chapters.some(n => journal.stamps[stampKey(storyId, level, n)] !== undefined)).map(place => place.id));
  return { places, stamped, color: storyStyle(storyId).ink };
};

/** The map's "5 of 13 places stamped" button and the list it opens. */
export const MapStampsButton: React.FC<{ storyId?: string; level?: Level; className?: string; names: Record<string, { name: string; kind: string }> }> = ({ storyId, level, className, names }) => {
  const { language, formatNumber } = useLanguage();
  const copy = COPY[language === 'ar' ? 'ar' : 'en'];
  const [open, setOpen] = useState(false);
  const data = useStampedPlaces(storyId, level);
  if (!data || data.places.length === 0) return null;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className} data-map-stamps aria-haspopup="dialog">
        <StampMark color={data.color} size={16} />
        {copy.chip(formatNumber(data.stamped.size), formatNumber(data.places.length))}
      </button>
      <Modal open={open} onClose={() => setOpen(false)} title={copy.title}>
        <p className="text-[13.5px] leading-relaxed text-[#14221a]/70">{copy.text}</p>
        <ul className="mt-3 divide-y divide-black/[0.06] rounded-2xl border border-black/[0.07] bg-white/80" data-map-stamps-list>
          {data.places.map(place => {
            const done = data.stamped.has(place.id);
            return (
              <li key={place.id} className="flex items-center gap-3 px-3 py-2.5" data-stamped={done || undefined}>
                {done ? <StampMark color={data.color} size={26} /> : <span className="h-[26px] w-[26px] shrink-0 rounded-full border-2 border-dashed border-black/15" aria-hidden="true" />}
                <span className="min-w-0 flex-1">
                  <b className={cn('block truncate text-[14.5px] font-semibold', !done && 'text-[#14221a]/60')}>{names[place.id]?.name ?? place.en}</b>
                  <span className="block text-[12px] text-[#14221a]/55">
                    {names[place.id]?.kind ?? place.kind} · {copy.chapters} {place.chapters.map(n => formatNumber(n)).join(language === 'ar' ? '، ' : ', ')}
                  </span>
                </span>
                <span className={cn('shrink-0 text-[12px] font-semibold', done ? 'text-[#1d6b66]' : 'text-[#14221a]/45')}>{done ? copy.stamped : copy.open}</span>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          onClick={() => { setOpen(false); window.dispatchEvent(new Event('seyahatname:open')); }}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#C2AA6B] text-sm font-semibold"
        >
          {copy.journal}
        </button>
      </Modal>
    </>
  );
};
