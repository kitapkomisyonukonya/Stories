import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createPublicKey, verify } from 'node:crypto';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createOpenBadges } from '../deploy/openBadges.mjs';

const root = mkdtempSync(join(tmpdir(), 'ob-'));
mkdirSync(join(root, 'ob'));
writeFileSync(
  join(root, 'ob', 'achievements.json'),
  JSON.stringify({ achievements: { 'level-A2': { type: 'Certificate', name: 'Seyahatname Certificate · A2', description: 'd', criteria: 'c', level: 'A2' } } }),
);
const { privateKey } = generateKeyPairSync('ed25519');
const pem = privateKey.export({ type: 'pkcs8', format: 'pem' });
const now = () => Date.UTC(2026, 9, 15, 12);
const origin = 'https://example.test';

test('a signed Open Badges 3.0 credential verifies with the issuer key', () => {
  const badges = createOpenBadges({ root, signingKey: pem, now });
  const { credential, jwt } = badges.issue(origin, { achievement: 'level-A2', name: '  Ayşe   Yılmaz ', date: '2026-10-14' });
  assert.deepEqual(credential.type, ['VerifiableCredential', 'OpenBadgeCredential']);
  assert.equal(credential.issuer.id, `${origin}/ob/issuer`);
  assert.equal(credential.credentialSubject.achievement.id, `${origin}/ob/achievements/level-A2`);
  assert.equal(credential.credentialSubject.identifier[0].identityHash, 'Ayşe Yılmaz');
  assert.equal(credential.awardedDate, '2026-10-14T00:00:00Z');
  const [header, payload, signature] = jwt.split('.');
  const head = JSON.parse(Buffer.from(header, 'base64url'));
  assert.equal(head.alg, 'EdDSA');
  const publicKey = createPublicKey({ key: head.jwk, format: 'jwk' });
  assert.ok(verify(null, Buffer.from(`${header}.${payload}`), publicKey, Buffer.from(signature, 'base64url')));
  assert.equal(JSON.parse(Buffer.from(payload, 'base64url')).jti, credential.id);
});

test('unknown achievements, empty names and future dates are not issued as asked', () => {
  const badges = createOpenBadges({ root, signingKey: pem, now });
  assert.equal(badges.issue(origin, { achievement: 'level-C2', name: 'A' }), null);
  assert.equal(badges.issue(origin, { achievement: 'level-A2', name: '   ' }), null);
  const future = badges.issue(origin, { achievement: 'level-A2', name: 'A', date: '2030-01-01' });
  assert.equal(future.credential.awardedDate, '2026-10-15T12:00:00Z');
});

test('without a signing key nothing is signed and the issuer profile says so', () => {
  const badges = createOpenBadges({ root, signingKey: '', now });
  assert.equal(badges.signing, false);
  assert.equal(badges.issue(origin, { achievement: 'level-A2', name: 'A' }).jwt, null);
});
