/**
 * Error reporting without personal data.
 *
 * The app tells the server two things: that a page was opened (once per visit) and that a script
 * failed (what failed, where in the code). No name, no account, no reading progress, no address
 * and no cookie travels with it, and nothing is stored in the browser except the "already counted
 * this visit" mark. The server writes them to its own log and keeps no visitor data, so the
 * numbers answer "is the app breaking for somebody?" and nothing else.
 */
const ENDPOINT = '/__event';
const MAX_MESSAGE = 300;

const allowed = () => {
  try {
    // A visitor who asked not to be tracked is not counted at all.
    return import.meta.env.PROD && navigator.doNotTrack !== '1' && typeof navigator.sendBeacon === 'function';
  } catch {
    return false;
  }
};

const send = (body: Record<string, string | number>) => {
  try {
    navigator.sendBeacon(ENDPOINT, new Blob([JSON.stringify(body)], { type: 'application/json' }));
  } catch {
    /* the app never waits for this */
  }
};

/** The page a visitor is on, without the book they are reading or anything they typed. */
const screenName = (): string => {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (!hash) return 'home';
  const parts = hash.split('/');
  return parts.length >= 3 ? 'reader' : parts[0] || 'home';
};

export const startTelemetry = () => {
  if (!allowed()) return;

  try {
    if (!sessionStorage.getItem('app_visit_counted')) {
      sessionStorage.setItem('app_visit_counted', '1');
      send({ kind: 'open', screen: screenName() });
    }
  } catch {
    /* storage blocked: the visit is simply not counted */
  }

  window.addEventListener('error', event => {
    send({
      kind: 'error',
      message: String(event.message ?? 'error').slice(0, MAX_MESSAGE),
      source: String(event.filename ?? '').split('/').pop()?.slice(0, 80) ?? '',
      line: Number(event.lineno ?? 0),
      screen: screenName(),
    });
  });

  window.addEventListener('unhandledrejection', event => {
    const reason = event.reason as { message?: string } | string | undefined;
    const message = typeof reason === 'string' ? reason : reason?.message ?? 'promise rejected';
    send({ kind: 'error', message: String(message).slice(0, MAX_MESSAGE), source: 'promise', line: 0, screen: screenName() });
  });
};

/** A screen that failed to draw and showed the "could not open" card instead (see PageErrorBoundary). */
export const reportRenderError = (error: unknown) => {
  if (!allowed()) return;
  const message = error instanceof Error ? error.message : String(error);
  send({ kind: 'error', message: message.slice(0, MAX_MESSAGE), source: 'render', line: 0, screen: screenName() });
};
