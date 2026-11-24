import type { BookData, Level } from '../../types';
import type { BookPair, CollectionId, StoryId } from './contracts';
import { getStorageManifest } from '../storage/storageManifests';
import type { BookAssetManifest } from '../storage/contracts';
import { finalizePreparedBookPairForUi } from './uiBookFinalization';
import { loadReaderChunks } from '../../components/book/readerChunks';
import { readContent } from '../../content/contentSource';
import { withPlacesLayer } from '../../features/historical-entities';
import type { HistoricalEntityBookKey, HistoricalEntityLocale } from '../../features/historical-entities';
import { bookCatalog, type BookCatalogEntry } from '../../content/bookCatalog';
import { editionName } from '../../content/editionName';
import { fileLanguage } from '../../content/arabicOnlyLevels';
import { isPanelPreview, onPanelPreviewChange } from '../../content/panelPreview';

export { editionName };

export interface BookDefinition {
  storyId: StoryId;
  level: Level;
  collection: CollectionId;
  storage: BookAssetManifest;
  /** Canonical/prepared book data before the shared UI learning finalization layer. */
  loadSource: () => Promise<BookPair>;
  /** Effective UI book after the shared Learning System and guide finalization. */
  load: () => Promise<BookPair>;
}

interface BookFile {
  schema: number;
  storyId: StoryId;
  level: Level;
  language: 'en' | 'ar';
  collection: CollectionId;
  book: BookData;
}

const definitionKey = (storyId: StoryId, level: Level): string => `${storyId}:${level}`;

const loadEdition = async (storyId: StoryId, level: Level, language: 'en' | 'ar'): Promise<BookData> => {
  const file = await readContent<BookFile>('books', editionName(storyId, level, fileLanguage(level, language)));
  if (!file?.book?.pages?.length) {
    throw new Error(`[Book Registry] ${storyId} ${level} ${language} has no pages.`);
  }
  // Places & People cards come from the shared entity catalogue, not from the book file, so a
  // correction to a card reaches every book without the books being written again.
  const bookKey = `${storyId}-${level.toLowerCase()}` as HistoricalEntityBookKey;
  return { ...file.book, pages: withPlacesLayer(file.book.pages, bookKey, language as HistoricalEntityLocale) };
};

const createDefinition = (entry: BookCatalogEntry): BookDefinition => {
  const { storyId, level, collection } = entry;
  const loadSource = async (): Promise<BookPair> => {
    const [en, ar] = await Promise.all([
      loadEdition(storyId, level, 'en'),
      loadEdition(storyId, level, 'ar'),
    ]);
    return { en, ar };
  };

  let preparedPromise: Promise<BookPair> | null = null;
  const load = () => {
    if (!preparedPromise) {
      preparedPromise = loadSource()
        .then(source => finalizePreparedBookPairForUi(source))
        .catch(error => {
          preparedPromise = null;
          throw error;
        });
    }
    return preparedPromise;
  };

  // In the content panel's frame an edited file replaces the loaded one, so forget the prepared book.
  if (isPanelPreview()) onPanelPreviewChange(() => {
    preparedPromise = null;
  });

  return { storyId, level, collection, storage: getStorageManifest(storyId, level), loadSource, load };
};

export const bookRegistry: readonly BookDefinition[] = bookCatalog.map(createDefinition);

const registryByKey = new Map(bookRegistry.map(definition => [definitionKey(definition.storyId, definition.level), definition]));

export const getBookDefinition = (storyId: string, level: Level): BookDefinition | null =>
  registryByKey.get(definitionKey(storyId as StoryId, level)) ?? null;

export const isRegisteredStoryId = (value: string): value is StoryId =>
  bookRegistry.some(definition => definition.storyId === value);

/** Preloads only the selected finalized UI book chunk; it never imports all story content eagerly. */
export const preloadBook = (storyId: string, level: Level): Promise<BookPair> | null => {
  void loadReaderChunks().catch(() => undefined);
  return getBookDefinition(storyId, level)?.load() ?? null;
};
