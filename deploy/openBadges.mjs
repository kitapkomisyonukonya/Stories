// Open Badges 3.0 (1EdTech) for the Seyahatname: a finished book or a level certificate can be
// downloaded as a signed credential that badge wallets and validators read. The app keeps no learner
// records, so the credential states what the learner's own device recorded; the server only signs it.
//
// Signing key: OB_SIGNING_KEY, an Ed25519 private key in PEM (PKCS#8). Without it the issuer
// profile says so and nothing is signed. The proof format is VC-JWT (Open Badges 3.0, section 8.2).
import { createPrivateKey, createPublicKey, randomUUID, sign } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const OB_CONTEXT = ['https://www.w3.org/2018/credentials/v1', 'https://purl.imsglobal.org/spec/ob/v3p0/context-3.0.3.json'];
const BODY_LIMIT = 2048;
const PER_HOUR = 30;

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify(body));
};

const loadKey = (pem) => {
  if (!pem) return null;
  try {
    const privateKey = createPrivateKey(pem.replace(/\\n/g, '\n'));
    if (privateKey.asymmetricKeyType !== 'ed25519') return null;
    const jwk = createPublicKey(privateKey).export({ format: 'jwk' });
    return { privateKey, jwk };
  } catch {
    return null;
  }
};

const base64url = (value) => Buffer.from(typeof value === 'string' ? value : JSON.stringify(value)).toString('base64url');

/**
 * @param {{ root: string, signingKey?: string, now?: () => number }} options
 * `root` is the built app (dist): the achievements list is dist/ob/achievements.json.
 */
export const createOpenBadges = ({ root, signingKey = process.env.OB_SIGNING_KEY || '', now = Date.now } = {}) => {
  const key = loadKey(signingKey);
  let achievements = null;
  const readAchievements = () => {
    if (achievements) return achievements;
    const file = join(root, 'ob', 'achievements.json');
    achievements = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')).achievements ?? {} : {};
    return achievements;
  };
  const hits = new Map();

  const originOf = (req) => {
    const configured = (process.env.PUBLIC_ORIGIN || '').replace(/\/+$/, '');
    if (configured) return configured;
    const host = String(req.headers['x-forwarded-host'] || req.headers.host || 'localhost');
    const proto = String(req.headers['x-forwarded-proto'] || (host.startsWith('localhost') ? 'http' : 'https')).split(',')[0];
    return `${proto}://${host}`;
  };

  const issuerProfile = (origin) => ({
    '@context': OB_CONTEXT,
    id: `${origin}/ob/issuer`,
    type: ['Profile'],
    name: 'Lisandan Kültüre',
    url: origin,
    description: 'Yabancı Dil, Kültür, Tarih ve Değerlerimiz Dijital Kütüphane Projesi',
    ...(key ? { publicKey: { ...key.jwk, kid: `${origin}/ob/issuer#key-1` } } : {}),
  });

  const achievementFor = (origin, slug) => {
    const item = readAchievements()[slug];
    if (!item) return null;
    return {
      id: `${origin}/ob/achievements/${slug}`,
      type: ['Achievement'],
      achievementType: item.type,
      name: item.name,
      description: item.description,
      criteria: { narrative: item.criteria },
      ...(item.level ? { tag: [item.level] } : {}),
    };
  };

  const limited = (req) => {
    const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
    const hour = Math.floor(now() / 3_600_000);
    const entry = hits.get(ip);
    if (!entry || entry.hour !== hour) {
      hits.set(ip, { hour, count: 1 });
      if (hits.size > 5000) hits.clear();
      return false;
    }
    entry.count += 1;
    return entry.count > PER_HOUR;
  };

  const issue = (origin, { achievement: slug, name, date }) => {
    const achievement = achievementFor(origin, slug);
    const learner = String(name ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
    if (!achievement || !learner) return null;
    const issuedAt = new Date(now());
    const earned = typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date) && new Date(date).getTime() <= issuedAt.getTime() ? `${date}T00:00:00Z` : issuedAt.toISOString().replace(/\.\d+Z$/, 'Z');
    const id = `urn:uuid:${randomUUID()}`;
    const credential = {
      '@context': OB_CONTEXT,
      id,
      type: ['VerifiableCredential', 'OpenBadgeCredential'],
      name: achievement.name,
      issuer: { id: `${origin}/ob/issuer`, type: ['Profile'], name: 'Lisandan Kültüre', url: origin },
      issuanceDate: issuedAt.toISOString().replace(/\.\d+Z$/, 'Z'),
      awardedDate: earned,
      credentialSubject: {
        type: ['AchievementSubject'],
        identifier: [{ type: 'IdentityObject', identityType: 'name', identityHash: learner, hashed: false }],
        achievement,
      },
    };
    if (!key) return { credential, jwt: null };
    const header = { alg: 'EdDSA', typ: 'JWT', kid: `${origin}/ob/issuer#key-1`, jwk: key.jwk };
    const payload = { ...credential, iss: credential.issuer.id, jti: id, nbf: Math.floor(issuedAt.getTime() / 1000), sub: learner };
    const body = `${base64url(header)}.${base64url(payload)}`;
    const signature = sign(null, Buffer.from(body), key.privateKey).toString('base64url');
    return { credential, jwt: `${body}.${signature}` };
  };

  /** Answers /ob/* requests; returns false for any other path. */
  const handle = async (req, res, urlPath) => {
    if (!urlPath.startsWith('/ob/')) return false;
    const origin = originOf(req);
    const reply = (status, body) => {
      json(res, status, body);
      return true;
    };
    if (urlPath === '/ob/issuer' && (req.method === 'GET' || req.method === 'HEAD')) {
      json(res, 200, { ...issuerProfile(origin), signing: Boolean(key) });
      return true;
    }
    const match = urlPath.match(/^\/ob\/achievements\/([A-Za-z0-9-]+)$/);
    if (match && req.method === 'GET') {
      const achievement = achievementFor(origin, match[1]);
      if (achievement) json(res, 200, { '@context': OB_CONTEXT, ...achievement });
      else json(res, 404, { error: 'not found' });
      return true;
    }
    if (urlPath === '/ob/issue' && req.method === 'POST') {
      if (!key) return reply(503, { error: 'signing is not set up' });
      if (limited(req)) return reply(429, { error: 'too many requests' });
      let raw = '';
      let tooBig = false;
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > BODY_LIMIT) { tooBig = true; break; }
      }
      if (tooBig) return reply(413, { error: 'too large' });
      let body;
      try { body = JSON.parse(raw); } catch { return reply(400, { error: 'bad request' }); }
      const result = issue(origin, body ?? {});
      if (!result) return reply(400, { error: 'unknown achievement or empty name' });
      json(res, 200, result);
      return true;
    }
    // Anything else under /ob/ (the achievements list) is a static file of the app.
    return false;
  };

  return { handle, issue, issuerProfile, signing: Boolean(key) };
};
