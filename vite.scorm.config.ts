import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { defineConfig, mergeConfig, type Plugin, type UserConfig } from 'vite';
import baseConfig from './vite.config';

/**
 * Build of ONE book for a SCORM package (scripts/scorm/build.mjs). Same app, three differences:
 * - relative paths (base "./"), because an LMS serves the package from its own folder;
 * - only this book's text, guides and Places & People pictures go in, so the package stays small;
 * - nothing from public/ is copied (the build script adds the few files the book needs).
 * Pictures and narration keep coming from Firebase Storage, as in the app.
 */
const book = process.env.VITE_SCORM_BOOK ?? '';
const [storyId, level] = book.split(':');
if (!storyId || !level) throw new Error('VITE_SCORM_BOOK must look like "yunusEmre:A2:en"');
const edition = `${storyId}-${level.toLowerCase()}`;

// Places & People pictures: only the ones named in this story's card set
// (src/features/historical-entities/books/*.ts, the file whose chapters list "<storyId>-<level>").
const entityDir = path.resolve(__dirname, 'src/features/historical-entities/books');
const pictureGlobs = (): string => {
  const setFile = readdirSync(entityDir)
    .map(name => readFileSync(path.join(entityDir, name), 'utf8'))
    .find(text => text.includes(`'${storyId}-${level.toLowerCase()}'`) || text.includes(`"${storyId}-${level.toLowerCase()}"`));
  // No card set found: take every picture (bigger package, nothing missing).
  if (!setFile) return "'./assets/pictures/*/*.webp'";
  const pictures = [...new Set([...setFile.matchAll(/picture:\s*\{\s*folder:\s*["']([\w-]+)["'],\s*name:\s*["']([\w-]+)["']/g)].map(m => `./assets/pictures/${m[1]}/${m[2]}.webp`))];
  return JSON.stringify(pictures.length ? pictures : ['./assets/pictures/none/*.webp']);
};

// Cover pictures in src/assets/images: the other books' covers are swapped for this one's.
const COVER_FILES: Record<string, string> = {
  adam: 'adam_cover', mecca: 'mecca_cover', ibrahim: 'abraham_cover', musa: 'moses_cover',
  yunusEmre: 'yunus_emre_cover', ibnJubayr: 'ibn_jubayr_cover',
};

const HOME_STUB = '\0scorm-home-stub';

const onlyThisBook = (): Plugin => ({
  name: 'scorm-only-this-book',
  enforce: 'pre',
  // The package opens straight into the book: the library home page (and its pictures) stays out.
  resolveId(source, importer) {
    if (importer && /\/layout\/HomePage(\.tsx)?$/.test(source)) return HOME_STUB;
    return null;
  },
  load(id) {
    return id === HOME_STUB ? 'export const HomePage = () => null;' : null;
  },
  transform(code, id) {
    const file = id.split(path.sep).join('/');
    const cover = COVER_FILES[storyId];
    if (cover && file.endsWith('/src/core/content/storyCatalog.ts')) {
      return code.replace(/'(\.\.\/\.\.\/assets\/images\/)([a-z_]+_cover)(_sm)?\.webp'/g, (_, dir, _name, small) => `'${dir}${cover}${small ?? ''}.webp'`);
    }
    if (file.endsWith('/src/content/contentSource.ts')) {
      return code
        .replace("import.meta.glob('./books/*.json'", `import.meta.glob('./books/${edition}-*.json'`)
        .replace("import.meta.glob('./guides/*.json'", `import.meta.glob('./guides/${edition}-*.json'`);
    }
    if (file.endsWith('/src/features/historical-entities/pictures.ts')) {
      return code.replace("import.meta.glob('./assets/pictures/*/*.webp'", `import.meta.glob(${pictureGlobs()}`);
    }
    return null;
  },
});

export default defineConfig(env => {
  const base = (typeof baseConfig === 'function' ? baseConfig(env) : baseConfig) as UserConfig;
  // The base config's build stamp writes version.json and sw.js for the website; the package has neither.
  const plugins = (base.plugins ?? []).filter(plugin => !(plugin && typeof plugin === 'object' && 'name' in plugin && plugin.name === 'build-stamp'));
  return mergeConfig({ ...base, plugins }, {
    base: './',
    publicDir: false,
    plugins: [onlyThisBook()],
    build: {
      outDir: process.env.SCORM_OUT_DIR ?? 'dist-scorm/app',
      emptyOutDir: true,
      manifest: false,
      modulePreload: { polyfill: false },
    },
  } satisfies UserConfig);
});
