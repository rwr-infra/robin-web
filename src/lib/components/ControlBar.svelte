<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import TranslatedText from '$lib/components/TranslatedText.svelte';
	import SearchInput from '$lib/components/SearchInput.svelte';
	import PlayerDatabaseSelector from '$lib/components/PlayerDatabaseSelector.svelte';
	import ColumnsToggle from '$lib/components/ColumnsToggle.svelte';
	import AutoRefresh from '$lib/components/AutoRefresh.svelte';
	import LayoutModeToggle from '$lib/components/LayoutModeToggle.svelte';
	import type { PlayerDatabase, IPlayerColumn } from '$lib/models/player.model';
	import type { IColumn } from '$lib/models/server.model';
	import analytics from '$lib/utils/analytics';

	interface Props {
		currentView: 'servers' | 'players';
		playerDb: PlayerDatabase;
		searchQuery: string;
		searchPlaceholder: string;
		autoRefreshEnabled: boolean;
		layoutMode: 'fullPage' | 'tableOnly';
		columns: IColumn[];
		playerColumns: IPlayerColumn[];
		visibleColumns: Record<string, boolean>;
		visiblePlayerColumns: Record<string, boolean>;
		isRefreshing?: boolean;
		onPlayerDbChange: (db: PlayerDatabase) => void;
		onRefresh: () => Promise<void>;
		onAutoRefresh: () => Promise<void>;
		onAutoRefreshToggle: (enabled: boolean) => void;
		onLayoutModeChange: (mode: 'fullPage' | 'tableOnly') => void;
		onSearchInput: (value: string) => void;
		onSearchEnter?: (value: string) => void;
		onColumnToggle: (column: IColumn | IPlayerColumn, visible: boolean) => void;
		onSearchRef?: (input: HTMLInputElement | null) => void;
		onSearchClear?: () => void;
	}

	let {
		currentView,
		playerDb,
		searchQuery,
		searchPlaceholder,
		autoRefreshEnabled,
		layoutMode,
		columns,
		playerColumns,
		visibleColumns,
		visiblePlayerColumns,
		isRefreshing = false,
		onPlayerDbChange,
		onRefresh,
		onAutoRefresh,
		onAutoRefreshToggle,
		onLayoutModeChange,
		onSearchInput,
		onSearchEnter,
		onColumnToggle,
		onSearchRef,
		onSearchClear
	}: Props = $props();

	// Auto refresh is only available for servers view
	const showAutoRefresh = $derived(currentView === 'servers');

	// Use appropriate columns based on current view
	const currentColumns = $derived(currentView === 'players' ? playerColumns : columns);
	const currentVisibleColumns = $derived(
		currentView === 'players' ? visiblePlayerColumns : visibleColumns
	);

	// Dynamic search placeholder based on view
	const dynamicPlaceholder = $derived(
		currentView === 'players' ? m['app.search.placeholderPlayers']() : searchPlaceholder
	);

	function handleRefresh() {
		onRefresh();
		analytics.trackRefresh();
	}
</script>

<!--
	Raised by background + elevation instead of a border (p.206). Internal gap
	and padding stay at 12px so the 16px mb-4 below reads as the larger gap (p.83).
-->
<div
	class="bg-base-100 shadow-e1 mb-4 flex flex-col items-stretch gap-3 rounded p-3 sm:flex-row sm:items-center"
>
	<!-- Left side: Player DB selector (only in players view) + Search input -->
	<div class="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
		{#if currentView === 'players'}
			<PlayerDatabaseSelector currentDb={playerDb} onDbChange={onPlayerDbChange} />
		{/if}
		<div class="min-w-48 flex-1">
			<SearchInput
				placeholder={dynamicPlaceholder}
				bind:value={searchQuery}
				oninput={onSearchInput}
				onEnter={onSearchEnter}
				onRef={onSearchRef}
				onClear={onSearchClear}
			/>
		</div>
	</div>

	<div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
		<button
			class="btn-tactical flex w-full min-w-24 items-center justify-center gap-2 px-4 py-2 sm:w-auto"
			disabled={isRefreshing}
			aria-busy={isRefreshing}
			aria-label={isRefreshing ? m['app.button.refreshing']() : m['app.button.refresh']()}
			onclick={handleRefresh}
		>
			{#if isRefreshing}
				<span
					class="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
					aria-hidden="true"
				></span>
			{/if}
			<TranslatedText key="app.button.refresh" />
		</button>

		<div class="hidden md:block">
			<ColumnsToggle
				columns={currentColumns}
				visibleColumns={currentVisibleColumns}
				{onColumnToggle}
			/>
		</div>

		<div class="hidden md:block">
			<LayoutModeToggle {layoutMode} onToggleChange={onLayoutModeChange} />
		</div>

		{#if showAutoRefresh}
			<AutoRefresh
				enabled={autoRefreshEnabled}
				onRefresh={onAutoRefresh}
				onToggleChange={onAutoRefreshToggle}
			/>
		{/if}
	</div>
</div>
