import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import { X } from '../ui/icons';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  /** Wider card (the certificate, the caravan). */
  wide?: boolean;
  className?: string;
}

/**
 * The Seyahatname's dialogs: a light card over a dim page. It scrolls inside itself, so the page
 * under it never moves; on phones it fills the width.
 */
export const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, wide = false, className }) => {
  const ref = useDialogFocus<HTMLDivElement>(open, onClose);
  const { isRTL } = useLanguage();
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          className="fixed inset-0 z-[400] flex items-end justify-center overflow-y-auto overscroll-contain bg-black/60 sm:items-center sm:p-6"
          onClick={onClose}
        >
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            dir={isRTL ? 'rtl' : 'ltr'}
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={event => event.stopPropagation()}
            className={cn(
              'relative max-h-[100dvh] w-full overflow-y-auto overscroll-contain rounded-t-3xl bg-[#FBF8F1] p-5 text-[#14221a] shadow-2xl sm:max-h-[92dvh] sm:rounded-3xl sm:p-7',
              wide ? 'sm:max-w-5xl' : 'sm:max-w-lg',
              isRTL && 'font-arabic',
              className,
            )}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="text-[19px] font-semibold leading-snug">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="-me-2 -mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#14221a]/60 hover:bg-black/5 hover:text-[#14221a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1d6b66]"
                aria-label={isRTL ? 'إِغْلَاقٌ' : 'Close'}
              >
                <X size={20} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};
