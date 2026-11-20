import { createHash, createVerify } from 'node:crypto';
import { createGithubRepo } from './panel/github.mjs';
import { createCloudStorage } from './panel/storage.mjs';
import { createFakeRepo, createFakeStorage } from './panel/fakes.mjs';
import { createFeedback } from './feedback.mjs';

/**
 * The server side of the content panel.
 *
 * Who may work in the panel: the owners in the PANEL_TEAM environment variable
 * ({"name@example.com": "admin", ...}) plus the people an admin adds in the panel (kept in
 * Storage, panel-state/team.json, a folder the Storage rules keep closed). People sign in with
 * Google through Firebase; the server checks the signed token itself.
 *
 * How a change travels: every person has one "basket", a branch on GitHub
 * (panel/sepet-<id>) with a pull request into the preview branch. Saving in the panel adds a
 * commit to that branch, so nothing is built or published while people work. The tests run on
 * the basket for free on GitHub. An admin looks at the basket (before and after, in plain
 * words) and publishes it: the branch is merged, which starts one preview build for everything
 * in it, and the pictures and recordings in the basket replace the book's own files.
 *
 * Nothing personal goes to the public repository: commits and pull requests carry the person's
 * display name, never their e-mail address.
 */

export const ROLES = {
  admin: { label: 'Yönetici', propose: 'all', approve: true },
  editor: { label: 'Editör', propose: 'all', approve: false },
  teacher: { label: 'Hoca', propose: 'all', approve: false },
  translator: { label: 'Çevirmen', propose: 'translations', approve: false },
  viewer: { label: 'Sadece bakar', propose: 'none', approve: false },
};

const BASKET_PREFIX = 'panel/sepet-';
const NEW_BOOK_PREFIX = 'panel/yeni-kitap-';
const TEAM_PATH = 'panel-state/team.json';
const BASKET_STATE = id => `panel-state/baskets/${id}.json`;
const UPLOAD_PREFIX = 'panel-uploads/';
const BODY_LIMIT = 8 * 1024 * 1024;
const UPLOAD_LIMIT = 30 * 1024 * 1024;
const NEW_BOOK_WORKFLOW = 'yeni-kitap.yml';

/** The files the panel may change, and how each is written back (indent as in the repository). */
const EDITABLE = [
  { kind: 'book', re: /^src\/content\/books\/([a-z][a-zA-Z]*)-(a1|a2|b1|b2|c1)-([a-z]{2})\.json$/, indent: 1 },
  { kind: 'guide', re: /^src\/content\/guides\/([a-z][a-zA-Z]*)-(a1|a2|b1|b2|c1)-([a-z]{2})\.json$/, indent: 1 },
  { kind: 'stories', re: /^src\/content\/stories\.json$/, indent: 1 },
  { kind: 'entityCards', re: /^src\/content\/entityCards\.json$/, indent: 1 },
  // A Places & People card's square picture (the app bundles these files).
  { kind: 'picture', re: /^src\/features\/historical-entities\/assets\/pictures\/([a-zA-Z]+)\/([a-z0-9-]+)\.webp$/, binary: true },
  { kind: 'tts', re: /^tts\/requests\.json$/, indent: 2, language: 'en' },
  { kind: 'tts', re: /^tts\/arabic_requests\.json$/, indent: 2, language: 'ar' },
];

export const editableFile = path => {
  const clean = String(path || '');
  if (clean.includes('..') || clean.startsWith('/')) return null;
  for (const entry of EDITABLE) {
    const match = entry.re.exec(clean);
    if (match) {
      const language = entry.language ?? (entry.kind === 'book' || entry.kind === 'guide' ? match[3] : null);
      return { ...entry, path: clean, match, language };
    }
  }
  return null;
};

/** Which Claude writes a new book and how hard it thinks; .github/workflows/yeni-kitap.yml reads these lines. */
export const WRITER_MODELS = ['claude-opus-5-5', 'claude-sonnet-5-5'];
export const WRITER_EFFORTS = ['medium', 'high', 'xhigh'];
const writerChoice = (body, effort = 'medium') => [
  `- Model: ${WRITER_MODELS.includes(body.model) ? body.model : WRITER_MODELS[0]}`,
  `- Çaba: ${WRITER_EFFORTS.includes(body.effort) ? body.effort : effort}`,
];

export const mayPropose = (role, file) => {
  const rule = ROLES[role]?.propose;
  if (rule === 'all') return true;
  if (rule === 'translations') return file.language === 'ar';
  return false;
};

/** Checks that a changed file still has the shape the app needs; the full rule check runs in the tests. */
export const checkFileShape = (file, value) => {
  if (!value || typeof value !== 'object') return 'dosya boş';
  if (file.kind === 'book') {
    const [, , level, language] = file.match;
    if (String(value.level).toLowerCase() !== level || value.language !== language) return 'dosya başka bir kitaba ait';
    if (!Array.isArray(value.book?.pages) || value.book.pages.length === 0) return 'kitapta hiç sayfa yok';
    for (const page of value.book.pages) {
      if (typeof page.id !== 'number' || typeof page.type !== 'string') return 'bir sayfanın numarası veya türü eksik';
    }
  }
  if (file.kind === 'guide') {
    const [, , level, language] = file.match;
    if (String(value.level).toLowerCase() !== level || value.language !== language) return 'rehber başka bir kitaba ait';
    if (!value.teacherGuide || !value.selfStudyGuide) return 'öğretmen veya öğrenci rehberi eksik';
  }
  if (file.kind === 'stories') {
    if (!Array.isArray(value.stories) || value.stories.length === 0) return 'kitap listesi boş';
    if (value.stories.some(story => !story.id || !story.text?.en?.name)) return 'bir kitabın adı eksik';
  }
  if (file.kind === 'entityCards') {
    if (!value.cards || typeof value.cards !== 'object' || Object.keys(value.cards).length === 0) return 'kart listesi boş';
    if (Object.values(value.cards).some(card => !card?.en?.title || !card?.en?.summary)) return 'bir kartın İngilizce adı veya özeti eksik';
  }
  if (file.kind === 'tts') {
    if (!Array.isArray(value.requests)) return 'seslendirme listesi bozuk';
    for (const item of value.requests) {
      if (!item.id || typeof item.narrationText !== 'string' || !item.narrationText.trim()) return 'bir seslendirme isteğinin metni eksik';
      const target = String(item.storagePath || '');
      if (!target.endsWith('.mp3') || target.includes('..') || target.startsWith('/')) return 'bir seslendirme isteğinin dosya yeri bozuk';
    }
    if (new Set(value.requests.map(item => item.id)).size !== value.requests.length) return 'aynı seslendirme isteği iki kez var';
  }
  return null;
};

