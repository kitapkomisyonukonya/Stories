import { useEffect, useState } from 'react';

// Chapter pictures and covers are full-size PNGs in Firebase Storage (they are made for print).
// The app shows a 1200 px wide WebP copy made by its own server (deploy/server.mjs, /media-image);
// on the dev server, or for any other address, the original is used.
const STORAGE_PREFIX = 'https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0373200489.firebasestorage.app/o/';

export const appImage = (url: string | undefined, width = 1200): string => {
  if (!url) return '';
  if (import.meta.env.DEV || !url.startsWith(STORAGE_PREFIX)) return url;
  return `/media-image?w=${width}&src=${encodeURIComponent(url)}`;
};

/** If the small copy ever fails to load, the picture falls back to the original. */
export const fallBackToOriginal = (original: string | undefined) => (event: React.SyntheticEvent<HTMLImageElement>) => {
  const img = event.currentTarget;
  if (original && img.src !== original) img.src = original;
};

/**
 * A chapter picture that knows when it failed: the small copy falls back to the original once, and
 * if that fails too the page shows ImageUnavailable instead of an empty box. retry asks again.
 */
export const useStoryImage = (url: string | undefined) => {
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => setFailed(false), [url]);

  const onError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.currentTarget;
    if (url && img.src !== url) img.src = url;
    else setFailed(true);
  };

  return {
    src: appImage(url),
    onError,
    failed,
    /** Use as the img key, so "Try again" makes a fresh request. */
    attempt,
    retry: () => {
      setFailed(false);
      setAttempt(current => current + 1);
    },
  };
};

/** The next chapter's picture is fetched a moment after a chapter opens, so it is ready when the reader moves on. */
export const usePreloadImage = (url?: string) => {
  useEffect(() => {
    if (!url) return;
    const timer = window.setTimeout(() => {
      const preloader = new Image();
      preloader.decoding = 'async';
      preloader.referrerPolicy = 'no-referrer';
      preloader.src = appImage(url);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [url]);
};
