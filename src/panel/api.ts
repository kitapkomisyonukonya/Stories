import { initializeApp } from '@firebase/app';
import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithPopup, signOut, type User } from '@firebase/auth';
import { firebaseConfig } from '../lib/firebaseConfig';

/**
 * Everything the panel asks the server. People sign in with their Google account; the server
 * checks the signed token and its team list, so a role shown here is only a convenience and every
 * permission is decided again on the server.
 *
 * In the local demo (PANEL_DEMO=1, never on the real site) people pick a team member from a list
 * instead, and the server keeps every change in memory.
 */

export type Role = 'admin' | 'editor' | 'teacher' | 'translator' | 'viewer';

export interface PanelConfig {
  roles: Record<Role, string>;
  proposals: boolean;
  storage: boolean;
  demo: boolean;
  demoPeople?: { email: string; role: Role }[];
  baseBranch: string;
  release: boolean;
  bucket: string;
}

export interface Member {
  email: string;
  name: string;
  role: Role;
  label: string;
  approve: boolean;
  id: string;
}

export interface TeamMember {
  email: string;
  name: string;
  role: Role;
  owner: boolean;
  addedBy?: string;
  addedAt?: string;
}

export interface MediaItem {
  staged: string;
  target: string;
  url: string;
  label: string;
  kind: 'image' | 'audio';
  edition: string;
  chapter: number | null;
  by: string;
  at: string;
}

export interface Basket {
  branch: string;
  number: number | null;
  url: string | null;
  files: { path: string; status: string }[];
  commits: { sha: string; message: string; date?: string }[];
  behind: number;
  media: MediaItem[];
  submitted: boolean;
  note: string;
  checks: 'none' | 'missing' | 'running' | 'passed' | 'failed';
  rejected?: { by: string; reason: string; at: string };
}

export interface OpenBasket extends Basket {
  title: string;
  owner: string;
  ownerName: string;
  kind: 'basket' | 'new-book';
  updatedAt?: string;
}

export interface HistoryCommit {
  sha: string;
  message: string;
  date?: string;
  parents: string[];
}

let auth: ReturnType<typeof getAuth> | null = null;
const firebaseAuth = () => (auth ??= getAuth(initializeApp(firebaseConfig, 'panel')));

const DEMO_KEY = 'panel_demo_person';
let demoMode = false;
const demoListeners = new Set<(user: { email: string } | null) => void>();
const demoPerson = () => {
  try {
    return sessionStorage.getItem(DEMO_KEY);
  } catch {
    return null;
  }
};

export const setDemoMode = (value: boolean) => {
  demoMode = value;
};

export type SignedIn = { email: string; photo?: string | null; name?: string | null };

export const watchUser = (callback: (user: SignedIn | null) => void): (() => void) => {
  if (demoMode) {
    const person = demoPerson();
    callback(person ? { email: person } : null);
    demoListeners.add(callback);
    return () => demoListeners.delete(callback);
  }
  return onAuthStateChanged(firebaseAuth(), (user: User | null) =>
    callback(user ? { email: user.email ?? '', photo: user.photoURL, name: user.displayName } : null),
  );
};

export const signIn = async (demoEmail?: string) => {
  if (demoMode) {
    if (!demoEmail) return;
    sessionStorage.setItem(DEMO_KEY, demoEmail);
    for (const listener of demoListeners) listener({ email: demoEmail });
    return;
  }
  await signInWithPopup(firebaseAuth(), new GoogleAuthProvider());
};

export const signOutOfPanel = async () => {
  if (demoMode) {
    sessionStorage.removeItem(DEMO_KEY);
    for (const listener of demoListeners) listener(null);
    return;
  }
  await signOut(firebaseAuth());
};

const token = async (): Promise<string | null> => {
  if (demoMode) {
    const person = demoPerson();
    return person ? `demo:${person}` : null;
  }
  return (await firebaseAuth().currentUser?.getIdToken()) ?? null;
};

/** Reads one of the panel's own copies of the book files (/content/…), as the signed-in member. */
export const contentFetch = async (path: string): Promise<Response | null> => {
  const bearer = await token();
  return fetch(path, bearer ? { headers: { Authorization: `Bearer ${bearer}` } } : undefined).catch(() => null);
};

export class PanelError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const request = async <T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> => {
  const headers = new Headers();
  const bearer = await token();
  if (bearer) headers.set('Authorization', `Bearer ${bearer}`);
  if (init.body !== undefined) headers.set('Content-Type', 'application/json');
  let response: Response;
  try {
    response = await fetch(path, { method: init.method ?? 'GET', headers, body: init.body === undefined ? undefined : JSON.stringify(init.body) });
  } catch {
    throw new PanelError('Sunucuya ulaşılamadı. İnternet bağlantısını kontrol edip tekrar deneyin.', 0);
  }
  const data = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) throw new PanelError(data.error ?? `Sunucu ${response.status} cevabı verdi.`, response.status);
  return data as T;
};

/** One entry of the app's feedback form, as the server keeps it. */
export interface FeedbackItem {
  id: string;
  path: string;
  at: string;
  formLang: 'tr' | 'en' | 'ar';
  appLang: 'en' | 'ar';
  role: 'student' | 'teacher' | 'parent' | 'other' | null;
  storyId: string | null;
  level: string | null;
  ratings: Partial<Record<'overall' | 'ease' | 'level' | 'exercises' | 'media', number>>;
  liked: string;
  problems: string;
  ideas: string;
  device: 'phone' | 'tablet' | 'computer' | null;
}

