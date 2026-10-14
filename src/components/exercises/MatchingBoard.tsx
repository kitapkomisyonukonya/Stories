import React from 'react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { MatchConnectors, pairColor } from './MatchConnectors';
import { useIsPhone } from '../../lib/phone';
import { X } from '../ui/icons';

/**
 * The one matching interaction of the app (Quick Challenge, Language Focus, Vocabulary
 * Challenge, Final Challenge): tap an item on one side, then its partner on the other; the
 * pair gets a shared number. Any pairing is allowed; results (✓/✕) appear only when the
 * caller says the round was checked. Re-tapping an item moves or replaces its pair.
 */

export interface MatchingPairLike {
  left: string;
  right: string;
}

interface MatchingBoardProps {
  pairs: MatchingPairLike[];
  /** Right-hand items in display order (usually shuffled). */
  meanings: string[];
  assignments: Record<string, string>;
  onAssignmentsChange: (next: Record<string, string>) => void;
  /** When true, every assigned pair shows ✓ or ✕ against `pairs`. */
  submitted?: boolean;
  /** Per-left result override (true ✓, false ✕, missing = neutral); used for partial checks. */
  results?: Record<string, boolean>;
  /** Left items that can no longer be changed (e.g. already confirmed correct). */
  lockedLefts?: ReadonlySet<string>;
  disabled?: boolean;
  headings?: { left: string; right: string };
  instructions?: string | null;
  renderLeft?: (left: string) => React.ReactNode;
  className?: string;
}

const MatchPairBadge = ({ label, color, result, description }: { label: string; color: string; result: boolean | null; description: string }) => (
  <span
    className="inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1.5 font-display text-[11px] font-black text-white"
    style={{ backgroundColor: result === null ? color : result ? '#10B981' : '#F43F5E' }}
  >
    {result === null ? label : result ? '✓' : '✕'}
    <span className="sr-only">{` ${description}`}</span>
  </span>
);

const resultColor = (index: number, result: boolean | null) =>
  result === null ? pairColor(index) : result ? '#10B981' : '#F43F5E';

// The small cross on a matched row on phones: tapping the row undoes that pair.
const UndoMark = () => (
  <span aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center self-center rounded-full bg-black/[0.06] text-wood/60">
    <X size={14} />
  </span>
);

