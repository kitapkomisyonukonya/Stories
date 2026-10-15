import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { decodeResult } from '../../lib/resultCode';
import { EDITIONS, editionKey } from '../../lib/seyahatname/store';
import { bookName, placeName, visibleEditions } from '../../lib/seyahatname/view';
import type { Level } from '../../types';
import { Modal } from './Modal';
import { arCount } from './copy';

const STORAGE_KEY = 'v2:class-caravan';

interface CaravanState {
  className: string;
  goal: number;
  /** The book whose journey the caravan follows, "storyId:level". */
  route: string;
  codes: string[];
}

const DEFAULT: CaravanState = { className: '', goal: 60, route: 'ibnJubayr:A2', codes: [] };

const readState = (): CaravanState => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null');
    if (!stored || typeof stored !== 'object') return DEFAULT;
    return {
      className: typeof stored.className === 'string' ? stored.className : '',
      goal: Number.isFinite(stored.goal) && stored.goal > 0 ? stored.goal : DEFAULT.goal,
      route: typeof stored.route === 'string' && EDITIONS[stored.route] ? stored.route : DEFAULT.route,
      codes: Array.isArray(stored.codes) ? stored.codes.filter((code: unknown) => typeof code === 'string') : [],
    };
  } catch {
    return DEFAULT;
  }
};

const COPY = {
  en: {
    title: 'Class caravan',
    eyebrow: 'Class caravan',
    className: 'Class',
    classPlaceholder: 'e.g. 9-B',
    goal: 'Goal: chapter stamps together',
    route: 'Journey',
    from: (a: string, b: string) => `From ${a} to ${b}`,
    of: (goal: string, _value: number) => `of ${goal} stamps`,
    add: 'Add a result code',
    addButton: 'Add',
    bad: 'This code could not be read.',
    codes: 'Codes added',
    none: 'No codes yet. Students find their result code at the end of a book.',
    stamps: (n: string) => `${n} stamps`,
    remove: 'Remove',
    reached: 'The caravan has arrived.',
  },
  ar: {
    title: 'قَافِلَةُ الصَّفِّ',
    eyebrow: 'قَافِلَةُ الصَّفِّ',
    className: 'الصَّفُّ',
    classPlaceholder: 'مِثْلُ 9-B',
    goal: 'الْهَدَفُ: أَخْتَامُ الْفُصُولِ مَعًا',
    route: 'الرِّحْلَةُ',
    from: (a: string, b: string) => `مِنْ ${a} إِلَى ${b}`,
    of: (goal: string, value: number) => `مِنْ ${arCount(value, goal, { one: 'خَتْمٍ وَاحِدٍ', two: 'خَتْمَيْنِ', few: 'أَخْتَامٍ', many: 'خَتْمًا' })}`,
    add: 'أَضِفْ رَمْزَ نَتِيجَةٍ',
    addButton: 'أَضِفْ',
    bad: 'تَعَذَّرَتْ قِرَاءَةُ هٰذَا الرَّمْزِ.',
    codes: 'الرُّمُوزُ الْمُضَافَةُ',
    none: 'لَا رُمُوزَ بَعْدُ. يَجِدُ الطُّلَّابُ رَمْزَ النَّتِيجَةِ فِي آخِرِ الْكِتَابِ.',
    stamps: (n: string) => `الْأَخْتَامُ: ${n}`,
    remove: 'احْذِفْ',
    reached: 'وَصَلَتِ الْقَافِلَةُ.',
  },
};

/** Chapter stamps a result code stands for: the share of chapters read, of that book's chapters. */
const stampsOf = (code: string) => {
  const result = decodeResult(code);
  if (!result) return null;
  const chapters = EDITIONS[editionKey(result.storyId, result.level)]?.chapters.length ?? 0;
  return { ...result, stamps: Math.round((result.chapters / 100) * chapters) };
};

/**
 * The class caravan (teachers): the class sets one goal, each student's result code adds its chapter
 * stamps, and the caravan moves along a book's journey. Only the class total is shown.
 */
