<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import TranslatedText from '$lib/components/TranslatedText.svelte';

	interface ServerStats {
		totalServers: number;
		totalPlayers: number;
	}

	interface PlayerStats {
		totalPlayers: number;
		paginatedCount: number; // Current page count to determine if last page
	}

	interface Props {
		currentView: 'servers' | 'players';
		serverTotalStats: ServerStats;
		serverFilteredStats: ServerStats;
		playerTotalStats: PlayerStats;
		playerFilteredStats: PlayerStats;
		searchQuery: string;
	}

	let {
		currentView,
		serverTotalStats,
		serverFilteredStats,
		playerTotalStats,
		playerFilteredStats,
		searchQuery
	}: Props = $props();

	const showFilterIndicator = $derived(
		searchQuery &&
			((currentView === 'servers' &&
				serverFilteredStats.totalServers < serverTotalStats.totalServers) ||
				(currentView === 'players' &&
					playerFilteredStats.totalPlayers < playerTotalStats.totalPlayers))
	);
</script>

<div
	class="stats-container mb-4 flex items-center justify-between px-4 py-4 text-sm md:mb-2 md:py-2"
>
	<div class="flex items-center gap-4">
		{#if currentView === 'servers'}
			<span class="font-medium">
				<span class="stats-number">{serverFilteredStats.totalServers}</span> /
				<span class="stats-number">{serverTotalStats.totalServers}</span> servers
			</span>
			<span class="font-medium">
				<span class="stats-number">{serverFilteredStats.totalPlayers}</span> /
				<span class="stats-number">{serverTotalStats.totalPlayers}</span> players
			</span>
		{:else}
			<span class="font-medium">
				{playerFilteredStats.paginatedCount} / {playerFilteredStats.totalPlayers} players
			</span>
		{/if}
	</div>
	{#if showFilterIndicator}
		<span class="filter-indicator text-base-content/60 text-xs italic">
			{m['app.stats.filteredBy']({ query: searchQuery })}
		</span>
	{/if}
</div>

<style>
	/* Statistics display styling */
	.stats-container {
		background: linear-gradient(135deg, hsl(var(--b1) / 0.5) 0%, hsl(var(--b2) / 0.3) 100%);
		border: 1px solid hsl(var(--bc) / 0.1);
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
		backdrop-filter: blur(8px);
	}

	/* Stats number highlighting */
	.stats-number {
		font-weight: 600;
		color: hsl(var(--bc));
	}

	/* Filter indicator styling */
	.filter-indicator {
		background: hsl(var(--wa) / 0.1);
		border: 1px solid hsl(var(--wa) / 0.2);
		border-radius: 0.25rem;
		padding: 0.25rem 0.5rem;
	}
</style>
