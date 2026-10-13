import { test, expect } from '@playwright/test';
import { enterLibrary, openPage, trackErrors } from './helpers';

test.describe('Arabic', () => {
  test('switching to Arabic turns the page right-to-left', async ({ page }) => {
    await enterLibrary(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'استخدام العربية' }).first().click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
  });

  test('an Arabic chapter shows Arabic text and no page errors', async ({ page }) => {
    const errors = trackErrors(page);
    await enterLibrary(page, { language: 'ar' });
    await openPage(page, 'mecca/a2/1');
    await expect(
      page
        .locator('main p')
        .filter({ hasText: /[؀-ۿ]{3,}/ })
        .first(),
    ).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('Arabic book-end pages open', async ({ page }) => {
    await enterLibrary(page, { language: 'ar' });
    for (const n of [15, 16, 18, 20]) {
      // A fresh load per page: each book-end page is its own chunk.
      await page.goto(`/#/adam/b1/${n}`);
      await page.reload();
      await expect(page.locator('main').first()).toBeVisible();
      await expect(page.locator('main').first()).toContainText(/[؀-ۿ]{3,}/, { timeout: 20_000 });
    }
  });

  test('harakat show by default and can be turned off and on again', async ({ page }) => {
    const errors = trackErrors(page);
    await enterLibrary(page, { language: 'ar' });
    await openPage(page, 'mecca/a2/1');
    const story = page.locator('main').first();
    const harakat = /[\u064B-\u0652]/;
    await expect(story).toContainText(harakat);
    // The audio player's time can change while the test runs (its file finishes loading), so it is left out.
    const text = async () => (await story.innerText()).replace(/[0-9٠-٩]+:[0-9٠-٩]{2}/g, '');
    const before = await text();

    await page.locator('[data-reader-settings-button]').click();
    await page.locator('[data-harakat-toggle]').click();
    await expect(page.locator('[data-harakat-toggle]')).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(async () => harakat.test(await story.innerText())).toBe(false);

    await page.locator('[data-harakat-toggle]').click();
    await expect.poll(text).toBe(before);
    expect(errors).toEqual([]);
  });

  test('the harakat setting is only offered in Arabic', async ({ page }) => {
    await enterLibrary(page);
    await openPage(page, 'mecca/a2/1');
    await page.locator('[data-reader-settings-button]').click();
    await expect(page.locator('[data-dyslexic-toggle]')).toBeVisible();
    await expect(page.locator('[data-harakat-toggle]')).toHaveCount(0);
  });
});
