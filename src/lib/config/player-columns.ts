import type { IPlayerColumn } from '$lib/models/player.model';
import type { Nullable } from '$lib/share/types';
import { escapeHtml, highlightMatch } from '$lib/utils/highlight';

function formatNumber(value: Nullable<number>): string {
	if (value === null || value === undefined) return '-';
	return value.toLocaleString();
}

function formatKd(kd: Nullable<number>): string {
	if (kd === null || kd === undefined) return '-';
	return kd.toFixed(2);
}

export const playerColumns: IPlayerColumn[] = [
	{
		key: 'rowNumber',
		label: '#',
		i18n: 'app.player.column.rowNumber',
		alignment: 'center',
		getValue: (player) => player.rowNumber.toString(),
		getValueWithHighlight: (player) => player.rowNumber.toString()
	},
	{
		key: 'username',
		label: 'Username',
		i18n: 'app.player.column.username',
		getValue: (player) => escapeHtml(player.username),
		getValueWithHighlight: (player, query) => highlightMatch(player.username, query)
	},
	{
		key: 'kills',
		label: 'Kills',
		i18n: 'app.player.column.kills',
		alignment: 'right',
		getValue: (player) => formatNumber(player.kills),
		getValueWithHighlight: (player) => formatNumber(player.kills)
	},
	{
		key: 'deaths',
		label: 'Deaths',
		i18n: 'app.player.column.deaths',
		alignment: 'right',
		getValue: (player) => formatNumber(player.deaths),
		getValueWithHighlight: (player) => formatNumber(player.deaths)
	},
	{
		key: 'score',
		label: 'K-D',
		i18n: 'app.player.column.score',
		alignment: 'right',
		getValue: (player) => formatNumber(player.score),
		getValueWithHighlight: (player) => formatNumber(player.score)
	},
	{
		key: 'kd',
		label: 'K/D',
		i18n: 'app.player.column.kd',
		alignment: 'right',
		getValue: (player) => formatKd(player.kd),
		getValueWithHighlight: (player) => formatKd(player.kd)
	},
	{
		key: 'timePlayed',
		label: 'Time',
		i18n: 'app.player.column.timePlayed',
		alignment: 'right',
		getValue: (player) => escapeHtml(player.timePlayed || '-')
	},
	{
		key: 'longestKillStreak',
		label: 'Streak',
		i18n: 'app.player.column.longestKillStreak',
		alignment: 'right',
		getValue: (player) => formatNumber(player.longestKillStreak),
		getValueWithHighlight: (player) => formatNumber(player.longestKillStreak)
	},
	{
		key: 'targetsDestroyed',
		label: 'Targets',
		i18n: 'app.player.column.targetsDestroyed',
		alignment: 'right',
		getValue: (player) => formatNumber(player.targetsDestroyed),
		getValueWithHighlight: (player) => formatNumber(player.targetsDestroyed)
	},
	{
		key: 'vehiclesDestroyed',
		label: 'Vehicles',
		i18n: 'app.player.column.vehiclesDestroyed',
		alignment: 'right',
		getValue: (player) => formatNumber(player.vehiclesDestroyed),
		getValueWithHighlight: (player) => formatNumber(player.vehiclesDestroyed)
	},
	{
		key: 'soldiersHealed',
		label: 'Heals',
		i18n: 'app.player.column.soldiersHealed',
		alignment: 'right',
		getValue: (player) => formatNumber(player.soldiersHealed),
		getValueWithHighlight: (player) => formatNumber(player.soldiersHealed)
	},
	{
		key: 'teamkills',
		label: "TK's",
		i18n: 'app.player.column.teamkills',
		alignment: 'right',
		getValue: (player) => formatNumber(player.teamkills),
		getValueWithHighlight: (player) => formatNumber(player.teamkills)
	},
	{
		key: 'distanceMoved',
		label: 'Distance',
		i18n: 'app.player.column.distanceMoved',
		alignment: 'right',
		getValue: (player) => escapeHtml(player.distanceMoved || '-')
	},
	{
		key: 'shotsFired',
		label: 'Shots',
		i18n: 'app.player.column.shotsFired',
		alignment: 'right',
		getValue: (player) => formatNumber(player.shotsFired),
		getValueWithHighlight: (player) => formatNumber(player.shotsFired)
	},
	{
		key: 'throwablesThrown',
		label: 'Throws',
		i18n: 'app.player.column.throwablesThrown',
		alignment: 'right',
		getValue: (player) => formatNumber(player.throwablesThrown),
		getValueWithHighlight: (player) => formatNumber(player.throwablesThrown)
	},
	{
		key: 'rankProgression',
		label: 'XP',
		i18n: 'app.player.column.rankProgression',
		alignment: 'right',
		getValue: (player) => formatNumber(player.rankProgression),
		getValueWithHighlight: (player) => formatNumber(player.rankProgression)
	},
	{
		key: 'rankName',
		label: 'Rank',
		i18n: 'app.player.column.rankName',
		getValue: (player) => escapeHtml(player.rankName || '-'),
		getValueWithHighlight: (player, query) => {
			if (!player.rankName) return '-';
			return query ? highlightMatch(player.rankName, query) : escapeHtml(player.rankName);
		}
	},
	{
		key: 'action',
		label: 'Action',
		i18n: 'app.column.action',
		alignment: 'center'
	}
];
