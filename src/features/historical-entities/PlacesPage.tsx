import React, { useMemo, useRef, useState } from 'react';
import { ArrowRight, BookOpen, ChevronUp, Compass, Target } from '../../components/ui/icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';
import { useIsPhone } from '../../lib/phone';
import type { PageData } from '../../types';
import { GROUP_COLORS, GROUP_OF_KIND, GROUP_ORDER, tint, type EntityGroup } from './categories';
import { EntityMap } from './EntityMap';
import { EntityPicture } from './EntityPicture';
import { LearnerName } from './LearnerNameLine';
import { MapGame } from './MapGame';
import { MEDITERRANEAN_MAP_ASPECT, mediterraneanContextMap } from './mediterraneanMap';
import {
  getBookEntityIndex,
  isHistoricalEntityBookKey,
  resolveHistoricalCopy,
  resolveHistoricalMapAsset,
  type BookEntityEntry,
} from './registry';
import type { HistoricalEntity } from './types';
import { findPlaceName } from './placeMatch';

const COPY = {
  en: {
    eyebrow: 'Book atlas',
    all: 'All',
    groups: {
      cities: 'Cities',
      lands: 'Lands and regions',
      water: 'Seas, rivers and islands',
      buildings: 'Buildings',
      people: 'People and rulers',
    } satisfies Record<EntityGroup, string>,
    chapter: 'Chapter',
    chapters: 'Chapters',
    chapterShort: 'Ch.',
    places: 'places',
    names: 'names',
    noMap: 'This card has no map.',
    play: 'Find it on the map',
    gameHint: (n: string) => `A map game: find ${n} places and names from the story`,
    gameGo: 'Play',
    gameClose: 'Close',
    inTheStory: 'In the story',
    readChapter: (chapter: string) => `Read Chapter ${chapter}`,
  },
  ar: {
    eyebrow: 'أطلس الكتاب',
    all: 'الكل',
    groups: {
      cities: 'المدن',
      lands: 'البلاد والمناطق',
      water: 'البحار والأنهار والجزر',
      buildings: 'المباني',
      people: 'الناس والحكّام',
    } satisfies Record<EntityGroup, string>,
    chapter: 'الفصل',
    chapters: 'الفصول',
    chapterShort: 'ف',
    places: 'مكانًا',
    names: 'اسمًا',
    noMap: 'ليس لهذه البطاقة خريطة.',
    play: 'اِبْحَثْ عَنْهُ عَلَى الخَرِيطَةِ',
    gameHint: (n: string) => `لُعْبَةُ خَرِيطَةٍ: اِبْحَثْ عَنْ ${n} مِنَ الأَمَاكِنِ وَالأَسْمَاءِ فِي القِصَّةِ`,
    gameGo: 'اِلْعَبْ',
    gameClose: 'إِغْلَاقٌ',
    inTheStory: 'في القصة',
    readChapter: (chapter: string) => `اقرأ الفصل ${chapter}`,
  },
};

const aspectRatioOf = (aspect: string) => {
  const [width, height] = aspect.split('/').map(part => Number(part.trim()));
  return width && height ? width / height : 4 / 3;
};

interface StoryQuote {
  chapter: number;
  pageIndex: number;
  sentence: string;
  alias: string;
}

