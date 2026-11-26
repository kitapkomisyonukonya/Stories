import { firebaseConfig } from './firebaseConfig';
import { isAppleMobile, isStandalone } from './pwa';

/**
 * New-story notices. Turning them on asks the browser for permission (only after a tap), gets
 * this device's Firebase Cloud Messaging token and hands it to our server, which adds it to the
 * site's topic for the app language. No account, no name, nothing else is sent or kept.
 * On iPhone and iPad notices work only in the app added to the Home Screen (iOS 16.4 and later).
 */

export type PushState = 'on' | 'off' | 'blocked' | 'needs-install' | 'unsupported';

const STORE_KEY = 'v2:push';

interface Saved {
  on: boolean;
  lang: 'en' | 'ar';
}

const readSaved = (): Saved | null => {
  try {
    const value = JSON.parse(localStorage.getItem(STORE_KEY) || 'null') as Saved | null;
    return value && typeof value.on === 'boolean' ? value : null;
  } catch {
    return null;
  }
};
const writeSaved = (value: Saved | null) => {
  try {
    if (value) localStorage.setItem(STORE_KEY, JSON.stringify(value));
    else localStorage.removeItem(STORE_KEY);
  } catch {
    /* storage blocked */
  }
};

const browserCanPush = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

export const pushState = (): PushState => {
  if (!browserCanPush()) return isAppleMobile() && !isStandalone() ? 'needs-install' : 'unsupported';
  if (Notification.permission === 'denied') return 'blocked';
  return readSaved()?.on && Notification.permission === 'granted' ? 'on' : 'off';
};

const deviceToken = async () => {
  const [{ initializeApp, getApps }, messagingModule] = await Promise.all([import('@firebase/app'), import('@firebase/messaging')]);
  if (!(await messagingModule.isSupported())) throw new Error('unsupported');
  const app = getApps().find(each => each.name === 'push') ?? initializeApp(firebaseConfig, 'push');
  const messaging = messagingModule.getMessaging(app);
  const registration = await navigator.serviceWorker.ready;
  return { token: await messagingModule.getToken(messaging, { serviceWorkerRegistration: registration }), messaging, messagingModule };
};

const tell = async (path: string, token: string, lang: 'en' | 'ar') => {
  const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, lang }) });
  if (!response.ok) throw new Error(`server ${response.status}`);
};

/** Must run from a tap: the browser shows its permission question. */
export const enablePush = async (lang: 'en' | 'ar'): Promise<PushState> => {
  if (!browserCanPush()) return pushState();
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission === 'denied' ? 'blocked' : 'off';
  const { token } = await deviceToken();
  await tell('/push-api/subscribe', token, lang);
  writeSaved({ on: true, lang });
  return 'on';
};

export const disablePush = async (): Promise<PushState> => {
  try {
    const { token, messaging, messagingModule } = await deviceToken();
    await tell('/push-api/unsubscribe', token, readSaved()?.lang ?? 'en').catch(() => undefined);
    await messagingModule.deleteToken(messaging).catch(() => undefined);
  } finally {
    writeSaved({ on: false, lang: readSaved()?.lang ?? 'en' });
  }
  return pushState();
};

/** When the reader switches the app language, notices follow it (quietly, no question asked). */
export const syncPushLanguage = async (lang: 'en' | 'ar') => {
  const saved = readSaved();
  if (!saved?.on || saved.lang === lang || pushState() !== 'on') return;
  try {
    const { token } = await deviceToken();
    await tell('/push-api/subscribe', token, lang);
    writeSaved({ on: true, lang });
  } catch {
    /* tried again next time */
  }
};
