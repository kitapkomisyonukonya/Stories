import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useUserRole, type UserRole } from '../../contexts/UserRoleContext';
import {
  ChevronLeft,
  FileText,
  LockKeyhole,
  Library,
  BookOpen,
  Notepad,
  ProjectorScreen,
  Trophy,
  Certificate,
  Lightbulb,
  Target,
  BookMarked,
  Search,
  Users,
  Scroll,
  type AppIconProps,
} from '../ui/icons';
import { USAGE_GUIDES, usageGuidePdfUrl, type UsageGuideIcon } from '../../data/usageGuides';
import { useDialogFocus } from '../../hooks/useDialogFocus';

const ICONS: Record<UsageGuideIcon, React.ComponentType<AppIconProps>> = {
  LockKeyhole, Library, BookOpen, Notepad, ProjectorScreen, Trophy, Certificate, FileText, Lightbulb, Target, BookMarked, Search, Users, Scroll,
};

const ROLES: UserRole[] = ['teacher', 'student', 'self'];

interface UsageGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

/** The role's short usage guide (Teacher Guide, Student Guide or User Guide), with its PDF. Opened from the reader menu. */
export const UsageGuide: React.FC<UsageGuideProps> = ({ isOpen, onClose }) => {
  // Tab stays inside and focus returns to the opener; Escape is handled below.
  const dialogRef = useDialogFocus(isOpen, onClose, { escape: false });
  const { language, isRTL, formatNumber } = useLanguage();
  const { role } = useUserRole();
  const lang = language === 'ar' ? 'ar' : 'en';
  const [shown, setShown] = useState<UserRole>(role ?? 'student');
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    setShown(role ?? 'student');
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, role]);

  const guide = USAGE_GUIDES[shown][lang];
  const copy = lang === 'ar'
    ? { close: 'إغلاق', pdf: 'افتح PDF', pdfHint: 'يُفتح في المتصفح للطباعة أو الحفظ.', others: 'الأدلة' }
    : { close: 'Close', pdf: 'Open PDF', pdfHint: 'Opens in your browser to print or save.', others: 'Guides' };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[300] overflow-y-auto overscroll-contain bg-[#FBF8F1]"
          data-usage-guide
        >
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={guide.title}
            dir={isRTL ? 'rtl' : 'ltr'}
            onClick={event => event.stopPropagation()}
            className={cn('relative mx-auto min-h-full w-full max-w-4xl px-5 pb-16 pt-5 text-wood sm:px-8 sm:pt-8', isRTL && 'font-arabic')}
          >
            {/* A page of its own: the way back is a clear button at the top, not a close cross. */}
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="mb-6 inline-flex min-h-10 items-center gap-1.5 rounded-full border border-brand-200 bg-white ps-3 pe-4 font-display text-[13px] font-semibold text-brand-800 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 sm:text-sm"
            >
              <ChevronLeft size={16} className="rtl:rotate-180" aria-hidden="true" />
              {isRTL ? 'رُجُوع' : 'Back'}
            </button>

            <div role="tablist" aria-label={copy.others} className="flex flex-wrap gap-1.5">
              {ROLES.map(item => (
                <button
                  key={item}
                  type="button"
                  role="tab"
                  aria-selected={item === shown}
                  onClick={() => setShown(item)}
                  data-usage-guide-tab={item}
                  className={cn(
                    'rounded-full border px-3 py-1.5 font-display font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500',
                    lang === 'ar' ? 'text-sm' : 'text-[12px]',
                    item === shown ? 'border-brand-700 bg-brand-700 text-white' : 'border-brand-100 bg-white text-wood/70 hover:border-brand-300',
                  )}
                >
                  {USAGE_GUIDES[item][lang].title}
                </button>
              ))}
            </div>

            <h2 className={cn('mt-4 font-display font-semibold tracking-tight text-brand-900', lang === 'ar' ? 'text-2xl' : 'text-xl sm:text-2xl')}>{guide.title}</h2>
            <p className={cn('mt-0.5 font-display font-semibold text-brand-700', lang === 'ar' ? 'text-base' : 'text-sm')}>{guide.subtitle}</p>
            <p className={cn('mt-2 font-serif leading-relaxed text-wood/75', lang === 'ar' ? 'text-base' : 'text-sm')}>{guide.intro}</p>

            <a
              href={usageGuidePdfUrl(shown, lang)}
              target="_blank"
              rel="noopener"
              data-usage-guide-pdf={`${shown}-${lang}`}
              className="mt-4 flex items-center gap-3 rounded-xl border border-brand-200 bg-white px-3 py-2.5 transition-colors hover:border-brand-400 hover:bg-brand-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-700 text-white">
                <FileText size={20} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className={cn('block font-display font-semibold text-wood', lang === 'ar' ? 'text-base' : 'text-sm')}>{copy.pdf} · {guide.title}</span>
                <span className={cn('block font-serif text-wood/60', lang === 'ar' ? 'text-sm' : 'text-[13px]')}>{copy.pdfHint}</span>
              </span>
            </a>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {guide.sections.map(section => {
                const Icon = ICONS[section.icon];
                return (
                  <section key={section.heading} className="rounded-xl border border-brand-100 bg-white px-4 py-3">
                    <h3 className={cn('flex items-center gap-2 font-display font-semibold text-brand-800', lang === 'ar' ? 'text-base' : 'text-sm')}>
                      <Icon size={20} className="shrink-0 text-brand-700" aria-hidden="true" />
                      {section.heading}
                    </h3>
                    <ol className="mt-2 space-y-1.5">
                      {section.steps.map((step, index) => (
                        <li key={index} className={cn('flex gap-2 font-serif leading-snug text-wood/80', lang === 'ar' ? 'text-[15px]' : 'text-[13px]')}>
                          <span className="w-4 shrink-0 font-display font-semibold text-brand-700">{formatNumber(index + 1)}.</span>
                          <span className="min-w-0">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </section>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
