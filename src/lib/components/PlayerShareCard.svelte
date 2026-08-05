<script lang="ts">
	import TranslatedText from '$lib/components/TranslatedText.svelte';
	import type { IPlayerItem } from '$lib/models/player.model';
	import { User, Database } from '@lucide/svelte';

	interface Props {
		player: IPlayerItem;
		// Timestamp for data freshness
		queryTimestamp?: number;
		// Ranking data - maps field key to ranking position
		rankings?: Record<string, number>;
		// Extensibility: Allow custom styling
		customTheme?: 'default' | 'dark' | 'light';
		showWatermark?: boolean;
		watermarkText?: string;
		// Extensibility: Allow custom sections for future image editor
		customSections?: Array<{
			id: string;
			position: 'top' | 'bottom' | 'left' | 'right';
			render: (player: IPlayerItem) => string;
		}>;
		// Extensibility: Allow hiding specific fields (for future toggle feature)
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

	// Check if a field should be visible
	function isFieldVisible(key: keyof IPlayerItem | 'rankIcon'): boolean {
		return !hiddenFields.includes(key);
	}

	// Get display value with fallback
	function getDisplayValue(value: unknown): string {
		if (value === null || value === undefined) return '-';
		return String(value);
	}

	// Get display value with ranking if available
	function getDisplayValueWithRank(key: keyof IPlayerItem): { value: string; rank?: number } {
		const value = player[key];
		const baseValue = getDisplayValue(value);
		const rank = rankings[key];

		return {
			value: baseValue,
			rank: rank !== undefined && rank !== null ? rank : undefined
		};
	}

	// Format timestamp for display with timezone
	function formatTimestamp(timestamp: number): string {
		const date = new Date(timestamp);
		const formatted = date.toLocaleString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});

		// Get timezone abbreviation
		const timeZoneName = date.toLocaleString('en-US', { timeZoneName: 'short' }).split(', ').pop();

		return `${formatted} (${timeZoneName})`;
	}

	// Format database name for display
	function formatDbName(db: string): string {
		const dbMap: Record<string, string> = {
			invasion: 'Invasion',
			pacific: 'Pacific',
			prereset_invasion: 'Pre-reset Invasion'
		};
		return dbMap[db] || db;
	}

	// Theme classes
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

	// All stats fields flattened - no groups, just direct layout
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

<div class="share-card-wrapper w-full max-w-[600px] rounded-xl p-4 shadow-2xl {themeClasses()}">
	<!-- Header Section with database badge -->
	<div class="border-base-content/15 mb-3 flex items-center justify-between border-b pb-3">
		<div class="flex items-center gap-2">
			<User class="h-4 w-4 opacity-70" />
			<h2 class="text-lg font-bold">{player.username}</h2>
		</div>
		{#if isFieldVisible('db')}
			<span
				class="badge badge-ghost badge-sm flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium"
			>
				<Database class="h-3 w-3" />
				{formatDbName(player.db)}
			</span>
		{/if}
	</div>

	<!-- Stats Grid - Simple 2-column layout without responsive switching -->
	<div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
		{#each allStatsFields as field}
			{#if isFieldVisible(field.key as keyof IPlayerItem)}
				{@const display = getDisplayValueWithRank(field.key)}
				<div class="flex items-center justify-between gap-1">
					<span class="text-base-content/60 text-xs whitespace-nowrap">
						<TranslatedText key={field.i18n} />
					</span>
					<div class="flex items-center justify-end gap-1">
						<span class="text-right text-xs font-semibold">
							{display.value}
						</span>
						{#if display.rank}
							<span class="text-primary shrink-0 text-[10px]">#{display.rank}</span>
						{/if}
					</div>
				</div>
			{/if}
		{/each}
	</div>

	<!-- Footer with timestamp -->
	<div class="border-base-content/15 mt-3 border-t pt-2">
		{#if queryTimestamp}
			<div class="text-base-content/40 text-center text-[10px]">
				<TranslatedText key="app.player.shareCard.queryTime" />: {formatTimestamp(queryTimestamp)}
			</div>
		{/if}
		{#if showWatermark && watermarkText}
			<div class="text-base-content/30 mt-1 text-center text-[10px]">{watermarkText}</div>
		{/if}
	</div>

	<!-- Extensibility: Custom sections placeholder for future image editor -->
	{#each customSections as section}
		<div class="custom-section-{section.id}">
			{@html section.render(player)}
		</div>
	{/each}
</div>

<style>
	.share-card-wrapper {
		background: linear-gradient(135deg, hsl(var(--b1)), hsl(var(--b2)));
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
	}

	/* Ensure consistent rendering across browsers */
	.share-card-wrapper * {
		box-sizing: border-box;
	}

	/* Hide custom sections by default - can be enabled via props */
	.custom-section-top,
	.custom-section-bottom,
	.custom-section-left,
	.custom-section-right {
		display: none;
	}
</style>
