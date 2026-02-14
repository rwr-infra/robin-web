import type { Nullable } from '$lib/share/types';
import type { MapData } from '$lib/services/maps';

export interface IGroupedServerItem {
	groupName: string;
	serverList: IDisplayServerItem[];
}

export interface IResServerItem {
	name: string;
	address: string;
	port: number;
	map_id: string;
	map_name: string;
	bots: number;
	country: string;
	current_players: number;
	timeStamp: number;
	timestamp?: number;
	version: string;
	dedicated: number;
	mod: number;
	// [AAA, BBB] | AAA
	player?: string[] | string;
	comment: string;
	url: string;
	max_players: number;
	mode: string;
	realm: string;
}

export interface IRes {
	result: {
		server: IResServerItem[];
		server_list?: {
			server: IResServerItem[];
		};
	};
}

export interface IDisplayServerItem {
	id: string;
	name: string;
	ipAddress: string;
	port: number;
	mapId: string;
	mapName: Nullable<string>;
	bots: number;
	country: string;
	currentPlayers: number;
	timeStamp: Nullable<number>;
	version: string;
	dedicated: boolean;
	mod: Nullable<boolean>;
	playerList: string[];
	comment: Nullable<string>;
	url: Nullable<string>;
	maxPlayers: number;
	mode: string;
	realm: Nullable<string>;
}

export interface OnlineStats {
	allServerCount: number;
	onlineServerCount: number;
	onlinePlayerCount: number;
	playerCapacityCount: number;
}

export interface IColumn {
	key: string;
	label: string;
	i18n?: string;
	getValue?: (server: IDisplayServerItem, maps?: MapData[]) => string;
	getValueWithHighlight?: (server: IDisplayServerItem, query: string, maps?: MapData[]) => string;
	headerClass?: string;
	cellClass?: string;
	alignment?: 'left' | 'center' | 'right' | 'top';
}
