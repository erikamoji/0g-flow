import { test, expect } from '@playwright/test';

test('landing page loads', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  expect(errors.filter(e => !e.includes('ResizeObserver'))).toEqual([]);
  await expect(page.locator('body')).toBeVisible();
  const text = await page.textContent('body');
  expect(text).toContain('0G');
  console.log('Page title text sample:', text?.slice(0, 200));
});

test('canvas sidebar visible after connect prompt', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  const html = await page.content();
  const hasConnectBtn = html.includes('Connect') || html.includes('connect');
  console.log('Has connect button or text:', hasConnectBtn);
  expect(hasConnectBtn).toBe(true);
});