export const api = {
  config: async (): Promise<PanelConfig | null> => {
    const response = await fetch('/panel-api/config').catch(() => null);
    return response?.ok ? ((await response.json()) as PanelConfig) : null;
  },
  me: () => request<Member>('/panel-api/me'),
  mediaFolders: (folders: string[]) =>
    request<{ folders: Record<string, { path: string; name: string; url: string }[] | null> }>('/panel-api/media/folders', { method: 'POST', body: { folders } }),
  previewAccess: () => request<{ hidden: boolean }>('/panel-api/preview-access', { method: 'POST', body: {} }).catch(() => ({ hidden: false })),
  team: () => request<{ members: TeamMember[]; roles: Record<Role, string>; canWrite: boolean }>('/panel-api/team'),
  saveMember: (member: { email: string; name: string; role: Role }) => request<{ members: TeamMember[] }>('/panel-api/team', { method: 'POST', body: member }),
  removeMember: (email: string) => request<{ members: TeamMember[] }>('/panel-api/team/remove', { method: 'POST', body: { email } }),
  file: (path: string, ref?: string) =>
    request<{ text: string | null; image?: string | null; from: string }>(`/panel-api/file?path=${encodeURIComponent(path)}${ref ? `&ref=${encodeURIComponent(ref)}` : ''}`),
  basket: () => request<Basket>('/panel-api/basket'),
  save: (files: { path: string; json: unknown }[], message: string) => request<Basket>('/panel-api/basket/save', { method: 'POST', body: { files, message } }),
  /** A picture (base64 WebP) into the basket. */
  saveBinary: (path: string, base64: string, message: string) => request<Basket>('/panel-api/basket/save', { method: 'POST', body: { files: [{ path, base64 }], message } }),
  discard: (path: string) => request<Basket>('/panel-api/basket/discard', { method: 'POST', body: { path } }),
  clear: () => request<Basket>('/panel-api/basket/clear', { method: 'POST', body: {} }),
  submit: (note: string) => request<{ submitted: boolean }>('/panel-api/basket/submit', { method: 'POST', body: { note } }),
  baskets: () => request<{ baskets: OpenBasket[] }>('/panel-api/baskets'),
  publish: (owner: string, force = false) =>
    request<{ published: boolean; mediaErrors: string[] }>(`/panel-api/baskets/${owner}/publish`, { method: 'POST', body: { force } }),
  reject: (owner: string, reason: string) => request<{ rejected: boolean }>(`/panel-api/baskets/${owner}/reject`, { method: 'POST', body: { reason } }),
  locks: () => request<{ locks: Record<string, string[]> }>('/panel-api/locks'),
  history: (path?: string) => request<{ commits: HistoryCommit[] }>(`/panel-api/history${path ? `?path=${encodeURIComponent(path)}` : ''}`),
  commit: (sha: string) => request<HistoryCommit & { files: { path: string; status: string }[] }>(`/panel-api/history/${sha}`),
  undo: (sha: string) => request<Basket>(`/panel-api/history/${sha}/undo`, { method: 'POST', body: {} }),
  upload: (body: { name: string; contentType: string; data: string; target: string; label: string; edition?: string; chapter?: number | null }) =>
    request<{ media: MediaItem[] }>('/panel-api/media/upload', { method: 'POST', body }),
  removeMedia: (staged: string) => request<{ media: MediaItem[] }>('/panel-api/media/remove', { method: 'POST', body: { staged } }),
  newBook: (body: {
    storyId: string;
    title: string;
    level: string;
    text: string;
    brief: string;
    mode: 'claude' | 'manual';
    model?: WriterModel;
    effort?: WriterEffort;
    isNew: boolean;
    nameEn?: string;
    nameAr?: string;
    collection?: string;
  }) =>
    request<{ branch: string; number: number }>('/panel-api/new-book', { method: 'POST', body }),
  newBookRuns: () => request<{ runs: { id: number; branch: string; status: string; conclusion: string | null; createdAt: string; url: string }[] }>('/panel-api/new-book'),
  askNewBook: (number: number, text: string, choice: { model: WriterModel; effort: WriterEffort }) =>
    request<{ asked: boolean }>(`/panel-api/new-book/${number}/ask`, { method: 'POST', body: { text, ...choice } }),
  feedback: () => request<{ entries: FeedbackItem[] }>('/panel-api/feedback'),
  removeFeedback: (path: string) => request<{ entries: FeedbackItem[] }>('/panel-api/feedback/remove', { method: 'POST', body: { path } }),
  sendNotice: (body: { title: { en: string; ar: string }; text: { en: string; ar: string }; link: string }) =>
    request<{ sent: ('en' | 'ar')[]; topicBase: string }>('/panel-api/push/send', { method: 'POST', body }),
  release: () => request<{ enabled: boolean; branch?: string; exists?: boolean; waiting?: { sha: string; message: string; date?: string }[]; aheadBy?: number | null }>('/panel-api/release'),
  goLive: () => request<{ released: string }>('/panel-api/release', { method: 'POST', body: {} }),
};

/** Which Claude writes a new book, and how hard it thinks (the server and yeni-kitap.yml accept only these). */
export type WriterModel = 'claude-opus-5-5' | 'claude-sonnet-5-5';
export type WriterEffort = 'medium' | 'high' | 'xhigh';
export const WRITER_MODELS: [WriterModel, string][] = [
  ['claude-opus-5-5', 'Opus 5.5'],
  ['claude-sonnet-5-5', 'Sonnet 5.5 (daha az kullanım)'],
];
export const WRITER_EFFORTS: [WriterEffort, string][] = [
  ['medium', 'Orta (Medium)'],
  ['high', 'Yüksek (High)'],
  ['xhigh', 'Çok yüksek (Extra high)'],
];

/** A file read as bytes, for an upload. */
export const fileToBase64 = (file: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).replace(/^data:[^,]*,/, ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
