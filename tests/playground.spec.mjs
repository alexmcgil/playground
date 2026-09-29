import { test, expect } from '@playwright/test';

test.beforeEach(async ({ request }) => {
  const response = await request.put('/api/cards/a', { data: { text: 'Привет из карточки А' } });
  expect(response.ok()).toBe(true);
});

test('карточка сохраняется после перезагрузки; нормальный режим защищён от гонки', async ({ page }) => {
  await page.goto('/cards');
  const editor = page.getByLabel('Текст карточки');
  await expect(editor).toBeEnabled();
  await editor.fill('Проверили весь путь запроса');
  await page.getByRole('button', { name: 'Сохранить', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Сохранено');
  await page.reload();
  await expect(editor).toHaveValue('Проверили весь путь запроса');
  await page.getByRole('button', { name: 'Карточка Б', exact: true }).click();
  await page.getByRole('button', { name: 'Карточка А', exact: true }).click();
  await page.getByRole('button', { name: 'Карточка Б', exact: true }).click();
  await page.waitForTimeout(1700);
  await expect(editor).toHaveValue('Привет из карточки Б');
});

test('учебная гонка воспроизводится; переключение режима изолирует старые ответы', async ({ page }) => {
  await page.goto('/cards');
  await page.getByLabel('Режим', { exact: true }).selectOption('race');
  await page.getByRole('button', { name: 'Карточка Б', exact: true }).click();
  await expect(page.getByLabel('Текст карточки')).toHaveValue('Привет из карточки Б');
  await page.waitForTimeout(1700);
  await expect(page.getByLabel('Текст карточки')).toHaveValue('Привет из карточки А');
  await page.getByRole('button', { name: 'Карточка А', exact: true }).click();
  await page.getByLabel('Режим', { exact: true }).selectOption('normal');
  await page.getByRole('button', { name: 'Карточка Б', exact: true }).click();
  await page.waitForTimeout(1700);
  await expect(page.getByLabel('Текст карточки')).toHaveValue('Привет из карточки Б');
});

test('сетевые эксперименты дают разные ошибки, рабочий режим восстанавливается', async ({ page }) => {
  await page.goto('/cards');
  await page.getByLabel('Режим', { exact: true }).selectOption('route');
  await expect(page.getByRole('alert')).toContainText('HTTP 404');
  await page.getByLabel('Режим', { exact: true }).selectOption('dns');
  await expect(page.getByRole('alert')).toContainText('HTTP 502', { timeout: 15_000 });
  await page.getByLabel('Режим', { exact: true }).selectOption('normal');
  await expect(page.getByLabel('Текст карточки')).toBeEnabled();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

for (const mode of ['normal', 'server', 'browser']) {
  test(`генерация ${mode}: проверка независимости API и браузера`, async ({ page, request }) => {
    await page.goto('/runtime');
    await page.getByLabel('Режим', { exact: true }).selectOption(mode);
    await page.evaluate(() => {
      window.labProbe = { last: performance.now(), maxGap: 0 };
      setInterval(() => {
        const now = performance.now();
        window.labProbe.maxGap = Math.max(window.labProbe.maxGap, now - window.labProbe.last);
        window.labProbe.last = now;
      }, 50);
    });
    const sent = page.waitForRequest((req) => req.url().includes('/api/generate'));
    await page.getByRole('button', { name: 'Сгенерировать', exact: true }).click();
    await sent;
    await new Promise((resolve) => setTimeout(resolve, 300));
    const started = performance.now();
    const health = await request.get('/api/health');
    const healthMs = performance.now() - started;
    expect(health.ok()).toBe(true);
    if (mode === 'server') expect(healthMs).toBeGreaterThan(1400);
    else expect(healthMs).toBeLessThan(1000);
    await expect(page.getByRole('status')).toContainText('Полное время', { timeout: 10_000 });
    await page.waitForTimeout(100);
    const gap = await page.evaluate(() => window.labProbe.maxGap);
    if (mode === 'browser') expect(gap).toBeGreaterThan(2000);
    else expect(gap).toBeLessThan(1000);
    await page.getByRole('button', { name: 'Кликов: 0', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Кликов: 1', exact: true })).toBeVisible();
  });
}
