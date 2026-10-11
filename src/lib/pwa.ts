import { useEffect, useState } from 'react';

const AWAY_BEFORE_CHECK_MS = 30_000;

/**
 * An installed app or a tab left open keeps running the build it started with. When it comes back
 * to the screen after a while away, ask the server which build is current (version.json, written by
 * vite.config.ts); if it is a newer one, reload at once so the reader sees the latest platform. The
 * route lives in the address, so the reader stays on the same page. Same build: nothing happens,
 * the caches stay. A short glance at another window never reloads mid-exercise.
 */
const watchForNewBuild = (registration: () => ServiceWorkerRegistration | undefined) => {
  const running = document.querySelector<HTMLMetaElement>('meta[name="stories-build"]')?.content;
  if (!running) return;
  let hiddenAt = 0;
  const check = async () => {
    try {
      const response = await fetch('/version.json', { cache: 'no-store' });
      if (!response.ok) return;
      const { build } = (await response.json()) as { build?: string };
      if (build && build !== running) {
        registration()?.update().catch(() => undefined);
        window.location.reload();
      }
    } catch {
      // Offline: keep the build that is running.
    }
  };
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      hiddenAt = Date.now();
    } else if (hiddenAt && Date.now() - hiddenAt >= AWAY_BEFORE_CHECK_MS) {
      void check();
    }
  });
};

/** Registers the service worker in production builds; the dev server keeps working without it. */
export const registerServiceWorker = () => {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  let registration: ServiceWorkerRegistration | undefined;
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then(found => { registration = found; })
      .catch(() => undefined);
  });
  watchForNewBuild(() => registration);
};

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** True when the app runs installed (from the home screen), where the system already gives it the whole screen. */
export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** The browser's install prompt, when it offers one; iOS Safari offers none (Share → Add to Home Screen). */
export const useInstallPrompt = () => {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(() => isStandalone());

  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const install = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice.outcome === 'accepted') setInstalled(true);
    setPrompt(null);
  };

  return { canInstall: Boolean(prompt) && !installed, installed, install };
};

export interface CacheBookResult {
  stored: number;
  failed: number;
  total: number;
}

/** Asks the service worker to store a book's images and audio; resolves with what it managed. */
export const saveBookOffline = (urls: string[]): Promise<CacheBookResult> =>
  new Promise((resolve, reject) => {
    if (!('serviceWorker' in navigator)) {
      reject(new Error('Service workers are not available.'));
      return;
    }
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const onMessage = (event: MessageEvent) => {
      const data = event.data || {};
      if (data.type !== 'cache-book-result' || data.id !== id) return;
      navigator.serviceWorker.removeEventListener('message', onMessage);
      resolve({ stored: data.stored, failed: data.failed, total: data.total });
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    navigator.serviceWorker.ready
      .then(registration => {
        const worker = registration.active;
        if (!worker) throw new Error('No active service worker.');
        worker.postMessage({ type: 'cache-book', id, urls });
      })
      .catch(error => {
        navigator.serviceWorker.removeEventListener('message', onMessage);
        reject(error);
      });
  });
