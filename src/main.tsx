// First: a working storage before any module reads it (see the file).
import './lib/safeStorage';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './fonts.css';
import './index.css';
import './loading.css';
import './guideTheme.css';
import './pdfLocked.css';
import './arabicTypography.css';
import './lib/pdfDownloadLock';
import { LanguageProvider } from './contexts/LanguageContext';
import { ArabicUiSanitizer } from './components/ArabicUiSanitizer';
import { ArabicHarakatFilter } from './components/ArabicHarakatFilter';
import { SkipLink } from './components/ui/SkipLink';
import { JournalLinks } from './components/seyahatname/JournalLinks';
import { UserRoleProvider } from './contexts/UserRoleContext';
import { ClassModeProvider } from './contexts/ClassModeContext';
import { registerServiceWorker } from './lib/pwa';
import { applyHomeScreenName } from './lib/homeScreenName';
import { InstallCenter } from './components/layout/InstallCenter';
import { startTelemetry } from './lib/telemetry';
import { startStats } from './lib/stats';
import { preloadDeferredChunks } from './lib/preloadDeferred';
import { PageErrorBoundary } from './components/ui/PageErrorBoundary';
import { SCORM } from './scorm/config';
import { startScorm } from './scorm/runtime';
import { reloadFresh } from './lib/freshReload';

applyHomeScreenName();

// Arabic readers: start loading both Arakom faces now, before the first Arabic text asks for them.
try {
  if (localStorage.getItem('app_language') === 'ar' && document.fonts) {
    void document.fonts.load('16px Arakom').catch(() => undefined);
    void document.fonts.load('bold 16px Arakom').catch(() => undefined);
  }
} catch {
  /* storage blocked */
}

const CHUNK_RELOAD_KEY = 'stories_chunk_reload_at';

window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();

  const now = Date.now();
  let lastReload = 0;
  try {
    lastReload = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0);
  } catch {
    /* storage blocked */
  }

  // A Cloud Run deploy replaces hashed Vite chunks. If an already-open tab
  // requests a chunk from the previous revision, reload once to pick up the
  // fresh index.html and its current asset hashes. The guard prevents loops if
  // the failure is caused by a real network outage instead of a stale bundle.
  if (!Number.isFinite(lastReload) || now - lastReload > 15_000) {
    try {
      sessionStorage.setItem(CHUNK_RELOAD_KEY, String(now));
    } catch {
      /* storage blocked */
    }
    reloadFresh();
  }
});

window.setTimeout(() => {
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  } catch {
    /* storage blocked */
  }
}, 30_000);

// The SCORM edition runs inside an LMS: no service worker and no reports to our server.
if (SCORM) {
  startScorm();
} else {
  registerServiceWorker();
  startTelemetry();
  startStats();
}
preloadDeferredChunks();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PageErrorBoundary fullScreen>
      <LanguageProvider>
        <UserRoleProvider>
          <ClassModeProvider>
            <SkipLink />
            <App />
            <JournalLinks />
            {!SCORM && <InstallCenter />}
            <ArabicUiSanitizer />
            <ArabicHarakatFilter />
          </ClassModeProvider>
        </UserRoleProvider>
      </LanguageProvider>
    </PageErrorBoundary>
  </StrictMode>,
);
