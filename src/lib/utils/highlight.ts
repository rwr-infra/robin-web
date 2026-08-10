/**
 * Default search highlight, for matches sitting directly on a table cell or
 * other neutral surface. A translucent `warning` tint plus weight — two channels,
 * not colour alone (Refactoring UI p.146) — and no text colour of its own, so it
 * inherits whatever the surrounding surface already uses. That is what keeps it
 * correct on both themes without a `dark:` override (p.198).
 */
const HIGHLIGHT_CLASS = 'bg-warning/25 rounded px-1 font-semibold';

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

	// Deliberately colour-free. A badge's own background is unknown at this point
	// — it may be a soft tint or a solid `warning`/`error` fill — so a warning
	// tint here would vanish on some of them and a fixed text colour would fight
	// the badge's `*-content` pair. Weight plus an underline read on every badge,
	// and carry no padding that would break the badge's rhythm.
	return escapedText.replace(
		regex,
		`<span class="font-bold underline decoration-2 underline-offset-2">$1</span>`
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
		const displayText = highlightInBadge(player, query);
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
