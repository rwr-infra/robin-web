import type { IDisplayServerItem } from '$lib/models/server.model';
import type { IPlayerItem } from '$lib/models/player.model';
import { playerColumns } from '$lib/config/player-columns';

/**
 * Sort configuration interface
 */
export interface SortConfig {
	key: string;
	direction: 'asc' | 'desc' | null;
}

/**
 * Sort servers by column and direction
 * Extracted from +page.svelte (lines 114-161)
 */
export function sortServers(
	serverList: IDisplayServerItem[],
	column: string | null,
	direction: 'asc' | 'desc' | null
): IDisplayServerItem[] {
	if (!column || !direction) {
		return serverList;
	}

	const numericColumns = ['bots', 'playerCount', 'port', 'currentPlayers', 'maxPlayers'];
	const isNumeric = numericColumns.includes(column);

	return [...serverList].sort((a, b) => {
		let aValue: unknown;
		let bValue: unknown;

		switch (column) {
			case 'bots':
				aValue = a.bots;
				bValue = b.bots;
				break;
			case 'playerCount':
			case 'currentPlayers':
				aValue = a.currentPlayers;
				bValue = b.currentPlayers;
				break;
			case 'maxPlayers':
				aValue = a.maxPlayers;
				bValue = b.maxPlayers;
				break;
			case 'port':
				aValue = a.port;
				bValue = b.port;
				break;
			default:
				aValue = (a as unknown as Record<string, unknown>)[column!] || '';
				bValue = (b as unknown as Record<string, unknown>)[column!] || '';
				break;
		}

		if (!isNumeric) {
			aValue = String(aValue).toLowerCase();
			bValue = String(bValue).toLowerCase();
		}

		if (direction === 'desc') {
			return (aValue as string | number) > (bValue as string | number)
				? -1
				: (aValue as string | number) < (bValue as string | number)
					? 1
					: 0;
		} else {
			return (aValue as string | number) < (bValue as string | number)
				? -1
				: (aValue as string | number) > (bValue as string | number)
					? 1
					: 0;
		}
	});
}

/**
 * Sort players by column and direction
 * Extracted from +page.svelte (lines 164-199)
 */
export function sortPlayers(
	playerList: IPlayerItem[],
	column: string | null,
	direction: 'asc' | 'desc' | null
): IPlayerItem[] {
	if (!column || !direction) {
		return playerList;
	}

	return [...playerList].sort((a, b) => {
		const columnDef = playerColumns.find((col) => col.key === column);
		let aValue: unknown;
		let bValue: unknown;

		if (columnDef) {
			const key = columnDef.key as keyof IPlayerItem;
			aValue = (a as unknown as Record<string, unknown>)[key];
			bValue = (b as unknown as Record<string, unknown>)[key];
		} else {
			aValue = '';
			bValue = '';
		}

		if (aValue == null) aValue = 0;
		if (bValue == null) bValue = 0;

		const isNumeric = typeof aValue === 'number' || typeof bValue === 'number';

		if (!isNumeric) {
			aValue = String(aValue).toLowerCase();
			bValue = String(bValue).toLowerCase();
		}

		if (direction === 'desc') {
			return (aValue as string | number) > (bValue as string | number)
				? -1
				: (aValue as string | number) < (bValue as string | number)
					? 1
					: 0;
		} else {
			return (aValue as string | number) < (bValue as string | number)
				? -1
				: (aValue as string | number) > (bValue as string | number)
					? 1
					: 0;
		}
	});
}
