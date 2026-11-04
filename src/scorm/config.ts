import type { Level } from '../types';

/**
 * SCORM edition: one book packed for an LMS (built by scripts/scorm/build.mjs).
 * VITE_SCORM_BOOK = "<storyId>:<level>:<en|ar>", e.g. "yunusEmre:A2:en". In the normal app it is empty and
 * SCORM is null, so nothing here changes the app.
 */
export interface ScormBook {
  storyId: string;
  level: Level;
  language: 'en' | 'ar';
}

// Node scripts (PDF builds, validators) read some of these files too; they have no import.meta.env.
const env = (): Record<string, string | undefined> =>
  ((import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {});

const parse = (value: string | undefined): ScormBook | null => {
  const [storyId, level, language] = (value ?? '').split(':');
  if (!storyId || !level || (language !== 'en' && language !== 'ar')) return null;
  return { storyId, level: level as Level, language };
};

export const SCORM: ScormBook | null = parse(env().VITE_SCORM_BOOK);

/** Same book and level as the package: the only book a SCORM edition may open. */
export const isScormBook = (storyId: string | null | undefined, level: string | null | undefined) =>
  Boolean(SCORM && storyId === SCORM.storyId && level === SCORM.level);

/**
 * Inside an LMS the app's own server is not there: the book PDFs and the media kit come straight from
 * the R2 bucket (VITE_SCORM_PDF_BASE, the same address as PDF_BASE_URL on the server), and files that
 * travel in the package are named relative to it.
 */
const PDF_BASE = (env().VITE_SCORM_PDF_BASE ?? '').replace(/\/+$/, '');

export const appFileUrl = (path: string): string => {
  if (!SCORM) return path;
  if (PDF_BASE && /^\/pdfs\/(books|media-kit)\//.test(path)) return `${PDF_BASE}${path.slice('/pdfs'.length)}`;
  return path.replace(/^\//, '');
};

/**
 * Chapter pictures travel inside the package as 1200 px WebP copies (made by scripts/scorm/build.mjs, as the
 * app's server does for the website). VITE_SCORM_MEDIA maps each original Storage address to its file.
 */
let mediaMap: Record<string, string> | null = null;
export const scormMediaFile = (url: string): string | undefined => {
  if (!SCORM) return undefined;
  if (!mediaMap) {
    try {
      mediaMap = JSON.parse(env().VITE_SCORM_MEDIA || '{}') as Record<string, string>;
    } catch {
      mediaMap = {};
    }
  }
  return mediaMap[url];
};
