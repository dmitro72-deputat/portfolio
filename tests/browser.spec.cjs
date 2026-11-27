const { test, expect } = require('@playwright/test');
const path = require('node:path');
const { readFile } = require('node:fs/promises');

const sitePrefix = 'https://portfolio.test/portfolio/';
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
};

async function openPage(page, lang) {
  await page.route(sitePrefix + '**', async route => {
    const relative = new URL(route.request().url()).pathname.split('/').slice(2).join('/') || 'index.html';
    const contentType = mime[path.extname(relative)];
    if (!contentType || !/^(?:assets\/)?[a-z0-9.-]+$/i.test(relative)) {
      await route.fulfill({ status: 404 });
      return;
    }
    const body = await readFile(path.join(__dirname, '..', 'docs', relative));
    await route.fulfill({ contentType, body });
  });
  await page.goto(sitePrefix + (lang === 'uk' ? 'uk.html' : ''));
}
for (const lang of ['en','uk']) {
  test('interactive tools and mobile layout: '+lang, async ({page}) => {
    await page.setViewportSize({width:390,height:844});
    await openPage(page, lang);
    await expect(page.locator('html')).toHaveAttribute('lang',lang);
    await page.locator('#run').click();
    await expect(page.locator('#result')).toContainText(lang==='uk'?'Робочі нотатки':'Field notes');
    await page.locator('[data-mode=data]').click();
    await page.locator('#format').selectOption('CSV_SEMI');
    await page.locator('#run').click();
    await expect(page.locator('#result')).toContainText('Notebook');
    await page.locator('#format').selectOption('JSON');
    await page.locator('#input').fill('{"id":9007199254740993}');
    await page.locator('#run').click();
    await expect(page.locator('#result')).toContainText('9007199254740993');
    await page.locator('[data-mode=doc]').click();
    await page.locator('#run').click();
    await expect(page.locator('#result')).toContainText('DEMO-021');
    await expect(page.locator('#download')).toBeEnabled();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

for (const lang of ['en', 'uk']) {
  test('project evidence, keyboard navigation and responsive layout: ' + lang, async ({ page }) => {
    await openPage(page, lang);
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip')).toBeFocused();
    await page.keyboard.press('Enter');
    for (const id of ['about', 'projects', 'skills', 'services', 'availability', 'contact']) {
      await expect(page.locator('#' + id)).toBeVisible();
    }
    await expect(page.locator('#projects article')).toHaveCount(3);
    const example = page.locator('#projects details');
    await example.locator('summary').click();
    await expect(example).toHaveAttribute('open', '');
    await expect(example.locator('img')).toBeVisible();
    await expect.poll(() => example.locator('img').evaluate(img => img.complete && img.naturalWidth > 0)).toBe(true);
    await expect(example).toContainText('135.00 UAH');
    for (const width of [320, 390, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    }
    const alternate = page.locator('nav a[hreflang]');
    await alternate.click();
    await expect(page.locator('html')).toHaveAttribute('lang', lang === 'en' ? 'uk' : 'en');
  });
}
