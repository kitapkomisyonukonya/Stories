/**
 * New-story notices (web push through Firebase Cloud Messaging).
 *
 * A device that turns notices on hands the server its FCM token once; the server only adds that
 * token to a topic (one per site and app language) and keeps nothing itself, so there is no list
 * of people anywhere. The panel sends one message to the topic and FCM delivers it.
 * Google is reached with the Cloud Run service's own account (metadata server), no key is stored.
 */

const METADATA_TOKEN_URL = 'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token';
const IID = 'https://iid.googleapis.com/iid/v1';
const LANGS = ['en', 'ar'];
const BODY_LIMIT = 8192;
const TOKEN_PATTERN = /^[A-Za-z0-9_:-]{100,4096}$/;
const TITLE_LIMIT = 80;
const TEXT_LIMIT = 220;

export const pushTopicBase = (env = process.env) =>
  env.PUSH_TOPIC_BASE || (String(env.K_SERVICE || '').includes('prod') ? 'stories-live' : 'stories-preview');

export const readJsonBody = (req, limit = BODY_LIMIT) =>
  new Promise(resolve => {
    let body = '';
    let tooBig = false;
    req.on('data', chunk => {
      if (tooBig) return;
      body += chunk;
      if (body.length > limit) tooBig = true;
    });
    req.on('end', () => {
      if (tooBig) return resolve(null);
      try {
        resolve(JSON.parse(body || '{}'));
      } catch {
        resolve(null);
      }
    });
    req.on('error', () => resolve(null));
  });

/** A safe in-app link: only the app's own hash routes (#/…), never another site. */
export const cleanLink = link => {
  const text = String(link ?? '').trim();
  if (!text) return '/';
  const hash = text.startsWith('#') ? text : text.startsWith('/#') ? text.slice(1) : null;
  if (!hash || !/^#\/[A-Za-z0-9/_\-?=&.]*$/.test(hash) || hash.length > 200) return null;
  return `/${hash}`;
};

export const createPush = ({ env = process.env, fetchImpl = fetch, accessToken: givenToken } = {}) => {
  const projectId = env.FIREBASE_PROJECT_ID || 'gen-lang-client-0373200489';
  const base = pushTopicBase(env);
  const topic = lang => `${base}-${lang}`;
  const live = Boolean(env.K_SERVICE) || Boolean(givenToken);

  let cached = { token: null, until: 0 };
  const accessToken = givenToken ?? (async () => {
    if (cached.token && Date.now() < cached.until) return cached.token;
    const response = await fetchImpl(METADATA_TOKEN_URL, { headers: { 'Metadata-Flavor': 'Google' } });
    if (!response.ok) throw new Error(`the metadata server answered ${response.status}`);
    const data = await response.json();
    cached = { token: data.access_token, until: Date.now() + (Number(data.expires_in) - 60) * 1000 };
    return cached.token;
  });

  const iid = async (action, topicName, token) => {
    const response = await fetchImpl(`${IID}:${action}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${await accessToken()}`, access_token_auth: 'true', 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: `/topics/${topicName}`, registration_tokens: [token] }),
    });
    if (!response.ok) throw new Error(`IID ${action} answered ${response.status}: ${(await response.text()).slice(0, 200)}`);
    const data = await response.json().catch(() => ({}));
    const problem = data.results?.[0]?.error;
    if (problem && action === 'batchAdd') throw new Error(`IID ${action}: ${problem}`);
  };

  // A device asks at most a few times a minute; more than that from one address is refused.
  const recent = new Map();
  const tooMany = req => {
    const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
    const now = Date.now();
    const list = (recent.get(ip) ?? []).filter(at => now - at < 60_000);
    list.push(now);
    recent.set(ip, list);
    if (recent.size > 5000) recent.clear();
    return list.length > 10;
  };

  const reply = (res, status, payload) => {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(payload ?? {}));
  };

  const handleDevice = async (req, res, action) => {
    if (tooMany(req)) return reply(res, 429, { error: 'busy' });
    const body = await readJsonBody(req);
    const token = String(body?.token ?? '');
    const lang = LANGS.includes(body?.lang) ? body.lang : 'en';
    if (!TOKEN_PATTERN.test(token)) return reply(res, 400, { error: 'bad token' });
    if (!live) return reply(res, 200, { ok: true, demo: true });
    try {
      if (action === 'subscribe') {
        await Promise.all(LANGS.filter(other => other !== lang).map(other => iid('batchRemove', topic(other), token).catch(() => undefined)));
        await iid('batchAdd', topic(lang), token);
      } else {
        await Promise.all(LANGS.map(each => iid('batchRemove', topic(each), token).catch(() => undefined)));
      }
      reply(res, 200, { ok: true });
    } catch (error) {
      console.error('[Push]', action, 'failed:', error.message);
      reply(res, 502, { error: 'unavailable' });
    }
  };

  /** Sends one notice to every device on this site; each language gets its own text. */
  const send = async ({ title = {}, text = {}, link } = {}) => {
    const target = cleanLink(link);
    if (target === null) throw Object.assign(new Error('Bağlantı uygulamanın kendi adresi olmalı (ör. #/zerowaste/a1).'), { status: 400 });
    const messages = LANGS.map(lang => ({
      lang,
      title: String(title[lang] ?? '').trim().slice(0, TITLE_LIMIT),
      text: String(text[lang] ?? '').trim().slice(0, TEXT_LIMIT),
    })).filter(item => item.title);
    if (!messages.length) throw Object.assign(new Error('En az bir dilde başlık yazın.'), { status: 400 });
    const sent = [];
    for (const item of messages) {
      if (!live) { sent.push(item.lang); continue; }
      const response = await fetchImpl(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: {
            topic: topic(item.lang),
            webpush: {
              headers: { TTL: String(7 * 24 * 3600), Urgency: 'normal' },
              data: { title: item.title, body: item.text, link: target, lang: item.lang },
            },
          },
        }),
      });
      if (!response.ok) {
        const detail = (await response.text()).slice(0, 300);
        console.error('[Push] send failed:', response.status, detail);
        throw Object.assign(new Error(`Bildirim gönderilemedi (FCM ${response.status}). Firebase Cloud Messaging API açık mı ve servis hesabının izni var mı, bakılmalı.`), { status: 502 });
      }
      sent.push(item.lang);
    }
    return { sent, topicBase: base };
  };

  return {
    topicBase: base,
    handleSubscribe: (req, res) => handleDevice(req, res, 'subscribe'),
    handleUnsubscribe: (req, res) => handleDevice(req, res, 'unsubscribe'),
    send,
  };
};
