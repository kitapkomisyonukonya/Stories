import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { addHit, createStats, dayOf, emptyDay, mergeDays, STATS_PREFIX } from '../deploy/stats.mjs';
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

test('days and hours are counted in Turkish time', () => {
  assert.equal(dayOf(new Date('2026-11-26T22:30:00Z')), '2026-11-27');
  const day = emptyDay();
  addHit(day, { k: 'visit', mode: 'app', device: 'phone', os: 'ios', lang: 'ar', new: true }, new Date('2026-11-26T22:30:00Z'));
  assert.equal(day.hours[1], 1);
  assert.deepEqual([day.visits, day.newDevices, day.mode.app, day.os.ios, day.lang.ar], [1, 1, 1, 1, 1]);
});

test('unknown counters and values are not kept', () => {
  const day = emptyDay();
  assert.equal(addHit(day, { k: 'book', s: '../x', l: 'A2' }, new Date()), false);
  assert.equal(addHit(day, { k: 'feature', f: 'name' }, new Date()), false);
  assert.equal(addHit(day, { k: 'whoami', name: 'Ali' }, new Date()), false);
  addHit(day, { k: 'visit', mode: 'x', os: 'y', device: 'z', lang: 'tr' }, new Date());
  assert.deepEqual([day.mode, day.os, day.device, day.lang], [{}, {}, {}, {}]);
  assert.equal(JSON.stringify(day).includes('Ali'), false);
});

test('hits are written per server and day, and the report adds the servers up', async () => {
  const storage = createFakeStorage();
  const at = new Date('2026-11-27T09:00:00Z');
  const one = createStats({ storage, site: 'preview', server: 'aaa', now: () => at });
  const two = createStats({ storage, site: 'preview', server: 'bbb', now: () => at });
  const hits = [
    { k: 'visit', mode: 'browser', device: 'phone', os: 'android', lang: 'en', new: true },
    { k: 'install', os: 'android' },
    { k: 'book', s: 'mecca', l: 'A2', lang: 'en' },
    { k: 'page', s: 'mecca', l: 'A2', lang: 'en', p: 3 },
    { k: 'feature', f: 'pdf', s: 'mecca', l: 'A2' },
  ];
  for (const stats of [one, two]) {
    const res = response();
    await stats.handleHit(post({ hits }), res);
    assert.equal(res.status, 200);
    await stats.flush();
  }
  const paths = await storage.list(STATS_PREFIX);
  assert.deepEqual(paths.sort(), [`${STATS_PREFIX}preview/2026-11-27/aaa.json`, `${STATS_PREFIX}preview/2026-11-27/bbb.json`]);
  const report = await one.report();
  assert.equal(report.days.length, 1);
  const [day] = report.days;
  assert.deepEqual([day.visits, day.installs, day.bookOpens, day.pages, day.books['mecca|A2|en'], day.features.pdf], [2, 2, 2, 2, 2, 2]);
  assert.equal((await one.report({ site: 'live' })).days.length, 0);
});

test('a flood from one address is refused and bad bodies get 400', async () => {
  const stats = createStats({ storage: createFakeStorage(), site: 'preview', server: 'x' });
  const res = response();
  await stats.handleHit(post('not json'), res);
  assert.equal(res.status, 400);
  const empty = response();
  await stats.handleHit(post({ hits: [] }), empty);
  assert.equal(empty.status, 400);
  let last = 0;
  for (let index = 0; index < 12; index += 1) {
    const flood = response();
    await stats.handleHit(post({ hits: Array(40).fill({ k: 'launch' }) }, '10.9.9.9'), flood);
    last = flood.status;
  }
  assert.equal(last, 429);
});

test('merging keeps maps and hour arrays', () => {
  const a = emptyDay();
  const b = emptyDay();
  b.hours[5] = 2;
  b.os.ios = 3;
  b.visits = 4;
  mergeDays(a, b);
  mergeDays(a, b);
  assert.deepEqual([a.hours[5], a.os.ios, a.visits], [4, 6, 8]);
});
