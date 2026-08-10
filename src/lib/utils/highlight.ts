/**
 * Default search highlight. A translucent `warning` tint over whatever surface
 * the match sits on, with the surface's own text colour kept intact — the
 * flipped-contrast pattern (Refactoring UI p.198), which reads correctly on both
 * themes without a `dark:` override. `font-semibold` is the second channel, so
 * the highlight does not depend on colour alone (p.146).
 */
const HIGHLIGHT_CLASS = 'bg-warning/25 text-base-content rounded px-1 font-semibold';

/**
 * Highlights matching text in a string with HTML markup
 * @param text The text to search within
 * @param query The search query to highlight
 * @param className Optional CSS class name to apply to the highlight
 * @returns String with HTML markup for highlighting
 */
export function highlightMatch(
	text: string,
	query: string,
	className: string = HIGHLIGHT_CLASS
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

	// Same tint as HIGHLIGHT_CLASS but with no padding — inside a badge the
	// extra horizontal space breaks the badge's own rhythm. Text colour is
	// inherited from the badge so contrast stays correct on both themes.
	return escapedText.replace(regex, `<span class="bg-warning/30 rounded font-semibold">$1</span>`);
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
		return `<span class="badge badge-sm badge-soft badge-neutral gap-0 whitespace-nowrap shrink-0">${displayText}</span>`;
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
