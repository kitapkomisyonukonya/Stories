// The reader's "Story settings" menu: text size and font, what shows while reading, and how the book is laid out.
// It opens under its button on larger screens and as a sheet from the bottom on phones. Full screen is not here:
// it sits in the top bar of every screen (FullscreenToggle).
import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useMediaQuery } from '../../lib/useMediaQuery';
import { useSheetDrag } from '../../lib/phone';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import { SECTION_ICONS } from '../../lib/sectionIcons';
import { BookOpen, Highlighter, Languages, Scroll, Settings, TextSize, Type, Waveform, WideView, X } from '../ui/icons';
import { setHarakatShown, useHarakatShown } from '../../lib/arabicHarakat';

type Setter = React.Dispatch<React.SetStateAction<boolean>>;

interface ReaderSettingsProps {
  open: boolean;
  setOpen: Setter;
  language: string;
  isRTL: boolean;
  readerScale: number;
  setReaderScale: React.Dispatch<React.SetStateAction<number>>;
  isDyslexic: boolean;
  setIsDyslexic: Setter;
  showHighlights: boolean;
  setShowHighlights: Setter;
  followAlong: boolean;
  setFollowAlong: Setter;
  storyMode: boolean;
  setStoryMode: Setter;
  isWideView: boolean;
  setIsWideView: Setter;
  isTeacher: boolean;
  classMode: boolean;
  setClassMode: (value: boolean) => void;
  /** Book theme: menu surface, border, accent fill and the header button style. */
  theme: { menuBg: string; menuBorder: string; progressBar: string; buttonSec: string };
}

const Switch = ({ on, accent }: { on: boolean; accent: string }) => (
  <span
    dir="ltr"
    className={cn(
      'flex h-6 w-11 shrink-0 items-center rounded-full p-1 transition-colors',
      on ? accent : 'bg-white/15',
      on ? 'justify-end' : 'justify-start',
    )}
  >
    <span className="h-4 w-4 rounded-full bg-white shadow" />
  </span>
);

