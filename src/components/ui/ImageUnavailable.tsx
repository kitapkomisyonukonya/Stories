import { RotateCcw } from './icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { cn } from '../../lib/utils';

/** Stands in for a chapter picture that could not load (see useStoryImage), with a way to ask again. */
export const ImageUnavailable = ({ onRetry, className }: { onRetry: () => void; className?: string }) => {
  const { language } = useLanguage();
  const ar = language === 'ar';

  return (
    <div
      role="status"
      dir={ar ? 'rtl' : 'ltr'}
      className={cn('flex flex-col items-center justify-center gap-3 bg-[linear-gradient(160deg,var(--color-brand-50),var(--color-parchment))] p-6 text-center', className)}
    >
      <p className={cn('max-w-[16rem] font-display font-semibold leading-snug text-wood/70', ar ? 'text-base' : 'text-sm')}>
        {ar ? 'لَمْ تُحَمَّلِ الصُّورَةُ.' : 'The picture did not load.'}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 font-display text-sm font-semibold text-brand-700 ring-1 ring-black/[0.08] hover:bg-brand-50"
      >
        <RotateCcw size={15} aria-hidden="true" /> {ar ? 'حَاوِلْ مَرَّةً أُخْرَى' : 'Try again'}
      </button>
    </div>
  );
};
