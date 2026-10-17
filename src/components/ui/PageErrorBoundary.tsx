import React from 'react';
import { BookOpen, RotateCcw } from './icons';
import { reportRenderError } from '../../lib/telemetry';

// Read straight from storage: this card must work even when the language context is what failed.
const isArabic = () => {
  try {
    return localStorage.getItem('app_language') === 'ar';
  } catch {
    return false;
  }
};

const COPY = {
  en: {
    title: 'This page could not open.',
    text: 'Your progress is saved on this device. Check the internet and try again.',
    retry: 'Try again',
    home: 'Go to the library',
  },
  ar: {
    title: 'تَعَذَّرَ فَتْحُ هٰذِهِ الصَّفْحَة.',
    text: 'تَقَدُّمُكَ مَحْفُوظٌ عَلَى هٰذَا الجِهَاز. تَأَكَّدْ مِنَ الاتِّصَالِ بِالإِنْتَرْنِتِ وَحَاوِلْ مَرَّةً أُخْرَى.',
    retry: 'حَاوِلْ مَرَّةً أُخْرَى',
    home: 'اِذْهَبْ إِلَى المَكْتَبَة',
  },
};

/**
 * The card shown when a page fails to draw (most often: part of the app could not download on a
 * weak connection). The address keeps the page, so "Try again" reloads straight back to it.
 */
const PageErrorCard = ({ fullScreen }: { fullScreen: boolean }) => {
  const ar = isArabic();
  const copy = ar ? COPY.ar : COPY.en;
  const goHome = () => {
    window.location.hash = '#/';
    window.location.reload();
  };

  return (
    <div
      dir={ar ? 'rtl' : 'ltr'}
      role="alert"
      className={fullScreen
        ? 'flex min-h-[100dvh] items-center justify-center bg-parchment p-6'
        : 'flex h-full min-h-[22rem] items-center justify-center p-6'}
    >
      <div className="w-full max-w-md rounded-[1.5rem] border border-black/[0.06] bg-white/80 p-7 text-center shadow-[0_24px_40px_-30px_rgba(0,0,0,0.45)]">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
          <BookOpen size={26} aria-hidden="true" />
        </span>
        <h2 className={ar ? 'mt-4 font-display text-xl font-semibold text-wood' : 'mt-4 font-display text-lg font-semibold text-wood'}>{copy.title}</h2>
        <p className={ar ? 'mt-2 text-base leading-relaxed text-wood/70' : 'mt-2 text-sm leading-relaxed text-wood/70'}>{copy.text}</p>
        <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-700 px-5 font-display text-sm font-semibold text-white hover:bg-brand-800"
          >
            <RotateCcw size={16} aria-hidden="true" /> {copy.retry}
          </button>
          <button
            type="button"
            onClick={goHome}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white px-5 font-display text-sm font-semibold text-wood/70 ring-1 ring-black/[0.08] hover:bg-black/[0.03]"
          >
            {copy.home}
          </button>
        </div>
      </div>
    </div>
  );
};

interface Props {
  children: React.ReactNode;
  /** The whole app (true) or one page inside the reader (false). */
  fullScreen?: boolean;
  /** A new value (another page) clears the card, so moving on works without a reload. */
  resetKey?: string;
}

export class PageErrorBoundary extends React.Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    reportRenderError(error);
  }

  componentDidUpdate(previous: Props) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }

  render() {
    return this.state.failed ? <PageErrorCard fullScreen={!!this.props.fullScreen} /> : this.props.children;
  }
}
