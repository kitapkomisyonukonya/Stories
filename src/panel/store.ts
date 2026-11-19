import { useSyncExternalStore } from 'react';
import { api, contentFetch, type Basket, type Member, type OpenBasket, type PanelConfig, type SignedIn } from './api';
import { describeChanges, summarize } from './diff';
import { describeFile } from './util';

/**
 * The panel's memory: who is signed in, the books' summary, and the files open for editing.
 *
 * An open file is a "draft": the version it was loaded as (from the person's basket if they
 * already changed it, else from the preview branch) and the version being edited. Saving sends
 * every changed draft to the basket in one go; until then nothing leaves the browser, and the app
 * in the panel's frame already shows the edited version.
 */

export interface EditionSummary {
  edition: string;
  storyId: string;
  level: string;
  language: 'en' | 'ar';
  collection: string;
  title: string;
  pages: {
    id: number;
    type: string;
    title: string;
    words: number;
    wordNotes: number;
    places: number;
    hotspots: number;
    quick: number;
    focus: number;
    group: boolean;
    beforeYouRead: boolean;
    iCan: number;
    image: string;
    audio: 'current' | 'stale' | 'unknown' | 'none';
    audioPath: string | null;
  }[];
}

export interface StoryEntry {
  id: string;
  text: Record<string, { name: string; description: string }>;
  availableLevels: string[];
  collection: string;
  hidden?: boolean;
  englishOnly?: boolean;
  arabicHidden?: boolean;
}

export interface Draft {
  path: string;
  original: unknown;
  value: unknown;
  from: string;
}

interface State {
  config: PanelConfig | null | undefined;
  user: SignedIn | null | undefined;
  member: Member | null;
  memberError: string | null;
  summary: EditionSummary[] | null;
  stories: StoryEntry[] | null;
  basket: Basket | null;
  baskets: OpenBasket[] | null;
  locks: Record<string, string[]>;
  drafts: Record<string, Draft>;
  toast: { text: string; kind: 'good' | 'bad' | 'info'; id: number } | null;
  saving: boolean;
}

let state: State = {
  config: undefined,
  user: undefined,
  member: null,
  memberError: null,
  summary: null,
  stories: null,
  basket: null,
  baskets: null,
  locks: {},
  drafts: {},
  toast: null,
  saving: false,
};

const listeners = new Set<() => void>();
const draftListeners = new Set<(path: string) => void>();

export const getState = () => state;
export const setState = (patch: Partial<State> | ((current: State) => Partial<State>)) => {
  state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
  for (const listener of listeners) listener();
};
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useStore = <T>(select: (current: State) => T): T => useSyncExternalStore(subscribe, () => select(state));

/** Called whenever a draft changes, so the app in the frame can show it. */
export const onDraftChange = (listener: (path: string) => void) => {
  draftListeners.add(listener);
  return () => draftListeners.delete(listener);
};

let toastTimer: number | undefined;
export const toast = (text: string, kind: 'good' | 'bad' | 'info' = 'info') => {
  window.clearTimeout(toastTimer);
  setState({ toast: { text, kind, id: Date.now() } });
  toastTimer = window.setTimeout(() => setState({ toast: null }), kind === 'bad' ? 9000 : 5000);
};

// --- books ------------------------------------------------------------------------------------

export const storyName = (storyId: string, language: 'en' | 'ar' = 'en') => {
  const story = state.stories?.find(item => item.id === storyId);
  return story?.text[language]?.name ?? story?.text.en?.name ?? storyId;
};

export const loadLibrary = async () => {
  const [summary, stories] = await Promise.all([
    contentFetch('/content/panel-summary.json').then(response => (response?.ok ? response.json() : null)),
    contentFetch('/content/stories.json').then(response => (response?.ok ? response.json() : null)),
  ]);
  setState({ summary: summary?.editions ?? [], stories: stories?.stories ?? [] });
  // A draft of the book list (a name changed) wins over the published one.
  void loadFile('src/content/stories.json').then(draft => {
    if (draft) setState({ stories: (draft.value as { stories: StoryEntry[] }).stories });
  });
};

// --- drafts -----------------------------------------------------------------------------------

const loading = new Map<string, Promise<Draft | null>>();

/** Reads where the published copies of files live when the server cannot reach GitHub. */
const publishedCopy = (path: string): string | null => {
  const book = /^src\/content\/(books|guides)\/(.+\.json)$/.exec(path);
  if (book) return `/content/${book[1]}/${book[2]}`;
  const top = /^src\/content\/(stories|bookCatalog|entityCards)\.json$/.exec(path);
  if (top) return `/content/${top[1]}.json`;
  if (path.startsWith('tts/')) return `/content/${path}`;
  return null;
};

