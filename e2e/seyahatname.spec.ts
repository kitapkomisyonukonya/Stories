import { test, expect, type Page } from '@playwright/test';
import { enterLibrary, isPhone, openPage, trackErrors } from './helpers';

// Seyahatname, the travel journal: chapter stamps, book seals, the map's stamped places and the certificate.

const quick = (prefix: string, n: number) => Array.from({ length: n }, (_, i) => `${prefix}-quick-${i + 1}`);

/** Saved progress: Ibn Jubayr A2 chapters 1 and 2 done, the journal has seen the book and holds chapter 1. */
async function seedJournal(page: Page, { allA2 = false, fresh = true } = {}) {
  await page.addInitScript(
    ([items]) => {
      if (window.top !== window) return;
      if (sessionStorage.getItem('e2e-journal')) return;
      sessionStorage.setItem('e2e-journal', '1');
      for (const [key, value] of Object.entries(items)) localStorage.setItem(key, value);
    },
    [
      (() => {
        const items: Record<string, string> = {};
        const progress = (done: string[]) => JSON.stringify({ readPages: [0, 1], doneExercises: done, totalPages: 21 });
        items['book_progress_ibnJubayr_A2'] = progress(quick('ibnjubayr-a2', 2));
        const stamps: Record<string, number> = { 'ibnJubayr:A2:1': 1 };
        if (!fresh) stamps['ibnJubayr:A2:2'] = 1;
        const seals: Record<string, number> = {};
        const langs: Record<string, string[]> = {};
        const seen = ['ibnJubayr:A2'];
        if (allA2) {
          for (const [storyId, chapters] of [
            ['mecca', 13],
            ['adam', 10],
            ['ibrahim', 14],
            ['musa', 16],
            ['yunusEmre', 8],
            ['ibnJubayr', 13],
          ] as const) {
            for (let n = 1; n <= chapters; n += 1) stamps[`${storyId}:A2:${n}`] = 0;
            seals[`${storyId}:A2`] = 0;
            // Every A2 book finished in English; all but Ibn Jubayr (English only) in Arabic too.
            langs[`${storyId}:A2`] = storyId === 'ibnJubayr' ? ['en'] : ['en', 'ar'];
            seen.push(`${storyId}:A2`);
          }
        }
        items['v2:seyahatname'] = JSON.stringify({ stamps, seals, langs, seen, goal: 3 });
        return items;
      })(),
    ] as const,
  );
}

const noSideScroll = async (page: Page) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
};

test('a finished chapter presses a stamp, and the card opens the journal', async ({ page }) => {
  const errors = trackErrors(page);
  await enterLibrary(page);
  await seedJournal(page);
  await openPage(page, 'ibnJubayr/a2/2');
  const moment = page.locator('[data-stamp-moment]');
  await expect(moment).toBeVisible();
  await expect(moment).toContainText('Chapter 2');
  await expect(moment.getByRole('button', { name: 'Next: Chapter 3' })).toBeVisible();
  await noSideScroll(page);
  await moment.locator('[data-open-journal]').click();
  await expect(page.locator('[data-journal="ibnJubayr:A2"]')).toBeVisible();
  await expect(page.locator('[data-journal="ibnJubayr:A2"] [data-stamp][data-earned]')).toHaveCount(2);
  await noSideScroll(page);
  expect(errors).toEqual([]);
});

test('the journal opens from the library', async ({ page }) => {
  await enterLibrary(page);
  await seedJournal(page);
  await page.goto('/');
  if (isPhone(page)) {
    await page.getByRole('navigation').getByRole('button', { name: 'Seyahatname' }).click();
  } else {
    await page.locator('[data-journal-open]').click();
  }
  await expect(page.locator('[data-seyahatname]')).toBeVisible();
  await expect(page.locator('[data-weekly-goal]')).toBeVisible();
  await expect(page.locator('[data-badge="firstStamp"][data-earned]')).toBeVisible();
  await noSideScroll(page);
});

test('the map lists which places are stamped', async ({ page }) => {
  await enterLibrary(page);
  await seedJournal(page, { fresh: false });
  await openPage(page, 'ibnJubayr/a2/14');
  const chip = page.locator('[data-map-stamps]');
  await expect(chip).toContainText('places stamped');
  await chip.click();
  const list = page.locator('[data-map-stamps-list]');
  await expect(list).toBeVisible();
  await expect(list.locator('[data-stamped]').first()).toBeVisible();
  await noSideScroll(page);
});

test('each language has its own certificate, and its code checks', async ({ page }) => {
  await enterLibrary(page);
  await seedJournal(page, { allA2: true });
  await page.goto('/');
  if (isPhone(page)) {
    await page.getByRole('navigation').getByRole('button', { name: 'Seyahatname' }).click();
  } else {
    await page.locator('[data-journal-open]').click();
  }
  const a2 = page.locator('[data-certificate="A2"]');
  await expect(a2.locator('[data-certificate-lang="en"][data-ready]')).toBeVisible();
  await expect(a2.locator('[data-certificate-lang="ar"][data-ready]')).toBeVisible();

  // The Arabic certificate: Arabic only, the five books read in Arabic.
  await a2.locator('[data-certificate-lang="ar"] button').click();
  await page.locator('#certificate-name').fill('Ayşe Nur');
  const arSheet = page.locator('[role="dialog"] [data-certificate-sheet="ar"]');
  await expect(arSheet).toBeVisible();
  await expect(arSheet).not.toContainText('Certificate');
  const arCode = (await arSheet.locator('[data-certificate-code]').textContent())?.trim() ?? '';
  await page.keyboard.press('Escape');

  // The English certificate: no Arabic on it.
  await a2.locator('[data-certificate-lang="en"] button').click();
  const enSheet = page.locator('[role="dialog"] [data-certificate-sheet="en"]');
  await expect(enSheet).toBeVisible();
  expect(await enSheet.textContent()).not.toMatch(/[\u0600-\u06FF]/);
  const code = (await enSheet.locator('[data-certificate-code]').textContent())?.trim() ?? '';
  expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  expect(arCode).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  expect(arCode).not.toBe(code);
  await noSideScroll(page);

  await page.goto(`/?belge=${code}&ad=${encodeURIComponent('Ayşe Nur')}`);
  await expect(page.locator('[data-certificate-check][data-valid]')).toBeVisible();
  await expect(page.locator('[data-certificate-check-lang="en"]')).toBeVisible();
  await page.goto(`/?belge=${arCode}&ad=${encodeURIComponent('Ayşe Nur')}`);
  await expect(page.locator('[data-certificate-check-lang="ar"]')).toBeVisible();
  await page.goto(`/?belge=${code}&ad=${encodeURIComponent('Someone Else')}`);
  await expect(page.locator('[data-certificate-check]')).toBeVisible();
  await expect(page.locator('[data-certificate-check][data-valid]')).toHaveCount(0);
});
