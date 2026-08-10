import type { IColumn, IDisplayServerItem } from '$lib/models/server.model';
import {
	escapeHtml,
	highlightInBadge,
	highlightMatch,
	renderPlayerListWithHighlight
} from '$lib/utils/highlight';

/**
 * Badges are emitted as raw HTML into the tables, so they can only use
 * theme-aware classes — a hardcoded `bg-cyan-50` is unreadable on the dark
 * theme. Every badge below is a daisyUI semantic badge, so it follows
 * `data-theme` automatically.
 *
 * Sizing, radius and padding come from the `badge`/`badge-sm` component and the
 * theme's `--radius-selector`; they are not repeated per call site. No shadow —
 * a badge is not a raised element.
 */
const BADGE = 'badge badge-sm font-medium';

// Function to get map preview HTML for desktop
function getMapPreviewHtml(server: IDisplayServerItem, query?: string): string {
	const mapId = server.mapId;
	const mapName = mapId.split('/').pop() || '';

	// Just show the map name badge - preview button is handled separately in the component
	// highlightInBadge, not highlightMatch: the mark lands inside a badge, whose
	// background and content colour are set by the badge classes.
	const displayText = highlightInBadge(mapName, query ?? '');
	return `<span class="${BADGE} badge-soft badge-info">${displayText}</span>`;
}

/**
 * Occupancy is carried by three redundant channels, not colour alone
 * (Refactoring UI p.146): the hue, the soft/solid contrast step (solid = the
 * two states you should act on), and the `title` text. The `x/y` figure itself
 * is the primary signal.
 */
function getCapacityStyling(server: IDisplayServerItem, query?: string): string {
	const { currentPlayers, maxPlayers } = server;
	const occupancy = maxPlayers > 0 ? currentPlayers / maxPlayers : 0;
	const playerText = highlightInBadge(`${currentPlayers}/${maxPlayers}`, query ?? '');

	// Check for empty servers first
	if (currentPlayers === 0) {
		return `<span class="${BADGE} badge-soft badge-neutral" title="Empty server">${playerText}</span>`;
	}

	const pct = Math.round(occupancy * 100);

	if (occupancy >= 1.0 || currentPlayers >= maxPlayers) {
		// Full — solid, the highest-contrast step
		return `<span class="${BADGE} badge-error" title="Full server">${playerText}</span>`;
	} else if (occupancy >= 0.8) {
		// Nearly full — solid warning
		return `<span class="${BADGE} badge-warning" title="${pct}% full">${playerText}</span>`;
	} else if (occupancy >= 0.6) {
		// Filling up — same hue, one contrast step softer
		return `<span class="${BADGE} badge-soft badge-warning" title="${pct}% full">${playerText}</span>`;
	} else {
		// Room to spare
		return `<span class="${BADGE} badge-soft badge-success" title="${pct}% full">${playerText}</span>`;
	}
}

export const columns: IColumn[] = [
	{
		key: 'name',
		label: 'Name',
		i18n: 'app.column.name',
		getValue: (server: IDisplayServerItem) => escapeHtml(server.name),
		getValueWithHighlight: (server: IDisplayServerItem, query: string) =>
			highlightMatch(server.name, query)
	},
	{
		key: 'ipAddress',
		label: 'IP Address',
		i18n: 'app.column.ip',
		getValue: (server: IDisplayServerItem) => escapeHtml(server.ipAddress),
		getValueWithHighlight: (server: IDisplayServerItem, query: string) =>
			highlightMatch(server.ipAddress, query)
	},
	{
		key: 'port',
		label: 'Port',
		i18n: 'app.column.port',
		alignment: 'center',
		getValue: (server: IDisplayServerItem) => server.port.toString(),
		getValueWithHighlight: (server: IDisplayServerItem, query: string) =>
			highlightMatch(server.port.toString(), query)
	},
	{
		key: 'bots',
		label: 'Bots',
		i18n: 'app.column.bots',
		alignment: 'center',
		getValue: (server: IDisplayServerItem) => server.bots.toString(),
		getValueWithHighlight: (server: IDisplayServerItem, query: string) =>
			highlightMatch(server.bots.toString(), query)
	},
	{
		key: 'country',
		label: 'Country',
		i18n: 'app.column.country',
		getValue: (server: IDisplayServerItem) => escapeHtml(server.country),
		getValueWithHighlight: (server: IDisplayServerItem, query: string) =>
			highlightMatch(server.country, query)
	},
	{
		key: 'mode',
		label: 'Mode',
		i18n: 'app.column.mode',
		getValue: (server: IDisplayServerItem) => {
			const modeText = escapeHtml(server.mode || 'Unknown');
			return `<span class="${BADGE} badge-soft badge-neutral" data-mode="mode">${modeText}</span>`;
		},
		getValueWithHighlight: (server: IDisplayServerItem, query: string) => {
			const modeText = server.mode || 'Unknown';
			const highlightedText = highlightInBadge(modeText, query);
			return `<span class="${BADGE} badge-soft badge-neutral" data-mode="mode">${highlightedText}</span>`;
		}
	},
	{
		key: 'mapId',
		label: 'Map',
		i18n: 'app.column.map',
		getValue: (server: IDisplayServerItem) => getMapPreviewHtml(server, undefined),
		getValueWithHighlight: (server: IDisplayServerItem, query: string) =>
			getMapPreviewHtml(server, query)
	},
	{
		key: 'playerCount',
		label: 'Players',
		i18n: 'app.column.capacity',
		alignment: 'center',
		getValue: (server: IDisplayServerItem) => getCapacityStyling(server),
		getValueWithHighlight: (server: IDisplayServerItem, query: string) =>
			getCapacityStyling(server, query)
	},
	{
		key: 'playerList',
		label: 'Player List',
		i18n: 'app.column.players',
		headerClass: 'min-w-96',
		cellClass: 'min-w-96',
		alignment: 'top',
		getValue: (server: IDisplayServerItem) => renderPlayerListWithHighlight(server.playerList),
		getValueWithHighlight: (server: IDisplayServerItem, query: string) =>
			renderPlayerListWithHighlight(server.playerList, query)
	},
	{
		key: 'comment',
		label: 'Comment',
		i18n: 'app.column.comment',
		getValue: (server: IDisplayServerItem) => escapeHtml(server.comment || '-')
	},
	{
		key: 'dedicated',
		label: 'Dedicated',
		i18n: 'app.column.dedicated',
		getValue: (server: IDisplayServerItem) => (server.dedicated ? 'Yes' : 'No')
	},
	{
		key: 'mod',
		label: 'Mod',
		i18n: 'app.column.mod',
		getValue: (server: IDisplayServerItem) => (server.mod ? 'Yes' : 'No')
	},
	{ key: 'url', label: 'URL', i18n: 'app.column.url' },
	{
		key: 'version',
		label: 'Version',
		i18n: 'app.column.version',
		getValue: (server: IDisplayServerItem) => escapeHtml(server.version || '-')
	},
	{ key: 'action', label: 'Action', i18n: 'app.column.action' }
];
