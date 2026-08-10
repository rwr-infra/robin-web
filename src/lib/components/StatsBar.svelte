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

<!--
	Separated from the page by background + elevation, not a border
	(Refactoring UI p.206 — use fewer borders).
	The counts read as one phrase instead of "label: value" (p.41).
-->
<div
	class="stats-container bg-base-100 shadow-e1 text-base-content/70 mb-4 flex items-center justify-between gap-3 rounded px-4 py-3 text-sm md:mb-2 md:py-2"
>
	<!--
		The whole phrase comes from i18n — word order differs per locale, so the
		counts cannot be spliced in as separate emphasized spans. The data stays
		primary by weight and colour on the phrase as a whole (p.41).
	-->
	<div class="flex items-center gap-4">
		{#if currentView === 'servers'}
			<span class="stats-number text-base-content font-semibold">
				{m['app.stats.servers']({
					filtered: serverFilteredStats.totalServers,
					total: serverTotalStats.totalServers
				})}
			</span>
			<span class="stats-number text-base-content font-semibold">
				{m['app.stats.players']({
					filtered: serverFilteredStats.totalPlayers,
					total: serverTotalStats.totalPlayers
				})}
			</span>
		{:else}
			<span class="stats-number text-base-content font-semibold">
				{m['app.stats.players']({
					filtered: playerFilteredStats.paginatedCount,
					total: playerFilteredStats.totalPlayers
				})}
			</span>
		{/if}
	</div>
	{#if showFilterIndicator}
		<span class="filter-indicator badge badge-soft badge-warning badge-sm shrink-0 italic">
			{m['app.stats.filteredBy']({ query: searchQuery })}
		</span>
	{/if}
</div>