export const loadFile = (path: string): Promise<Draft | null> => {
  const existing = state.drafts[path];
  if (existing) return Promise.resolve(existing);
  const pending = loading.get(path);
  if (pending) return pending;
  const request = (async () => {
    let text: string | null = null;
    let from = 'preview';
    if (state.member && state.config?.proposals) {
      try {
        const result = await api.file(path);
        text = result.text;
        from = result.from;
      } catch {
        text = null;
      }
    }
    if (text === null) {
      const copy = publishedCopy(path);
      if (copy) {
        const response = await contentFetch(copy);
        if (response?.ok) text = await response.text();
      }
    }
    if (text === null) return null;
    const value = JSON.parse(text) as unknown;
    const draft: Draft = { path, original: value, value, from };
    setState(current => ({ drafts: { ...current.drafts, [path]: draft } }));
    for (const listener of draftListeners) listener(path);
    return draft;
  })().finally(() => loading.delete(path));
  loading.set(path, request);
  return request;
};

export const updateDraft = (path: string, change: (value: unknown) => unknown) => {
  const draft = state.drafts[path];
  if (!draft) return;
  if (!mayEditPath(path)) {
    toast(state.member?.role === 'viewer' ? 'Rolün sadece bakmaya izin veriyor.' : 'Rolün bu dosyayı değiştirmeye izin vermiyor.', 'bad');
    return;
  }
  const value = change(draft.value);
  if (value === draft.value) return;
  setState(current => ({ drafts: { ...current.drafts, [path]: { ...draft, value } } }));
  for (const listener of draftListeners) listener(path);
};

export const revertDraft = (path: string) => {
  const draft = state.drafts[path];
  if (!draft) return;
  setState(current => ({ drafts: { ...current.drafts, [path]: { ...draft, value: draft.original } } }));
  for (const listener of draftListeners) listener(path);
};

/** Forgets a loaded file, so it is read again (after a basket was published or emptied). */
export const forgetDrafts = (paths?: string[]) => {
  setState(current => {
    const drafts = { ...current.drafts };
    for (const path of paths ?? Object.keys(drafts)) if (drafts[path] && drafts[path].value === drafts[path].original) delete drafts[path];
    return { drafts };
  });
};

export const isDirty = (draft: Draft) => draft.value !== draft.original && JSON.stringify(draft.value) !== JSON.stringify(draft.original);
export const dirtyDrafts = (drafts = state.drafts) => Object.values(drafts).filter(isDirty);

export const mayEditPath = (path: string) => {
  const member = state.member;
  if (!member) return Boolean(state.config === null);
  if (member.role === 'viewer') return false;
  if (member.role === 'translator') return /-ar\.json$/.test(path) || path === 'tts/arabic_requests.json';
  return true;
};

/** Saves every changed file to the basket, with a message that says what changed in words. */
export const saveAll = async (note?: string): Promise<boolean> => {
  const dirty = dirtyDrafts();
  if (dirty.length === 0) return true;
  if (!state.config?.proposals) {
    toast('Kaydetme henüz açık değil: panelin GitHub bağlantısı kurulmadı. Değişiklikleriniz bu sekmede duruyor.', 'bad');
    return false;
  }
  setState({ saving: true });
  try {
    const parts = dirty.map(draft => {
      const changes = describeChanges(draft.original, draft.value);
      const what = summarize(changes);
      return `${describeFile(draft.path, id => storyName(id))}${what ? `: ${what}` : ''}`;
    });
    const message = note?.trim() ? `${note.trim()} (${parts.join('; ')})` : parts.join('; ');
    const basket = await api.save(
      dirty.map(draft => ({ path: draft.path, json: draft.value })),
      message.slice(0, 280),
    );
    setState(current => {
      const drafts = { ...current.drafts };
      for (const draft of dirty) drafts[draft.path] = { ...drafts[draft.path], original: drafts[draft.path].value, from: 'basket' };
      return { drafts, basket };
    });
    toast(dirty.length === 1 ? 'Kaydedildi. Değişiklik sepetinizde.' : `${dirty.length} dosya kaydedildi. Değişiklikler sepetinizde.`, 'good');
    void refreshBaskets();
    return true;
  } catch (error) {
    toast((error as Error).message, 'bad');
    return false;
  } finally {
    setState({ saving: false });
  }
};

export const refreshBasket = async () => {
  if (!state.member) return;
  try {
    setState({ basket: await api.basket() });
  } catch (error) {
    console.warn('[Panel] basket', error);
  }
};

export const refreshBaskets = async () => {
  if (!state.member || !state.config?.proposals) {
    setState({ baskets: [] });
    return;
  }
  try {
    const [{ baskets }, { locks }] = await Promise.all([api.baskets(), api.locks()]);
    setState({ baskets, locks });
  } catch (error) {
    console.warn('[Panel] baskets', error);
  }
};