/** The first sentence of the story that names the entity, quoted exactly. */
const findStoryQuote = (entity: HistoricalEntity, chapters: number[], pages: PageData[], locale: 'en' | 'ar'): StoryQuote | undefined => {
  const aliases = entity.aliases[locale] ?? entity.aliases.en ?? [];
  for (const chapter of chapters) {
    const pageIndex = pages.findIndex(page => page.type === 'story' && page.id === chapter);
    if (pageIndex < 0) continue;
    const sentences = pages[pageIndex].content
      .replace(/\*\*/g, '')
      .split(/\n+/)
      .flatMap(paragraph => paragraph.split(locale === 'ar' ? /(?<=[.!؟])\s+/ : /(?<=[.!?])\s+(?=[A-Z“"])/));
    for (const sentence of sentences) {
      // The name exactly as the sentence writes it (Arabic adds vowels and letters).
      const alias = aliases.map(candidate => findPlaceName(sentence, candidate, locale)).find(Boolean);
      if (alias) return { chapter, pageIndex, sentence: sentence.trim(), alias };
    }
  }
  return undefined;
};

/** The quote with the entity's name picked out in its group colour. */
const QuoteText = ({ quote, color }: { quote: StoryQuote; color: string }) => {
  const at = quote.sentence.indexOf(quote.alias);
  return (
    <>
      {quote.sentence.slice(0, at)}
      <strong className="font-bold not-italic" style={{ color }}>{quote.alias}</strong>
      {quote.sentence.slice(at + quote.alias.length)}
    </>
  );
};

export const PlacesPage = ({
  page,
  pages = [],
  onOpenPage,
}: {
  page: PageData;
  /** All pages of the book, for the story quote and the chapter link. */
  pages?: PageData[];
  onOpenPage?: (pageIndex: number) => void;
}) => {
  const { language, formatNumber, isRTL } = useLanguage();
  const locale = language === 'ar' ? 'ar' : 'en';
  const text = COPY[locale];
  const isPhone = useIsPhone();
  // Phones: cards are closed (small picture, name, kind); tapping one opens it and shows it on the map.
  const [openCardId, setOpenCardId] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef(new Map<string, HTMLDivElement>());

  const entries = useMemo<BookEntityEntry[]>(
    () => (isHistoricalEntityBookKey(page.entityBookKey) ? getBookEntityIndex(page.entityBookKey) : []),
    [page.entityBookKey],
  );
  const grouped = useMemo(() => GROUP_ORDER.map(key => ({
    key,
    entries: entries.filter(entry => GROUP_OF_KIND[entry.entity.kind] === key),
  })).filter(group => group.entries.length > 0), [entries]);

  const [activeGroup, setActiveGroup] = useState<EntityGroup | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | undefined>(() => entries[0]?.entity.id);
  const [playing, setPlaying] = useState(false);

  const selected = entries.find(entry => entry.entity.id === selectedId) ?? entries[0];
  // Every card shows its story quote, so they are all found once.
  const quotes = useMemo(
    () => new Map(entries.map(entry => [entry.entity.id, findStoryQuote(entry.entity, entry.chapters, pages, locale)])),
    [entries, pages, locale],
  );
  if (!selected) return null;

  const selectedCopy = resolveHistoricalCopy(selected.entity, locale);
  const selectedMap = resolveHistoricalMapAsset(selected.entity, locale);
  const selectedColors = GROUP_COLORS[GROUP_OF_KIND[selected.entity.kind]];
  const placeCount = entries.filter(entry => GROUP_OF_KIND[entry.entity.kind] !== 'people').length;
  const nameCount = entries.length - placeCount;
  const mapAspect = selected.entity.mapAspect ?? MEDITERRANEAN_MAP_ASPECT;
  // On large screens the map takes the room left above the picture row: as wide
  // as the column allows, and never taller than the space it sits in.
  const mapClassName = 'w-full lg:w-[min(100cqw,calc((100cqh-var(--info-height)-2.5rem)*var(--map-ratio)))]';
  const mapStyle = { '--map-ratio': aspectRatioOf(mapAspect) } as React.CSSProperties;
  const slidOut = selected.entity.focus?.mode === 'feature' && Boolean(selected.entity.focus.view);

  const markers = slidOut ? [] : entries
    .filter(entry => entry.entity.focus?.mode === 'point' && entry.entity.id !== selected.entity.id)
    .map(entry => ({
      id: entry.entity.id,
      x: entry.entity.focus!.x,
      y: entry.entity.focus!.y,
      color: tint(GROUP_COLORS[GROUP_OF_KIND[entry.entity.kind]].base, 0.75),
    }));

  const scrollToDetail = () => {
    if (window.matchMedia('(max-width: 1023px)').matches) {
      window.setTimeout(() => detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
    }
  };

  const select = (id: string, fromCard = false) => {
    setSelectedId(id);
    setPlaying(false);
    if (isPhone) {
      if (fromCard) setOpenCardId(current => (current === id ? null : id));
      else {
        setOpenCardId(id);
        window.setTimeout(() => cardRefs.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
      }
      return;
    }
    scrollToDetail();
    // A place picked on the map brings its card into view in the list.
    if (!window.matchMedia('(max-width: 1023px)').matches) {
      window.setTimeout(() => cardRefs.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
    }
  };

  const listSeparator = locale === 'ar' ? '، ' : ', ';
  const chapterLine = (chapters: number[]) =>
    `${chapters.length > 1 ? text.chapters : text.chapter} ${chapters.map(chapter => formatNumber(chapter)).join(listSeparator)}`;
  // A short tag on the card: a long list ends in "+N" (the full list is in its tooltip).
  const chapterTag = (chapters: number[]) => {
    const shown = chapters.length > 3 ? chapters.slice(0, 2) : chapters;
    const rest = chapters.length - shown.length;
    return `${text.chapterShort} ${shown.map(chapter => formatNumber(chapter)).join(listSeparator)}${rest ? ` +${formatNumber(rest)}` : ''}`;
  };

  const showAll = activeGroup === 'all';
  const visibleEntries = (showAll ? grouped : grouped.filter(group => group.key === activeGroup)).flatMap(group => group.entries);

  const renderCard = (entry: BookEntityEntry) => {
    const color = GROUP_COLORS[GROUP_OF_KIND[entry.entity.kind]].base;
    const copy = resolveHistoricalCopy(entry.entity, locale);
    const isActive = entry.entity.id === selected.entity.id;
    const cardStyle: React.CSSProperties = {
      borderInlineStartColor: color,
      ...(isActive ? { backgroundColor: tint(color, 0.12), boxShadow: `0 0 0 2px ${tint(color, 0.4)}` } : {}),
    };
    const title = (
      <>
        {copy.title}
        <LearnerName entity={entry.entity} className="text-wood/75" />
      </>
    );
    const tag = (
      <span className="shrink-0 text-[11px] leading-tight text-wood/60 min-[1800px]:text-xs" title={chapterLine(entry.chapters)}>
        {chapterTag(entry.chapters)}
      </span>
    );
    const quote = quotes.get(entry.entity.id);

    if (isPhone && openCardId !== entry.entity.id) {
      return (
        <div
          key={entry.entity.id}
          ref={element => { if (element) cardRefs.current.set(entry.entity.id, element); else cardRefs.current.delete(entry.entity.id); }}
          role="button"
          tabIndex={0}
          aria-expanded={false}
          onClick={() => select(entry.entity.id, true)}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(entry.entity.id, true); }
          }}
          style={cardStyle}
          className={cn(
            'flex cursor-pointer items-center gap-3 rounded-2xl border border-black/5 border-s-[3px] p-2 text-start',
            isActive ? 'shadow-sm' : 'bg-white/75',
          )}
        >
          <EntityPicture entity={entry.entity} iconSize={22} className="aspect-square h-14 w-14 shrink-0 rounded-xl" />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color }}>{copy.kindLabel}</span>
            <h4 className="font-display text-[15px] font-bold leading-tight text-brand-950">{title}</h4>
          </div>
          {tag}
          <ChevronUp size={16} className="shrink-0 rotate-180 text-wood/45" />
        </div>
      );
    }

    // Every card is complete on its own: text, extra sentence and story quote.
    // Selecting a card only highlights it and shows it on the map; its size never changes.
    return (
      // The card is clickable but not itself a button: it holds the "Read Chapter" button,
      // and a button inside a button is invalid. The title button carries the keyboard path.
      <div
        key={entry.entity.id}
        ref={element => { if (element) cardRefs.current.set(entry.entity.id, element); else cardRefs.current.delete(entry.entity.id); }}
        onClick={() => select(entry.entity.id, true)}
        style={cardStyle}
        className={cn(
          'flex cursor-pointer items-stretch gap-3 rounded-2xl border border-black/5 border-s-[3px] p-2.5 text-start transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50',
          isActive ? 'shadow-sm' : 'bg-white/75 hover:bg-white',
        )}
      >
        <EntityPicture entity={entry.entity} iconSize={32} className="aspect-square h-24 w-24 shrink-0 self-start rounded-xl lg:h-auto lg:w-[38%] lg:max-w-[13rem]" />
        <div className="flex min-w-0 flex-1 flex-col py-0.5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color }}>{copy.kindLabel}</span>
            {tag}
          </div>
          <h4 className="font-display text-[15px] font-bold leading-tight text-brand-950 min-[1800px]:text-[17px]">
            <button
              type="button"
              aria-pressed={isActive}
              onClick={event => { event.stopPropagation(); select(entry.entity.id, true); }}
              className="text-start focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50"
            >
              {title}
            </button>
          </h4>
          <span className="mt-1 text-xs font-semibold" style={{ color }}>{copy.periodLabel}</span>
          <p className="mt-1 font-serif text-[13.5px] leading-snug text-wood/85 min-[1800px]:text-[15px]">
            {copy.summary}
            {copy.more && <> {copy.more}</>}
          </p>
          <span aria-hidden className="block h-2 shrink-0" />
          {quote && (
            <figure
              className="mt-auto rounded-xl border-s-[3px] px-2.5 py-1.5"
              style={{ borderInlineStartColor: tint(color, 0.6), backgroundColor: tint(color, 0.06) }}
            >
              <figcaption className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-wood/60">
                <BookOpen size={12} className="shrink-0" /> {text.inTheStory} · {text.chapter} {formatNumber(quote.chapter)}
              </figcaption>
              <blockquote className="mt-0.5 font-serif text-[13px] italic leading-snug text-wood/85 min-[1800px]:text-[14px]">
                “<QuoteText quote={quote} color={color} />”
              </blockquote>
              {onOpenPage && (
                <button
                  type="button"
                  onClick={event => {
                    event.stopPropagation();
                    onOpenPage(quote.pageIndex);
                  }}
                  className="-ms-1.5 mt-0.5 inline-flex min-h-8 items-center gap-1 rounded-md px-1.5 py-1 text-xs font-bold hover:bg-white/80"
                  style={{ color }}
                >
                  {text.readChapter(formatNumber(quote.chapter))}
                  <ArrowRight size={12} className={cn(isRTL && 'rotate-180')} />
                </button>
              )}
            </figure>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar lg:overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex flex-col gap-3 pb-2 lg:h-full lg:pb-5">
        {/* Phones: the page name is already in the top bar, so the map game is offered here in words. */}
        <button
          type="button"
          onClick={() => setPlaying(value => !value)}
          aria-pressed={playing}
          className={cn('flex w-full items-center gap-3 rounded-2xl bg-teal-700 px-3.5 py-2.5 text-start text-white shadow-md sm:hidden', playing && 'hidden')}
        >
          <Target size={24} className="shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="block font-display text-[15px] font-bold leading-tight">{text.play}</span>
            <span className="block text-[12px] leading-snug text-white">{text.gameHint(formatNumber(entries.length))}</span>
          </span>
          <span className="shrink-0 rounded-xl bg-white px-3 py-1.5 font-display text-[13px] font-bold text-teal-800">
            {playing ? text.gameClose : text.gameGo}
          </span>
        </button>
        <section className="relative overflow-hidden rounded-2xl border border-brand-200/70 bg-gradient-to-br from-brand-50/95 via-white/80 to-brand-50/70 px-4 py-2 shadow-sm max-sm:hidden">
          <div className="relative flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-700 text-white shadow-md">
              <Compass size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-teal-800 sm:text-[11px]">{text.eyebrow}</div>
              <h2 className="text-lg font-black leading-tight tracking-tight text-brand-950 sm:text-xl">{page.title}</h2>
            </div>
            <p className="hidden max-w-md text-sm leading-snug text-wood/65 xl:block [@media(max-height:820px)]:hidden">{page.content}</p>
            <p className="hidden shrink-0 text-xs font-bold text-teal-800/80 sm:block">
              {formatNumber(placeCount)} {text.places} · {formatNumber(nameCount)} {text.names}
            </p>
            <button
              type="button"
              onClick={() => {
                setPlaying(value => !value);
                scrollToDetail();
              }}
              aria-pressed={playing}
              aria-label={text.play}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold shadow-sm transition-colors',
                playing ? 'bg-teal-900 text-white' : 'bg-teal-700 text-white hover:bg-teal-800',
              )}
            >
              <Target size={15} />
              <span className="hidden sm:inline">{text.play}</span>
            </button>
          </div>
        </section>

        {playing ? (
          <div ref={detailRef} className="scroll-mt-3 lg:min-h-0 lg:flex-1">
            <MapGame entries={entries} locale={locale} onClose={() => setPlaying(false)} />
          </div>
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] min-[1800px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            {/* Phones: only the map (no picture); a tapped card brings it back into view. */}
            <div ref={detailRef} className="scroll-mt-3 lg:min-h-0">
              <section
                className="flex flex-col rounded-2xl border border-black/5 bg-white/55 p-3 shadow-sm backdrop-blur-sm [--info-height:50cqh] lg:h-full lg:[container-type:size] max-sm:p-2"
              >
                <div className="flex shrink-0 justify-center">
                  <EntityMap
                    src={selectedMap ?? mediterraneanContextMap}
                    alt={selectedMap ? selectedCopy.mapAlt : ''}
                    focus={selectedMap ? selected.entity.focus : undefined}
                    showFocus={Boolean(selectedMap && selected.entity.showFocus)}
                    aspect={mapAspect}
                    color={selectedColors.base}
                    label={selectedCopy.title}
                    markers={markers}
                    onMarkerClick={id => select(id)}
                    className={mapClassName}
                    style={mapStyle}
                  />
                </div>
                {/* Under the map only the picture, square and as large as the room allows.
                    Everything written about the place is on its card in the list. */}
                <div className="flex flex-col items-center pt-3 lg:min-h-0 lg:flex-1 max-sm:hidden" aria-live="polite">
                  <EntityPicture
                    entity={selected.entity}
                    iconSize={64}
                    className="aspect-square w-full max-w-sm rounded-2xl shadow-sm lg:h-auto lg:w-[min(100cqw,var(--info-height))] lg:max-w-none"
                  />
                  <p className="mt-1.5 text-center text-[11px] text-wood/55">{selectedMap ? selectedCopy.approximateLabel : text.noMap}</p>
                </div>
              </section>
            </div>

            <section className="flex flex-col rounded-2xl border border-black/5 bg-white/45 p-3 shadow-sm backdrop-blur-sm lg:min-h-0">
              <div className="flex shrink-0 gap-1.5 overflow-x-auto pb-1.5 custom-scrollbar" data-no-swipe>
                {(['all', ...grouped.map(group => group.key)] as const).map(key => {
                  const count = key === 'all' ? entries.length : grouped.find(group => group.key === key)?.entries.length ?? 0;
                  const color = key === 'all' ? undefined : GROUP_COLORS[key].base;
                  const active = activeGroup === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveGroup(key)}
                      className={cn(
                        'inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border px-2.5 py-1.5 text-xs font-bold transition-all',
                        active ? 'text-white shadow-sm' : 'bg-white/70 text-wood/85 hover:bg-white',
                      )}
                      style={{
                        borderColor: color ? tint(color, active ? 1 : 0.25) : active ? '#0f766e' : 'rgba(15,118,110,0.15)',
                        backgroundColor: active ? color ?? '#0f766e' : undefined,
                      }}
                    >
                      {color && !active && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />}
                      {key === 'all' ? text.all : text.groups[key]} <span>· {formatNumber(count)}</span>
                    </button>
                  );
                })}
              </div>

              {/* Picture cards in two columns, colour-coded: the filter chips above are the
                  legend. Only this list scrolls; the detail card on the left stays put. Pictures stay
                  square and cards never stretch to fill a tall screen. The padding keeps the selected
                  card's ring inside the scroll box. */}
              <div className="-mx-1 mt-1 px-1 py-1 lg:min-h-0 lg:flex-1 lg:overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 items-stretch gap-2.5 sm:grid-cols-2 lg:grid-cols-1 min-[1800px]:grid-cols-2 content-start">
                  {visibleEntries.map(renderCard)}
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlacesPage;
