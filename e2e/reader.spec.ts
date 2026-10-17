import { test, expect } from '@playwright/test';
import { chapterHeading, enterLibrary, openPage, trackErrors } from './helpers';

const CH1 = 'Bilal Ibn Rabah’s Place in Islam';

test.describe('reading a chapter', () => {
  test.beforeEach(async ({ page }) => {
    await enterLibrary(page);
  });

  test('chapter 1 shows title, picture, audio and text without errors', async ({ page }) => {
    const errors = trackErrors(page);
    await openPage(page, 'mecca/a2/1');
    await expect(chapterHeading(page, CH1)).toBeVisible();
    // Where Storage cannot be reached (the cloud sandbox) the player offers to try the audio again.
    await expect(page.getByRole('button', { name: /^(Play audio|Try the audio again)$/ })).toBeVisible();
    await expect(page.getByText('Bilal ibn Rabah was one of the first seven people').filter({ visible: true })).toHaveCount(1);
    expect(errors).toEqual([]);
  });

  test('poems with a short lead-in share one card with one language switch', async ({ page }) => {
    await openPage(page, 'yunusEmre/b1/13');
    const card = page.locator('[data-poem]').filter({ visible: true });
    await expect(card).toHaveCount(1);
    await expect(card).toContainText('Yunus Emre · 3 verses');
    await expect(card).toContainText('In the following verse, he warns against');
    await card.getByRole('button', { name: 'Türkçe' }).click();
    await expect(card.locator('[lang="tr"]').filter({ hasText: 'Sabırlu devleti dâim olur' })).toBeVisible();
    await expect(card.locator('[lang="tr"]').filter({ hasText: 'Buşu kimde ise imanı gider' })).toBeVisible();
    await card.getByRole('button', { name: 'English' }).click();
    await expect(card).toContainText('Patience is the foundation of an everlasting kingdom');
  });

  test('Next reminds about the Quick Challenge once, then moves on; Back returns', async ({ page }) => {
    await openPage(page, 'mecca/a2/1');
    const next = page.getByRole('button', { name: 'Next', exact: true });
    await next.click();
    await expect(page).toHaveURL(/#\/mecca\/a2\/1$/);
    await next.click();
    await expect(page).toHaveURL(/#\/mecca\/a2\/2$/);
    await expect(chapterHeading(page, 'The Age of Ignorance')).toBeVisible();
    await page.getByRole('button', { name: 'Back', exact: true }).click();
    await expect(page).toHaveURL(/#\/mecca\/a2\/1$/);
  });

  test('a deep link opens the right chapter after reload', async ({ page }) => {
    await openPage(page, 'mecca/a2/3');
    await page.reload();
    await expect(chapterHeading(page, 'Slaves in Mecca')).toBeVisible();
  });

  test('the table of contents jumps to a chapter and to the book-end pages', async ({ page }) => {
    await openPage(page, 'mecca/a2/1');
    await page.getByRole('button', { name: 'Table of Contents' }).first().click();
    await page.getByRole('button', { name: '7 Bilal Accepts Islam' }).click();
    await expect(page).toHaveURL(/#\/mecca\/a2\/7$/);
    await page.getByRole('button', { name: 'Table of Contents' }).first().click();
    await page.getByRole('button', { name: '16 Master Glossary' }).click();
    await expect(page.getByRole('heading', { name: 'Master Glossary' })).toBeVisible();
  });

  test('a Word Note opens the meaning and can be saved to My words', async ({ page }) => {
    await openPage(page, 'mecca/a2/1');
    await page.getByRole('button', { name: 'openly', exact: true }).click();
    await expect(page.getByText('In a way that is not hidden.')).toBeVisible();
    await page.getByRole('button', { name: 'Save to My words' }).click();
    await expect.poll(() => page.evaluate(() => JSON.stringify(localStorage))).toContain('openly');
  });

  test('a Places & People word opens its card', async ({ page }) => {
    await openPage(page, 'mecca/a2/1');
    await page.getByRole('button', { name: 'Mecca: City' }).click();
    await expect(page.getByText(/dry valley/).first()).toBeVisible();
  });

  test('Before you read: a guess gets feedback', async ({ page }) => {
    await openPage(page, 'mecca/a2/1');
    await page.getByRole('radio', { name: 'A in Mecca' }).check();
    await page.getByRole('button', { name: 'Check my guess' }).click();
    await expect(page.getByText('Your guess was right!').filter({ visible: true }).first()).toBeVisible();
    await expect(page.getByRole('radio', { name: /in Abyssinia/ })).toBeDisabled();
  });

  test('reading settings change the text size and survive a reload', async ({ page }) => {
    await openPage(page, 'mecca/a2/1');
    await page.getByRole('button', { name: 'Story settings' }).click();
    const before = await page.evaluate(() => localStorage.getItem('reader_scale'));
    const bigger = page.getByRole('button', { name: /larger|bigger|increase|A\+/i }).first();
    await bigger.click();
    await expect.poll(() => page.evaluate(() => localStorage.getItem('reader_scale'))).not.toBe(before);
    const after = await page.evaluate(() => localStorage.getItem('reader_scale'));
    await page.reload();
    expect(await page.evaluate(() => localStorage.getItem('reader_scale'))).toBe(after);
  });
});
