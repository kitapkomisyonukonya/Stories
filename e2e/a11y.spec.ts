import AxeBuilder from '@axe-core/playwright';
import { test, expect, type Page } from '@playwright/test';
import { enterLibrary, openPage } from './helpers';

// WCAG 2.1 A/AA is the goal stated in the accessibility statement.
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function scan(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return results.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, help: v.help }));
}

const screens: [string, string][] = [
  ['home', ''],
  ['chapter', 'mecca/a2/1'],
  ['chapter with poems', 'yunusEmre/b1/13'],
  ['journey map', 'mecca/a2/14'],
  ['knowledge check', 'mecca/a2/15'],
  ['master glossary', 'mecca/a2/16'],
  ['places and people', 'mecca/a2/17'],
  ['vocabulary challenge', 'mecca/a2/18'],
  ['language review', 'mecca/a2/19'],
  ['final challenge', 'mecca/a2/20'],
];

for (const [name, route] of screens) {
  test(`${name} has no serious accessibility problems`, async ({ page }) => {
    await enterLibrary(page);
    if (route) {
      await openPage(page, route);
    } else {
      await page.goto('/');
      await expect(page.locator('main').first()).toBeVisible();
    }
    const violations = (await scan(page)).filter(v => v.impact === 'critical' || v.impact === 'serious');
    expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
  });
}

test('an Arabic chapter has no serious accessibility problems', async ({ page }) => {
  await enterLibrary(page, { language: 'ar' });
  await openPage(page, 'mecca/a2/1');
  const violations = (await scan(page)).filter(v => v.impact === 'critical' || v.impact === 'serious');
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
});

test('the access code and role screens have no serious accessibility problems', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  let violations = (await scan(page)).filter(v => v.impact === 'critical' || v.impact === 'serious');
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);

  await page.evaluate(() => localStorage.setItem('app_access_code', 'stories_enar'));
  await page.reload();
  await expect(page.getByRole('heading', { name: 'How will you use the library?' })).toBeVisible();
  // The role cards fade in one after another; measure contrast once they have finished, not half-faded.
  await page.waitForFunction(() => {
    const options = [...document.querySelectorAll('[data-role-option]')];
    return (
      options.length > 0 &&
      options.every(option => {
        for (let node: Element | null = option; node; node = node.parentElement) {
          if (Number(getComputedStyle(node).opacity) < 0.99) return false;
        }
        return true;
      })
    );
  });
  violations = (await scan(page)).filter(v => v.impact === 'critical' || v.impact === 'serious');
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
});

test.describe('keyboard', () => {
  const focusInside = (page: Page) => page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')));

  test('the first Tab offers "Skip to content", which moves focus to the page', async ({ page }) => {
    await enterLibrary(page);
    await openPage(page, 'mecca/a2/1');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('main#main')).toBeFocused();
    expect(new URL(page.url()).hash).toBe('#/mecca/a2/1');
  });

  for (const [name, opener] of [
    ['the menu', (page: Page) => page.getByRole('button', { name: 'Menu', exact: true })],
    ['Story settings', (page: Page) => page.locator('[data-reader-settings-button]')],
    ['a Word Note', (page: Page) => page.locator('[data-vocab-word]').locator('visible=true').first()],
  ] as const) {
    test(`${name} takes focus, closes on Escape and gives focus back`, async ({ page }) => {
      await enterLibrary(page);
      await openPage(page, 'mecca/a2/1');
      const button = opener(page);
      await button.focus();
      await page.keyboard.press('Enter');
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect.poll(() => focusInside(page)).toBe(true);
      await page.keyboard.press('Escape');
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(button).toBeFocused();
    });
  }

  test('Tab stays inside the open menu', async ({ page }) => {
    await enterLibrary(page);
    await openPage(page, 'mecca/a2/1');
    await page.getByRole('button', { name: 'Menu', exact: true }).focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => focusInside(page)).toBe(true);
    for (let i = 0; i < 25; i += 1) {
      await page.keyboard.press('Tab');
      expect(await focusInside(page)).toBe(true);
    }
  });
});
