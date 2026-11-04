#!/usr/bin/env node
/**
 * Builds SCORM 1.2 packages of one book, one zip per language:
 *
 *   node scripts/scorm/build.mjs yunusEmre A2 en ar
 *
 * Output: dist-scorm/<storyId>-<level>-<lang>-scorm12.zip (and the unpacked folder next to it).
 * The zip holds the app's reader for that book only (vite.scorm.config.ts), the fonts, 1200 px copies of the
 * chapter pictures, the student usage guide PDF and imsmanifest.xml. The narration is not inside: it streams
 * from Firebase Storage, as in the app, which keeps the zip small. Book PDFs open from the R2 bucket.
 * Needs sharp for the pictures: npm install --no-save sharp@0.34.5 (as in the Dockerfile).
 * What the package reports to the LMS: src/scorm/runtime.ts.
 */
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const [storyId, level, ...langs] = process.argv.slice(2);
if (!storyId || !/^(A1|A2|B1|B2)$/.test(level ?? '') || !langs.length || langs.some(l => l !== 'en' && l !== 'ar')) {
  console.error('Usage: node scripts/scorm/build.mjs <storyId> <A2|B1|B2> <en|ar> [en|ar]');
  process.exit(1);
}

const stories = JSON.parse(readFileSync(path.join(root, 'src/content/stories.json'), 'utf8')).stories;
const story = stories.find(item => item.id === storyId);
if (!story) throw new Error(`Unknown storyId ${storyId}`);
if (story.hidden) throw new Error(`${storyId} is hidden; publish it before packing it.`);

const pdfBase = (readFileSync(path.join(root, 'cloudbuild.preview.yaml'), 'utf8').match(/_PDF_BASE_URL:\s*(\S+)/) ?? [])[1] ?? '';
const LANGUAGE_NAME = { en: 'English', ar: 'Arabic' };
const storyName = story.text?.en?.name ?? storyId;

const xml = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const listFiles = dir =>
  readdirSync(dir).flatMap(name => {
    const file = path.join(dir, name);
    return statSync(file).isDirectory() ? listFiles(file) : [file];
  });

const outRoot = path.join(root, 'dist-scorm');
mkdirSync(outRoot, { recursive: true });

