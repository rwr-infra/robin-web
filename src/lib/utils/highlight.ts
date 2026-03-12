/**
 * Highlights matching text in a string with HTML markup
 * @param text The text to search within
 * @param query The search query to highlight
 * @param className Optional CSS class name to apply to the highlight (default: classic yellow highlight)
 * @returns String with HTML markup for highlighting
 */
export function highlightMatch(
	text: string,
	query: string,
	className: string = 'bg-yellow-200 text-gray-900 dark:bg-yellow-500 dark:text-gray-900 rounded px-0.5'
): string {
	const escapedText = escapeHtml(text);
	if (!query || !text) return escapedText;

	// Escape special regex characters in the query
	const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const regex = new RegExp(`(${escapedQuery})`, 'gi');

	// Replace matches with marked text
	return escapedText.replace(regex, `<mark class="${className}">$1</mark>`);
}

/**
 * Highlights matching text specifically for badge content to avoid spacing issues
 * @param text The text to search within
 * @param query The search query to highlight
 * @returns String with HTML markup for highlighting using inline styles
 */
export function highlightInBadge(text: string, query: string): string {
	const escapedText = escapeHtml(text);
	if (!query || !text) return escapedText;

	// Escape special regex characters in the query
	const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
	const regex = new RegExp(`(${escapedQuery})`, 'gi');

	// Use yellow highlight that works well on neutral badge backgrounds
	return escapedText.replace(
		regex,
		`<span class="bg-yellow-300 text-gray-900 dark:bg-yellow-400 dark:text-gray-900 rounded">$1</span>`
	);
}

/**
 * Renders a player list with badges and optional highlighting
 * @param players Array of player names
 * @param query Optional search query for highlighting
 * @returns HTML string with player badges
 */
export function renderPlayerListWithHighlight(players: string[], query: string = ''): string {
	if (players.length === 0) return '-';

	const playerBadges = players.map((player) => {
		const displayText = query ? highlightInBadge(player, query) : escapeHtml(player);
		return `<span class="badge gap-0 badge-neutral text-xs whitespace-nowrap flex-shrink-0">${displayText}</span>`;
	});

	return `<div class="flex flex-wrap gap-1 items-start w-full">${playerBadges.join('')}</div>`;
}

export function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}
