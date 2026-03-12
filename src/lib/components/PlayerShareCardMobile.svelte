<script lang="ts">
	import TranslatedText from '$lib/components/TranslatedText.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import type { IPlayerItem } from '$lib/models/player.model';
	import { User, Database } from '@lucide/svelte';

	interface Props {
		player: IPlayerItem;
		queryTimestamp?: number;
		rankings?: Record<string, number>;
		customTheme?: 'default' | 'dark' | 'light';
		showWatermark?: boolean;
		watermarkText?: string;
		customSections?: Array<{
			id: string;
			position: 'top' | 'bottom' | 'left' | 'right';
			render: (player: IPlayerItem) => string;
		}>;
		hiddenFields?: (keyof IPlayerItem | 'rankIcon')[];
	}

	let {
		player,
		queryTimestamp,
		rankings = {},
		customTheme = 'default',
		showWatermark = false,
		watermarkText = '',
		customSections = [],
		hiddenFields = []
	}: Props = $props();

	function isFieldVisible(key: keyof IPlayerItem | 'rankIcon'): boolean {
		return !hiddenFields.includes(key);
	}

	function getDisplayValue(value: unknown): string {
		if (value === null || value === undefined) return '-';
		return String(value);
	}

	function getDisplayValueWithRank(key: keyof IPlayerItem): { value: string; rank?: number } {
		const value = player[key];
		const baseValue = getDisplayValue(value);
		const rank = rankings[key];

		return {
			value: baseValue,
			rank: rank !== undefined && rank !== null ? rank : undefined
		};
	}

	function formatTimestamp(timestamp: number): string {
		const date = new Date(timestamp);
		const formatted = date.toLocaleString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});

		const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		const timeZoneName = date.toLocaleString('en-US', { timeZoneName: 'short' }).split(', ').pop();

		return `${formatted} (${timeZoneName})`;
	}

	function formatDbName(db: string): string {
		const dbMap: Record<string, string> = {
			invasion: 'Invasion',
			pacific: 'Pacific',
			prereset_invasion: 'Pre-reset Invasion'
		};
		return dbMap[db] || db;
	}

	const themeClasses = $derived(() => {
		switch (customTheme) {
			case 'dark':
				return 'bg-gray-900 text-white from-gray-800 to-gray-900';
			case 'light':
				return 'bg-gray-50 text-gray-900 from-gray-50 to-white';
			default:
				return 'from-base-100 to-base-200 text-base-content';
		}
	});

	const allStatsFields: Array<{ key: keyof IPlayerItem; i18n: string }> = [
		{ key: 'kills', i18n: 'app.player.column.kills' },
		{ key: 'deaths', i18n: 'app.player.column.deaths' },
		{ key: 'kd', i18n: 'app.player.column.kd' },
		{ key: 'score', i18n: 'app.player.column.score' },
		{ key: 'rankProgression', i18n: 'app.player.column.rankProgression' },
		{ key: 'timePlayed', i18n: 'app.player.column.timePlayed' },
		{ key: 'longestKillStreak', i18n: 'app.player.column.longestKillStreak' },
		{ key: 'targetsDestroyed', i18n: 'app.player.column.targetsDestroyed' },
		{ key: 'vehiclesDestroyed', i18n: 'app.player.column.vehiclesDestroyed' },
		{ key: 'soldiersHealed', i18n: 'app.player.column.soldiersHealed' },
		{ key: 'shotsFired', i18n: 'app.player.column.shotsFired' },
		{ key: 'throwablesThrown', i18n: 'app.player.column.throwablesThrown' },
		{ key: 'teamkills', i18n: 'app.player.column.teamkills' },
		{ key: 'distanceMoved', i18n: 'app.player.column.distanceMoved' }
	];
</script>

<div class="share-card-wrapper w-full max-w-[360px] rounded-xl p-3 shadow-2xl border border-base-content/10 {themeClasses()}">
	<!-- Header -->
	<div class="mb-2 flex items-center justify-between border-b border-base-content/15 pb-2">
		<div class="flex items-center gap-2">
			<User class="h-3 w-3 opacity-70" />
			<h2 class="text-sm font-bold">{player.username}</h2>
		</div>
		{#if isFieldVisible('db')}
			<span class="badge badge-ghost badge-sm rounded-md px-1.5 py-0.5 text-[10px] font-medium flex items-center gap-1">
				<Database class="h-3 w-3" />
				{formatDbName(player.db)}
			</span>
		{/if}
	</div>

	<!-- Stats - Single column layout for mobile -->
	<div class="flex flex-col gap-1 text-[10px]">
		{#each allStatsFields as field}
			{#if isFieldVisible(field.key as keyof IPlayerItem)}
				{@const display = getDisplayValueWithRank(field.key)}
				<div class="flex items-center justify-between">
					<span class="text-base-content/60 whitespace-nowrap">
						<TranslatedText key={field.i18n} />
					</span>
					<div class="flex items-center gap-1">
						<span class="font-semibold text-[10px]">
							{display.value}
						</span>
						{#if display.rank}
							<span class="text-primary text-[9px]">#{display.rank}</span>
						{/if}
					</div>
				</div>
			{/if}
		{/each}
	</div>

	<!-- Footer -->
	<div class="mt-2 border-t border-base-content/15 pt-1.5">
		{#if queryTimestamp}
			<div class="text-center text-[9px] text-base-content/40">
				<TranslatedText key="app.player.shareCard.queryTime" />: {formatTimestamp(queryTimestamp)}
			</div>
		{/if}
		{#if showWatermark && watermarkText}
			<div class="mt-0.5 text-center text-[9px] text-base-content/30">{watermarkText}</div>
		{/if}
	</div>

	<!-- Custom sections -->
	{#each customSections as section}
		<div class="custom-section-{section.id}">
			{@html section.render(player)}
		</div>
	{/each}
</div>

<style>
	.share-card-wrapper {
		background: linear-gradient(135deg, hsl(var(--b1)), hsl(var(--b2)));
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
			sans-serif;
	}

	.share-card-wrapper * {
		box-sizing: border-box;
	}

	/* Hide custom sections by default */
	.custom-section-top,
	.custom-section-bottom,
	.custom-section-left,
	.custom-section-right {
		display: none;
	}
</style>