// Chapter pictures: 1200 px WebP copies, quality 82, like /media-image on the app's server. Made once per build
// and shared by the languages; both editions of a book use the same pictures.
const sharp = await import('sharp').then(m => m.default).catch(() => {
  console.error('sharp is needed for the chapter pictures: npm install --no-save sharp@0.34.5');
  process.exit(1);
});
const edition = `${storyId}-${level.toLowerCase()}`;
const imageUrls = [...new Set(['en', 'ar'].flatMap(lang => {
  const file = path.join(root, 'src/content/books', `${edition}-${lang}.json`);
  if (!existsSync(file)) return [];
  return JSON.parse(readFileSync(file, 'utf8')).book.pages.filter(page => page.type === 'story' && page.image).map(page => page.image);
}))];
const mediaDir = path.join(outRoot, `.media-${edition}`);
rmSync(mediaDir, { recursive: true, force: true });
mkdirSync(mediaDir, { recursive: true });
const mediaMap = {};
for (const [index, url] of imageUrls.entries()) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Picture ${url} answered ${response.status}`);
  const name = `media/picture-${String(index + 1).padStart(2, '0')}.webp`;
  await sharp(Buffer.from(await response.arrayBuffer())).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(mediaDir, path.basename(name)));
  mediaMap[url] = name;
}
console.log(`[scorm] ${imageUrls.length} chapter pictures ready`);

for (const lang of langs) {
  const name = `${storyId}-${level.toLowerCase()}-${lang}-scorm12`;
  const dir = path.join(outRoot, name);
  rmSync(dir, { recursive: true, force: true });
  const appDir = path.join(dir, 'app');
  console.log(`\n[scorm] building ${name}`);
  execFileSync('npx', ['vite', 'build', '--config', 'vite.scorm.config.ts', '--logLevel', 'warn'], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, VITE_SCORM_BOOK: `${storyId}:${level}:${lang}`, VITE_SCORM_PDF_BASE: pdfBase, VITE_SCORM_MEDIA: JSON.stringify(mediaMap), SCORM_OUT_DIR: appDir },
  });

  // The few public files the reader uses.
  const pub = path.join(root, 'public');
  for (const file of ['Arakom-Regular.woff2', 'Arakom-Bold.woff2', 'Arakom-Regular.ttf', 'Arakom-Bold.ttf', 'icons/brand-1014-favicon-64.png', `pdfs/guides/student-guide-${lang}.pdf`]) {
    mkdirSync(path.dirname(path.join(appDir, file)), { recursive: true });
    cpSync(path.join(pub, file), path.join(appDir, file));
  }
  cpSync(path.join(pub, 'fonts'), path.join(appDir, 'fonts'), { recursive: true });
  cpSync(mediaDir, path.join(appDir, 'media'), { recursive: true });

  // index.html: no web-app manifest or install icons inside an LMS; paths relative to the package.
  const indexFile = path.join(appDir, 'index.html');
  let html = readFileSync(indexFile, 'utf8')
    .replace(/\s*<link rel="manifest"[^>]*>/, '')
    .replace(/\s*<link rel="apple-touch-icon"[^>]*>/, '')
    .replace(/\s*<meta name="(mobile-web-app-capable|apple-mobile-web-app-[a-z-]+)"[^>]*>/g, '')
    .replace('href="/icons/', 'href="icons/');
  const title = `${storyName} ${level} (${LANGUAGE_NAME[lang]}) · From Language to Culture`;
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${xml(title)}</title>`).replace('<html lang="en">', `<html lang="${lang}"${lang === 'ar' ? ' dir="rtl"' : ''}>`);
  writeFileSync(indexFile, html);

  // Font files are named from the site root in the stylesheets (src/fonts.css, src/index.css): point them at the package.
  for (const file of listFiles(appDir)) {
    if (!/\.(css|html)$/.test(file)) continue;
    const prefix = path.relative(path.dirname(file), appDir).split(path.sep).join('/');
    const to = prefix ? `${prefix}/` : '';
    const text = readFileSync(file, 'utf8');
    const fixed = text.replace(/url\((['"]?)\/(fonts\/|Arakom-)/g, (_, quote, rest) => `url(${quote}${to}${rest}`);
    if (fixed !== text) writeFileSync(file, fixed);
  }

  // Any leftover absolute path would point at the LMS's own server.
  const absolute = listFiles(appDir)
    .filter(file => /\.(html|css|js)$/.test(file))
    .flatMap(file => {
      const text = readFileSync(file, 'utf8');
      const hits = text.match(/["'(]\/(assets|fonts|icons|Arakom)[^"')]*/g) ?? [];
      return hits.map(hit => `${path.relative(appDir, file)}: ${hit}`);
    });
  if (absolute.length) throw new Error(`Absolute paths left in the package:\n${absolute.slice(0, 20).join('\n')}`);

  const files = listFiles(dir).map(file => path.relative(dir, file).split(path.sep).join('/')).sort();
  const manifest = `<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="lisandan-kulture-${name}" version="1.0"
  xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
  xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 imscp_rootv1p1p2.xsd http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 imsmd_rootv1p2p1.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 adlcp_rootv1p2.xsd">
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  <organizations default="org">
    <organization identifier="org">
      <title>${xml(title)}</title>
      <item identifier="book" identifierref="book-resource" isvisible="true">
        <title>${xml(title)}</title>
      </item>
    </organization>
  </organizations>
  <resources>
    <resource identifier="book-resource" type="webcontent" adlcp:scormtype="sco" href="app/index.html">
${files.map(file => `      <file href="${xml(file)}"/>`).join('\n')}
    </resource>
  </resources>
</manifest>
`;
  writeFileSync(path.join(dir, 'imsmanifest.xml'), manifest);

  const zipFile = path.join(outRoot, `${name}.zip`);
  rmSync(zipFile, { force: true });
  execFileSync('zip', ['-r', '-9', '-q', '-X', zipFile, '.'], { cwd: dir });
  const mb = (statSync(zipFile).size / 1024 / 1024).toFixed(2);
  console.log(`[scorm] ${path.relative(root, zipFile)}: ${mb} MB, ${files.length + 1} files`);
}
