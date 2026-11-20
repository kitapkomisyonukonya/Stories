import type { Level } from '../types';

/**
 * The feedback form people fill in after using the app (pilot teachers, students, parents).
 *
 * Nothing that names a person is asked for: no name, school, e-mail or account. The form keeps
 * the person's answers, the role they chose, the book they wrote about (if any) and the kind of
 * device (phone, tablet or computer). The server adds the date and keeps the record where only the
 * project team can read it, in the content panel.
 */

export type FeedbackLang = 'tr' | 'en' | 'ar';
export type FeedbackRole = 'student' | 'teacher' | 'parent' | 'other';
export type FeedbackQuestion = 'overall' | 'ease' | 'level' | 'exercises' | 'media';
export type FeedbackDevice = 'phone' | 'tablet' | 'computer';

export const FEEDBACK_QUESTIONS: FeedbackQuestion[] = ['overall', 'ease', 'level', 'exercises', 'media'];
export const FEEDBACK_ROLES: FeedbackRole[] = ['student', 'teacher', 'parent', 'other'];
export const FEEDBACK_TEXT_LIMIT = 2000;

export interface FeedbackEntry {
  formLang: FeedbackLang;
  appLang: 'en' | 'ar';
  role: FeedbackRole | null;
  storyId: string | null;
  level: Level | null;
  ratings: Partial<Record<FeedbackQuestion, number>>;
  liked: string;
  problems: string;
  ideas: string;
  device: FeedbackDevice;
  /** Left empty by people; a form-filling robot fills it and the server drops the entry. */
  website?: string;
}

export const FEEDBACK_ENDPOINT = '/feedback-api/send';

/** `#/feedback` opens the form straight away, so the link handed to testers can point at it. */
export const isFeedbackHash = (hash: string): boolean => /^#\/(feedback|geri-bildirim)\/?$/i.test(hash);

export const detectDevice = (): FeedbackDevice => {
  if (typeof window === 'undefined') return 'computer';
  const width = Math.min(window.screen?.width || window.innerWidth, window.screen?.height || window.innerHeight);
  const touch = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;
  if (touch && width < 600) return 'phone';
  if (touch && width < 1100) return 'tablet';
  return 'computer';
};

export const hasFeedbackContent = (entry: FeedbackEntry): boolean =>
  Object.keys(entry.ratings).length > 0 || Boolean(entry.liked.trim() || entry.problems.trim() || entry.ideas.trim());

export type SendResult = 'sent' | 'busy' | 'failed';

export const sendFeedback = async (entry: FeedbackEntry): Promise<SendResult> => {
  try {
    const response = await fetch(FEEDBACK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    if (response.ok) return 'sent';
    return response.status === 429 ? 'busy' : 'failed';
  } catch {
    return 'failed';
  }
};
