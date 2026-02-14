import type { IColumn, IDisplayServerItem } from '$lib/models/server.model';
import { escapeHtml, highlightMatch, renderPlayerListWithHighlight } from '$lib/utils/highlight';

// Function to get map preview HTML for desktop
function getMapPreviewHtml(server: IDisplayServerItem, query?: string): string {
	const mapId = server.mapId;
	const mapName = mapId.split('/').pop() || '';

	// Just show the map name badge - preview button is handled separately in the component
	const displayText = query ? highlightMatch(mapName, query) : escapeHtml(mapName);
	return `<span class="badge badge-outline bg-cyan-50 text-cyan-700 border-cyan-200 font-medium text-xs px-2 py-1 rounded-md shadow-sm">${displayText}</span>`;
}

// Function to get capacity status and styling
function getCapacityStyling(server: IDisplayServerItem, query?: string): string {
	const { currentPlayers, maxPlayers } = server;
	const occupancy = maxPlayers > 0 ? currentPlayers / maxPlayers : 0;
	const playerText = query
		? highlightMatch(`${currentPlayers}/${maxPlayers}`, query)
		: `${currentPlayers}/${maxPlayers}`;

	// Check for empty servers first
	if (currentPlayers === 0) {
		// Empty server - gray with dimmed effect
		return `<span class="badge bg-gray-100 text-gray-500 border-gray-200 font-medium text-xs px-2 py-1 rounded-md shadow-sm opacity-60" title="Empty server">${playerText}</span>`;
	}

	// Determine color based on occupancy
	if (occupancy >= 1.0 || currentPlayers >= maxPlayers) {
		// Full server - red
		return `<span class="badge bg-red-100 text-red-700 border-red-200 font-medium text-xs px-2 py-1 rounded-md shadow-sm" title="Full server">${playerText}</span>`;
	} else if (occupancy >= 0.8) {
		// 80% or more - orange
		return `<span class="badge bg-orange-100 text-orange-700 border-orange-200 font-medium text-xs px-2 py-1 rounded-md shadow-sm" title="${Math.round(occupancy * 100)}% full">${playerText}</span>`;
	} else if (occupancy >= 0.6) {
		// 60-79% - yellow (warning)
		return `<span class="badge bg-amber-100 text-amber-700 border-amber-200 font-medium text-xs px-2 py-1 rounded-md shadow-sm" title="${Math.round(occupancy * 100)}% full">${playerText}</span>`;
	} else {
		// Less than 60% - green (available)
		return `<span class="badge bg-green-100 text-green-700 border-green-200 font-medium text-xs px-2 py-1 rounded-md shadow-sm" title="${Math.round(occupancy * 100)}% full">${playerText}</span>`;
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
			return `<span class="badge badge-outline bg-blue-50 text-blue-700 border-blue-200 font-medium text-xs px-2 py-1 rounded-md shadow-sm" data-mode="mode">${modeText}</span>`;
		},
		getValueWithHighlight: (server: IDisplayServerItem, query: string) => {
			const modeText = server.mode || 'Unknown';
			const highlightedText = highlightMatch(modeText, query);
			return `<span class="badge badge-outline bg-blue-50 text-blue-700 border-blue-200 font-medium text-xs px-2 py-1 rounded-md shadow-sm" data-mode="mode">${highlightedText}</span>`;
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
