import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';

// The app's one stylesheet goes inside index.html, so the first paint does not wait for a second
// request (PageSpeed: render-blocking request). index.html is never cached, the CSS file is still emitted.
const inlineEntryCss = (): Plugin => ({
  name: 'inline-entry-css',
  apply: 'build',
  transformIndexHtml: {
    order: 'post',
    handler(html, ctx) {
      return html.replace(/<link rel="stylesheet"[^>]*href="\/(assets\/[^"]+\.css)"[^>]*>/g, (tag, fileName: string) => {
        const asset = ctx.bundle?.[fileName];
        if (!asset || asset.type !== 'asset') return tag;
        return `<style>${String(asset.source)}</style>`;
      });
    },
  },
});

// Every build gets an id made from what it ships: the hashed file names plus the files in public/
// (the PDFs aside). A rebuild with the same content keeps the same id. The id goes into index.html,
// version.json and sw.js, so an open or installed app can tell that a newer build is out
// (src/lib/pwa.ts) and the service worker swaps its app caches only when something changed.
const publicFiles = (dir: string): string[] =>
  readdirSync(dir).flatMap(name => {
    const file = path.join(dir, name);
    if (statSync(file).isDirectory()) return name === 'pdfs' ? [] : publicFiles(file);
    return [file];
  });
const buildStamp = (): Plugin => {
  let buildId = '';
  let outDir = 'dist';
  return {
    name: 'build-stamp',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir;
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const hash = createHash('sha256');
        Object.keys(ctx.bundle ?? {}).sort().forEach(name => hash.update(name));
        const publicDir = path.resolve(__dirname, 'public');
        publicFiles(publicDir).sort().forEach(file => hash.update(path.relative(publicDir, file)).update(readFileSync(file)));
        buildId = hash.digest('hex').slice(0, 12);
        return html.replace('</head>', `  <meta name="stories-build" content="${buildId}" />\n  </head>`);
      },
    },
    closeBundle() {
      if (!buildId) return;
      const dist = path.resolve(__dirname, outDir);
      writeFileSync(path.join(dist, 'version.json'), JSON.stringify({ build: buildId }));
      const sw = path.join(dist, 'sw.js');
      if (existsSync(sw)) writeFileSync(sw, readFileSync(sw, 'utf8').replace('__STORIES_BUILD__', buildId));
    },
  };
};

// Books that are not published yet (the books marked hidden in src/content/stories.json) are built into files
// named assets/hidden-*.js. When PREVIEW_KEY is set on the server, those files are only sent to a
// browser that opened the preview link with that key (deploy/server.mjs), so the unpublished texts
// cannot be downloaded by anyone who reads the app's code.
const hiddenStoryIds = (): string[] => {
  const file = JSON.parse(readFileSync(path.resolve(__dirname, 'src/content/stories.json'), 'utf8')) as {
    stories: { id: string; hidden?: boolean }[];
  };
  return file.stories.filter(story => story.hidden).map(story => story.id);
};
// Content files are named <storyId>-<level>-<language>.json under src/content.
const hiddenContentPrefixes = hiddenStoryIds().map(id => `${path.sep}src${path.sep}content${path.sep}`.concat(`$$${id}-`));
const isHiddenModule = (id: string) => hiddenContentPrefixes.some(prefix => {
  const [folder, start] = prefix.split('$$');
  const index = id.indexOf(folder);
  if (index < 0) return false;
  const rest = id.slice(index + folder.length);
  return rest.startsWith(`books${path.sep}${start}`) || rest.startsWith(`guides${path.sep}${start}`);
});

// The preview branch is deployed by Cloud Build; GitHub Actions are not required for this path.
export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), inlineEntryCss(), buildStamp()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        'lucide-react': path.resolve(__dirname, 'src/components/ui/icons.tsx'),
      },
    },
    build: {
      manifest: true,
      sourcemap: false,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          chunkFileNames: chunk =>
            chunk.moduleIds.length > 0 && chunk.moduleIds.every(isHiddenModule)
              ? 'assets/hidden-[name]-[hash].js'
              : 'assets/[name]-[hash].js',
        },
      },
    },
    server: {
      // AI Studio can disable HMR through DISABLE_HMR during automated edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
