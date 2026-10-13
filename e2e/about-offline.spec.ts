import { test, expect } from '@playwright/test';
import { chapterHeading, enterLibrary, openPage, isPhone } from './helpers';

test('About shows the film, the team and the media kit, and has no Privacy tab', async ({ page }) => {
  await enterLibrary(page);
  await page.goto('/');
  if (isPhone(page)) {
    await page
      .getByRole('button', { name: /Settings/ })
      .last()
      .click();
    await page.getByRole('button', { name: /About/ }).first().click();
  } else {
    await page.getByRole('button', { name: 'About & Sources' }).click();
  }
  const about = page.locator('[data-about-page]');
  await expect(about.locator('iframe[src*="elzWNbBBaGA"]')).toHaveCount(1);
  await expect(about.getByRole('tab', { name: 'Privacy' })).toHaveCount(0);
  await about.locator('[data-about-lang="tr"]').click();
  await expect(about.getByText('Proje Koordinatörü - Editör')).toBeVisible();
  await expect(about.getByText('Dr. İshak Doğan')).toBeVisible();
  await expect(about.locator('[data-media-kit-file="logo"]')).toHaveAttribute(
    'href',
    '/pdfs/media-kit/lisandan-kulture-logo-dosyalari.zip',
  );
  await about.getByRole('tab', { name: 'Kaynaklar' }).click();
  await expect(about.getByText('TDV İslâm Ansiklopedisi, related entries.')).toBeVisible();
});

test('a chapter that was opened once still opens offline', async ({ page, context }) => {
  await enterLibrary(page);
  await openPage(page, 'mecca/a2/1');
  await page.evaluate(() => navigator.serviceWorker.ready);
  // Reload once so the service worker controls the page and caches the shell.
  await page.reload();
  await expect(chapterHeading(page, 'Bilal Ibn Rabah’s Place in Islam')).toBeVisible();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  await context.setOffline(true);
  await page.reload();
  await expect(chapterHeading(page, 'Bilal Ibn Rabah’s Place in Islam')).toBeVisible();
  await page.getByRole('button', { name: 'Table of Contents' }).first().click();
  await page.getByRole('button', { name: '2 The Age of Ignorance' }).click();
  await expect(chapterHeading(page, 'The Age of Ignorance')).toBeVisible();
  await context.setOffline(false);
});
