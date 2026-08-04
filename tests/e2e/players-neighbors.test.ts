import { expect, test } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173';
const MOCK_API_URL = process.env.E2E_MOCK_API_URL ?? 'http://localhost:5800';
const PLAYERS_URL = `${BASE_URL}/?view=players`;

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
	const defaultHtml = await defaultResponse.text();
	expect(defaultHtml).toMatch(/<td>1<\/td>\s*<td>MockPlayer1<\/td>/);

	const brokenResponse = await request.get(
		`${MOCK_API_URL}/api/player_list?db=invasion&sort=garbage`
	);
	const brokenHtml = await brokenResponse.text();
	expect(brokenHtml).not.toContain('MockPlayer');
});