export const MatchingBoard: React.FC<MatchingBoardProps> = ({
  pairs,
  meanings,
  assignments,
  onAssignmentsChange,
  submitted = false,
  results,
  lockedLefts,
  disabled = false,
  headings,
  instructions,
  renderLeft,
  className,
}) => {
  const { language, t, formatNumber } = useLanguage();
  const isArabic = language === 'ar';
  const gridRef = React.useRef<HTMLDivElement>(null);
  const [selectedLeft, setSelectedLeft] = React.useState<string | null>(null);
  const [selectedRight, setSelectedRight] = React.useState<string | null>(null);

  React.useEffect(() => {
    setSelectedLeft(null);
    setSelectedRight(null);
  }, [pairs, submitted]);

  const isLocked = (left: string) => Boolean(lockedLefts?.has(left));
  const ownerOf = (meaning: string) => pairs.findIndex(pair => assignments[pair.left] === meaning);
  const resultFor = (left: string): boolean | null => {
    if (results && left in results) return results[left];
    if (!submitted) return null;
    const pair = pairs.find(candidate => candidate.left === left);
    const assigned = assignments[left];
    return pair && assigned ? assigned === pair.right : null;
  };

  const link = (left: string, meaning: string) => {
    const next = { ...assignments };
    for (const [otherLeft, otherMeaning] of Object.entries(next)) {
      if (otherMeaning === meaning && !isLocked(otherLeft)) delete next[otherLeft];
    }
    next[left] = meaning;
    onAssignmentsChange(next);
    setSelectedLeft(null);
    setSelectedRight(null);
  };

  const tapLeft = (left: string) => {
    if (disabled || submitted || isLocked(left)) return;
    if (selectedRight) {
      link(left, selectedRight);
      return;
    }
    setSelectedLeft(current => (current === left ? null : left));
  };

  const tapRight = (meaning: string) => {
    if (disabled || submitted) return;
    const ownerIndex = ownerOf(meaning);
    if (ownerIndex >= 0 && isLocked(pairs[ownerIndex].left)) return;
    if (selectedLeft) {
      link(selectedLeft, meaning);
      return;
    }
    setSelectedRight(current => (current === meaning ? null : meaning));
  };

  const isPhone = useIsPhone();
  const [phoneLeft, setPhoneLeft] = React.useState<string | null>(null);

  if (isPhone) {
    // Phones: one word at a time with every meaning right under it, so the pair being
    // made is always on one screen. Picking a meaning moves on to the next open word.
    const openLefts = pairs.filter(pair => !assignments[pair.left] && !isLocked(pair.left)).map(pair => pair.left);
    const current = phoneLeft && pairs.some(pair => pair.left === phoneLeft) && !isLocked(phoneLeft)
      ? phoneLeft
      : openLefts[0] ?? null;
    const currentIndex = current ? pairs.findIndex(pair => pair.left === current) : -1;
    // Undo a pair: the meaning is free again and its word comes back on top to be matched again.
    const unlink = (left: string) => {
      if (disabled || submitted || isLocked(left)) return;
      const next = { ...assignments };
      delete next[left];
      onAssignmentsChange(next);
      setPhoneLeft(left);
    };
    const pickMeaning = (meaning: string) => {
      if (disabled || submitted || !current) return;
      const ownerIndex = ownerOf(meaning);
      if (ownerIndex >= 0 && isLocked(pairs[ownerIndex].left)) return;
      if (ownerIndex >= 0) {
        unlink(pairs[ownerIndex].left);
        return;
      }
      const next = { ...assignments };
      for (const [otherLeft, otherMeaning] of Object.entries(next)) {
        if (otherMeaning === meaning && !isLocked(otherLeft)) delete next[otherLeft];
      }
      next[current] = meaning;
      onAssignmentsChange(next);
      const after = pairs.map(pair => pair.left);
      const start = after.indexOf(current);
      const rotated = [...after.slice(start + 1), ...after.slice(0, start + 1)];
      setPhoneLeft(rotated.find(left => !next[left] && !isLocked(left)) ?? null);
    };
    const textSize = isArabic ? 'text-base' : 'text-[15px]';

    if (submitted || (!current && openLefts.length === 0 && Object.keys(assignments).length >= pairs.length)) {
      return (
        <div className={cn('space-y-2', className)} data-matching-board>
          {pairs.map((pair, pairIndex) => {
            const assigned = assignments[pair.left];
            const result = assigned ? resultFor(pair.left) : null;
            return (
              <button
                key={pair.left}
                type="button"
                disabled={disabled || submitted || isLocked(pair.left)}
                onClick={() => unlink(pair.left)}
                aria-label={!submitted && !isLocked(pair.left) ? (isArabic ? `إلغاء المطابقة: ${pair.left}` : `Undo the match: ${pair.left}`) : undefined}
                className={cn('flex w-full items-start gap-3 rounded-xl border-2 bg-white px-3.5 py-2.5 text-start font-serif', textSize,
                  result === true && 'bg-emerald-50/70', result === false && 'bg-rose-50/70')}
                style={{ borderColor: resultColor(pairIndex, result) }}
              >
                <MatchPairBadge label={formatNumber(pairIndex + 1)} color={pairColor(pairIndex)} result={result} description="" />
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-wood">{renderLeft ? renderLeft(pair.left) : pair.left}</span>
                  <span className="block text-wood/75">{assigned ?? '—'}</span>
                </span>
                {!submitted && !isLocked(pair.left) && <UndoMark />}
              </button>
            );
          })}
        </div>
      );
    }

    return (
      <div className={cn('space-y-3', className)} data-matching-board>
        <div className="flex flex-wrap gap-1.5" aria-label={headings?.left ?? (isArabic ? 'المفاهيم' : 'Concepts')}>
          {pairs.map((pair, pairIndex) => {
            const assigned = Boolean(assignments[pair.left]);
            const active = pair.left === current;
            return (
              <button
                key={pair.left}
                type="button"
                disabled={disabled || isLocked(pair.left)}
                onClick={() => setPhoneLeft(pair.left)}
                aria-pressed={active}
                className={cn('h-8 min-w-8 rounded-full px-2 font-display text-xs font-black transition-colors',
                  active ? 'ring-2 ring-brand-600 ring-offset-1' : '',
                  assigned ? 'text-white' : 'bg-white text-wood/75 ring-1 ring-black/10')}
                style={assigned ? { backgroundColor: pairColor(pairIndex) } : undefined}
              >
                {formatNumber(pairIndex + 1)}
              </button>
            );
          })}
        </div>
        {current && (
          <div className="rounded-2xl border-2 border-brand-500 bg-brand-50 px-4 py-3">
            <p className={cn('font-display font-black uppercase tracking-widest text-brand-700', isArabic ? 'text-xs' : 'text-[10px]')}>
              {headings?.left ?? (isArabic ? 'المفاهيم' : 'Concepts')} · {formatNumber(currentIndex + 1)}/{formatNumber(pairs.length)}
            </p>
            <p className={cn('mt-0.5 font-serif font-bold text-brand-950', isArabic ? 'text-xl' : 'text-lg')}>
              {renderLeft ? renderLeft(current) : current}
            </p>
          </div>
        )}
        <p className={cn('font-display font-black uppercase tracking-widest text-brand-700', isArabic ? 'text-xs' : 'text-[10px]')}>
          {headings?.right ?? (isArabic ? 'المعاني' : 'Meanings')}
        </p>
        <div className="space-y-2">
          {meanings.map(meaning => {
            const ownerIndex = ownerOf(meaning);
            const mine = ownerIndex >= 0 && pairs[ownerIndex].left === current;
            return (
              <button
                key={meaning}
                type="button"
                data-match-right={meaning}
                disabled={disabled || (ownerIndex >= 0 && isLocked(pairs[ownerIndex].left))}
                onClick={() => pickMeaning(meaning)}
                aria-label={ownerIndex >= 0 ? (isArabic ? `إلغاء المطابقة: ${meaning}` : `Undo the match: ${meaning}`) : undefined}
                className={cn('flex min-h-11 w-full items-center gap-2.5 rounded-xl border-2 bg-white px-3.5 py-2 text-start font-serif transition-colors enabled:active:scale-[0.99]', textSize,
                  mine ? 'border-brand-500 bg-brand-50' : ownerIndex >= 0 ? 'text-wood/55' : 'border-brand-200 text-wood/90')}
                style={ownerIndex >= 0 && !mine ? { borderColor: pairColor(ownerIndex) } : undefined}
              >
                {ownerIndex >= 0 && (
                  <MatchPairBadge label={formatNumber(ownerIndex + 1)} color={pairColor(ownerIndex)} result={null} description="" />
                )}
                <span className="min-w-0 flex-1">{meaning}</span>
                {ownerIndex >= 0 && !isLocked(pairs[ownerIndex].left) && <UndoMark />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const cardBase = cn(
    'w-full min-h-14 rounded-xl border-2 px-4 py-3 text-start font-serif transition-[color,background-color,border-color,transform] duration-150 flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 disabled:cursor-default enabled:active:scale-[0.99]',
    isArabic ? 'text-base sm:text-lg' : 'text-sm sm:text-base',
  );

  return (
    <div className={cn('space-y-5', className)}>
      {instructions !== null && (
        <p className={cn('font-serif text-wood/55', isArabic ? 'text-base sm:text-lg' : 'text-sm sm:text-base')}>
          {instructions ?? t('nav.matchingInstructions')}
        </p>
      )}
      <div ref={gridRef} className="relative grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-8" data-matching-board>
        <div className="space-y-2.5">
          <p className={cn('font-display uppercase tracking-widest font-black text-brand-700', isArabic ? 'text-sm sm:text-base' : 'text-xs')}>
            {headings?.left ?? (isArabic ? 'المفاهيم' : 'Concepts')}
          </p>
          {pairs.map((pair, pairIndex) => {
            const assigned = assignments[pair.left];
            const selected = selectedLeft === pair.left;
            const result = assigned ? resultFor(pair.left) : null;
            const locked = isLocked(pair.left);
            return (
              <button
                key={pair.left}
                type="button"
                data-match-left={pair.left}
                disabled={disabled || submitted || locked}
                onClick={() => tapLeft(pair.left)}
                aria-pressed={selected}
                className={cn(
                  cardBase,
                  'justify-between font-bold',
                  selected ? 'border-brand-500 bg-brand-50 text-brand-950' : 'border-brand-200 bg-white text-wood',
                  result === true && 'bg-emerald-50/60',
                  result === false && 'bg-rose-50/60',
                )}
                style={assigned && !selected ? { borderColor: resultColor(pairIndex, result) } : undefined}
              >
                <span className="min-w-0 flex-1">{renderLeft ? renderLeft(pair.left) : pair.left}</span>
                {assigned && (
                  <MatchPairBadge
                    label={formatNumber(pairIndex + 1)}
                    color={pairColor(pairIndex)}
                    result={result}
                    description={isArabic ? `مرتبط بـ«${assigned}»` : `linked to “${assigned}”`}
                  />
                )}
              </button>
            );
          })}
        </div>
        <div className="space-y-2.5">
          <p className={cn('font-display uppercase tracking-widest font-black text-brand-700', isArabic ? 'text-sm sm:text-base' : 'text-xs')}>
            {headings?.right ?? (isArabic ? 'المعاني' : 'Meanings')}
          </p>
          {meanings.map(meaning => {
            const ownerIndex = ownerOf(meaning);
            const owner = ownerIndex >= 0 ? pairs[ownerIndex] : null;
            const selected = selectedRight === meaning;
            const result = owner ? resultFor(owner.left) : null;
            const locked = owner ? isLocked(owner.left) : false;
            return (
              <button
                key={meaning}
                type="button"
                data-match-right={meaning}
                disabled={disabled || submitted || locked}
                onClick={() => tapRight(meaning)}
                aria-pressed={selected}
                className={cn(
                  cardBase,
                  'font-medium',
                  selected ? 'border-brand-500 bg-brand-50 text-brand-950' : owner ? 'bg-white text-wood' : 'border-brand-200 bg-white text-wood/85 hover:bg-brand-50/40',
                  result === true && 'bg-emerald-50/60',
                  result === false && 'bg-rose-50/60',
                )}
                style={owner && !selected ? { borderColor: resultColor(ownerIndex, result) } : undefined}
              >
                {owner && (
                  <MatchPairBadge
                    label={formatNumber(ownerIndex + 1)}
                    color={pairColor(ownerIndex)}
                    result={result}
                    description={isArabic ? `مرتبط بـ«${owner.left}»` : `linked to “${owner.left}”`}
                  />
                )}
                <span className="min-w-0 flex-1">{meaning}</span>
              </button>
            );
          })}
        </div>
        <MatchConnectors
          containerRef={gridRef}
          connectors={pairs.flatMap((pair, pairIndex) => {
            const assigned = assignments[pair.left];
            if (!assigned) return [];
            const result = resultFor(pair.left);
            return [{ left: pair.left, right: assigned, color: resultColor(pairIndex, result), dashed: result === false }];
          })}
        />
      </div>
    </div>
  );
};
