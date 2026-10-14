import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { enterLibrary, isPhone, trackErrors } from './helpers';

type Item = { answer: number };
const a2 = JSON.parse(readFileSync(new URL('../src/content/exams/a2.json', import.meta.url), 'utf8')) as {
  reading: { texts: { items: Item[] }[] };
  language: { items: Item[] };
};
const key: Item[] = [...a2.reading.texts.flatMap(text => text.items), ...a2.language.items];

test.describe('end-of-level tests', () => {
  test('a student takes the A2 test and the teacher scores its code', async ({ page }) => {
    test.setTimeout(90_000);
    const errors = trackErrors(page);
    await enterLibrary(page, { role: 'teacher' });
    await page.goto('/#/test/a2');
    const dialog = page.locator('[data-level-exam]');
    await expect(dialog.getByRole('heading', { name: 'End-of-Level Test A2' })).toBeVisible();
    // One wrong answer in Reading (item 1) so the score is not perfect.
    const choices = key.map((item, i) => (i === 0 ? (item.answer + 1) % 3 : item.answer));
    for (let step = 0; step < 4; step += 1) {
      // Step 0 is the introduction; the next three are Reading 1, Reading 2 and Language.
      if (step > 0) await expect(dialog.locator('[data-exam-item]').first()).toBeVisible();
      await dialog.evaluate((el, picks) => {
        el.querySelectorAll<HTMLElement>('[data-exam-item]').forEach(item => {
          item.querySelectorAll('label')[picks[Number(item.dataset.examItem) - 1]].click();
        });
      }, choices);
      await dialog.locator('[data-exam-next]').click();
    }
    await dialog.locator('[data-exam-finish]').click();
    await expect(dialog.locator('[data-exam-result]')).toContainText('11 / 12');
    const code = (await dialog.locator('[data-exam-code]').innerText()).trim();
    expect(code).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}-[0-9A-Z]{5}$/);
    await dialog.getByRole('button', { name: 'Close' }).click();

    if (isPhone(page)) {
      await page.getByRole('button', { name: 'Settings' }).last().click();
      await page.getByRole('button', { name: /Score a test/ }).click();
    } else {
      await page.locator('[data-score-exam-open]').click();
    }
    const score = page.locator('[data-score-exam]');
    await score.locator('[data-score-exam-input]').fill(code);
    await score.getByRole('button', { name: 'Check' }).click();
    await expect(score.locator('[data-score-exam-result]')).toContainText('27 / 28');
    const bands = score.locator('button[aria-pressed]');
    for (let i = 4; i < (await bands.count()); i += 6) await bands.nth(i).click();
    await expect(score.locator('[data-score-exam-decision]')).toContainText('Level reached');
    await expect(score.locator('[data-score-exam-decision]')).toContainText(`${code},A2,1,11,16,4,4,4,4,4,4,4,4,`);
    expect(errors).toEqual([]);
  });

  test('a wrong code is refused', async ({ page }) => {
    await enterLibrary(page, { role: 'teacher' });
    await page.goto('/#/');
    test.skip(isPhone(page), 'The desktop card opens the scoring screen.');
    await page.locator('[data-score-exam-open]').click();
    await page.locator('[data-score-exam-input]').fill('AAAA-AAAA-AAAAA');
    await page.locator('[data-score-exam]').getByRole('button', { name: 'Check' }).click();
    await expect(page.locator('[data-score-exam]').getByRole('alert')).toBeVisible();
  });
});
