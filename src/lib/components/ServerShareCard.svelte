<script lang="ts">
	import TranslatedText from '$lib/components/TranslatedText.svelte';
	import type { IDisplayServerItem } from '$lib/models/server.model';
	import { Server } from '@lucide/svelte';

	interface Props {
		server: IDisplayServerItem;
		/**
		 * `desktop` is a 600px two-column card, `mobile` a 360px single-column one.
		 * Both share every style decision except width, padding and column count —
		 * that is the whole reason this is one component and not two.
		 */
		variant?: 'desktop' | 'mobile';
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
		variant = 'desktop',
		queryTimestamp,
		customTheme = 'default',
		showWatermark = false,
		watermarkText = '',
		customSections = [],
		hiddenFields = []
	}: Props = $props();

	const isMobile = $derived(variant === 'mobile');

	// Check if a field should be visible
	function isFieldVisible(key: keyof IDisplayServerItem): boolean {
		return !hiddenFields.includes(key);
	}

	// Get display value with fallback
	function getDisplayValue(value: unknown): string {
		if (value === null || value === undefined) return '-';
		return String(value);
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

		const timeZoneName = date.toLocaleString('en-US', { timeZoneName: 'short' }).split(', ').pop();

		return `${formatted} (${timeZoneName})`;
	}

	// Format player count
	function formatPlayerCount(current: number, max: number): string {
		return `${current}/${max}`;
	}

	// Explicit theme overrides use the same warm ramp as the rest of the app
	const themeClasses = $derived(() => {
		switch (customTheme) {
			case 'dark':
				return 'bg-sand-900 text-sand-100 from-sand-800 to-sand-900';
			case 'light':
				return 'bg-sand-100 text-sand-900 from-sand-50 to-sand-100';
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

	// Semantic badges only — this card is captured as a PNG on either theme, so a
	// hardcoded light palette would be unreadable half the time.
	const BADGE = 'badge badge-sm font-medium';
</script>

<!--
	No shadow: the capture crops to the card bounds, so an outer shadow would only
	produce a dirty edge in the exported PNG. A 1px border defines the edge
	instead — the one place a border beats elevation here.
	Type never drops below 12px (text-xs); the mobile variant buys the space back
	with a single column, not with smaller type (p.91).
-->
<div
	class="share-card-wrapper border-base-content/15 w-full rounded border {isMobile
		? 'max-w-[360px] p-3'
		: 'max-w-[600px] p-4'} {themeClasses()}"
>
	<!-- Header Section -->
	<div class="mb-3">
		<div class="mb-2">
			<div class="mb-2 flex items-center gap-2">
				<Server class="text-base-content/70 size-4 shrink-0" />
				<h2 class="flex-1 truncate font-bold {isMobile ? 'text-base' : 'text-lg'}">
					{server.name}
				</h2>
			</div>
			<!-- Badges: Map, Mode, Capacity -->
			<div class="flex flex-wrap gap-2">
				<!-- Same value the Map column shows, so table and card never disagree -->
				<span class="{BADGE} badge-soft badge-info">
					{server.mapId.split('/').pop() || server.mapId}
				</span>
				<span class="{BADGE} badge-soft badge-neutral">
					{server.mode || 'Unknown'}
				</span>
				<span class="{BADGE} badge-soft badge-success">
					{formatPlayerCount(server.currentPlayers, server.maxPlayers)}
				</span>
			</div>
		</div>
		<!-- Divider -->
		<div class="border-base-content/15 border-b"></div>
	</div>

	<!-- Server Info: two columns on desktop, one on mobile -->
	<div class="text-xs {isMobile ? 'space-y-1' : 'grid grid-cols-2 gap-x-4 gap-y-1'}">
		{#each serverInfoFields as field}
			{#if isFieldVisible(field.key)}
				<div class="flex items-center justify-between gap-1">
					<span class="text-base-content/70 whitespace-nowrap">
						<TranslatedText key={field.i18n} />
					</span>
					<span class="truncate text-right font-semibold {field.isMono ? 'font-mono' : ''}">
						{field.format
							? field.format(getDisplayValue(server[field.key]))
							: getDisplayValue(server[field.key])}
					</span>
				</div>
			{/if}
		{/each}

		<!-- URL field - conditional rendering -->
		{#if server.url && isFieldVisible('url')}
			<div class="flex items-center justify-between gap-1">
				<span class="text-base-content/70 whitespace-nowrap">
					<TranslatedText key="app.column.url" />:
				</span>
				<a
					href={server.url}
					target="_blank"
					rel="noopener noreferrer"
					class="link link-primary truncate"
					title={server.url}
				>
					{server.url.length > 30 ? server.url.substring(0, 27) + '...' : server.url}
				</a>
			</div>
		{/if}
	</div>

	<!-- Player List Section -->
	{#if server.playerList && server.playerList.length > 0 && isFieldVisible('playerList')}
		<div class="border-base-content/15 mt-3 border-t pt-2">
			<div class="text-base-content/70 mb-2 text-xs">
				<TranslatedText key="app.server.column.playerList" /> ({server.playerList.length})
			</div>
			<div class="flex flex-wrap gap-1">
				{#each server.playerList as player}
					<span class="badge badge-sm badge-soft badge-neutral shrink-0 whitespace-nowrap"
						>{player}</span
					>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Comment -->
	{#if server.comment && isFieldVisible('comment')}
		<div class="border-base-content/15 mt-3 border-t pt-2">
			<div class="text-base-content/70 mb-1 text-xs">
				<TranslatedText key="app.server.column.comment" />
			</div>
			<div class="text-xs break-words whitespace-pre-wrap">{server.comment}</div>
		</div>
	{/if}

	<!-- Footer with timestamp -->
	<div class="border-base-content/15 mt-3 border-t pt-2">
		{#if queryTimestamp}
			<div class="text-muted text-center text-xs">
				<TranslatedText key="app.server.shareCard.queryTime" />: {formatTimestamp(queryTimestamp)}
			</div>
		{/if}
		{#if showWatermark && watermarkText}
			<div class="text-muted mt-1 text-center text-xs">{watermarkText}</div>
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
		background: linear-gradient(135deg, var(--color-base-100), var(--color-base-200));
		font-family:
			-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
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
