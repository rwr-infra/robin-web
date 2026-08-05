import type { Nullable } from '$lib/share/types';

export enum PlayerDatabase {
	INVASION = 'invasion',
	PACIFIC = 'pacific',
	PRERESET_INVASION = 'prereset_invasion'
}

/**
 * Sort fields accepted by the upstream player list endpoint.
 *
 * `sid` is undocumented and has no matching table column: upstream orders rows by the
 * player's Steam ID but never returns the value, so it can only be used as an ordering.
 * An unknown value makes upstream answer with an empty table, so every sort value that
 * reaches the API must be validated against this list.
 */
export const PLAYER_SORT_FIELDS = [
	'rank_progression',
	'username',
	'kills',
	'deaths',
	'kd',
	'score',
	'time_played',
	'teamkills',
	'longest_kill_streak',
	'targets_destroyed',
	'vehicles_destroyed',
	'soldiers_healed',
	'distance_moved',
	'shots_fired',
	'throwables_thrown',
	'sid'
] as const;

export type PlayerSortField = (typeof PLAYER_SORT_FIELDS)[number];

/** Sort field behind the "similar accounts" feature. */
export const SID_SORT_FIELD: PlayerSortField = 'sid';

export function isPlayerSortField(value: unknown): value is PlayerSortField {
	return typeof value === 'string' && (PLAYER_SORT_FIELDS as readonly string[]).includes(value);
}

/**
 * Convert a table column key (camelCase) to the upstream snake_case sort field.
 * Returns undefined for keys the API does not accept (e.g. server table columns
 * arriving through a shared `sort` URL parameter).
 */
export function toPlayerSortField(columnKey: string): PlayerSortField | undefined {
	const snakeCase = columnKey.replace(/([A-Z])/g, '_$1').toLowerCase();
	return isPlayerSortField(snakeCase) ? snakeCase : undefined;
}

export interface IPlayerListParams {
	search?: string;
	db?: PlayerDatabase;
	sort?: PlayerSortField;
	start?: number;
	size?: number;
	timeout?: number;
}

export interface IPlayerItem {
	id: string;
	username: string;
	db: PlayerDatabase;
	rowNumber: number;
	rankProgression: Nullable<number>;
	kills: Nullable<number>;
	deaths: Nullable<number>;
	kd: Nullable<number>;
	score: Nullable<number>;
	timePlayed: Nullable<string>;
	teamkills: Nullable<number>;
	longestKillStreak: Nullable<number>;
	targetsDestroyed: Nullable<number>;
	vehiclesDestroyed: Nullable<number>;
	soldiersHealed: Nullable<number>;
	distanceMoved: Nullable<string>;
	shotsFired: Nullable<number>;
	throwablesThrown: Nullable<number>;
	rankName: Nullable<string>;
	rankIcon: Nullable<string>;
}

export interface IPlayerColumn {
	key: keyof IPlayerItem | string;
	label: string;
	i18n?: string;
	getValue?: (player: IPlayerItem) => string;
	getValueWithHighlight?: (player: IPlayerItem, query: string) => string;
	headerClass?: string;
	cellClass?: string;
	alignment?: 'left' | 'center' | 'right';
}

export interface IPlayerService {
	list(params?: IPlayerListParams): Promise<IPlayerItem[]>;
	listWithPagination(
		params?: IPlayerListParams
	): Promise<{ players: IPlayerItem[]; hasNext: boolean; hasPrevious: boolean }>;
}
