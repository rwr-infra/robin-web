import { expect, test } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const MOCK_API_URL = process.env.E2E_MOCK_API_URL ?? 'http://localhost:5800';
const PLAYERS_URL = `${BASE_URL}/?view=players`;

/** Largest scroll offset anywhere on the page: the app may scroll an inner container. */
function maxScrollTop(page: import('@playwright/test').Page): Promise<number> {
	return page.evaluate(() =>
		Math.max(
			document.scrollingElement?.scrollTop ?? 0,
			...Array.from(document.querySelectorAll('*')).map((element) => element.scrollTop)
		)
	);
}

test('similar accounts entry point anchors the SID window on a player', async ({ page }) => {
	await page.goto(PLAYERS_URL);

	const table = page.locator('table');
	await expect(table.getByText('MockPlayer1', { exact: true })).toBeVisible({ timeout: 10000 });

	// Enter neighbor mode from the row action
	await page
		.locator('tr', { has: page.getByText('MockPlayer1', { exact: true }) })
		.locator('[data-testid="find-neighbors"]')
		.click();

	await expect(page.locator('[data-testid="sid-mode-banner"]')).toBeVisible();
	await expect(page).toHaveURL(/sort=sid/);
	await expect(page).toHaveURL(/anchor=MockPlayer1/);

	// The anchored player is highlighted inside the window
	await expect(page.locator('tr.highlighted-row')).toContainText('MockPlayer1');

	// Page numbers are replaced by absolute window navigation
	await expect(page.locator('[data-testid="sid-window-nav"]')).toBeVisible();
});

test('window navigation moves through neighbors by absolute offset', async ({ page }) => {
	await page.goto(`${PLAYERS_URL}&sort=sid&anchor=MockPlayer1`);

	await expect(page.locator('[data-testid="sid-mode-banner"]')).toBeVisible({ timeout: 10000 });
	const firstRow = page.locator('tbody tr').first();
	const firstRowNumber = await firstRow.locator('td').first().innerText();

	await page.locator('[data-testid="sid-window-next"]').click();

	await expect(async () => {
		const shiftedRowNumber = await page
			.locator('tbody tr')
			.first()
			.locator('td')
			.first()
			.innerText();
		expect(Number(shiftedRowNumber)).toBe(Number(firstRowNumber) + 20);
	}).toPass({ timeout: 10000 });

	// Still browsing the same player's neighborhood
	await expect(page.locator('[data-testid="sid-mode-banner"]')).toBeVisible();
});

test('unknown anchor reports the fallback instead of pretending to show neighbors', async ({
	page
}) => {
	await page.goto(`${PLAYERS_URL}&sort=sid&anchor=NoSuchPlayerAtAll`);

	await expect(page.locator('[data-testid="sid-anchor-missing"]')).toBeVisible({ timeout: 10000 });
	// Neighbor mode was left, so the window navigation is gone
	await expect(page.locator('[data-testid="sid-window-nav"]')).toHaveCount(0);
});

test('desktop table scrolls the anchored row into view', async ({ page }) => {
	// Short viewport: the anchored row sits below the fold in a 20-row window
	await page.setViewportSize({ width: 1280, height: 400 });
	await page.goto(`${PLAYERS_URL}&sort=sid&anchor=MockPlayer1`);

	await expect(page.locator('[data-testid="sid-mode-banner"]')).toBeVisible({ timeout: 10000 });

	const anchoredRow = page.locator('[id="player-row-invasion:MockPlayer1"]');
	await expect(anchoredRow).toHaveClass(/highlighted-row/);
	await expect(anchoredRow).toBeInViewport();
	// It only got there by scrolling: without it the row is far below the fold
	await expect.poll(() => maxScrollTop(page)).toBeGreaterThan(0);
});

test('mobile cards highlight the anchored player and scroll it into view', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto(`${PLAYERS_URL}&sort=sid&anchor=MockPlayer1`);

	await expect(page.locator('[data-testid="sid-mode-banner"]')).toBeVisible({ timeout: 10000 });

	const anchoredCard = page.locator('[id="player-mobile-card-invasion:MockPlayer1"]');
	await expect(anchoredCard).toHaveClass(/highlighted-card/);
	await expect(page.locator('.highlighted-card')).toHaveCount(1);
	// The anchor sits below the fold in a 20-card window
	await expect(anchoredCard).toBeInViewport();
	await expect.poll(() => maxScrollTop(page)).toBeGreaterThan(0);
});

test('player list API honours the sid sort and rejects unknown sort values', async ({
	request
}) => {
	const sidResponse = await request.get(
		`${MOCK_API_URL}/api/player_list?db=invasion&sort=sid&start=0&size=20`
	);
	expect(sidResponse.ok()).toBeTruthy();
	const sidHtml = await sidResponse.text();
	// sid ordering is not the default ordering: it starts on a different player
	expect(sidHtml).toMatch(/<td>1<\/td>\s*<td>MockPlayer60<\/td>/);

	const defaultResponse = await request.get(
		`${MOCK_API_URL}/api/player_list?db=invasion&start=0&size=20`
	);
	expect(defaultResponse.ok()).toBeTruthy();
	const defaultHtml = await defaultResponse.text();
	expect(defaultHtml).toMatch(/<td>1<\/td>\s*<td>MockPlayer1<\/td>/);

	const brokenResponse = await request.get(
		`${MOCK_API_URL}/api/player_list?db=invasion&sort=garbage`
	);
	// An unrouted endpoint would also answer without "MockPlayer", so check the status first
	expect(brokenResponse.ok()).toBeTruthy();
	const brokenHtml = await brokenResponse.text();
	expect(brokenHtml).not.toContain('MockPlayer');
});
