import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { cleanEntry, createFeedback, scrubText, FEEDBACK_PREFIX } from '../deploy/feedback.mjs';
import { createFakeStorage } from '../deploy/panel/fakes.mjs';

const post = (body, ip = '10.0.0.1') => {
  const req = Readable.from([typeof body === 'string' ? body : JSON.stringify(body)]);
  req.headers = { 'x-forwarded-for': ip };
  return req;
};
const response = () => {
  const res = { status: 0, body: '' };
  res.writeHead = status => {
    res.status = status;
  };
  res.end = text => {
    res.body = text ?? '';
  };
  return res;
};
const entry = { formLang: 'tr', appLang: 'en', role: 'teacher', storyId: 'mecca', level: 'A2', ratings: { overall: 5, ease: 4 }, liked: 'Sesler güzel', problems: '', ideas: '', device: 'phone' };

test('e-mail addresses and phone numbers are blanked out of free text', () => {
  assert.equal(scrubText('Yaz: ali.veli@okul.k12.tr ya da 0532 123 45 67'), 'Yaz: […] ya da […]');
  assert.equal(scrubText('Sayfa 12, bölüm 3'), 'Sayfa 12, bölüm 3');
});

test('only known values are kept and an empty form is refused', () => {
  const clean = cleanEntry({ ...entry, role: 'admin', level: 'C9', storyId: '../x', ratings: { overall: 9, ease: 3, extra: 2 }, name: 'Ali' });
  assert.deepEqual(clean.ratings, { ease: 3 });
  assert.equal(clean.role, null);
  assert.equal(clean.level, null);
  assert.equal(clean.storyId, null);
  assert.equal('name' in clean, false);
  assert.equal(cleanEntry({ formLang: 'en', ratings: {}, liked: '  ' }), null);
});

test('a sent form is stored under panel-state/feedback and listed newest first', async () => {
  const storage = createFakeStorage();
  let clock = Date.UTC(2026, 10, 20, 18, 0);
  const feedback = createFeedback({ storage, now: () => new Date(clock) });
  const first = response();
  await feedback.handleSend(post(entry), first);
  assert.equal(first.status, 200);
  clock += 60_000;
  await feedback.handleSend(post({ ...entry, liked: 'İkinci' }), response());
  const paths = [...storage.objects.keys()];
  assert.equal(paths.length, 2);
  assert.ok(paths.every(path => path.startsWith(`${FEEDBACK_PREFIX}2026-11/`)));
  const list = await feedback.list();
  assert.equal(list[0].liked, 'İkinci');
  assert.equal(list[1].role, 'teacher');
  assert.equal(JSON.stringify(list).includes('10.0.0.1'), false);
  await feedback.remove(list[0].path);
  assert.equal((await feedback.list()).length, 1);
  await assert.rejects(feedback.remove('panel-state/team.json'));
});

test('robots and floods are turned away', async () => {
  const storage = createFakeStorage();
  const feedback = createFeedback({ storage });
  const robot = response();
  await feedback.handleSend(post({ ...entry, website: 'http://spam' }), robot);
  assert.equal(robot.status, 200);
  assert.equal(storage.objects.size, 0);
  const statuses = [];
  for (let i = 0; i < 10; i += 1) {
    const res = response();
    await feedback.handleSend(post(entry, '10.0.0.9'), res);
    statuses.push(res.status);
  }
  assert.equal(statuses.filter(status => status === 200).length, 8);
  assert.equal(statuses.at(-1), 429);
  const bad = response();
  await feedback.handleSend(post('{not json'), bad);
  assert.equal(bad.status, 400);
});
