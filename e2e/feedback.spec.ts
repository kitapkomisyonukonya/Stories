import { test, expect } from '@playwright/test';
import { enterLibrary, isPhone } from './helpers';

test('the feedback form opens from its link, switches language and sends', async ({ page }) => {
  const sent: Record<string, unknown>[] = [];
  await page.route('**/feedback-api/send', async route => {
    sent.push(route.request().postDataJSON());
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  await enterLibrary(page);
  await page.goto('/#/feedback');
  const form = page.locator('[data-feedback-page]');
  await expect(form.getByRole('heading', { name: 'Your feedback' })).toBeVisible();

  await form.locator('[data-feedback-send]').click();
  await expect(form.locator('[data-feedback-error]')).toContainText('at least one question');

  await form.locator('[data-feedback-lang="tr"]').click();
  await expect(form.getByRole('heading', { name: 'Görüşleriniz' })).toBeVisible();
  await form.locator('[data-feedback-role="teacher"]').click();
  await form.locator('[data-feedback-book]').selectOption('mecca');
  await form.locator('[data-feedback-level="A2"]').click();
  await form.locator('[data-feedback-question="overall"] [data-feedback-score="5"]').click();
  await form.locator('#feedback-problems').fill('Bölüm 3’te bir yazım hatası var.');
  await form.locator('[data-feedback-send]').click();
  await expect(form.locator('[data-feedback-sent]')).toContainText('Teşekkür ederiz!');

  expect(sent).toHaveLength(1);
  expect(sent[0]).toMatchObject({
    formLang: 'tr',
    role: 'teacher',
    storyId: 'mecca',
    level: 'A2',
    ratings: { overall: 5 },
    problems: 'Bölüm 3’te bir yazım hatası var.',
  });
  expect(Object.keys(sent[0]).sort()).toEqual([
    'appLang',
    'device',
    'formLang',
    'ideas',
    'level',
    'liked',
    'problems',
    'ratings',
    'role',
    'storyId',
    'website',
  ]);

  await form.locator('[data-feedback-close]').first().click();
  await expect(form).toHaveCount(0);
  expect(new URL(page.url()).hash).toBe('#/');
});

test('the library links to the feedback form in English and Arabic', async ({ page }) => {
  await enterLibrary(page, { language: 'ar' });
  await page.goto('/');
  if (isPhone(page)) {
    await page
      .getByRole('button', { name: /الْإِعْدَادَاتُ|Settings/ })
      .last()
      .click();
    await page.getByRole('button', { name: 'شَارِكْنَا رَأْيَكَ' }).click();
  } else {
    await page.locator('[data-feedback-link]').click();
  }
  const form = page.locator('[data-feedback-page]');
  await expect(form).toHaveAttribute('dir', 'rtl');
  await expect(form.getByRole('heading', { name: 'رَأْيُكَ' })).toBeVisible();
});
