import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';
import type { PageData } from '../../types';

/** Key Terms (Our World Today books, in place of Places & People): flip cards, English front and Arabic back. */
const COPY = {
  en: { turn: 'Turn the card', chapter: (n: string) => `Chapter ${n}`, picture: 'Picture coming' },
  ar: { turn: 'اِقْلِبِ الْبِطَاقَةَ', chapter: (n: string) => `الْفَصْلُ ${n}`, picture: 'الصُّورَةُ قَادِمَةٌ' },
};

export default function KeyTermsPage({ page }: { page: PageData }) {
  const { language, formatNumber, isRTL } = useLanguage();
  const copy = COPY[language === 'ar' ? 'ar' : 'en'];
  // The Arabic reader starts each card on its Arabic side.
  const [turned, setTurned] = useState<Set<number>>(new Set());
  const terms = page.terms ?? [];
  const toggle = (i: number) => setTurned(prev => {
    const next = new Set(prev);
    if (next.has(i)) next.delete(i); else next.add(i);
    return next;
  });

  return (
    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar" dir={isRTL ? 'rtl' : 'ltr'}>
      <ul className="m-0 grid list-none grid-cols-1 gap-4 p-1 pb-6 sm:grid-cols-2 xl:grid-cols-3">
        {terms.map((term, i) => {
          const arabicSide = (language === 'ar') !== turned.has(i);
          return (
            <li key={term.term} className="[perspective:1200px]">
              <button
                type="button"
                onClick={() => toggle(i)}
                aria-pressed={turned.has(i)}
                aria-label={`${arabicSide ? term.termAr : term.term}. ${copy.turn}`}
                className="relative block h-[21rem] w-full text-start"
              >
                <span className={cn('absolute inset-0 transition-transform duration-500 [transform-style:preserve-3d] motion-reduce:transition-none', arabicSide && '[transform:rotateY(180deg)]')}>
                  {[false, true].map(back => (
                    <span
                      key={String(back)}
                      dir={back ? 'rtl' : 'ltr'}
                      className={cn('absolute inset-0 flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm [backface-visibility:hidden]', back && '[transform:rotateY(180deg)]')}
                    >
                      <span className="relative block h-32 w-full shrink-0 bg-[radial-gradient(120%_90%_at_70%_10%,var(--brand-200),transparent_60%),radial-gradient(90%_80%_at_10%_100%,rgba(85,201,151,0.18),transparent_60%)] bg-[var(--brand-50)]">
                        {term.image
                          ? <img src={term.image} alt="" className="h-full w-full object-cover" loading="lazy" />
                          : <span className="absolute inset-0 grid place-items-center text-[12px] text-[var(--brand-700)]/70">{copy.picture}</span>}
                      </span>
                      <span className="flex flex-1 flex-col gap-1 px-4 pb-3 pt-3">
                        {!back && <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--accent-strong)]">{term.kind}</span>}
                        <span className={cn('block font-semibold text-stone-900', back ? 'font-arabic text-[22px] leading-snug' : 'text-[19px] leading-tight')}>{back ? term.termAr : term.term}</span>
                        <span className={cn('block text-stone-600', back ? 'font-arabic text-[17px] leading-relaxed' : 'text-[14px]')}>{back ? term.definitionAr : term.definition}</span>
                        <span className="mt-auto flex justify-between pt-1 text-[12px] text-stone-400">
                          <span>{back ? COPY.ar.chapter(formatNumber(term.chapter)) : COPY.en.chapter(String(term.chapter))}</span>
                          <span aria-hidden="true">{back ? 'AR ↻ EN' : 'EN ↻ AR'}</span>
                        </span>
                      </span>
                    </span>
                  ))}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
