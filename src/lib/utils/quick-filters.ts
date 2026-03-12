import type { IDisplayServerItem } from '$lib/models/server.model';

// Regex patterns for filtering
const CASTLING_REGEX =
	/^\[Castling](?:\[Global])?\[(?:[\w!\\?]+(?:-\d)?\s(?:LV\d|FOV)|FOV-\d|[\w!\\?]+-\d)]/;
const HELDDIVERS_REGEX = /^\[地狱潜兵]/;

export const filters = [
	{
		id: 'invasion',
		labelKey: 'app.filter.officialInvasion',
		defaultLabel: 'Invasion',
		filter: (data: IDisplayServerItem) => {
			return data.realm === 'official_invasion';
		}
	},
	{
		id: 'ww2_invasion',
		labelKey: 'app.filter.officialWW2Invasion',
		defaultLabel: 'WW2 Invasion',
		filter: (data: IDisplayServerItem) => {
			return data.realm === 'official_pacific';
		}
	},
	{
		id: 'dominance',
		labelKey: 'app.filter.officialDominance',
		defaultLabel: 'Dominance',
		filter: (data: IDisplayServerItem) => {
			return data.realm === 'official_dominance';
		}
	},
	{
		id: 'castling',
		labelKey: 'app.filter.officialModCastling',
		defaultLabel: 'Castling',
		filter: (data: IDisplayServerItem) => {
			return data.mode.toLowerCase().includes('castling') && CASTLING_REGEX.test(data.name);
		}
	},
	{
		id: 'helldivers',
		labelKey: 'app.filter.officialModHellDivers',
		defaultLabel: 'HellDivers',
		filter: (data: IDisplayServerItem) => {
			return data.mode.toLowerCase().includes('hd') && HELDDIVERS_REGEX.test(data.name);
		}
	}
];
