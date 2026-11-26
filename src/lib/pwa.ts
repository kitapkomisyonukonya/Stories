import { useSyncExternalStore } from 'react';

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

// The browser offers its install prompt once, early, often before any screen that wants it has
// mounted (the access screen comes first). It is caught here, when this module loads, and kept.
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installedNow = false;
const installListeners = new Set<() => void>();
const notifyInstall = () => installListeners.forEach(listener => listener());
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event as BeforeInstallPromptEvent;
    notifyInstall();
  });
  window.addEventListener('appinstalled', () => {
    installedNow = true;
    deferredPrompt = null;
    notifyInstall();
  });
}

const subscribeInstall = (listener: () => void) => {
  installListeners.add(listener);
  return () => installListeners.delete(listener);
};
const installSnapshot = () => `${deferredPrompt ? 1 : 0}${installedNow ? 1 : 0}`;

/** The browser's install prompt, when it offers one; iOS Safari offers none (Share → Add to Home Screen). */
export const useInstallPrompt = () => {
  useSyncExternalStore(subscribeInstall, installSnapshot, () => '00');
  const installed = installedNow || isStandalone();

  const install = async () => {
    const prompt = deferredPrompt;
    if (!prompt) return false;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    deferredPrompt = null;
    if (choice.outcome === 'accepted') installedNow = true;
    notifyInstall();
    return choice.outcome === 'accepted';
  };

  return { canInstall: Boolean(deferredPrompt) && !installed, installed, install };
};

/** iPhone, iPod or iPad (iPadOS reports itself as a Mac with a touch screen). */
export const isAppleMobile = () => {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

/** A phone or tablet (touch screen first), where installing to the home screen makes sense. */
export const isHandheld = () => {
  if (typeof window === 'undefined') return false;
  if (isAppleMobile() || /Android/i.test(navigator.userAgent)) return true;
  return Boolean(window.matchMedia?.('(pointer: coarse)').matches) && Math.min(window.screen.width, window.screen.height) < 1100;
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
