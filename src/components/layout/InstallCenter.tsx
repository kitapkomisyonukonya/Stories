import React, { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../contexts/LanguageContext';
import { useDialogFocus } from '../../hooks/useDialogFocus';
import { isHomeHash } from '../../lib/hashRoute';
import { isAppleMobile, isHandheld, isStandalone, useInstallPrompt } from '../../lib/pwa';
import { disablePush, enablePush, pushState, syncPushLanguage, type PushState } from '../../lib/push';
import { INSTALL_COPY, OPEN_INSTALL_EVENT } from '../../data/installCopy';
import { useUserRole } from '../../contexts/UserRoleContext';
import { hasAccessCode } from './AccessGate';
import { Check, Download, X } from '../ui/icons';

/**
 * Phones and tablets: a small toast on the library page offers the app (Android: one tap with the
 * browser's own install prompt; iPhone/iPad: Share → Add to Home Screen, Apple allows nothing more).
 * Once installed, a toast asks once whether to turn on new-story notices. Closing either toast is
 * remembered, so nobody is asked again and again. The "Install the app" page (footer link, the
 * book menu, or #/install) shows the four-step picture and the notices switch.
 */

const TOAST_KEY = 'v2:install-toast-closed';
const PUSH_TOAST_KEY = 'v2:push-toast-closed';
const ASK_AGAIN_MS = 30 * 24 * 3600 * 1000;
const OPENED_WITH_HASH = typeof window !== 'undefined' && /^#\/install\/?$/.test(window.location.hash);

const closedRecently = (key: string, forever = false) => {
  try {
    const at = Number(localStorage.getItem(key) || 0);
    return at > 0 && (forever || Date.now() - at < ASK_AGAIN_MS);
  } catch {
    return false;
  }
};
const remember = (key: string) => {
  try {
    localStorage.setItem(key, String(Date.now()));
  } catch {
    /* storage blocked */
  }
};

const useIsHome = () => {
  const [home, setHome] = useState(() => isHomeHash(window.location.hash));
  useEffect(() => {
    const update = () => setHome(isHomeHash(window.location.hash));
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  return home;
};

const ShareIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="inline-block align-[-3px]">
    <path d="M12 3v12M8 7l4-4 4 4" />
    <path d="M6 11v9h12v-9" />
  </svg>
);

const BellIcon = ({ size = 20 }: { size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9Z" />
    <path d="M10 20a2 2 0 0 0 4 0" />
  </svg>
);

const PushSwitch: React.FC<{ lang: 'en' | 'ar' }> = ({ lang }) => {
  const copy = INSTALL_COPY[lang];
  const [state, setState] = useState<PushState>(() => pushState());
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const toggle = async () => {
    setBusy(true);
    setFailed(false);
    try {
      setState(state === 'on' ? await disablePush() : await enablePush(lang));
    } catch {
      setFailed(true);
      setState(pushState());
    } finally {
      setBusy(false);
    }
  };

  const note =
    state === 'needs-install' ? copy.pushNeedsInstall : state === 'blocked' ? copy.pushBlocked : state === 'unsupported' ? copy.pushUnsupported : state === 'on' ? copy.pushIsOn : null;

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 sm:p-6" data-push-switch>
      <h2 className="flex items-center gap-2.5 font-display text-[19px] font-semibold text-[#FFF9EC]">
        <span className="text-[#E9C46A]"><BellIcon /></span>
        {copy.pushHeading}
      </h2>
      <p className="mt-2 text-[15px] leading-relaxed text-[#F6F0E2]/80">{copy.pushText}</p>
      {note && (
        <p className={cn('mt-3 flex items-center gap-2 text-[14px]', state === 'on' ? 'text-[#F3D58C]' : 'text-[#F6F0E2]/70')} role="status">
          {state === 'on' && <Check size={16} />}
          {note}
        </p>
      )}
      {failed && <p className="mt-3 text-[14px] text-[#F3B8A0]" role="alert">{copy.pushFailed}</p>}
      {(state === 'on' || state === 'off') && (
        <button
          type="button"
          onClick={() => { void toggle(); }}
          disabled={busy}
          className={cn(
            'mt-4 min-h-12 rounded-xl px-5 text-[15px] font-semibold transition-colors disabled:opacity-60',
            state === 'on' ? 'border border-white/15 text-[#F6F0E2] hover:border-white/35' : 'bg-[#E9C46A] text-[#1a1a12] hover:bg-[#F3D58C]',
          )}
          data-push-toggle
        >
          {state === 'on' ? copy.pushOff : copy.pushOn}
        </button>
      )}
      <p className="mt-4 text-[13px] leading-relaxed text-[#F6F0E2]/55">{copy.pushPrivacy}</p>
    </section>
  );
};

const InstallPage: React.FC<{ isOpen: boolean; onClose: () => void; lang: 'en' | 'ar' }> = ({ isOpen, onClose, lang }) => {
  const dialogRef = useDialogFocus(isOpen, onClose);
  const copy = INSTALL_COPY[lang];
  const isAr = lang === 'ar';
  const { canInstall, installed, install } = useInstallPrompt();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className={cn('fixed inset-0 z-[300] overflow-y-auto overscroll-contain bg-[#0b0e0c] text-[#F6F0E2]', isAr && 'font-arabic')}
          style={isAr ? undefined : ({ '--font-display': '"Poppins", sans-serif', fontFamily: '"Poppins", sans-serif' } as React.CSSProperties)}
          dir={isAr ? 'rtl' : 'ltr'}
          lang={lang}
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={copy.heading}
          data-install-page
        >
          <div className="sticky top-0 z-10 border-b border-white/[0.07] bg-[#0b0e0c]/92 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-[760px] items-center justify-between gap-4 px-4 py-3 sm:px-8">
              <p className="flex min-w-0 items-center gap-2.5 font-display text-[17px] font-semibold text-[#FFF9EC]">
                <Download size={20} className="shrink-0 text-[#E9C46A]" />
                <span className="truncate">{copy.heading}</span>
              </p>
              <button
                type="button"
                onClick={onClose}
                aria-label={copy.close}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/[0.06] text-[#F6F0E2]/85 transition-colors hover:bg-white/[0.1] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                data-install-close
              >
                <X size={22} />
              </button>
            </div>
          </div>

          <div className="mx-auto w-full max-w-[760px] space-y-7 px-4 pb-20 pt-6 sm:px-8 sm:pt-10">
            <div>
              <h1 className="font-display text-[30px] font-semibold leading-tight text-[#FFF9EC] sm:text-[36px]">{copy.heading}</h1>
              <p className="mt-3 text-[16px] leading-relaxed text-[#F6F0E2]/80">{copy.intro}</p>
              {installed ? (
                <p className="mt-4 flex items-center gap-2 text-[15px] font-semibold text-[#F3D58C]" role="status" data-install-done>
                  <Check size={18} /> {copy.installed}
                </p>
              ) : canInstall ? (
                <button
                  type="button"
                  onClick={() => { void install(); }}
                  className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#E9C46A] px-6 text-[16px] font-semibold text-[#1a1a12] hover:bg-[#F3D58C]"
                  data-install-now
                >
                  <Download size={18} /> {copy.install}
                </button>
              ) : null}
            </div>

            <PushSwitch lang={lang} />

            <section>
              <h2 className="mb-3 font-display text-[19px] font-semibold text-[#FFF9EC]">{copy.steps}</h2>
              <img
                src={`/install/howto-${lang}.webp`}
                alt={copy.imageAlt}
                width={2160}
                height={lang === 'ar' ? 4722 : 4714}
                loading="lazy"
                decoding="async"
                className="h-auto w-full rounded-3xl border border-white/10"
                data-install-steps
              />
            </section>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const InstallCenter: React.FC = () => {
  const { language } = useLanguage();
  const lang = language === 'ar' ? 'ar' : 'en';
  const copy = INSTALL_COPY[lang];
  const isHome = useIsHome();
  const { role } = useUserRole();
  const { canInstall, installed, install } = useInstallPrompt();
  const [pageOpen, setPageOpen] = useState(OPENED_WITH_HASH);
  const [toast, setToast] = useState<'install' | 'push' | null>(null);

  useEffect(() => {
    const open = () => setPageOpen(true);
    window.addEventListener(OPEN_INSTALL_EVENT, open);
    return () => window.removeEventListener(OPEN_INSTALL_EVENT, open);
  }, []);

  useEffect(() => {
    void syncPushLanguage(lang);
  }, [lang]);

  // Decide on a toast a few seconds after the library page shows, never inside a book.
  useEffect(() => {
    // Automated browsers (the test suite) never get a toast over the page they are clicking.
    if (!isHome || pageOpen || !role || !hasAccessCode() || !isHandheld() || navigator.webdriver) {
      setToast(null);
      return;
    }
    const timer = window.setTimeout(() => {
      if (installed || isStandalone()) {
        if (pushState() === 'off' && Notification.permission === 'default' && !closedRecently(PUSH_TOAST_KEY, true)) setToast('push');
        return;
      }
      if (!closedRecently(TOAST_KEY)) setToast('install');
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [isHome, pageOpen, installed, role]);

  const closeToast = useCallback(() => {
    remember(toast === 'push' ? PUSH_TOAST_KEY : TOAST_KEY);
    setToast(null);
  }, [toast]);

  const closePage = useCallback(() => {
    setPageOpen(false);
    if (/^#\/install\/?$/.test(window.location.hash)) history.replaceState(null, '', '#/');
  }, []);

  const turnOnPush = async () => {
    remember(PUSH_TOAST_KEY);
    setToast(null);
    try {
      await enablePush(lang);
    } catch {
      /* the page's switch shows the state and lets them try again */
    }
  };

  const apple = isAppleMobile();
  const isAr = lang === 'ar';
  const toastText = toast === 'push' ? copy.pushAsk : canInstall ? copy.toastAndroid : apple ? copy.toastIos : copy.toastOther;

  return (
    <>
      <AnimatePresence>
        {toast && !(toast === 'install' && installed) && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.22 }}
            className={cn('fixed inset-x-3 z-[250] mx-auto max-w-[460px] rounded-2xl border border-[#E9C46A]/30 bg-[#14130f]/95 p-3.5 text-[#F6F0E2] shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl', isAr && 'font-arabic')}
            style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 84px)', ...(isAr ? {} : { fontFamily: '"Poppins", sans-serif' }) }}
            dir={isAr ? 'rtl' : 'ltr'}
            lang={lang}
            role="dialog"
            aria-live="polite"
            aria-label={toast === 'push' ? copy.pushHeading : copy.toastTitle}
            data-install-toast={toast}
          >
            <div className="flex items-start gap-3">
              {toast === 'push' ? (
                <span className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E9C46A]/15 text-[#F3D58C]"><BellIcon size={22} /></span>
              ) : (
                <img src="/icons/brand-1014-192.png" alt="" width={44} height={44} className="mt-0.5 h-11 w-11 shrink-0 rounded-xl" />
              )}
              <div className="min-w-0 flex-1">
                {toast === 'install' && <p className="font-display text-[15px] font-semibold text-[#FFF9EC]">{copy.toastTitle}</p>}
                <p className={cn('text-[14px] leading-snug text-[#F6F0E2]/85', toast === 'push' && 'font-semibold text-[#FFF9EC]')}>
                  {toastText}
                  {toast === 'install' && !canInstall && apple && <> <span className="text-[#7cb7ff]"><ShareIcon /></span></>}
                </p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  {toast === 'push' ? (
                    <button type="button" onClick={() => { void turnOnPush(); }} className="min-h-10 rounded-lg bg-[#E9C46A] px-4 text-[14px] font-semibold text-[#1a1a12]" data-push-toast-on>
                      {copy.pushTurnOn}
                    </button>
                  ) : canInstall ? (
                    <button
                      type="button"
                      onClick={() => { void install().then(done => { if (done) setToast(null); }); }}
                      className="inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-[#E9C46A] px-4 text-[14px] font-semibold text-[#1a1a12]"
                      data-install-toast-install
                    >
                      <Download size={16} /> {copy.install}
                    </button>
                  ) : (
                    <button type="button" onClick={() => { setToast(null); setPageOpen(true); }} className="min-h-10 rounded-lg bg-[#E9C46A] px-4 text-[14px] font-semibold text-[#1a1a12]" data-install-toast-how>
                      {copy.how}
                    </button>
                  )}
                  <button type="button" onClick={closeToast} className="min-h-10 rounded-lg px-3 text-[14px] font-semibold text-[#F6F0E2]/70 hover:text-white" data-install-toast-later>
                    {copy.notNow}
                  </button>
                </div>
              </div>
              <button type="button" onClick={closeToast} aria-label={copy.close} className="-m-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#F6F0E2]/60 hover:text-white">
                <X size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <InstallPage isOpen={pageOpen} onClose={closePage} lang={lang} />
    </>
  );
};
