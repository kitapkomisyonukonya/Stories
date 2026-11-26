import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanLink, createPush, pushTopicBase } from '../deploy/push.mjs';

test('topic follows the site', () => {
  assert.equal(pushTopicBase({ K_SERVICE: 'stories-preview' }), 'stories-preview');
  assert.equal(pushTopicBase({ K_SERVICE: 'stories-prod' }), 'stories-live');
});

test('only in-app links are accepted', () => {
  assert.equal(cleanLink(''), '/');
  assert.equal(cleanLink('#/zerowaste/a2'), '/#/zerowaste/a2');
  assert.equal(cleanLink('https://example.com'), null);
  assert.equal(cleanLink('#/x"><script>'), null);
});

test('send posts one data message per language with a title', async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push({ url, body: JSON.parse(init.body) });
    return new Response('{}', { status: 200 });
  };
  const push = createPush({ env: { K_SERVICE: 'stories-preview' }, fetchImpl, accessToken: async () => 'tok' });
  const result = await push.send({ title: { en: 'New story', ar: '' }, text: { en: 'Read now' }, link: '#/zerowaste/a2' });
  assert.deepEqual(result.sent, ['en']);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].body.message.topic, 'stories-preview-en');
  assert.equal(calls[0].body.message.webpush.data.link, '/#/zerowaste/a2');
  await assert.rejects(push.send({ title: {} }), /başlık/);
});