export const ReaderSettings = (props: ReaderSettingsProps) => {
  const {
    open, setOpen, language, isRTL, readerScale, setReaderScale, isDyslexic, setIsDyslexic, showHighlights,
    setShowHighlights, followAlong, setFollowAlong, storyMode, setStoryMode, isWideView, setIsWideView,
    isTeacher, classMode, setClassMode, theme,
  } = props;
  const ar = language === 'ar';
  const isPhone = useMediaQuery('(max-width: 639px)');
  const settingsSheet = useSheetDrag(() => setOpen(false));
  // Escape closes it and focus comes back to the button; the phone sheet is modal, the popover is not.
  const dialogRef = useDialogFocus(open, () => setOpen(false), { modal: isPhone });
  // Wide view only changes anything on large screens.
  const canWiden = useMediaQuery('(min-width: 1024px)');
  const title = ar ? 'إعدادات القصة' : 'Story settings';
  // Arabic only: harakat are on by default and can be turned off.
  const harakatShown = useHarakatShown();

  const sectionLabel = (en: string, arText: string) => (
    <p className={cn('mb-1.5 mt-4 px-1 font-display text-[10.5px] font-semibold uppercase text-gold', ar ? 'text-[12px]' : 'tracking-[0.08em]')}>
      {ar ? arText : en}
    </p>
  );

  const rowLabel = (Icon: React.ElementType, text: string) => (
    <span className="flex min-w-0 items-center gap-2.5">
      <Icon size={18} className="shrink-0 text-parchment/75" aria-hidden="true" />
      <span className={cn('font-display font-medium text-parchment', ar ? 'text-[13.5px]' : 'text-[12.5px]')}>{text}</span>
    </span>
  );

  const toggleRow = (Icon: React.ElementType, text: string, on: boolean, toggle: () => void, data: string) => (
    <button
      type="button"
      onClick={toggle}
      className="flex min-h-12 w-full items-center justify-between gap-3 px-3 py-2 text-start transition-colors hover:bg-white/[0.05]"
      aria-pressed={on}
      {...{ [data]: '' }}
    >
      {rowLabel(Icon, text)}
      <Switch on={on} accent={theme.progressBar} />
    </button>
  );

  const step = (delta: number) =>
    setReaderScale(prev => Math.min(1.3, Math.max(0.85, Number((prev + delta).toFixed(2)))));

  const viewOption = (Icon: React.ElementType, text: string, selected: boolean, choose: () => void, data: string) => (
    <button
      type="button"
      onClick={choose}
      className={cn(
        'flex min-h-10 items-center justify-center gap-1.5 rounded-[10px] px-2 font-display transition-colors',
        ar ? 'text-[13.5px]' : 'text-[12px]',
        selected ? 'bg-parchment font-semibold text-wood' : 'font-medium text-parchment/65 hover:text-parchment',
      )}
      aria-pressed={selected}
      {...{ [data]: '' }}
    >
      <Icon size={16} aria-hidden="true" />
      {text}
    </button>
  );

  const body = (
    <>
      {isPhone && (
        <div className="-mx-4 -mt-2.5 mb-1 flex cursor-grab justify-center pb-2.5 pt-2.5" {...settingsSheet.grip}>
          <span className="block h-1 w-10 rounded-full bg-white/30" aria-hidden="true" />
        </div>
      )}
      <div className="flex items-center justify-between gap-3 px-0.5">
        <h2 className="flex items-center gap-2 font-display text-[15px] font-semibold text-parchment">
          <Settings size={18} aria-hidden="true" />
          {title}
        </h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.07] text-parchment/70 transition-colors hover:bg-white/[0.12] hover:text-parchment"
          aria-label={ar ? 'إغلاق' : 'Close'}
        >
          <X size={14} />
        </button>
      </div>

      {sectionLabel('Text', 'النص')}
      <div className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl bg-white/[0.05]">
        <div className="flex min-h-12 items-center justify-between gap-3 px-3 py-2">
          {rowLabel(TextSize, ar ? 'حجم النص' : 'Text size')}
          <div dir="ltr" className="flex h-9 shrink-0 items-center rounded-full bg-white/[0.07]">
            <button
              type="button"
              onClick={() => step(-0.1)}
              disabled={readerScale <= 0.85}
              className="h-9 w-10 rounded-full font-display text-[13px] font-semibold text-parchment transition-colors hover:bg-white/[0.08] disabled:opacity-30"
              aria-label={ar ? 'تصغير النص' : 'Decrease text size'}
            >
              A−
            </button>
            <button
              type="button"
              onClick={() => setReaderScale(1)}
              className="min-w-12 font-display text-[12px] font-semibold text-gold"
              title={ar ? 'إعادة' : 'Reset'}
              aria-label={ar ? 'إعادة حجم النص' : 'Reset text size'}
            >
              {Math.round(readerScale * 100)}%
            </button>
            <button
              type="button"
              onClick={() => step(0.1)}
              disabled={readerScale >= 1.3}
              className="h-9 w-10 rounded-full font-display text-[13px] font-semibold text-parchment transition-colors hover:bg-white/[0.08] disabled:opacity-30"
              aria-label={ar ? 'تكبير النص' : 'Increase text size'}
            >
              A+
            </button>
          </div>
        </div>
        {toggleRow(Type, ar ? 'خط سهل للقراءة' : 'Dyslexia-friendly font', isDyslexic, () => setIsDyslexic(prev => !prev), 'data-dyslexic-toggle')}
        {ar && toggleRow(Languages, 'إظهار الحركات (التشكيل)', harakatShown, () => setHarakatShown(!harakatShown), 'data-harakat-toggle')}
      </div>

      {sectionLabel('While reading', 'أثناء القراءة')}
      <div className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl bg-white/[0.05]">
        {toggleRow(Highlighter, ar ? 'الكلمات الملونة' : 'Highlighted words', showHighlights, () => setShowHighlights(prev => !prev), 'data-highlights-toggle')}
        {toggleRow(Waveform, ar ? 'تتبع القراءة مع الصوت' : 'Follow along with audio', followAlong, () => setFollowAlong(prev => !prev), 'data-follow-along-toggle')}
        {isTeacher && toggleRow(SECTION_ICONS.classMode.icon, SECTION_ICONS.classMode[ar ? 'ar' : 'en'], classMode, () => setClassMode(!classMode), 'data-class-mode-toggle')}
      </div>

      {sectionLabel('View', 'العرض')}
      <div className="flex items-stretch gap-2">
        <div className="grid flex-1 grid-cols-2 gap-1 rounded-xl bg-black/20 p-1" role="group" aria-label={ar ? 'العرض' : 'View'}>
          {viewOption(BookOpen, ar ? 'صفحات' : 'Pages', !storyMode, () => setStoryMode(false), 'data-pages-mode')}
          {viewOption(Scroll, ar ? 'القصة' : 'Story', storyMode, () => setStoryMode(true), 'data-story-mode-toggle')}
        </div>
        {canWiden && (
          <button
            type="button"
            onClick={() => setIsWideView(prev => !prev)}
            className={cn(
              'flex w-12 shrink-0 items-center justify-center rounded-xl transition-colors',
              isWideView ? cn(theme.progressBar, 'text-wood') : 'bg-white/[0.05] text-parchment/85 hover:bg-white/[0.09]',
            )}
            aria-pressed={isWideView}
            aria-label={ar ? 'عرض واسع' : 'Wide view'}
            title={ar ? 'عرض واسع: يملأ النص واللوحات الشاشة' : 'Wide view: text and panels fill the screen'}
            data-wide-view-toggle
          >
            <WideView size={19} />
          </button>
        )}
      </div>
    </>
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className={cn(
          'touch-target flex items-center justify-center gap-2 rounded-full border font-display text-[13px] font-semibold transition-colors sm:px-4',
          theme.buttonSec,
          open && 'border-gold/60 bg-gold/15 text-[#ecdcae]',
        )}
        aria-label={title}
        aria-expanded={open}
        title={title}
        data-reader-settings-button
      >
        <Settings size={19} aria-hidden="true" />
        <span className="hidden sm:inline">{ar ? 'الْإِعْدَادَاتُ' : 'Settings'}</span>
      </button>

      {isPhone
        ? createPortal(
            <AnimatePresence>
              {open && (
                <>
                  <motion.button
                    type="button"
                    key="scrim"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[90] cursor-default bg-black/45"
                    aria-label={ar ? 'إغلاق إعدادات القصة' : 'Close story settings'}
                    onClick={() => setOpen(false)}
                  />
                  <motion.div
                    key="sheet"
                    ref={dialogRef}
                    role="dialog"
                    aria-modal="true"
                    aria-label={title}
                    dir={isRTL ? 'rtl' : 'ltr'}
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    {...settingsSheet.sheet}
                    className={cn(
                      'fixed inset-x-0 bottom-0 z-[91] max-h-[88dvh] overflow-y-auto rounded-t-[22px] border-t px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-2.5 shadow-2xl backdrop-blur-2xl',
                      ar && 'font-arabic',
                      theme.menuBg,
                      theme.menuBorder,
                    )}
                  >
                    {body}
                  </motion.div>
                </>
              )}
            </AnimatePresence>,
            document.body,
          )
        : (
          <AnimatePresence>
            {open && (
              <motion.div
                ref={dialogRef}
                role="dialog"
                aria-label={title}
                initial={{ opacity: 0, y: -8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.97 }}
                transition={{ duration: 0.16, ease: 'easeOut' }}
                className={cn(
                  'absolute top-[calc(100%+0.65rem)] z-[80] max-h-[calc(100dvh-6rem)] w-[21rem] overflow-y-auto rounded-[20px] border p-4 shadow-2xl backdrop-blur-2xl',
                  isRTL ? 'left-0' : 'right-0',
                  theme.menuBg,
                  theme.menuBorder,
                )}
              >
                {body}
              </motion.div>
            )}
          </AnimatePresence>
        )}
    </div>
  );
};