export const CaravanPanel: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { language, formatNumber } = useLanguage();
  const lang = language === 'ar' ? 'ar' : 'en';
  const copy = COPY[lang];
  const [state, setState] = useState<CaravanState>(readState);
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* the caravan then lasts for this session */
    }
  }, [state]);

  const entries = useMemo(() => state.codes.map(code => ({ code, result: stampsOf(code) })), [state.codes]);
  const total = entries.reduce((sum, entry) => sum + (entry.result?.stamps ?? 0), 0);
  const share = Math.min(1, total / Math.max(1, state.goal));

  // The route: the book's places in chapter order, each once.
  const [routeStory, routeLevel] = state.route.split(':') as [string, Level];
  const stops = useMemo(() => {
    const edition = EDITIONS[state.route];
    const names: string[] = [];
    edition?.chapters.forEach(chapter => {
      const name = placeName(routeStory, routeLevel, chapter.place, lang);
      if (name && names[names.length - 1] !== name && !names.includes(name)) names.push(name);
    });
    return names.length >= 2 ? names : [bookName(routeStory, lang), copy.reached];
  }, [state.route, routeStory, routeLevel, lang, copy.reached]);

  const routes = visibleEditions().filter(({ storyId, level }) => {
    const edition = EDITIONS[editionKey(storyId, level)];
    return new Set(edition?.chapters.map(chapter => chapter.place).filter(Boolean)).size >= 3;
  });

  const add = () => {
    const code = input.toUpperCase().replace(/[^0-9A-Z]/g, '');
    if (!stampsOf(code)) {
      setError(true);
      return;
    }
    setError(false);
    setInput('');
    setState(prev => ({ ...prev, codes: [code, ...prev.codes] }));
  };

  // The path: stops spread along a gentle wave across the box.
  const W = 1000;
  const H = 300;
  const points = stops.map((_, i) => {
    const x = 70 + (i * (W - 140)) / Math.max(1, stops.length - 1);
    const y = 170 + Math.sin(i * 1.3) * 70 - (i / Math.max(1, stops.length - 1)) * 40;
    return [x, y] as const;
  });
  const path = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  // Where the caravan is: a point along the path at the share of the goal reached.
  const segments = points.slice(1).map((p, i) => Math.hypot(p[0] - points[i][0], p[1] - points[i][1]));
  const length = segments.reduce((a, b) => a + b, 0);
  let left = share * length;
  let at: readonly [number, number] = points[0];
  let reachedStops = 1;
  for (let i = 0; i < segments.length; i += 1) {
    if (left <= segments[i]) {
      const t = segments[i] ? left / segments[i] : 0;
      at = [points[i][0] + (points[i + 1][0] - points[i][0]) * t, points[i][1] + (points[i + 1][1] - points[i][1]) * t];
      reachedStops = i + 1 + (t >= 0.999 ? 1 : 0);
      break;
    }
    left -= segments[i];
    at = points[i + 1];
    reachedStops = i + 2;
  }

  const field = 'w-full rounded-xl border border-black/15 bg-white px-3 py-2 text-[15px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d6b66]';

  return (
    <Modal open={isOpen} onClose={onClose} title={copy.title} wide>
      <div data-caravan>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#047a51]">
              {copy.eyebrow}{state.className ? ` · ${state.className}` : ''}
            </p>
            <h3 className="mt-1 text-[24px] font-semibold leading-tight sm:text-[28px]">{copy.from(stops[0], stops[stops.length - 1])}</h3>
          </div>
          <div className="rounded-2xl bg-[#14221a] px-5 py-3 text-center text-white">
            <b className="block text-[34px] font-semibold leading-none text-[#E7C76A] tabular-nums">{formatNumber(total)}</b>
            <span className="text-[12px]">{copy.of(formatNumber(state.goal), state.goal)}</span>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl bg-[#f7f0df]" dir="ltr">
          <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={`${copy.from(stops[0], stops[stops.length - 1])} · ${formatNumber(total)} ${copy.of(formatNumber(state.goal), state.goal)}`}>
            <path d={path} fill="none" stroke="#c9b48a" strokeWidth="5" strokeDasharray="2 12" strokeLinecap="round" />
            <path d={path} fill="none" stroke="#1d6b66" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${share} 1`} />
            {points.map(([x, y], i) => (
              <g key={i}>
                <circle cx={x} cy={y} r="13" fill={i < reachedStops ? '#1d6b66' : '#fbf6ea'} stroke="#1d6b66" strokeWidth="4" />
                <text x={x} y={y + (i % 2 ? -26 : 40)} textAnchor="middle" fontSize="22" fontWeight="600" fill="#14221a" fontFamily={lang === 'ar' ? 'Arakom, sans-serif' : 'Poppins, sans-serif'}>
                  {stops[i]}
                </text>
              </g>
            ))}
            <g transform={`translate(${at[0]} ${at[1]})`}>
              <circle r="24" fill="#E7C76A" stroke="#14221a" strokeWidth="3" />
              <text y="8" textAnchor="middle" fontSize="20" fontWeight="700" fill="#14221a" fontFamily="Poppins, sans-serif">{Math.round(share * 100)}%</text>
            </g>
          </svg>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-4">
            <label className="block text-[12px] font-semibold text-[#14221a]/70" htmlFor="caravan-class">{copy.className}</label>
            <input id="caravan-class" className={`${field} mt-1`} value={state.className} placeholder={copy.classPlaceholder} maxLength={20} onChange={event => setState(prev => ({ ...prev, className: event.target.value }))} />
            <label className="mt-3 block text-[12px] font-semibold text-[#14221a]/70" htmlFor="caravan-goal">{copy.goal}</label>
            <input id="caravan-goal" type="number" inputMode="numeric" min={1} max={9999} className={`${field} mt-1`} value={state.goal} onChange={event => setState(prev => ({ ...prev, goal: Math.max(1, Math.min(9999, Number(event.target.value) || 1)) }))} />
            <label className="mt-3 block text-[12px] font-semibold text-[#14221a]/70" htmlFor="caravan-route">{copy.route}</label>
            <select id="caravan-route" className={`${field} mt-1`} value={state.route} onChange={event => setState(prev => ({ ...prev, route: event.target.value }))}>
              {routes.map(({ storyId, level }) => (
                <option key={`${storyId}:${level}`} value={`${storyId}:${level}`}>{bookName(storyId, lang)} · {level}</option>
              ))}
            </select>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <label className="block text-[14px] font-semibold" htmlFor="caravan-code">{copy.add}</label>
            <input
              id="caravan-code"
              className={`${field} mt-2 font-mono uppercase`}
              dir="ltr"
              value={input}
              placeholder="ABCD-2345"
              onChange={event => { setInput(event.target.value); setError(false); }}
              onKeyDown={event => { if (event.key === 'Enter') add(); }}
              aria-invalid={error || undefined}
            />
            {error && <p className="mt-1 text-[13px] font-semibold text-[#9b2d20]" role="alert">{copy.bad}</p>}
            <button type="button" onClick={add} className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#E7C76A] text-sm font-semibold text-[#14221a]">
              {copy.addButton}
            </button>
          </div>
          <div className="rounded-2xl bg-white p-4">
            <p className="text-[14px] font-semibold">{copy.codes} · {formatNumber(entries.length)}</p>
            {entries.length === 0 ? (
              <p className="mt-2 text-[13px] text-[#14221a]/60">{copy.none}</p>
            ) : (
              <ul className="mt-2 max-h-44 overflow-y-auto overscroll-contain">
                {entries.map((entry, index) => (
                  <li key={`${entry.code}-${index}`} className="flex items-center justify-between gap-2 border-t border-black/[0.06] py-1.5 text-[13px] first:border-0">
                    <span className="min-w-0 truncate">
                      {entry.result ? `${copy.stamps(formatNumber(entry.result.stamps))} · ${bookName(entry.result.storyId, lang)} ${entry.result.level}` : entry.code}
                    </span>
                    <button type="button" className="shrink-0 rounded-lg px-2 py-1 text-[12px] font-semibold text-[#14221a]/55 hover:bg-black/5" onClick={() => setState(prev => ({ ...prev, codes: prev.codes.filter((_, i) => i !== index) }))}>
                      {copy.remove}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