const serialize = (file, value) => `${JSON.stringify(value, null, file.indent)}\n`;

const MEDIA_TARGET = /\.(png|jpe?g|webp|mp3|m4a)$/i;
export const validMediaTarget = target => {
  const clean = String(target || '');
  if (!MEDIA_TARGET.test(clean) || clean.includes('..') || clean.startsWith('/')) return false;
  const top = clean.split('/')[0];
  return !['tts-state', 'panel-state', 'panel-uploads'].includes(top) && clean.split('/').length >= 2;
};

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const isPlain = value => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

/**
 * Undoes one old change without undoing what came after it: every place that change touched goes
 * back to how it was before, unless someone has changed that place again since (a conflict, kept
 * as it is now and counted).
 */
export const revertChange = (before, after, now) => {
  if (same(before, after)) return { value: now, conflicts: 0 };
  if (same(now, after)) return { value: before, conflicts: 0 };
  if (same(now, before)) return { value: now, conflicts: 0 };
  if (isPlain(before) && isPlain(after) && isPlain(now)) {
    const value = {};
    let conflicts = 0;
    for (const key of new Set([...Object.keys(now), ...Object.keys(before), ...Object.keys(after)])) {
      const result = revertChange(before[key], after[key], now[key]);
      conflicts += result.conflicts;
      if (result.value !== undefined) value[key] = result.value;
    }
    return { value, conflicts };
  }
  if (Array.isArray(before) && Array.isArray(after) && Array.isArray(now) && before.length === after.length && after.length === now.length) {
    let conflicts = 0;
    const value = now.map((item, index) => {
      const result = revertChange(before[index], after[index], item);
      conflicts += result.conflicts;
      return result.value;
    });
    return { value, conflicts };
  }
  return { value: now, conflicts: 1 };
};

const personId = email => createHash('sha256').update(String(email).toLowerCase()).digest('hex').slice(0, 12);
/** The display name inside an ID token that verify() has already accepted. */
const googleName = token => {
  try {
    const claims = JSON.parse(Buffer.from(String(token).split('.')[1] ?? '', 'base64url').toString('utf8'));
    return typeof claims.name === 'string' ? claims.name.trim().slice(0, 80) : '';
  } catch {
    return '';
  }
};

const nameFromEmail = email => String(email).split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());

const readTeam = raw => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    const team = new Map();
    for (const [email, value] of Object.entries(parsed)) {
      const role = typeof value === 'string' ? value : value?.role;
      const name = typeof value === 'object' && value?.name ? String(value.name) : null;
      if (ROLES[role]) team.set(email.trim().toLowerCase(), { role, name });
    }
    return team.size > 0 ? team : null;
  } catch {
    console.error('[Panel] PANEL_TEAM is not valid JSON; the team panel stays closed.');
    return null;
  }
};

// --- Firebase ID token check ----------------------------------------------------------------

const CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
let certCache = { certs: null, until: 0 };

const fetchGoogleCerts = async () => {
  if (certCache.certs && Date.now() < certCache.until) return certCache.certs;
  const response = await fetch(CERTS_URL);
  if (!response.ok) throw new Error(`certificates answered ${response.status}`);
  const maxAge = Number(/max-age=(\d+)/.exec(response.headers.get('cache-control') || '')?.[1] || 3600);
  certCache = { certs: await response.json(), until: Date.now() + maxAge * 1000 };
  return certCache.certs;
};

const decodePart = part => JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));

/** Returns the verified e-mail address in a Firebase ID token, or null. */
export const verifyFirebaseToken = async (token, projectId, getCerts = fetchGoogleCerts, now = Date.now()) => {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;
  let header;
  let claims;
  try {
    header = decodePart(parts[0]);
    claims = decodePart(parts[1]);
  } catch {
    return null;
  }
  if (header.alg !== 'RS256' || !header.kid) return null;
  const cert = (await getCerts())[header.kid];
  if (!cert) return null;
  const verifier = createVerify('RSA-SHA256');
  verifier.update(`${parts[0]}.${parts[1]}`);
  if (!verifier.verify(cert, Buffer.from(parts[2], 'base64url'))) return null;

  const seconds = Math.floor(now / 1000);
  if (claims.aud !== projectId) return null;
  if (claims.iss !== `https://securetoken.google.com/${projectId}`) return null;
  if (!claims.sub || typeof claims.exp !== 'number' || claims.exp <= seconds) return null;
  if (typeof claims.iat !== 'number' || claims.iat > seconds + 300) return null;
  if (!claims.email || claims.email_verified !== true) return null;
  return String(claims.email).toLowerCase();
};

// --- HTTP -----------------------------------------------------------------------------------

const sendJson = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
};

const readJsonBody = (req, limit = BODY_LIMIT) =>
  new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', chunk => {
      size += chunk.length;
      if (size > limit) {
        reject(Object.assign(new Error('too large'), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'));
      } catch {
        reject(Object.assign(new Error('not JSON'), { status: 400 }));
      }
    });
    req.on('error', reject);
  });

const audit = (action, details) => console.log(JSON.stringify({ message: '[Panel] ' + action, ...details }));

/** A plain-words error that reaches the person in the panel. */
const problem = (status, message) => Object.assign(new Error(message), { status, plain: true });

const META = /<!-- panel-meta (\{.*?\}) -->/s;
const readMeta = body => {
  try {
    return JSON.parse(META.exec(body || '')?.[1] ?? '{}');
  } catch {
    return {};
  }
};

