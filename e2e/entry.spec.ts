import { test, expect } from '@playwright/test';
import { chapterHeading, enterLibrary, isPhone, trackErrors } from './helpers';

test.describe('entry and home', () => {
  test('wrong access code is refused, right code opens the role picker', async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto('/');
    const code = page.getByRole('textbox', { name: 'Access code' });
    await code.fill('wrong-code');
    await page.getByRole('button', { name: 'Open the library' }).click();
    await expect(page.getByRole('alert')).toContainText('not right');
    await code.fill('stories_enar');
    await page.getByRole('button', { name: 'Open the library' }).click();
    await expect(page.getByRole('heading', { name: 'How will you use the library?' })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('choosing a role shows the library and remembers the choice', async ({ page }) => {
    await page.addInitScript(() => {
      if (window.top === window) localStorage.setItem('app_access_code', 'stories_enar');
    });
    await page.goto('/');
    await page.getByRole('button', { name: /^Student/ }).click();
    const library = isPhone(page)
      ? page.getByRole('navigation', { name: 'Library' })
      : page.getByRole('heading', { name: 'Choose a story' });
    await expect(library).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('app_user_role'))).toBe('student');
    await page.reload();
    await expect(library).toBeVisible();
  });

  test('the library lists every published book and no hidden one', async ({ page }) => {
    await enterLibrary(page);
    await page.goto('/');
    for (const title of ['Prophet Adam', 'Prophet Abraham', 'Prophet Moses', 'Mecca Before Islam', 'Ibn Jubayr', 'Yunus Emre']) {
      await expect(page.getByRole('button', { name: new RegExp(`^(A2 )?${title}`) }).first()).toBeVisible();
    }
    await expect(page.getByText(/Gevher Nesibe/)).toHaveCount(0);
  });

  test('changing the level changes the start buttons', async ({ page }) => {
    await enterLibrary(page);
    await page.goto('/');
    if (isPhone(page)) {
      await page.getByRole('group', { name: 'Your level' }).getByRole('button', { name: /^B1/ }).click();
    } else {
      await page.getByRole('button', { name: /^Your level:/ }).click();
      await page.getByRole('listbox', { name: 'Your level' }).getByRole('option', { name: /^B1/ }).click();
    }
    const mecca = isPhone(page)
      ? page.getByRole('dialog', { name: 'Mecca Before Islam' })
      : page.locator('article', { has: page.getByRole('heading', { name: 'Mecca Before Islam' }) });
    if (isPhone(page)) await page.getByRole('button', { name: 'Mecca Before Islam' }).click();
    await expect(mecca.getByRole('button', { name: /Start reading · B1/ })).toBeVisible();
  });

  test('Start reading opens chapter 1 and the URL can be shared', async ({ page }) => {
    await enterLibrary(page);
    await page.goto('/');
    if (isPhone(page)) {
      await page.getByRole('button', { name: 'Mecca Before Islam' }).click();
      await page
        .getByRole('dialog', { name: 'Mecca Before Islam' })
        .getByRole('button', { name: /Start reading/ })
        .click();
    } else {
      await page
        .locator('article', { has: page.getByRole('heading', { name: 'Mecca Before Islam' }) })
        .getByRole('button', { name: /Start reading/ })
        .click();
    }
    await expect(page).toHaveURL(/#\/mecca\/a2\/1$/);
    await expect(chapterHeading(page, 'Bilal Ibn Rabah’s Place in Islam')).toBeVisible();
  });

  test('teachers see teacher tools, students do not', async ({ page, browser }) => {
    const teacherBook = (p: typeof page) => p.getByText(/Teacher[’']s Book/);
    const openBookTools = async (p: typeof page) => {
      await p.goto('/');
      if (isPhone(p)) await p.getByRole('button', { name: 'Mecca Before Islam' }).click();
      else {
        await p.goto('/#/mecca/a2/1');
        await expect(chapterHeading(p, 'Bilal Ibn Rabah’s Place in Islam')).toBeVisible();
        await p.getByRole('button', { name: 'Menu' }).first().click();
      }
    };
    await enterLibrary(page, { role: 'teacher' });
    await openBookTools(page);
    await expect(teacherBook(page).first()).toBeVisible();

    const student = await browser.newPage({ viewport: page.viewportSize()!, isMobile: isPhone(page), hasTouch: isPhone(page) });
    await enterLibrary(student, { role: 'student' });
    await openBookTools(student);
    await expect(student.getByRole('button', { name: /Start reading|Self-Study|Student Guide/ }).first()).toBeVisible();
    await expect(teacherBook(student)).toHaveCount(0);
    await student.close();
  });
});
