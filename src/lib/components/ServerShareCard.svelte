<script lang="ts">
	import TranslatedText from '$lib/components/TranslatedText.svelte';
	import { m } from '$lib/paraglide/messages.js';
	import type { IDisplayServerItem } from '$lib/models/server.model';
	import type { MapData } from '$lib/services/maps';
	import { Server } from '@lucide/svelte';

	interface Props {
		server: IDisplayServerItem;
		maps: MapData[];
		// Timestamp for data freshness
		queryTimestamp?: number;
		// Extensibility: Allow custom styling
		customTheme?: 'default' | 'dark' | 'light';
		showWatermark?: boolean;
		watermarkText?: string;
		// Extensibility: Allow custom sections
		customSections?: Array<{
			id: string;
			position: 'top' | 'bottom' | 'left' | 'right';
			render: (server: IDisplayServerItem) => string;
		}>;
		// Extensibility: Allow hiding specific fields
		hiddenFields?: (keyof IDisplayServerItem)[];
	}

	let {
		server,
		maps,
		queryTimestamp,
		customTheme = 'default',
		showWatermark = false,
		watermarkText = '',
		customSections = [],
		hiddenFields = []
	}: Props = $props();

	// Check if a field should be visible
	function isFieldVisible(key: keyof IDisplayServerItem): boolean {
		return !hiddenFields.includes(key);
	}

	// Get display value with fallback
	function getDisplayValue(value: unknown): string {
		if (value === null || value === undefined) return '-';
		return String(value);
	}

	// Get map name from map data - extract from path like getMapPreviewHtml
	function getMapName(mapId: string): string {
		// Extract the last part of the path (actual map name)
		const mapName = mapId.split('/').pop() || mapId;
		
		// Optionally, look up in maps data for display name
		const map = maps.find(m => m.path === mapId);
		return map?.name || mapName;
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

		const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		const timeZoneName = date.toLocaleString('en-US', { timeZoneName: 'short' }).split(', ').pop();

		return `${formatted} (${timeZoneName})`;
	}

	// Format player count
	function formatPlayerCount(current: number, max: number): string {
		return `${current}/${max}`;
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

	// Server info fields - excluding IP and Port which are now in badges
	type FieldFormatter = (value: unknown) => string;

	const serverInfoFields: Array<{
		key: keyof IDisplayServerItem;
		i18n: string;
		format?: FieldFormatter;
		isMono?: boolean;
	}> = [
		{ key: 'ipAddress', i18n: 'app.column.ip', isMono: true },
		{ key: 'port', i18n: 'app.column.port', isMono: true },
		{ key: 'bots', i18n: 'app.column.bots' },
		{ key: 'country', i18n: 'app.server.column.country' },
		{ key: 'version', i18n: 'app.server.column.version' }
	];
</script>

<div
	class="share-card-wrapper w-full max-w-[600px] rounded-xl p-4 shadow-2xl {themeClasses()}"
>
	<!-- Header Section -->
	<div class="mb-3">
		<div class="mb-2">
			<div class="flex items-center gap-2 mb-2">
				<Server class="h-4 w-4 opacity-70 shrink-0" />
				<h2 class="text-lg font-bold truncate flex-1">{server.name}</h2>
			</div>
			<!-- Badges: Map, Mode, Capacity -->
			<div class="flex flex-wrap gap-2">
				<!-- Map Badge -->
				<span class="badge badge-outline bg-cyan-50 text-cyan-700 border-cyan-200 font-medium text-xs px-2 py-1 rounded-md shadow-sm">
					{server.mapId.split('/').pop() || server.mapId}
				</span>
				<!-- Mode Badge -->
				<span class="badge badge-outline bg-blue-50 text-blue-700 border-blue-200 font-medium text-xs px-2 py-1 rounded-md shadow-sm">
					{server.mode || 'Unknown'}
				</span>
				<!-- Capacity Badge -->
				<span class="badge badge-success text-white font-medium text-xs px-2 py-1 rounded-md shadow-sm">
					{formatPlayerCount(server.currentPlayers, server.maxPlayers)}
				</span>
			</div>
		</div>
		<!-- Divider -->
		<div class="border-b border-base-content/15"></div>
	</div>

	<!-- Server Info Grid -->
	<div class="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
		{#each serverInfoFields as field}
			{#if isFieldVisible(field.key)}
				<div class="flex items-center justify-between gap-1">
					<span class="text-base-content/60 text-xs whitespace-nowrap">
						<TranslatedText key={field.i18n} />
					</span>
					<span class="font-semibold text-xs text-right {field.isMono ? 'font-mono' : ''}">
						{field.format ? field.format(getDisplayValue(server[field.key])) : getDisplayValue(server[field.key])}
					</span>
				</div>
			{/if}
		{/each}
		
		<!-- URL field - conditional rendering -->
		{#if server.url && isFieldVisible('url')}
			<div class="flex items-center justify-between gap-1">
				<span class="text-base-content/60 text-xs whitespace-nowrap">
					<TranslatedText key="app.column.url" />:
				</span>
				<a
					href={server.url}
					target="_blank"
					rel="noopener noreferrer"
					class="link link-primary text-xs truncate"
					title={server.url}
				>
					{server.url.length > 30 ? server.url.substring(0, 27) + '...' : server.url}
				</a>
			</div>
		{/if}
	</div>

	<!-- Player List Section -->
	{#if server.playerList && server.playerList.length > 0 && isFieldVisible('playerList')}
		<div class="mt-3 border-t border-base-content/15 pt-2">
			<div class="text-base-content/60 mb-2 text-xs">
				<TranslatedText key="app.server.column.playerList" /> ({server.playerList.length})
			</div>
			<div class="flex flex-wrap gap-1">
				{#each server.playerList as player}
					<span class="badge badge-neutral text-xs whitespace-nowrap flex-shrink-0">{player}</span>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Comment -->
	{#if server.comment && isFieldVisible('comment')}
		<div class="mt-3 border-t border-base-content/15 pt-2">
			<div class="text-base-content/60 mb-1 text-xs">
				<TranslatedText key="app.server.column.comment" />
			</div>
			<div class="text-xs break-words whitespace-pre-wrap">{server.comment}</div>
		</div>
	{/if}

	<!-- Footer with timestamp -->
	<div class="mt-3 border-t border-base-content/15 pt-2">
		{#if queryTimestamp}
			<div class="text-center text-[10px] text-base-content/40">
				<TranslatedText key="app.server.shareCard.queryTime" />: {formatTimestamp(queryTimestamp)}
			</div>
		{/if}
		{#if showWatermark && watermarkText}
			<div class="mt-1 text-center text-[10px] text-base-content/30">{watermarkText}</div>
		{/if}
	</div>

	<!-- Extensibility: Custom sections -->
	{#each customSections as section}
		<div class="custom-section-{section.id}">
			{@html section.render(server)}
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

	.custom-section-top,
	.custom-section-bottom,
	.custom-section-left,
	.custom-section-right {
		display: none;
	}
</style>