export const createPanelApi = (env = process.env, deps = {}) => {
  // The demo runs the whole panel against in-memory stand-ins (local testing only, never on Cloud Run).
  const demo = env.PANEL_DEMO === '1' && !env.K_SERVICE;
  const owners = readTeam(env.PANEL_TEAM);
  const projectId = env.FIREBASE_PROJECT_ID || 'gen-lang-client-0373200489';
  const repoName = env.PANEL_REPO || 'kitapkomisyonukonya/Stories';
  const baseBranch = env.PANEL_BASE_BRANCH || 'preview';
  const releaseBranch = env.PANEL_RELEASE_BRANCH || '';
  const bucket = env.PANEL_BUCKET || 'gen-lang-client-0373200489.firebasestorage.app';
  const verify = deps.verify ?? (demo ? async token => (String(token).startsWith('demo:') ? String(token).slice(5).toLowerCase() : null) : token => verifyFirebaseToken(token, projectId));
  const repo = deps.repo ?? (demo ? createFakeRepo({ base: baseBranch }) : env.PANEL_GITHUB_TOKEN ? createGithubRepo(env.PANEL_GITHUB_TOKEN, repoName) : null);
  const storage = deps.storage ?? (demo ? createFakeStorage() : env.K_SERVICE ? createCloudStorage(bucket) : null);

  const enabled = Boolean(owners);
  // The app's feedback form writes here even where the panel itself is switched off (the live site).
  const feedback = deps.feedback ?? createFeedback({ storage });

  // --- team ---------------------------------------------------------------------------------

  let teamCache = { members: null, until: 0 };
  const storedTeam = async () => {
    if (!storage) return [];
    if (teamCache.members && Date.now() < teamCache.until) return teamCache.members;
    const file = await storage.readJson(TEAM_PATH).catch(error => {
      console.error('[Panel] team list unreadable:', error.message);
      return null;
    });
    const members = Array.isArray(file?.members) ? file.members.filter(member => member.email && ROLES[member.role]) : [];
    teamCache = { members, until: Date.now() + 30_000 };
    return members;
  };

  const teamList = async () => {
    const stored = await storedTeam();
    const list = [];
    for (const [email, owner] of owners ?? []) {
      const extra = stored.find(member => member.email === email);
      const name = extra?.name || owner.name;
      list.push({ email, role: owner.role, name: name || nameFromEmail(email), named: Boolean(name), owner: true });
    }
    for (const member of stored) {
      if (owners?.has(member.email)) continue;
      list.push({ email: member.email, role: member.role, name: member.name || nameFromEmail(member.email), named: Boolean(member.name), owner: false, addedBy: member.addedBy, addedAt: member.addedAt });
    }
    return list;
  };

  /** The signed-in team member for a request, or null. */
  const memberFor = async req => {
    if (!owners) return null;
    const header = String(req.headers.authorization || '');
    if (!header.startsWith('Bearer ')) return null;
    const email = await verify(header.slice(7)).catch(() => null);
    if (!email) return null;
    const member = (await teamList()).find(item => item.email === email);
    if (!member) return null;
    // Without a name set in the team list, the person's own Google name is used, never one made
    // from the e-mail address.
    const name = member.named ? member.name : googleName(header.slice(7)) || member.name;
    return { ...member, name, id: personId(email), label: ROLES[member.role].label, approve: ROLES[member.role].approve };
  };

  const writeTeam = async (by, change) => {
    if (!storage) throw problem(503, 'Ekip listesi şu an değiştirilemiyor: depolama bağlı değil.');
    if (!(await storage.isPrivate(TEAM_PATH))) {
      throw problem(409, 'Ekip listesi kaydedilmedi: Storage kuralları panel-state klasörünü henüz kapatmıyor. Kuralların yayınlanması gerekiyor.');
    }
    const members = [...(await storedTeam())];
    change(members);
    await storage.writeJson(TEAM_PATH, { members });
    teamCache = { members, until: Date.now() + 30_000 };
    audit('team changed', { by: by.id });
  };

  // --- baskets ------------------------------------------------------------------------------

  const basketBranch = member => `${BASKET_PREFIX}${member.id}`;

  const basketState = async id => (storage ? ((await storage.readJson(BASKET_STATE(id)).catch(() => null)) ?? {}) : {});
  const saveBasketState = async (id, state) => {
    if (storage) await storage.writeJson(BASKET_STATE(id), { ...state, updatedAt: new Date().toISOString() });
  };

  const findPull = async branch => (await repo.listPulls(baseBranch)).find(pull => pull.branch === branch) ?? null;

  const ensureBasket = async member => {
    const branch = basketBranch(member);
    let sha = await repo.branchSha(branch);
    if (!sha) {
      const baseSha = await repo.branchSha(baseBranch);
      await repo.createBranch(branch, baseSha);
      sha = baseSha;
    }
    return branch;
  };

  const ensurePull = async member => {
    const branch = basketBranch(member);
    const existing = await findPull(branch);
    if (existing) return existing;
    const meta = { owner: member.id, name: member.name, kind: 'basket' };
    const created = await repo.createPull({
      title: `Panel: ${member.name} değişiklikleri`,
      head: branch,
      base: baseBranch,
      body: `Bu değişiklikler içerik panelinde yapıldı (${member.name}, ${member.label}). Panelde bir yönetici bakıp yayınlar.\n\n<!-- panel-meta ${JSON.stringify(meta)} -->`,
    });
    return { ...created, branch };
  };

  const basketSummary = async (branch, pull, ownerId) => {
    const exists = Boolean(await repo.branchSha(branch));
    const comparison = exists ? await repo.compare(baseBranch, branch) : { files: [], commits: [], behindBy: 0 };
    const state = await basketState(ownerId);
    let checks = 'none';
    if (pull && comparison.files.length > 0) checks = await repo.checkState(pull.headSha ?? (await repo.branchSha(branch)));
    return {
      branch,
      number: pull?.number ?? null,
      url: pull?.url ?? null,
      files: comparison.files,
      commits: comparison.commits,
      behind: comparison.behindBy,
      media: state.media ?? [],
      submitted: Boolean(state.submitted),
      note: state.note ?? '',
      checks,
      rejected: state.rejected ?? null,
    };
  };

  const listBaskets = async () => {
    const pulls = await repo.listPulls(baseBranch);
    const team = await teamList();
    const nameFor = id => team.find(member => personId(member.email) === id)?.name;
    const result = [];
    for (const pull of pulls) {
      if (!pull.branch.startsWith(BASKET_PREFIX) && !pull.branch.startsWith(NEW_BOOK_PREFIX)) continue;
      const meta = readMeta(pull.body);
      const ownerId = pull.branch.startsWith(BASKET_PREFIX) ? pull.branch.slice(BASKET_PREFIX.length) : meta.owner ?? '';
      const summary = await basketSummary(pull.branch, pull, ownerId);
      result.push({
        ...summary,
        title: pull.title,
        owner: ownerId,
        ownerName: nameFor(ownerId) ?? meta.name ?? 'Bilinmeyen kişi',
        kind: pull.branch.startsWith(NEW_BOOK_PREFIX) ? 'new-book' : 'basket',
        updatedAt: pull.updatedAt,
      });
    }
    // Baskets that hold only pictures or recordings have no pull request.
    if (storage) {
      for (const path of await storage.list('panel-state/baskets/').catch(() => [])) {
        const id = path.slice('panel-state/baskets/'.length).replace(/\.json$/, '');
        if (result.some(item => item.owner === id && item.kind === 'basket')) continue;
        const state = await basketState(id);
        if (!state.media?.length) continue;
        result.push({
          branch: `${BASKET_PREFIX}${id}`,
          number: null,
          url: null,
          files: [],
          commits: [],
          behind: 0,
          media: state.media,
          submitted: Boolean(state.submitted),
          note: state.note ?? '',
          checks: 'none',
          title: `Panel: ${state.name ?? nameFor(id) ?? 'Bilinmeyen kişi'} değişiklikleri`,
          owner: id,
          ownerName: nameFor(id) ?? state.name ?? 'Bilinmeyen kişi',
          kind: 'basket',
          updatedAt: state.updatedAt,
        });
      }
    }
    return result;
  };

  const save = async (member, { files, message }) => {
    if (!Array.isArray(files) || files.length === 0) throw problem(400, 'Kaydedilecek bir değişiklik yok.');
    const prepared = [];
    for (const item of files) {
      const file = editableFile(item.path);
      if (!file) throw problem(400, `Bu dosya panelden değiştirilemez: ${item.path}`);
      if (!mayPropose(member.role, file)) throw problem(403, 'Rolün bu dosyayı değiştirmeye izin vermiyor.');
      if (file.binary) {
        const bytes = Buffer.from(String(item.base64 || ''), 'base64');
        const webp = bytes.length > 12 && bytes.toString('latin1', 0, 4) === 'RIFF' && bytes.toString('latin1', 8, 12) === 'WEBP';
        if (!webp) throw problem(400, 'Resim kaydedilmedi: dosya okunamadı.');
        if (bytes.length > 600 * 1024) throw problem(413, 'Resim çok büyük.');
        prepared.push({ path: file.path, text: bytes.toString('base64'), encoding: 'base64' });
        continue;
      }
      const shape = checkFileShape(file, item.json);
      if (shape) throw problem(400, `Değişiklik kaydedilmedi: ${shape}.`);
      prepared.push({ path: file.path, text: serialize(file, item.json) });
    }
    const branch = await ensureBasket(member);
    const summary = String(message || '').trim().slice(0, 300) || 'İçerik değişikliği';
    await repo.commitFiles(branch, prepared, `Panel: ${summary}\n\n${member.name} (${member.label}) panelde yaptı.`);
    const pull = await ensurePull(member);
    const state = await basketState(member.id);
    if (state.submitted) await saveBasketState(member.id, { ...state, name: member.name, submitted: false });
    audit('basket saved', { by: member.id, files: prepared.map(file => file.path) });
    return basketSummary(branch, pull, member.id);
  };

  /** Puts one file in the basket back to how it is on the preview branch. */
  const discard = async (member, path) => {
    const file = editableFile(path);
    if (!file) throw problem(400, 'Bilinmeyen dosya.');
    const branch = basketBranch(member);
    if (!(await repo.branchSha(branch))) throw problem(404, 'Sepet boş.');
    // A picture goes back by pointing at the preview's own copy; text files are written back.
    const restored = file.binary ? { path: file.path, sha: await repo.fileSha(baseBranch, file.path), text: undefined } : { path: file.path, text: await repo.readFile(baseBranch, file.path) };
    if (file.binary && !restored.sha) restored.text = null;
    await repo.commitFiles(branch, [restored], `Panel: ${file.path} sepetten çıkarıldı\n\n${member.name} panelde yaptı.`);
    return closeIfEmpty(member);
  };

  const closeIfEmpty = async member => {
    const branch = basketBranch(member);
    const pull = await findPull(branch);
    const comparison = await repo.compare(baseBranch, branch);
    if (comparison.files.length === 0 && pull) {
      await repo.updatePull(pull.number, { state: 'closed' });
      await repo.deleteBranch(branch);
      return basketSummary(branch, null, member.id);
    }
    return basketSummary(branch, pull, member.id);
  };

  const removeStaged = async media => {
    for (const item of media ?? []) await storage?.remove(item.staged).catch(() => undefined);
  };

  const clearBasket = async member => {
    const branch = basketBranch(member);
    const pull = await findPull(branch);
    if (pull) await repo.updatePull(pull.number, { state: 'closed' });
    await repo.deleteBranch(branch);
    const state = await basketState(member.id);
    await removeStaged(state.media);
    await saveBasketState(member.id, { name: member.name, media: [], submitted: false });
    audit('basket cleared', { by: member.id });
    return basketSummary(branch, null, member.id);
  };

  /** Publishes a basket: merges its branch (one build) and puts its pictures and recordings in place. */
  const publish = async (member, ownerId, { force = false } = {}) => {
    const baskets = await listBaskets();
    const basket = baskets.find(item => item.owner === ownerId && item.kind === 'basket') ?? baskets.find(item => String(item.number) === String(ownerId));
    if (!basket) throw problem(404, 'Bu sepet artık yok; başka biri yayınlamış veya boşaltmış olabilir.');
    let merged = null;
    if (basket.number && basket.files.length > 0) {
      const pull = await repo.getPull(basket.number);
      if (!pull || pull.state !== 'open') throw problem(404, 'Bu sepet artık açık değil.');
      const checks = await repo.checkState(pull.headSha);
      if (checks !== 'passed' && !(force && checks === 'missing')) {
        throw problem(
          409,
          checks === 'running' || checks === 'missing'
            ? 'Testler bu sepette hâlâ çalışıyor. Bitince (genellikle 10-15 dakika) yayınlanabilir.'
            : 'Testler bu sepette hata buldu, bu yüzden yayınlanamaz. Sepetteki değişiklikleri gözden geçirin.',
        );
      }
      if (pull.mergeable === false) {
        await repo.updateBranch(basket.number).catch(() => {
          throw problem(409, 'Bu sepetteki bir dosya, o arada yayınlanan başka bir değişiklikle çakışıyor. Çakışan dosyayı sepetten çıkarıp yeniden düzenleyin.');
        });
        throw problem(409, 'Sepet en son hâle getirildi; testler yeniden çalışıyor. Bitince tekrar yayınlayın.');
      }
      // The history shows what changed, not just whose basket it was.
      const lines = basket.commits.map(commit => String(commit.message).split('\n')[0].replace(/^Panel: /, '')).filter(Boolean);
      const title = lines.length === 1 ? `Panel: ${lines[0]}` : `Panel: ${basket.ownerName}, ${lines.length} değişiklik`;
      merged = await repo.mergePull(basket.number, {
        title: `${title.slice(0, 200)} (#${basket.number})`,
        message: `${lines.length > 1 ? `${lines.map(line => `- ${line}`).join('\n')}\n\n` : ''}${basket.ownerName} yaptı; panelde ${member.name} onayladı ve yayınladı.`,
      });
      await repo.deleteBranch(basket.branch);
    }
    const mediaErrors = [];
    for (const item of basket.media) {
      try {
        await storage.replace(item.staged, item.target);
        folderCache.clear();
        await storage.remove(item.staged).catch(() => undefined);
      } catch (error) {
        mediaErrors.push(`${item.label || item.target}: ${error.message}`);
      }
    }
    await saveBasketState(basket.owner, { name: basket.ownerName, media: [], submitted: false });
    audit('basket published', { by: member.id, owner: basket.owner, pull: basket.number, media: basket.media.length, mediaErrors: mediaErrors.length });
    return { published: true, merged, mediaErrors };
  };

  const reject = async (member, ownerId, reason) => {
    const basket = (await listBaskets()).find(item => item.owner === ownerId || String(item.number) === String(ownerId));
    if (!basket) throw problem(404, 'Bu sepet artık yok.');
    if (basket.number) {
      if (reason) await repo.comment(basket.number, `Panelde ${member.name} geri çevirdi: ${String(reason).slice(0, 500)}`).catch(() => undefined);
      await repo.updatePull(basket.number, { state: 'closed' });
      await repo.deleteBranch(basket.branch);
    }
    await removeStaged(basket.media);
    if (basket.kind === 'basket') await saveBasketState(basket.owner, { name: basket.ownerName, media: [], submitted: false, rejected: { by: member.name, reason: String(reason || ''), at: new Date().toISOString() } });
    audit('basket rejected', { by: member.id, owner: basket.owner, pull: basket.number });
    return { rejected: true };
  };

  // --- routes -------------------------------------------------------------------------------

  const requireRepo = () => {
    if (!repo) throw problem(503, 'Kaydetme henüz açık değil: GitHub bağlantısı (PANEL_GITHUB_TOKEN) kurulmadı. Şimdilik sadece bakabilirsiniz.');
  };
  const requireAdmin = member => {
    if (!member.approve) throw problem(403, 'Bunu yalnızca bir yönetici yapabilir.');
  };
  const requireWriter = member => {
    if (ROLES[member.role].propose === 'none') throw problem(403, 'Rolün değişiklik yapmaya izin vermiyor.');
  };

  // Folder listings for the media views, kept for a minute; a publish that replaces files clears them.
  const folderCache = new Map();
  const listFolderCached = async folder => {
    const hit = folderCache.get(folder);
    if (hit && Date.now() < hit.until) return hit.files;
    const files = await storage.listFolder(folder);
    folderCache.set(folder, { files, until: Date.now() + 60_000 });
    return files;
  };

  const routes = [
    [
      'GET',
      /^feedback$/,
      async () => {
        if (!storage) throw problem(503, 'Depolama bağlı değil.');
        return { entries: await feedback.list() };
      },
    ],
    [
      'POST',
      /^feedback\/remove$/,
      async ({ member, body }) => {
        requireAdmin(member);
        await feedback.remove(body.path);
        return { entries: await feedback.list() };
      },
    ],
    [
      'POST',
      /^media\/folders$/,
      async ({ body }) => {
        if (!storage?.listFolder) throw problem(503, 'Depolama bağlı değil.');
        const folders = (Array.isArray(body.folders) ? body.folders : []).map(String).slice(0, 60);
        const result = {};
        await Promise.all(
          folders.map(async folder => {
            const clean = folder.replace(/\/+$/, '');
            const top = clean.split('/')[0];
            if (!clean || clean.includes('..') || clean.startsWith('/') || ['tts-state', 'panel-state'].includes(top)) return;
            result[folder] = await listFolderCached(clean).catch(() => null);
          }),
        );
        return { folders: result };
      },
    ],
    [
      'GET',
      /^me$/,
      async ({ member }) => {
        // The first sign-in keeps the person's Google name in the team list, so the team page,
        // the history and the baskets show the same name everywhere.
        if (!member.named && member.name && storage) {
          await writeTeam(member, members => {
            const existing = members.find(item => item.email === member.email);
            if (existing) existing.name ||= member.name;
            else members.push({ email: member.email, role: member.role, name: member.name });
          }).catch(() => undefined);
        }
        return { email: member.email, name: member.name, role: member.role, label: member.label, approve: member.approve, id: member.id };
      },
    ],
    ['GET', /^team$/, async () => ({ members: await teamList(), roles: Object.fromEntries(Object.entries(ROLES).map(([key, role]) => [key, role.label])), canWrite: Boolean(storage) })],
    [
      'POST',
      /^team$/,
      async ({ member, body }) => {
        requireAdmin(member);
        const email = String(body.email || '').trim().toLowerCase();
        const role = String(body.role || '');
        const name = String(body.name || '').trim().slice(0, 80);
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw problem(400, 'Geçerli bir e-posta adresi yazın.');
        if (!ROLES[role]) throw problem(400, 'Bir rol seçin.');
        if (owners.has(email) && role !== owners.get(email).role) throw problem(400, 'Kurucu yöneticilerin rolü panelden değiştirilemez.');
        await writeTeam(member, members => {
          const existing = members.find(item => item.email === email);
          if (existing) Object.assign(existing, { role, name: name || existing.name });
          else members.push({ email, role, name, addedBy: member.name, addedAt: new Date().toISOString() });
        });
        return { members: await teamList() };
      },
    ],
    [
      'POST',
      /^team\/remove$/,
      async ({ member, body }) => {
        requireAdmin(member);
        const email = String(body.email || '').trim().toLowerCase();
        if (owners.has(email)) throw problem(400, 'Kurucu yöneticiler panelden çıkarılamaz.');
        if (email === member.email) throw problem(400, 'Kendinizi çıkaramazsınız.');
        await writeTeam(member, members => {
          const index = members.findIndex(item => item.email === email);
          if (index >= 0) members.splice(index, 1);
        });
        return { members: await teamList() };
      },
    ],
    [
      'GET',
      /^file$/,
      async ({ member, query }) => {
        const file = editableFile(query.get('path'));
        if (!file) throw problem(400, 'Bilinmeyen dosya.');
        // A picture comes as an image the panel can show, never as letters.
        const read = async (at, from) => {
          if (!file.binary) return { text: await repo.readFile(at, file.path), from };
          const data = await repo.readBase64(at, file.path);
          return { text: null, image: data ? `data:image/webp;base64,${data}` : null, from };
        };
        const ref = query.get('ref');
        if (!repo) return { text: null, from: 'preview' };
        if (ref === 'base') return read(baseBranch, 'preview');
        if (ref && ref.startsWith('basket:')) return read(`${BASKET_PREFIX}${ref.slice(7).replace(/[^a-f0-9]/g, '')}`, 'basket');
        if (ref && ref.startsWith('branch:')) {
          const branch = ref.slice(7);
          if (!branch.startsWith(NEW_BOOK_PREFIX)) throw problem(400, 'Bilinmeyen dal.');
          return read(branch, 'new-book');
        }
        if (ref && /^[a-f0-9]{7,40}$/.test(ref)) return read(ref, 'history');
        const branch = basketBranch(member);
        if (await repo.branchSha(branch)) {
          const result = await read(branch, 'basket');
          if (result.text !== null || result.image) return result;
        }
        return read(baseBranch, 'preview');
      },
    ],
    [
      'GET',
      /^basket$/,
      async ({ member }) => {
        if (!repo) return { ...(await basketState(member.id)), files: [], commits: [], number: null, checks: 'none', media: (await basketState(member.id)).media ?? [] };
        const branch = basketBranch(member);
        return basketSummary(branch, await findPull(branch), member.id);
      },
    ],
    [
      'POST',
      /^basket\/save$/,
      async ({ member, body }) => {
        requireRepo();
        requireWriter(member);
        return save(member, body);
      },
    ],
    [
      'POST',
      /^basket\/discard$/,
      async ({ member, body }) => {
        requireRepo();
        return discard(member, body.path);
      },
    ],
    [
      'POST',
      /^basket\/clear$/,
      async ({ member }) => {
        requireRepo();
        return clearBasket(member);
      },
    ],
    [
      'POST',
      /^basket\/submit$/,
      async ({ member, body }) => {
        const state = await basketState(member.id);
        await saveBasketState(member.id, { ...state, name: member.name, submitted: true, note: String(body.note || '').slice(0, 500), rejected: undefined });
        audit('basket submitted', { by: member.id });
        return { submitted: true };
      },
    ],
    ['GET', /^baskets$/, async () => (repo ? { baskets: await listBaskets() } : { baskets: [] })],
    [
      'POST',
      /^baskets\/([a-f0-9]{12}|\d+)\/publish$/,
      async ({ member, match, body }) => {
        requireRepo();
        requireAdmin(member);
        return publish(member, match[1], { force: Boolean(body.force) && demo });
      },
    ],
    [
      'POST',
      /^baskets\/([a-f0-9]{12}|\d+)\/reject$/,
      async ({ member, match, body }) => {
        requireRepo();
        requireAdmin(member);
        return reject(member, match[1], body.reason);
      },
    ],
    [
      'GET',
      /^locks$/,
      async ({ member }) => {
        if (!repo) return { locks: {} };
        const locks = {};
        for (const basket of await listBaskets()) {
          if (basket.owner === member.id) continue;
          for (const file of basket.files) (locks[file.path] ??= []).push(basket.ownerName);
        }
        return { locks };
      },
    ],
    [
      'GET',
      /^history$/,
      async ({ query }) => {
        if (!repo) return { commits: [] };
        const path = query.get('path') || undefined;
        if (path && !editableFile(path)) throw problem(400, 'Bilinmeyen dosya.');
        const commits = await repo.listCommits(baseBranch, { path, perPage: 60 });
        return { commits };
      },
    ],
    [
      'GET',
      /^history\/([a-f0-9]{7,40})$/,
      async ({ match }) => {
        requireRepo();
        const commit = await repo.getCommit(match[1]);
        if (!commit) throw problem(404, 'Bu değişiklik bulunamadı.');
        return { ...commit, files: commit.files.filter(file => editableFile(file.path)) };
      },
    ],
    [
      'POST',
      /^history\/([a-f0-9]{7,40})\/undo$/,
      async ({ member, match }) => {
        requireRepo();
        requireWriter(member);
        const commit = await repo.getCommit(match[1]);
        if (!commit || commit.parents.length === 0) throw problem(404, 'Bu değişiklik geri alınamaz.');
        const files = [];
        let conflicts = 0;
        for (const changed of commit.files) {
          const file = editableFile(changed.path);
          // Pictures are put back by hand (choose the old one again); texts are merged back.
          if (!file || file.binary || !mayPropose(member.role, file)) continue;
          const before = await repo.readFile(commit.parents[0], file.path);
          const after = await repo.readFile(commit.sha ?? match[1], file.path);
          if (before === null || after === null) continue;
          // What the person sees now: their basket if it holds the file, else the preview.
          const branch = basketBranch(member);
          const now = ((await repo.branchSha(branch)) && (await repo.readFile(branch, file.path))) || (await repo.readFile(baseBranch, file.path));
          if (now === null) continue;
          const result = revertChange(JSON.parse(before), JSON.parse(after), JSON.parse(now));
          conflicts += result.conflicts;
          files.push({ path: file.path, json: result.value });
        }
        if (files.length === 0) throw problem(400, 'Bu değişiklikte panelden geri alınabilecek bir içerik yok.');
        const title = commit.message.split('\n')[0].replace(/^Panel: /, '');
        return { ...(await save(member, { files, message: `Geri alındı: ${title}` })), conflicts };
      },
    ],
    [
      'POST',
      /^media\/upload$/,
      async ({ member, body }) => {
        requireWriter(member);
        if (!storage) throw problem(503, 'Dosya yükleme şu an kapalı: depolama bağlı değil.');
        const target = String(body.target || '');
        if (!validMediaTarget(target)) throw problem(400, 'Bu dosya için geçerli bir yer bulunamadı.');
        const contentType = String(body.contentType || '');
        if (!/^(image\/(png|jpeg|webp)|audio\/(mpeg|mp3|mp4|x-m4a))$/.test(contentType)) throw problem(400, 'Sadece PNG, JPG, WebP resim veya MP3/M4A ses yüklenebilir.');
        const data = Buffer.from(String(body.data || ''), 'base64');
        if (data.length === 0) throw problem(400, 'Dosya boş.');
        const safe = String(body.name || 'dosya').normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-80);
        const staged = `${UPLOAD_PREFIX}${member.id}/${Date.now()}-${safe}`;
        const uploaded = await storage.upload(staged, data, contentType);
        const state = await basketState(member.id);
        const media = (state.media ?? []).filter(item => item.target !== target);
        const replaced = (state.media ?? []).find(item => item.target === target);
        if (replaced) await storage.remove(replaced.staged).catch(() => undefined);
        media.push({ staged, target, url: uploaded.url, label: String(body.label || '').slice(0, 120), kind: contentType.startsWith('image') ? 'image' : 'audio', edition: String(body.edition || ''), chapter: Number(body.chapter) || null, by: member.name, at: new Date().toISOString() });
        await saveBasketState(member.id, { ...state, name: member.name, media, submitted: false });
        audit('media staged', { by: member.id, target });
        return { media };
      },
    ],
    [
      'POST',
      /^media\/remove$/,
      async ({ member, body }) => {
        const state = await basketState(member.id);
        const media = (state.media ?? []).filter(item => item.staged !== body.staged);
        const removed = (state.media ?? []).find(item => item.staged === body.staged);
        if (removed) await storage?.remove(removed.staged).catch(() => undefined);
        await saveBasketState(member.id, { ...state, media });
        return { media };
      },
    ],
    [
      'POST',
      /^new-book$/,
      async ({ member, body }) => {
        requireRepo();
        requireWriter(member);
        const story = String(body.storyId || '').replace(/[^a-zA-Z]/g, '');
        const level = String(body.level || '').toLowerCase();
        if (!story || !['a2', 'b1', 'b2'].includes(level)) throw problem(400, 'Kitabın adını ve seviyesini seçin.');
        // The panel reads the Word file in the browser and sends its text: chapters as headings,
        // bold words kept. No Word file goes into the public repository (its hidden author notes
        // and comments stay on the person's computer).
        const text = String(body.text || '').trim();
        if (text.length < 200) throw problem(400, 'Word dosyasından metin okunamadı.');
        if (text.length > 400_000) throw problem(413, 'Metin çok uzun.');
        const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..*/, '').replace('T', '-');
        const branch = `${NEW_BOOK_PREFIX}${story}-${level}-${stamp}`;
        const folder = `story-intake/panel/${story}-${level}`;
        const request = [
          `# Yeni kitap isteği: ${String(body.title || story).slice(0, 120)} ${level.toUpperCase()}`,
          '',
          `- Kitap kimliği: ${story}`,
          `- Seviye: ${level.toUpperCase()}`,
          `- Yeni kitap mı: ${body.isNew ? 'evet' : 'hayır, var olan kitaba seviye ekleniyor'}`,
          body.isNew ? `- Adı: ${String(body.nameEn || '').slice(0, 120)} / ${String(body.nameAr || '').slice(0, 120)}` : null,
          body.isNew ? `- Koleksiyon: ${String(body.collection || '').slice(0, 40)}` : null,
          `- Yükleyen: ${member.name}`,
          `- Yazan: ${body.mode === 'manual' ? 'elle' : 'Claude'}`,
          ...writerChoice(body),
          '',
          '## Notlar',
          '',
          String(body.brief || '').slice(0, 20_000) || '(not yok)',
          '',
        ]
          .filter(line => line !== null)
          .join('\n');
        await repo.createBranch(branch, await repo.branchSha(baseBranch));
        await repo.commitFiles(
          branch,
          [
            { path: `${folder}/hikaye.md`, text: `${text}\n` },
            { path: `${folder}/istek.md`, text: request },
          ],
          `Panel: yeni kitap metni (${story} ${level.toUpperCase()})\n\n${member.name} panelde yükledi.`,
        );
        const meta = { owner: member.id, name: member.name, kind: 'new-book', story, level };
        const pull = await repo.createPull({
          title: `Panel: Yeni kitap taslağı: ${String(body.title || story).slice(0, 80)} ${level.toUpperCase()}`,
          head: branch,
          base: baseBranch,
          body: `Yeni kitap: ${member.name} panelden Word dosyasını yükledi. Claude alıştırmaları ve kitabın geri kalanını bu dala yazar; kitap gizli kalır. Panelde bakılır, düzeltilir ve yayınlanır.\n\n<!-- panel-meta ${JSON.stringify(meta)} -->`,
        });
        // The push of hikaye.md and istek.md starts .github/workflows/yeni-kitap.yml on this branch
        // (unless the request says the book is written by hand).
        audit('new book started', { by: member.id, branch, pull: pull.number });
        return { branch, number: pull.number };
      },
    ],
    [
      'GET',
      /^new-book$/,
      async () => {
        if (!repo) return { runs: [] };
        return { runs: await repo.listWorkflowRuns(NEW_BOOK_WORKFLOW).catch(() => []) };
      },
    ],
    [
      'POST',
      /^new-book\/(\d+)\/ask$/,
      async ({ member, match, body }) => {
        requireRepo();
        requireWriter(member);
        const pull = await repo.getPull(Number(match[1]));
        if (!pull || pull.state !== 'open' || !pull.branch.startsWith(NEW_BOOK_PREFIX)) throw problem(404, 'Bu yeni kitap taslağı artık açık değil.');
        const text = String(body.text || '').trim().slice(0, 4000);
        if (!text) throw problem(400, 'Ne değişsin, yazın.');
        // A new request file on the branch starts the writer again; it reads only the new file.
        const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..*/, '').replace('T', '-');
        const folder = (await repo.compare(baseBranch, pull.branch)).files.map(file => file.path).find(path => /^story-intake\/panel\/[^/]+\/hikaye\.md$/.test(path))?.replace(/\/hikaye\.md$/, '');
        if (!folder) throw problem(409, 'Bu taslağın Word metni bulunamadı.');
        await repo.commitFiles(pull.branch, [{ path: `${folder}/istekler/${stamp}.md`, text: `# ${member.name} istedi\n\n${writerChoice(body).join('\n')}\n\n${text}\n` }], `Panel: yeni kitap için istek\n\n${member.name} panelden istedi.`);
        audit('new book request', { by: member.id, pull: pull.number });
        return { asked: true };
      },
    ],
    [
      'GET',
      /^release$/,
      async () => {
        if (!repo || !releaseBranch) return { enabled: false };
        const live = await repo.branchSha(releaseBranch);
        const comparison = live ? await repo.compare(releaseBranch, baseBranch) : null;
        return { enabled: true, branch: releaseBranch, exists: Boolean(live), waiting: comparison?.commits ?? [], aheadBy: comparison?.aheadBy ?? null };
      },
    ],
    [
      'POST',
      /^release$/,
      async ({ member }) => {
        requireRepo();
        requireAdmin(member);
        if (!releaseBranch) throw problem(400, 'Canlı site henüz kurulmadı.');
        const head = await repo.branchSha(baseBranch);
        const checks = await repo.checkState(head);
        if (checks !== 'passed') throw problem(409, 'Önizlemenin son hâlinde testler henüz geçmedi; canlıya alınamaz.');
        await repo.moveBranch(releaseBranch, head);
        audit('released', { by: member.id, sha: head });
        return { released: head };
      },
    ],
  ];

  /** Handles /panel-api/*. Returns true when the request was answered. */
  const handle = async (req, res, urlPath) => {
    if (!urlPath.startsWith('/panel-api/')) return false;
    if (!enabled) {
      sendJson(res, 404, { error: 'not found' });
      return true;
    }
    const route = urlPath.slice('/panel-api/'.length);
    const query = new URL(req.url || urlPath, 'http://local').searchParams;

    if (route === 'config' && req.method === 'GET') {
      sendJson(res, 200, {
        roles: Object.fromEntries(Object.entries(ROLES).map(([key, role]) => [key, role.label])),
        proposals: Boolean(repo),
        storage: Boolean(storage),
        demo,
        demoPeople: demo ? [...owners.entries()].map(([email, owner]) => ({ email, role: owner.role })) : undefined,
        baseBranch,
        release: Boolean(releaseBranch),
        bucket,
      });
      return true;
    }

    try {
      const member = await memberFor(req);
      if (!member) {
        sendJson(res, 401, { error: 'Ekip listesindeki bir Google hesabıyla giriş yapın.' });
        return true;
      }
      for (const [method, pattern, run] of routes) {
        const match = pattern.exec(route);
        if (!match || method !== req.method) continue;
        const body = method === 'POST' ? await readJsonBody(req, route === 'media/upload' || route === 'new-book' ? UPLOAD_LIMIT : BODY_LIMIT) : {};
        sendJson(res, 200, await run({ member, body, match, query }));
        return true;
      }
      sendJson(res, 404, { error: 'not found' });
    } catch (error) {
      if (error.plain) {
        sendJson(res, error.status, { error: error.message });
        return true;
      }
      console.error('[Panel]', error.message);
      const status = error.status === 413 ? 413 : error.status === 400 ? 400 : error.status === 404 ? 404 : error.status === 409 || error.status === 422 ? 409 : 502;
      sendJson(res, status, {
        error:
          status === 413
            ? 'Dosya çok büyük.'
            : status === 409
              ? 'GitHub bu işlemi şu an yapamadı (başka bir değişiklikle çakışıyor olabilir). Biraz sonra tekrar deneyin.'
              : 'İşlem tamamlanamadı. Biraz sonra tekrar deneyin.',
      });
    }
    return true;
  };

  return { enabled, handle, memberFor, demo, feedback };
};
